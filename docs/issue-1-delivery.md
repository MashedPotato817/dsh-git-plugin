# Issue #1 delivery drafts / 交付草稿

These are local drafts, not sent messages. 本文仅为本地草稿，未发送社区消息。

## PR title / 标题

feat(web): add a read-only Git sidebar / 新增只读 Git 侧栏

## PR body / 正文

Refs #1. DSH Web previously had no repository Git view. This first phase adds a native right-sidebar tab with branch/file states, independent staged/unstaged diff, and paginated commit history/detail. TSX builds the official loader factory with shell-owned React; fixed Host routes derive cwd from Sessions and use bounded read-only Git argv. CLI/headless commands and tools remain available.

Refs #1。DSH Web 原先没有仓库 Git 面板；首期新增原生右侧 tab，显示分支、文件状态、两侧 diff、分页历史与提交详情。TSX 构建官方 loader 包装，复用宿主 React；固定 Host 路由从 Session 获取 cwd，以受限只读 argv 调用 Git。CLI/headless 的命令与工具保留。

Validation / 验证：see [web-panel-validation.md](web-panel-validation.md), including real Git regressions, DOM lifecycle and independent installed-tarball DSH Web tests. 详见验收记录；未执行项单列。

No GUI write actions or release are included. Published 0.2.1 remains immutable. The read-only phase uses Refs, not Closes; user acceptance and later write approval design remain open. 本次不含 GUI 写操作或发布，不覆盖 0.2.1；用户验收及写操作审批另行推进。

## Issue reply / Issue 回复

The first read-only Git panel is implemented on the development branch: branch/file states, staged/unstaged diffs and Git history/details. It was tested in an isolated DSH 0.2.0-rc.2 Web profile using an installed local tarball, including live disable/enable cleanup. It is not released yet. We'll keep this issue open for user acceptance and the later write-operation design.

只读首期已在开发分支实现：分支／文件状态、已暂存／未暂存 diff、Git 历史和提交详情。已在独立 DSH 0.2.0-rc.2 Web profile 中以本地 tgz 安装验收，并验证在线禁用／启用清理；尚未发布。Issue 暂保持开放，后续继续用户验收与写操作设计。

## Remaining work / 后续工作

1. User acceptance and current-SHA CI, followed by a separately authorized new-version release. 用户验收、本次 SHA 的远端 CI，然后按独立授权发布新版本。
2. Complete Linux real-Web and edge-state browser acceptance; keep unit/real-Git claims separate. 补 Linux 真实 Web 与边缘状态浏览器验收，区分单元和真实 Git 证据。
3. Design approval/recovery before adding stage/commit/branch/stash buttons. 先设计审批和恢复，再增加暂存／提交／分支／stash 按钮。
