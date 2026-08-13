import z from "@deepseek-ai/schemastery";
import { defineTool } from "@deepseek-ai/dsh-tools";

/**
 * dsh-git-plugin — Git workflow plugin for DeepSeek Harness.
 *
 * Registers human-facing slash commands (`/status`, `/diff`, `/branch`,
 * `/commit`, `/undo`) and read-only model-facing tools (`git-status`,
 * `git-diff`, `git-log`, `git-show`), all backed by the `ctx.subprocess` seam.
 * Git is always invoked as a plain argv vector — no shell layer — and every run
 * is bounded by the plugin's output-byte and timeout caps.
 *
 * @module dsh-git-plugin
 */

const name = "dsh-git-plugin";
const inject = ["commands", "tools", "systemPrompt", "subprocess"];

const DEFAULT_MAX_BYTES = 1024 * 1024;
const DEFAULT_STDERR_MAX_BYTES = 64 * 1024;
const DEFAULT_GRACE_MS = 3000;
const DEFAULT_TIMEOUT_MS = 30000;

const Config = z.object({
	maxBytes: z.number().default(DEFAULT_MAX_BYTES),
	stderrMaxBytes: z.number().default(DEFAULT_STDERR_MAX_BYTES),
	graceMs: z.number().default(DEFAULT_GRACE_MS),
	timeoutMs: z.number().default(DEFAULT_TIMEOUT_MS),
	preCommit: z.array(z.string()).default([])
});

const COMMIT_CONVENTION_HINT = [
	"Commit message convention (MAA style):",
	"  <type>(<scope>): <中文主体>      e.g. feat(git): 新增 /status 命令",
	"  types: feat fix docs chore style refactor test perf",
	"If this repo defines its own convention (AGENTS.md / CLAUDE.md), read it and follow it instead."
].join("\n");

function assertPositiveInteger(field, value) {
	if (!Number.isInteger(value) || value < 1) {
		throw new Error(`dsh-git-plugin: ${field} must be a positive integer`);
	}
}

/** The calling agent's session cwd, falling back to the process cwd. */
function agentCwd(agent) {
	return agent?.session?.header?.cwd ?? process.cwd();
}

/**
 * Run one arbitrary argv vector through the subprocess seam and return its
 * complete stdout. Non-zero exits, signals, aborts, and launch failures surface
 * as `{ ok: false, text }`; success returns `{ ok: true, text }`.
 */
async function runProcess(ctx, argv, { cwd, signal, caps }) {
	const label = argv.join(" ");
	let handle;
	try {
		handle = ctx.subprocess.spawn({
			argv,
			cwd,
			stdio: {
				stdin: "ignore",
				stdout: { maxBytes: caps.maxBytes },
				stderr: { maxBytes: caps.stderrMaxBytes }
			},
			graceMs: caps.graceMs,
			signal
		});
	} catch (error) {
		return { ok: false, text: `${label} failed to start: ${String(error)}` };
	}
	let outcome;
	try {
		outcome = await handle.done;
	} catch (error) {
		return { ok: false, text: `${label} failed: ${String(error)}` };
	}
	if (signal.aborted) {
		return { ok: false, text: `${label} aborted` };
	}
	const stdout = handle.collected?.stdout?.readFrom(0);
	const stderr = handle.collected?.stderr?.readFrom(0);
	const outText = stdout?.text ?? "";
	const errText = stderr?.text ?? "";
	const lossy = (stdout?.lossy ?? false) || (stderr?.lossy ?? false);
	if (outcome.signal !== null || outcome.exitCode === null) {
		return { ok: false, text: `${label} was killed by signal ${outcome.signal ?? "(unknown)"}` };
	}
	if (outcome.exitCode !== 0) {
		return { ok: false, text: `${label} failed (exit ${outcome.exitCode})${errText.length > 0 ? `: ${errText}` : ""}` };
	}
	return { ok: true, text: lossy ? `${outText}\n(output truncated)` : outText };
}

/** Run one `git` argv vector (prefixed with the `git` binary). */
function runGit(ctx, argv, opts) {
	return runProcess(ctx, ["git", ...argv], opts);
}

/** Shared command plumbing: run git, map failures/empty output to a result. */
async function runCommand(ctx, invocation, argv, caps, emptyText) {
	const result = await runGit(ctx, argv, {
		cwd: agentCwd(invocation.agent),
		signal: invocation.signal,
		caps
	});
	if (!result.ok) return { kind: "error", text: result.text };
	return { kind: "success", text: result.text.length > 0 ? result.text : emptyText };
}

