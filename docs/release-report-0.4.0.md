# 0.4.0 release record / 0.4.0 发布记录

Status: candidate, not published. / 当前为候选，未发布。

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

Pending: final Windows/Linux checks, current-SHA CI, release-point artifact gate, public npm/GitHub installs and latest readback, Issue reply/closure. / 上述未执行项不标 PASS。

DSH 0.2.0-rc.2, Windows Node 24.19.0/Git 2.53.0.windows.2 and WSL Ubuntu 24.04 Node 20.20.2/22.23.3 Git 2.43.0. Only exact tested host versions are verified. Git >=2.32 is required for untracked stash previews. Real model sessions, other host versions and reverse-proxy mount deployment remain unverified. / 实测范围与能力要求分开；不推断未测环境。

Use independent DSH_HOME/profile and throwaway repos; no daily profile or credentials are modified. Final publication must use one new version upload and a single consistent npm gitHead/tag/Release/tree point. / 独立环境与发布一致性约束保持。
