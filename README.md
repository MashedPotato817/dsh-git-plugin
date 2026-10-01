# dsh-git-plugin

<p align="center">
  <img src="./assets/readme/hero.svg" width="100%" alt="Git 工作流进入 DeepSeek Harness 会话：查看改动、新建分支、提交和可恢复快照">
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/dsh-git-plugin"><img src="https://img.shields.io/npm/v/dsh-git-plugin?style=flat-square&amp;color=E76F51" alt="npm version"></a>
  <a href="https://github.com/MashedPotato817/dsh-git-plugin/actions/workflows/ci.yml"><img src="https://github.com/MashedPotato817/dsh-git-plugin/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI on main"></a>
  <a href="https://www.npmjs.com/package/dsh-git-plugin"><img src="https://img.shields.io/npm/dm/dsh-git-plugin?style=flat-square&amp;color=218C74" alt="npm downloads"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-218C74?style=flat-square" alt="MIT license"></a>
</p>

<p align="center">
  <a href="#安装">安装</a> · <a href="#使用">使用</a> · <a href="#命令与工具">命令与工具</a> · <a href="#配置">配置</a> · <a href="#验证与兼容性">兼容与验证</a> · <a href="#文档与贡献">贡献</a>
</p>

## 让 Git 工作流留在 DSH 会话里

查看改动、创建分支、规范提交、保存可恢复快照。面向 DeepSeek Harness（DSH）的 **5 个斜杠命令**与**4 个模型只读工具**，配合 Git 提示词指引，让人和模型看到同一份仓库状态。

| 你需要做什么 | 插件提供什么 |
|---|---|
| 开始修改前了解仓库 | 分支、工作区状态、已暂存 / 未暂存 diff、提交历史 |
| 为一项改动创建分支 | `/branch <name>` 创建并切换分支 |
| 提交前运行检查 | `/commit <message>` 先执行配置的 preCommit，再暂存全部改动并提交 |
| 暂时收起工作区改动 | `/undo` 保存 stash 快照，`list` 查看、`pop` 恢复 |
| 在项目集合中定位仓库 | 自动使用唯一的直接子仓库；多个候选时列出目录供选择 |

