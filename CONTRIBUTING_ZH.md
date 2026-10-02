# 贡献指南

[English](CONTRIBUTING.md) · 简体中文

欢迎提交缺陷报告、兼容性验证、文档改进和功能实现。讨论可以使用中文或英文，请提供可复现的事实，尊重其他参与者。

配置与安装参考：[插件配置](#插件配置) · [其他安装方式](#其他安装方式) · [兼容性与验证记录](#兼容性与验证记录)。

## 从哪里开始

- 缺陷使用 [Bug 表单](https://github.com/MashedPotato817/dsh-git-plugin/issues/new?template=bug_report.yml)。
- 新功能使用 [功能建议表单](https://github.com/MashedPotato817/dsh-git-plugin/issues/new?template=feature_request.yml)，先描述场景和验收标准。
- DSH 更新、安装准入或平台差异使用 [兼容性表单](https://github.com/MashedPotato817/dsh-git-plugin/issues/new?template=compatibility_report.yml)。
- 提交前搜索已有 [Issues](https://github.com/MashedPotato817/dsh-git-plugin/issues) 和 [PR](https://github.com/MashedPotato817/dsh-git-plugin/pulls)，重复问题补充到原讨论。
- 大功能先在 Issue 中确定范围，再按可验收阶段拆分；优先使用 Draft PR 展示未完成工作。
- 安装与支持范围见 [README](README_ZH.md)，设计与发布流程见 [维护计划](docs/maintenance-plan.md)。允许版本范围不等于全部版本均已验证。

本贡献指南和模板须进入默认分支后，GitHub 的相应入口才可使用；它们不会自动开启分支保护或创建标签。

## 其他安装方式

### 固定 GitHub tag

```bash
dsh plugin --profile web add github:MashedPotato817/dsh-git-plugin#v0.4.0
```

npm 0.4.0 与此 tag 都携带编译产物与 bundle patch，无需安装期构建；新安装自动注册，重启对应 profile 即可。旧 0.2.0 profile 按迁移说明调整，不能保留重复 insert。

### 从源码安装

```bash
git clone https://github.com/MashedPotato817/dsh-git-plugin.git
cd dsh-git-plugin
npm ci
npm run build
dsh plugin --profile web add .
```

先核对 checkout：v0.2.0 需要手动 insert；v0.2.1 含 dsh.bundle.patch，可自动注册插件。从含 bundle 的新源码安装时，不要再追加同名 insert；配置使用按 id 覆盖。旧 profile 升级不会自动补 bundle 层，保留原 insert 后再添加 bundle 会重复注册，迁移步骤见[市场收录准备](docs/marketplace-submission.md)。

修改源码后重新构建，并重启对应 profile。配置、运行行为及实际验证范围见下文。

## 插件配置

| 字段 | 默认值 | 说明 |
|---|---|---|
| `maxBytes` | `1048576` | 每次 Git 调用的 stdout 字节上限 |
| `stderrMaxBytes` | `65536` | stderr 字节上限 |
| `timeoutMs` | `30000` | 每次 Git、工具或 preCommit 调用的截止时间，单位 ms |
| `graceMs` | `3000` | 超时或取消后等待进程终止的宽限时间，单位 ms |
| `preCommit` | `[]` | 提交前执行的一个 argv 命令；失败或超时则中止提交 |

已发布的 `0.2.0` 可在启用行中配置较慢的检查：

```yaml
- insert:
    - id: dsh-git-plugin
      name: dsh-git-plugin
      config:
        preCommit: [npm, test]
        timeoutMs: 300000
```

使用 0.2.1 的 bundle 时，插件行已由 bundle 提供，用户 patch 只覆盖配置：

```yaml
- id: dsh-git-plugin
  config:
    preCommit: [npm, test]
    timeoutMs: 300000
```

`preCommit` 是参数数组，通过子进程直接执行，不是 shell 脚本。钩子与 `git add` / `git commit` 使用同一个目标仓库目录。

## 工作原理

| DSH 能力 | 插件用法 |
|---|---|
| `ctx.commands` | 注册 5 个斜杠命令 |
| `ctx.tools` | 注册 4 个只读 Git 工具 |
| `ctx.systemPrompt` | 注入 Git 工具使用与提交规范指引 |
| `ctx.subprocess` | 用纯 argv 执行 Git，落实输出上限、取消与超时终止 |

调用读取会话目录，解析目标仓库，再执行 Git 并返回文本结果。禁用插件时释放命令、工具和提示词注册；面板还清理 Web 路由、tab、slot、样式和请求，重新启用不重复注册。

模型工具均为只读：

| 工具 | 参数与行为 |
|---|---|
| `git-status` | 读取分支与工作区状态 |
| `git-diff` | 默认读取未暂存 diff；`staged=true` 读取已暂存 diff |
| `git-log` | 最近提交；`count` 控制条数，`path` 过滤文件 |
| `git-show` | 查看指定提交的 message、author 和 diff，默认 `HEAD` |

工具没有 push、reset 或文件恢复操作。插件通过 system-prompt 指引模型先查看状态，并参考仓库的提交与分支规范。

## 兼容性与验证记录

依赖声明是**允许加载的范围**，实测记录是**实际通过的版本**，两者分开看：

| 项目 | 声明 / 要求 | 已验证 |
|---|---|---|
| DSH | `>=0.2.0-rc.2 <0.3.0-0` | **仅 `0.2.0-rc.2`** |
| Node.js | `>=20` | Windows 24.19.0；Linux 20.20.2 / 22.23.3；GitHub Actions Node 20/22 |
| Git | Git 2.32+，支持未跟踪 stash 预览 | Windows 2.53.0.windows.2；Linux 2.43.0 |

### 0.2.0 的实际验证

| 层次 | 结果 |
|---|---|
| Windows / Linux 单元与真实 Git 集成 | 26 项通过，无失败、无取消 |
| 发布点 CI | Ubuntu Node 20/22 构建、类型、语法、产物新鲜度与测试通过 |
| 官方 DSH 服务栈 | 28 项通过：命令、工具、提示词、参数边界、启停清理与真实 preCommit 超时 |
| npm / 固定 GitHub tag 安装 | 独立 profile 实装与启用通过，schema 无诊断；提供官方宿主 peer 后服务栈通过 |
| 发布一致性 | npm gitHead、tag、Release 对应 `c83f332`；实际 tarball 的 `lib/` 哈希一致 |

完整证据见[发布记录](docs/release-report-0.2.0.md)与[验证报告](docs/validation-report-0.2.0.md)。上述为 0.2.0 历史验证；Linux 真实服务栈／Web 已在 [0.3.0 发布记录](docs/release-report-0.3.0.md)验证。真实模型会话和其他 DSH 版本仍未验证。

### 运行限制

- **版本限制：** DSH 0.1.x、低于下限的 `0.2.0-rc.1` 不支持；声明范围内其他版本先验证再使用。插件 `0.1.0` 不适用于 DSH `0.2.0-rc.2`。
- **运行边界：** 这是 DSH 宿主插件；普通 Node 脱离宿主加载需要自行提供 SDK peer，不作为独立 CLI 分发。
- **仓库发现：** 只检查会话目录与直接子目录；多个子仓库时列出候选，建议将会话切换到目标仓库。
- **耗时检查：** preCommit 也受默认 30 秒截止时间约束；较慢的测试请显式调大 `timeoutMs`。
- **平台边界：** Linux 本地测试和 CI 不等于完整 DSH 宿主验证；上游开发 peer 链的 Node 20 engine 告警见验证报告。
- **界面范围：** 0.2.x 提供命令与工具，0.3.0 已发布只读 Web 面板，0.4.0 增加人工确认的 Git 操作。见[面板说明](docs/web-panel_ZH.md)。

## 准备开发环境

使用满足 [package.json](package.json) 的 Node.js 与支持 `--end-of-options` 的 Git。当前插件要求 Node >=20；Node 20 的上游开发 peer 依赖 engine 警告及验证范围见 [验证报告](docs/validation-report-0.2.0.md)，不能用本地测试推断整个 DSH 宿主兼容。

先阅读 [AGENTS_ZH.md](AGENTS_ZH.md)，然后检查实际 checkout：

```bash
git status
git branch -vv
git remote -v
git log --oneline --graph --decorate -15
```

外部贡献者先 fork，再克隆自己的 fork，确认 `origin` 指向自己的仓库、`upstream` 指向本仓库。
以已确认的基线建立功能分支；不要直接改 `main`。例如，在基线已经是本地 `main` 时：

```bash
git switch -c feat/your-feature main
npm ci
git config core.hooksPath .githooks
```

钩子配置仅影响当前仓库。不要用 `@latest` 统一安装 DSH 子包；核对精确版本、peer 和 dist-tags。参考上游 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 对应版本的源码、README 与插件示例。机器本地参考目录由 AGENTS.md 指定，不要求贡献者具备相同路径。

## 修改与提交

- Host 源码在 `src/`，客户端在 `src/client/`，使用严格 TypeScript / TSX。保留 ESM、公开命令/工具和配置行为；接口变更说明迁移方式。
- `lib/` 是构建产物，使用 `npm run build` 生成，并与源码同批提交，禁止手工修改。
- Git 调用使用 `ctx.subprocess` 与纯 argv，保持参数边界、仓库目录、超时/取消、输出上限和启停清理。
- 测试使用临时 Git 仓库、独立 `DSH_HOME` 与 profile，不修改日常工作内容。
- 小范围修改；不要把 unrelated 重构、格式化、版本提升或 GUI 写操作混入其他修复。README/CHANGELOG 与用户可见行为同步。
- 每完成一个可审阅阶段，验证后立即本地 commit，不等待维护者批准提交。仅显式暂存本任务文件；保留用户或其他任务的改动。
- 收尾检查 `git status --porcelain`。任务开始干净且无并行改动时，应保持干净；不要用删除、reset、stash 或夹带无关提交来清空状态。

分支常用 `feat/`、`fix/`、`docs/`、`chore/`。提交格式为 `<type>(<scope>): <中文主体>`，scope 可省略。
type 支持 `feat/fix/docs/chore/style/refactor/test/perf/ci`。例如：

```text
fix(timeout): 修复取消后的进程清理
docs(contributing): 补充贡献说明
ci: 增加客户端构建检查
```

保留原始 revert 消息；普通合并保留历史，不默认 squash/rebase，不强推他人分支。自动代理的本地 commit 持续授权见 AGENTS.md；推送、合并、tag、发布和社区消息按各自授权执行。

## 验证与证据

源码、依赖或构建变更至少执行：

```bash
npm run build
npm run check
node --check lib/index.js
node --check lib/client.js
npm test
npm pack --dry-run
```

测试针对编译产物运行，改源码后必须先 build。只为行为变化和真实缺陷补必要回归。
纯文档/模板变更检查链接、模板格式与 `git diff --check`；无运行时代码影响时可说明测试不适用。

提交前检查暂存差异并提交：

```bash
git add <本任务明确文件>
git diff --cached --check
git diff --cached --stat
git commit -m "fix(scope): 描述本次修复"
git status --porcelain
```

构建产物门 `git diff --exit-code lib` 在**提交后的干净检出**重建后执行，不用它否定提交前正常的构建差异。未推送 SHA 从本地仓库克隆；远端克隆必须确实包含该 SHA。

修改 DSH 接口、生命周期、命令/工具行为时，按 [真实 DSH 服务栈验证](#真实-dsh-服务栈验证) 与维护计划，安装精确 DSH 版本并运行 `scripts/verify-real-dsh.mjs`。
真实服务栈、profile 和模型会话是不同验证层次；分别写版本、平台、命令、退出码和失败/未执行项。
GUI 需另验真实 Web 的注册、切换、禁用/启用及打包安装。不得把 mock 或旧提交的 CI 写成当前改动通过。

### 真实 DSH 服务栈验证

按需安装独立宿主包并运行验证，不属于日常 `npm test` 或 CI：

```bash
npm install --prefix .tmp-dsh-verify --no-save @deepseek-ai/dsh@0.2.0-rc.2
node scripts/verify-real-dsh.mjs --dsh-root .tmp-dsh-verify
```

退出码：`0` 全通过，`1` 有失败，`2` 宿主包或参数无法解析。换 DSH 版本时在独立 `DSH_HOME` 和临时仓库验证，服务栈成功仍不能替代真实模型会话。

## Pull Request 与审查

PR 使用 [模板](.github/pull_request_template.md)，说明触发问题、改后行为、关联 Issue、验证证据和未验证项。
关联未完成需求用 `Refs #编号`；只有确实完整解决时才用 `Closes #编号`。提交 PR 不自动表示同意合并或发布。

维护者与贡献者按以下顺序协作：

| 阶段 | 负责人 | 输出 |
|---|---|---|
| 问题分流 | 维护者 | 判断插件/上游/环境问题，关联重复报告，索取最小缺失信息 |
| 范围确认 | 维护者与贡献者 | 一个明确目标、验收标准、支持版本与本阶段排除项 |
| 实现与本地提交 | 贡献者 | 小范围提交、必要测试、完整阶段交接 |
| 审查与 CI | 维护者 | 审阅 argv/权限/清理/产物与文档；核对当前 PR SHA 的 Node 20/22 CI |
| 合并与发布 | 有仓库权限的维护者 | 按授权与维护计划执行，记录实际发布点和渠道安装结果 |

维护者可按需使用 `bug`、`enhancement`、`compatibility`、`needs-info` 等标签；本次模板不依赖标签预先存在。
没有约定固定响应时限。需要补充信息时说明具体缺口；关闭重复或暂不实施的需求时说明原因与后续条件。
CI 通过是审查依据；合并前还需满足项目的实际使用验收。默认分支保护等 GitHub 设置需维护者另行配置，本文件不声称已启用。

## 发布边界

贡献 PR 通常不修改版本号。发布任务遵循 [维护计划第 9 节](docs/maintenance-plan.md#9-发布步骤本地-commit-自动执行线上动作按授权执行)：
发布日期先进入最终提交，从同一发布点 publish 到 `next` 一次；验证后使用 dist-tag 推广 `latest`。
tag、Release、npm gitHead 与包内 lib 对应同一发布点；已发布内容需要修复时提升版本。
