# dsh-git-plugin

[![npm version](https://img.shields.io/npm/v/dsh-git-plugin)](https://www.npmjs.com/package/dsh-git-plugin)
[![npm downloads](https://img.shields.io/npm/dm/dsh-git-plugin)](https://www.npmjs.com/package/dsh-git-plugin)
[![License](https://img.shields.io/npm/l/dsh-git-plugin)](https://github.com/MashedPotato817/dsh-git-plugin)

给 DeepSeek Harness（DSH）的 Git 工作流插件：补齐 DSH 相比 Claude Code / Codex 缺失的「程序员手感」——diff 感知、自动分支、规范提交、可恢复撤销。全部通过 `ctx.subprocess` seam 以纯 argv 调用 `git`，不经过 shell 层，每次运行都受字节与超时上限约束。

## 能力

### 命令（面向人 / 斜杠命令）

| 命令 | 作用 |
|---|---|
| `/status` | 显示当前分支与工作区状态（porcelain v1） |
| `/diff` | 摘要显示已暂存 / 未暂存的改动 |
| `/branch [<name>]` | 不带参数列出分支；带参数则 `git switch -c <name>` 新建并切换 |
| `/commit [<message>]` | 带参数则 `git add -A` + 提交；不带参数显示提交规范与当前改动 |
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

## 安装

已发布到 npm（`dsh-git-plugin@0.1.0`），一条命令安装：

```bash
dsh plugin --profile <name> add dsh-git-plugin
```

本地 / 源码开发时也可用路径安装：

```bash
dsh plugin --profile <name> add /path/to/dsh-git-plugin
```

安装后，在 profile 的 `cordis.patch.yml` 里用 `insert` 声明启用：

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
```

## 配置

| 键 | 默认值 | 含义 |
|---|---|---|
| `maxBytes` | `1048576` | 单次 git 调用 stdout 的上限字节数 |
| `stderrMaxBytes` | `65536` | 单次 git 调用 stderr 的上限字节数 |
| `graceMs` | `3000` | 子进程终止前的宽限毫秒数 |
| `timeoutMs` | `30000` | 工具调用的协作超时毫秒数 |
| `preCommit` | `[]` | 提交前要运行的 argv 命令（如 `["npm","test"]`）；非零退出则中止 `/commit` |

## 提交规范

`/commit` 默认提示 MAA 风格的提交信息，与本仓库约定一致：

```
<类型>(<可选作用域>): <中文主体>
feat / fix / docs / chore / style / refactor / test / perf
```

若仓库根目录存在 `AGENTS.md` / `CLAUDE.md`，模型会读取并遵循其中的自定义规范。

## 开发

- 分支工作流：所有开发在功能分支进行，稳定后才合并到 `main`。
- 分支命名：`feat/xxx`、`fix/xxx`、`docs/xxx`、`chore/xxx`。
- 提交消息：`<类型>(<可选作用域>): <中文主体>`。

本地校验与测试：

```bash
npm install
npm run check   # 语法校验
npm test        # 单元 + 真实 git 集成测试
```

集成测试会在临时目录里真正 `git init` / `commit` / `stash`，验证 `/commit`、`/undo`、`/branch` 与只读工具端到端可用。

## Hook 与 CI

- **插件 pre-commit 钩子**：通过 `config.preCommit` 配置一个 argv 命令，`/commit` 会在 `git add` 前运行它，失败即中止提交。
- **仓库 `commit-msg` 钩子**：`.githooks/commit-msg` 强制 MAA 提交格式。启用：

  ```bash
  git config core.hooksPath .githooks
  ```

- **CI**：`.github/workflows/ci.yml` 在 push / PR 时跑 `npm ci`、`node --check` 和 `node --test`。

## License

MIT
