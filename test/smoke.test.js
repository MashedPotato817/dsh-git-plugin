import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { apply, name, inject, Config } from "../lib/index.js";

function makeCtx() {
	const registered = { commands: [], tools: [], sections: [] };
	const ctx = {
		commands: { register: (definition) => registered.commands.push(definition) },
		tools: { register: (definition) => registered.tools.push(definition) },
		systemPrompt: { section: (section) => registered.sections.push(section) },
		subprocess: { spawn: () => { throw new Error("subprocess not wired in smoke test"); } }
	};
	return { ctx, registered };
}

/** An empty collected-output pair, as the subprocess seam hands it to callers. */
function collected(stdoutText = "") {
	return {
		stdout: { readFrom: () => ({ text: stdoutText, lossy: false }) },
		stderr: { readFrom: () => ({ text: "", lossy: false }) }
	};
}

/** A handle whose `done` settles only once its abort signal fires. */
function hangingHandle(signal, log) {
	return {
		done: new Promise((resolve) => {
			signal.addEventListener("abort", () => resolve({ signal: "SIGTERM", exitCode: null }), { once: true });
		}),
		terminate: () => {
			log.terminateCalls += 1;
		},
		waitForExit: () => Promise.resolve(),
		collected: collected()
	};
}

function agentFor(cwd) {
	return { session: { header: { cwd } } };
}

test("exports the Cordis plugin surface", () => {
	assert.equal(typeof name, "string");
	assert.ok(name.length > 0);
	assert.ok(Array.isArray(inject));
	assert.deepEqual(inject, ["commands", "tools", "systemPrompt", "subprocess"]);
	assert.equal(typeof Config, "function");
	assert.equal(typeof apply, "function");
});

test("git-show treats option-shaped refs as revisions, not output-file options", async () => {
	const { ctx, registered } = makeCtx();
	const calls = [];
	ctx.subprocess.spawn = ({ argv }) => {
		calls.push(argv);
		return {
			done: Promise.resolve({ signal: null, exitCode: 0 }),
			collected: collected("repo\n")
		};
	};
	await apply(ctx, {});
	const gitShow = registered.tools.find((tool) => tool.name === "git-show");
	await gitShow.execute({ ref: "--output=do-not-create.txt" }, {
		agent: agentFor(process.cwd()),
		signal: new AbortController().signal
	});
	assert.deepEqual(calls.at(-1), ["git", "show", "--end-of-options", "--output=do-not-create.txt"]);
});

test("git-show still accepts ordinary refs and defaults to HEAD", async () => {
	const { ctx, registered } = makeCtx();
	const calls = [];
	ctx.subprocess.spawn = ({ argv }) => {
		calls.push(argv);
		return {
			done: Promise.resolve({ signal: null, exitCode: 0 }),
			collected: collected("commit\n")
		};
	};
	await apply(ctx, {});
	const gitShow = registered.tools.find((tool) => tool.name === "git-show");
	const exec = (ref) => gitShow.execute(ref === void 0 ? {} : { ref }, {
		agent: agentFor(process.cwd()),
		signal: new AbortController().signal
	});
	await exec("HEAD~1");
	await exec("main");
	await exec("");
	await exec();
	assert.deepEqual(calls.filter((argv) => argv[1] === "show"), [
		["git", "show", "--end-of-options", "HEAD~1"],
		["git", "show", "--end-of-options", "main"],
		["git", "show", "--end-of-options", "HEAD"],
		["git", "show", "--end-of-options", "HEAD"]
	]);
});

test("apply registers 5 commands, 4 tools, and one system-prompt section", async () => {
	const { ctx, registered } = makeCtx();
	await apply(ctx, {});

	assert.equal(registered.commands.length, 5);
	assert.deepEqual(
		registered.commands.map((c) => c.name).sort(),
		["branch", "commit", "diff", "status", "undo"]
	);
	for (const command of registered.commands) {
		assert.equal(typeof command.handler, "function");
	}

	assert.equal(registered.tools.length, 4);
	assert.deepEqual(
		registered.tools.map((t) => t.name).sort(),
		["git-diff", "git-log", "git-show", "git-status"]
	);
	for (const tool of registered.tools) {
		assert.equal(typeof tool.execute, "function");
		assert.ok(Array.isArray(tool.output.render({}, { text: "" })));
	}

	assert.equal(registered.sections.length, 1);
	assert.equal(registered.sections[0].name, "tool:git");
});

test("apply rejects a non-positive timeoutMs", async () => {
	const { ctx } = makeCtx();
	await assert.rejects(() => apply(ctx, { timeoutMs: 0 }), /timeoutMs must be a positive integer/);
	await assert.rejects(() => apply(ctx, { timeoutMs: -5 }), /timeoutMs must be a positive integer/);
});

