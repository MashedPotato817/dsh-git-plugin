# Web panel validation / Web 面板验收

Date / 日期：2026-10-01. Scope / 范围：Issue #1 read-only first phase on `feat/web-git-panel`, **unreleased / 未发布**. This record pairs English and Chinese within each section.

## Baseline and implementation / 基线与实现

- Base / 基线：main `590238351b7a1c8cdf3ec9090dcdbb8672e8ba9c` (published package still 0.2.1).
- Feature / 首期实现：`6b3e0ad94301ca5a12ef3c3f907a6fbc0dcec1b2` — Host, client, build, packaging, CI and regressions.
- Fix / 修正：`20b65d3` — shared single-child Session repository discovery; source and generated output together.
- Host / 宿主：official desktop-embedded DSH **0.2.0-rc.2**; upstream reference `master` @ `639ed01539`. Read-only reference; no upstream modifications / 只读参考，未修改上游。
- Local dev tarball / 开发 tgz：version field 0.2.1, **different from immutable npm 0.2.1**, 13 files, SHA-1 `19d4567b2df744e47c65f67b11a31b4914a7167c`. Installed using `dsh plugin ... add <local tgz>` in an independent DSH_HOME; never published / 独立 home 安装，未发布。
- Browser / 浏览器：headless Edge **154.0.4258.48**, Playwright; Windows Node **24.19.0**, Git **2.53.0.windows.2**. Authentication held in the browser context only / 认证仅保存在浏览器内存。

## Evidence by level / 分层证据

| Check / 检查 | Result / 结果 | Evidence and boundary / 证据与边界 |
|---|---|---|
| Build, Host/client strict types, JS syntax | PASS | build/check and node --check for both entries / 两入口构建、类型与语法 |
| Full regression suite / 完整回归 | PASS, 38/38, 0 cancelled | Includes the original 26, real Git and DOM tests / 含原 26 项、真实 Git 与 DOM |
| Real Git / 真实 Git | PASS | XY states; two diff sides; rename, Chinese/spaces; binary/caps; empty/detached; history/commit validation; single-child discovery; parameter/path boundaries; disabled external diff/textconv / 两侧状态、边界及 Git 对象 |
| Parser fixtures / 解析器样本 | PASS | Embedded newline filenames, conflict and submodule status are NUL fixtures, not a claim of real Windows newline-file or browser execution / 换行名、冲突、子模块为样本，不能冒充真实 Windows 文件或浏览器验收 |
| DOM / DOM 生命周期 | PASS | Safe text, style/tab/slot cleanup, stale Session responses and aborts. Mock network is not real authentication / 文本安全、清理、旧响应及取消；mock 不代表认证 |
| Installed tarball in real Web / 真实 Web tgz | PASS | Branch/status, staged and unstaged notes.txt, untracked Chinese file, history/detail; pageErrors=0 / 分支状态、两侧 diff、未跟踪及历史详情 |
| Real Connection carrier / 真实认证载体 | PASS | Anonymous 401; untrusted Origin 403; unknown Session 404; arbitrary cwd/traversal/option SHA 400 / 各类请求拒绝 |
| Live lifecycle / 在线启停 | PASS | Two disable/enable cycles: UI/styles/routes disappear and recover; no duplicates / 两轮清理恢复，无重复 |
| Pending subprocess / 请求子进程 | PASS (controlled test) | Disable cancellation and configured timeout checked through runner mocks. Existing preCommit timeout uses a real process. Not an actual slow Web browser process test / 区分受控 runner 与真实 preCommit，未冒充慢 Web 进程 |
| Official service stack / 官方服务栈 | PASS, 28 checks / 28 项 | Independent official DSH 0.2.0-rc.2 packages + Cordis 4.0.4; 5 commands, 4 tools, prompt, lifecycle and real preCommit deadline. The initial desktop-bundle SDK root returned exit 2; the independent install passed / 内置 bundle SDK 解析失败后，独立官方服务栈通过 |
| New-SHA clean gate and Linux matrix / 新 SHA 干净门及 Linux | Pending / 待补 | Updated after final document commit / 文档提交后记录 |
| Pack closure / 打包闭包 | PASS | 13 files: entries/types, panel types, bilingual README, patch, original SVG, license/package metadata. No source, profile, credentials or docs data / 无源码、profile、凭据及测试数据 |

The optional [repository script](../scripts/verify-web-panel.mjs) was run against the latest installed tarball and passed. It is outside CI; logs/authentication remain local. / 可选仓库脚本已对最新已安装 tgz 实跑通过，不进入 CI，认证与日志留在本地。

## Real-Web procedure / 真实 Web 操作

1. Create a disposable Git repository with one commit, notes.txt changed once in the index and again in the worktree, and a Chinese untracked file. / 临时仓库首个提交后，notes.txt 分别暂存、再改工作区，增加中文未跟踪文件。
2. Install the development tgz into a new DSH_HOME using the shipped Web profile; start from the fixture repository on a local port. / 独立 home 用 Web 模板安装 tgz，从临时仓库启动。
3. Open DSH's official local authentication URL, choose the workspace/session and the Git sidebar. Compare both diffs and commit detail with Git. / 用官方认证 URL 进入，逐项对照。
4. Run authenticated and anonymous read requests, then call official pluginManager/setBundleEnabled twice in each direction. Confirm UI/style/route counts and browser errors. / 测读取边界与两轮官方启停，核对注册及错误数。
5. Close the owned browser and stop only the owned test service; remove only the owned temporary home/repositories. Daily profiles remain untouched. / 关闭本次浏览器、停止本次服务，仅清理本次临时数据。

![Actual development panel / 真实开发面板](images/git-panel.png)

## Remaining checks / 未验证项

- Actual user acceptance; do not mark stable. / 用户实际验收，暂不标稳定。
- Linux real DSH Web, all edge-state browser rendering (conflict/submodules/newline, binary/large files, detached/empty, narrow/dark layouts), real slow-request navigation and mount-prefix hosting. Unit/real-Git evidence above is separate. / Linux 真 Web、全部边缘状态 UI、慢请求导航、前缀部署；不能拿上述单元／Git 结果替代。
- Current-SHA GitHub Actions: not run before push. Old release CI is historical only. / 本次 SHA 尚未推送，旧发布 CI 仅为历史。
- Real model calls, other DSH versions and GUI writes remain unverified/out of this phase. / 模型调用、其他 DSH 版本和 GUI 写操作不在本期证据内。
- Published dual-channel UI installation cannot be tested before a new release. / 新版面板正式双渠道安装待另行发布。

## Handoff / 交接

[Usage / 使用](web-panel.md) · [中文](web-panel_ZH.md) · [PR and Issue drafts / 草稿](issue-1-delivery.md). Use Refs #1 and keep the issue open. P3 needs an approval contract outside an open turn and recovery design before adding writes. / 保持 Issue 开放，写操作先审审批及恢复。
