import {apply} from "../lib/index.js";
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { parseStatus } from "../lib/web-host.js";

import {git,repoFor,mount} from "./support/panel-fixture.js";

test("panel status and staged/unstaged diff read actual Git independently", async (t) => {
	const repo = repoFor(t);
	fs.writeFileSync(path.join(repo, "a.txt"), "staged\n" + "keep\n".repeat(10));
	git(repo, "add", "a.txt");
	fs.writeFileSync(
		path.join(repo, "a.txt"),
		"worktree\n" + "keep\n".repeat(10),
	);
	fs.writeFileSync(path.join(repo, "中文 space.txt"), "new <script>\n");
	git(repo, "mv", "a.txt", "renamed.txt");
	const panel = await mount(t, repo);
	const status = await panel.request("status");
	assert.equal(status.status, 200);
	assert.equal(
		status.body.root,
		fs.realpathSync.native(repo).replaceAll("\\", "/"),
	);
	assert.match(status.body.branch, /main/);
	assert.ok(
		status.body.files.some((f) => f.path === "中文 space.txt" && f.untracked),
	);
	const rename = status.body.files.find((f) => f.oldPath === "a.txt");
	assert.ok(rename);
	assert.equal(rename.path, "renamed.txt");
	const staged = await panel.request("diff", {
		path: "renamed.txt",
		side: "staged",
	});
	assert.equal(staged.status, 200);
	assert.match(staged.body.text, /staged/);
	const unstaged = await panel.request("diff", {
		path: "renamed.txt",
		side: "unstaged",
	});
	assert.equal(unstaged.status, 200);
	assert.match(unstaged.body.text, /worktree/);
	const preview = await panel.request("diff", {
		path: "中文 space.txt",
		side: "unstaged",
	});
	assert.equal(preview.body.untracked, true);
	assert.equal(preview.body.text, "new <script>\n");
	assert.ok(
		panel.calls.every(
			(argv) =>
				!["add", "commit", "switch", "checkout", "stash", "reset"].includes(
					argv[argv.indexOf("core.quotePath=false") + 1],
				),
		),
	);
});
test("panel rejects unknown sessions, cwd, parameter arrays, traversal and option refs", async (t) => {
	const panel = await mount(t, repoFor(t));
	const missing = await panel.request("status", {}, "other-host-session");
	assert.equal(missing.status, 404);
	assert.equal(panel.calls.length, 0);
	for (const params of [
		{ cwd: "C:/private" },
		{ root: "/private" },
		{ args: "--output=x" },
	]) {
		assert.equal((await panel.request("status", params)).status, 400);
	}
	for (const filename of [
		"../outside",
		"/absolute",
		"C:/private",
		".git/config",
		"a/../outside",
		"a\\b",
	])
		assert.equal(
			(await panel.request("diff", { path: filename, side: "unstaged" }))
				.status,
			400,
		);
	assert.equal(
		(await panel.request("show", { sha: "--output=escape" })).status,
		400,
	);
	assert.equal((await panel.request("log", { count: "101" })).status, 400);
	assert.equal((await panel.request("log", { skip: "-1" })).status, 400);
	assert.equal((await panel.request("status", {}, "stored")).status, 200);
});
test("literal pathspec, disabled external diff/textconv, binary and size limits", async (t) => {
	const repo = repoFor(t);
	fs.writeFileSync(path.join(repo, "a.txt"), "changed\n");
	const sentinel = path.join(repo, "SHOULD_NOT_EXIST");
	git(repo, "config", "diff.external", `echo bad > ${sentinel}`);
	git(repo, "config", "diff.evil.textconv", `echo bad > ${sentinel}`);
	fs.writeFileSync(path.join(repo, ".gitattributes"), "*.txt diff=evil\n");
	if (process.platform !== "win32")
		fs.writeFileSync(path.join(repo, ":(glob)*"), "literal\n");
	fs.writeFileSync(path.join(repo, "binary.bin"), Buffer.from([0, 1, 2]));
	fs.writeFileSync(path.join(repo, "large.txt"), "z".repeat(500));
	const panel = await mount(t, repo, { maxBytes: 180 });
	assert.equal(
		(await panel.request("diff", { path: "a.txt", side: "unstaged" })).status,
		200,
	);
	assert.equal(fs.existsSync(sentinel), false);
	const literal = await panel.request("diff", {
		path: ":(glob)*",
		side: "unstaged",
	});
	assert.equal(
		literal.body.text,
		process.platform === "win32" ? "" : "literal\n",
	);
	const binary = await panel.request("diff", {
		path: "binary.bin",
		side: "unstaged",
	});
	assert.equal(binary.body.binary, true);
	const large = await panel.request("diff", {
		path: "large.txt",
		side: "unstaged",
	});
	assert.equal(large.body.truncated, true);
});
test("history pagination and commit detail come from Git objects; empty and detached repositories", async (t) => {
	const repo = repoFor(t);
	const sha = git(repo, "rev-parse", "HEAD").trim();
	const panel = await mount(t, repo);
	const history = await panel.request("log", { count: "1" });
	assert.equal(history.body.entries[0].sha, sha);
	assert.equal(history.body.hasMore, false);
	const show = await panel.request("show", { sha });
	assert.match(show.body.text, /Initial/);
	assert.match(show.body.text, /first/);
	git(repo, "checkout", "--detach", sha);
	assert.match((await panel.request("status")).body.branch, /HEAD/);
	const empty = await mount(t, repoFor(t, true));
	assert.equal((await empty.request("status")).body.head, null);
	assert.deepEqual((await empty.request("log")).body.entries, []);
});
test("NUL status handles embedded newlines, conflicts, rename order and submodules", () => {
	const parsed = parseStatus(
		"## main\0MM line\nbreak.txt\0R  new.txt\0old.txt\0UU conflict.txt\0 M module\0",
	);
	assert.equal(parsed.files[0].path, "line\nbreak.txt");
	assert.equal(parsed.files[1].oldPath, "old.txt");
	assert.equal(parsed.files[2].conflict, true);
	assert.equal(parsed.files[3].worktree, "M");
});
test("disable clears routes and the original plugin still supports headless", async (t) => {
	const panel = await mount(t, repoFor(t));
	assert.equal(panel.routes.size, 7);
	await panel.dispose();
	assert.equal(panel.routes.size, 0);
	const commands = [];
	await apply(
		{
			commands: { register: (c) => commands.push(c) },
			tools: { register() {} },
			systemPrompt: { section() {} },
			subprocess: {
				spawn() {
					throw Error("not run");
				},
			},
		},
		{},
	);
	assert.equal(commands.length, 5);
});
test("status output cap refuses an incomplete file list instead of reporting clean", async (t) => {
	const repo = repoFor(t);
	for (let i = 0; i < 20; i++)
		fs.writeFileSync(path.join(repo, `file-${i}.txt`), "x");
	const panel = await mount(t, repo, { maxBytes: 90 });
	const response = await panel.request("status");
	assert.equal(response.status, 413);
	assert.equal(response.body.error.code, "truncated");
});

