# dsh-git-plugin 维护计划

本轮工作按「审查 → 适配 → 验证 → 交付」推进，本文记录证据、结论、剩余问题与后续安排。
所有外部动作（提交、推送、打 tag、发布 npm / GitHub Release、社区回复）均未执行，等待仓库负责人授权。

## 1. 当前状态

| 项目 | 状态 |
|---|---|
| 仓库 | `MashedPotato817/dsh-git-plugin`，默认分支 `main`，最新提交 `3bbb253 docs: README 增加 npm 徽章` |
| 工作分支 | `fix/git-show-option-injection`（上一轮遗留分支，本轮在其上继续，未提交） |
| npm | `dsh-git-plugin@0.1.0`，2026-08-13T16:31:32Z 发布，`gitHead b9cfbd9` |
| GitHub Release | `v0.1.0`，2026-08-13T16:06:59Z，tag 指向 `b9cfbd9`（与 npm `gitHead` 一致） |
| 目标 DSH | 0.2.0-rc.2（本机运行中的桌面运行时版本，见第 2 节） |
| **实际验证版本** | **仅 `0.2.0-rc.2`**：官方 npm 包、本机桌面运行时、独立测试 profile 三处均只验证了这一个版本。允许范围内的其他版本（如 0.2.0 / 0.2.1-rc.1）**未验证**；0.2.0-rc.1 低于下限，不在允许范围内。 |
| **依赖允许范围** | peer / `engines.dsh` 声明为 `>=0.2.0-rc.2 <0.3.0-0`（Node `>=20`）。这是「允许安装与加载的范围」，不是「已验证兼容的范围」；范围内未实测的版本需按第 5.2 节重跑验证后再宣称。 |
| Git 要求 | 需支持 `--end-of-options`（Git 2.24+）；实测 Git 2.53.0.windows.2，更老版本未验证 |
| 源码形态 | `src/index.ts`（严格模式 TypeScript）→ `npm run build` → `lib/index.js` + `lib/index.d.ts`；`lib/` 随仓库提交，npm 与 GitHub 两种安装渠道都不需要安装期构建 |
| 未提交改动 | `src/index.ts`、`tsconfig.json`、`lib/index.js`（tsc 重新生成）、`lib/index.d.ts`（新增）、`scripts/verify-real-dsh.mjs`（新增）、`package.json`、`package-lock.json`、`test/smoke.test.js`、`test/integration.test.js`、`README.md`、`CHANGELOG.md`（新增）、`docs/maintenance-plan.md`（新增）、`docs/article-dsh-git-plugin.md`、`.github/workflows/ci.yml`、`.gitignore`。另有 `AGENTS.md`（本地维护指引）与 `.agent-teams/`（本轮验证产生的团队状态）**均不纳入发布提交**，后者已在 `.gitignore` 中忽略 |

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
| 全部测试（与 CI 同一条命令） | `npm test`（`node --test`） | 26 通过 / 0 失败 |
| 打包 | `npm pack --dry-run` | 5 个文件 13.6 kB：LICENSE、README、`lib/index.js`、`lib/index.d.ts`、package.json |
| peer 准入范围（`node-semver@7.8.5`） | 旧范围 `^0.1.0-rc.6` 对 `0.2.0-rc.2` 为 false；新范围 `>=0.2.0-rc.2 <0.3.0-0` 为 true | 通过（第 3 节表格） |
| **真实 DSH 0.2.0-rc.2 服务栈** | `node scripts/verify-real-dsh.mjs --dsh-root .tmp-dsh-verify`（官方 `cordis` + `dsh-commands` + `dsh-tools` + `dsh-system-prompt` + `dsh-subprocess-local`，真实 Git 子进程） | `ALL CHECKS PASSED`，见 5.2 |
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

验证脚本已随仓库提供：[scripts/verify-real-dsh.mjs](scripts/verify-real-dsh.mjs)。它从 `--dsh-root`
指定的 DSH 安装里加载官方服务包，再从本仓库加载 `lib/index.js`（插件自身的 `@deepseek-ai/dsh-tools`
仍解析到本包的 devDependency，两处同为 0.2.0-rc.2，已实测可共存）。它刻意**不纳入 `npm test`/CI**，
按需运行：

```bash
npm install --prefix .tmp-dsh-verify --no-save @deepseek-ai/dsh@0.2.0-rc.2
node scripts/verify-real-dsh.mjs --dsh-root .tmp-dsh-verify
```

