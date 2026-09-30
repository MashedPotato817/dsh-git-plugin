# 0.2.0 发布前验证报告（包 01）

执行日期：2026-10-01。仓库：`C:/Users/Mashed Potato/Desktop/npm/dsh-git-plugin`。
本报告只记录**实际执行过**的检查；未执行的项目在文末明确列出，不以其他层次的测试替代。

## 1. 基线与提交

| 项 | SHA / 说明 |
|---|---|
| 任务包指定候选 | `feba7b8`（`chore(release): 0.2.0 candidate`） |
| 执行时 HEAD | `2a5ef36`（`docs(maintenance): 核查维护进度并拆分 DSH 后续任务`） |
| 两者差异 | **仅文档**：`AGENTS.md`、`docs/dsh-tasks/*`、`docs/maintenance-plan.md`；`git diff feba7b8..2a5ef36 -- src lib test package.json package-lock.json tsconfig.json scripts` 为空 → Linux 矩阵在 `feba7b8` 上的结果对 `2a5ef36` 同样成立 |
| 本轮未提交的修复 | `src/index.ts`、`lib/index.js`、`scripts/verify-real-dsh.mjs`（见第 3、4 节）；**尚未提交**，故新候选 SHA 待定 |

## 2. 证据表（各层次不得互相替代）

| 层次 | 平台 / 工具链 | 结果 |
|---|---|---|
| Windows 本地 | Windows，Node v24.19.0，npm 12.0.2，git 2.53.0.windows.2 | 全部 PASS（见 2.1） |
| Linux 本地 | WSL2 Ubuntu 24.04.4 LTS x86_64，git 2.43.0，隔离 Node v20.20.2 / v22.23.3 | 修复后 build/check/test PASS；新修复提交后的产物门与完整矩阵待执行（见 2.2） |
| 真实 DSH 服务栈 | 隔离安装 `@deepseek-ai/dsh@0.2.0-rc.2`（Windows） | ALL CHECKS PASSED ×3（见 2.3） |
| 独立 DSH profile | 独立 `DSH_HOME` + `--from-default-profile headless` | 安装/加载/schema/禁用/重新启用 PASS（见 2.4） |
| GitHub Actions | `ubuntu-latest`，Node 20/22 | **未执行**（推送前无法触发；已有 History 属于旧提交） |
| 真实模型会话 | 运行中的 DSH 会话由模型调用工具 | **未执行**（见第 6 节与验收单） |

### 2.1 Windows 本地（修复后的工作区）

| 命令 | 退出码 / 结果 |
|---|---|
| `npm run build` | 0；`lib/index.js` `5A914E5E…F48CE`、`lib/index.d.ts` `9989F1E0…45A86` |
| `npm run check`（tsc --noEmit） | 0 |
| `node --check lib/index.js` | 0 |
| `npm test`（node --test） | 0；**26 通过 / 0 失败 / 0 cancelled** |
| `npm pack --dry-run` | 0；5 个文件（LICENSE、README、`lib/index.js`、`lib/index.d.ts`、package.json），package 15.3 kB / unpacked 43.7 kB |

### 2.2 Linux Node 20 / 22（隔离运行时，干净克隆）

运行时准备：官方 tarball 解压到 `~/dsh-node-runtimes/node-v20.20.2-linux-x64`、
`~/dsh-node-runtimes/node-v22.23.3-linux-x64`；**未使用系统 Node 18.19.1**，未改系统配置。
克隆来源：`git clone /mnt/c/.../dsh-git-plugin` → `git checkout --detach feba7b8`。

候选提交 `feba7b8` 上的原始结果：

| 步骤 | Node 20.20.2 (npm 10.8.2) | Node 22.23.3 (npm 10.9.9) |
|---|---|---|
| `npm ci` | exit 0 | exit 0 |
| `npm run build` | exit 0 | exit 0 |
| `git diff --exit-code lib` | exit 0 | exit 0 |
| `npm run check` | exit 0 | exit 0 |
| `node --check lib/index.js` | exit 0 | exit 0 |
| `npm test` | **exit 1：21 pass / 0 fail / 5 cancelled** | **exit 1：21 pass / 0 fail / 5 cancelled** |
| `npm pack --dry-run` | exit 0（5 文件，15.1 kB） | exit 0（5 文件，15.1 kB） |

失败形态：`test/smoke.test.js` 第 22–26 项（`timeoutMs` 三项、调用方取消、preCommit 目录）
报 `cancelledByParent` / `Promise resolution is still pending but the event loop has already resolved`。

修复（第 3 节）后同一两个运行时复验（把修复后的 `src/index.ts` 拷入克隆并重建）：