function applyCommands(ctx, caps) {
	ctx.commands.register({
		name: "status",
		description: "show git branch and working-tree status",
		handler: (invocation) => runCommand(ctx, invocation, ["status", "--porcelain=v1", "--branch"], caps, "working tree clean")
	});

	ctx.commands.register({
		name: "diff",
		description: "show a summary of staged and unstaged changes",
		handler: async (invocation) => {
			const cwd = agentCwd(invocation.agent);
			const signal = invocation.signal;
			const unstaged = await runGit(ctx, ["diff", "--stat"], { cwd, signal, caps });
			const staged = await runGit(ctx, ["diff", "--cached", "--stat"], { cwd, signal, caps });
			if (!unstaged.ok || !staged.ok) {
				return { kind: "error", text: unstaged.ok ? staged.text : unstaged.text };
			}
			const sections = [];
			if (staged.text.length > 0) sections.push(`Staged changes:\n${staged.text}`);
			if (unstaged.text.length > 0) sections.push(`Unstaged changes:\n${unstaged.text}`);
			if (sections.length === 0) {
				return { kind: "success", text: "No changes (working tree matches HEAD)." };
			}
			return { kind: "success", text: sections.join("\n\n") };
		}
	});

	ctx.commands.register({
		name: "branch",
		description: "create and switch to a branch, or list branches",
		input: { hint: "[<name>]" },
		handler: async (invocation) => {
			const input = invocation.rawInput.trim();
			const cwd = agentCwd(invocation.agent);
			const signal = invocation.signal;
			if (input.length === 0) {
				const current = await runGit(ctx, ["branch", "--show-current"], { cwd, signal, caps });
				const list = await runGit(ctx, ["branch", "--list"], { cwd, signal, caps });
				if (!current.ok || !list.ok) {
					return { kind: "error", text: current.ok ? list.text : current.text };
				}
				const currentName = current.text.trim().length > 0 ? current.text.trim() : "(detached HEAD)";
				return { kind: "success", text: `Current branch: ${currentName}\n\nBranches:\n${list.text}` };
			}
			const check = await runGit(ctx, ["check-ref-format", "--branch", input], { cwd, signal, caps });
			if (!check.ok) return { kind: "error", text: `Invalid branch name "${input}".\n${check.text}` };
			const result = await runGit(ctx, ["switch", "-c", input], { cwd, signal, caps });
			if (!result.ok) return { kind: "error", text: result.text };
			return { kind: "success", text: `Switched to new branch ${input}\n${result.text}` };
		}
	});

	ctx.commands.register({
		name: "commit",
		description: "stage all changes and commit with a message",
		input: { hint: "<message>" },
		handler: async (invocation) => {
			const message = invocation.rawInput.trim();
			const cwd = agentCwd(invocation.agent);
			const signal = invocation.signal;
			if (message.length === 0) {
				const status = await runGit(ctx, ["status", "--porcelain=v1", "--branch"], { cwd, signal, caps });
				const statusText = status.ok && status.text.length > 0 ? status.text : (status.ok ? "working tree clean" : status.text);
				return {
					kind: "success",
					text: [
						"Usage: /commit <message>     stage all changes and commit with <message>",
						"",
						COMMIT_CONVENTION_HINT,
						"",
						"Current changes:",
						statusText
					].join("\n")
				};
			}
			if (caps.preCommit.length > 0) {
				const hook = await runProcess(ctx, caps.preCommit, { cwd, signal, caps });
				if (!hook.ok) {
					return { kind: "error", text: `pre-commit hook failed (${caps.preCommit.join(" ")}):\n${hook.text}` };
				}
			}
			const add = await runGit(ctx, ["add", "-A"], { cwd, signal, caps });
			if (!add.ok) return { kind: "error", text: add.text };
			const commit = await runGit(ctx, ["commit", "-m", message], { cwd, signal, caps });
			if (!commit.ok) return { kind: "error", text: commit.text };
			return { kind: "success", text: commit.text };
		}
	});

	ctx.commands.register({
		name: "undo",
		description: "stash current changes as a recoverable snapshot",
		input: { hint: "[list|pop]" },
		handler: async (invocation) => {
			const input = invocation.rawInput.trim().toLowerCase();
			const cwd = agentCwd(invocation.agent);
			const signal = invocation.signal;
			if (input === "list") {
				const list = await runGit(ctx, ["stash", "list"], { cwd, signal, caps });
				if (!list.ok) return { kind: "error", text: list.text };
				return { kind: "success", text: list.text.length > 0 ? list.text : "no stashes" };
			}
			if (input === "pop") {
				const pop = await runGit(ctx, ["stash", "pop"], { cwd, signal, caps });
				if (!pop.ok) return { kind: "error", text: pop.text };
				return { kind: "success", text: pop.text };
			}
			const stash = await runGit(ctx, ["stash", "push", "-u", "-m", "dsh-git-plugin undo snapshot"], { cwd, signal, caps });
			if (!stash.ok) return { kind: "error", text: stash.text };
			const list = await runGit(ctx, ["stash", "list"], { cwd, signal, caps });
			const listText = list.ok ? (list.text.length > 0 ? list.text : "(none)") : list.text;
			return {
				kind: "success",
				text: [
					"Stashed current changes (recoverable snapshot).",
					stash.text,
					"",
					"Stash list:",
					listText,
					"",
					"Recover with: /undo pop   (or git stash pop)"
				].join("\n")
			};
		}
	});
}

