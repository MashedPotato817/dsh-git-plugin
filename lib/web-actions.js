import { createHash, randomBytes } from "node:crypto";
import { isAbsolute, resolve } from "node:path";
import { parseStatus } from "./web-host.js";
class ActionError extends Error {
    code;
    status;
    constructor(code, message, status = 409) {
        super(message);
        this.code = code;
        this.status = status;
    }
}
const base = [
    "--no-optional-locks",
    "--literal-pathspecs",
    "-c",
    "color.ui=false",
    "-c",
    "core.fsmonitor=false",
    "-c",
    "core.quotePath=false",
];
const actionNames = [
    "stage",
    "unstage",
    "commit",
    "branch-create",
    "branch-switch",
    "stash-save",
    "stash-apply",
    "stash-drop",
    "restore",
];
function fail(code, message, status = 409) {
    throw new ActionError(code, message, status);
}
function filePath(value) {
    if (typeof value !== "string" ||
        !value ||
        value.length > 4096 ||
        value.includes("\0") ||
        value.includes("\\") ||
        isAbsolute(value) ||
        /^[a-z]:/i.test(value) ||
        value
            .split("/")
            .some((s) => !s || s === "." || s === ".." || s.toLowerCase() === ".git"))
        return fail("bad-path", "请选择仓库内的文件。", 400);
    return value;
}
function exact(value, allowed) {
    if (Object.keys(value).some((k) => !allowed.includes(k)))
        fail("bad-request", "请求包含未知字段。", 400);
}
function validate(value) {
    const sessionId = value.sessionId, action = value.action;
    if (typeof sessionId !== "string" ||
        !sessionId ||
        sessionId.length > 200 ||
        typeof action !== "string" ||
        !actionNames.includes(action))
        return fail("bad-request", "操作或会话无效。", 400);
    const input = {
        sessionId,
        action: action,
    };
    if (["stage", "unstage", "restore"].includes(action)) {
        exact(value, ["sessionId", "action", "paths"]);
        if (!Array.isArray(value.paths) ||
            !value.paths.length ||
            value.paths.length > 200)
            fail("bad-request", "请选择 1–200 个文件。", 400);
        input.paths = [...new Set(value.paths.map(filePath))];
    }
    else if (["commit", "stash-save"].includes(action)) {
        exact(value, ["sessionId", "action", "message"]);
        if (typeof value.message !== "string" ||
            !value.message.trim() ||
            Buffer.byteLength(value.message) > 4096 ||
            value.message.includes("\0"))
            fail("bad-request", "请输入有效说明（最多 4096 字节）。", 400);
        input.message = value.message.trim();
    }
    else if (["branch-create", "branch-switch"].includes(action)) {
        exact(value, ["sessionId", "action", "branch"]);
        if (typeof value.branch !== "string" ||
            !value.branch ||
            value.branch.length > 200 ||
            value.branch.startsWith("-") ||
            value.branch.includes("\0") ||
            value.branch === "HEAD")
            fail("bad-request", "分支名称无效。", 400);
        input.branch = value.branch;
    }
    else {
        exact(value, ["sessionId", "action", "sha"]);
        if (typeof value.sha !== "string" ||
            !/^([a-f0-9]{40}|[a-f0-9]{64})$/.test(value.sha))
            fail("bad-request", "请选择有效 stash。", 400);
        input.sha = value.sha;
    }
    return input;
}
async function bodyOf(request) {
    if (request.headers.get("origin") !== new URL(request.url).origin)
        fail("foreign-origin", "写操作必须来自当前 DSH 页面。", 403);
    if (!request.headers
        .get("content-type")
        ?.toLowerCase()
        .startsWith("application/json"))
        fail("bad-request", "需要 JSON 请求。", 400);
    const data = await request.arrayBuffer();
    if (data.byteLength > 65536)
        fail("too-large", "请求过大。", 413);
    let parsed;
    try {
        parsed = JSON.parse(new TextDecoder().decode(data));
    }
    catch {
        return fail("bad-request", "JSON 无效。", 400);
    }
    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object")
        return fail("bad-request", "JSON 对象无效。", 400);
    return parsed;
}
async function lists(git) {
    const branches = (await git([
        "for-each-ref",
        "--format=%(refname:short)%00%(objectname)%00%(HEAD)",
        "refs/heads",
    ]))
        .trimEnd()
        .split("\n")
        .filter(Boolean)
        .map((row) => {
        const [name, sha, current] = row.split("\0");
        return { name: name, sha: sha, current: current === "*" };
    });
    const stashes = (await git(["stash", "list", "--format=%H%x00%gd%x00%gs"]))
        .trimEnd()
        .split("\n")
        .filter(Boolean)
        .map((row) => {
        const [sha, ref, ...message] = row.split("\0");
        return { sha: sha, ref: ref, message: message.join("\0") };
    });
    return { branches, stashes };
}
/** Authenticated operator writes; separate from model tool approval and never opens an artificial turn. */
export function registerWebActions(ctx, caps, run, resolveRoot) {
    const lifetime = new AbortController(), pending = new Set(), tokens = new Map(), locks = new Set();
    ctx.effect(() => async () => {
        lifetime.abort();
        tokens.clear();
        await Promise.allSettled(pending);
    });
    async function repository(id, signal) {
        const sid = id;
        const header = ctx.sessions.get(sid)?.header ??
            (await ctx.sessionPersistence.stat(sid))?.header;
        if (!header?.cwd)
            fail("session-not-found", "当前宿主不存在该会话。", 404);
        const found = await resolveRoot(ctx, header.cwd, signal, caps);
        if (!found.ok)
            fail(found.aborted
                ? "cancelled"
                : found.timedOut
                    ? "timeout"
                    : "repository-unavailable", found.text, found.aborted ? 499 : found.timedOut ? 504 : 409);
        let root = found.root;
        const git = async (args, allowMissing = false) => {
            // stash internally cleans untracked files; Git 2.53 inherits literal pathspecs into that cleanup.
            // Stash routes accept only fixed options and validated object IDs, never pathspecs.
            const flags = args[0] === "stash"
                ? base.filter((flag) => flag !== "--literal-pathspecs")
                : base;
            const result = await run(ctx, ["git", ...flags, ...args], {
                cwd: root,
                signal,
                caps,
                ...(allowMissing ? { acceptedExitCodes: [0, 1] } : {}),
            });
            if (!result.ok)
                fail(result.aborted
                    ? "cancelled"
                    : result.timedOut
                        ? "timeout"
                        : "git-failed", result.text, result.aborted ? 499 : result.timedOut ? 504 : 409);
            if (result.truncated)
                fail("truncated", "Git 输出超限，无法安全确认；请调整 maxBytes 后重试。", 413);
            return result.rawText ?? result.text;
        };
        root = (await git(["rev-parse", "--show-toplevel"])).trim();
        const target = await ctx.fs.resolve(root, { signal });
        if ((await ctx.fs.stat(target, signal))?.type !== "directory" ||
            resolve(ctx.fs.processPath(target)) !== resolve(root))
            fail("repository-unavailable", "仓库未映射到当前执行环境。");
        return { root, git };
    }
    async function safeParents(root, name, signal) {
        const parts = name.split("/");
        for (let i = 1; i < parts.length; i++) {
            const p = resolve(root, ...parts.slice(0, i)), info = await ctx.fs.lstat(p, {}, signal);
            if (info?.type === "symlink")
                fail("bad-path", "文件的父目录是符号链接，不能在面板中操作。", 400);
        }
    }
    async function snapshot(root, git, input, signal) {
        const status = await git([
            "status",
            "--porcelain=v1",
            "-z",
            "--branch",
            "-uall",
        ]);
        const files = parseStatus(status).files;
        for (const name of input.paths ?? [])
            await safeParents(root, name, signal);
        const head = (await git(["rev-parse", "--verify", "--quiet", "HEAD"], true)).trim() ||
            null;
        const branch = (await git(["symbolic-ref", "--quiet", "--short", "HEAD"], true)).trim() || "(detached HEAD)";
        const index = await git([
            "diff",
            "--cached",
            "--binary",
            "--no-ext-diff",
            "--no-textconv",
        ]);
        const worktree = await git([
            "diff",
            "--binary",
            "--no-ext-diff",
            "--no-textconv",
        ]);
        const operations = await lists(git);
        const hash = createHash("sha256").update(JSON.stringify({
            root,
            status,
            head,
            branch,
            index,
            worktree,
            operations,
        }));
        const relevant = files.filter((f) => f.untracked &&
            (input.action === "stash-save" || input.paths?.includes(f.path)));
        let remaining = caps.maxBytes;
        for (const f of relevant) {
            await safeParents(root, f.path, signal);
            const path = resolve(root, f.path), info = await ctx.fs.lstat(path, {}, signal);
            if (info?.type !== "file")
                fail("bad-path", "未跟踪文件须为普通文件；符号链接请使用 Git 命令操作。", 400);
            const target = await ctx.fs.resolve(path, { signal });
            const rootTarget = await ctx.fs.resolve(root, { signal });
            if (!ctx.fs.contains(rootTarget, target))
                fail("bad-path", "文件不在仓库内。", 400);
            const bytes = await ctx.fs.readBytes(target, signal, remaining);
            remaining -= bytes.byteLength;
            hash.update(f.path).update(bytes);
        }
        return {
            hash: hash.digest("hex"),
            status,
            files,
            head,
            branch,
            index,
            worktree,
            operations,
        };
    }
    async function check(input, state, git) {
        if (input.paths) {
            for (const name of input.paths) {
                const f = state.files.find((f) => f.path === name);
                if (!f)
                    fail("changed", "选定文件已变化，请刷新后重新预览。");
                if (input.action === "unstage" && (f.untracked || f.index === " "))
                    fail("bad-request", "该文件没有暂存内容。", 400);
                if (input.action === "restore" &&
                    (f.untracked || f.conflict || f.worktree === " "))
                    fail("bad-request", "只能还原已跟踪、未冲突的工作区改动。", 400);
            }
        }
        if (input.action === "commit") {
            if (state.files.some((f) => f.conflict))
                fail("conflict", "请先编辑并暂存解决冲突。");
            if (!state.index.trim())
                fail("empty-index", "没有已暂存的改动。");
        }
        if (input.branch) {
            await git(["check-ref-format", "--branch", input.branch]);
            const exists = state.operations.branches.some((b) => b.name === input.branch);
            if (input.action === "branch-create" && exists)
                fail("branch-exists", "分支已存在。");
            if (input.action === "branch-switch" && !exists)
                fail("branch-not-found", "分支已变化，请刷新。");
            if (input.action === "branch-switch" && state.files.length)
                fail("dirty", "切换分支前请提交或 stash 当前改动。");
        }
        if (input.action === "stash-save") {
            if (!state.head)
                fail("no-head", "首次提交后才可使用 stash。");
            if (!state.files.length)
                fail("clean", "工作区干净，无需保存 stash。");
            if (state.files.some((f) => f.conflict))
                fail("conflict", "请先解决冲突。");
        }
        if (input.sha && !state.operations.stashes.some((s) => s.sha === input.sha))
            fail("stash-not-found", "stash 已变化，请刷新。");
    }
    function presentation(input, state, root, token, expires) {
        const descriptions = {
            stage: "将选定文件的当前内容加入暂存区。",
            unstage: "取消选定文件的暂存，工作区内容保留。",
            commit: "仅提交当前暂存区；未暂存和未跟踪内容不会自动加入。配置的 preCommit 与 Git 原生钩子仍会执行。",
            "branch-create": "创建并切换到新分支，保留当前改动。",
            "branch-switch": "切换到选定本地分支；不使用强制覆盖。",
            "stash-save": "保存已跟踪和未跟踪改动到 stash；子模块内部改动需要分别处理。",
            "stash-apply": "应用 stash 并恢复暂存状态，保留原 stash；冲突时请在文件中解决。",
            "stash-drop": "删除该 stash；此操作不可通过面板直接撤销。",
            restore: "先把所有已跟踪改动备份到保留的 stash，再将选定文件工作区还原为暂存区内容；未跟踪文件保留。",
        };
        return {
            token,
            expiresAt: new Date(expires).toISOString(),
            root,
            branch: state.branch,
            input,
            description: descriptions[input.action],
            preview: input.action === "commit"
                ? state.index
                : [state.index, state.worktree].filter(Boolean).join("\n"),
            paths: input.paths ??
                state.files
                    .filter((f) => input.action !== "commit" || (!f.untracked && f.index !== " "))
                    .map((f) => f.path),
            destructive: input.action === "stash-drop" || input.action === "restore",
        };
    }
    async function mutation(input, state, git, root, signal) {
        const paths = input.paths?.flatMap((p) => {
            const f = state.files.find((f) => f.path === p);
            return f?.oldPath ? [p, f.oldPath] : [p];
        }) ?? [];
        let text = "";
        switch (input.action) {
            case "stage":
                text = await git(["add", "-A", "--", ...paths]);
                break;
            case "unstage":
                text = await git(state.head
                    ? ["restore", "--staged", "--", ...paths]
                    : ["rm", "--cached", "-f", "--", ...paths]);
                break;
            case "commit": {
                if (caps.preCommit.length) {
                    const hook = await run(ctx, caps.preCommit, {
                        cwd: root,
                        signal,
                        caps,
                    });
                    if (!hook.ok)
                        fail("pre-commit-failed", hook.text);
                    const after = await snapshot(root, git, input, signal);
                    if (after.hash !== state.hash)
                        fail("changed", "preCommit 改变了预览范围，请重新预览。");
                }
                text = await git(["commit", "-m", input.message]);
                break;
            }
            case "branch-create":
                text = await git(["switch", "-c", input.branch]);
                break;
            case "branch-switch":
                text = await git(["switch", input.branch]);
                break;
            case "stash-save":
                text = await git([
                    "stash",
                    "push",
                    "--include-untracked",
                    "-m",
                    input.message,
                ]);
                break;
            case "stash-apply":
                text = await git(["stash", "apply", "--index", input.sha]);
                break;
            case "stash-drop": {
                const stash = state.operations.stashes.find((s) => s.sha === input.sha);
                text = await git(["stash", "drop", stash.ref]);
                break;
            }
            case "restore": {
                const backup = (await git(["stash", "create"])).trim();
                if (!backup)
                    fail("backup-failed", "无法建立还原备份，未执行还原。");
                await git([
                    "stash",
                    "store",
                    "-m",
                    "dsh-git-panel restore backup",
                    backup,
                ]);
                text = await git(["restore", "--worktree", "--", ...input.paths]);
                return {
                    ok: true,
                    message: text || "已还原工作区；备份保留在 stash。",
                    backup,
                };
            }
        }
        return {
            ok: true,
            message: text.trim() || "操作完成，请刷新查看当前 Git 状态。",
        };
    }
    for (const route of ["operations", "prepare", "execute"]) {
        ctx.connection.fetch.register({
            path: `/api/git-panel/${route}`,
            methods: [route === "operations" ? "GET" : "POST"],
            requestBody: "buffered",
            fetch: (request) => {
                const signal = AbortSignal.any([request.signal, lifetime.signal]);
                const task = (async () => {
                    let locked;
                    try {
                        if (lifetime.signal.aborted)
                            fail("cancelled", "插件已停用。", 499);
                        if (request.method !== (route === "operations" ? "GET" : "POST"))
                            fail("bad-method", "请求方法无效。", 405);
                        const query = new URL(request.url).searchParams;
                        if (route === "operations") {
                            if ([...query.keys()].some((k) => k !== "sessionId") ||
                                query.getAll("sessionId").length !== 1)
                                fail("bad-request", "请求参数无效。", 400);
                            const id = query.get("sessionId");
                            if (!id || id.length > 200)
                                fail("bad-request", "会话无效。", 400);
                            const { git } = await repository(id, signal);
                            return Response.json(await lists(git), {
                                headers: { "cache-control": "no-store" },
                            });
                        }
                        if (query.size)
                            fail("bad-request", "写操作不接受 URL 参数。", 400);
                        const data = await bodyOf(request);
                        if (route === "prepare") {
                            const input = validate(data), { root, git } = await repository(input.sessionId, signal);
                            if (locks.has(root))
                                fail("busy", "该仓库已有操作正在执行。");
                            const state = await snapshot(root, git, input, signal);
                            await check(input, state, git);
                            const now = Date.now();
                            for (const [token, c] of tokens)
                                if (c.expires <= now)
                                    tokens.delete(token);
                            if (tokens.size >= 128)
                                fail("busy", "待确认操作过多，请稍后重试。", 429);
                            const token = randomBytes(32).toString("base64url"), expires = now + 120000;
                            tokens.set(token, { input, root, hash: state.hash, expires });
                            return Response.json(presentation(input, state, root, token, expires), { headers: { "cache-control": "no-store" } });
                        }
                        exact(data, ["sessionId", "token", "confirm"]);
                        if (data.confirm !== true)
                            fail("confirmation-required", "请明确确认预览后再执行。", 400);
                        const token = typeof data.token === "string" ? data.token : "", c = tokens.get(token);
                        tokens.delete(token);
                        if (!c ||
                            c.expires <= Date.now() ||
                            c.input.sessionId !== data.sessionId)
                            fail("confirmation-expired", "确认已失效，请重新预览。");
                        const { root, git } = await repository(c.input.sessionId, signal);
                        if (root !== c.root)
                            fail("changed", "会话仓库已变化，请重新预览。");
                        if (locks.has(root))
                            fail("busy", "该仓库已有操作正在执行。");
                        locks.add(root);
                        locked = root;
                        const state = await snapshot(root, git, c.input, signal);
                        if (state.hash !== c.hash)
                            fail("changed", "仓库内容、暂存区或分支已变化，请重新预览。");
                        await check(c.input, state, git);
                        signal.throwIfAborted();
                        return Response.json(await mutation(c.input, state, git, root, signal), { headers: { "cache-control": "no-store" } });
                    }
                    catch (error) {
                        const e = error instanceof ActionError
                            ? error
                            : new ActionError(signal.aborted ? "cancelled" : "unavailable", error instanceof Error ? error.message : "操作失败。", signal.aborted ? 499 : 409);
                        return Response.json({ error: { code: e.code, message: e.message } }, { status: e.status, headers: { "cache-control": "no-store" } });
                    }
                    finally {
                        if (locked)
                            locks.delete(locked);
                    }
                })();
                pending.add(task);
                void task.then(() => pending.delete(task), () => pending.delete(task));
                return task;
            },
        });
    }
}