退出码 0 = 全部通过，1 = 有检查失败（逐行 PASS/FAIL），2 = 无法从该 root 解析 DSH 包。

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
| Windows 之外的行为 | 本轮只在 Windows（Node 24.19.0、Git 2.53.0.windows.2）实测；Linux 由 CI 矩阵（Node 20/22，ubuntu-latest）覆盖，**尚未在 GitHub Actions 上实际跑过**。 |
| 0.2.x 中除 `0.2.0-rc.2` 之外的版本 | peer 范围允许加载，但**未验证**；新增 DSH 版本必须先跑 `scripts/verify-real-dsh.mjs` 再更新「实际验证版本」。 |
| DSH 0.1.x 旧版本 | 已从 peer 范围移除，不再宣称兼容；如需回退需另开分支验证。 |
| Git < 2.24（无 `--end-of-options`） | 未实测。 |
| GitHub 安装渠道 | `dsh plugin add github:MashedPotato817/dsh-git-plugin` 未实测；为此把编译产物 `lib/` 纳入版本控制，避免依赖安装期构建脚本。 |

## 6. 社区反馈（2026-09-29 采集）

- 仓库共 **1 个 issue、0 个 PR**（`gh api` 只读查询）。
- **Issue #1**（用户反馈，`Mooling0602`，2026-08-29T14:47:47Z，open，0 评论）：
  「[Feature Request] 为 dsh 网页端添加用户友好的可视化界面」——希望在 DSH Web 中提供类似
  lazygit / VS Code 的图形化 Git 面板，便于直接观察 Git 状态。
  来源：<https://github.com/MashedPotato817/dsh-git-plugin/issues/1>
- 除此之外没有其他讨论；`stargazers 1`、`forks 0`。本轮**未**向 issue 发评论、未创建外部 issue。
- 本轮的三个缺陷（选项注入、超时、钩子目录）属于**自行发现**，没有对应的用户反馈。

## 7. Issue #1 的可复用能力评估（只读，本轮不实现 GUI）

已核实的 DSH 现有能力（均为运行中 0.2.0-rc.2 的官方包）：

| 包 | 已核实的作用 | 对本需求的复用判断 |
|---|---|---|
| `@deepseek-ai/dsh-workspace-changes` | 按「顶层回合」用 git 工作树快照 + 整文件快照汇总变更文件与行数，提供每文件回合前后对比，事件 `workspace/changes`，由 Web 变更卡片渲染 | **直接复用**：只读状态与 diff 的主数据源，不必自己实现 |
| `@deepseek-ai/dsh-client-ui-workspace` | Workspace / Session 浏览与选择；Session 行菜单是**slot 列表**，客户端插件可扩展 | **扩展点**：Git 面板入口可挂在这里，而非自建顶层应用 |
| `@deepseek-ai/dsh-client-ui-slots` | 客户端 UI slot 组合机制 | 实现面板所需的客户端扩展接口 |
| `@deepseek-ai/dsh-api-workspace-files` | Workspace 文件相关 API | 只读文件/diff 数据的 Host 侧通道候选 |
| `@deepseek-ai/dsh-client-ui-sidebar-*`（files / documentpreview / terminal 等） | 侧边栏分栏的既有实现 | 面板落位参考（右侧栏 / 文件栏） |

判断与范围：

1. **只读优先**：状态、diff、历史（log / show）可以直接建立在 `dsh-workspace-changes` 与本插件现有
   只读工具之上，不需要新的写路径。
2. **写操作后置**：stage / commit / branch / stash 属于有副作用的操作，必须走 DSH 的审批与权限模型，
   放在第二阶段之后，并明确「谁批准、可撤销」。
3. 本轮**不实现任何 GUI**；本插件保持无客户端代码（`dsh.client` 字段与 client 入口都不添加），
   以免在未验证的情况下承担客户端兼容风险。

## 8. 后续阶段、负责人角色与验收标准