test("timeoutMs bounds a slash command and terminates the process", async () => {
	const { ctx, registered } = makeCtx();
	const log = { terminateCalls: 0, signals: [] };
	ctx.subprocess.spawn = ({ signal }) => {
		log.signals.push(signal);
		return hangingHandle(signal, log);
	};
	await apply(ctx, { timeoutMs: 100 });
	const status = registered.commands.find((command) => command.name === "status");
	const result = await status.handler({ rawInput: "", agent: agentFor(process.cwd()), signal: new AbortController().signal });
	assert.equal(result.kind, "error");
	assert.match(result.text, /timed out after 100ms/);
	assert.ok(log.terminateCalls >= 1, "the provider teardown was started");
	assert.equal(log.signals[0].aborted, true, "the spawned request was aborted");
});

test("timeoutMs bounds a read-only tool", async () => {
	const { ctx, registered } = makeCtx();
	const log = { terminateCalls: 0 };
	ctx.subprocess.spawn = ({ signal }) => hangingHandle(signal, log);
	await apply(ctx, { timeoutMs: 80 });
	const gitStatus = registered.tools.find((tool) => tool.name === "git-status");
	await assert.rejects(
		() => gitStatus.execute({}, { agent: agentFor(process.cwd()), signal: new AbortController().signal }),
		/timed out after 80ms/
	);
});

test("timeoutMs bounds the preCommit hook", async () => {
	const { ctx, registered } = makeCtx();
	const spawned = [];
	ctx.subprocess.spawn = ({ argv, signal }) => {
		spawned.push(argv);
		if (argv[1] === "rev-parse") {
			return {
				done: Promise.resolve({ signal: null, exitCode: 0 }),
				collected: collected(`${process.cwd()}\n`)
			};
		}
		return hangingHandle(signal, { terminateCalls: 0 });
	};
	await apply(ctx, { timeoutMs: 120, preCommit: ["slow-hook"] });
	const commit = registered.commands.find((command) => command.name === "commit");
	const result = await commit.handler({ rawInput: "chore: never lands", agent: agentFor(process.cwd()), signal: new AbortController().signal });
	assert.equal(result.kind, "error");
	assert.match(result.text, /pre-commit hook failed \(slow-hook\)/);
	assert.match(result.text, /timed out after 120ms/);
	assert.deepEqual(spawned.at(-1), ["slow-hook"]);
	assert.ok(!spawned.some((argv) => argv[1] === "add"), "the hook aborted the commit before staging");
});

test("a caller abort reports an abort, not a timeout", async () => {
	const { ctx, registered } = makeCtx();
	ctx.subprocess.spawn = ({ signal }) => hangingHandle(signal, { terminateCalls: 0 });
	await apply(ctx, { timeoutMs: 30000 });
	const gitStatus = registered.tools.find((tool) => tool.name === "git-status");
	const controller = new AbortController();
	const pending = gitStatus.execute({}, { agent: agentFor(process.cwd()), signal: controller.signal });
	controller.abort();
	await assert.rejects(() => pending, /aborted/);
});

test("preCommit runs in the same repository directory as the git commands", async () => {
	const parent = fs.mkdtempSync(path.join(os.tmpdir(), "dsh-git-hook-cwd-"));
	try {
		const repo = path.join(parent, "proj");
		fs.mkdirSync(path.join(repo, ".git"), { recursive: true });
		const cwdByArgv = [];
		const { ctx, registered } = makeCtx();
		ctx.subprocess.spawn = ({ argv, cwd, signal }) => {
			cwdByArgv.push({ argv, cwd });
			if (argv[1] === "rev-parse") {
				// The session cwd is not a repository; discovery picks the single sub-repo.
				return {
					done: Promise.resolve({ signal: null, exitCode: 128 }),
					collected: collected()
				};
			}
			return {
				done: Promise.resolve({ signal: null, exitCode: 0 }),
				collected: collected("ok\n")
			};
		};
		await apply(ctx, { preCommit: ["hook"] });
		const commit = registered.commands.find((command) => command.name === "commit");
		const result = await commit.handler({ rawInput: "chore: hook cwd", agent: agentFor(parent), signal: new AbortController().signal });
		assert.equal(result.kind, "success");
		const hookCall = cwdByArgv.find((call) => call.argv[0] === "hook");
		assert.ok(hookCall !== void 0, "the hook ran");
		assert.equal(hookCall.cwd, repo);
		for (const call of cwdByArgv.filter((entry) => entry.argv[0] === "git" && entry.argv[1] !== "rev-parse")) {
			assert.equal(call.cwd, repo);
		}
	} finally {
		fs.rmSync(parent, { recursive: true, force: true });
	}
});
