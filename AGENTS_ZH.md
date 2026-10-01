# 项目维护指引

[English](AGENTS.md) · 简体中文

## 当前基线（2026-10-01）

- 当前包版本 0.2.1；PR #4 已保留历史合并，发布点为 084a767aa3055d5cb0e06ddf4fb42dda4156458c。npm latest=next=0.2.1、annotated tag 与公开 GitHub Release 均已核对该发布点，双渠道独立实装和各 28 项服务栈通过。市场 PR #6296 已转为可审查，上游两个检查通过，尚未收录，详见 docs/release-report-0.2.1.md。

- 主工作目录：`C:/Users/Mashed Potato/Desktop/npm/dsh-git-plugin`；先确认所在 checkout，避免把改动写到另一 worktree。
- 适配已提交：`8181856`，包含严格 TypeScript 迁移、DSH 0.2.0-rc.2 适配、Git 参数安全/超时/钩子目录修复、测试与文档。
- 源码为 `src/index.ts`；`npm run build` 生成 `lib/index.js`、`lib/index.d.ts`，构建产物随 Git 提交并用于 npm 安装。保持 ESM 与现有命令/工具行为。
- `0.2.0` 历史发布，CHANGELOG 日期 2026-10-01；PR #2 已以 merge commit 保留历史合并，统一发布点为 `c83f3322950b0892022d6b3efd1e4f6edbed5be8`。远端 annotated tag `v0.2.0`、公开 GitHub Release 与 npm 0.2.0 的 gitHead 均指向它，tarball 与双渠道实装产物一致。当时 npm latest=next=0.2.0，双渠道发布完成（当前标签已推广至 0.2.1）；不重复 publish 或移动 tag。证据见 `docs/release-report-0.2.0.md`。
- 已验证：严格类型检查、26 项测试、构建产物一致性，以及 **Linux Node 20.20.2 / 22.23.3 的隔离矩阵**（WSL2 Ubuntu 24.04；修复后 build/check/test 通过；修复候选 922408d 的提交后干净产物门与完整 Linux 矩阵已通过）。仅 DSH `0.2.0-rc.2` 有适配验证记录；服务栈/profile 验证不等于真实模型会话验证。完整证据见 `docs/validation-report-0.2.0.md`。
- 发布点 GitHub Actions Ubuntu Node 20/22 已通过；npm 0.2.0 与固定 GitHub tag 的独立 profile 安装/启用/schema，以及官方 peer 下各 28 项服务栈验证已通过。Linux 完整 DSH 服务栈、真实模型会话及除 `0.2.0-rc.2` 外的 DSH 版本仍待验证；允许范围不等于实测范围。
- 包 01 复查发现并修复了一个真实缺陷：截止时间/宽限定时器曾被 `unref`，在被等待的 promise 只由该定时器推进时超时会被跳过（Linux 上稳定复现）。修复和重建的 `lib/`、验证脚本加固已提交为 `922408d`；该 SHA 的 Linux Node 20/22 干净检出产物门与完整矩阵已通过。

## 当前开发任务

- `feat/web-git-panel` 已实现 Issue #1 的首版只读右侧面板、Host 路由和 TSX 构建；属于 Unreleased，不覆盖 npm 0.2.1，不混入 GUI 写操作。
- README / CONTRIBUTING / AGENTS 采用英文主文档和 `_ZH.md` 中文对应页；面板使用文档同样配对，修改时同步事实、命令和验收边界。
- 新 Web 证据见 `docs/web-panel-validation.md`；不能将旧发布点的 CI 当作本分支 CI。
- 当前源码为 src/index.ts、src/web-host.ts、src/panel-types.ts 和 src/client/；客户端通过小型构建生成官方 loader 包装，复用宿主 React，不手改 lib/client.js、不捆绑第二份 React。
- Web 从运行中／持久化 Session 获取 cwd；拒绝请求提供任意 cwd/root/argv，限制相对路径、literal pathspec、external diff/textconv。DSH 0.2.0-rc.2 是单一已准入 operator，并无按租户分隔的 Session ACL，不能宣称租户隔离。
- 禁用时清理 UI、样式、tab、slot、路由和进行中的请求；切换会话后旧响应不能覆盖新视图。真实 Web 验收脚本 scripts/verify-web-panel.mjs 按需运行，不进入 npm test/CI。


