<!-- Historical maintenance analysis below; current development supersedes its dated snapshots. -->

> 2026-10-02 当前：0.3.0 已双渠道发布，完整 Git 操作进入 0.4.0 候选。发布顺序仍为最终提交 → PR 保留历史合并 → 干净产物/CI → 单次 next publish → 双渠道实装 → latest → Issue 完成。当前基线与证据见 AGENTS.md / docs/release-report-0.4.0.md；下文旧版本表、社区数量及“尚未实现”属于日期所示历史。

# dsh-git-plugin 维护计划

> 历史维护方案：下文的 0.2.0 版本、5 文件清单与“GUI 未实现”是当时快照。当前 0.3.0 只读 Web 发布进展见 [发布记录](release-report-0.3.0.md)。新发布复用“候选 → 干净门 → 定稿 → PR merge → 单次 publish next → 实装验证 → dist-tag latest → tag/Release”的顺序，版本号与实际文件表以本次记录为准。

本轮工作按「审查 → 适配 → 验证 → 交付」推进，本文记录证据、结论、剩余问题与后续安排。
2026-10-01 发布执行更新：PR #2 已保留历史合并，统一发布点为 `c83f332`；npm 0.2.0 与 GitHub v0.2.0 Release 已发布，tag/npm gitHead/包内 lib 一致。PR/main 的 Node 20/22 CI 及双渠道实装验证通过；latest=next=0.2.0，详见 [发布记录](release-report-0.2.0.md)。第 2 节保留版本调查时的历史证据。

## 1. 当前状态

