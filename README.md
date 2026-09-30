# dsh-git-plugin

[![npm version](https://img.shields.io/npm/v/dsh-git-plugin)](https://www.npmjs.com/package/dsh-git-plugin)
[![npm downloads](https://img.shields.io/npm/dm/dsh-git-plugin)](https://www.npmjs.com/package/dsh-git-plugin)
[![License](https://img.shields.io/npm/l/dsh-git-plugin)](https://github.com/MashedPotato817/dsh-git-plugin)

给 DeepSeek Harness（DSH）的 Git 工作流插件：补齐 DSH 相比 Claude Code / Codex 缺失的「程序员手感」——diff 感知、自动分支、规范提交、可恢复撤销。全部通过 `ctx.subprocess` seam 以纯 argv 调用 `git`，不经过 shell 层，每次运行（含 preCommit 钩子）都受输出字节上限与插件自身的超时截止时间约束。

## 支持版本

**区分「允许范围」与「已实测版本」**：`peerDependencies` / `engines.dsh` 声明的是允许加载的范围；
只有真正跑过验证的版本才算「已验证兼容」。

| 项目 | 允许范围（声明） | 实际验证版本 |
|---|---|---|
| DSH | `>=0.2.0-rc.2 <0.3.0-0` | **仅 `0.2.0-rc.2`**（官方 npm 包、本机桌面运行时、独立测试 profile 三处） |
| Node.js | `>=20` | 24.19.0；CI 矩阵覆盖 20 / 22（尚未实际跑过） |
| Git | 需支持 `--end-of-options`（Git 2.24+） | 2.53.0.windows.2 |

- 范围内的 `0.2.x` 其他版本（`0.2.0`、`0.2.1-rc.1` …）**未验证**：能被加载不代表行为正确。
  换版本使用时请按下面的「真实 DSH 服务栈验证」重跑一次再判断。
- DSH 0.1.x 与低于下限的 `0.2.0-rc.1` 不在允许范围内，也不宣称兼容（旧的 `^0.1.0-rc.6` 会被 0.2.0-rc.2 的 peer 准入检查拒绝加载）。
- Git < 2.24 未验证。

0.2.0-rc.2 的证据：官方 Release [`dsh-v0.2.0-rc.2`](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.2.0-rc.2)（2026-09-29，提交 `639ed015`），npm `@deepseek-ai/dsh` 的 `next`/`latest` 均为 `0.2.0-rc.2`，本机 `@deepseek-ai/dsh-desktop-runtime@0.2.0-rc.2`。
注意 4 个子包（`dsh-commands`、`dsh-tools`、`dsh-subprocess`、`dsh-system-prompt`）的 **`latest` 标签仍停在 `0.0.1-rc.1`**，安装与开发请使用 `next` 或精确版本 `0.2.0-rc.2`，不要用 `@latest`。

> **当前 npm 上的 `0.1.0` 面向 DSH 0.1.x**，在 0.2.0-rc.2 上会被判为不兼容而无法加载。
> 面向 0.2.0-rc.2 的版本已整理为本地 `0.2.0` 发布候选（`package.json` 已提升，见 [CHANGELOG.md](CHANGELOG.md) 的 `[0.2.0]`），
> 但**尚未推送、未打 tag、未发布**。

## 能力

### 命令（面向人 / 斜杠命令）

| 命令 | 作用 |
|---|---|
| `/status` | 显示当前分支与工作区状态（porcelain v1） |
| `/diff` | 摘要显示已暂存 / 未暂存的改动 |
| `/branch [<name>]` | 不带参数列出分支；带参数则 `git switch -c <name>` 新建并切换 |
| `/commit [<message>]` | 带参数则运行 preCommit 钩子 + `git add -A` + 提交；不带参数显示提交规范与当前改动 |
| `/undo [list\|pop]` | 默认 `git stash push -u` 做可恢复快照；`list` 查看、`pop` 恢复 |

### 工具（面向模型 / 只读）

| 工具 | 作用 |
|---|---|
| `git-status` | 分支 + 工作区状态 |
| `git-diff` | 未暂存（默认）或已暂存（`staged=true`）的 diff |
| `git-log` | 最近提交历史（`count` 控制条数，`path` 过滤文件） |
| `git-show` | 查看某个提交（默认 HEAD）的 message / author / diff |

插件还会注入一段 system-prompt 指引，让模型主动用 git 工具查看状态、并遵循仓库的提交与分支规范。

### 仓库发现

当会话工作目录不是 git 仓库时，插件会：若其**直接子目录**里只有一个 git 仓库，自动使用它；有多个则列出让用户选择；一个都没有才报 `not a git repository`。这让它能在「项目集合」式的工作区根目录下正常工作。

`/commit` 会先解析一次目标仓库目录，**preCommit 钩子与 `git add` / `git commit` 使用同一个目录**，因此在自动发现子仓库的场景下钩子也运行在正确的仓库里。

## 安装

> 针对 DSH 0.2.0-rc.2 的修复已提交到本地分支（`fix/git-show-option-injection` 的 `8181856`、`2f80cb3`），
> 版本随之在本地提升为 `0.2.0`（发布准备分支 `feat/release-0.2.0`），但**尚未推送、未打 tag、未发布**：
> 远端 `main` 与 npm 上的 `0.1.0` 仍是旧代码。
> 在兼容版本推送之前，请使用下面的「本地 / 源码安装」。

### 本地 / 源码安装（推送前推荐）

```bash
dsh plugin --profile <name> add /path/to/dsh-git-plugin
```

本地路径安装直接使用工作区里的 `lib/`，包含本轮全部修复。

### 从 GitHub 安装（推送兼容版本后适用）

编译产物 `lib/` 随源码提交，因此从 Git 安装不需要在安装期构建。
**该渠道只有在兼容版本推送后才可用**；推送后建议固定到发布 tag，避免拿到中间状态：

```bash
dsh plugin --profile <name> add github:MashedPotato817/dsh-git-plugin#v0.2.0
```

### 从 npm 安装（发布并推广 `latest` 后适用）

```bash
dsh plugin --profile <name> add dsh-git-plugin
```

在 `0.2.0` 发布并用 dist-tag 推广到 `latest` 之前，npm 上的 `0.1.0` 与 DSH 0.2.0-rc.2 不兼容（会被 peer 准入拒绝）。

### 启用

安装只是把包装进 profile 的依赖；还需要在 profile 的 `cordis.patch.yml` 中用 `insert` 声明启用：

```yaml
- insert:
    - id: dsh-git-plugin
      name: dsh-git-plugin
```

需要配置时加上 `config`：

```yaml
- insert:
    - id: dsh-git-plugin
      name: dsh-git-plugin
      config:
        preCommit: [npm, test]
        timeoutMs: 300000
```

改完在 Web 里重载（或重启 profile）后：模型侧出现 4 个只读工具，人侧出现 5 个 `/` 命令。

## 配置

| 键 | 默认值 | 含义 |
|---|---|---|
| `maxBytes` | `1048576` | 单次 git 调用 stdout 的上限字节数 |
| `stderrMaxBytes` | `65536` | 单次 git 调用 stderr 的上限字节数 |
| `graceMs` | `3000` | 子进程终止前等待其静默的宽限毫秒数（超时后调用 `terminate()` 并最多等这么久） |
| `timeoutMs` | `30000` | **每一次运行的截止时间**：斜杠命令、4 个只读工具、preCommit 钩子都受此约束；超时后终止进程并返回 `<命令> timed out after <N>ms (process terminated)` |
| `preCommit` | `[]` | 提交前要运行的 argv 命令（如 `["npm","test"]`）；非零退出、超时或启动失败都会中止 `/commit` |

`timeoutMs` 现在对 preCommit 同样生效。若钩子是 `npm test` 这类慢任务，请显式调大（例如 `300000`），
否则默认 30 秒会被判定超时并终止钩子。

## 提交规范

`/commit` 默认提示 MAA 风格的提交信息，与本仓库约定一致：

```
<类型>(<可选作用域>): <中文主体>
feat / fix / docs / chore / style / refactor / test / perf
```

若仓库根目录存在 `AGENTS.md` / `CLAUDE.md`，模型会读取并遵循其中的自定义规范。

## 开发

源码是严格模式的 TypeScript（`src/`），编译产物为 `lib/`（`lib/index.js` + `lib/index.d.ts`），
`lib/` 随仓库提交，保证 npm 与 GitHub 两种安装渠道都不需要安装期构建。

```bash
npm install
npm run build   # tsc -p tsconfig.json  → lib/
npm run check   # tsc -p tsconfig.json --noEmit（类型检查）
npm test        # node --test（单元 + 真实 git 集成测试）
```

目录：

| 路径 | 内容 |
|---|---|
| `src/index.ts` | 唯一的源码（严格模式 TypeScript） |
| `lib/` | 编译产物（`index.js` + `index.d.ts`），随仓库提交 |
| `test/` | `smoke.test.js`（模拟 seam）、`integration.test.js`（真实 Git） |
| `scripts/verify-real-dsh.mjs` | 按需运行的真实 DSH 服务栈验证，不进入 `npm test` / CI |
| `docs/maintenance-plan.md` | 版本证据、兼容核对、验证结果与发布步骤 |

- 分支工作流：所有开发在功能分支进行，稳定后才合并到 `main`。
- 分支命名：`feat/xxx`、`fix/xxx`、`docs/xxx`、`chore/xxx`。
- 提交消息：`<类型>(<可选作用域>): <中文主体>`。
- 测试针对**编译产物** `lib/index.js` 运行，因此改完 `src/` 必须先 `npm run build`。
- 发布纪律：同一版本只 `npm publish` 一次，`latest` 用 `npm dist-tag add` 推广；
  版本文件、CHANGELOG 与 `lib/` 必须在同一个提交里，tag / GitHub Release / npm 包的 `gitHead` 指向该提交。
  完整流程见 [docs/maintenance-plan.md](docs/maintenance-plan.md) 第 9 节。

> 在受限沙箱中 `npm test`（`node --test`）可能因禁止管道捕获子进程输出而报 `spawn EPERM`；
> 此时可直接运行测试文件：`node test/smoke.test.js`、`node test/integration.test.js`。

## 验证

| 层次 | 命令 / 方式 | 本轮结果（本地发布候选 `0.2.0`，未推送 / 未发布） |
|---|---|---|
| 类型与语法 | `npm run build`、`npm run check` | 0 错误；两次构建产物哈希一致 |
| 单元（模拟 subprocess seam） | `node test/smoke.test.js` | 10 通过 |
| 集成（临时目录真实 `git init`/`commit`/`stash`） | `node test/integration.test.js` | 16 通过 |
| 全部测试（与 CI 同一条命令） | `npm test` | 26 通过 / 0 失败 |
| 打包内容 | `npm pack --dry-run` | 仅 `lib/`、README、LICENSE、package.json |

以上结果均来自本地工作区（分支 `feat/release-0.2.0`）：**本地已完成**，但尚未推送、未打 tag、未发布到 npm
（npm 上仍是 `0.1.0`）。

### 真实 DSH 服务栈验证（按需运行，不纳入 `npm test` / CI）

`scripts/verify-real-dsh.mjs` 会用官方 DSH 包组装真实 Cordis 上下文（`cordis` + `dsh-commands` +
`dsh-tools` + `dsh-system-prompt` + `dsh-subprocess-local`），挂载本插件的 `lib/index.js`，
在临时 Git 仓库里跑完：5 个斜杠命令、4 个只读工具、`tool:git` 提示词段落、工具 schema 进入组装、
选项注入防护、**禁用后注册清理**、**重新启用无重复注册**、超时终止真实 preCommit 进程。

```bash
npm install --prefix .tmp-dsh-verify --no-save @deepseek-ai/dsh@0.2.0-rc.2
node scripts/verify-real-dsh.mjs --dsh-root .tmp-dsh-verify
```

退出码 0 = 全部通过，1 = 有检查失败（逐行 PASS/FAIL），2 = 无法从该 root 解析 DSH 包。
换 DSH 版本做兼容核对的步骤见 [docs/maintenance-plan.md](docs/maintenance-plan.md) 第 5.2 / 9 节。

回归测试专门覆盖：`git-show` 的选项形式 ref（不得写文件）、仍接受 `HEAD` / `HEAD~1` / 分支名、
斜杠命令 / 只读工具 / preCommit 三处超时终止、调用方取消不被误报为超时、
以及自动发现子仓库后 preCommit 与 Git 操作共用同一工作目录。

**未验证项**（不作兼容宣称）：运行中 DSH 会话里由模型调用命令/工具、Linux 行为、
DSH 0.1.x、`0.2.x` 中除 `0.2.0-rc.2` 外的版本、Git < 2.24、GitHub 安装渠道。
详细证据见 [docs/maintenance-plan.md](docs/maintenance-plan.md) 第 5 节。

## Hook 与 CI

- **插件 pre-commit 钩子**：通过 `config.preCommit` 配置一个 argv 命令，`/commit` 会在 `git add` 前运行它，失败或超时即中止提交。
- **仓库 `commit-msg` 钩子**：`.githooks/commit-msg` 强制 MAA 提交格式。启用：

  ```bash
  git config core.hooksPath .githooks
  ```

- **CI**：`.github/workflows/ci.yml` 在 push / PR 时跑 `npm ci`、构建、`lib/` 新鲜度检查（`git diff --exit-code lib`）、类型检查、`node --check lib/index.js` 和 `node --test`（Node 20 / 22）。

## License

MIT
