import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { apply } from "../../lib/index.js";
export function git(repo, ...args) {
  const result = spawnSync("git", args, { cwd: repo, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout;
}
export function repoFor(t, empty = false) {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), "dsh-panel-test-"));
  t.after(() => fs.rmSync(repo, { recursive: true, force: true }));
  git(repo, "init", "-b", "main");
  git(repo, "config", "core.autocrlf", "false");
  git(repo, "config", "user.name", "Test");
  git(repo, "config", "user.email", "test@example.com");
  if (!empty) {
    fs.writeFileSync(path.join(repo, "a.txt"), "first\n" + "keep\n".repeat(10));
    git(repo, "add", "a.txt");
    git(repo, "commit", "-m", "Initial");
  }
  return repo;
}
export async function mount(t, repo, config = {}) {
  const routes = new Map();
  const cleanups = [];
  const calls = [];
  const root = path.resolve(repo);
  let alive = true;
  const ctx = {
    commands: { register() {} },
    tools: { register() {} },
    systemPrompt: { section() {} },
    sessions: {
      get: (id) => (id === "live" ? { header: { cwd: repo } } : undefined),
    },
    sessionPersistence: {
      stat: async (id) =>
        id === "stored" ? { header: { cwd: repo } } : undefined,
    },
    fs: {
      resolve: async (value) => fs.realpathSync(value),
      processPath: (value) => value,
      stat: async (value) => {
        const s = fs.statSync(value);
        return { type: s.isDirectory() ? "directory" : "file", size: s.size };
      },
      lstat: async (value) => {
        if (!fs.existsSync(value)) return undefined;
        const s = fs.lstatSync(value);
        return {
          type: s.isSymbolicLink()
            ? "symlink"
            : s.isFile()
              ? "file"
              : "directory",
        };
      },
      contains: (a, b) => b === a || b.startsWith(a + path.sep),
      readBytes: async (value, signal, maxBytes) => {
        signal.throwIfAborted();
        const b = fs.readFileSync(value);
        assert.ok(b.length <= maxBytes);
        return b;
      },
    },
    connection: {
      fetch: {
        register: (route) => {
          assert.ok(!routes.has(route.path));
          routes.set(route.path, route);
          const remove = () => {
            routes.delete(route.path);
          };
          cleanups.push(remove);
          return remove;
        },
      },
    },
    effect: (fn) => {
      const dispose = fn();
      if (dispose) cleanups.push(dispose);
    },
    inject: (_deps, callback) => callback(ctx),
    subprocess: {
      spawn: (spec) => {
        calls.push(spec.argv);
        const files = fs.mkdtempSync(path.join(os.tmpdir(), "dsh-panel-out-"));
        const stdout = path.join(files, "out"),
          stderr = path.join(files, "err");
        const fds = [fs.openSync(stdout, "w"), fs.openSync(stderr, "w")];
        const result = spawnSync(spec.argv[0], spec.argv.slice(1), {
          cwd: spec.cwd,
          stdio: ["ignore", ...fds],
        });
        fds.forEach((fd) => fs.closeSync(fd));
        const read = (file, max) => {
          const bytes = fs.readFileSync(file);
          return {
            text: bytes.subarray(0, max).toString("utf8"),
            lossy: bytes.length > max,
          };
        };
        const output = read(stdout, spec.stdio.stdout.maxBytes),
          errors = read(stderr, spec.stdio.stderr.maxBytes);
        fs.rmSync(files, { recursive: true, force: true });
        return {
          done: Promise.resolve({
            exitCode: result.status,
            signal: result.signal,
          }),
          collected: {
            stdout: { readFrom: () => output },
            stderr: { readFrom: () => errors },
          },
        };
      },
    },
  };
  await apply(ctx, config);
  const dispose = async () => {
    if (!alive) return;
    alive = false;
    for (const cleanup of cleanups.reverse()) await cleanup();
  };
  t.after(dispose);
  return {
    ctx,
    routes,
    calls,
    root,
    dispose,
    async post(route, body, headers = {}) {
      const handler = routes.get("/api/git-panel/" + route);
      if (!handler) return { status: 404 };
      const response = await handler.fetch(
        new Request("http://dsh.internal/api/git-panel/" + route, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            host: "localhost",
            origin: "http://localhost",
            ...headers,
          },
          body: JSON.stringify(body),
        }),
      );
      return { status: response.status, body: await response.json() };
    },
    async request(route, params = {}, id = "live") {
      const handler = routes.get("/api/git-panel/" + route);
      if (!handler) return { status: 404 };
      const query = new URLSearchParams({ sessionId: id, ...params });
      const response = await handler.fetch(
        new Request("http://localhost/api/git-panel/" + route + "?" + query),
      );
      return { status: response.status, body: await response.json() };
    },
  };
}
