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

## Candidate verification / 候选验收

- d956aac: Windows clean npm ci/build/artifact/check/38 tests passed; branch and PR Node 20/22 CI passed (runs 36876828315 / 36877460612). / 干净门及候选远端矩阵通过。
- 176aeec fixes an actual dark-theme defect found in browser screenshots: nonexistent background token caused white text on pale selected/detail surfaces. Uses the official bg-layer-2 token, dark diff colors and actual rendered text contrast >=4.5:1. / 真实截图先发现缺陷，修正后对比度回归通过。
- Linux WSL2 Ubuntu 24.04, Node 22.23.3/npm 10.9.9, pnpm 11.7.0, Git 2.43.0; official DSH 0.2.0-rc.2, Cordis 4.0.4; exact-host 28 checks passed. / 实测版本及服务栈。
- Installed local 0.3.0 tgz on Linux: real UI/status/both diffs/history, anonymous 401/foreign Origin 403/unknown Session 404/invalid parameters 400, two disable/enable cycles and dark contrast passed; pageErrors=0. / Linux 真实安装、读取边界、启停与暗色通过。
- Actual clean/empty/detached/conflicted/renamed/deleted/submodule/newline/literal pathspec/binary/oversize cases and narrow 343px sidebar passed via browser/Host reads. / 实际边缘仓库与窄面板通过。
- WSL /tmp did not persist between separate invocations; an owned home directory was used. A Windows pnpm was initially selected by inherited PATH and failed with UNC EPERM; isolated Linux pnpm and a Linux-only child PATH resolved it without global changes. / 临时路径与包管理器问题均局限于独立测试环境。
- Full native dump-config-schema returns exit 1 for four shipped Loader carriers (/179–/182), plus two upstream warnings. The actual Web and plugin activation run successfully; this is recorded as a host/schema-tool limitation, not an all-schema PASS. / 保留上游 schema 工具诊断，不将其写成全 schema 通过。
- Mount-prefix deployment and real slow Web subprocess navigation remain unexecuted; controlled cancellation and real preCommit process deadline are separate evidence. Real model calls, other host versions and GUI writes remain outside this release's claims. / 前缀与慢 Web 进程仍待专项验收，严格区分证据。