| 步骤 | Node 20.20.2 | Node 22.23.3 |
|---|---|---|
| `npm run build` | exit 0 | exit 0 |
| `npm run check` | exit 0 | exit 0 |
| `npm test` | **26 pass / 0 fail / 0 cancelled** | **26 pass / 0 fail / 0 cancelled** |

产物门说明：修复未提交，因此克隆里 `git diff --stat -- lib` 显示 `lib/index.js` 有 7 处差异
（`+7 -2`），这是预期；构建产物门对**提交**有效（`feba7b8` 上 exit 0），新候选提交后需重跑。

### 2.3 真实 DSH 服务栈（隔离安装）

安装：`npm install --prefix .tmp-dsh-verify/dsh --no-save @deepseek-ai/dsh@0.2.0-rc.2`（npm 12 拦截了
5 个 install scripts，见 5.3）。脚本本次打印了实际加载目标，确认插件侧与宿主侧同源：

```
loaded @deepseek-ai/cordis@4.0.4                 (...\.tmp-dsh-verify\dsh\node_modules\@deepseek-ai\cordis\lib\index.js)
loaded @deepseek-ai/dsh-commands@0.2.0-rc.2      (...\dsh\node_modules\@deepseek-ai\dsh-commands\lib\index.js)
loaded @deepseek-ai/dsh-system-prompt@0.2.0-rc.2 (...)
loaded @deepseek-ai/dsh-tools@0.2.0-rc.2         (...)
loaded @deepseek-ai/dsh-subprocess-local@0.2.0-rc.2 (...)
plugin under test: C:\...\dsh-git-plugin\lib\index.js
plugin side dsh-tools@0.2.0-rc.2 at C:\...\dsh-git-plugin\node_modules\@deepseek-ai\dsh-tools
host side   dsh-tools@0.2.0-rc.2 at C:\...\.tmp-dsh-verify\dsh\node_modules\@deepseek-ai\dsh-tools
```

`node scripts/verify-real-dsh.mjs --dsh-root .tmp-dsh-verify/dsh` → 连续 3 次 `ALL CHECKS PASSED`（每次 exit 0），
覆盖：导出/`fiber ACTIVE`/5 命令/4 工具/`tool:git` 段落/schema 进入组装、真实 Git 仓库中 5 个命令与 4 个工具执行、
`--output=` 选项注入被拒且不写文件、禁用后注册与提示词段落全部消失、重新启用无重复、`timeoutMs` 终止真实 preCommit。

### 2.4 独立 DSH profile

独立 `DSH_HOME=.tmp-dsh-home`，从 shipped `headless` 模板建 `gitcompat3`：

| 步骤 | 结果 |
|---|---|
| `--from-default-profile headless --dump-config` | exit 0，生成 `package.json` / `cordis.patch.yml` / `cordis.yml` / `pnpm-workspace.yaml` |
| `plugin --profile gitcompat3 add <仓库>` | exit 0，`+ dsh-git-plugin link:…`；预期警告「declares no dsh.bundle」 |
| patch `insert` 后 `--dump-config` | 该行存在，**无** `disabled: true` |
| `--dump-config-schema` | 该行 `status: "schema"`、`diagnostics: []`、`configRef: #/$defs/config66`；字段 `maxBytes/stderrMaxBytes/graceMs/timeoutMs/preCommit`，默认值 `1048576 / 65536 / 3000 / 30000 / []` |
| 用 `--patch` 叠加层置 `disabled: true` | 该行显示 `disabled: true` |
| 去掉叠加层 | 该行恢复启用 |

## 3. 本轮发现并修复的缺陷：截止时间定时器被 `unref`

- **现象**：Linux（Node 20/22）上 `npm test` 有 5 项被取消；Windows 上不出现。
- **根因**：`src/index.ts` 的 `runProcess` 截止时间定时器与 `terminateHandle` 宽限定时器都调用了
  `timer.unref?.()`。当被等待的 promise 只由该定时器推进、进程没有其它 ref 句柄时，事件循环在定时器到期前
  就耗尽，等待被取消 —— 在 Linux 上稳定复现，说明这不是测试写法问题，而是「截止时间可能被跳过」的真实缺陷。
- **修复**：移除两处 `unref`，并写明理由（截止时间是插件自己的义务；`release()` / `finally` 会在操作结束时清除定时器，
  因此不会延长进程寿命）。`lib/` 已重建。
- **复验**：Windows 26/26；Linux Node 20.20.2 与 22.23.3 各 26/26（0 cancelled）；
  真实 DSH 服务栈连续 3 次 `ALL CHECKS PASSED`；独立 profile 检查全部通过。

## 4. 验证脚本加固（`scripts/verify-real-dsh.mjs`）

按任务要求只做小修，未重写：

