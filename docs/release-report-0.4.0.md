# 0.4.0 release record / 0.4.0 发布记录

Status: **complete**. npm latest=next=0.4.0, public GitHub v0.4.0, both installed acceptance runs passed; Issue #1 is closed as completed. / **发布完成**：双渠道正式实装通过，latest=next=0.4.0，Issue #1 已回复并关闭。

## Scope / 范围

Complete Issue #1's native Web workflow: selected/bulk staging and unstaging, index-only commit, local branches, stash save/apply/drop and tracked-file backup restore. Keep status, both diff sides and history, headless commands and read-only model tools. / 完整操作面板并保留首期读取及 CLI 能力。

Important documents are paired English/Chinese. GUI labels are Chinese. No remote push/pull, forced reset or model approval grants. / 核心文档双语、界面中文，不扩大到远端推拉／强制重置／模型写授权。

## Development evidence / 开发证据

- 8b9efc1: initial actions implementation; Windows build/check, 54 tests and 15-file pack dry run passed. Linux clean clone Node 22 build/artifact/check/54 tests and Node 20 54 tests passed. / 首次完整提交的独立矩阵通过。
- 293ff98: actual selected untracked/stash content previews; Windows full 55 tests passed. / 先失败回归后补实际内容。
- 9871360: actual browser exposed a native carrier mismatch. DSH HTTP bridge sets Request.url to dsh.internal while preserving the browser Host/Origin. The original URL comparison returned 403 for genuine clicks; corrected authority binding and bridge-shaped regression passed all 55 tests. / 真实宿主定位并修复，不把模拟测试当宿主证据。
- da406ac: actual browser completed stage/unstage/index-only commit/branch creation, then exposed operation controls remounting after refresh. Controls now persist across read refresh; client/type checks passed. The installed entry passed the complete browser workflow with independent Git assertions: stage/unstage/index-only commit/branches/stash/backup restore, read regression, cancellation, anonymous/foreign/missing-Origin rejection, two lifecycle cycles, zero page errors; Edge 154.0.4258.48. / 完整实装操作、独立 Git 核对、载体边界、两次启停与零页面错误通过。
- pnpm reused an old install when the same development tarball pathname was overwritten. Unique SHA filenames forced a genuine install; actual web-actions.js/client.js byte hashes then matched the source. / 实装哈希揭示缓存问题，未手改安装包。
- One temporary Linux script initially used CRLF on its final command; corrected LF and reran Node 20 successfully. / 临时脚本问题如实记录。

- Independent review reproduced staged-rename path expansion and a stash index-only preview omission. Both new real-Git tests first failed, then passed after the selected path scope was unified and stash previews included the index parent and object-derived file list. Full Windows build/check/57 tests passed. / 独立审查的范围与暂存预览问题已通过失败回归验证并修复，完整 57 项通过。

## Final gates / 最终门

- Candidate 33b7b0b: Windows build/check/57 tests; clean Linux Node20.20.2 and22.23.3 npm ci/build/artifact/check/57 tests; official services28 checks; actual installed 0.4.0 candidate tarball and complete browser operation acceptance all passed. / 最终候选的独立矩阵、宿主及完整 Web 通过。
- Current-candidate push CI37014384527 and PR CI37014560238: all four Windows/Linux × Node20/22 jobs passed. / 两组四平台组合 CI 通过。
- Independent reviewer verified a44650c and reproduced the fixes; no remaining release blockers. / 独立审查无剩余发布阻断问题。
- Actual narrow dark screenshot: [Git actions](images/git-actions-dark.png),343px panel; synthetic fixture only. / 已检查真实窄侧栏截图，不含日常仓库数据。
- Before publication, the account check returned401 and public metadata confirmed0.4.0 unused with latest=next=0.3.0. Subsequent official web login and publish authentication completed as recorded below. / 发布前曾登录过期且新版本未占用；后续官方登录及认证已完成，见下文。

Final date/SHA CI, release-point artifact gate, both public installs, latest readback and Issue closure passed below. / 发布门、双渠道实装、标签回读及 Issue 收尾全部完成，见下文；未测环境不据此宣称通过。

DSH 0.2.0-rc.2, Windows Node 24.19.0/Git 2.53.0.windows.2 and WSL Ubuntu 24.04 Node 20.20.2/22.23.3 Git 2.43.0. Only exact tested host versions are verified. Git >=2.32 is required for untracked stash previews. Real model sessions, other host versions and reverse-proxy mount deployment remain unverified. / 实测范围与能力要求分开；不推断未测环境。

Use independent DSH_HOME/profile and throwaway repos; no daily profile or credentials are modified. Final publication must use one new version upload and a single consistent npm gitHead/tag/Release/tree point. / 独立环境与发布一致性约束保持。

## Release point / 发布点

