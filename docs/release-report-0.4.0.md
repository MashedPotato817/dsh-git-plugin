# 0.4.0 release record / 0.4.0 发布记录

Status: release prepared at the merged point; npm official login pending, not published. / 已合并并完成发布准备，等待 npm 官方登录，尚未发布。

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
- npm account check returned401; public metadata confirms0.4.0 unused and latest=next=0.3.0. Official web login will be required after release preparation. / 当前登录过期，发布前需要官方网页认证，不要求聊天发送秘密。

Pending: final date/SHA CI, release-point artifact gate, public npm/GitHub installs and latest readback, Issue reply/closure. / 未执行项不标 PASS。

DSH 0.2.0-rc.2, Windows Node 24.19.0/Git 2.53.0.windows.2 and WSL Ubuntu 24.04 Node 20.20.2/22.23.3 Git 2.43.0. Only exact tested host versions are verified. Git >=2.32 is required for untracked stash previews. Real model sessions, other host versions and reverse-proxy mount deployment remain unverified. / 实测范围与能力要求分开；不推断未测环境。

Use independent DSH_HOME/profile and throwaway repos; no daily profile or credentials are modified. Final publication must use one new version upload and a single consistent npm gitHead/tag/Release/tree point. / 独立环境与发布一致性约束保持。

## Release point / 发布点

- Final feature b3e442b642590233217fba356c17e3d95273b67f; CI37014950028 and37014955276 all four jobs passed. PR#8 merge point3d7ec4aafffbe5be0dfc92e26e49bae287636d28 has exactly the same tree. / 最终分支与保留历史合并树一致。
- Main CI37015175374 at that point: all Windows/Linux × Node20/22 build/artifact/type/syntax/tests passed. / 发布点四组合门通过。
- Windows clean local clone: npm ci/build/artifact/check/57 tests passed. Rechecked build/artifact from merged HEAD with clean status. / 干净检出与合并发布点的产物一致。
- Official npm10.9.9 release pack:15 files; integrity sha512-/YOUUZ8fueQk2ZpbXKAovlJIqM5wTOogf2FH1YjoQwko8gOjJjPmrnp87xNElPxf+ds211zJekzGfNkSVZ1iMQ==. It contains closed generated runtime/types, bilingual READMEs,license,patch and hero asset; no engineering/profile/cache files. / 打包闭包及哈希已记录。
- CHANGELOG English/Chinese date2026-10-02 was committed before upload. Published0.4.0 remains pending account authentication; do not treat prepared pack as a registry release. / 发布日期已提前入提交，准备包不等于正式发布。
