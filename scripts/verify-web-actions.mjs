#!/usr/bin/env node
/** Optional installed-DSH Web acceptance. Only use a disposable repo/profile.
 * --dsh-log <private startup log> --repo <disposable actions-repo>
 * --playwright-module <directory> [--wsl-distro Ubuntu-24.04] [--screenshots <dir>]
 * Fixture: notes.txt committed with 'base\n', working version 'working\n',
 * and untracked 中文 space.txt with 'new content\n'. No model request is made.
 */
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";
const opts = new Map();
const known = [
  "--dsh-log",
  "--repo",
  "--playwright-module",
  "--wsl-distro",
  "--screenshots",
];
for (let i = 2; i < process.argv.length; i += 2) {
  if (
    !known.includes(process.argv[i]) ||
    !process.argv[i + 1] ||
    opts.has(process.argv[i])
  )
    throw Error("Invalid arguments");
  opts.set(process.argv[i], process.argv[i + 1]);
}
for (const key of ["--dsh-log", "--repo", "--playwright-module"])
  assert.ok(opts.get(key), `Missing ${key}`);
const repo = opts.get("--repo"),
  distro = opts.get("--wsl-distro");
assert.equal(
  path.posix.basename(repo.replaceAll("\\", "/")),
  "actions-repo",
  "Use the disposable actions-repo fixture",
);
const repoFs = distro
  ? `\\\\wsl.localhost\\${distro}${repo.replaceAll("/", "\\")}`
  : repo;
const git = (...args) =>
  distro
    ? execFileSync("wsl", ["-d", distro, "--", "git", "-C", repo, ...args], {
        encoding: "utf8",
      })
    : execFileSync("git", ["-C", repo, ...args], { encoding: "utf8" });