| 阶段 | 内容 | 负责人角色 | 验收标准 |
|---|---|---|---|
| P0（本轮） | 适配 0.2.0-rc.2、修复三个缺陷、补测试与文档 | 插件维护者 | `npm run build` / `npm run check` / 两个测试文件全绿；真实服务栈验证全绿 |
| P1（发布） | 版本 0.2.0 预发布 → 用 dist-tag 推广；tag / Release / npm 对应同一提交 | 仓库负责人（授权发布） | 第 9 节发布步骤全部完成，四者一致性核对通过 |
| P2（GUI 只读面板） | 用 `dsh-workspace-changes` + client slot 做状态 / diff / 历史只读面板 | 插件维护者 + 客户端联调者 | 面板只读；不新增写路径；禁用插件后 UI 与注册完全清理 |
| P3（GUI 写操作） | stage / commit / branch / stash 纳入面板，走审批 | 同上 + 安全评审者 | 每个写操作都能说明审批来源与撤销手段 |
| P4（长期维护） | 每个 DSH `0.2.x` 新版本先跑 `scripts/verify-real-dsh.mjs`，通过后再更新 peer/`engines` 与本文档的「实际验证版本」 | 插件维护者 | 兼容表更新 + 真实服务栈验证重跑并记录输出 |

## 9. 发布步骤（需仓库负责人授权后执行）

原则：**一个版本只 `npm publish` 一次**；`next` 验证通过后用 `npm dist-tag add` 把同一版本推广到 `latest`，
不再发布第二次（同一版本号无法重复发布）。发布提交必须同时包含版本文件、CHANGELOG、编译配置与构建产物，
之后打的 tag 与 GitHub Release 都指向这个提交，npm 记录的 `gitHead` 也必须是它。

### 9.1 准备发布提交（版本文件 + CHANGELOG + 构建产物同一提交）

1. 合并到 `main`（本分支当前为 `fix/git-show-option-injection`）。
2. 提升版本：`npm version 0.2.0 --no-git-tag-version`
   → 同时改写 `package.json` 与 `package-lock.json` 的版本字段（**两个文件都要进同一次提交**）。
   `--no-git-tag-version` 是刻意的：tag 留到第 9.4 步、在发布并验证之后打。
3. 改 `CHANGELOG.md`：把 `## [Unreleased]` 的内容移到 `## [0.2.0] - <发布日期>`，并保留空的 `Unreleased` 段
   （这样提交里的变更记录与即将发布的版本一一对应）。
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
7. 提交发布提交（**版本文件 + CHANGELOG + 编译配置 + 测试 + `lib/` 一起**）：
   ```bash
   git add package.json package-lock.json CHANGELOG.md README.md \
           tsconfig.json src lib test scripts docs .github .gitignore
   git commit -m "chore(release): 0.2.0"
   git push origin main          # 需授权
   ```
   记下这个提交的 SHA，第 9.2–9.4 步都要用它（9.2 的干净检出、9.3 的 `gitHead` 核对、9.4 的 tag）。
   注意：`AGENTS.md`（本地维护指引）目前是未跟踪文件，是否纳入提交由仓库负责人决定；
   不确定时不要用 `git add -A`，按上面的显式路径暂存。

### 9.2 提交后复核：构建产物门（在干净检出里重建后比较）

8. 该门只有在发布提交存在之后才有意义（CI 会在推送后跑同一道门）；需要本地复核时用干净检出：
   ```bash
   git clone <仓库地址> /tmp/dsh-git-plugin-verify
   cd /tmp/dsh-git-plugin-verify
   git checkout <9.1 第 7 步的提交 SHA>
   npm ci
   npm run build
   git diff --exit-code lib      # 此时应为 0：提交的 lib/ 与重新构建的产物一致
   npm run check
   npm test
   ```
   若这里出现差异，说明提交里的 `lib/` 不是当前源码的产物，回到 9.1 重新构建并 amend 提交后再继续。

### 9.3 发布 npm（同一版本只发布一次）

9. 先看打包内容：`npm pack --dry-run` → 应为 `LICENSE`、`README.md`、`lib/index.js`、`lib/index.d.ts`、`package.json`。
10. 发布到预发布标签：`npm publish --tag next`
    —— `prepack` 会自动重新构建 `lib/`（`tsc` 输出确定，已实测两次构建哈希一致，所以产物与 9.2 复核的一致）；
    npm 会把当前 HEAD 记为 `gitHead`，所以 9.1 必须先提交、9.2 必须先通过。
