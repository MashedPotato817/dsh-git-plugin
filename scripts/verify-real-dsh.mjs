#!/usr/bin/env node
/**
 * dsh-git-plugin — verification against the real DeepSeek Harness service stack.
 *
 * This script composes the official DSH packages (`cordis`, `dsh-commands`,
 * `dsh-tools`, `dsh-system-prompt`, `dsh-subprocess-local`) in one real Cordis
 * context, mounts this plugin's built `lib/index.js`, and drives the complete
 * surface against a throwaway git repository:
 *
 * - module exports, plugin fiber state, and the 5 slash commands / 4 read-only
 *   tools / one `tool:git` system-prompt section;
 * - real execution of `/status`, `/diff`, `/branch`, `/commit`, `/undo list`,
 *   `/undo pop` and of all four tools;
 * - the `git-show` option-injection guard (an option-shaped `ref` must not
 *   create a file);
 * - disable (``fiber.dispose()``) and re-enable without duplicate registration;
 * - `timeoutMs` terminating a real preCommit process that overruns.
 *
 * It is deliberately NOT part of `npm test`: it needs a separate DSH install and
 * a process-spawning environment, so it runs on demand as a pre-release check.
 *
 * Usage (from the repository root):
 *   npm install --prefix .tmp-dsh-verify --no-save @deepseek-ai/dsh@0.2.0-rc.2
 *   node scripts/verify-real-dsh.mjs --dsh-root .tmp-dsh-verify
 *
 * `--dsh-root` defaults to the repository's own `node_modules`; point it at an
 * isolated `@deepseek-ai/dsh` install to verify against a specific DSH version.
 * Exit code 0 means every check passed; 1 means at least one check failed;
 * 2 means the DSH packages could not be resolved from the requested root.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const DSH_PACKAGES = [
	"@deepseek-ai/cordis",
	"@deepseek-ai/dsh-commands",
	"@deepseek-ai/dsh-system-prompt",
	"@deepseek-ai/dsh-tools",
	"@deepseek-ai/dsh-subprocess-local"
];

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = path.resolve(scriptDir, "..");
const argv = process.argv.slice(2);
const rootFlag = argv.indexOf("--dsh-root");
const dshRoot = path.resolve(rootFlag === -1 ? path.join(pluginRoot, "node_modules") : argv[rootFlag + 1]);
const requireFromDsh = createRequire(path.join(dshRoot, "verify-real-dsh.cjs"));

/** Load one DSH package from the requested root through its own package entry. */
async function loadDsh(name) {
	return import(pathToFileURL(requireFromDsh.resolve(name)).href);
}

let dsh;
try {
	dsh = Object.fromEntries(await Promise.all(DSH_PACKAGES.map(async (name) => [name, await loadDsh(name)])));
} catch (error) {
	console.error(`verify-real-dsh: cannot resolve the DSH packages from ${dshRoot}`);
	console.error(`  ${String(error)}`);
	console.error("Install them first, for example:");
	console.error("  npm install --prefix .tmp-dsh-verify --no-save @deepseek-ai/dsh@0.2.0-rc.2");
	process.exit(2);
}

const { Context } = dsh["@deepseek-ai/cordis"];
const pluginPath = path.join(pluginRoot, "lib", "index.js");
const plugin = await import(pathToFileURL(pluginPath).href);

const GIT_COMMANDS = ["branch", "commit", "diff", "status", "undo"];
const GIT_TOOLS = ["git-diff", "git-log", "git-show", "git-status"];
const ACTIVE = 2;
const FAILED = 3;
const DISPOSED = 4;

let failures = 0;
/** Record one check line and count failures. */
function check(label, ok, detail = "") {
	if (!ok) failures += 1;
	console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
}

/** Run a process with file-descriptor stdio, so a sandbox that blocks pipes still works. */
function run(argvList, cwd) {
	const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "dsh-verify-run-"));
	const outFile = path.join(tmp, "out.txt");
	const errFile = path.join(tmp, "err.txt");
	const ofd = fs.openSync(outFile, "w");
	const efd = fs.openSync(errFile, "w");
	const result = spawnSync(argvList[0], argvList.slice(1), { cwd, stdio: ["ignore", ofd, efd] });
	fs.closeSync(ofd);
	fs.closeSync(efd);
	const stdout = fs.readFileSync(outFile, "utf8");
	fs.rmSync(tmp, { recursive: true, force: true });
	return { status: result.status, stdout };
}

