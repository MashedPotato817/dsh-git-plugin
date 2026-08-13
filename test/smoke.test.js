import test from "node:test";
import assert from "node:assert/strict";
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

test("exports the Cordis plugin surface", () => {
	assert.equal(typeof name, "string");
	assert.ok(name.length > 0);
	assert.ok(Array.isArray(inject));
	assert.deepEqual(inject, ["commands", "tools", "systemPrompt", "subprocess"]);
	assert.equal(typeof Config, "function");
	assert.equal(typeof apply, "function");
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