11. 验证预发布：
    ```bash
    npm view dsh-git-plugin@0.2.0 version dist-tags gitHead
    npm dist-tag ls dsh-git-plugin
    ```
    确认 `gitHead` 等于 9.1 第 7 步的提交 SHA；再在独立测试 profile 里
    `dsh plugin --profile <测试名> add dsh-git-plugin@0.2.0`，重复 5.3 的加载检查与 5.2 的命令/工具检查。
12. 推广到正式标签（**不再 publish**）：
    ```bash
    npm dist-tag add dsh-git-plugin@0.2.0 latest
    npm dist-tag ls dsh-git-plugin      # next 与 latest 都指向 0.2.0
    ```

### 9.4 tag 与 GitHub Release（指向同一提交）

13. 打 tag 并推送（tag 名与版本一致，指向 9.1 第 7 步的提交）：
    ```bash
    git tag -a v0.2.0 -m "dsh-git-plugin 0.2.0" <9.1 第 7 步的提交 SHA>
    git push origin v0.2.0
    ```
    推送 `main` 之后，README 的 GitHub 安装渠道才真正可用；届时可按发布 tag 固定：
    `dsh plugin --profile <name> add github:MashedPotato817/dsh-git-plugin#v0.2.0`。
14. 在该 tag 上创建 GitHub Release，说明取 `CHANGELOG.md` 的 `[0.2.0]` 段。
15. 一致性核对（四者必须对应同一提交/同一份产物）：
    - `git rev-parse v0.2.0^{commit}` == 9.1 第 7 步的提交 SHA == `npm view dsh-git-plugin@0.2.0 gitHead`
    - GitHub Release 的 tag 指向同一 SHA
    - `CHANGELOG.md` 的 `## [0.2.0]` 与 `package.json` 的 `version` 一致，且 `Unreleased` 已清空
    - 已发布 tarball 里的 `lib/` 与仓库提交的 `lib/` 逐字节一致：
      `npm pack dsh-git-plugin@0.2.0` 后比对 `lib/index.js` / `lib/index.d.ts` 的哈希
    - `npm dist-tag ls dsh-git-plugin` 中 `latest` 与（可选的）`next` 都指向 `0.2.0`

### 9.5 出错时

已发布的版本号不能重发：任何需要改动的发布问题都提升到下一个补丁版本（如 `0.2.1`）重走 9.1–9.4，
不要试图覆盖 `0.2.0`。

> 兼容核对脚本 `scripts/verify-real-dsh.mjs` 依赖一份独立的 DSH 安装，刻意**不纳入 `npm test`/CI**：
> ```bash
> npm install --prefix .tmp-dsh-verify --no-save @deepseek-ai/dsh@0.2.0-rc.2
> node scripts/verify-real-dsh.mjs --dsh-root .tmp-dsh-verify
> ```


## 10. 剩余问题与风险

1. **npm 上的 0.1.0 与 DSH 0.2.0-rc.2 不兼容**：在 0.2.0 发布前，README 的安装说明必须明确
   这一点；用户从 npm 安装会拿到被 DSH 拒绝的旧版本。
2. **子包 `latest` 滞后**：任何安装/开发命令不要使用 `@latest`，用 `next` 或精确版本。
3. **`timeoutMs` 语义变化**：现在对 preCommit 也生效，默认 30s 可能对 `preCommit: ["npm","test"]`
   这类慢钩子偏紧，需要在配置里调大，README 已注明。
4. **CI 尚未在 GitHub Actions 上实际运行**：本地已用同一条 `npm test`（26/26）与 `npm run check` 验证；
   首次推送后需确认 Actions 上的构建、`git diff --exit-code lib` 新鲜度门与 Node 20/22 矩阵结果。
5. **GitHub 安装渠道**（`dsh plugin add github:MashedPotato817/dsh-git-plugin`）未实测，且**推送前不可用**
   （远端仍是旧代码）。README 已把该渠道标注为「推送兼容版本后适用」并建议固定到发布 tag；
   编译产物 `lib/` 纳入版本控制，避免依赖安装期构建脚本。
6. **发布纪律**：同一版本号只能 `npm publish` 一次；`latest` 必须用 `npm dist-tag add` 推广。
   任何发布后修复都提升补丁版本重走第 9 节，不要覆盖已发布版本。
7. **兼容声明纪律**：peer/`engines` 的 `>=0.2.0-rc.2 <0.3.0-0` 只是允许范围；
   只有实际跑过 `scripts/verify-real-dsh.mjs` 的版本才能写进「实际验证版本」。
