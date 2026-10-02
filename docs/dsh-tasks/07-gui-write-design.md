# Package 07: GUI write approval design / GUI 写审批设计

> Completed2026-10-02: design and implementation released as0.4.0; both public installs passed complete Web acceptance and Issue #1 is closed. Native operator GUI confirmation is separate from turn-bound model approval. The instructions below are historical, not a request to repeat implementation or publication. / 已完成设计、实现及 0.4.0 双渠道验收发布，Issue #1 已关闭；GUI 人工确认独立于模型回合审批。下文保留历史提示词，不重复执行。See [release evidence](../release-report-0.4.0.md) and [accepted design](../superpowers/specs/2026-10-02-git-actions-design.md).

Read AGENTS, Issue #1, the implemented read-only Host/client and the exact upstream approval contracts. 阅读维护指引、Issue #1、已实现只读面板与上游审批契约。

Owner / 执行：DSH. Scope / 范围：reviewable design and optional isolated proof, not production write buttons. 可审设计与隔离验证，不直接加入生产写按钮。

1. Verify how official approval behaves without an open model turn. Cite actual upstream source/type/test evidence, not guessed APIs. / 核实无 open turn 的真实审批行为，以源码和测试取证。
2. Choose the smallest supported workflow for explicit approval of stage/unstage, commit and recovery. If unsupported, report the precise upstream gap instead of bypassing approval. / 设计最小显式审批流程；不支持则写清上游缺口，不绕过。
3. Define scope preview, Session/repository identity, race/conflict checks, cancellation and recovery. Do not conflate read authentication with write permission. / 定义范围预览、身份、并发冲突、取消及恢复，不把读取认证当写许可。
4. Compare staged-only commit vs current /commit all-changes behavior and explain the user-facing scope. / 明确仅暂存提交与现有全量 /commit 的差异。
5. Produce paired English/Chinese design, acceptance checklist, risk boundaries and separate small implementation packages. Use temporary repos for any proof and promptly commit passed reviewable work. / 交付双语设计、验收表、边界及分包；验证用临时仓库，及时提交。

Do not merge, publish, close Issue #1 or send messages in this package. 本包不合并、不发布、不关闭 Issue 或发送社区消息。
