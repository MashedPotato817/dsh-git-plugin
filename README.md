# dsh-git-plugin

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

## 安装

> 尚未发布到 npm registry，当前按本地包安装。发布后可直接 `dsh plugin --profile <name> add dsh-git-plugin`。

```bash
# 1) 本地安装到某个 profile
dsh plugin --profile <name> add /path/to/dsh-git-plugin

# 2) 在 profile 配置里声明插件
```

```yaml
- name: dsh-git-plugin
  config:
    maxBytes: 1048576
    timeoutMs: 30000
```

## 配置

| 键 | 默认值 | 含义 |
|---|---|---|
| `maxBytes` | `1048576` | 单次 git 调用 stdout 的上限字节数 |
| `stderrMaxBytes` | `65536` | 单次 git 调用 stderr 的上限字节数 |
| `graceMs` | `3000` | 子进程终止前的宽限毫秒数 |
| `timeoutMs` | `30000` | 工具调用的协作超时毫秒数 |

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

本地语法校验：

```bash
node --check lib/index.js
```

## License

MIT
