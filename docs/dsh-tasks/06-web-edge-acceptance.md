# Package 06: remaining real-Web acceptance / 剩余真实 Web 验收

Execute this package after reading AGENTS and [current evidence](../web-panel-validation.md). 先阅读维护指引与当前验收记录，然后执行。

> Status / 状态（2026-10-01）：Linux real Web, edge repositories, dark/narrow layouts and installed GitHub channel have passed. Do not repeat completed checks; focus on mount-prefix hosting and actual slow Web navigation/process termination. / Linux 真 Web、边缘仓库、暗色窄屏与 GitHub 实装已通过，本包后续只聚焦前缀及真实慢 Web 请求切换/子进程终止。See [release record](../release-report-0.3.0.md).

Owner / 执行：DSH. Goal / 目标：close remaining browser/platform checks without expanding GUI writes or repeating historical release work. 补真实浏览器与平台证据，不扩大到写操作、不重做旧发布。

1. Audit branch/status/SHA and preserve existing changes. Read the local Harness checkout only; use exact DSH 0.2.0-rc.2. / 先审状态和基线，只读上游，固定宿主版本。
2. Create isolated DSH_HOME, temporary repos and browser context; install a newly packed local tgz. Run Linux real DSH Web on Node 22+; record actual versions. Do not chown/reset global caches or profiles. / 独立 home、仓库、浏览器及 tgz，用 Node 22+ 补 Linux 真 Web，不动全局缓存和配置。
3. Compare clean/new/modified/deleted/renamed/conflicted/untracked/submodule/empty/detached states, both diff sides and Git object history. Test Chinese/spaces and Linux newline filenames, binary and output caps in the browser. / 对照真实 Git 验各边缘状态、特殊文件名、二进制和超限。
4. Exercise dark/narrow layouts and a DSH mount prefix. Delay requests using an owned test fixture; switch files/Sessions and close/disable the tab. Verify stale responses, cancellation and actual subprocess termination. / 补主题窄屏、前缀、真实慢请求切换取消和子进程终止。
5. Reuse scripts/verify-web-panel.mjs where its fixture applies; distinguish DOM/parser mocks from real host/browser evidence. Never export browser cookies, print auth URLs or use a daily profile. / 复用脚本，分清层级，不导出凭据、不碰日常 profile。
6. Make minimal fixes and necessary regressions; synchronize paired English/Chinese docs. Build/check/test/pack, promptly commit, then run a clean artifact gate for the new SHA. / 小修及回归、同步双语、及时提交、提交后验门。
7. Report PASS/FAIL/unexecuted items with screenshots and exact SHA. Clean only owned temp paths after checking their absolute location. / 按实际结果报告，先核对路径再清理本次临时文件。

No push, merge, release, community reply or GUI writes are included. Deliver a local commit and an updated PR draft. 本包只交付本地提交和更新的 PR 草稿；线上动作按独立授权。