/** Create a throwaway repository with one commit. */
function makeRepo() {
	const repo = fs.mkdtempSync(path.join(os.tmpdir(), "dsh-verify-repo-"));
	run(["git", "init", "-b", "main"], repo);
	run(["git", "config", "user.email", "verify@example.com"], repo);
	run(["git", "config", "user.name", "Verify"], repo);
	fs.writeFileSync(path.join(repo, "a.txt"), "hello\n");
	run(["git", "add", "-A"], repo);
	run(["git", "commit", "-m", "chore: init"], repo);
	return repo;
}

/** Wait for one fiber to leave PENDING/LOADING. */
async function settle(fiber, what) {
	for (let i = 0; i < 200; i += 1) {
		if (fiber.state === ACTIVE) return true;
		if (fiber.state === FAILED || fiber.state === DISPOSED) return false;
		await new Promise((resolve) => setTimeout(resolve, 25));
	}
	console.log(`  (${what} did not settle: state=${fiber.state})`);
	return false;
}

const repo = makeRepo();
const agent = { session: { header: { cwd: repo }, append: () => {} } };
const signal = () => new AbortController().signal;

const ctx = new Context();
ctx.plugin(dsh["@deepseek-ai/dsh-commands"].default);
ctx.plugin(dsh["@deepseek-ai/dsh-system-prompt"].default);
ctx.plugin(dsh["@deepseek-ai/dsh-tools"].default);
ctx.plugin(dsh["@deepseek-ai/dsh-subprocess-local"].default);

check(
	"plugin module exports name/inject/Config/apply",
	typeof plugin.name === "string" && Array.isArray(plugin.inject) && typeof plugin.Config === "function" && typeof plugin.apply === "function",
	`name=${plugin.name}`
);

const fiber = ctx.plugin(plugin);
check("plugin fiber reaches ACTIVE after mount", await settle(fiber, "plugin fiber"), `state=${fiber.state}`);

const gitCommands = () => ctx.commands.list(agent).filter((command) => GIT_COMMANDS.includes(command.name)).map((command) => command.name).sort();
const gitTools = () => GIT_TOOLS.filter((name) => ctx.tools.get(name, agent) !== undefined);

check("5 slash commands registered", JSON.stringify(gitCommands()) === JSON.stringify(GIT_COMMANDS), gitCommands().join(","));
check("4 read-only tools registered", JSON.stringify(gitTools().sort()) === JSON.stringify([...GIT_TOOLS].sort()), gitTools().join(","));

const assembled = await ctx.systemPrompt.assemble({ agent });
check("system-prompt section 'tool:git' present", assembled.sections.some((section) => section.name === "tool:git"), `${assembled.sections.length} sections assembled`);
check("tool schemas reach prompt assembly", assembled.tools.some((schema) => schema.name === "git-status"), assembled.tools.map((schema) => schema.name).join(","));

const exec = async (line) => {
	try {
		const execution = await ctx.commands.execute(agent, line, [], signal());
		return execution?.result;
	} catch (error) {
		return { kind: "error", text: String(error) };
	}
};

const status = await exec("/status");
check("/status succeeds in a real repo", status?.kind === "success" && /main/.test(status.text ?? ""), (status?.text ?? "").split("\n")[0]);

fs.appendFileSync(path.join(repo, "a.txt"), "unstaged change\n");
const diff = await exec("/diff");
check("/diff reports the unstaged change", diff?.kind === "success" && /a\.txt/.test(diff.text ?? ""), (diff?.text ?? "").split("\n")[0]);

const branch = await exec("/branch feat/verify");
check("/branch creates and switches", branch?.kind === "success" && run(["git", "branch", "--show-current"], repo).stdout.trim() === "feat/verify", (branch?.text ?? "").split("\n")[0]);

const commit = await exec("/commit chore: verify commit");
const log = run(["git", "log", "--oneline", "-1"], repo).stdout.trim();
check("/commit creates the commit", commit?.kind === "success" && /chore: verify commit/.test(log), log);