| 项目 | 状态 |
|---|---|
| 仓库 | `MashedPotato817/dsh-git-plugin`，默认分支 main；0.2.0 发布点 c83f332（PR #2 merge commit） |
| 工作分支 | `feat/release-0.2.0` 已推送并合并；后续报告提交用独立分支，不改 tag |
| npm | 0.2.0 已于 2026-10-01T05:28:14.177Z 发布，gitHead=c83f332；latest=next=0.2.0 |
| GitHub Release | [v0.2.0](https://github.com/MashedPotato817/dsh-git-plugin/releases/tag/v0.2.0) 已公开，annotated tag 指向 c83f332，原 v0.1.0 不变 |
| 本地包版本 | 0.2.0，版本与 CHANGELOG 日期已提交到发布点 |
| 目标 DSH | 0.2.0-rc.2（本机运行中的桌面运行时版本，见第 2 节） |
| **实际验证版本** | **仅 `0.2.0-rc.2`**：官方 npm 包、本机桌面运行时、独立测试 profile 三处均只验证了这一个版本。允许范围内的其他版本（如 0.2.0 / 0.2.1-rc.1）**未验证**；0.2.0-rc.1 低于下限，不在允许范围内。 |
| **依赖允许范围** | peer / `engines.dsh` 声明为 `>=0.2.0-rc.2 <0.3.0-0`（Node `>=20`）。这是「允许安装与加载的范围」，不是「已验证兼容的范围」；范围内未实测的版本需按第 5.2 节重跑验证后再宣称。 |
| Git 要求 | 需支持 `--end-of-options`（Git 2.24+）；实测 Git 2.53.0.windows.2，更老版本未验证 |
| 源码形态 | `src/index.ts`（严格模式 TypeScript）→ `npm run build` → `lib/index.js` + `lib/index.d.ts`；`lib/` 随仓库提交，npm 与 GitHub 两种安装渠道都不需要安装期构建 |
| 已提交适配 | **本轮已提交到 `fix/git-show-option-injection`（`8181856`、`2f80cb3`），本次发布准备在其之上继续**：`8181856` 包含 TypeScript 源码、配置、编译产物、测试与维护文档；`2f80cb3` 更新 `AGENTS.md` 的维护指引与发布安排。`AGENTS.md` 作为项目指引纳入版本控制，不进入 npm 发布包（`files = ["lib","README.md","LICENSE"]`）。`.agent-teams/` 与临时测试目录已忽略 |
| **状态三态** | **已完成**：适配、修复、Linux 本地矩阵、PR/main CI、npm/GitHub 发布、双渠道实装；**待验证**：真实模型会话、Linux 完整 DSH、其他 DSH 版本、Web GUI；**后续**：按包 03–05 实现与验收只读 Web 面板 |

## 2. 版本核实（证据，2026-09-29 采集）

| 证据 | 值 | 来源 |
|---|---|---|
| DSH 官方 Release | `dsh-v0.2.0-rc.2`，prerelease，2026-09-29T09:42:36Z，提交 `639ed015397290b3745d163aafe02ffee4aa3f84` | <https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.2.0-rc.2> |
| 上一个 Release | `dsh-v0.2.0-rc.1`，2026-09-28T12:36:21Z | <https://github.com/deepseek-ai/deepseek-harness/releases> |
| npm `@deepseek-ai/dsh` | `latest = next = 0.2.0-rc.2`，`alpha = 0.1.7-alpha.2`；仓库字段指向 `deepseek-ai/deepseek-harness` 的 `apps/cli` | npm registry |
| npm `@deepseek-ai/dsh-commands` 等 4 个子包 | **`latest = 0.0.1-rc.1`（滞后）**，`next = 0.2.0-rc.2`，`alpha = 0.1.7-alpha.2` | npm registry |
| `@deepseek-ai/cordis` | `latest = 4.0.4`（`next = 4.0.1-rc.4`） | npm registry |
| `@deepseek-ai/schemastery` | `latest = 3.18.4`（`next = 3.18.1-rc.4`） | npm registry |
| 本机 DSH 运行时 | `@deepseek-ai/dsh-desktop-runtime@0.2.0-rc.2`，全部 `@deepseek-ai/dsh-*` 均为 `0.2.0-rc.2`，`cordis 4.0.4`，`schemastery 3.18.4` | `C:\Software\DeepSeek Harness\resources\app.asar` 内 `dsh/package.json` |
| 本地 DSH 源码 | `master`，`639ed015…`，`git describe` = `dsh-v0.2.0-rc.2` | `C:\Users\Mashed Potato\Desktop\github\deepseek-harness`（只读参考） |

结论：

1. 运行中的 DSH 就是官方最新 Release `0.2.0-rc.2`，本地源码与 Release 提交一致，可以作为适配基准。
2. **子包的 `latest` 标签滞后于 `@deepseek-ai/dsh`**：直接用 `@latest` 会装到 0.0.1-rc.1。
   安装/开发必须以 `next` 或精确版本 `0.2.0-rc.2` 为准。
3. 上一轮审查线索（DSH 已到 0.2.0-rc.2、插件仍为 0.1.0、依赖 0.1.0-rc.6）**本轮核实成立**。
4. 2026-10-01 发布准备期间再次只读核对在线状态，结论与上表一致、无新增版本：官方 GitHub Releases 最新仍是
   `dsh-v0.2.0-rc.2`（2026-09-29，提交 `639ed015`）；npm `@deepseek-ai/dsh` 的 `latest = next = 0.2.0-rc.2`，
   4 个子包（`dsh-commands` / `dsh-tools` / `dsh-subprocess` / `dsh-system-prompt`）的 `latest` 仍滞后为 `0.0.1-rc.1`、
   `next = 0.2.0-rc.2`，`@deepseek-ai/cordis` `latest = 4.0.4`，`@deepseek-ai/schemastery` `latest = 3.18.4`；
   `dsh-git-plugin` 只有 `latest = 0.1.0`（从无 `next` 标签）；本地 DSH 源码仍是 `master@639ed015` = tag `dsh-v0.2.0-rc.2`。
   **因此发布基准不变：只有 `0.2.0-rc.2` 是实际验证过的版本**，peer / `engines.dsh` 的 `>=0.2.0-rc.2 <0.3.0-0` 仍只是允许范围。

## 3. 兼容性核对（对照 0.2.0-rc.2 官方源码与声明）

| 插件用法 | 0.2.0-rc.2 的实际情况 | 结论 |
|---|---|---|
| `export const name / inject / Config / apply` | 官方插件同样导出 `name`、`inject`、`Config`、`apply`（如 `dsh-command-feedback`） | 兼容 |
| `ctx.commands.register({ name, description, input: { hint }, handler })` | 定义字段一致；`register()` 返回 effect 清理函数，重复同名注册在**同一 scope 内抛错** | 兼容；重新启用依赖 Cordis 的 fiber 清理 |
| 命令 handler 返回 `{ kind: "success" \| "error", text }` | `CommandResult` 一致；`invocation = { commandId, agent, rawInput, attachments, signal }` | 兼容 |
| `defineTool({ name, description, parameters, output: { schema, render }, execute, isConcurrencySafe })` | 字段一致 | 兼容 |
| 工具定义上的 `timeoutMs` | **仅声明，注册表不执行**；执行由 `@deepseek-ai/dsh-tool-call-timeout-policy` 通过 abort `exec.signal` 完成 | 需要插件自己兜底（本轮修复） |
| `ctx.systemPrompt.section({ name, order, text })` | 字段一致；外部贡献可用任意 order | 兼容 |
| `ctx.subprocess.spawn({ argv, cwd, stdio, graceMs, signal })` | **请求里没有 timeout 字段**，官方文档明确「callers own deadlines」 | 需要插件自己实现截止时间（本轮修复） |
| `handle.done` / `collected.stdout.readFrom(0)` / `lossy` | 一致 | 兼容 |
| `handle.terminate()` / `handle.waitForExit()` | 官方契约提供，`terminate()` 幂等 | 本轮用于超时后的终止 |
| 会话工作目录 `exec.agent?.session.header.cwd` | 官方 `dsh-tool-pwsh` 仍按此读取；session header 校验必须为绝对路径 | 兼容 |
| 取消：`exec.signal` / `invocation.signal` | 「取消是协作式的」，工具必须观察信号；命令侧调用方停止等待不代表 handler 停止 | 兼容，本轮补齐信号转发 |
| 加载 / 卸载 | Cordis fiber 卸载时按注册逆序执行 disposer；`ctx.commands.register` / `tools.register` / `systemPrompt.section` 均为 effect 作用域 | 兼容（已在真实 DSH 服务栈验证，见第 5 节） |

**包级准入检查（关键）**：DSH 在导入插件前，会用 `getDshRuntimeVersion()` 得到单一运行时版本，
逐个匹配插件声明的 `@deepseek-ai/dsh` 与 `@deepseek-ai/dsh-*` peer 范围；预发布版本参与匹配，
而 `engines.dsh` 不参与该检查。旧的 `^0.1.0-rc.6` 不匹配 `0.2.0-rc.2`，插件会被拒绝加载
（在 profile 中表现为 `disabled: true` 的分离行）。因此本轮把 4 个 peer 改为
`>=0.2.0-rc.2 <0.3.0-0`：这是**允许加载的范围**，实际验证过的只有 `0.2.0-rc.2`；
范围内的其他版本把插件加载起来不等于行为正确，需按第 5.2 节重跑验证。

用运行时同款 `node-semver@7.8.5` 实测该范围：

| 候选版本 | `^0.1.0-rc.6`（旧） | `>=0.2.0-rc.2 <0.3.0-0`（新） |
|---|---|---|
| `0.2.0-rc.2`（当前运行时） | ✗ | ✓ |
| `0.2.0-rc.3` / `0.2.0` | ✗ | ✓ |
| `0.2.1-rc.1` | ✗ | 默认 ✗；`includePrerelease` 语义下 ✓ |
| `0.3.0-rc.1` / `0.3.0` | ✗ | ✗（刻意排除，0.3 需重新验证） |
| `0.1.7-rc.2`（旧 0.1.x） | ✓ | ✗（不再宣称兼容） |

## 4. 本轮修复的三个问题（先复现，后修改）

### 4.1 `git-show` 的 ref 选项注入

- 复现（真实 Git）：`git show --output=evil2.txt` 会在仓库里创建文件并写入内容——
  `ref` 由模型提供，等于一个任意文件写原语。
- 修复：`git show --end-of-options <ref>`，`--end-of-options` 之后的参数一律按 revision 解析。
- 复现修复后：`git show --end-of-options --output=evil.txt` 退出码 128、文件不存在；
  `HEAD`、`HEAD~1`、`main` 等合法引用行为不变。
- 测试：`test/smoke.test.js`（argv 断言 + 合法引用）、`test/integration.test.js`（真实 Git，断言文件未生成）。

### 4.2 `timeoutMs` 未覆盖斜杠命令与 preCommit

- 复现：0.2.0-rc.2 的 spawn 请求没有超时字段，`defineTool` 的 `timeoutMs` 只声明不执行，
  斜杠命令更是完全没有超时策略——`/status`、`/commit`（含 preCommit 钩子）可以无限等待。
- 修复：`runProcess` 自己持有截止时间：派生 `AbortController`、超时后 abort（即触发 provider 的终止流程）、
  再调用 `handle.terminate()` 并在 `graceMs` 内等待 `waitForExit()`，最后返回
  `<argv> timed out after <N>ms (process terminated)`。取消与超时都带上 `aborted` / `timedOut` 标记。
- 附带修复：仓库探测（`git rev-parse --show-toplevel`）被取消或超时时，不再退化成
  `not a git repository`；信号在 spawn 前已中止时直接返回 `aborted`（此前会让不合作的 provider 永久挂起）。
- 测试：mock 层测斜杠命令 / 工具 / preCommit 三处超时与调用方取消；
  集成层用真实 `node -e "setTimeout(()=>{},30000)"` 钩子验证 500ms 超时确实终止进程且不产生提交。

### 4.3 自动发现子仓库后 preCommit 与 Git 操作目录不一致

- 复现：会话目录不是仓库、其下只有一个子仓库时，`resolveGitRoot` 会把 Git 操作指向子仓库，
  但 preCommit 仍以会话目录为 cwd 运行（`preCommit` 用原始 `cwd`）。
- 修复：`/commit` 先解析一次仓库根目录，钩子与 `git add` / `git commit` 统一使用该目录
  （新增 `runGitAt()` 复用已解析的根目录）。
- 测试：mock 层断言钩子 cwd 等于被发现的子仓库；集成层用「钩子只在仓库根目录存在 `.git` 时成功」
  的真实进程验证。

## 5. 验证结果

### 5.1 已完成

| 层次 | 内容 | 结果 |
|---|---|---|
| 类型 / 语法 | `npm run build`、`npm run check`（`tsc --noEmit`，strict） | 通过，0 错误；两次构建产物哈希一致（确定性） |
| 单元（模拟） | `node test/smoke.test.js` | 10 通过 / 0 失败 |
| 集成（真实 Git，临时仓库） | `node test/integration.test.js` | 16 通过 / 0 失败 |
| 全部测试（与 CI 同一条命令） | `npm test`（`node --test`） | 26 通过 / 0 失败（Windows 24.19.0；Linux 20.20.2 / 22.23.3） |
| **Linux Node 20 / 22 隔离矩阵** | WSL2 Ubuntu 24.04，隔离 Node v20.20.2 / v22.23.3；旧候选执行完整流程，修复后拷入源码并重建复验 | 旧候选产物门 exit 0，但测试各 5 cancelled；修复后 build/check/test exit 0、26/26；修复候选 922408d 的完整干净矩阵与产物门通过，详见 [validation-report-0.2.0.md](validation-report-0.2.0.md) |
| 打包 | `npm pack --dry-run` / `npm pack` | 5 个文件：LICENSE、README、`lib/index.js`、`lib/index.d.ts`、package.json；修复前 `dsh-git-plugin-0.2.0.tgz` 15054 字节（15.1 kB），修复后 15.3 kB / unpacked 43.7 kB |
| peer 准入范围（`node-semver@7.8.5`） | 旧范围 `^0.1.0-rc.6` 对 `0.2.0-rc.2` 为 false；新范围 `>=0.2.0-rc.2 <0.3.0-0` 为 true | 通过（第 3 节表格） |
| **真实 DSH 0.2.0-rc.2 服务栈** | `node scripts/verify-real-dsh.mjs --dsh-root .tmp-dsh-verify`（官方 `cordis` + `dsh-commands` + `dsh-tools` + `dsh-system-prompt` + `dsh-subprocess-local`，真实 Git 子进程） | `ALL CHECKS PASSED`（脚本当前 28 项 check；数量以脚本为准），见 5.2 |
| **独立测试 profile（真实 DSH CLI）** | 独立 `DSH_HOME` 下用 `--from-default-profile headless` 建 profile，`dsh plugin add <本地路径>` 安装，`cordis.patch.yml` 用 `insert` 启用，再跑 `--dump-config` / `--dump-config-schema` | 见 5.3 |

> `node --test` 需要捕获子进程输出；在本会话最初的受限沙箱里会 `spawn EPERM`，直接运行两个测试文件不受影响。
> 上面 `npm test` 的结果是在允许进程生成的同一环境下实跑得到的。

### 5.2 真实 DSH 验证（官方 0.2.0-rc.2 包 + 真实 Git 子进程）

覆盖：模块导出、插件 fiber 进入 ACTIVE、5 个斜杠命令、4 个只读工具、system-prompt 段落、
工具 schema 进入提示词组装、5 个命令的真实执行（`/status`、`/diff`、`/branch`、`/commit`、`/undo` list/pop）、
4 个工具的真实执行、选项注入防护、**禁用后注册清理**、**重新启用后无重复注册**、超时终止真实进程。

现场输出（节选）：`ALL CHECKS PASSED`；`/status` → `## main`；`/commit` → 真实生成提交 `chore: verify commit`；
`/undo` → `stash@{0}: On feat/verify: dsh-git-plugin undo snapshot`；
`git-show` 注入尝试 → `fatal: option '--output=…' must come before non-option arguments` 且文件未生成；
禁用后命令/工具/提示词段落全部消失，重新启用后恢复且无重复；
`timeoutMs: 400` 的真实 30 秒钩子被判定 `timed out after 400ms` 且未产生提交。

验证脚本已随仓库提供：[scripts/verify-real-dsh.mjs](../scripts/verify-real-dsh.mjs)。它从 `--dsh-root`
指定的 DSH 安装里加载官方服务包，再从本仓库加载 `lib/index.js`（插件自身的 `@deepseek-ai/dsh-tools`
仍解析到本包的 devDependency，两处同为 0.2.0-rc.2，已实测可共存）。它刻意**不纳入 `npm test`/CI**，
按需运行：

```bash
npm install --prefix .tmp-dsh-verify --no-save @deepseek-ai/dsh@0.2.0-rc.2
node scripts/verify-real-dsh.mjs --dsh-root .tmp-dsh-verify
```

退出码 0 = 全部通过，1 = 有检查失败（逐行 PASS/FAIL），2 = 无法从该 root 解析 DSH 包。

脚本当前执行 **28 项 check**（数量以脚本为准；此前口头任务描述曾写作 27 项，实际为 28 项）。

### 5.3 独立测试 profile 的安装与加载（真实 DSH CLI 0.2.0-rc.2）

在仓库内的独立 `DSH_HOME`（`.tmp-dsh-home`）中：

1. `dsh --profile gitcompat --from-default-profile headless` 建出独立 profile（不触碰日常 profile）。
2. `dsh plugin --profile gitcompat add <仓库路径>` → `+ dsh-git-plugin link:…`，并提示
   `dsh-git-plugin declares no dsh.bundle — installed as a plain dependency, not a profile layer`
   （符合预期：本插件不是组合包，用 patch `insert` 启用）。
3. `cordis.patch.yml` 写入 `- insert: [{ id: dsh-git-plugin, name: dsh-git-plugin }]`。
4. `dsh --profile gitcompat --dump-config` → 该行原样出现，**没有** `disabled: true`
   （被 peer 准入拒绝的行会变成分离的 `disabled: true` 行）。
5. `dsh --profile gitcompat --dump-config-schema` → 该行 `status: "schema"`，
   顶部 `diagnostics: []`，且 `#/$defs/config66` 正是本插件的配置 schema：
   `maxBytes 1048576 / stderrMaxBytes 65536 / graceMs 3000 / timeoutMs 30000 / preCommit []`。
   这说明真实加载器解析到了本模块并读取了 `Config`，peer 准入检查通过，stderr 无任何告警。

### 5.4 无法在本环境完成 / 未验证项（不作兼容宣称）

| 项目 | 原因 |
|---|---|
| 在**运行中的** DSH 会话里由模型调用命令/工具 | 需要一次真实模型会话（消耗额度）；本轮以「官方服务包组装 + 真实 Git」（5.2）与「独立 profile 的加载/准入」（5.3）两项替代。 |
| Windows 之外的行为 | Linux Node 20/22 本地干净矩阵及发布点 GitHub Actions 已通过；Linux 完整 DSH 服务栈仍未验证。 |
| 0.2.x 中除 `0.2.0-rc.2` 之外的版本 | peer 范围允许加载，但**未验证**；新增 DSH 版本必须先跑 `scripts/verify-real-dsh.mjs` 再更新「实际验证版本」。 |
| DSH 0.1.x 旧版本 | 已从 peer 范围移除，不再宣称兼容；如需回退需另开分支验证。 |
| Git < 2.24（无 `--end-of-options`） | 未实测。 |
| GitHub 安装渠道 | 固定 v0.2.0 的独立 DSH profile 安装/启用/schema 与官方 peer 下服务栈均通过，见发布记录；不用未固定的 main 替代 tag 证据。 |
| 从 npm 安装 `0.2.0` | 独立 DSH profile 的实装/启用/schema 无诊断与官方 peer 下 28 项服务栈已通过；实际 tarball 与发布点哈希一致，见发布记录。 |
| **Web 面板（Issue #1）** | 本轮只交付方案文档 [docs/web-panel-plan.md](web-panel-plan.md)，**GUI 未实现**（本插件仍无 `dsh.client` 字段与 client 入口）；三视图实现、真实 Web GUI 内的显示与启停清理验证、客户端包体与构建门均待后续阶段（P2）。 |

## 6. 社区反馈（2026-09-29 采集）

- 仓库共 **1 个 issue、0 个 PR**（`gh api` 只读查询）。
- **Issue #1**（用户反馈，`Mooling0602`，2026-08-29T14:47:47Z，open，0 评论）：
  「[Feature Request] 为 dsh 网页端添加用户友好的可视化界面」——希望在 DSH Web 中提供类似
  lazygit / VS Code 的图形化 Git 面板，便于直接观察 Git 状态。
  来源：<https://github.com/MashedPotato817/dsh-git-plugin/issues/1>
- 除此之外没有其他讨论；`stargazers 1`、`forks 0`。本轮**未**向 issue 发评论、未创建外部 issue。
- 本轮的三个缺陷（选项注入、超时、钩子目录）属于**自行发现**，没有对应的用户反馈。

## 7. Issue #1 的可复用能力评估（只读，本轮不实现 GUI）

已核实的 DSH 现有能力（均为运行中 0.2.0-rc.2 的官方包；下表各行给出本次实读的直接出处，实读清单另见
[docs/web-panel-plan.md](web-panel-plan.md) 第 9 节）：

| 包 | 已核实可复用什么 | 需要自建的部分 |
|---|---|---|
| `@deepseek-ai/dsh-workspace-changes` | **回合变更审阅**：按顶层回合用 git 工作树快照 + 整文件快照汇总变更文件与行数、逐文件回合前后对比、事件 `workspace/changes`，由 Web 变更卡片/审阅 tab 渲染（`packages/deliverables/workspace-changes/README.md` 第 12、48 行；hunk 形状 `src/types.ts` 第 43–54 行可只做类型复用） | **不能**提供工作区状态（HEAD↔工作区）、staged/unstaged、分支与历史，三条限制：① 范围是 turn，不含回合开始前已有的未提交改动（README 第 44 行）；② summary 与对比只在该 Session 存活期内有效，Host 重启后旧回合没有卡片（第 88 行）；③ 数据形状只有 `path`/行数/`binary`/`oversized`，没有暂存维度（`src/types.ts` 第 5–40 行）。状态与 diff 必须由本插件自己跑只读 git（`status --porcelain=v1 -z --branch -uall`、`diff -U3`） |
| `@deepseek-ai/dsh-client-ui-workspace` | 会话行菜单座位 `sidebar.workspaces.session.menu.item`（list / root）已核实存在且可由第三方插件注册（声明 `packages/client/ui-workspace/src/client/contract/slots.ts` 第 166–172 行；用法与启停断言 `apps/web/tests/fixtures/plugins/fixture-live-client/client.js` 第 75–96 行、`apps/web/tests/client-plugin-live.e2e.ts`） | 该座位只适合"一次点击型动作"，放不下常驻三视图；面板入口**不**挂这里 |
| `@deepseek-ai/dsh-client-ui-slots` | 客户端扩展机制本身：四类座位（single / list / keyed / chain）、声明即独占、条目 disposer 递归收敛（`packages/client/ui-slots/README.md` 第 28、46 行） | 面板具体注册哪些座位、由什么组件填充 |
| `@deepseek-ai/dsh-client-ui-sidebar-right`（面板落位在此） | 公开两步注册：类型进 `ctx.sidebarRightTabs.register({ id, kind, priority, title, guide })`，主体进 keyed 座位 `sidebar.right.pane.tab`（`packages/client/ui-sidebar-right/README.md` 第 83 行、契约 `src/client/contract/slots.ts` 第 59–64 行、完整样例 `packages/client/ui-sidebar-files/src/client/index.ts` 第 81–96 行）；会话身份与 cwd 由框架给出（`ui-sidebar-files/src/client/FilesBody.tsx` 第 140–147 行） | 三个视图的 UI、样式与刷新控件 |
| `@deepseek-ai/dsh-api-workspace-files` | 只读**文件**通道：`read` / `stat` / `readBytes` / `list`（分页、字节窗口与上限）与 `changes` 失效订阅（`packages/api/workspace-files/README.md` 第 28、33、58 行）；可作"未跟踪文件内容预览"与"文件失效信号" | git 数据（历史 blob/tree/diff、分支）它读不到；目录 watch 只看直接子项、部分后端 `watch-unsupported`（README 第 58、141 行），不能当唯一刷新依据 |
| `@deepseek-ai/dsh-client-ui-sidebar-*`（files / browser / terminal / documentpreview） | 右侧栏分栏的既有实现与落位先例：file / browser / terminal 三者都贡献 guide 条目（`ui-sidebar-files/src/client/definition.tsx` 第 31 行、`ui-sidebar-browser/src/client/definition.tsx` 第 22 行、`ui-sidebar-terminal/src/client/index.ts` 第 73 行） | 面板自身的渲染与数据获取 |

判断与范围：

1. **只读优先**：状态、diff、历史（log / show）全部由本插件自己的只读 git 调用产生
   （`status --porcelain=v1 -z --branch -uall`、`diff -U3`、`log --format`、`show --end-of-options`），
   不建立在 `dsh-workspace-changes` 之上；后者只用于「回合变更审阅」这一既有能力。
2. **写操作后置**：stage / commit / branch / stash 属于有副作用的操作，必须走 DSH 审批
   （`ctx.approval.request`；`packages/interaction/user-approval/README.md` 第 52 行要求一个 open turn，
   而面板按钮点击不在 turn 内，这是 P3 的前置未决问题），放在第二阶段之后，并明确「谁批准、可撤销」。
3. 本轮**不实现任何 GUI**；本插件保持无客户端代码（`dsh.client` 字段与 client 入口都不添加），
   以免在未验证的情况下承担客户端兼容风险。

来自面板方案的 3 条硬约束（细节见 [docs/web-panel-plan.md](web-panel-plan.md)）：

1. 客户端半侧用 **TypeScript / TSX** 编写（`src/client/**`），由一个**小型构建配置**生成 DSH 需要的包装产物
   `lib/client.js`（`window.__ModuleLoader__.load({ id, factory(require) { … } })` 形态，只 `require('react')`
   与平台基线包）；**不手写** `lib/client.js`。官方客户端打包预设 `packages/client/tsdown.client.ts` 未发布到 npm
   （`packages/client/` 无 `package.json`，预设依赖仓库根 glob），因此自建的小配置只负责包装形态，
   格式契约照 `packages/client/tsdown.client.ts` 第 473–627 行（banner/footer/intro、`entryFileNames: 'client.js'`），
   形态可用性由 DSH 自己的夹具 `apps/web/tests/fixtures/plugins/fixture-live-client/client.js` 佐证。
2. 声明 `dsh.client` 时**必须同时**提供 `exports["./client"]` 与构建好的 `lib/client.js`：客户端模块扫描
   在缺少 `./client` 导出时直接抛错（`packages/client/modules/src/index.ts` 第 841–848 行），bundle 文件缺失
   会让 Web 启动期的激活扫描失败（`packages/client/modules/README.md` 第 50 行）。
3. `lib/client.js` 必须随仓库提交并纳入 npm `files`：当前 `files: ["lib", "README.md", "LICENSE"]` 已覆盖
   整个 `lib/`，仍要在发布流程里把客户端半侧产物与 `lib/index.js` 同等对待（随提交、`npm pack --dry-run` 核对）。

Issue #1 的只读 Web 面板完整方案（能力复用、入口落位、Host 数据通道、最小文件范围、验收标准与风险）
另见 [docs/web-panel-plan.md](web-panel-plan.md)。

## 8. 后续阶段、负责人角色与验收标准

| 阶段 | 内容 | 负责人角色 | 验收标准 |
|---|---|---|---|
| P0（本轮） | 适配 0.2.0-rc.2、修复三个缺陷、补测试与文档 | 插件维护者 | `npm run build` / `npm run check` / 两个测试文件全绿；真实服务栈验证全绿 |
| P1（发布） | 版本 0.2.0 预发布 → 用 dist-tag 推广；tag / Release / npm 对应同一提交 | 仓库负责人（授权发布） | 第 9 节发布步骤全部完成，四者一致性核对通过 |
| P2（GUI 只读面板） | 用本插件自己的只读 git 调用（`status --porcelain=v1 -z --branch -uall`、`diff -U3`、`log`）+ client slot（右侧栏 tab）做状态 / diff / 历史只读面板；**回合变更审阅**可复用 `dsh-workspace-changes`，但它不提供工作区状态 / staged-unstaged / 分支 / 历史（见第 7 节） | 插件维护者 + 客户端联调者 | 面板只读；不新增写路径；禁用插件后 UI 与注册完全清理；逐视图验收标准见 [docs/web-panel-plan.md](web-panel-plan.md) 第 7 节 |
| P3（GUI 写操作） | stage / commit / branch / stash 纳入面板，走审批 | 同上 + 安全评审者 | 每个写操作都能说明审批来源与撤销手段 |
| P4（长期维护） | 每个 DSH `0.2.x` 新版本先跑 `scripts/verify-real-dsh.mjs`，通过后再更新 peer/`engines` 与本文档的「实际验证版本」 | 插件维护者 | 兼容表更新 + 真实服务栈验证重跑并记录输出 |

## 9. 发布步骤（本地 commit 自动执行，线上动作按授权执行）

本节命令保留 0.2.0 已完成发布的示例；后续版本替换版本号和发布分支。0.2.1 的当前证据与渠道状态见 [发布记录](release-report-0.2.1.md)，含 bundle 的新安装无需再追加 insert；旧 profile 迁移见 [市场收录准备](marketplace-submission.md)。

原则：**一个版本只 `npm publish` 一次**；`next` 验证通过后用 `npm dist-tag add` 把同一版本推广到 `latest`，
不再发布第二次（同一版本号无法重复发布）。

发布分两个提交，**发布点**是最终发布提交（或其上的合并提交）：

- **候选提交**（9.1）在发布分支 `feat/release-0.2.0` 上承载版本文件、CHANGELOG、编译配置、测试与 `lib/`；
  此时 CHANGELOG 的日期可保留「待发布」。
- **最终发布提交**（9.3）只把 CHANGELOG 的日期定稿；发布日期必须在 `npm publish` **之前**确定并进入提交，
  不允许发布后再改。
- npm 记录的 `gitHead`、`v0.2.0` tag、GitHub Release 与包内产物都必须对应**同一个发布点**。

### 9.1 准备候选提交（在 `feat/release-0.2.0` 上，版本文件 + CHANGELOG + 构建产物同一提交）

1. 工作在发布分支 `feat/release-0.2.0`（已从 `2f80cb3` 创建）：**审阅与提交都在该分支完成**，
   不要在本地直接改 `main`；合并到 `main` 走 PR，并放在最终发布提交之后（9.3）。
2. 版本**已经**是 `0.2.0`（建分支时已执行 `npm version 0.2.0 --no-git-tag-version`）。只需确认三处一致：
   `package.json`、`package-lock.json` 顶层、`package-lock.json` 的 `packages[""].version`。
   **不要重复执行 `npm version`**；确实需要改版本时才运行 `npm version <新版本> --no-git-tag-version` 并同步锁文件。
3. 改 `CHANGELOG.md`：把 `## [Unreleased]` 的内容移到 `## [0.2.0] - 待发布`，并保留空的 `Unreleased` 段
   （**本轮已整理完毕，只需核对**）。候选阶段日期写「待发布」；**实际发布日期在 9.3 的最终发布提交里定稿**
   （发布前，而不是发布后）。
4. 全量检查（在工作区执行）：
   ```bash
   npm ci
   npm run build      # 生成 lib/，产物随提交
   npm run check      # tsc --noEmit
   npm test           # node --test：26 个用例
   npm install --prefix .tmp-dsh-verify --no-save @deepseek-ai/dsh@0.2.0-rc.2
   node scripts/verify-real-dsh.mjs --dsh-root .tmp-dsh-verify   # 真实 DSH 服务栈验证，见 5.2
   ```
5. **审阅并纳入构建产物**：确认 `npm run build` 已运行、`lib/` 只含本轮产物（`index.js` + `index.d.ts`）。
   注意：**不要在提交前把 `git diff --exit-code lib` 当作通过条件** —— 此时工作区的 `lib/` 相对 HEAD
   是本轮的正常修改，该命令必然报差异。构建产物门是提交后的检查，见 9.2。
6. 独立测试 profile 复验（**不动日常 profile**，本轮已用同一组命令验证过）：
   - `dsh --profile <测试名> --from-default-profile headless --dump-config`（独立 `DSH_HOME`）
   - `dsh plugin --profile <测试名> add <仓库本地路径>`，随后在 `cordis.patch.yml` 写入
     `- insert: [{ id: dsh-git-plugin, name: dsh-git-plugin }]`（模板原本是 `[]`，要替换而不是追加）
   - `dsh --profile <测试名> --dump-config` 确认该行没有 `disabled: true`
   - `dsh --profile <测试名> --dump-config-schema` 确认该行 `status: "schema"`、`diagnostics` 为空、
     配置 schema 与本插件的五个字段一致
7. 在 `feat/release-0.2.0` 上提交**候选提交**（版本文件 + CHANGELOG + 编译配置 + 测试 + `lib/` + 文档一起）：
   ```bash
   git add package.json package-lock.json CHANGELOG.md README.md AGENTS.md \
           tsconfig.json src lib test scripts docs .github .gitignore
   git commit -m "chore(release): 0.2.0 candidate"
   ```
   记下候选提交 SHA，9.2 的干净检出要用它。**此处不要推送 `main`**：合并走 9.3 的 PR 流程。
   注意：`AGENTS.md` 作为项目指引纳入版本控制，但不加入 npm 发布包（`files = ["lib","README.md","LICENSE"]`）；
   按上面的显式路径暂存，避免带入 `.agent-teams/`、缓存或临时目录。

### 9.2 提交后复核：构建产物门（在干净检出里重建后比较）

8. 该门只有在发布提交存在之后才有意义（CI 会在推送后跑同一道门）；需要本地复核时用干净检出：
   候选 SHA 尚未推送时必须从本地主仓库克隆。以下示例在 WSL 中执行；Windows 请使用对应的本地绝对路径与独立临时目录。只有确认远端包含该 SHA 后，才可改用远端地址。
   ```bash
   git clone --no-hardlinks "/mnt/c/Users/Mashed Potato/Desktop/npm/dsh-git-plugin" /tmp/dsh-git-plugin-verify
   cd /tmp/dsh-git-plugin-verify
   git checkout <9.1 第 7 步的候选提交 SHA>
   npm ci
   npm run build
   git diff --exit-code lib      # 此时应为 0：提交的 lib/ 与重新构建的产物一致
   npm run check
   npm test
   ```
   若这里出现差异，说明提交里的 `lib/` 不是当前源码的产物，回到 9.1 重新构建并 amend 提交后再继续。

### 9.3 最终发布提交与合并到 `main`

9. 确定发布日期：把 `CHANGELOG.md` 的 `## [0.2.0] - 待发布` 改成 `## [0.2.0] - <YYYY-MM-DD>`。
   这一步**只改 CHANGELOG**；若同时改动了源码或 `lib/`，必须先重跑 9.2 的构建产物门。
10. 提交**最终发布提交**并记下 SHA（它将成为发布点）：
    ```bash
    git add CHANGELOG.md
    git commit -m "chore(release): 0.2.0"
    ```
11. （授权后）从 `feat/release-0.2.0` 开 PR 合并到 `main`，并推送 `origin`：
    - 采用 **merge commit**：以 `main` 上的合并提交为**发布点**，并确认它与最终发布提交在发布相关文件上一致
      （`git diff <最终发布提交> <main 合并提交> -- .` 无输出）；随后 `git checkout main && git pull`。
    - 采用 **fast-forward**：发布点就是最终发布提交本身，提交 SHA 不变。
    - 采用 **rebase**：可能重写提交 SHA；以合并后 `main` 上实际承载发布内容的提交为发布点，重新记录 SHA，并核对它与最终发布提交的文件树一致，npm `gitHead`、tag、Release 都使用这个实际 SHA。
    发布点确定后，9.4 的 `npm publish` 与 9.5 的 tag/Release 都从它出发。

### 9.4 发布 npm（同一版本只发布一次）

12. 在发布点先看打包内容：`npm pack --dry-run` → 应为 `LICENSE`、`README.md`、`lib/index.js`、`lib/index.d.ts`、`package.json`。
13. 在发布点（`main` 的合并提交或最终发布提交）执行：`npm publish --tag next`
    —— `prepack` 会自动重新构建 `lib/`（`tsc` 输出确定，已实测两次构建哈希一致，所以产物与 9.2 复核的一致）；
    npm 会把当前 HEAD 记为 `gitHead`，因此必须在发布点上执行。
14. 验证预发布：
    ```bash
    npm view dsh-git-plugin@0.2.0 version dist-tags gitHead
    npm dist-tag ls dsh-git-plugin
    ```
    确认 `gitHead` 等于发布点 SHA；再在独立测试 profile 里
    `dsh plugin --profile <测试名> add dsh-git-plugin@0.2.0`，重复 5.3 的加载检查与 5.2 的命令/工具检查。
15. 推广到正式标签（**不再 publish**）：
    ```bash
    npm dist-tag add dsh-git-plugin@0.2.0 latest
    npm dist-tag ls dsh-git-plugin      # next 与 latest 都指向 0.2.0
    ```

### 9.5 tag 与 GitHub Release（指向同一发布点）

16. 打 tag 并推送（tag 名与版本一致，指向发布点）：
    ```bash
    git tag -a v0.2.0 -m "dsh-git-plugin 0.2.0" <发布点 SHA>
    git push origin v0.2.0
    ```
    推送 `main` 之后，README 的 GitHub 安装渠道才真正可用；届时可按发布 tag 固定：
    `dsh plugin --profile <name> add github:MashedPotato817/dsh-git-plugin#v0.2.0`。
17. 在该 tag 上创建 GitHub Release，说明取 `CHANGELOG.md` 的 `[0.2.0]` 段。
18. 一致性核对（四者必须对应同一发布点/同一份产物）：
    - `git rev-parse v0.2.0^{commit}` == 发布点 SHA == `npm view dsh-git-plugin@0.2.0 gitHead`
    - GitHub Release 的 tag 指向同一 SHA
    - `CHANGELOG.md` 的 `## [0.2.0]` 日期已定稿（不再是「待发布」），与 `package.json` 的 `version` 一致，且 `Unreleased` 已清空
    - 已发布 tarball 里的 `lib/` 与仓库提交的 `lib/` 逐字节一致：
      `npm pack dsh-git-plugin@0.2.0` 后比对 `lib/index.js` / `lib/index.d.ts` 的哈希
    - `npm dist-tag ls dsh-git-plugin` 中 `latest` 与（可选的）`next` 都指向 `0.2.0`

### 9.6 出错时

已发布的版本号不能重发：任何需要改动的发布问题都提升到下一个补丁版本（如 `0.2.1`）重走 9.1–9.5，
不要试图覆盖 `0.2.0`。

> 兼容核对脚本 `scripts/verify-real-dsh.mjs` 依赖一份独立的 DSH 安装，刻意**不纳入 `npm test`/CI**：
> ```bash
> npm install --prefix .tmp-dsh-verify --no-save @deepseek-ai/dsh@0.2.0-rc.2
> node scripts/verify-real-dsh.mjs --dsh-root .tmp-dsh-verify
> ```


## 10. 剩余问题与风险

1. **旧 npm 0.1.0 与新版 DSH 不兼容**：0.2.0 已发布并实测；latest 已推广为 0.2.0，固定精确版本或 GitHub tag 保持复现。
2. **子包 `latest` 滞后**：任何安装/开发命令不要使用 `@latest`，用 `next` 或精确版本。
3. **`timeoutMs` 语义变化**：现在对 preCommit 也生效，默认 30s 可能对 `preCommit: ["npm","test"]`
   这类慢钩子偏紧，需要在配置里调大，README 已注明。
4. **当前 SHA CI 已通过**：PR #2 与发布点 c83f332 的 Ubuntu Node 20/22 构建、产物门、类型与测试均通过；具体 run 链接见发布记录。
5. **GitHub 固定 tag 实装已通过**：v0.2.0 的独立 profile 与官方 peer 下真实服务栈通过；npm 0.2.0 实装同样通过，两个渠道产物哈希一致。
6. **发布纪律**：同一版本号只能 `npm publish` 一次；`latest` 必须用 `npm dist-tag add` 推广。
   任何发布后修复都提升补丁版本重走第 9 节，不要覆盖已发布版本。
7. **兼容声明纪律**：peer/`engines` 的 `>=0.2.0-rc.2 <0.3.0-0` 只是允许范围；
   只有实际跑过 `scripts/verify-real-dsh.mjs` 的版本才能写进「实际验证版本」。
8. **Web 面板只有方案、尚未实现**：本轮只交付 [docs/web-panel-plan.md](web-panel-plan.md) 这份方案文档，
   **GUI 未实现**（无 `dsh.client` 字段、无 client 入口）；三视图实现与真实 Web GUI 内的显示、启停清理验证
   属于后续阶段（P2）。实现前必须先满足三条硬约束：客户端半侧用 TypeScript / TSX 编写并由小型构建配置生成
   `lib/client.js`（官方客户端打包预设未发布，故自建包装配置，不手写产物）、
   声明 `dsh.client` 必须同时提供 `exports["./client"]` 与构建产物、`lib/client.js` 必须随仓库提交并纳入 npm `files`。
   面板的状态 / diff 数据由本插件自己的只读 git 调用产生，**不**依赖 `dsh-workspace-changes`（它只提供回合变更
   审阅，见第 7 节）。
9. **npm 12 默认拦截 install scripts**：安装 DSH 0.2.0-rc.2 时有 5 个脚本被拦——
   `@deepseek-ai/dsh-subprocess-local` 的 postinstall `ensure-spawn-helper.mjs`、`koffi`、`node-pty`、
   `@google/genai`、`protobufjs`。Windows 下本次验证不受影响（该 postinstall 只恢复 POSIX 可执行位），
   但 Linux/macOS 上 `node-pty` 的 spawn-helper 执行位可能受影响，属**待相应平台确认**的风险。
10. ~~**验证脚本的临时目录未自清**~~ → **已修复（包 01，922408d）**：`scripts/verify-real-dsh.mjs` 现在把
    `run()` 的临时目录与自建 Git 仓库统一登记，在所有退出路径（正常、失败、未捕获异常）清理，并对 Windows 上
    「被终止的子进程短暂锁住目录」重试 5×100 ms；连续 3 次运行后 `%TEMP%/dsh-verify-*` 残留为 0。
    同时补了 `--dsh-root` 缺值/未知选项的 exit 2 与用法提示，以及实际加载的官方包版本与入口路径打印。
11. **截止时间定时器缺陷（包 01 发现并修复，922408d）**：`runProcess` 的超时定时器与 `terminateHandle` 的宽限定时器
    曾被 `unref`，在被等待的 promise 只由该定时器推进时事件循环会在到期前耗尽——Linux Node 20/22 上稳定复现
    （`npm test` 5 项 `cancelledByParent`），等于超时可能被跳过。修复移除两处 `unref`，`lib/` 已重建；
    Windows 与 Linux 两个 Node 版本复验 26/26，真实服务栈连续 3 次 `ALL CHECKS PASSED`。
    **源码修复已提交**：新修复候选为 `922408d`；Codex 已对该 SHA 重跑 Linux Node 20/22 完整干净矩阵，含提交后构建产物门，全部通过。

## 本地收尾规则更新（2026-10-01）

用户已持续授权每个任务/阶段完成后的本地 commit，不再等待审阅认可才提交。规则见 AGENTS.md；线上推送、合并、tag、npm 发布和社区消息仍使用各自的授权。当前修复候选 922408d 的 Linux Node 20/22 完整干净矩阵已通过，模型会话、候选远端 CI 与双渠道安装仍待完成。
