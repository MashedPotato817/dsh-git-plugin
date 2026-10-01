import { isAbsolute, relative, resolve } from "node:path";
class PanelError extends Error {
    code;
    status;
    constructor(code, message, status = 400) {
        super(message);
        this.code = code;
        this.status = status;
    }
}
const common = [
    "--no-optional-locks",
    "--literal-pathspecs",
    "-c",
    "color.ui=false",
    "-c",
    "core.fsmonitor=false",
    "-c",
    "core.quotePath=false",
];
/** Porcelain -z puts the destination first, then the rename/copy source. */
export function parseStatus(text) {
    const parts = text.split("\0");
    const header = parts.shift() ?? "";
    const files = [];
    for (let i = 0; i < parts.length; i++) {
        const row = parts[i];
        if (!row)
            continue;
        if (row.length < 4)
            throw new PanelError("truncated", "状态输出不完整，请缩小仓库或提高输出限制。", 413);
        const index = row[0], worktree = row[1];
        const file = {
            path: row.slice(3),
            index,
            worktree,
            untracked: index === "?",
            conflict: ["DD", "AU", "UD", "UA", "DU", "AA", "UU"].includes(row.slice(0, 2)),
        };
        if (/[RC]/.test(index + worktree)) {
            const old = parts[++i];
            if (!old)
                throw new PanelError("truncated", "重命名状态不完整。", 413);
            file.oldPath = old;
        }
        files.push(file);
    }
    return { branch: header.replace(/^## /, ""), files };
}
function bounded(query, key, fallback, max) {
    const raw = query.get(key);
    if (raw === null)
        return fallback;
    if (!/^\d+$/.test(raw) ||
        !Number.isSafeInteger(Number(raw)) ||
        Number(raw) > max)
        throw new PanelError("bad-request", `${key} 超出范围。`);
    return Number(raw);
}
function validPath(value) {
    if (!value ||
        value.length > 4096 ||
        value.includes("\0") ||
        value.includes("\\") ||
        isAbsolute(value) ||
        /^[A-Za-z]:/.test(value) ||
        value
            .split("/")
            .some((p) => p === ".." || p === "." || p === "" || p.toLowerCase() === ".git"))
        throw new PanelError("bad-path", "请选择仓库内的文件。");
    return value;
}
/** Routes live only while all optional Web capabilities are present. */
export function registerWebPanel(ctx, caps, run) {
    const lifetime = new AbortController();
    const pending = new Set();
    ctx.effect(() => async () => {
        lifetime.abort();
        await Promise.allSettled(pending);
    });
    const json = (value, status = 200) => Response.json(value, { status, headers: { "cache-control": "no-store" } });
    for (const route of ["status", "diff", "log", "show"]) {
        ctx.connection.fetch.register({
            path: `/api/git-panel/${route}`,
            methods: ["GET"],
            requestBody: "buffered",
            fetch: (request) => {
                const signal = AbortSignal.any([request.signal, lifetime.signal]);
                const task = (async () => {
                    try {
                        const query = new URL(request.url).searchParams;
                        const allowed = new Set([
                            "sessionId",
                            ...(route === "diff"
                                ? ["path", "side"]
                                : route === "log"
                                    ? ["count", "skip"]
                                    : route === "show"
                                        ? ["sha"]
                                        : []),
                        ]);
                        for (const key of query.keys())
                            if (!allowed.has(key) || query.getAll(key).length !== 1)
                                throw new PanelError("bad-request", "请求参数无效。");
                        const sessionId = query.get("sessionId");
                        if (!sessionId || sessionId.length > 200)
                            throw new PanelError("bad-request", "缺少有效会话。");
                        const id = sessionId;
                        const header = ctx.sessions.get(id)?.header ??
                            (await ctx.sessionPersistence.stat(id))?.header;
                        if (!header?.cwd)
                            throw new PanelError("session-not-found", "当前宿主不存在该会话。", 404);
                        const cwd = header.cwd;
                        const git = async (args, allowDiff = false) => {
                            const result = await run(ctx, ["git", ...common, ...args], {
                                cwd,
                                signal,
                                caps,
                                ...(allowDiff ? { acceptedExitCodes: [0, 1] } : {}),
                            });
                            if (!result.ok)
                                throw new PanelError(result.aborted
                                    ? "cancelled"
                                    : result.timedOut
                                        ? "timeout"
                                        : /failed to start|ENOENT/.test(result.text)
                                            ? "git-unavailable"
                                            : "git-failed", result.text, result.aborted ? 499 : result.timedOut ? 504 : 409);
                            return {
                                text: result.rawText ?? result.text,
                                truncated: result.truncated ?? false,
                            };
                        };
                        const probe = await git(["rev-parse", "--show-toplevel"]);
                        if (probe.truncated)
                            throw new PanelError("truncated", "仓库路径输出不完整。", 413);
                        const root = probe.text.trim();
                        const rootTarget = await ctx.fs.resolve(root, { signal });
                        if ((await ctx.fs.stat(rootTarget, signal))?.type !== "directory" ||
                            resolve(ctx.fs.processPath(rootTarget)) !== resolve(root))
                            throw new PanelError("unavailable", "仓库未映射到当前执行环境。", 409);
                        // Run at the canonical repository root, even when a Session starts in a subdirectory.
                        const at = async (args) => {
                            const result = await run(ctx, ["git", ...common, ...args], {
                                cwd: root,
                                signal,
                                caps,
                            });
                            if (!result.ok)
                                throw new PanelError(result.aborted
                                    ? "cancelled"
                                    : result.timedOut
                                        ? "timeout"
                                        : "git-failed", result.text, result.aborted ? 499 : result.timedOut ? 504 : 409);
                            return {
                                text: result.rawText ?? result.text,
                                truncated: result.truncated ?? false,
                            };
                        };
                        const headResult = await at([
                            "rev-parse",
                            "--verify",
                            "--quiet",
                            "HEAD",
                        ]).catch((error) => {
                            if (error instanceof PanelError && error.code === "git-failed")
                                return undefined;
                            throw error;
                        });
                        const head = headResult?.text.trim() ?? null;
                        if (route === "status") {
                            const result = await at([
                                "status",
                                "--porcelain=v1",
                                "-z",
                                "--branch",
                                "-uall",
                            ]);
                            if (result.truncated)
                                throw new PanelError("truncated", "状态列表超出输出限制，未将部分列表当作完整状态。", 413);
                            const parsed = parseStatus(result.text);
                            return json({
                                root,
                                head,
                                ...parsed,
                                truncated: false,
                            });
                        }
                        if (route === "diff") {
                            const path = validPath(query.get("path"));
                            const side = query.get("side");
                            if (side !== "staged" && side !== "unstaged")
                                throw new PanelError("bad-request", "diff 侧必须为 staged 或 unstaged。");
                            const absolute = resolve(root, path);
                            if (relative(root, absolute).startsWith(".."))
                                throw new PanelError("bad-path", "路径超出仓库。");
                            const status = await at([
                                "status",
                                "--porcelain=v1",
                                "-z",
                                "-uall",
                                "--",
                                path,
                            ]);
                            if (status.truncated)
                                throw new PanelError("truncated", "文件状态不完整。", 413);
                            const untracked = status.text.startsWith("?? ");
                            let text, truncated;
                            if (untracked) {
                                if (side === "staged")
                                    throw new PanelError("bad-request", "未跟踪文件没有暂存 diff。");
                                const entry = await ctx.fs.lstat(absolute, {}, signal);
                                if (entry?.type !== "file")
                                    throw new PanelError("not-file", "未跟踪路径不是可预览的普通文件。", 409);
                                const target = await ctx.fs.resolve(absolute, { signal });
                                if (!ctx.fs.contains(rootTarget, target))
                                    throw new PanelError("bad-path", "文件不在仓库中。");
                                const info = await ctx.fs.stat(target, signal);
                                if (info?.size !== undefined && info.size > caps.maxBytes)
                                    return json({
                                        path,
                                        side,
                                        text: "未跟踪文件超过预览上限。",
                                        binary: false,
                                        truncated: true,
                                        untracked,
                                    });
                                const bytes = await ctx.fs.readBytes(target, signal, caps.maxBytes);
                                const binary = bytes.includes(0);
                                text = binary
                                    ? "二进制未跟踪文件。"
                                    : new TextDecoder("utf-8", { fatal: true }).decode(bytes);
                                truncated = false;
                                return json({
                                    path,
                                    side,
                                    text,
                                    binary,
                                    truncated,
                                    untracked,
                                });
                            }
                            ({ text, truncated } = await at([
                                "diff",
                                ...(side === "staged" ? ["--cached"] : []),
                                "--no-ext-diff",
                                "--no-textconv",
                                "--no-color",
                                "--submodule=short",
                                "-U3",
                                "--",
                                path,
                            ]));
                            return json({
                                path,
                                side,
                                text,
                                truncated,
                                binary: /^Binary files |^GIT binary patch/m.test(text),
                                untracked,
                            });
                        }
                        if (route === "log") {
                            const count = bounded(query, "count", 30, 100);
                            if (count < 1)
                                throw new PanelError("bad-request", "count 必须大于 0。");
                            const skip = bounded(query, "skip", 0, 10000);
                            if (!head)
                                return json({
                                    entries: [],
                                    skip,
                                    hasMore: false,
                                    truncated: false,
                                });
                            const result = await at([
                                "log",
                                `-n${count + 1}`,
                                `--skip=${skip}`,
                                "--format=%H%x00%h%x00%an%x00%aI%x00%s",
                                "-z",
                            ]);
                            const parts = result.text.split("\0");
                            const entries = [];
                            for (let i = 0; i + 4 < parts.length; i += 5) {
                                const sha = parts[i];
                                if (!/^[a-f0-9]{40,64}$/.test(sha))
                                    break;
                                entries.push({
                                    sha,
                                    short: parts[i + 1],
                                    author: parts[i + 2],
                                    date: parts[i + 3],
                                    subject: parts[i + 4],
                                });
                            }
                            return json({
                                entries: entries.slice(0, count),
                                skip,
                                hasMore: entries.length > count,
                                truncated: result.truncated,
                            });
                        }
                        const sha = query.get("sha");
                        if (!sha || !/^[a-f0-9]{40,64}$/.test(sha))
                            throw new PanelError("bad-ref", "提交必须为完整 SHA。");
                        await at([
                            "rev-parse",
                            "--verify",
                            "--end-of-options",
                            `${sha}^{commit}`,
                        ]);
                        const result = await at([
                            "show",
                            "--no-ext-diff",
                            "--no-textconv",
                            "--no-color",
                            "--format=fuller",
                            "--stat",
                            "--patch",
                            "--end-of-options",
                            sha,
                            "--",
                        ]);
                        return json({ sha, ...result });
                    }
                    catch (error) {
                        if (signal.aborted)
                            return json({ error: { code: "cancelled", message: "请求已取消。" } }, 499);
                        if (error instanceof PanelError)
                            return json({ error: { code: error.code, message: error.message } }, error.status);
                        return json({
                            error: {
                                code: "unavailable",
                                message: error instanceof Error
                                    ? error.message
                                    : "Git 面板暂不可用。",
                            },
                        }, 409);
                    }
                })();
                pending.add(task);
                void task.then(() => pending.delete(task), () => pending.delete(task));
                return task;
            },
        });
    }
}
