# Changelog

本文件记录 `dsh-git-plugin` 的实际变更。格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

## [0.2.1] - 待发布

### Added

- DSH bundle 安装元数据与 cordis.patch.yml；新安装自动注册插件，patch 同步导出并纳入发布包。
- dsh-market 收录条件、Git 分类条目草稿与旧 profile 迁移说明。
- screenshots.json 市场展示图片声明，使用现有原创能力横幅。

### Changed

- README：原创 SVG 横幅与精简的产品介绍、安装/使用步骤；配置、源码安装、架构与验证细节移入 CONTRIBUTING.md，维护约束放 AGENTS.md。修正发布后 CI 状态，区分已发布 0.2.0 与开发中 bundle。

## [0.2.0] - 2026-10-01

适配目标：DeepSeek Harness（DSH）0.2.0-rc.2。允许版本范围与实际验证版本分开记录；真实模型会话仍未验证。

### Added

- TypeScript 源码：新增 `src/index.ts`（`strict`）与 `tsconfig.json`，编译产物为 `lib/index.js` + `lib/index.d.ts`；
  新增 `npm run build`（tsc 输出）与 `npm run check`（`tsc --noEmit` 类型检查）。
- 回归测试：`git-show` 选项注入、`timeoutMs` 覆盖斜杠命令 / 只读工具 / preCommit、调用方取消、
  子仓库自动发现后的 preCommit 工作目录。
- `scripts/verify-real-dsh.mjs`：按需运行的真实 DSH 服务栈验证（官方 `cordis` + `dsh-commands` +
  `dsh-tools` + `dsh-system-prompt` + `dsh-subprocess-local` + 真实 Git），刻意不纳入 `npm test` / CI。
- 包元数据：`repository`、`bugs`、`homepage`、`engines.dsh`、`dsh.manifestVersion`。
- 文档：`CHANGELOG.md`、`docs/maintenance-plan.md`（含版本证据、验证结果与发布步骤）。
- 仓库协作：`CONTRIBUTING.md`、缺陷/功能/兼容性 Issue 表单与 PR 模板；提交钩子支持 `ci` 类型。

### Changed

- **DSH 兼容范围**：`peerDependencies` 中 4 个 `@deepseek-ai/dsh-*` 由 `^0.1.0-rc.6` 改为
  `>=0.2.0-rc.2 <0.3.0-0`；`devDependencies` 固定为 `0.2.0-rc.2`。
  旧范围不匹配运行时 0.2.0-rc.2，会被 DSH 的 peer 准入检查拒绝加载。
- **`timeoutMs` 真正生效**：原先只写在工具定义的 `timeoutMs` 上（该字段在 DSH 中仅作声明，
  且对斜杠命令与 preCommit 完全无效）；现在由插件自行持有截止时间，超时后终止进程并返回明确结果。
- **`/commit` 的工作目录**：先解析一次仓库根目录，preCommit 钩子与 `git add` / `git commit`
  使用同一个目录，修复「自动发现子仓库后钩子仍跑在会话根目录」的问题。
- **取消 / 超时的结果**：仓库探测被取消或超时时不再被误报为 `not a git repository`。
- 包入口：`files` 由单个文件改为 `lib`（含类型声明），`exports` 增加 `types` 条件。

### Fixed

- `git-show` 的 `ref` 参数不再可能被 Git 解释为选项：`--output=<file>` 这类取值此前会让
  `git show` 写出任意文件，现在以 `--end-of-options` 固定为 revision，选项形式引用会被 Git 拒绝，
  文件不会生成；`HEAD`、`HEAD~1`、分支名等合法引用行为不变。
- 已取消的调用方信号不再导致调用挂起：信号在 spawn 前已中止时立即返回 `aborted`。
- **截止时间定时器不再被 `unref`**：`runProcess` 的超时定时器与 `terminateHandle` 的宽限定时器此前标为
  `unref`，在被等待的 promise 只由该定时器推进时，事件循环会在到期前耗尽（Linux Node 20/22 上稳定复现：
  `npm test` 有 5 项被 `cancelledByParent`），等于超时可能被跳过。现在两个定时器都保持引用，并在操作结束时
  清除，既不跳过超时也不延长进程寿命。