/** Canonical `{ text }` output contract shared by every read-only git tool. */
function textOutput() {
	return {
		schema: {
			type: "object",
			additionalProperties: false,
			properties: { text: { type: "string", required: true } }
		},
		render: (_args, value) => [{ type: "text", text: value.text }]
	};
}

/** Execute one read-only git tool, throwing a plain Error on failure. */
async function executeGitTool(ctx, exec, argv, caps, emptyText) {
	const result = await runGit(ctx, argv, {
		cwd: agentCwd(exec.agent),
		signal: exec.signal,
		caps
	});
	if (!result.ok) throw new Error(result.text);
	return { text: result.text.length > 0 ? result.text : emptyText };
}

function applyTools(ctx, caps) {
	ctx.tools.register(defineTool({
		name: "git-status",
		description: "Show the git branch and working-tree status (porcelain v1). Returns the current branch with tracking info and a compact list of staged and unstaged changes. Empty output means a clean working tree.",
		parameters: {},
		timeoutMs: caps.timeoutMs,
		isConcurrencySafe: () => true,
		output: textOutput(),
		execute: (_args, exec) => executeGitTool(ctx, exec, ["status", "--porcelain=v1", "--branch"], caps, "(clean working tree)")
	}));

	ctx.tools.register(defineTool({
		name: "git-diff",
		description: "Show the git diff for staged or unstaged changes. By default shows unstaged changes (git diff); pass staged=true for staged changes (git diff --cached).",
		parameters: {
			staged: { type: "boolean", description: "Show staged (git diff --cached) changes instead of unstaged ones." }
		},
		timeoutMs: caps.timeoutMs,
		isConcurrencySafe: () => true,
		output: textOutput(),
		execute: (args, exec) => executeGitTool(ctx, exec, args.staged === true ? ["diff", "--cached"] : ["diff"], caps, "(no diff)")
	}));

	ctx.tools.register(defineTool({
		name: "git-log",
		description: "Show recent git commit history in oneline format. Use count to control how many commits to list (default 10); optionally filter to one file or directory with path.",
		parameters: {
			count: { type: "integer", description: "Number of commits to list (default 10)." },
			path: { type: "string", description: "Optional file or directory path to filter history to." }
		},
		timeoutMs: caps.timeoutMs,
		isConcurrencySafe: () => true,
		output: textOutput(),
		execute: (args, exec) => {
			const argv = ["log", "--oneline", "-n", String(args.count ?? 10)];
			if (args.path !== void 0) argv.push("--", args.path);
			return executeGitTool(ctx, exec, argv, caps, "(no commits)");
		}
	}));

	ctx.tools.register(defineTool({
		name: "git-show",
		description: "Show a specific commit (or HEAD by default): commit message, author, and full diff.",
		parameters: {
			ref: { type: "string", description: "Commit reference (SHA, branch, or tag) to show. Defaults to HEAD." }
		},
		timeoutMs: caps.timeoutMs,
		isConcurrencySafe: () => true,
		output: textOutput(),
		execute: (args, exec) => {
			const ref = args.ref !== void 0 && args.ref.length > 0 ? args.ref : "HEAD";
			return executeGitTool(ctx, exec, ["show", ref], caps, "");
		}
	}));
}

async function apply(ctx, config) {
	const caps = {
		maxBytes: config.maxBytes ?? DEFAULT_MAX_BYTES,
		stderrMaxBytes: config.stderrMaxBytes ?? DEFAULT_STDERR_MAX_BYTES,
		graceMs: config.graceMs ?? DEFAULT_GRACE_MS,
		timeoutMs: config.timeoutMs ?? DEFAULT_TIMEOUT_MS,
		preCommit: Array.isArray(config.preCommit) ? config.preCommit : []
	};
	assertPositiveInteger("maxBytes", caps.maxBytes);
	assertPositiveInteger("stderrMaxBytes", caps.stderrMaxBytes);
	assertPositiveInteger("graceMs", caps.graceMs);
	assertPositiveInteger("timeoutMs", caps.timeoutMs);

	applyCommands(ctx, caps);
	applyTools(ctx, caps);

	ctx.systemPrompt.section({
		name: "tool:git",
		order: 150,
		text: "Use the git tools (git-status, git-diff, git-log, git-show) — not shell git — to inspect repository state before and while editing. Before committing, read the repo's commit convention (AGENTS.md or CLAUDE.md) and commit with /commit <message> using a conventional MAA-style message. Create branches with /branch <name> following the repo's branch-prefix convention (feat/, fix/, docs/, etc.)."
	});
}

export { Config, apply, inject, name };