1. `--dsh-root` 缺值 → 打印用法并 exit 2（此前会把 `undefined` 交给 `path.resolve` 抛栈）。
2. 未知 `--` 选项 → 用法 + exit 2。
3. 打印实际加载的官方包版本与入口路径（宿主侧），用于核对插件侧/宿主侧同源。
4. 临时目录回收：`run()` 的临时目录与自建 Git 仓库统一登记，在**所有退出路径**（正常、失败、未捕获异常）
   通过 `process.on("exit")` 清理；对 Windows 上「被终止的子进程短暂锁住目录」做 5×100 ms 重试。
   复验：连续 3 次运行后 `%TEMP%/dsh-verify-*` 残留 **0**；异常路径（缺值/未知选项/无法解析 root）
   分别 exit 2，且不产生残留。

## 5. 未验证项（不以其他测试替代）

| 项 | 状态 / 原因 |
|---|---|
| GitHub Actions（Node 20/22） | **未执行**：候选未推送，无法触发；历史成功记录属于旧提交 |
| 真实模型会话中调用 4 个只读工具 / 运行斜杠命令 | **未执行**：见第 6 节；已给出可手动执行的验收单 |
| `dsh plugin add github:…` / npm 渠道安装 | **未执行**：远端仍是旧代码，npm 上仍是 0.1.0 |
| `0.2.x` 中除 `0.2.0-rc.2` 外的版本 | **未验证**（peer 允许范围 ≠ 实测范围） |
| Git < 2.24（无 `--end-of-options`） | 未验证 |
| DSH 0.1.x | 已从 peer 范围移除，不再宣称兼容 |
| 新候选提交后的干净检出产物门 | 待新提交存在后执行（本轮 `feba7b8` 上已 PASS） |

## 6. 真实模型会话：手动验收单（未验证）

AGENTS.md 要求使用**独立 `DSH_HOME`**、不修改日常 profile；独立 `DSH_HOME` 没有账号凭据，
因此本轮不执行模型会话，也**不索取、不输出任何凭据**。可手动执行：

```bash
# 0. 独立 home 与 profile（不触碰日常 profile）
export DSH_HOME=<独立目录>
dsh --profile gitcompat --from-default-profile headless --dump-config
dsh plugin --profile gitcompat add <本仓库路径>
# cordis.patch.yml 写入：- insert: [{ id: dsh-git-plugin, name: dsh-git-plugin }]

# 1. 在临时 Git 仓库中启动一次真实会话（需已登录的 DSH 环境）
cd <临时 git 仓库>
dsh --profile gitcompat headless "用 git-status、git-diff、git-log、git-show 依次查看本仓库状态、改动、最近 3 条历史与此前一次提交，并原样报告每个工具的返回要点；不要执行任何写操作。"
```

验收标准：4 个只读工具的调用与结果出现在会话记录中；模型报告的内容与
`git status --porcelain=v1 --branch`、`git diff`、`git log --oneline -3`、`git show HEAD` 一致；
会话结束后 `git status` 无新增改动（只读）。
斜杠命令可在交互式会话里手工执行 `/status`、`/diff`、`/branch <新分支>`、`/undo list`；
`/commit` 与 `/undo` 只允许作用于临时仓库。

## 7. 交接给包 02

1. **新候选提交**：`src/index.ts`（unref 修复）+ 重建的 `lib/index.js` + 加固后的
   `scripts/verify-real-dsh.mjs` 尚未提交，需要一个新的审阅提交；提交后重跑干净检出产物门
   （`git clone` → `checkout <新 SHA>` → `npm ci` → `npm run build` → `git diff --exit-code lib`）。
2. 发布流程沿用 `docs/maintenance-plan.md` §9：候选提交 → 干净检出产物门 → 最终发布提交（CHANGELOG 日期定稿）
   → PR 合并到 `main` → `npm publish --tag next`（唯一一次）→ 验证 → `npm dist-tag add … latest` →
   tag `v0.2.0` + GitHub Release，四者对应同一发布点。
3. 仍未关闭的发布前条件：GitHub Actions 实跑、真实模型会话、双渠道安装验证。

## 8. 独立交接复查

2026-10-01，Codex 审阅当前未提交修复，独立运行 Windows 的 npm run check、npm test（26 pass / 0 fail / 0 cancelled）、node --check scripts/verify-real-dsh.mjs、git diff --check，均 exit 0。--dsh-root 缺值与 --bogus 分别 exit 2。

Linux 矩阵、真实 DSH 服务栈三次通过与独立 profile 结果来自包 01 执行报告，本次未重复执行。已修正文档中“修复后产物门全绿”的提前宣称；新修复提交后的干净检出产物门仍待执行。
