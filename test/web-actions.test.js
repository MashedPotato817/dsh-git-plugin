import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { git, repoFor, mount } from "./support/panel-fixture.js";
async function prepared(panel, action, args = {}) {
  const r = await panel.post("prepare", { sessionId: "live", action, ...args });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  return r.body;
}
async function execute(panel, p, extra = {}) {
  return panel.post("execute", {
    sessionId: "live",
    token: p.token,
    confirm: true,
    ...extra,
  });
}
test("stage requires explicit single-use confirmation and unstage retains worktree", async (t) => {
  const repo = repoFor(t);
  fs.writeFileSync(path.join(repo, "a.txt"), "changed\n");
  const panel = await mount(t, repo);
  const p = await prepared(panel, "stage", { paths: ["a.txt"] });
  assert.equal(git(repo, "diff", "--cached"), "");
  assert.equal((await execute(panel, p, { confirm: false })).status, 400);
  assert.equal(git(repo, "diff", "--cached"), "");
  assert.equal((await execute(panel, p)).status, 200);
  assert.match(git(repo, "diff", "--cached"), /changed/);
  assert.equal((await execute(panel, p)).status, 409);
  const undo = await prepared(panel, "unstage", { paths: ["a.txt"] });
  assert.equal((await execute(panel, undo)).status, 200);
  assert.equal(git(repo, "diff", "--cached"), "");
  assert.equal(fs.readFileSync(path.join(repo, "a.txt"), "utf8"), "changed\n");
});
test("preview binding rejects working content, index and Session changes", async (t) => {
  const repo = repoFor(t);
  fs.writeFileSync(path.join(repo, "a.txt"), "one\n");
  const panel = await mount(t, repo);
  const p = await prepared(panel, "stage", { paths: ["a.txt"] });
  fs.writeFileSync(path.join(repo, "a.txt"), "two\n");
  assert.equal((await execute(panel, p)).status, 409);
  assert.equal(git(repo, "diff", "--cached"), "");
  const p2 = await prepared(panel, "stage", { paths: ["a.txt"] });
  assert.equal((await execute(panel, p2, { sessionId: "stored" })).status, 409);
  assert.equal(git(repo, "diff", "--cached"), "");
  const p3 = await prepared(panel, "stage", { paths: ["a.txt"] });
  git(repo, "add", "a.txt");
  assert.equal((await execute(panel, p3)).status, 409);
});
test("unborn index and exact Chinese paths support stage/unstage", async (t) => {
  const repo = repoFor(t, true);
  const name = "中文 space.txt";
  fs.writeFileSync(path.join(repo, name), "initial\n");
  const panel = await mount(t, repo);
  const p = await prepared(panel, "stage", { paths: [name] });
  assert.equal((await execute(panel, p)).status, 200);
  assert.match(git(repo, "ls-files"), /txt/);
  const u = await prepared(panel, "unstage", { paths: [name] });
  assert.equal((await execute(panel, u)).status, 200);
  assert.equal(git(repo, "ls-files"), "");
  assert.ok(fs.existsSync(path.join(repo, name)));
});
test("GUI commit includes only reviewed index and honors failed preCommit", async (t) => {
  const repo = repoFor(t);
  fs.writeFileSync(path.join(repo, "a.txt"), "index\n");
  git(repo, "add", "a.txt");
  fs.writeFileSync(path.join(repo, "a.txt"), "worktree\n");
  const panel = await mount(t, repo);
  const p = await prepared(panel, "commit", { message: "feat: reviewed" });
  assert.equal((await execute(panel, p)).status, 200);
  assert.equal(git(repo, "show", "HEAD:a.txt"), "index\n");
  assert.equal(fs.readFileSync(path.join(repo, "a.txt"), "utf8"), "worktree\n");
  git(repo, "add", "a.txt");
  const denied = await mount(t, repo, {
    preCommit: [process.execPath, "-e", "process.exit(9)"],
  });
  const old = git(repo, "rev-parse", "HEAD");
  const q = await prepared(denied, "commit", { message: "must fail" });
  assert.equal((await execute(denied, q)).status, 409);
  assert.equal(git(repo, "rev-parse", "HEAD"), old);
});
test("branch create/switch and stash save/apply/drop use reviewed identities", async (t) => {
  const repo = repoFor(t);
  const panel = await mount(t, repo);
  assert.equal(
    (
      await execute(
        panel,
        await prepared(panel, "branch-create", { branch: "feat/gui" }),
      )
    ).status,
    200,
  );
  assert.equal(git(repo, "branch", "--show-current").trim(), "feat/gui");
  assert.equal(
    (
      await execute(
        panel,
        await prepared(panel, "branch-switch", { branch: "main" }),
      )
    ).status,
    200,
  );
  fs.writeFileSync(path.join(repo, "a.txt"), "stashed\n");
  fs.writeFileSync(path.join(repo, "new.txt"), "new\n");
  assert.equal(
    (
      await execute(
        panel,
        await prepared(panel, "stash-save", { message: "GUI snapshot" }),
      )
    ).status,
    200,
  );
  assert.equal(git(repo, "status", "--porcelain"), "");
  const list = await panel.request("operations");
  assert.equal(list.status, 200);
  const stash = list.body.stashes[0];
  assert.ok(stash.sha);
  assert.equal(
    (
      await execute(
        panel,
        await prepared(panel, "stash-apply", { sha: stash.sha }),
      )
    ).status,
    200,
  );
  assert.equal(fs.readFileSync(path.join(repo, "new.txt"), "utf8"), "new\n");
  assert.match(git(repo, "stash", "list"), /GUI snapshot/);
  assert.equal(
    (
      await execute(
        panel,
        await prepared(panel, "stash-drop", { sha: stash.sha }),
      )
    ).status,
    200,
  );
  assert.equal(git(repo, "stash", "list"), "");
});
test("tracked restore saves a recoverable stash and preserves index/untracked", async (t) => {
  const repo = repoFor(t);
  fs.writeFileSync(path.join(repo, "a.txt"), "indexed\n");
  git(repo, "add", "a.txt");
  fs.writeFileSync(path.join(repo, "a.txt"), "original worktree\n");
  fs.writeFileSync(path.join(repo, "new.txt"), "keep\n");
  const index = git(repo, "diff", "--cached");
  const panel = await mount(t, repo);
  const p = await prepared(panel, "restore", { paths: ["a.txt"] });
  assert.equal((await execute(panel, p)).status, 200);
  assert.equal(fs.readFileSync(path.join(repo, "a.txt"), "utf8"), "indexed\n");
  assert.equal(git(repo, "diff", "--cached"), index);
  assert.ok(fs.existsSync(path.join(repo, "new.txt")));
  assert.match(
    git(repo, "stash", "show", "-p", "stash@{0}"),
    /original worktree/,
  );
});
test("write boundary refuses Origin, arbitrary args, traversal and unknown Sessions", async (t) => {
  const panel = await mount(t, repoFor(t));
  assert.equal(
    (
      await panel.post(
        "prepare",
        { sessionId: "live", action: "stage", paths: ["a.txt"] },
        { origin: "http://evil.test" },
      )
    ).status,
    403,
  );
  for (const data of [
    { sessionId: "missing", action: "stage", paths: ["a.txt"] },
    { sessionId: "live", action: "stage", paths: ["../outside"] },
    { sessionId: "live", action: "stage", paths: [".git/config"] },
    { sessionId: "live", action: "branch-create", branch: "--output=file" },
    {
      sessionId: "live",
      action: "commit",
      message: "x",
      argv: ["git", "reset", "--hard"],
    },
  ])
    assert.ok((await panel.post("prepare", data)).status >= 400);
  assert.equal(
    (
      await panel.post("execute", {
        sessionId: "live",
        token: "invented",
        confirm: true,
      })
    ).status,
    409,
  );
});
test("disable removes reads/writes and invalidates pending confirmation", async (t) => {
  const repo = repoFor(t);
  fs.writeFileSync(path.join(repo, "a.txt"), "changed\n");
  const panel = await mount(t, repo);
  await prepared(panel, "stage", { paths: ["a.txt"] });
  await panel.dispose();
  assert.equal(panel.routes.size, 0);
  assert.equal(git(repo, "diff", "--cached"), "");
});

