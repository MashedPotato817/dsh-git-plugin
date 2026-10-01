// Generated from src/client; do not edit.
window.__ModuleLoader__.load({id:"dsh-git-plugin",factory(require){
const module={exports:{}};const exports=module.exports;
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.tsx
var index_exports = {};
__export(index_exports, {
  GitPanel: () => GitPanel,
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);
var import_react = require("react");

// src/client/panel.css
var panel_default = '[data-git-panel] {\n	--gp-line: var(--dsw-alias-border-l3, #dadde3);\n	--gp-muted: var(--dsw-alias-label-secondary, #747b88);\n	--gp-accent: #c06a37;\n	--gp-add: #298253;\n	--gp-delete: #bc4a4a;\n	--gp-hunk: #5585b0;\n	--gp-warning: #aa7431;\n	--gp-surface: var(--dsw-alias-bg-layer-2, #f5f6f8);\n	display: flex;\n	flex-direction: column;\n	min-height: 0;\n	height: 100%;\n	color: var(--dsw-alias-label-primary, #243044);\n	font-size: 13px;\n	line-height: 1.5;\n	font-family: var(--dsh-content-font-family, inherit);\n}\n[data-git-panel] * {\n	box-sizing: border-box;\n}\n[data-git-panel] button {\n	color: inherit;\n	font: inherit;\n	cursor: pointer;\n	background: none;\n	border: 0;\n}\n[data-git-panel] button:focus-visible {\n	outline: 2px solid var(--gp-accent);\n	outline-offset: -2px;\n}\n[data-git-panel] button:disabled {\n	opacity: 0.45;\n	cursor: default;\n}\n.gp-head {\n	display: flex;\n	align-items: center;\n	gap: 12px;\n	padding: 12px 14px;\n	border-bottom: 1px solid var(--gp-line);\n}\n.gp-brand {\n	color: var(--gp-accent);\n	font-weight: 800;\n	font-size: 19px;\n	letter-spacing: -1px;\n}\n.gp-repo {\n	min-width: 0;\n	flex: 1;\n}\n.gp-repo strong {\n	display: block;\n	overflow: hidden;\n	text-overflow: ellipsis;\n	white-space: nowrap;\n}\n.gp-branch {\n	color: var(--gp-muted);\n	font:\n		11px/1.5 ui-monospace,\n		Consolas,\n		monospace;\n	overflow: hidden;\n	text-overflow: ellipsis;\n	white-space: nowrap;\n}\n.gp-refresh {\n	padding: 6px 8px !important;\n	border: 1px solid var(--gp-line) !important;\n	border-radius: 5px;\n}\n.gp-nav {\n	display: flex;\n	gap: 16px;\n	border-bottom: 1px solid var(--gp-line);\n	padding: 0 14px;\n}\n.gp-nav button {\n	padding: 10px 0 !important;\n	border-bottom: 2px solid transparent !important;\n}\n.gp-nav button[aria-pressed="true"] {\n	border-color: var(--gp-accent) !important;\n	font-weight: 700;\n}\n.gp-body {\n	overflow: auto;\n	min-height: 0;\n	flex: 1;\n}\n.gp-note {\n	padding: 20px 16px;\n	color: var(--gp-muted);\n}\n.gp-error {\n	border-left: 3px solid #cc5656;\n	margin: 12px;\n	background: var(--gp-surface);\n	padding: 10px;\n	white-space: pre-wrap;\n	overflow-wrap: anywhere;\n}\n.gp-group h3 {\n	margin: 0;\n	padding: 12px 14px 6px;\n	font-size: 11px;\n	letter-spacing: 0.04em;\n	color: var(--gp-muted);\n}\n.gp-count {\n	float: right;\n	font:\n		11px ui-monospace,\n		Consolas,\n		monospace;\n}\n.gp-files {\n	list-style: none;\n	margin: 0;\n	padding: 0;\n}\n.gp-file {\n	display: flex;\n	align-items: flex-start;\n	gap: 10px;\n	width: 100%;\n	text-align: left;\n	padding: 8px 14px !important;\n}\n.gp-file:hover,\n.gp-file[aria-pressed="true"] {\n	background: var(--gp-surface);\n}\n.gp-code {\n	color: var(--gp-accent);\n	font:\n		12px ui-monospace,\n		Consolas,\n		monospace;\n	min-width: 16px;\n}\n.gp-file-path {\n	white-space: pre-wrap;\n	overflow-wrap: anywhere;\n}\n.gp-old {\n	display: block;\n	font-size: 11px;\n	color: var(--gp-muted);\n}\n.gp-detail {\n	border-top: 1px solid var(--gp-line);\n}\n.gp-detail-head {\n	position: sticky;\n	top: 0;\n	display: flex;\n	gap: 10px;\n	align-items: center;\n	padding: 10px 14px;\n	background: var(--gp-surface);\n}\n.gp-detail-title {\n	min-width: 0;\n	flex: 1;\n	font:\n		12px ui-monospace,\n		Consolas,\n		monospace;\n	white-space: pre-wrap;\n	overflow-wrap: anywhere;\n}\n.gp-tag {\n	font-size: 10px;\n	color: var(--gp-muted);\n	text-transform: uppercase;\n}\n.gp-patch {\n	margin: 0;\n	padding: 8px 0 14px;\n	font:\n		12px/1.65 ui-monospace,\n		SFMono-Regular,\n		Consolas,\n		monospace;\n	overflow: auto;\n	tab-size: 4;\n}\n.gp-line {\n	display: block;\n	white-space: pre;\n	min-width: max-content;\n	padding: 0 14px;\n}\n.gp-line-add {\n	background: rgba(40, 160, 93, 0.1);\n	color: var(--gp-add);\n}\n.gp-line-del {\n	background: rgba(201, 61, 61, 0.1);\n	color: var(--gp-delete);\n}\n.gp-line-hunk {\n	background: rgba(71, 130, 195, 0.08);\n	color: var(--gp-hunk);\n}\n.gp-history {\n	list-style: none;\n	margin: 0;\n	padding: 0;\n}\n.gp-commit {\n	display: block;\n	text-align: left;\n	width: 100%;\n	padding: 12px 14px !important;\n	border-bottom: 1px solid var(--gp-line) !important;\n}\n.gp-subject {\n	display: block;\n	overflow-wrap: anywhere;\n}\n.gp-meta {\n	display: flex;\n	gap: 8px;\n	flex-wrap: wrap;\n	margin-top: 5px;\n	font-size: 11px;\n	color: var(--gp-muted);\n}\n.gp-sha {\n	color: var(--gp-accent);\n	font-family: ui-monospace, Consolas, monospace;\n}\n.gp-pager {\n	display: flex;\n	justify-content: space-between;\n	padding: 12px 14px;\n}\n.gp-footer {\n	padding: 7px 14px;\n	border-top: 1px solid var(--gp-line);\n	color: var(--gp-muted);\n	font-size: 10px;\n	letter-spacing: 0.04em;\n}\n.gp-warning {\n	padding: 8px 14px;\n	color: var(--gp-warning);\n	background: var(--gp-surface);\n}\n\n/* The shell publishes this attribute when its active palette is dark. */\nbody[data-ds-dark-theme] [data-git-panel] {\n	--gp-accent: #e09e72;\n	--gp-add: #75d29b;\n	--gp-delete: #f39090;\n	--gp-hunk: #96c4ed;\n	--gp-warning: #e4b875;\n}\n';

// src/client/index.tsx
var import_jsx_runtime = require("react/jsx-runtime");
var inject = ["slots", "sidebarRightTabs"];
var ID = "dsh-git-plugin";
var labels = {
  files: "\u6587\u4EF6",
  history: "\u5386\u53F2",
  refresh: "\u5237\u65B0",
  staged: "\u5DF2\u6682\u5B58",
  unstaged: "\u672A\u6682\u5B58",
  untracked: "\u672A\u8DDF\u8E2A",
  conflict: "\u51B2\u7A81"
};
function useRead(sessionId, route, params, revision, signal) {
  const [state, setState] = (0, import_react.useState)({ busy: false });
  const key = JSON.stringify(params);
  const identity = JSON.stringify([sessionId, route, key, revision]);
  (0, import_react.useEffect)(() => {
    const abort = new AbortController();
    const requestSignal = AbortSignal.any([abort.signal, signal]);
    if (route === null) {
      setState({ busy: false, key: identity });
      return () => abort.abort();
    }
    setState({ busy: true, key: identity });
    const query = new URLSearchParams({
      sessionId,
      ...JSON.parse(key)
    });
    const url = new URL(
      `api/git-panel/${route}`,
      new URL("./", document.baseURI)
    );
    url.search = query.toString();
    void fetch(url, {
      signal: requestSignal,
      credentials: "same-origin",
      cache: "no-store"
    }).then(async (response) => {
      const body = await response.json();
      if (!response.ok)
        throw new Error(
          body.error?.message ?? `\u8BF7\u6C42\u5931\u8D25 (${response.status})`
        );
      if (!requestSignal.aborted)
        setState({ busy: false, value: body, key: identity });
    }).catch((error) => {
      if (!requestSignal.aborted)
        setState({
          busy: false,
          error: error instanceof Error ? error.message : "\u8BFB\u53D6\u5931\u8D25\u3002",
          key: identity
        });
    });
    return () => abort.abort();
  }, [sessionId, route, key, revision, signal, identity]);
  return state.key === identity ? state : { busy: route !== null };
}
function Notice({ state }) {
  if (state.busy)
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "gp-note", role: "status", children: "\u6B63\u5728\u8BFB\u53D6 Git\u2026" });
  if (state.error)
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "gp-error", role: "alert", children: state.error });
  return null;
}
function Patch({ text }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", { className: "gp-patch", children: text.split("\n").map((line, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "span",
    {
      className: `gp-line ${line.startsWith("+") && !line.startsWith("+++") ? "gp-line-add" : line.startsWith("-") && !line.startsWith("---") ? "gp-line-del" : line.startsWith("@@") ? "gp-line-hunk" : ""}`,
      children: line || " "
    },
    i
  )) });
}
function GitPanel({ sessionId, useTabInfo }) {
  const { tab } = useTabInfo();
  const [mode, setMode] = (0, import_react.useState)("files");
  const [revision, setRevision] = (0, import_react.useState)(0);
  const [skip, setSkip] = (0, import_react.useState)(0);
  const [selection, setSelection] = (0, import_react.useState)(null);
  (0, import_react.useEffect)(() => {
    setSelection(null);
    setSkip(0);
  }, [sessionId]);
  const status = useRead(
    sessionId,
    "status",
    {},
    revision,
    tab.signal
  );
  const history = useRead(
    sessionId,
    mode === "history" ? "log" : null,
    { count: "30", skip: String(skip) },
    revision,
    tab.signal
  );
  const detailRoute = selection ? "sha" in selection ? "show" : "diff" : null;
  const detailParams = selection ? "sha" in selection ? { sha: selection.sha } : { path: selection.path, side: selection.side } : {};
  const detail = useRead(
    sessionId,
    detailRoute,
    detailParams,
    revision,
    tab.signal
  );
  const files = status.value?.files ?? [];
  const groups = [
    {
      label: labels.conflict,
      side: "unstaged",
      files: files.filter((f) => f.conflict)
    },
    {
      label: labels.staged,
      side: "staged",
      files: files.filter(
        (f) => !f.conflict && !f.untracked && f.index !== " "
      )
    },
    {
      label: labels.unstaged,
      side: "unstaged",
      files: files.filter(
        (f) => !f.conflict && !f.untracked && f.worktree !== " "
      )
    },
    {
      label: labels.untracked,
      side: "unstaged",
      files: files.filter((f) => f.untracked)
    }
  ];
  const switchMode = (next) => {
    setMode(next);
    setSelection(null);
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { "data-git-panel": "", "aria-label": "Git \u9762\u677F", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { className: "gp-head", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "gp-brand", "aria-hidden": "true", children: "git." }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "gp-repo", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { title: status.value?.root, children: status.value?.root.split(/[\\/]/).pop() ?? "\u5F53\u524D\u4ED3\u5E93" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "gp-branch", title: status.value?.branch, children: status.value?.branch ?? "\u4F1A\u8BDD\u5DE5\u4F5C\u76EE\u5F55" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "button",
        {
          type: "button",
          className: "gp-refresh",
          "aria-label": "\u5237\u65B0 Git \u9762\u677F",
          onClick: () => {
            setSelection(null);
            setRevision((n) => n + 1);
          },
          children: "\u21BB"
        }
      )
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", { className: "gp-nav", "aria-label": "Git \u89C6\u56FE", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
        "button",
        {
          type: "button",
          "aria-pressed": mode === "files",
          onClick: () => switchMode("files"),
          children: [
            labels.files,
            " ",
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "gp-count", children: status.value?.files.length ?? "\u2014" })
          ]
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "button",
        {
          type: "button",
          "aria-pressed": mode === "history",
          onClick: () => switchMode("history"),
          children: labels.history
        }
      )
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "gp-body", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Notice, { state: status }),
      mode === "files" && status.value && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: files.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "gp-note", children: "\u5DE5\u4F5C\u533A\u5E72\u51C0" }) : groups.filter((g) => g.files.length).map((group) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { className: "gp-group", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", { children: [
          group.label,
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "gp-count", children: group.files.length })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { className: "gp-files", children: group.files.map((file) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
          "button",
          {
            type: "button",
            className: "gp-file",
            "aria-pressed": selection !== null && "path" in selection && selection.path === file.path && selection.side === group.side,
            onClick: () => setSelection({
              path: file.path,
              side: group.side
            }),
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "gp-code", children: file.untracked ? "?" : file.conflict ? "!" : group.side === "staged" ? file.index : file.worktree }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "gp-file-path", children: [
                file.path,
                file.oldPath && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "gp-old", children: [
                  "\u2190 ",
                  file.oldPath
                ] })
              ] })
            ]
          }
        ) }, file.path)) })
      ] }, group.label)) }),
      mode === "history" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Notice, { state: history }),
        history.value && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
          history.value.entries.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "gp-note", children: "\u6682\u65E0\u63D0\u4EA4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { className: "gp-history", children: history.value.entries.map((commit) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
            "button",
            {
              type: "button",
              className: "gp-commit",
              onClick: () => setSelection({ sha: commit.sha }),
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "gp-subject", children: commit.subject }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "gp-meta", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "gp-sha", children: commit.short }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: commit.author }),
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)("time", { dateTime: commit.date, children: commit.date.slice(0, 10) })
                ] })
              ]
            }
          ) }, commit.sha)) }),
          history.value.truncated && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "gp-warning", children: "\u5386\u53F2\u8F93\u51FA\u5DF2\u622A\u65AD\uFF0C\u8BF7\u51CF\u5C11\u6761\u6570\u6216\u63D0\u9AD8\u8F93\u51FA\u4E0A\u9650\u3002" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "gp-pager", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "button",
              {
                type: "button",
                disabled: skip === 0,
                onClick: () => {
                  setSelection(null);
                  setSkip((n) => Math.max(0, n - 30));
                },
                children: "\u2190 \u4E0A\u4E00\u9875"
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "button",
              {
                type: "button",
                disabled: !history.value.hasMore,
                onClick: () => {
                  setSelection(null);
                  setSkip((n) => n + 30);
                },
                children: "\u4E0B\u4E00\u9875 \u2192"
              }
            )
          ] })
        ] })
      ] }),
      selection && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { className: "gp-detail", "aria-label": "Git \u8BE6\u60C5", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "gp-detail-head", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "gp-detail-title", children: "sha" in selection ? selection.sha.slice(0, 12) : selection.path }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "gp-tag", children: "sha" in selection ? "commit" : selection.side === "staged" ? "\u5DF2\u6682\u5B58" : "\u672A\u6682\u5B58" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "button",
            {
              type: "button",
              "aria-label": "\u5173\u95ED\u8BE6\u60C5",
              onClick: () => setSelection(null),
              children: "\xD7"
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Notice, { state: detail }),
        detail.value && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
          detail.value.truncated && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "gp-warning", children: "\u8F93\u51FA\u5DF2\u622A\u65AD" }),
          "untracked" in detail.value && detail.value.untracked && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "gp-warning", children: "\u672A\u8DDF\u8E2A\u6587\u4EF6\uFF1A\u5F53\u524D\u5185\u5BB9\u9884\u89C8" }),
          "binary" in detail.value && detail.value.binary ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "gp-note", children: "\u4E8C\u8FDB\u5236\u6587\u4EF6\uFF0C\u65E0\u6CD5\u663E\u793A\u6587\u672C diff\u3002" }) : detail.value.text ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Patch, { text: detail.value.text }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "gp-note", children: "\u8BE5\u4FA7\u6682\u65E0\u5DEE\u5F02\uFF1B\u6587\u4EF6\u53EF\u80FD\u5DF2\u53D1\u751F\u53D8\u5316\uFF0C\u8BF7\u5237\u65B0\u3002" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("footer", { className: "gp-footer", children: "\u53EA\u8BFB \xB7 \u6570\u636E\u6765\u81EA\u5F53\u524D\u4F1A\u8BDD\u7684 Git \u4ED3\u5E93" })
  ] });
}
function apply(ctx) {
  ctx.effect(() => {
    const style = document.createElement("style");
    style.dataset.plugin = ID;
    style.textContent = panel_default;
    document.head.append(style);
    return () => style.remove();
  });
  ctx.effect(
    () => ctx.sidebarRightTabs.register({
      id: ID,
      kind: "git",
      priority: "extension",
      title: () => "Git",
      guide: [
        {
          id: "git",
          order: 30,
          title: () => "Git",
          description: () => "\u6587\u4EF6\u72B6\u6001\u3001diff \u4E0E\u63D0\u4EA4\u5386\u53F2"
        }
      ]
    })
  );
  ctx.effect(
    () => ctx.slots.inject(
      "sidebar.right.pane.tab",
      () => ctx.slots.register({ name: "sidebar.right.pane.tab", key: ID }, GitPanel)
    )
  );
}

return module.exports;
}});