const write = (name, text) => fs.writeFileSync(path.join(repoFs, name), text);
let browser, debugPage;
try {
  const { chromium, request } = await import(
    pathToFileURL(path.join(opts.get("--playwright-module"), "index.mjs")).href
  );
  const startup = fs
    .readFileSync(opts.get("--dsh-log"), "utf8")
    .match(/dsh web: (http[^\s]+)/);
  assert.ok(startup, "Missing startup URL");
  const auth = new URL(startup[1]);
  assert.ok(["127.0.0.1", "localhost", "[::1]"].includes(auth.hostname));
  const base = new URL("./", auth);
  browser = await chromium.launch({
    headless: true,
    ...(process.platform === "win32" ? { channel: "msedge" } : {}),
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  debugPage = page;
  page.setDefaultTimeout(15000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(auth.href);
  await page.waitForLoadState("networkidle");
  const endpoint = (route) => new URL("api/" + route, base).href;
  async function rpc(method, args) {
    const r = await context.request.post(endpoint(method), {
      data: {
        type: "client-request",
        rpcId: randomUUID(),
        method,
        payload: { args },
      },
    });
    const b = await r.json();
    assert.ok(b.result?.ok, "Native RPC failed: " + method);
    return b.result.value;
  }
  await rpc("pluginManager/setBundleEnabled", {
    name: "dsh-git-plugin",
    enabled: true,
  });
  const created = await rpc("workspace/create", { request: { path: repo } });
  const title = "actions-verify-" + randomUUID().slice(0, 8);
  await rpc("workspace/rename", {
    request: { workspaceId: created.workspace.workspaceId, title },
  });
  await page.reload();
  await page.waitForLoadState("networkidle");
  for (const name of ["继续", "稍后配置"]) {
    const b = page.getByRole("button", { name, exact: true });
    try {
      await b.waitFor({ state: "visible", timeout: 2500 });
      await b.click();
    } catch {}
  }
  const close = page.getByRole("button", { name: "收起右侧边栏", exact: true });
  if (await close.count()) await close.click();
  await page
    .getByLabel("会话", { exact: true })
    .getByText(title, { exact: true })
    .hover();
  const creation = page.waitForResponse((r) =>
    new URL(r.url()).pathname.endsWith("/api/session/create"),
  );
  await page
    .getByRole("button", { name: `在“${title}”中新建会话`, exact: true })
    .click();
  const sessionResponse = await (await creation).json();
  const sid = sessionResponse.result.value.sessionId;
  await page.getByRole("button", { name: "打开右侧边栏", exact: true }).click();
  await page.getByRole("button", { name: /^Git/ }).click();
  const panel = page.locator("[data-git-panel]");
  await panel.locator(".gp-file").first().waitFor();
  async function refresh() {
    const r = page.waitForResponse((x) =>
      new URL(x.url()).pathname.endsWith("/api/git-panel/status"),
    );
    await panel
      .getByRole("button", { name: "刷新 Git 面板", exact: true })
      .click();
    await r;
    await page.waitForTimeout(100);
  }
  async function confirm(trigger) {
    await trigger.click();
    const dialog = panel.getByRole("dialog", { name: "确认 Git 操作" });
    await dialog.waitFor();
    const done = page.waitForResponse((r) =>
      new URL(r.url()).pathname.endsWith("/api/git-panel/execute"),
    );
    await dialog
      .getByRole("button", { name: "确认执行操作", exact: true })
      .click();
    const response = await done;
    const body = await response.json();
    assert.equal(response.status(), 200, body.error?.message);
    await dialog.waitFor({ state: "hidden" });
    await page.waitForTimeout(150);
    return body;
  }
  // Read regression and cancellation before any write.
  await panel.locator(".gp-file").filter({ hasText: "notes.txt" }).click();
  await panel.locator(".gp-patch").waitFor();
  assert.match(await panel.locator(".gp-patch").innerText(), /working/);
  await panel
    .getByRole("button", { name: "暂存全部未暂存文件", exact: true })
    .click();
  await panel.getByRole("dialog").waitFor();
  await panel.getByRole("button", { name: "取消操作", exact: true }).click();
  assert.equal(git("diff", "--cached"), "");
  await confirm(
    panel.getByRole("button", { name: "暂存全部未暂存文件", exact: true }),
  );
  assert.match(git("diff", "--cached"), /new content/);
  await confirm(
    panel.getByRole("button", { name: "取消全部暂存", exact: true }),
  );
  assert.equal(git("diff", "--cached"), "");
  await panel.locator(".gp-file").filter({ hasText: "notes.txt" }).click();
  await confirm(panel.getByRole("button", { name: "暂存此文件", exact: true }));
  await panel
    .getByRole("textbox", { name: "提交说明", exact: true })
    .fill("feat: GUI reviewed commit");
  await confirm(panel.getByRole("button", { name: "预览提交", exact: true }));
  assert.equal(git("show", "HEAD:notes.txt"), "working\n");
  assert.equal(git("ls-files", "--", "中文 space.txt"), "");
  await panel.locator("summary").click();
  await panel
    .getByRole("textbox", { name: "新分支名称", exact: true })
    .fill("feat/gui");
  await confirm(panel.getByRole("button", { name: "创建并切换", exact: true }));
  assert.equal(git("branch", "--show-current").trim(), "feat/gui");
  await panel
    .getByRole("textbox", { name: "Stash 说明", exact: true })
    .fill("GUI stash");
  await confirm(panel.getByRole("button", { name: "保存改动", exact: true }));
  assert.equal(git("status", "--porcelain"), "");
  await confirm(
    panel
      .locator(".gp-operation-details li")
      .filter({ hasText: "main" })
      .getByRole("button", { name: "切换", exact: true }),
  );
  assert.equal(git("branch", "--show-current").trim(), "main");
  await confirm(panel.getByRole("button", { name: "应用并保留", exact: true }));
  assert.equal(
    fs.readFileSync(path.join(repoFs, "中文 space.txt"), "utf8"),
    "new content\n",
  );
  assert.match(git("stash", "list"), /GUI stash/);
  await confirm(panel.getByRole("button", { name: "删除", exact: true }));
  assert.equal(git("stash", "list"), "");
  write("notes.txt", "restore original\n");
  await refresh();
  await panel.locator(".gp-file").filter({ hasText: "notes.txt" }).click();
  const restore = await confirm(
    panel.getByRole("button", { name: "备份并还原此文件", exact: true }),
  );
  assert.ok(restore.backup);
  assert.equal(
    fs.readFileSync(path.join(repoFs, "notes.txt"), "utf8"),
    "working\n",
  );
  assert.match(git("stash", "show", "-p", restore.backup), /restore original/);
  assert.ok(fs.existsSync(path.join(repoFs, "中文 space.txt")));
  await panel.getByRole("button", { name: "历史", exact: true }).click();
  await panel.getByRole("button", { name: /GUI reviewed commit/ }).click();
  await panel.locator(".gp-patch").waitFor();
  assert.match(await panel.locator(".gp-patch").innerText(), /working/);
  await panel.getByRole("button", { name: /^文件/ }).click();
  const anonymous = await request.newContext();
  try {
    assert.equal(
      (
        await anonymous.post(endpoint("git-panel/prepare"), {
          data: { sessionId: sid, action: "stage", paths: ["中文 space.txt"] },
        })
      ).status(),
      401,
    );
  } finally {
    await anonymous.dispose();
  }
  assert.equal(
    (
      await context.request.post(endpoint("git-panel/prepare"), {
        headers: { Origin: "https://evil.invalid" },
        data: { sessionId: sid, action: "stage", paths: ["中文 space.txt"] },
      })
    ).status(),
    403,
  );
  assert.equal(
    (
      await context.request.post(endpoint("git-panel/prepare"), {
        data: { sessionId: sid, action: "stage", paths: ["中文 space.txt"] },
      })
    ).status(),
    403,
  );
  for (let i = 0; i < 2; i++) {
    await rpc("pluginManager/setBundleEnabled", {
      name: "dsh-git-plugin",
      enabled: false,
    });
    await page.waitForFunction(
      () => !document.querySelector('style[data-plugin="dsh-git-plugin"]'),
    );
    assert.equal(
      (
        await context.request.get(
          endpoint("git-panel/operations") + "?sessionId=" + sid,
        )
      ).status(),
      404,
    );
    await rpc("pluginManager/setBundleEnabled", {
      name: "dsh-git-plugin",
      enabled: true,
    });
    await page.waitForFunction(
      () =>
        document.querySelectorAll('style[data-plugin="dsh-git-plugin"]')
          .length === 1,
    );
  }
  if (!(await panel.isVisible()))
    await page.getByRole("button", { name: /^Git/ }).click();
  await panel.waitFor();
  await panel.locator('.gp-repo strong').filter({hasText:'actions-repo'}).waitFor();
  await panel.locator('.gp-note').filter({hasText:'正在读取 Git…'}).waitFor({state:'hidden'});
  const details=panel.locator('.gp-operation-details');
  if(await details.getAttribute('open')===null)await details.locator('summary').click();
  await page.emulateMedia({ colorScheme: "dark" });
  await page.setViewportSize({ width: 800, height: 900 });
  if (opts.get("--screenshots")) {
    fs.mkdirSync(opts.get("--screenshots"), { recursive: true });
    await panel.screenshot({
      path: path.join(opts.get("--screenshots"), "git-actions-dark-narrow.png"),
    });
  }
  assert.deepEqual(errors, []);
  console.log(
    `PASS: installed GUI stage/unstage/commit/branches/stash/backup restore, read regression, confirmation cancel, carrier boundaries, two lifecycle cycles; browser ${browser.version()}`,
  );
} catch (error) {
  if (debugPage && opts.get("--screenshots")) {
    fs.mkdirSync(opts.get("--screenshots"), { recursive: true });
    fs.writeFileSync(
      path.join(opts.get("--screenshots"), "failure.txt"),
      await debugPage.locator("body").innerText(),
    );
    await debugPage.screenshot({
      path: path.join(opts.get("--screenshots"), "failure.png"),
    });
  }
  console.error(
    String(error.message).replace(/https?:\/\/[^\s]+/g, "[URL redacted]"),
  );
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
}