test("same-size untracked edits and Session root drift invalidate confirmation", async (t) => {
  const repo = repoFor(t),
    other = repoFor(t);
  fs.writeFileSync(path.join(repo, "new.txt"), "one");
  const panel = await mount(t, repo);
  const p = await prepared(panel, "stage", { paths: ["new.txt"] });
  fs.writeFileSync(path.join(repo, "new.txt"), "two");
  assert.equal((await execute(panel, p)).status, 409);
  assert.equal(git(repo, "diff", "--cached"), "");
  const q = await prepared(panel, "stage", { paths: ["new.txt"] });
  panel.ctx.sessions.get = () => ({ header: { cwd: other } });
  assert.equal((await execute(panel, q)).status, 409);
  assert.equal(git(other, "diff", "--cached"), "");
});
test("rename and option-shaped filenames use literal paths", async (t) => {
  const repo = repoFor(t);
  git(repo, "mv", "a.txt", "renamed.txt");
  const panel = await mount(t, repo);
  assert.equal(
    (
      await execute(
        panel,
        await prepared(panel, "unstage", { paths: ["renamed.txt"] }),
      )
    ).status,
    200,
  );
  assert.equal(git(repo, "diff", "--cached"), "");
  fs.writeFileSync(path.join(repo, "--output=owned"), "literal");
  assert.equal(
    (
      await execute(
        panel,
        await prepared(panel, "stage", { paths: ["--output=owned"] }),
      )
    ).status,
    200,
  );
  assert.match(git(repo, "ls-files"), /--output=owned/);
  assert.equal(fs.existsSync(path.join(repo, "owned")), false);
});
test("preCommit changing the index forces a new preview", async (t) => {
  const repo = repoFor(t);
  fs.writeFileSync(path.join(repo, "a.txt"), "reviewed");
  git(repo, "add", "a.txt");
  fs.writeFileSync(path.join(repo, "new.txt"), "hook added");
  const panel = await mount(t, repo, { preCommit: ["git", "add", "new.txt"] }),
    old = git(repo, "rev-parse", "HEAD");
  const result = await execute(
    panel,
    await prepared(panel, "commit", { message: "reviewed" }),
  );
  assert.equal(result.status, 409);
  assert.equal(result.body.error.code, "changed");
  assert.equal(git(repo, "rev-parse", "HEAD"), old);
});
test("stash apply conflict retains the stash and rejects unresolved commit", async (t) => {
  const repo = repoFor(t);
  fs.writeFileSync(path.join(repo, "a.txt"), "stashed\n");
  git(repo, "stash", "push", "-m", "retain conflict");
  fs.writeFileSync(path.join(repo, "a.txt"), "committed conflict\n");
  git(repo, "add", "a.txt");
  git(repo, "commit", "-m", "conflicting edit");
  const panel = await mount(t, repo),
    sha = git(repo, "rev-parse", "refs/stash").trim();
  assert.equal(
    (await execute(panel, await prepared(panel, "stash-apply", { sha })))
      .status,
    409,
  );
  assert.equal(git(repo, "rev-parse", "refs/stash").trim(), sha);
  assert.match(git(repo, "status", "--porcelain"), /UU/);
  assert.equal(
    (
      await panel.post("prepare", {
        sessionId: "live",
        action: "commit",
        message: "blocked",
      })
    ).body.error.code,
    "conflict",
  );
});
test("write mutation lock, disable and deadline abort in-flight execution", async (t) => {
  for (const kind of ["disable", "timeout"])
    await t.test(kind, async (t) => {
      const repo = repoFor(t);
      fs.writeFileSync(path.join(repo, "a.txt"), "changed");
      const panel = await mount(t, repo, { timeoutMs: 200, graceMs: 10 });
      const first = await prepared(panel, "stage", { paths: ["a.txt"] }),
        second = await prepared(panel, "stage", { paths: ["a.txt"] });
      const spawn = panel.ctx.subprocess.spawn;
      let entered, childSignal;
      const ready = new Promise((resolve) => (entered = resolve));
      panel.ctx.subprocess.spawn = (spec) => {
        if (!spec.argv.includes("add")) return spawn(spec);
        childSignal = spec.signal;
        entered();
        return {
          done: new Promise((resolve) =>
            spec.signal.addEventListener(
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
      const pending = execute(panel, first);
      await ready;
      if (kind === "disable") {
        assert.equal((await execute(panel, second)).body.error.code, "busy");
        await panel.dispose();
      }
      assert.equal((await pending).status, kind === "disable" ? 499 : 504);
      assert.equal(childSignal.aborted, true);
      assert.equal(git(repo, "diff", "--cached"), "");
    });
});