**推荐组合：插件 `0.2.0` + DSH `0.2.0-rc.2`。** [npm](https://www.npmjs.com/package/dsh-git-plugin/v/0.2.0) 与 [GitHub Release](https://github.com/MashedPotato817/dsh-git-plugin/releases/tag/v0.2.0) 已发布；宿主仍是预发布版本。Web 可视化 Git 面板见 [Issue #1](https://github.com/MashedPotato817/dsh-git-plugin/issues/1)，当前尚未实现。

## 安装

### 1. 安装已发布版本

已有 DSH `0.2.0-rc.2` 时，在需要使用插件的 profile 中执行：

```bash
dsh plugin --profile web add dsh-git-plugin@0.2.0
```

将 `web` 替换为你实际使用的 profile。GitHub 安装可固定到同一发布 tag：

```bash
dsh plugin --profile web add github:MashedPotato817/dsh-git-plugin#v0.2.0
```

两个渠道都携带 `lib/` 编译产物，无需安装期构建。

### 2. 启用 0.2.0

**已发布的 `0.2.0` 是普通插件依赖，安装后仍需启用。** 在该 profile 的 `cordis.patch.yml`（`<DSH_HOME>/profiles/web/cordis.patch.yml`）追加：

```yaml
- insert:
    - id: dsh-git-plugin
      name: dsh-git-plugin
```

重启对应 profile 的 DSH；使用 Web 时刷新页面。随后可查看 `/status`、`/diff` 等命令，以及模型侧的 4 个只读工具。

> **开发分支的自动安装变化：** 当前源码新增 `dsh.bundle.patch`，供下一版本自动注册插件；这个变化尚未发布到 npm `0.2.0`。从新源码安装时不必再追加 `insert`；配置改为覆盖已有行。已有手工启用的 profile 迁移方法见[市场收录准备](docs/marketplace-submission.md)。

### 源码安装

```bash
git clone https://github.com/MashedPotato817/dsh-git-plugin.git
cd dsh-git-plugin
npm ci
npm run build
dsh plugin --profile web add .
```

先核对 checkout：`v0.2.0` 仍按上面的方式手动启用；含 bundle 声明的新源码会注册自动加载层。修改源码后重新构建并重启对应 profile。

## 使用

先查看，再决定如何操作：

```text
/status
/diff
/branch feat/my-change
/commit feat: 完成一项修改
```

也可以让模型先调查仓库：

> 先查看 Git 状态、diff 和最近 5 条提交，说明哪些改动已暂存，并指出提交前需要检查的内容。

**`/commit <message>` 会执行 `git add -A`，把目标仓库的全部改动纳入提交。** 执行前确认范围；不带参数的 `/commit` 只显示提交规范与改动，不会创建提交。

`/undo` 的含义是 **stash 工作区改动**，包括未跟踪文件，不是回退已创建的 commit；`/undo pop` 恢复时可能遇到 Git 冲突，按 Git 输出处理。

## 命令与工具

### 给人使用的斜杠命令

| 命令 | 行为 |
|---|---|
| `/status` | 当前分支与工作区状态 |
| `/diff` | 已暂存、未暂存的 diff 摘要 |
| `/branch [<name>]` | 无参数列出分支；有参数新建并切换 |
| `/commit [<message>]` | 无参数显示规范与改动；有参数执行 preCommit、`git add -A` 与提交 |
| `/undo [list\|pop]` | 默认创建 stash 快照；列出或恢复快照 |

### 给模型使用的只读工具

| 工具 | 行为 |
|---|---|
| `git-status` | 读取分支与工作区状态 |
| `git-diff` | 默认读取未暂存 diff；`staged=true` 读取已暂存 diff |
| `git-log` | 最近提交；`count` 控制条数，`path` 过滤文件 |
| `git-show` | 查看指定提交的 message、author 和 diff，默认 `HEAD` |

工具没有 push、reset 或文件恢复操作。插件通过 system-prompt 指引模型先查看状态，并参考仓库的提交与分支规范。

## 配置

| 字段 | 默认值 | 说明 |
|---|---|---|
| `maxBytes` | `1048576` | 每次 Git 调用的 stdout 字节上限 |
| `stderrMaxBytes` | `65536` | stderr 字节上限 |
| `timeoutMs` | `30000` | 每次命令、工具或 preCommit 调用的截止时间，单位 ms |
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

使用 bundle 的新源码时，插件行已由 bundle 提供，用户 patch 只覆盖配置：

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

调用读取会话目录，解析目标仓库，再执行 Git 并返回文本结果。禁用插件时释放命令、工具和提示词注册；重新启用不重复注册。

## 验证与兼容性

依赖声明是**允许加载的范围**，实测记录是**实际通过的版本**，两者分开看：

| 项目 | 声明 / 要求 | 已验证 |
|---|---|---|
| DSH | `>=0.2.0-rc.2 <0.3.0-0` | **仅 `0.2.0-rc.2`** |
| Node.js | `>=20` | Windows 24.19.0；Linux 20.20.2 / 22.23.3；GitHub Actions Node 20/22 |
| Git | 支持 `--end-of-options`，Git 2.24+ | Windows 2.53.0.windows.2；Linux 2.43.0 |

### 0.2.0 的实际验证

| 层次 | 结果 |
|---|---|
| Windows / Linux 单元与真实 Git 集成 | 26 项通过，无失败、无取消 |
| 发布点 CI | Ubuntu Node 20/22 构建、类型、语法、产物新鲜度与测试通过 |
| 官方 DSH 服务栈 | 28 项通过：命令、工具、提示词、参数边界、启停清理与真实 preCommit 超时 |
| npm / 固定 GitHub tag 安装 | 独立 profile 实装与启用通过，schema 无诊断；提供官方宿主 peer 后服务栈通过 |
| 发布一致性 | npm gitHead、tag、Release 对应 `c83f332`；实际 tarball 的 `lib/` 哈希一致 |

完整证据见[发布记录](docs/release-report-0.2.0.md)与[验证报告](docs/validation-report-0.2.0.md)。**真实模型会话、Linux 完整 DSH 宿主、其他 DSH 版本仍未验证。**

### 开发者自检

源码为严格 TypeScript，`src/index.ts` 编译到 `lib/index.js` 和 `lib/index.d.ts`；构建产物随 Git 提交。

```bash
npm ci
npm run build
npm run check
npm test
npm pack --dry-run
```

测试运行编译产物；改源码后先构建。提交后的干净检出还需重建并运行 `git diff --exit-code lib`。

### 官方 DSH 服务栈验证

按需安装独立宿主包并运行验证，不属于日常 `npm test` 或 CI：

```bash
npm install --prefix .tmp-dsh-verify --no-save @deepseek-ai/dsh@0.2.0-rc.2
node scripts/verify-real-dsh.mjs --dsh-root .tmp-dsh-verify
```

退出码：`0` 全通过，`1` 有失败，`2` 宿主包或参数无法解析。换 DSH 版本时在独立 `DSH_HOME` 和临时仓库验证，服务栈成功仍不能替代真实模型会话。

## 已知限制

- **版本限制：** DSH 0.1.x、低于下限的 `0.2.0-rc.1` 不支持；声明范围内其他版本先验证再使用。插件 `0.1.0` 不适用于 DSH `0.2.0-rc.2`。
- **运行边界：** 这是 DSH 宿主插件；普通 Node 脱离宿主加载需要自行提供 SDK peer，不作为独立 CLI 分发。
- **仓库发现：** 只检查会话目录与直接子目录；多个子仓库时列出候选，建议将会话切换到目标仓库。
- **耗时检查：** preCommit 也受默认 30 秒截止时间约束；较慢的测试请显式调大 `timeoutMs`。
- **平台边界：** Linux 本地测试和 CI 不等于完整 DSH 宿主验证；上游开发 peer 链的 Node 20 engine 告警见验证报告。
- **界面范围：** 当前提供命令与工具，Web Git 面板留待后续任务实现。

## 文档与贡献

| 入口 | 内容 |
|---|---|
| [贡献指南](CONTRIBUTING.md) | 开发环境、分支与提交约定、检查与审查 |
| [CHANGELOG](CHANGELOG.md) | 版本变更 |
| [维护计划](docs/maintenance-plan.md) | 上游接口、验证与发布流程 |
| [市场收录准备](docs/marketplace-submission.md) | dsh-market 目录条件、自动安装变化与收录材料 |
| [后续 DSH 任务包](docs/dsh-tasks/README.md) | 只读 Web Host、TSX UI 与真实 Web 验收 |
| [Issues](https://github.com/MashedPotato817/dsh-git-plugin/issues) | 缺陷、功能与兼容性反馈 |

`dsh-market` 的目录来自 [awesome-dsh-plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin)；当前尚未收录本插件。README 排版与信息组织参考 [dsh-agent-teams](https://github.com/NanmiCoder/dsh-agent-teams)，横幅为本仓库原创 SVG。

## License

[MIT](LICENSE)
