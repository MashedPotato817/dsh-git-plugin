# 0.3.0 release record / 发布记录

Date / 日期：2026-10-01 (Asia/Shanghai). Status / 状态：**Preparing / 准备中**, not yet published / 尚未发布。

## Scope / 范围

First read-only Git sidebar for Issue #1: branch/file states, independent staged/unstaged diff, untracked preview, commit history/detail, bounded authenticated Host reads, lifecycle cleanup and TSX loader build. Important documents and collaboration templates are English/Chinese. / 首期只读面板、受限认证读取、启停与 TSX 构建，以及核心文档和模板双语。

GUI writes are excluded; use Refs #1 rather than closing the full request. / 不包含 GUI 写操作，保持完整需求开放。

## Release procedure / 发布流程

1. Candidate on feat/web-git-panel: package/lock 0.3.0, paired CHANGELOG with pending date; local checks and installed-tarball Web tests. / 候选版本及双语记录、安装验收。
2. Finalize the date before npm publish, commit, push the feature branch, open PR and require its current SHA CI. / 发布前定稿日期，提交推送 PR 并核对当前 SHA CI。
3. Merge with a merge commit, preserving history. The main merge is the release point; require the final branch tree and merged tree to match, plus main CI and a clean build artifact gate. / 保留历史合并，树一致，main CI 与干净产物门通过。
4. Publish 0.3.0 once with --tag next from that point. Verify npm gitHead and installed npm UI/services, then promote latest using dist-tag. / 从统一发布点单次 publish next，实装后用 dist-tag 推广。
5. Annotated v0.3.0 and bilingual GitHub Release identify the same point. Install the fixed GitHub tag in an independent profile, compare runtime hashes and tarball closure, record evidence separately. / 同点 tag/Release，双渠道独立 profile 实装及哈希核对。

## Evidence / 证据

Baseline and pre-release development checks are in [Web validation](web-panel-validation.md); they do not substitute for the new version's PR/main CI or published channel installation. / 旧开发证据不能替代本次 CI 或正式渠道安装。

## Boundaries / 边界

DSH 0.2.0-rc.2 only has actual host evidence; declared range is separate. Real model sessions, other DSH versions and GUI writes remain unverified. User's instruction to continue through publication authorizes push/PR/merge/tag/npm/GitHub Release for this release; it does not claim the user already personally tested the panel. / 只声明实测宿主，授权发布不等于用户已经亲自试用。

No credentials or daily profiles are used in test data. / 测试不包含账号凭据、不修改日常 profile。
