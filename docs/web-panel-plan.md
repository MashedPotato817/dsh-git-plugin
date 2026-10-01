# dsh-git-plugin 只读 Web Git 面板方案（Issue #1 / P2）

> Historical design snapshot / 历史方案快照：以下“方案、未实现”指编写方案时。当前开发首期已实现，使用见 [English](web-panel.md) / [中文](web-panel_ZH.md)，实际验证见 [验收记录](web-panel-validation.md)。已发布 0.2.1 不包含新面板。

本文是 [Issue #1](https://github.com/MashedPotato817/dsh-git-plugin/issues/1) 的**下一阶段（P2）方案**：
在 DSH Web 端提供一个**只读**的可视化 Git 面板（状态 / diff / 历史）。

- 状态：**方案，不是实现**。本轮不新增任何客户端代码、不改 `package.json`、不改 CI、不改 `src/`。
  本次交付只新增本文件。
- 依据：本地 DSH 源码 `C:/Users/Mashed Potato/Desktop/github/deepseek-harness`（`master` @ `639ed015`，`git describe` = `dsh-v0.2.0-rc.2`，与本机运行中的 `0.2.0-rc.2` 一致）。
  下文所有"可复用接口"都标注了**该 checkout 内的源码/README 路径**；未读到出处的判断一律标为**未决**。
- npm 侧核对（2026-10-01，`npm view <pkg> dist-tags`）：`@deepseek-ai/dsh-client-ui-sidebar-right`、`dsh-client-connection`、`dsh-client-ui-slots`、`dsh-workspace-changes`、`dsh-api-workspace-files`、`dsh-client-modules` 均可安装，`next = 0.2.0-rc.2`，但 `latest` 明显滞后（例如 `dsh-client-ui-slots` 的 `latest` 是 `0.0.1-rc.1`）。**不要用 `@latest`**。
- 相关既有评估：[docs/maintenance-plan.md](maintenance-plan.md) 第 7 节（Issue #1 可复用能力初评）、第 8 节（阶段划分）。

---

## 1. 目标与非目标

### 1.1 目标（P2）

| # | 目标 | 说明 |
|---|---|---|
| G1 | 右侧栏出现一个 Git 面板入口 | 与 Files / Browser / Terminal 同一层的右侧栏 tab，不新建顶层应用、不占用主对话列 |
| G2 | 三个只读视图：状态、diff、历史 | 状态=工作区/暂存/分支；diff=逐文件、可切换 staged/unstaged；历史=log 列表 + 单提交详情 |
| G3 | 数据来自本插件自己的 Host 侧只读 git 调用 | 复用现有 `ctx.subprocess` + 纯 argv + 超时/取消纪律（`src/index.ts`） |
| G4 | 完全只读 | 不加任何写路径：没有 `add` / `commit` / `checkout` / `stash` 调用，没有写路由 |
| G5 | 可测 | 每个视图的验收标准是"与对应 git 命令的输出同源"（第 7 节） |
| G6 | 启停干净 | 禁用插件后 UI、样式、注册、路由全部消失；重新启用后不重复注册 |

### 1.2 非目标（明确排除）

| # | 非目标 | 理由 / 去向 |
|---|---|---|
| N1 | stage / commit / branch / stash 等写操作 | **留到 P3**，且必须走 DSH 审批：`ctx.approval.request(req)`（`packages/interaction/user-approval/README.md` 第 52 行；服务名见 `docs/capability-seams.md` 第 652 行）。**注意**：该 seam 明确"要求一个已打开的 turn"（同上 README 第 52 行），而面板按钮点击通常不在 turn 内——这是 P3 的前置未决问题（见 D5） |
| N2 | 复用 `dsh-workspace-changes` 作为"状态/diff"数据源 | **裁定为不可行**，理由见第 2.2 节（它是"按回合的 before/after 快照"语义，不是"HEAD ↔ 工作区"语义） |
| N3 | 在对话流里新增卡片 | 回合 diff 卡片已由 DSH 自带的 `dsh-client-ui-deliverables` + `dsh-workspace-changes` 提供，不重复造 |
| N4 | 语法高亮 / 折叠 / 并排 diff / 图片二进制预览 | P2 不做；需要时再评估 `@deepseek-ai/dsh-client-ui-primitives` 的高亮能力 |
| N5 | Host → Client 推送通道 | 第三方插件无法扩展 DSH 的转发事件白名单（第 5.4 节），P2 用"拉取 + 无效化" |
| N6 | 本轮落地任何代码 | 本文之后才进入实现；本文不修改任何非文档文件 |

---

## 2. 证据与关键裁定

### 2.1 基线事实（已核实）

| 事实 | 证据（DSH checkout 内路径） |
|---|---|
| 运行中的 Web 组合挂载了 `api-workspace-files`、`client-modules`、`client-connection`、`ui-sidebar-right`、`ui-deliverables`、`workspace-changes` | `packages/bundle/web-app/cordis.patch.yml` 第 132/212/217/265/334/339 行 |
| 右侧栏有三个内置 guide 类型：files / browser / terminal | `packages/bundle/web-app/cordis.patch.yml` 第 278–286 行；三个 `guide:` 声明分别在 `packages/client/ui-sidebar-files/src/client/definition.tsx` 第 31 行、`packages/client/ui-sidebar-browser/src/client/definition.tsx` 第 22 行、`packages/client/ui-sidebar-terminal/src/client/index.ts` 第 73 行 |
| 右侧栏 tab 类型的注册是"两步 + 公开路径" | `packages/client/ui-sidebar-right/README.md` 第 83 行（`ctx.sidebarRightTabs.register({...})` 与 `ctx.slots.register({name:'sidebar.right.pane.tab', key: definition.id}, Body)`） |
| 第三方插件可以手写客户端 bundle（无需 DSH 仓库内的构建预设） | `apps/web/tests/fixtures/plugins/fixture-live-client/client.js`（`window.__ModuleLoader__.load({id, factory(require){...}})`，只 `require('react')` 与 `require('@deepseek-ai/dsh-client-ui-primitives')`）；同目录 `package.json` 声明 `"dsh": { "client": { "platform": "web" } }` 与 `exports["./client"]` |
| 禁用/重新启用会完整清理客户端 UI 与资源 | `apps/web/tests/client-plugin-live.e2e.ts` 第 91、120–121、140–149、279–308 行（图行消失、`style[data-plugin=...]` 计数归零、`documentElement.dataset` 标记被清、Host 清理未完成时客户端已先清） |
| 本插件当前**没有任何客户端半侧** | `package.json`：`exports` 只有 `.` 与 `./package.json`，`files: ["lib","README.md","LICENSE"]`，`dsh` 只有 `manifestVersion`；`tsconfig.json`：`rootDir: src`、`lib: ["ES2023"]`、`types: ["node"]`，无 JSX/DOM 配置 |

### 2.2 裁定：`dsh-workspace-changes` 不能作为状态/diff 数据源

`packages/deliverables/workspace-changes/`（包名 `@deepseek-ai/dsh-workspace-changes`）确实提供"变更文件列表 + 每文件前后对比"和 `workspace/changes` 事件，但它的语义是**按顶层回合**：

- README 第 12 行：*"This plugin summarizes which files each **top-level turn** changed … Git snapshots of the working tree at turn start and turn end are diffed"*。
- README 第 44 行：*"**the user's earlier uncommitted changes never enter a summary**"* —— 回合开始前就存在的未提交改动不会出现在任何 summary 里。
- README 第 88 行：summary / 快照树 / 拷贝**只在该 Session 存活期间**存在；Host 重启后重开的会话"没有卡片，也没有对比"。
- README 第 94 行：快照覆盖之外的路径，只记录**文件工具点过名的**路径；纯 shell 改动不在其中。
- `src/types.ts` 第 5–40 行：`WorkspaceChangedFile` 只有 `path/display/added/deleted/binary?/oversized?`——**没有 staged/unstaged 维度，没有分支信息，没有历史**。
- 服务面只有两个方法：`summary(sessionId, seq)` 与 `diff(sessionId, seq, index, signal)`（`src/types.ts` 第 79–97 行，`src/index.ts` 第 114–118 行 `ctx.provide('workspaceChanges', ...)`）。

**结论**：它满足"刚才这一轮改了什么"（DSH 自带的回合变更卡片），不满足 lazygit 式"当前工作区相对 HEAD 是什么样"。**面板的状态与 diff 必须自己从 `git status` / `git diff` 取**。

### 2.3 可以复用的部分（三类，各自边界清楚）

| 类别 | 可复用 | 边界 |
|---|---|---|
| 呈现载体 | 右侧栏 tab 类型 + `sidebar.right.pane.tab` 座位；`ctx.sidebarRight` 的 `openTab` / 快捷方式 | 只提供"挂哪里"，不提供 git 数据 |
| 只读数据通道 | `ctx.connection.fetch.register` 的**精确 Fetch 路由**（`/api` 之下），天然处于浏览器信任与认证围栏内 | 需要 Host 半侧自己实现路由内容 |
| 同源文件观测 | `ctx.remote.workspaceFiles.stat/read/readBytes/list/changes`（客户端命名空间） | 只能读**文件系统当前内容**，读不了 git 对象（历史版本 blob、diff hunk） |

---

## 3. 三个视图的最小方案

三个视图共用一套 Host 侧数据。建议的数据形状（自建，P2 定稿时再固化）：`StatusView { root, branch, head, staged[], unstaged[], untracked[], conflicted[] }`、
`FileDiffView { path, side: 'unstaged'|'staged', binary, hunks[], truncated }`、
`LogView { entries: [{ sha, short, author, isoDate, subject }] }`、`CommitView { sha, message, files[], patch }`。

### 3.1 状态视图（工作区 / 暂存 / 分支）

- **需要的数据**：仓库根、当前分支、HEAD、`XY` 状态码分组的文件列表（暂存 / 未暂存 / 未跟踪 / 冲突）。
- **可复用的 DSH 接口**：
  - `ctx.subprocess`（`@deepseek-ai/dsh-subprocess`）——本插件已用（`src/index.ts` 第 78–94、171–187 行）。**没有 DSH 自带的 git 服务**：`packages/api/` 下只有 account/gateway/job/remotes/session/settings/terminal/workspace-controller/workspace-files，无 git 相关包。
  - `ctx.connection.fetch.register`（`@deepseek-ai/dsh-client-connection`）——Host 半侧注册 `GET /api/git-panel/status`。契约见 `packages/client/connection/src/rpc.ts` 第 143–163 行（`ConnectionFetchRoute { path, methods, requestBody, fetch }`）；用法样例见 `packages/client/ui-deliverables/src/present-open.ts` 第 20–54 行。认证与信任围栏见 `packages/client/connection/README.md` 第 32、37、43 行（`/api` 前缀路由 + `admit()`；Host/Origin 校验、401/403 语义）。
  - 会话身份 → 工作目录：`ctx.sessions.get(sessionId)?.header.cwd`（`packages/core/session/src/index.ts` 第 953 行服务名 `sessions`、第 1227–1228 行 `get()`、第 117 行 `cwd` 必须是绝对路径）。**不引入新的 peer**：沿用本插件现有的"结构化声明注入面"写法（`src/index.ts` 第 83–94 行的做法），`inject` 里加一个名字即可。
  - 仓库根解析（会话 cwd 不是仓库、其下只有一个子仓库等情形）：直接复用本插件既有的 `resolveGitRoot`（`src/index.ts` 第 292 行）与 `runGitAt` / `runGit`（同文件第 313–334 行）。
- **需要自建**：argv 构造与解析。
  - 推荐 `git status --porcelain=v1 -z --branch -uall`（`-z` 免去路径引用规则、`-uall` 把未跟踪目录展开成文件）。**注意本插件现有命令用的是不带 `-z`/`-uall` 的 `status --porcelain=v1 --branch`（`src/index.ts` 第 371、429 行、第 569 行）**，面板应另建解析器，不改既有命令输出。
  - 需要处理：`## branch...upstream [ahead N, behind M]`、分离 HEAD、`UU/AA/DD` 冲突码、重命名/拷贝（v1 的 `R`/`C` 带相似度但不断言旧路径，需要 `-z` 的下一段）、非仓库路径、空仓库（无 HEAD）、子模块（`m`）、CRLF/非 UTF-8 输出。
- **失败与空态**：非 git 仓库 → "当前工作目录不是 Git 仓库"；无 git 可执行文件 → 面板显示能力缺失（不是报错弹窗）；工作区干净 → 明确"工作区干净"而不是空列表。

### 3.2 diff 视图（逐文件、可切换 staged/unstaged）

- **需要的数据**：单个文件在选定侧（unstaged / staged）的 unified diff hunk（带新旧行号），二进制/超大/重命名/新增/删除的区分。
- **可复用的 DSH 接口**：
  - 与状态视图相同的 `ctx.subprocess` + 精确 Fetch 路由（`GET /api/git-panel/diff?sessionId=…&path=…&side=staged|unstaged`）。
  - **hunk 的"数据类型"可直接复用**：`WorkspaceDiffHunk { oldStart, oldLines, newStart, newLines, lines[] }` 定义在 `packages/deliverables/workspace-changes/src/types.ts` 第 43–54 行，并被 DSH 自己的 diff 渲染器消费（`packages/client/ui-deliverables/src/client/FileDiff.tsx` 第 7 行 `import type { WorkspaceDiffHunk } from '@deepseek-ai/dsh-workspace-changes/types'`；`packages/client/ui-deliverables/src/changes.ts` 第 73–94 行的 `isHunk` 校验）。只做 `import type`，不产生运行时依赖。
  - 文件**当前内容**（用于未跟踪文件预览、或"看文件全貌"）：`ctx.remote.workspaceFiles.read(sessionId, path, range, signal)`（`packages/api/workspace-files/README.md` 第 28、33、44 行；客户端命名空间要求 `inject: ['remote.workspaceFiles']`）。
- **需要自建**：
  - hunk 解析器（解析 `git diff -U3 --no-color --no-ext-diff`：`@@` 头、`\ No newline at end of file`、`Binary files … differ`、mode change、rename/copy 段、`similarity index`）。
  - 渲染器（纯只读展示；**不复用** `ui-deliverables` 的内部 `FileDiff.tsx`——它对第三方插件不可用作值导入，见第 4.3 节）。
  - 未跟踪文件：`git diff` 不显示。方案二选一——(a) `git diff --no-index -- /dev/null <path>`（Windows 上需注意 `/dev/null` 与退出码 1 是"有差异"而非失败），(b) 视图里明确标注"未跟踪文件，无 diff"并只给内容预览。**建议 (a)**，并在验收里写清与 `git diff --no-index` 同源。
- **失败与空态**：二进制 → 占位行；超大 → 按 cap 截断并标注（复用本插件既有的 `maxBytes` 上限语义）；文件在两次调用间被删 → 返回明确状态而不是 500。

### 3.3 历史视图（log + 单提交详情）

- **需要的数据**：`git log` 条目（SHA、短 SHA、作者、时间、主题）与单提交的文件列表 + patch。
- **可复用的 DSH 接口**：
  - 同样是 `ctx.subprocess` + 精确 Fetch 路由（`GET /api/git-panel/log`、`GET /api/git-panel/show`）。
  - 本插件已有的 `git-log` / `git-show` 工具（`src/index.ts` 第 584–615 行）证明了这两条 argv 已经被适配验证过（含 `show --end-of-options` 的选项注入防护，见 `docs/maintenance-plan.md` 第 4.1 节）。面板只是把"文本投影"换成"结构化投影"，**不改工具行为**。
- **需要自建**：
  - 机器可读格式：`git log --format=...%x00... -z -n <N>`（字段分隔用 NUL，避免主题里的换行/分隔符歧义）；`git show --stat --format=… --end-of-options <sha>` 与 `git show --format=… --end-of-options <sha>`。
  - ref 安全：**所有**用户/UI 传来的 ref 一律 `--end-of-options` 之后使用（本插件已因 `git show --output=<file>` 的任意文件写原语做过修复）；写操作才需要 `check-ref-format`，只读翻页只需要限定 ref 形状。
  - 分页：`-n` + `--skip`，或 `git log HEAD~N..HEAD~M`；**不做**无边界的全仓 log。
- **失败与空态**：无提交（未初始化/空仓库）→ 明确空态；历史里含二进制的提交 → 详情页只列文件名。

---

## 4. 入口与客户端注册（需要哪些 slot / 服务）

### 4.1 入口位置：右侧栏 tab（推荐）

| 候选 | 证据 | 评价 |
|---|---|---|
| **右侧栏 tab 类型**（`ctx.sidebarRightTabs` + `sidebar.right.pane.tab`） | `packages/client/ui-sidebar-right/README.md` 第 83 行；模板 `packages/client/ui-sidebar-files/src/client/index.ts` 第 81–96 行 | **推荐**：与 Files/Browser/Terminal 同级，最接近 lazygit / VS Code 的"面板挨着文件树"；不新建顶层应用，不占对话列 |
| 会话行菜单项 | `sidebar.workspaces.session.menu.item`（样例 `apps/web/tests/fixtures/plugins/fixture-live-client/client.js` 第 75–96 行） | 不适合"常驻观察" |
| 全局主面板（`sidebar.panellist` + `MainPanelId`） | `packages/client/ui-sidebar/src/client/contract/slots.ts` 第 32–35 行 | 会替换主对话列，代价大；P2 不需要 |
| 左栏 footer/设置旁动作 | 同文件第 49–53 行 | 只能放"一根按钮"，放不下三视图 |

**已知限制（必须在文档/验收里承认）**：右侧栏按 Session 分面，"没有 Session 时右侧什么都没有"（`ui-sidebar-right/README.md` 第 142 行）。因此面板**只在有会话时可用**，不做 hero 屏状态。

### 4.2 需要注册/注入的东西（最小集合）

| 项 | 值 | 出处 |
|---|---|---|
| tab 类型（step 1） | `ctx.sidebarRightTabs.register({ id: 'dsh-git-plugin', kind: 'git', priority: 'builtin', title: () => 'Git', guide: [{ id: 'git', order: 30, title…, description…, icon? }] })` | `ui-sidebar-right/README.md` 第 83 行；`ui-sidebar-files/src/client/definition.tsx` 第 25–39 行 |
| tab 主体（step 2） | `ctx.slots.register({ name: 'sidebar.right.pane.tab', key: 'dsh-git-plugin', locale?, store, inject, children? }, Body)` | `ui-sidebar-right/src/client/contract/slots.ts` 第 59–64 行；`ui-sidebar-files/src/client/index.ts` 第 86–92 行 |
| 可选：tab 标题 | `ctx.slots.register({ name: 'sidebar.right.pane.tab.title', key: 'dsh-git-plugin' }, Title)` | 同上第 73–78 行；`ui-sidebar-files/src/client/index.ts` 第 93–96 行 |
| Cordis 服务注入 | `['slots', 'locale', 'sidebarRightTabs', 'sidebarRight']`（`slots` 由 `ui-renderer` 提供：`packages/client/ui-renderer/src/client/registry.ts` 第 160 行 `super(ctx,'slots')`；`sidebarRightTabs`/`sidebarRight` 由 `ui-sidebar-right` 提供：`packages/client/ui-sidebar-right/src/client/index.ts` 第 150–151 行） | 服务按**名字**注入，不需要值导入 |
| 会话身份与 cwd | 声明一个 store 座位后，组件按位置参数拿到框架解析的 `sessionId`：`packages/client/ui-sidebar-files/src/client/FilesBody.tsx` 第 140–147 行 `({ useTabInfo, sessionId, useSessions, useStore, actions, t })`，并用 `useSessions(s => s.byId[sessionId]?.cwd)` | 同上 |
| 面板内容 | 用 `require('react')` + `require('@deepseek-ai/dsh-client-ui-primitives')` 在 bundle 内渲染（两者都在 `PLATFORM_MODULES`：`packages/client/web/src/platform.ts` 第 8–14 行） | 同第 4.3 节 |

### 4.3 客户端 bundle 的形态（这决定"要不要引入打包器"）

DSH 官方的客户端打包预设 `packages/client/tsdown.client.ts` **不在 npm 上**：`packages/client/` 目录下只有 `AGENTS.md` / README / `tsdown.client.ts`，没有 `package.json`；预设内部依赖仓库根（第 83 行 `REPOSITORY_ROOT = new URL('../..')`、第 361 行 `globSync('packages/*/*/package.json')`），第三方无法安装。

因此只剩两条路，**D1 已定：走形态 B**（见 8.2）：

- **形态 A：手写 `client.js`（零打包器）**。完全照 DSH 自己测试夹具的写法：一个 `window.__ModuleLoader__.load({ id, factory(require){ … } })` 包裹的 CJS 工厂，`require('react')` / `require('@deepseek-ai/dsh-client-ui-primitives')`，样式用一个 `document.createElement('style')` + `data-plugin="dsh-git-plugin"` 标签（夹具同款：`apps/web/tests/fixtures/plugins/fixture-live-client/client.js` 第 7–10 行；清理断言见 `apps/web/tests/client-plugin-live.e2e.ts` 第 141/149/300 行）。
  优点：**无新构建依赖、无 CI 变化、产物可直接进 git 仓库**（与本项目 `lib/` 随提交一致的既有做法）；缺点：没有 TSX 类型检查、没有 JSX、复杂 UI 会变难。
- **形态 B：TypeScript / TSX 源码 + 小型构建配置**（**已定，见 D1**）。客户端半侧写在 `src/client/**`（`.tsx`），
  由一个自建的小配置（rolldown/esbuild，或 `tsc` + 极薄的包装步骤）产出与官方预设同构的产物
  （`format: 'cjs'`、`lib/client.js`、banner `window.__ModuleLoader__.load({ id, factory: (require) => {`、footer `return module.exports; } });`、intro `var module = { exports: {} }; var exports = module.exports;`，external = 平台基线）。契约在 `packages/client/tsdown.client.ts` 第 473–627 行逐条写明（第 605 行 `entryFileNames: 'client.js'`、第 619–624 行 banner/footer/intro、第 415–425 行 external 集合）。
  优点：可以写 TSX、可复用 DSH 客户端类型、包装由配置保证一致；缺点：新增 devDeps 与一个构建/CI 步骤、**需要按官方"客户端 bundle 纯度"规则自查**（第 528–546 行的纯度门：除基线 external、`INLINE_SAFE`、vendor 库与生成的 `/remote` 外，跨插件 `@deepseek-ai/*` 值导入是构建错误）。

两条路都不需要 `dsh.client.external`：面板只需要 React 与基线包（`ui-slots`、`ui-primitives` 都在基线里），DSH 客户端包只做 `import type`（`packages/client/AGENTS.md` 第 78、80 行：类型导入被擦除、不产生请求）。

### 4.4 一个用户可见的副作用与规避

`ui-sidebar-right/README.md` 第 119 行：*"Default pages depend on the number of registered guide entries: exactly one entry opens its page directly; zero or multiple entries open the guide."*
已核实当前 Web 组合有 **3** 个 guide 类型（第 2.1 节），默认页已经是 guide；我们新增第 4 个**不会**改变默认页行为。但**若将来 DSH 把内置 guide 类型减到 1 个**，第三个贡献会让默认页从"直接打开该页"变成"打开 guide"——属于跨插件可见行为变化，需在实现轮的验证清单里复核。

### 4.5 启停清理（设计上必须成立）

slot 的"声明即独占"和 disposer 递归收敛由 `packages/client/ui-slots/README.md` 第 46 行规定（*"An entry's disposer collapses its declared child slots recursively — ledger rows, contributions, and store mounts die on one lifecycle axis"*）；插件的两个注册都必须放在 `ctx.effect(...)` 内（模板 `ui-sidebar-files/src/client/index.ts` 第 81–96 行）。Host 侧的 Fetch 路由由 `register()` 返回的异步 disposer 撤销（`packages/client/connection/src/rpc.ts` 第 162 行）。

---

## 5. Host 数据通道

### 5.1 选定：精确 Fetch 路由（不是 typert Remote）

在插件 Host 半侧 `ctx.inject(['connection'], …)` 内注册：

```
GET /api/git-panel/status?sessionId=<id>
GET /api/git-panel/diff?sessionId=<id>&path=<p>&side=staged|unstaged
GET /api/git-panel/log?sessionId=<id>&limit=<n>
GET /api/git-panel/show?sessionId=<id>&ref=<sha>
```

- 契约：`packages/client/connection/src/rpc.ts` 第 143–163 行（`path` 是 `/api` 之下的绝对路径；`methods` 仅 GET/HEAD/POST；`requestBody: 'buffered'|'streaming'`）。
- 认证：这些路由天然在 Connection 的 `/api` 前缀路由与其信任/认证围栏之内（`packages/client/connection/src/index.ts` 第 139–158 行的 `admit()` + `connection/request` waterfall；`README.md` 第 37、43 行）。**不自己校验浏览器身份**。
- 为什么不用 typert Remote（`ctx.remote.$mount()`）：`$mount` 需要**生成的严格编解码贡献**（`packages/api/gateway/README.md` 第 52 行、第 85 行），而生成器属于 DSH 仓库的 tsdown/Typert 构建链；第三方插件复制这条链的收益远小于成本。Fetch 路由是 DSH 自己给"非 JSON 响应/浏览器原生响应"留的口子（`connection/README.md` 第 32 行）。
- 为什么不用 `ctx.webServer.register` 直接挂裸路由：那会绕过认证/信任围栏。`connection` 的 `/api` 路由才是被围栏保护的那一条。

### 5.2 会话 → 仓库根

1. `sessionId` 来自客户端框架（第 4.2 节）。
2. Host 侧 `ctx.sessions.get(sessionId)?.header.cwd`（`packages/core/session/src/index.ts` 第 1227–1228 行；`cwd` 已由 session 头校验为绝对路径，第 117 行）。取不到 → 400/404，并回一句可读原因。
3. 复用本插件已有的仓库探测与"唯一子仓库"回退逻辑（`src/index.ts` 第 292 行的 `resolveGitRoot` 与第 313–334 行的 `runGit`/`runGitAt`），把**实际解析到的仓库根**回给客户端显示。
4. 客户端**不**自己拼路径：`sessionId` 只在请求里传身份，路径解析全在 Host（与 `workspaceFiles` 的做法一致：`packages/api/workspace-files/README.md` 第 28、40 行）。

### 5.3 只读数据的刷新时机

| 触发 | 手段 | 证据 / 局限 |
|---|---|---|
| 打开 tab | 首次拉取 | — |
| 手动刷新 | 面板内的刷新控件（`tab.actions.bindCommands({ refresh })` 可把刷新绑到 DSH 的刷新命令：`ui-sidebar-right/src/client/contract/slots.ts` 第 133–137、146 行） | 唯一 100% 可靠的刷新 |
| 回合结束 | 客户端观察到 `workspace/changes` 会话事件后失效重取 | 事件本身只有 `{ turn }`（`workspace-changes/src/types.ts` 第 99–108 行），summary 要另取；客户端校验函数样例见 `ui-deliverables/src/changes.ts` 第 96–103 行 |
| 文件系统观测 | `ctx.remote.workspaceFiles.changes(sessionId, path)` 订阅某个文件/目录的失效帧 | **目录只观测直接子项**（`packages/api/workspace-files/README.md` 第 58 行 *"directories watch only direct entries"*），深层改动不会触发；且 SSH 等后端 `watch-unsupported`（README 第 141 行） |
| Host 主动推送 | **不可行** | 转发事件白名单是 `packages/api/remotes/src/remote-events.ts` 的 `API_REMOTE_FORWARDED_EVENTS`，由 DSH 自己维护（`packages/api/remotes/README.md` 第 43 行）；第三方插件无法新增 |

**结论（写进验收）**：面板必须做到"任何刷新触发都不假设数据是最新的"——每次渲染前有明确的 fetch 时间戳/代数，且陈旧数据不阻塞手动刷新。

### 5.4 为什么不用 `workspaceFiles` 来做 git 数据

`workspaceFiles` 能给出**当前**文件内容与元数据、目录列表与失效帧（`packages/api/workspace-files/README.md` 第 28–36 行），但读不了 git 对象（历史 blob、tree、diff），也不提供分支/inode 概念。它的正确用法是**辅助**（未跟踪文件内容预览、文件失效观测），不是主数据源。

---

## 6. 最小文件范围（本轮不落地）

> 以下仅为**预计范围**，用于估工与评审；本轮（t6）只新增 `docs/web-panel-plan.md`。

### 6.1 预计新增

| 路径 | 作用 | 备注 |
|---|---|---|
| `src/panel/data.ts` | 纯函数：argv 构造 + `status --porcelain=v1 -z --branch -uall` / `diff -U3` / `log --format` / `show` 的解析 | 无 DSH 依赖 → 可单元测试 |
| `src/panel/routes.ts` | Host 半侧只读路由（`ctx.inject(['connection'], …)` + `ctx.connection.fetch.register`） | 只在有 `connection` 时注册，缺失即整个面板降级不可用 |
| `src/panel/apply.ts` | 把路由挂进现有 `apply`（`src/index.ts` 里加一次调用） | 保持现有命令/工具行为不动 |
| `src/client/index.tsx`（形态 B，已定） | 浏览器半侧源码（TSX，`window.__ModuleLoader__.load` 包装由构建配置生成） | 构建产物为 `lib/client.js`，**不手写产物** |
| `scripts/build-client.mjs`（形态 B，已定） | 小型构建配置：把 `src/client/index.tsx` 打成 DSH 需要的 CJS 包装（banner/footer/intro 照官方契约） | 与 `npm run build` 一起纳入发布前检查；CI 加 `node --check lib/client.js` |
| `tsconfig.client.json`（形态 B，已定） | 浏览器半侧的第二个编译面（DOM + JSX + React 类型） | 现在只有一个编译面（`tsconfig.json`，`types: ["node"]`、`lib: ["ES2023"]`），不能把半侧混进去 |
| `test/panel.test.js` | 解析器/argv 单测 + 真实临时仓库的路由级测试 | 与现有 `test/smoke.test.js` / `test/integration.test.js` 同风格（`node --test`） |
| `docs/web-panel.md`（实现轮） | 面板的用户文档 | 本轮不写 |

### 6.2 预计修改

| 路径 | 改动 | 影响 |
|---|---|---|
| `package.json` | 加 `dsh.client = { "platform": "web", "inject": [...] }`；`exports` 加 `"./client": "./lib/client.js"`（`clientExportOf` 只认字符串或带字符串 `default` 的对象：`packages/client/modules/src/index.ts` 第 195–205 行）；`scripts` 加客户端构建步骤（`build:client`，并让 `build` 依赖它）；devDependencies 加 `react`、`@types/react`、构建器（rolldown/esbuild）、`@deepseek-ai/dsh-client-ui-slots`、`@deepseek-ai/dsh-client-ui-sidebar-right`、`@deepseek-ai/dsh-client-connection`（**类型用，`next` 或精确 `0.2.0-rc.2`**）；`files` 保持 `["lib", …]` 即可覆盖 `lib/client.js` | `dsh.client` 声明了却缺少 `./client` 导出 → 客户端模块扫描**直接抛错**（`packages/client/modules/src/index.ts` 第 841–848 行）；bundle 文件缺失会让 Web 启动期激活扫描失败（`packages/client/modules/README.md` 第 50 行）。**这是"发布包必须带上 `lib/client.js`"的硬约束** |
| `tsconfig.json` | `exclude: ["src/client/**"]`，或改为引用两个子工程 | 保持 Host 编译面干净 |
| `.github/workflows/ci.yml` | 加 `node --check lib/client.js`；`git diff --exit-code lib` 已能覆盖产物新鲜度 | 与现有"提交内容产物"纪律一致 |
| `lib/` | 新增构建产物 `lib/client.js`（如启用 sourcemap 再含 `.map`），并随提交 | 与项目既有"`lib/` 随仓库提交、安装期不构建"的约定一致（`docs/maintenance-plan.md` 第 1 节） |
| `README.md` / `CHANGELOG.md` / `docs/maintenance-plan.md` | 加面板说明与指针 | 由对应阶段的文档任务负责，不在本轮 |

### 6.3 本轮不落地（再次明确）

本轮**只新增 `docs/web-panel-plan.md`**；不改 `package.json`、`CHANGELOG.md`、`src/`、`lib/`、`README.md`、`docs/maintenance-plan.md`、CI；不提交、不推送、不回复 Issue #1。

---

## 7. 验收标准（可测条目）

> 统一原则：面板显示的内容必须与**同一条 git 命令**的输出同源；每个断言都要能在临时仓库里用真实 git 复现（沿用 `test/integration.test.js` 的做法）。

### 7.1 状态视图

| # | 验收条目 | 判定手段 |
|---|---|---|
| S1 | 面板列出的每个条目与 `git status --porcelain=v1 -z --branch -uall` 一致（路径、XY 码、分组） | 同一临时仓库里跑命令与调 `/api/git-panel/status`，逐字段比对 |
| S2 | 暂存/未暂存/未跟踪/冲突四组与 `git diff --cached --name-status`、`git diff --name-status`、`git ls-files --others --exclude-standard` 一致 | 同上 |
| S3 | 分支名与 `git branch --show-current` 一致；分离 HEAD、空仓库、非仓库三种情况都有明确文案 | 每情形一个用例 |
| S4 | 路径含空格/中文、重命名、子目录工作目录（会话 cwd 在子目录）、子模块 gitlink 均不崩且与 git 输出一致 | 每情形一个用例 |
| S5 | 超时/取消可达：`timeoutMs` 到点返回可读错误，不挂死（复用本插件既有的截止时间语义） | 用真实慢命令或 mock provider |

### 7.2 diff 视图

| # | 验收条目 | 判定手段 |
|---|---|---|
| D1 | 对同一文件同一侧，面板的 hunk 集合与 `git diff -U3 --no-color --no-ext-diff`（staged 侧加 `--cached`）解析结果一致：`@@ -oldStart,oldLines +newStart,newLines @@` 与每一行前缀/内容逐条一致 | 对固定 fixture 仓库逐 hunk 比对 |
| D2 | `staged` 开关恰好对应 `git diff --cached` / `git diff`，不混用 | 一个"仅暂存"与一个"仅未暂存"的 fixture |
| D3 | 二进制文件显示占位（无正文），与 `git diff` 报 `Binary files … differ` 一致；超大文件按 `maxBytes` 截断且标注 | 各一个用例 |
| D4 | 未跟踪文件按第 3.2 节选定方案与 `git diff --no-index`（或明确"无 diff"）一致 | 一个用例 |
| D5 | 删除/新增/重命名/无末尾换行（`\ No newline at end of file`）显示正确 | 四个用例 |
| D6 | 文件在两次调用之间被改动/删除时，返回明确状态（不是 500、不是旧内容冒充新内容） | 竞态用例 |

### 7.3 历史视图

| # | 验收条目 | 判定手段 |
|---|---|---|
| H1 | 条目数 ≤ `limit`，且逐条 `sha/short/author/isoDate/subject` 与 `git log --format=… -n <limit>` 一致 | 临时仓库 12 个提交，取 5/12 两档 |
| H2 | 单提交详情的文件列表与 `git show --stat --format= --end-of-options <sha>` 一致；patch 与 `git show --format= --end-of-options <sha>` 一致 | 逐文件比对 + patch 文本比对 |
| H3 | ref 注入防护：`ref` 为 `--output=evil.txt` 一类输入时**不生成文件**、返回错误（与 `docs/maintenance-plan.md` 第 4.1 节同一断言） | 真实 git 断言文件不存在 |
| H4 | 空仓库/无提交时给出明确空态 | 一个用例 |

### 7.4 启停与清理

| # | 验收条目 | 判定手段 |
|---|---|---|
| L1 | 禁用插件后：右侧栏该类型/引导入口/已打开的 tab 消失；`style[data-plugin="dsh-git-plugin"]` 计数为 0；`/api/git-panel/*` 不再被注册（404）；`/status`、`/diff` 等命令、`git-status` 等工具与提示词段落消失 | 与 DSH 自己的 `apps/web/tests/client-plugin-live.e2e.ts` 第 91/120–121/140–149/279–308 行同构；服务栈侧沿用 `scripts/verify-real-dsh.mjs` 的"禁用后注册清理"断言 |
| L2 | 重新启用后所有注册恰好一份（无重复、无残留样式） | 同上 |
| L3 | Host 侧仍然没有写路径：路由清单里不存在 stage/commit/branch/stash；`grep` 审计 argv 构造只出现只读子命令 | 代码审计 + 路由表断言 |

### 7.5 构建与包体

| # | 验收条目 | 判定手段 |
|---|---|---|
| B1 | `lib/client.js` 存在且在 npm 包里 | `npm pack --dry-run` 输出含 `lib/client.js` |
| B2 | 干净检出重建后产物一致 | 提交后 `npm run build && git diff --exit-code lib` |
| B3 | 浏览器半侧可通过语法检查 | `node --check lib/client.js` |
| B4 | `dsh.client` 与 `exports["./client"]` 自洽（声明即必须有导出） | 一个断言脚本/CI 步骤（比照 `packages/client/modules/src/index.ts` 第 841–848 行的规则） |
| B5 | 真实 Web GUI 里面板可见、三视图可用、启停干净 | **需要人工在 DSH Web GUI 中验证**：本仓库没有 Web e2e 基础设施，此条不能自动化，必须在实现轮如实标注为"人工验证" |

---

## 8. 风险与未决问题

### 8.1 风险

| # | 风险 | 证据 | 缓解 |
|---|---|---|---|
| R1 | **DSH 客户端 API 版本耦合**：slot 名（`sidebar.right.pane.tab`）、`sidebarRightTabs.register` 字段、`dsh.client` 协议、平台基线清单都是 `0.2.0-rc.2` 的快照 | `ui-sidebar-right/src/client/contract/slots.ts`、`client/modules/src/client/manifest.ts`、`client/web/src/platform.ts` | 面板声明与实现都要绑定精确版本；`peerDependencies` 的范围只是"允许加载"（见 D2）；DSH 每次升级都要重跑第 7.4/7.5 节 |
| R2 | **peer 准入检查会被新 peer 触发**：DSH 在导入插件前，把 `peerDependencies` 里所有 `@deepseek-ai/dsh` 与 `@deepseek-ai/dsh-*` 的范围与唯一运行时版本比对 | `packages/boot/app-boot/README.md` 第 52 行 | 客户端包**尽量只进 devDependencies**（`packages/client/AGENTS.md` 第 64 行也要求 Browser/类型关系只做 dev-only）；若必须声明 peer，则要同时验证并写进"实际验证版本"纪律 |
| R3 | **缺 bundle 会炸 Web 启动**：声明了 `dsh.client` 而 `./client` 不存在 → 扫描抛错；bundle 文件缺失 → 激活期大声失败 | `client/modules/src/index.ts` 第 841–848 行；`client/modules/README.md` 第 50 行 | `lib/client.js` 必须随仓库提交并进 `files`；CI 增加 B3/B4 门 |
| R4 | **没有 Host→Client 推送**：转发事件白名单不可扩展 | `packages/api/remotes/README.md` 第 43 行 | 只读 UI 接受"手动刷新 + 事件失效重取"；不做"实时"承诺 |
| R5 | **目录观测很粗**：目录 watch 只看直接子项，深层改动不触发；部分后端 `watch-unsupported` | `api/workspace-files/README.md` 第 58、141 行 | 把 `changes` 当"辅助失效信号"，不作为唯一刷新依据 |
| R6 | **信息暴露面**：面板会把仓库内容端给浏览器（未跟踪文件内容、历史 patch） | `workspace-changes/README.md` 第 96 行记录同类取舍（comparison 会把完整文本发给客户端） | 与 `workspaceFiles` 同一个信任围栏；在文档里写清"能在浏览器打开面板的人就能看到这些内容" |
| R7 | **第三方构建链缺失**：官方客户端打包预设不在 npm 上 | `packages/client/tsdown.client.ts` 第 83、361 行（依赖仓库根与 `packages/*/*` 布局）；`packages/client/` 无 `package.json` | 已定形态 B：TS/TSX 源码 + 自建小配置生成 DSH 包装；见 D1 |
| R8 | **默认页/引导数量行为**：guide 条目数量决定默认页 | `ui-sidebar-right/README.md` 第 119 行 | 当前 3→4 不变（第 4.4 节）；在实现轮复核 |
| R9 | **只读也需要权限口径**：被严格 preset（如只读沙箱）限制时，面板是否也应隐藏/降级 | `ctx.permissionPresets`（`docs/capability-seams.md` 第 653 行） | 见 D6（未决） |
| R10 | **Windows/Linux 差异**：路径分隔、`/dev/null`、CRLF、非 UTF-8 输出 | 本插件既有验证记录只覆盖 Windows（`docs/maintenance-plan.md` 第 5.4 节） | 解析器只做字节级处理；跨平台列入实现轮验证清单 |

### 8.2 需要 Captain/仓库负责人决策的未决点

| # | 未决点 | 选项 | 建议 |
|---|---|---|---|
| **D1** | 客户端 bundle 的构建形态 | (A) 手写 `client.js`，零打包器；(B) TypeScript / TSX 源码 + 自建小配置生成包装 | **已定 B**（用户 2026-10-01 决策）：继续用 TypeScript / TSX，通过小型构建配置生成 DSH 所需的 `window.__ModuleLoader__.load` 包装，避免手写 `lib/client.js`。代价是新增一个构建步骤、少量 devDependency 与 CI 门（`node --check lib/client.js` + 产物新鲜度），换来类型检查与可维护性；形态 A 的可行性仍由 DSH 夹具佐证，作为兜底 |
| **D2** | `@deepseek-ai/dsh-client-ui-slots` / `ui-sidebar-right` / `client-connection` 是否进 `peerDependencies` | (a) 只进 devDependencies（类型用）；(b) 同时进 peer + dev | 建议 **(a)**：避免触发 R2 的准入检查，也符合 DSH 自己的"客户端/类型关系 dev-only"规则；代价是缺少运行时版本提示 |
| **D3** | 面板入口 | (a) 右侧栏 tab；(b) 全局主面板；(c) 会话行菜单 | 建议 **(a)**（第 4.1 节） |
| **D4** | 放在本包还是新建独立客户端包（如 `dsh-git-plugin-client`） | (a) 本包加半侧（一个小版本即可）；(b) 新包（独立版本、独立发布） | 建议 **(a)**：面板与 Host 侧只读逻辑同源、同仓库、同一发布纪律；拆包会把"半个功能"拆到两个版本流里 |
| **D5** | P3 写操作的审批路径 | 现状 `ctx.approval.request` **要求 open turn**，面板按钮点击通常不在 turn 内 | P3 之前必须先解决（需要 DSH 侧的新入口，或把写操作限制在"由模型在 turn 内发起、面板只做确认"）；**P2 不要为它预留写路径** |
| **D6** | 面板的只读数据是否受权限 preset 约束（是否在受限 preset 下隐藏/降级） | (a) 不受限（纯读）；(b) 受限 preset 下隐藏 | 建议 **(a) + 在文档里写清信息暴露（R6）**，但需仓库负责人确认口径；DSH 的 sandbox 只管写不管读（`api/workspace-files/README.md` 第 95 行） |
| **D7** | 是否在 P2 顺带把"回合变更审阅"接进面板 | 复用 `dsh-resource://changes-review/session/<id>/<seq>/<turn>` 地址，用 `ctx.sidebarRight.openResource()` 直接打开 DSH 自带审阅 tab（地址常量：`ui-deliverables/src/changes.ts` 第 27 行） | 建议 **P2 末期做**：零新 UI 就能给用户"点提交/回合看 diff"的体验，但要等状态/diff 主链路先绿 |

---

## 9. 附：本次实际读取并引用的 DSH 源码/文档清单

（根目录 `C:/Users/Mashed Potato/Desktop/github/deepseek-harness`，`master` @ `639ed015` = `dsh-v0.2.0-rc.2`）

| 主题 | 路径 |
|---|---|
| 回合变更快照（被否定的数据源） | `packages/deliverables/workspace-changes/README.md`、`src/types.ts`、`src/index.ts` |
| 回合变更审阅 UI / 路由 | `packages/client/ui-deliverables/src/changes.ts`、`src/present-open.ts`、`src/client/FileDiff.tsx`、`package.json` |
| 客户端扩展协议 | `packages/client/modules/README.md`、`src/index.ts`、`src/client/manifest.ts`、`docs/subsystems/client-modules.md` |
| 官方客户端打包预设（未发布） | `packages/client/tsdown.client.ts` |
| 客户端编写规则 / 依赖纪律 | `packages/client/AGENTS.md`、`docs/cookbook/adding-a-package.md`（第 38 行） |
| 平台模块基线 | `packages/client/web/src/platform.ts` |
| slot 机制 | `packages/client/ui-slots/README.md`、`src/index.ts`；`ctx.slots` 服务提供者见 `packages/client/ui-renderer/src/client/registry.ts`（第 160 行 `super(ctx, 'slots')`） |
| 右侧栏与 tab 注册 | `packages/client/ui-sidebar-right/README.md`、`src/client/contract/slots.ts`、`src/client/index.ts` |
| 右侧栏 tab 的完整样例 | `packages/client/ui-sidebar-files/src/client/index.ts`、`definition.tsx`、`FilesBody.tsx`、`package.json` |
| 右侧栏其他内置 tab 类型（guide 条目计数核对） | `packages/client/ui-sidebar-browser/src/client/definition.tsx`（第 22 行）、`packages/client/ui-sidebar-terminal/src/client/index.ts`（第 73 行） |
| 左侧栏座位 | `packages/client/ui-sidebar/src/client/contract/slots.ts` |
| 会话行菜单座位（第三方可注册；仅作对比，不作面板入口） | `packages/client/ui-workspace/src/client/contract/slots.ts`（`sidebar.workspaces.session.menu.item`，第 166–172 行） |
| 第三方插件夹具（手写客户端半侧） | `apps/web/tests/fixtures/plugins/fixture-live-client/{package.json,index.js,client.js,cordis.patch.yml}`、`fixture-input-extension/client.js` |
| 启停清理的真实断言 | `apps/web/tests/client-plugin-live.e2e.ts` |
| 精确 Fetch 路由 / 认证围栏 | `packages/client/connection/README.md`、`src/rpc.ts`、`src/index.ts` |
| typert Remote（被否定的通道） | `packages/api/gateway/README.md`、`src/client/index.ts`、`packages/api/remotes/README.md`、`src/remote-events.ts` |
| 工作区文件只读服务 | `packages/api/workspace-files/README.md`、`src/types.ts`、`package.json`、`tsdown.config.ts` |
| 会话身份与 cwd | `packages/core/session/src/index.ts`、`packages/session-query/session-query/README.md` |
| 供应商准入 | `packages/boot/app-boot/README.md`（第 52 行）、`src/plugin-compatibility.ts` |
| 审批 seam | `packages/interaction/user-approval/README.md`、`docs/capability-seams.md`（第 652–653 行） |
| 出厂 Web 组合 | `packages/bundle/web-app/package.json`、`cordis.patch.yml` |
