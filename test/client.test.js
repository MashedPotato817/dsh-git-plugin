import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import React, { act } from "react";
import * as jsx from "react/jsx-runtime";
import { createRoot } from "react-dom/client";
import { JSDOM } from "jsdom";

test("client registers cleanly, renders safe text, aborts old session requests and removes styles", async (t) => {
  const dom = new JSDOM(
    '<!doctype html><html><head></head><body><div id="root"></div></body></html>',
    { url: "http://localhost/" },
  );
  const previous = {
    window: globalThis.window,
    document: globalThis.document,
    fetch: globalThis.fetch,
    act: globalThis.IS_REACT_ACT_ENVIRONMENT,
  };
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  t.after(() => {
    globalThis.window = previous.window;
    globalThis.document = previous.document;
    globalThis.fetch = previous.fetch;
    globalThis.IS_REACT_ACT_ENVIRONMENT = previous.act;
    dom.window.close();
  });
  let client;
  window.__ModuleLoader__ = {
    load: (definition) => {
      assert.equal(definition.id, "dsh-git-plugin");
      client = definition.factory((name) =>
        name === "react"
          ? React
          : name === "react/jsx-runtime"
            ? jsx
            : assert.fail("Unexpected external " + name),
      );
    },
  };
  vm.runInThisContext(
    fs.readFileSync(new URL("../lib/client.js", import.meta.url), "utf8"),
  );
  const cleanups = [];
  const definitions = [];
  const slots = [];
  const ctx = {
    effect: (fn) => {
      const dispose = fn();
      if (dispose) cleanups.push(dispose);
    },
    sidebarRightTabs: {
      register: (def) => {
        definitions.push(def);
        return () => definitions.pop();
      },
    },
    slots: {
      inject: (_name, fn) => fn(),
      register: (options, component) => {
        slots.push({ options, component });
        return () => slots.pop();
      },
    },
  };
  client.apply(ctx);
  assert.equal(definitions.length, 1);
  assert.equal(slots.length, 1);
  assert.equal(
    document.querySelectorAll('style[data-plugin="dsh-git-plugin"]').length,
    1,
  );
  const slow = [];
  let pause = false;
  const requests = [];
  globalThis.fetch = (url, { signal, method, body }) => {
    const address = new URL(url);
    requests.push({ address, signal, method, body });
    if (address.pathname.endsWith("/prepare"))
      return Promise.resolve(
        Response.json({
          token: "preview-token",
          root: "/repo",
          branch: "main",
          paths: ["x"],
          description: "Review first",
          preview: "+safe",
          input: JSON.parse(body),
          destructive: false,
        }),
      );
    if (address.pathname.endsWith("/execute"))
      return Promise.resolve(Response.json({ ok: true, message: "done" }));
    if (pause)
      return new Promise((resolve) => slow.push({ resolve, signal, address }));
    const value = address.pathname.endsWith("/status")
      ? {
          root: "/repo",
          branch: "main",
          head: "a".repeat(40),
          files: [
            {
              path: "<img src=x onerror=alert(1)>.txt",
              index: "M",
              worktree: "M",
              conflict: false,
              untracked: false,
            },
          ],
          truncated: false,
        }
      : address.pathname.endsWith("/diff")
        ? {
            path: "x",
            side: "staged",
            text: "+<script>unsafe</script>",
            binary: false,
            truncated: false,
            untracked: false,
          }
        : { entries: [], hasMore: false, skip: 0, truncated: false };
    return Promise.resolve(Response.json(value));
  };
  const abort = new AbortController();
  const info = () => ({ tab: { signal: abort.signal } });
  const root = createRoot(document.getElementById("root"));
  await act(async () => {
    root.render(
      React.createElement(slots[0].component, {
        sessionId: "first",
        useTabInfo: info,
      }),
    );
  });
  assert.match(document.body.textContent, /<img src=x/);
  assert.equal(document.querySelector("img"), null);
  const rows = document.querySelectorAll(".gp-file");
  assert.equal(rows.length, 2, "same file appears in each diff side");
  await act(async () => {
    rows[0].click();
  });
  assert.match(document.body.textContent, /<script>unsafe/);
  assert.equal(document.querySelector("script"), null);
  const stage = document.querySelector('[aria-label="暂存全部未暂存文件"]');
  assert.ok(stage, "GUI exposes staging");
  await act(async () => stage.click());
  assert.ok(document.querySelector('[role="dialog"]'));
  assert.equal(
    requests.filter((r) => r.address.pathname.endsWith("/execute")).length,
    0,
  );
  await act(async () =>
    document.querySelector('[aria-label="取消操作"]').click(),
  );
  assert.equal(document.querySelector('[role="dialog"]'), null);
  await act(async () => stage.click());
  const actionRoot=document.querySelector(".gp-actions");
  await act(async () =>
    document.querySelector('[aria-label="确认执行操作"]').click(),
  );
  assert.equal(document.querySelector(".gp-actions") === actionRoot, true,"refresh preserves operation controls");
  const executed = requests.filter((r) =>
    r.address.pathname.endsWith("/execute"),
  );
  assert.equal(executed.length, 1);
  assert.deepEqual(JSON.parse(executed[0].body), {
    sessionId: "first",
    token: "preview-token",
    confirm: true,
  });
  await act(async () =>
    document.querySelector('[aria-label="暂存全部未暂存文件"]').click(),
  );
  pause = true;
  await act(async () => {
    document.querySelector('[aria-label="刷新 Git 面板"]').click();
  });
  const firstSlow = slow[0];
  assert.ok(firstSlow);
  await act(async () => {
    root.render(
      React.createElement(slots[0].component, {
        sessionId: "second",
        useTabInfo: info,
      }),
    );
  });
  assert.equal(firstSlow.signal.aborted, true);
  assert.equal(
    document.querySelector('[role="dialog"]'),
    null,
    "Session navigation drops previous confirmation",
  );
  await act(async () => {
    firstSlow.resolve(
      Response.json({
        root: "/stale",
        branch: "STALE",
        files: [],
        head: null,
        truncated: false,
      }),
    );
  });
  assert.doesNotMatch(document.body.textContent, /STALE/);
  await act(async () => {
    await root.unmount();
  });
  assert.ok(slow.every((item) => item.signal.aborted));
  for (const cleanup of cleanups.reverse()) await cleanup();
  assert.equal(
    document.querySelectorAll('style[data-plugin="dsh-git-plugin"]').length,
    0,
  );
  assert.equal(slots.length, 0);
  assert.equal(definitions.length, 0);
  client.apply(ctx);
  assert.equal(definitions.length, 1);
  assert.equal(slots.length, 1);
  for (const cleanup of cleanups.reverse()) await cleanup();
  assert.equal(
    document.querySelectorAll('style[data-plugin="dsh-git-plugin"]').length,
    0,
  );
});
