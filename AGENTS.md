# 项目维护指引

## 当前基线（2026-10-01）

- 主工作目录：`C:/Users/Mashed Potato/Desktop/npm/dsh-git-plugin`；先确认所在 checkout，避免把改动写到另一 worktree。
- 适配已提交：`8181856`，包含严格 TypeScript 迁移、DSH 0.2.0-rc.2 适配、Git 参数安全/超时/钩子目录修复、测试与文档。
- 源码为 `src/index.ts`；`npm run build` 生成 `lib/index.js`、`lib/index.d.ts`，构建产物随 Git 提交并用于 npm 安装。保持 ESM 与现有命令/工具行为。
- 当前包版本仍为 `0.1.0`，变更位于 CHANGELOG 的 Unreleased；尚未推送、打 tag 或发布兼容版本。
- 已验证：严格类型检查、26 项测试、构建产物一致性。仅 DSH `0.2.0-rc.2` 有适配验证记录；服务栈/profile 验证不等于真实模型会话验证。
- Linux、GitHub Actions Node 20/22、GitHub 安装及其他 DSH 版本仍需验证。依赖允许范围不等于实测范围；旧版本与在线状态需重新查询。

## 必看参考

- 本地 DSH 源码：`C:/Users/Mashed Potato/Desktop/github/deepseek-harness`。只读参考，先核对其分支、提交、版本与 `AGENTS.md`，不假设本地就是最新版本。
- 相对该源码目录，优先查看：
  - `packages/interaction/commands`、`packages/core/tools`、`packages/core/system-prompt`。
  - `packages/subprocess/subprocess`、`packages/core/agent`、`packages/core/session`。
  - `docs/cordis-primer.zh.md`、`docs/cordis-tutorial/01-first-plugin.zh.md`、`docs/cookbook/extension-cookbook.zh.md`。
  - `apps/web/tests/plugin-*.e2e.ts`：插件安装、配置与管理测试。
- 本仓库：`README.md`、`CHANGELOG.md`、`docs/maintenance-plan.md`、`test/`、`scripts/verify-real-dsh.mjs`、`.github/workflows/ci.yml`。
- 在线来源：[DSH Releases](https://github.com/deepseek-ai/deepseek-harness/releases)、npm 注册表、本插件 [Issues](https://github.com/MashedPotato817/dsh-git-plugin/issues) 与 [PR](https://github.com/MashedPotato817/dsh-git-plugin/pulls)。逐包核对精确版本与 dist-tags，不盲用 `@latest`。

## 工作与验证

- 默认中文沟通。开始运行 `git status`、`git branch -vv`、`git remote -v`、`git log --oneline --graph --decorate -15`；使用功能分支，修改前说明文件与理由，保留已有改动。
- 小范围改动，先复现再修复；Git 调用保留 `ctx.subprocess` 与纯 argv，维持参数边界、超时/取消和插件启停清理。
- 常规检查：`npm run build`、`npm run check`、`npm test`、`npm pack --dry-run`；仅对实际修复补必要回归测试。
- `git diff --exit-code lib` 在提交后的干净检出中重建后运行；提交前审阅并纳入正常构建差异。
- 真实服务栈：独立目录安装目标 DSH，然后运行 `node scripts/verify-real-dsh.mjs --dsh-root <安装目录>`；使用独立 `DSH_HOME`、测试 profile 和临时 Git 仓库，不修改日常 profile。
- 分别记录类型/单元/真实 Git/真实 DSH/模型会话/各平台验证结果；未执行或失败的项目如实列出。

## 后续顺序与发布

- P1：先准备 `0.2.0` 发布候选，补验证、修正文档状态、核对安装包与发布流程；GUI 不混入此阶段。
- P2：[Issue #1](https://github.com/MashedPotato817/dsh-git-plugin/issues/1) 的 Web 只读 Git 面板：状态、diff、历史；先评估 DSH 既有变更审阅与 client slots。
- P3：再考虑 stage/commit/branch/stash 等写操作，核对 DSH 权限与审批及恢复方式。
- 版本文件、CHANGELOG、源码、编译配置、测试和 `lib/` 一起纳入发布提交；确保 tag、Release、npm gitHead 与包内产物对应同一提交。
- 同一版本只 `npm publish --tag next` 一次；验证通过后用 `npm dist-tag add dsh-git-plugin@<版本> latest` 推广。需要修改已发布内容时提升版本。
- `AGENTS.md` 作为项目指引纳入版本控制，但不加入 npm files；`.agent-teams/`、缓存和独立测试目录保持忽略。
- 提交、合并、推送、打 tag、发布及社区消息分别需要用户授权；已有授权直接执行，不重复询问。结束报告修改文件、原因、验证结果、未验证项与下一条 Git 命令。