fs.writeFileSync(path.join(repo, "c.txt"), "undo\n");
const undoSave = await exec("/undo");
const undoList = await exec("/undo list");
const undoPop = await exec("/undo pop");
check(
	"/undo stash + list + pop round-trip",
	undoSave?.kind === "success" && /dsh-git-plugin undo snapshot/.test(undoList?.text ?? "") && undoPop?.kind === "success" && fs.existsSync(path.join(repo, "c.txt")),
	(undoList?.text ?? "").split("\n")[0]
);

const callTool = async (name, toolArgs) => {
	try {
		return await ctx.tools.get(name, agent).execute(toolArgs, { agent, signal: signal() });
	} catch (error) {
		return { error: String(error) };
	}
};

const toolStatus = await callTool("git-status", {});
check("git-status tool returns the branch", /main|feat/.test(toolStatus.text ?? ""), (toolStatus.text ?? toolStatus.error ?? "").split("\n")[0]);
const toolLog = await callTool("git-log", { count: 1 });
check("git-log tool returns history", /chore: verify commit/.test(toolLog.text ?? ""), (toolLog.text ?? toolLog.error ?? "").trim());
const toolDiff = await callTool("git-diff", {});
check("git-diff tool returns text", typeof toolDiff.text === "string", `${toolDiff.text?.length ?? 0} bytes`);
const toolShow = await callTool("git-show", { ref: "HEAD" });
check("git-show tool renders a commit", /chore: verify commit/.test(toolShow.text ?? ""), (toolShow.text ?? toolShow.error ?? "").split("\n")[0]);

const probe = path.join(repo, "do-not-create.txt");
const injected = await callTool("git-show", { ref: `--output=${probe}` });
check("option-shaped git-show ref is refused, not written", !fs.existsSync(probe) && injected.error !== undefined, injected.error ?? "call unexpectedly succeeded");

await fiber.dispose();
check("commands unregistered after disable", gitCommands().length === 0, gitCommands().join(","));
check("tools unregistered after disable", gitTools().length === 0, gitTools().join(","));
const afterDispose = await ctx.systemPrompt.assemble({ agent });
check("prompt section removed after disable", afterDispose.sections.some((section) => section.name === "tool:git") === false);

const fiber2 = ctx.plugin(plugin);
check("plugin re-activates without duplicate-registration errors", await settle(fiber2, "re-enabled fiber"), `state=${fiber2.state}`);
check("5 commands registered again", JSON.stringify(gitCommands()) === JSON.stringify(GIT_COMMANDS), gitCommands().join(","));
check("4 tools registered again", JSON.stringify(gitTools().sort()) === JSON.stringify([...GIT_TOOLS].sort()), gitTools().join(","));
const afterReenable = await ctx.systemPrompt.assemble({ agent });
check("prompt section present again", afterReenable.sections.some((section) => section.name === "tool:git"));
check("no section duplication after re-enable", afterReenable.sections.filter((section) => section.name === "tool:git").length === 1);
const statusAgain = await exec("/status");
check("/status still works after re-enable", statusAgain?.kind === "success" && /main|feat/.test(statusAgain.text ?? ""), (statusAgain?.text ?? "").split("\n")[0]);

await fiber2.dispose();
const slow = ctx.plugin(plugin, { timeoutMs: 400, preCommit: [process.execPath, "-e", "setTimeout(() => {}, 30000)"] });
check("timeout-config fiber activates", await settle(slow, "timeout-config fiber"), `state=${slow.state}`);
const slowCommit = await exec("/commit chore: should not land");
const slowLog = run(["git", "log", "--oneline", "-1"], repo).stdout.trim();
check("timeoutMs bounds a preCommit hook", slowCommit?.kind === "error" && /timed out after 400ms/.test(slowCommit.text ?? ""), (slowCommit?.text ?? "").split("\n")[0]);
check("timed-out /commit left no commit", !/should not land/.test(slowLog), slowLog);
await slow.dispose();

console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}`);
console.log(`plugin under test: ${pluginPath}`);
console.log(`DSH packages from: ${dshRoot}`);
process.exit(failures === 0 ? 0 : 1);
