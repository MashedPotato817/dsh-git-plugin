# 给 DeepSeek Harness 写第一个插件：一个 Git 工作流插件从 0 到 1

> 记录为 DeepSeek Harness（DSH）开发并发布 `dsh-git-plugin` 的完整过程：从对比 Claude Code / Codex 找差距，到摸清插件系统，到实现、测试与发布。

## 1. 为什么做这个插件

DSH 的核心是「一切皆插件」（Cordis 架构），它的底座其实相当完整：文件系统、终端、网页搜索、Skill、MCP client、子代理、Workflow、Goal、Plan Mode、沙箱与审批……但仔细对照成熟的编程 Harness（Claude Code、Codex）会发现，程序员最日常的「手感」还有明显缺口：

| 能力 | Claude Code | Codex | DSH 现状 |
|---|---|---|---|
| Git 原生工作流（diff 感知 / 自动提交 / 分支 / 撤销） | ✅ | ✅ | ❌ 完全没有 vcs 相关包 |
| Hooks（改完自动 format/lint/test） | ✅ | ⚠️ | ❌ 只有内部事件 |

于是决定做**一个以 Git 为基座的工作流插件**：用一个程序员最熟悉的原语，一次补齐「变更感知、自动分支、规范提交、可恢复撤销」这一串痛点。

## 2. DSH 插件系统速览

一个 DSH 插件就是一个 npm 包，导出：

```js
export const name = "dsh-git-plugin";        // 插件 id
export const inject = ["commands", "tools", "systemPrompt", "subprocess"]; // 需要的服务
export const Config = z.object({ ... });     // schemastery 配置 schema
export async function apply(ctx, config) { ... } // 注册命令 / 工具
```

- **命令**：`ctx.commands.register({ name, description, input: { hint }, handler })`，handler 收到 `{ rawInput, agent, signal }`，返回 `{ kind: "success"|"error", text }`。
- **工具**：`ctx.tools.register(defineTool({ name, description, parameters, output, execute, timeoutMs }))`。
- **进程执行**：一律走 `ctx.subprocess.spawn({ argv, cwd, stdio, graceMs, signal })`——**纯 argv、无 shell 层**，天然避免注入风险。

## 3. 实现：5 个斜杠命令 + 4 个只读工具

```
命令：/status  /diff  /branch [<name>]  /commit [<message>]  /undo [list|pop]
工具：git-status  git-diff  git-log  git-show（全部只读）
```

几个关键设计：

- **安全优先**：`/undo` 用 `git stash push -u` 做**可恢复快照**，而不是危险的 `reset --hard`；`/branch` 用 `git check-ref-format` 校验分支名。
- **符合程序员习惯**：`/commit` 无参数时展示 MAA 风格提交规范（`<type>(<scope>): <中文主体>`）；`config.preCommit` 支持提交前自动跑 lint/test，失败即中止。
- **仓库发现**：当会话工作目录不是 git 仓库时（比如一个装着多个项目的 workspace 根目录），自动扫描直接子目录里的 `.git`——只有一个就自动使用，多个则列出。
- **并发安全**：只读工具标记 `isConcurrencySafe: true`，可与兄弟调用并行。

## 4. 踩过的坑（最值得分享的部分）

### 坑 1：`cordis.patch.yml` 里「插入」插件要用 `insert`

给 profile 装完包后，要在 `~/.dsh/profiles/<name>/cordis.patch.yml` 里声明。**直接写 `- id: xxx, name: xxx` 会被当成「按 id 覆盖」，报 `entry not found` 且不生效**。正确写法：

```yaml
- insert:
    - id: dsh-git-plugin
      name: dsh-git-plugin
```

### 坑 2：npm 发布被 2FA 卡住

账号开了 2FA 后，`npm publish` 直接 403（`Two-factor authentication ... is required`）。`npm login` 生成的 token 不带 2FA 绕过，`NODE_AUTH_TOKEN` 环境变量也会被 `.npmrc` 里的旧 token 盖掉。解决：

1. 在 npmjs 生成 **Granular Access Token**：勾选 **Bypass 2FA** + **All packages**（`dsh-git-plugin` 是无 scope 新包，只能靠 All packages 覆盖）；
2. 把 token **显式写进 `.npmrc`**：`npm config set //registry.npmjs.org/:_authToken <token>`；
3. 再 `npm publish`。

### 坑 3：测试沙箱限制「命名管道」

在受限沙箱里，`git stash`、git 的 HTTPS transport、git 钩子的 `env` 启动都会因「无法创建标准输入管道」失败——这是**测试环境限制，不是插件 bug**。集成测试用「文件描述符重定向」（`stdio: ['ignore', fd, fd]`）绕开管道捕获，stash 用例在无沙箱的 CI 里完整执行。

## 5. 测试与 CI

- `test/smoke.test.js`：mock ctx 验证 apply 注册了 5 命令 + 4 工具。
- `test/integration.test.js`：**真实 git 仓库**端到端——真提交、真建分支、真 stash/pop、preCommit 钩子、非 git 目录报错。
- `.githooks/commit-msg`：强制 MAA 提交格式；`.github/workflows/ci.yml`：Node 20/22 上跑 `npm ci` + `node --check` + `node --test`。

## 6. 使用

```bash
dsh plugin --profile web add dsh-git-plugin
```

在 `cordis.patch.yml` 里：

```yaml
- insert:
    - id: dsh-git-plugin
      name: dsh-git-plugin
```

进入任意 git 仓库目录后：

```
/status        → 分支 + 工作区状态
/commit feat: 新增 xxx   → 全量暂存并提交
/undo          → 把改动 stash 成可恢复快照（/undo pop 恢复）
```

## 7. 结语

DSH 的插件体系成熟、文档化的 seam 清晰，做「补齐核心手感」的垂直插件比想象中顺畅。Git 只是第一个，Hooks（改完自动 format/lint/test）是下一个自然的方向。仓库：https://github.com/MashedPotato817/dsh-git-plugin
