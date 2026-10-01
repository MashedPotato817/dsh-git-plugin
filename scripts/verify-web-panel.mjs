#!/usr/bin/env node
/** Optional real-Web acceptance; never part of npm test/CI.
 * Start an isolated DSH Web with the installed development tarball, then create
 * a workspace/session named sample-repo using the fixture in docs/web-panel.md.
 * No model credentials, browser storage export, or daily profile are needed.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
const help = `Usage: node scripts/verify-web-panel.mjs
  --dsh-log <isolated server startup log> --session-id <fixture session ID>
  [--playwright-module <installed playwright directory>]
  [--screenshots <output directory>] [--workspace-title sample-repo]
  [--channel msedge]
The log is used only to navigate the official local authentication URL in memory.
Fixture: notes.txt initially "# Git panel\\noriginal line\\nstable line\\n";
stage the version with "staged line", then leave "worktree line" unstaged;
add one Chinese-named untracked file. Commit subject: Initial panel fixture.
The test enables the plugin, then disables/enables it twice in this test profile.
`;
const options = new Map();
const known = new Set([
	"--dsh-log",
	"--session-id",
	"--playwright-module",
	"--screenshots",
	"--workspace-title",
	"--channel",
]);
for (let i = 2; i < process.argv.length; i++) {
	const key = process.argv[i];
	if (key === "--help") {
		process.stdout.write(help);
		process.exit(0);
	}
	if (
		!known.has(key) ||
		options.has(key) ||
		!process.argv[i + 1] ||
		process.argv[i + 1].startsWith("--")
	) {
		process.stderr.write(help);
		process.exit(2);
	}
	options.set(key, process.argv[++i]);
}
if (!options.has("--dsh-log") || !options.has("--session-id")) {
	process.stderr.write(help);
	process.exit(2);
}
const get = (key) => options.get(key);
let browser;
try {
	const { chromium, request } = get("--playwright-module")
		? await import(
				pathToFileURL(path.resolve(get("--playwright-module"), "index.mjs"))
					.href
			)
		: await import("playwright");
	const log = await fs.readFile(get("--dsh-log"), "utf8");
	const match = log.match(/dsh web: (http[^\s]+)/);
	assert.ok(match, "Official DSH startup URL missing");
	const authUrl = new URL(match[1]);
	assert.ok(
		["127.0.0.1", "localhost", "[::1]"].includes(authUrl.hostname),
		"Use a local isolated test server",
	);
	const base = new URL("./", authUrl);
	const endpoint = (route, query = {}) =>
		new URL("api/" + route + "?" + new URLSearchParams(query), base).href;
	browser = await chromium.launch({
		headless: true,
		...(get("--channel") || process.platform === "win32"
			? { channel: get("--channel") || "msedge" }
			: {}),
	});
	const context = await browser.newContext({
		viewport: { width: 1440, height: 1000 },
	});
	const page = await context.newPage();
	const errors = [];
	page.on("pageerror", (e) => errors.push(e.message));
	page.setDefaultTimeout(10000);
	await page.goto(authUrl.href);
	await page.waitForLoadState("networkidle");
	async function toggle(enabled) {
		const response = await context.request.post(
			endpoint("pluginManager/setBundleEnabled"),
			{
				data: {
					type: "client-request",
					rpcId: randomUUID(),
					method: "pluginManager/setBundleEnabled",
					payload: { args: { name: "dsh-git-plugin", enabled } },
				},
			},
		);
		const body = await response.json();
		assert.ok(body.result?.ok, "Plugin manager request failed");
		assert.equal(body.result.value.application, "applied");
	}
	await toggle(true);
	await page.waitForFunction(
		() =>
			document.querySelectorAll('style[data-plugin="dsh-git-plugin"]')
				.length === 1,
	);
	for (const name of ["继续", "稍后配置"]) {
		const button = page.getByRole("button", { name, exact: true });
		if (await button.count()) await button.click();
	}

	const workspaceTitle = get("--workspace-title") || "sample-repo";
	await page
		.getByLabel("会话", { exact: true })
		.getByText(workspaceTitle, { exact: true })
		.hover();
	const creation = page.waitForResponse((response) =>
		new URL(response.url()).pathname.endsWith("/api/session/create"),
	);
	await page
		.getByLabel("会话", { exact: true })
		.getByRole("button", {
			name: `在“${workspaceTitle}”中新建会话`,
			exact: true,
		})
		.click();
	await creation;
	await page
		.getByRole("button", { name: "打开右侧边栏", exact: true })
		.waitFor();
	await page.getByRole("button", { name: "打开右侧边栏", exact: true }).click();
	await page.getByRole("button", { name: /^Git/ }).waitFor();
	await page.getByRole("button", { name: /^Git/ }).click();
	const panel = page.locator("[data-git-panel]");
	await panel.locator(".gp-file").first().waitFor();
	assert.equal(await panel.locator(".gp-file").count(), 3);
	async function screenshot(name) {
		if (!get("--screenshots")) return;
		const directory = path.resolve(get("--screenshots"));
		await fs.mkdir(directory, { recursive: true });
		await panel.screenshot({ path: path.join(directory, name + ".png") });
	}
	await panel
		.locator(".gp-group")
		.filter({ has: page.getByRole("heading", { name: /^已暂存/ }) })
		.locator(".gp-file")
		.click();
	await panel.locator(".gp-patch").waitFor();
	assert.match(await panel.locator(".gp-patch").innerText(), /staged line/);
	await screenshot("git-staged");
	// Actual rendered contrast regression: a nonexistent theme token previously
	// left a pale selected/detail background behind the dark shell's white text.
	await page.emulateMedia({ colorScheme: "dark" });
	await page.waitForFunction(() =>
		document.body.hasAttribute("data-ds-dark-theme"),
	);
	const contrast = await panel.evaluate((element) => {
		const rgb = (value) =>
			value
				.match(/[\d.]+/g)
				.slice(0, 3)
				.map(Number)
				.map((v) => v / 255);
		const luminance = (value) =>
			rgb(value)
				.map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
				.reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
		const ratio = (foreground, background) => {
			const a = luminance(foreground),
				b = luminance(background);
			return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
		};
		const heading = element.querySelector(".gp-detail-head");
		const title = element.querySelector(".gp-detail-title");
		const selected = element.querySelector('.gp-file[aria-pressed="true"]');
		return {
			title: ratio(
				getComputedStyle(title).color,
				getComputedStyle(heading).backgroundColor,
			),
			selected: ratio(
				getComputedStyle(selected).color,
				getComputedStyle(selected).backgroundColor,
			),
		};
	});
	assert.ok(
		contrast.title >= 4.5 && contrast.selected >= 4.5,
		"Dark theme text contrast below 4.5:1",
	);
	await screenshot("git-dark");
	await page.emulateMedia({ colorScheme: "light" });

	await panel
		.locator(".gp-group")
		.filter({ has: page.getByRole("heading", { name: /^未暂存/ }) })
		.locator(".gp-file")
		.click();
	await panel.locator(".gp-patch").waitFor();
	assert.match(await panel.locator(".gp-patch").innerText(), /worktree line/);
	await panel.getByRole("button", { name: "历史", exact: true }).click();
	await panel.getByRole("button", { name: /Initial panel fixture/ }).click();
	await panel.locator(".gp-patch").waitFor();
	assert.match(await panel.locator(".gp-patch").innerText(), /original line/);
	await screenshot("git-history");
	const sid = get("--session-id");
	const anonymous = await request.newContext();
	try {
		assert.equal(
			(
				await anonymous.get(endpoint("git-panel/status", { sessionId: sid }))
			).status(),
			401,
		);
	} finally {
		await anonymous.dispose();
	}
	assert.equal(
		(
			await context.request.get(
				endpoint("git-panel/status", { sessionId: sid }),
				{ headers: { Origin: "https://evil.invalid" } },
			)
		).status(),
		403,
	);
	assert.equal(
		(
			await context.request.get(
				endpoint("git-panel/status", { sessionId: "not-a-session" }),
			)
		).status(),
		404,
	);
	for (const [route, query] of [
		["status", { cwd: "/private" }],
		["diff", { path: "../outside", side: "unstaged" }],
		["show", { sha: "--output=bad" }],
	]) {
		assert.equal(
			(
				await context.request.get(
					endpoint("git-panel/" + route, { sessionId: sid, ...query }),
				)
			).status(),
			400,
		);
	}
	for (let i = 0; i < 2; i++) {
		await toggle(false);
		await page.waitForFunction(
			() =>
				document.querySelectorAll('style[data-plugin="dsh-git-plugin"]')
					.length === 0,
		);
		assert.equal(await page.locator("[data-git-panel]").count(), 0);
		assert.equal(
			(
				await context.request.get(
					endpoint("git-panel/status", { sessionId: sid }),
				)
			).status(),
			404,
		);
		await toggle(true);
		await page.waitForFunction(
			() =>
				document.querySelectorAll('style[data-plugin="dsh-git-plugin"]')
					.length === 1,
		);
		assert.equal(
			(
				await context.request.get(
					endpoint("git-panel/status", { sessionId: sid }),
				)
			).status(),
			200,
		);
	}
	assert.deepEqual(errors, []);
	console.log(
		`PASS: installed Web UI, both diff sides, history, carrier/query boundaries, two lifecycle cycles; browser ${browser.version()}`,
	);
} catch (error) {
	// Do not print authentication URLs, response bodies, cookies or credentials.
	console.error(
		String(error.message).replace(/https?:\/\/[^\s]+/g, "[URL redacted]"),
	);
	process.exitCode = 1;
} finally {
	if (browser) await browser.close();
}