test("panel lifetime and timeout cancel an in-flight subprocess request", async (t) => {
	for (const kind of ["disable", "timeout"])
		await t.test(kind, async (t) => {
			const panel = await mount(t, repoFor(t), { timeoutMs: 50, graceMs: 10 });
			let childSignal;
			panel.ctx.subprocess.spawn = ({ signal }) => {
				childSignal = signal;
				return {
					done: new Promise((resolve) =>
						signal.addEventListener(
							"abort",
							() => resolve({ signal: "SIGTERM", exitCode: null }),
							{ once: true },
						),
					),
					collected: {
						stdout: { readFrom: () => ({ text: "", lossy: false }) },
						stderr: { readFrom: () => ({ text: "", lossy: false }) },
					},
					terminate() {},
					waitForExit: async () => true,
				};
			};
			const request = panel.request("status");
			await Promise.resolve();
			if (kind === "disable") await panel.dispose();
			const result = await request;
			assert.equal(result.status, kind === "disable" ? 499 : 504);
			assert.equal(childSignal.aborted, true);
		});
});

test("panel discovers exactly one child repository from its session cwd", async (t) => {
	const parent = fs.mkdtempSync(path.join(os.tmpdir(), "dsh-panel-parent-"));
	t.after(() => fs.rmSync(parent, { recursive: true, force: true }));
	const repo = repoFor(t);
	const child = path.join(parent, "project");
	fs.renameSync(repo, child);
	const panel = await mount(t, parent);
	const status = await panel.request("status");
	assert.equal(status.status, 200);
	assert.equal(
		status.body.root,
		fs.realpathSync.native(child).replaceAll("\\", "/"),
	);
});
