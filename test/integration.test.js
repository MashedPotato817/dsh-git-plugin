import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { apply } from "../lib/index.js";

/**
 * Run one command synchronously, capturing stdout/stderr through FILE
 * descriptors instead of pipes. The DSH sandbox blocks named-pipe capture
 * (EPERM), but file-descriptor redirection is unaffected, so this works both
 * locally under the sandbox and in CI.
 */
function runSync(argv, cwd) {
	const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "dsh-git-sync-"));
	const outFile = path.join(tmp, "out.txt");
	const errFile = path.join(tmp, "err.txt");
	const ofd = fs.openSync(outFile, "w");
	const efd = fs.openSync(errFile, "w");
	const result = spawnSync(argv[0], argv.slice(1), { cwd, stdio: ["ignore", ofd, efd] });
	fs.closeSync(ofd);
	fs.closeSync(efd);
	const stdout = fs.readFileSync(outFile, "utf8");
	const stderr = fs.readFileSync(errFile, "utf8");
	fs.rmSync(tmp, { recursive: true, force: true });
	return { status: result.status, signal: result.signal, stdout, stderr };
}

/** The DSH subprocess-seam contract, backed by the file-redirect runSync. */
function makeSpawn() {
	return ({ argv, cwd }) => {
		const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "dsh-git-spawn-"));
		const outFile = path.join(tmp, "out.txt");
		const errFile = path.join(tmp, "err.txt");
		const ofd = fs.openSync(outFile, "w");
		const efd = fs.openSync(errFile, "w");
		const result = spawnSync(argv[0], argv.slice(1), { cwd, stdio: ["ignore", ofd, efd] });
		fs.closeSync(ofd);
		fs.closeSync(efd);
		const stdout = fs.readFileSync(outFile, "utf8");
		const stderr = fs.readFileSync(errFile, "utf8");
		fs.rmSync(tmp, { recursive: true, force: true });
		return {
			done: Promise.resolve({ signal: result.signal, exitCode: result.status }),
			collected: {
				stdout: { readFrom: () => ({ text: stdout, lossy: false }) },
				stderr: { readFrom: () => ({ text: stderr, lossy: false }) }
			}
		};
	};
}

function agentFor(cwd) {
	return { session: { header: { cwd } } };
}

function signal() {
	return new AbortController().signal;
}

async function mount(cwd, config = {}) {
	const registered = { commands: [], tools: [] };
	const ctx = {
		commands: { register: (definition) => registered.commands.push(definition) },
		tools: { register: (definition) => registered.tools.push(definition) },
		systemPrompt: { section: () => {} },
		subprocess: { spawn: makeSpawn() }
	};
	await apply(ctx, config);
	return registered;
}

function makeRepo() {
	const repo = fs.mkdtempSync(path.join(os.tmpdir(), "dsh-git-repo-"));
	runSync(["git", "init", "-b", "main"], repo);
	runSync(["git", "config", "user.email", "test@example.com"], repo);
	runSync(["git", "config", "user.name", "Test"], repo);
	fs.writeFileSync(path.join(repo, "a.txt"), "hello\n");
	runSync(["git", "add", "-A"], repo);
	runSync(["git", "commit", "-m", "chore: init"], repo);
	return repo;
}

/** `git stash` needs a stdin pipe internally; probe whether this environment allows it. */
function stashWorks() {
	const repo = makeRepo();
	fs.writeFileSync(path.join(repo, "a.txt"), "changed\n");
	return runSync(["git", "stash", "push", "-m", "probe"], repo).status === 0;
}
const STASH_AVAILABLE = stashWorks();
const STASH_SKIP = STASH_AVAILABLE ? false : "git stash needs pipe access, unavailable in this sandboxed environment";

test("git-status tool reports the branch and a clean tree", async () => {
	const repo = makeRepo();
	const { tools } = await mount(repo);
	const gitStatus = tools.find((t) => t.name === "git-status");
	const value = await gitStatus.execute({}, { agent: agentFor(repo), signal: signal() });
	assert.match(value.text, /main/);
});

test("git-log and git-show read history", async () => {
	const repo = makeRepo();
	const { tools } = await mount(repo);
	const gitLog = tools.find((t) => t.name === "git-log");
	const log = await gitLog.execute({ count: 1 }, { agent: agentFor(repo), signal: signal() });
	assert.match(log.text, /chore: init/);

	const gitShow = tools.find((t) => t.name === "git-show");
	const show = await gitShow.execute({ ref: "HEAD" }, { agent: agentFor(repo), signal: signal() });
	assert.match(show.text, /chore: init/);
});

test("/commit creates a commit with the given message", async () => {
	const repo = makeRepo();
	fs.writeFileSync(path.join(repo, "b.txt"), "world\n");
	const { commands } = await mount(repo);
	const commit = commands.find((c) => c.name === "commit");
	const result = await commit.handler({ rawInput: "feat: add b", agent: agentFor(repo), signal: signal() });
	assert.equal(result.kind, "success");
	const log = runSync(["git", "log", "--oneline", "-1"], repo).stdout;
	assert.match(log, /feat: add b/);
});