## 必看参考

- 本地 DSH 源码：`C:/Users/Mashed Potato/Desktop/github/deepseek-harness`。只读参考，先核对其分支、提交、版本与 `AGENTS.md`，不假设本地就是最新版本。
- 相对该源码目录，优先查看：
  - `packages/interaction/commands`、`packages/core/tools`、`packages/core/system-prompt`。
  - `packages/subprocess/subprocess`、`packages/core/agent`、`packages/core/session`。
  - `docs/cordis-primer.zh.md`、`docs/cordis-tutorial/01-first-plugin.zh.md`、`docs/cookbook/extension-cookbook.zh.md`。
  - `apps/web/tests/plugin-*.e2e.ts`：插件安装、配置与管理测试。
- 本仓库：`CONTRIBUTING.md`、`README.md`、`CHANGELOG.md`、`docs/maintenance-plan.md`、`test/`、`scripts/verify-real-dsh.mjs`、`.github/workflows/ci.yml`。
- 在线来源：[DSH Releases](https://github.com/deepseek-ai/deepseek-harness/releases)、npm 注册表、本插件 [Issues](https://github.com/MashedPotato817/dsh-git-plugin/issues) 与 [PR](https://github.com/MashedPotato817/dsh-git-plugin/pulls)。逐包核对精确版本与 dist-tags，不盲用 `@latest`。

## 工作与验证

- 默认中文沟通。开始运行 `git status`、`git branch -vv`、`git remote -v`、`git log --oneline --graph --decorate -15`；使用功能分支，修改前说明文件与理由，保留已有改动。
- 小范围改动，先复现再修复；Git 调用保留 `ctx.subprocess` 与纯 argv，维持参数边界、超时/取消和插件启停清理。
- 常规检查：`npm run build`、`npm run check`、`npm test`、`npm pack --dry-run`；仅对实际修复补必要回归测试。
- `git diff --exit-code lib` 在提交后的干净检出中重建后运行；提交前审阅并纳入正常构建差异。
- 真实服务栈：独立目录安装目标 DSH，然后运行 `node scripts/verify-real-dsh.mjs --dsh-root <安装目录>`；使用独立 `DSH_HOME`、测试 profile 和临时 Git 仓库，不修改日常 profile。
- 分别记录类型/单元/真实 Git/真实 DSH/模型会话/各平台验证结果；未执行或失败的项目如实列出。

## 后续顺序与发布

- P1：`0.2.1` 双渠道发布、bundle 自动启用、README 展示与市场收录申请已完成；市场 PR #6296 等待上游审查合并及目录同步，之后核验市场搜索与实际安装。GUI 另开阶段。
- P2：[Issue #1](https://github.com/MashedPotato817/dsh-git-plugin/issues/1) 的 Web 只读 Git 面板：状态、diff、历史首期已实现；继续补验及用户验收。
- P3：再考虑 stage/commit/branch/stash 等写操作，核对 DSH 权限与审批及恢复方式。
- 版本文件、CHANGELOG、源码、编译配置、测试和 `lib/` 一起纳入发布提交；确保 tag、Release、npm gitHead 与包内产物对应同一提交。
- 同一版本只 `npm publish --tag next` 一次；验证通过后用 `npm dist-tag add dsh-git-plugin@<版本> latest` 推广。需要修改已发布内容时提升版本。
- `AGENTS.md`、`docs/`、`.agent-teams/` 不进入 npm files；已发布 0.2.1 实际为 7 文件；当前开发包增加 Web 产物及 README_ZH，按实际 pack 文件表核验。原 0.2.0 发布包仍为 5 文件，不可覆盖；缓存与独立测试目录保持忽略。
- 本地 commit 已获持续授权：每个任务或可审阅阶段完成验证后，立即执行 commit，不再请求用户认可。合并、推送、打 tag、发布及社区消息仍按各自授权执行；已有授权不重复询问。结束报告提交 SHA、文件与原因、验证结果、未验证项和工作区状态。

## README 与市场安装（0.2.1 已发布）

- README 保持简洁的产品首页：用途、能力、最短安装步骤、使用示例与文档入口。配置细节、源码安装、架构、测试和发布流程放 CONTRIBUTING.md / docs；代理维护约束放 AGENTS.md。无需为一次文档调整新增 skill。
- 精简时保留已发布版本的真实启用方式、提交全部改动和 stash 的含义，以及实际验证宿主版本；不将开发中 bundle、未实现 GUI 或市场草稿描述为已经发布/收录。

- README 与 bundle 自动注册已进入 main，用户已授权全部上线步骤；npm latest=next=0.2.1，GitHub Release 已公开，双渠道验证通过。市场 PR #6296 尚待审查/合并，不宣称已收录；不能重发 0.2.0 / 0.2.1。
- 市场图片声明在根 screenshots.json，指向原创能力横幅；横幅仍是能力示意图，不得将其当作功能截图；docs/images/git-panel.png 为开发版真实 Web 验收截图。该声明由目录读取 GitHub，无需进入 npm files。
- 市场来源是 `awesome-dsh-plugin/awesome-dsh-plugin`；条目、验证和旧 profile 迁移见 `docs/marketplace-submission.md`。老 insert 与新 bundle 同时启用会出现两个插件行，必须迁移为按 id 覆盖；DSH 0.2.0-rc.2 对旧依赖升级不自动补 bundle 层。

## 后续任务入口（2026-10-01 核查）

- 任务分包见 [docs/dsh-tasks/README.md](docs/dsh-tasks/README.md)：验证补齐 → 发布 → Web Host → TSX UI → 真实 Web 验收；逐包完成与交接，不一次混做。
- 原候选 feba7b8，定时器修复 922408d，发布点 c83f332；PR/main 当前 SHA CI 均通过，协作文档与模板已进入默认分支。包 02 的 npm、GitHub、latest 推广与双渠道安装均完成；随后按 03–05 实施只读 Web，另开功能分支。
- Linux Node 20/22 已用**隔离运行时**（WSL2 Ubuntu 24.04，`~/dsh-node-runtimes/node-v20.20.2-linux-x64`、`node-v22.23.3-linux-x64`）完成修复后 build/check/test 复验；修复候选 922408d 的 npm ci/build/产物门/check/语法/test/pack 全部通过。系统 Node 18.19.1 未用于验证。证据见 `docs/validation-report-0.2.0.md`。未推送 SHA 的干净检出从本地主仓库克隆。

## 自动本地提交与收尾

- 每个任务或可审阅阶段完成后，运行相关验证，显式 git add 本任务文件，检查 git diff --cached --check 与暂存差异，执行规范中文 commit；不能只给出 commit 建议或等待用户认可。
- 用 git status --porcelain 确认本任务没有遗漏。原本干净且无其他任务改动时，收尾工作区应干净；有用户或其他任务的改动时保留并说明，不为清空状态而删除、重置、stash 或顺带提交。
- 构建产物与源码同批提交；不同目的的修复与流程规则分别提交。不自动 amend 已有提交。提交后需要产物门的任务，验证完成后及时提交报告。
- 尚未完成但需要保存进度时可以做明确标注未完成的本地 checkpoint commit，不宣称测试或任务通过。commit 失败先排查并修复；凭据、缓存、临时测试数据不纳入提交。

## 社区协作入口

- 贡献指南见 CONTRIBUTING.md；Issue 表单在 .github/ISSUE_TEMPLATE，PR 使用 .github/pull_request_template.md。报告必须区分本地、真实宿主、模型会话与当前 SHA 的 CI 证据。
- 大任务先明确 Issue 范围与验收条件，拆阶段提交；维护者负责分流、审查与合并/发布。模板需进入默认分支后生效，不宣称标签、分支保护或远端设置已经启用。
