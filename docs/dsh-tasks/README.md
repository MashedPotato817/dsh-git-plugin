# DSH 后续任务包

核查日期：2026-10-01。主仓库：`C:/Users/Mashed Potato/Desktop/npm/dsh-git-plugin`。
基线：`feat/release-0.2.0` @ `feba7b80b0942a7a5733511ac0b9cf918ef8d2a8`。
本目录是执行提示词与审查记录，不代表这些任务已经完成。

## 核查结果

| 原计划 | 当前结论 | 剩余事项 |
|---|---|---|
| 新版适配与 TypeScript 迁移 | 实现完成并已提交 | 仅声明实测 DSH 0.2.0-rc.2，不扩大版本范围 |
| 参数安全、超时、钩子目录、启停清理 | 修复完成；Windows 本地构建、类型检查、26 项测试通过 | Linux Node 20/22、当前候选的远端 CI、真实模型会话 |
| 双渠道发布 | 候选提交完成；CHANGELOG 日期仍是“待发布” | 最终发布提交、PR/合并、npm、tag/Release、双渠道安装 |
| 社区反馈 | Issue #1 开放，0 评论，0 PR | 只读 Web 面板；本轮没有回复社区 |
| Web 可视化 | 方案完成 | Host、TSX 客户端、小型构建配置、真实 Web 验收均未实现 |

线上核查：npm 插件只有 0.1.0，GitHub Release 只有 v0.1.0；远端 main 仍是 3bbb253。
DSH 主包 latest/next 都是 0.2.0-rc.2，commands/tools 子包 latest 仍旧，next 才是 0.2.0-rc.2。
已有 Actions 成功记录属于旧提交，不能算本轮候选通过。
本机 WSL Ubuntu 24.04 可启动，但 Node 18.19.1 低于插件要求，尚不能算 Linux 验证。

证据入口：[npm](https://www.npmjs.com/package/dsh-git-plugin)、[Release](https://github.com/MashedPotato817/dsh-git-plugin/releases)、[Issue #1](https://github.com/MashedPotato817/dsh-git-plugin/issues/1)、[DSH Releases](https://github.com/deepseek-ai/deepseek-harness/releases)。
这些在线状态可能变化，执行任务前重新核查。

## 按包执行

1. [01 验证补齐](01-validation.md)：关闭发布前验证缺口，必要时做小修。
2. [02 发布](02-release.md)：验证后执行已授权的发布动作；未授权动作列出待办。
3. [03 Web Host](03-web-host.md)：独立功能分支，完成只读接口与必要测试。
4. [04 Web UI](04-web-ui.md)：沿用 03 的分支与契约，完成 TSX 与客户端构建。
5. [05 Web 联调验收](05-web-acceptance.md)：真实 DSH Web 验证、修复、交付。

不要把五包一次性合并为一个大任务。每包通过后再给 DSH 下一包。
03–05 的功能不得混进 0.2.0 发布候选；默认在 02 完成后开始。
GUI 写操作留给下一阶段，另做审批与恢复方案。

## 所有任务共用约束

- 首先阅读仓库 AGENTS.md；运行 git status、git branch -vv、git remote -v、git log --oneline --graph --decorate -15。核对实际 checkout，保护其他任务的改动。
- 只读参考 `C:/Users/Mashed Potato/Desktop/github/deepseek-harness`。核对其 AGENTS.md、版本与提交；优先参考 0.2.0-rc.2 的源码及公开契约。不要改上游仓库。
- 源码用 TypeScript；客户端用 TSX。lib 是构建产物，随 Git 提交，禁止手改。
- 逐包核对 DSH 精确版本与 dist-tags；不要统一安装 @latest。允许范围与实测范围分开写。
- 测试使用独立 DSH_HOME、profile、临时 Git 仓库；不修改日常 profile，不消耗生产会话中的工作内容。
- 纯 argv、Host 认证/会话边界、超时/取消、字节上限与启停清理必须保持。
- 遵循现有授权范围；已授权动作直接执行，不重复询问。commit、push、PR/merge、tag、publish、社区消息的授权按 AGENTS.md 分别核对；给出提示词本身不新增线上发布或发消息授权。
- 不强推、不重置、不批量重构，不混入缓存、团队状态、凭据和独立测试目录。
- 中文交付：变更文件和原因、基线/最终 SHA、命令与退出码、实际通过项、未验证项、下一条 Git 命令。没有跑过的检查不得写 PASS。
