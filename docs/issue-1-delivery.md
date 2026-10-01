# Issue #1 delivery / 交付记录

## Delivered / 已交付

PR #6 and 0.3.0 deliver the first read-only native right-sidebar Git panel: branch/file state, separate staged/unstaged diffs, untracked previews and paginated history/detail. npm latest=next=0.3.0; v0.3.0 and the public Release/tgz use the same release point. Important documentation is English/Chinese. Existing commands/tools remain available.

PR #6 与 0.3.0 已交付首期原生只读侧栏：分支/文件状态、两侧 diff、未跟踪预览、分页历史/提交详情。npm latest=next=0.3.0，tag 与公开 Release/tgz 同一发布点；核心文档英中双语，保留既有命令/工具。

Verification / 验证：38 tests, current-SHA Node 20/22 CI, clean artifacts; both published install specs passed 13-file comparison, 28 service checks each and real Linux DSH 0.2.0-rc.2 Web acceptance. See [release evidence](release-report-0.3.0.md) and [Web evidence](web-panel-validation.md). / 正式双渠道实际安装验收通过，未执行项单列。

## Issue reply draft / Issue 回复草稿

This text has not been sent. / 下文未发送社区消息。

The first read-only phase is released in 0.3.0: a native Git sidebar with file status, staged/unstaged diffs, previews and Git history/details. Install with dsh plugin --profile web add dsh-git-plugin@0.3.0, replacing web with your active profile; restart DSH and refresh the browser. Tested against DSH 0.2.0-rc.2. We keep this issue open for user feedback and the later write-operation design.

只读首期已发布为 0.3.0：原生 Git 侧栏，含文件状态、两侧 diff、预览与历史/详情。使用 dsh plugin --profile web add dsh-git-plugin@0.3.0 安装，web 替换为实际 profile，重启 DSH 并刷新浏览器。实测宿主为 0.2.0-rc.2；Issue 保持开放，继续用户反馈和写操作设计。

## Remaining work / 后续

1. Actual user feedback; mount-prefix deployment and real slow Web navigation/subprocess cancellation (package 06). / 用户反馈、挂载前缀及真实慢请求切换取消。
2. Resolve write approval/recovery for stage/commit/branch/stash before implementing GUI writes (package 07). / 先设计 GUI 写操作审批/恢复，再实施。
3. Real model sessions and other host versions need their own evidence; do not widen compatibility claims. / 模型会话、其他宿主版本另行验证。