test("/commit refuses to run a failing pre-commit hook", async () => {
	const repo = makeRepo();
	fs.writeFileSync(path.join(repo, "c.txt"), "x\n");
	const { commands } = await mount(repo, { preCommit: ["git", "no-such-git-command"] });
	const commit = commands.find((c) => c.name === "commit");
	const result = await commit.handler({ rawInput: "chore: hook", agent: agentFor(repo), signal: signal() });
	assert.equal(result.kind, "error");
	const log = runSync(["git", "log", "--oneline", "-1"], repo).stdout;
	assert.doesNotMatch(log, /chore: hook/);
});

test("/commit runs a passing pre-commit hook", async () => {
	const repo = makeRepo();
	fs.writeFileSync(path.join(repo, "d.txt"), "x\n");
	const { commands } = await mount(repo, { preCommit: ["git", "status"] });
	const commit = commands.find((c) => c.name === "commit");
	const result = await commit.handler({ rawInput: "chore: hook ok", agent: agentFor(repo), signal: signal() });
	assert.equal(result.kind, "success");
});

test("/branch creates and switches to a new branch", async () => {
	const repo = makeRepo();
	const { commands } = await mount(repo);
	const branch = commands.find((c) => c.name === "branch");
	const result = await branch.handler({ rawInput: "feat/test", agent: agentFor(repo), signal: signal() });
	assert.equal(result.kind, "success");
	const current = runSync(["git", "branch", "--show-current"], repo).stdout.trim();
	assert.equal(current, "feat/test");
});

test("/branch rejects an invalid name", async () => {
	const repo = makeRepo();
	const { commands } = await mount(repo);
	const branch = commands.find((c) => c.name === "branch");
	const result = await branch.handler({ rawInput: "bad name", agent: agentFor(repo), signal: signal() });
	assert.equal(result.kind, "error");
});

test("/undo stashes changes and /undo pop restores them", { skip: STASH_SKIP }, async () => {
	const repo = makeRepo();
	fs.writeFileSync(path.join(repo, "e.txt"), "y\n");
	const { commands } = await mount(repo);
	const undo = commands.find((c) => c.name === "undo");

	const stashed = await undo.handler({ rawInput: "", agent: agentFor(repo), signal: signal() });
	assert.equal(stashed.kind, "success");
	assert.equal(fs.existsSync(path.join(repo, "e.txt")), false);

	const restored = await undo.handler({ rawInput: "pop", agent: agentFor(repo), signal: signal() });
	assert.equal(restored.kind, "success");
	assert.equal(fs.existsSync(path.join(repo, "e.txt")), true);
});

test("/undo list reports no stashes on a fresh repo", async () => {
	const repo = makeRepo();
	const { commands } = await mount(repo);
	const undo = commands.find((c) => c.name === "undo");
	const result = await undo.handler({ rawInput: "list", agent: agentFor(repo), signal: signal() });
	assert.equal(result.kind, "success");
	assert.match(result.text, /no stashes/);
});

test("git tools fail clearly outside a git repository", async () => {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dsh-git-notrepo-"));
	const { tools } = await mount(dir);
	const gitStatus = tools.find((t) => t.name === "git-status");
	await assert.rejects(
		() => gitStatus.execute({}, { agent: agentFor(dir), signal: signal() }),
		/not a git repository/
	);
});

function initRepoAt(dir) {
	runSync(["git", "init", "-b", "main"], dir);
	runSync(["git", "config", "user.email", "test@example.com"], dir);
	runSync(["git", "config", "user.name", "Test"], dir);
}

test("/status auto-resolves a single git repo under the cwd", async () => {
	const parent = fs.mkdtempSync(path.join(os.tmpdir(), "dsh-parent-"));
	const repo = path.join(parent, "proj");
	fs.mkdirSync(repo);
	initRepoAt(repo);
	fs.writeFileSync(path.join(repo, "a.txt"), "hello\n");
	runSync(["git", "add", "-A"], repo);
	runSync(["git", "commit", "-m", "chore: init"], repo);

	const { commands } = await mount(parent);
	const status = commands.find((c) => c.name === "status");
	const result = await status.handler({ rawInput: "", agent: agentFor(parent), signal: signal() });
	assert.equal(result.kind, "success");
	assert.match(result.text, /main/);
});

test("/status lists multiple repos under the cwd", async () => {
	const parent = fs.mkdtempSync(path.join(os.tmpdir(), "dsh-parent-"));
	for (const name of ["r1", "r2"]) {
		const repo = path.join(parent, name);
		fs.mkdirSync(repo);
		initRepoAt(repo);
	}
	const { commands } = await mount(parent);
	const status = commands.find((c) => c.name === "status");
	const result = await status.handler({ rawInput: "", agent: agentFor(parent), signal: signal() });
	assert.equal(result.kind, "error");
	assert.match(result.text, /multiple git repositories/);
	assert.match(result.text, /r1/);
	assert.match(result.text, /r2/);
});

test("/undo on a clean tree reports nothing to stash", async () => {
	const repo = makeRepo();
	const { commands } = await mount(repo);
	const undo = commands.find((c) => c.name === "undo");
	const result = await undo.handler({ rawInput: "", agent: agentFor(repo), signal: signal() });
	assert.equal(result.kind, "success");
	assert.match(result.text, /Nothing to stash/);
});