- Final feature b3e442b642590233217fba356c17e3d95273b67f; CI37014950028 and37014955276 all four jobs passed. PR#8 merge point3d7ec4aafffbe5be0dfc92e26e49bae287636d28 has exactly the same tree. / 最终分支与保留历史合并树一致。
- Main CI37015175374 at that point: all Windows/Linux × Node20/22 build/artifact/type/syntax/tests passed. / 发布点四组合门通过。
- Windows clean local clone: npm ci/build/artifact/check/57 tests passed. Rechecked build/artifact from merged HEAD with clean status. / 干净检出与合并发布点的产物一致。
- Official npm10.9.9 release pack:15 files; integrity sha512-/YOUUZ8fueQk2ZpbXKAovlJIqM5wTOogf2FH1YjoQwko8gOjJjPmrnp87xNElPxf+ds211zJekzGfNkSVZ1iMQ==. It contains closed generated runtime/types, bilingual READMEs,license,patch and hero asset; no engineering/profile/cache files. / 打包闭包及哈希已记录。
- CHANGELOG English/Chinese date2026-10-02 was committed before upload. Official browser login and the separate publish authentication completed; npm publish --tag next exited0 with a processing notice. This is upload acceptance, not public installability. / 发布日期提前入提交；登录及发布认证完成，唯一一次 publish 返回0并提示处理中，尚不等于公开可安装。

## Public GitHub channel / 公开 GitHub 渠道

- Annotated v0.4.0 points to3d7ec4aafffbe5be0dfc92e26e49bae287636d28. The public [Release](https://github.com/MashedPotato817/dsh-git-plugin/releases/tag/v0.4.0) has bilingual notes and its33644-byte tgz matches the canonical local tarball by SHA512. / tag、Release 与发布点一致，公开附件哈希一致。
- Official DSH CLI installed github:MashedPotato817/dsh-git-plugin#v0.4.0 in an isolated profile. All15 packed-file SHA256 comparisons matched the clean release checkout. The installed entry passed28 official service checks; an in-memory module hook supplied the same official dsh-tools peer used by the host, without changing installed files. / 固定 tag 正式实装，十五文件一致，实际入口二十八项服务通过。
- After restarting that profile, scripts/verify-web-actions.mjs passed the complete real browser workflow against a fresh disposable repository: stage/unstage, index-only commit, branches, stash, backup restore, read regression, cancellation, authentication/origin rejection and two enable/disable cycles; zero page errors, Edge154.0.4258.48. / 新临时仓库真实操作、独立 Git 断言、边界及两次启停全部通过。
- At2026-10-02T13:59Z, the public npm packument still had latest=next=0.3.0 and no0.4.0 version. No second publish was attempted. / 此时 npm 尚未公开新版本，未重复上传。

## Public npm channel / 公开 npm 渠道

- Registry publication time2026-10-02T14:00:13.691Z. npm0.4.0 gitHead equals3d7ec4aafffbe5be0dfc92e26e49bae287636d28. Metadata integrity and the downloaded tgz SHA512 match the canonical pack and GitHub public asset. next=0.4.0 was confirmed. / 注册表新版本已公开，提交、元数据与真实下载包哈希一致，next 已回读。
- The official DSH CLI replaced the isolated profile dependency with dsh-git-plugin@0.4.0. All15 file comparisons passed; the actual installed entry passed28 official service checks. The same independent profile was tested sequentially for both specs, never a daily profile. / npm 精确版本正式安装，十五文件及二十八项实际入口检查通过；两渠道在同一独立 profile 顺序替换验证。
- After restart, a separate fresh npm-run/actions-repo fixture passed the entire real browser workflow and independent Git assertions, authentication/Origin boundaries, confirmation cancellation, two lifecycle cycles and zero page errors. Edge154.0.4258.48; DSH0.2.0-rc.2 on Linux Node22.23.3/Git2.43.0. / 正式 npm 安装的独立新仓库也通过完整 Web 验收。
- After installed acceptance, dist-tag add dsh-git-plugin@0.4.0 latest completed its separate official browser authentication and exited0. Both the dist-tags endpoint and package packument confirmed latest=next=0.4.0. Exactly one publish and one promotion invocation were used. / 实装通过后推广成功，两个注册表入口回读一致；仅上传一次、推广一次。

## Issue completion and maintenance / Issue 收尾与维护

- [Bilingual completion reply](https://github.com/MashedPotato817/dsh-git-plugin/issues/1#issuecomment-5954190626) posted2026-10-02T14:04:32Z. Issue #1 closed as completed at14:04:34Z; GitHub API state=CLOSED was confirmed. / 双语回复含安装、范围、验收及指南，完成关闭已回读。
- Maintenance baseline and task-package handoff are synchronized in English/Chinese. Packages01–05 and07 are complete; package06's reverse-proxy mount prefix and actual slow-Web cancellation remain optional environment coverage, along with model sessions/other DSH versions. They do not block the accepted Issue #1 workflow. / 双语基线与分包同步；剩余环境补验与本次完成范围明确分开。
- Evidence-only commits follow the immutable release point; do not move v0.4.0 or republish its content when merging this report. Cleanup is limited to owned test profiles, browser fixtures and authentication files; preserve shared Node runtimes, daily profiles and the unrelated managed worktree. / 证据提交不移动发布点，清理仅限本次独立环境，保留共享运行时及日常数据。
