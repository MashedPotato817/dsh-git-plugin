# 包 01：关闭 0.2.0 发布前验证缺口

请执行此任务。先读本仓库 AGENTS.md 和 docs/dsh-tasks/README.md。

## 目标与范围

保留现有 TypeScript 适配与 0.2.0 候选，补齐 Linux Node 20/22 与真实 DSH 会话证据。
本包不实现 GUI，不修改版本，不推送、不发布、不回复社区；本地提交已持续授权，每个验证完成的阶段立即 commit，不等用户认可。
主仓库是 C:/Users/Mashed Potato/Desktop/npm/dsh-git-plugin；候选基线 feba7b8。若 HEAD 已前进，记录新的待测提交及原因。

## 执行步骤

1. 读 README、CI、test、scripts/verify-real-dsh.mjs、维护计划第 5/9 节。建立“Windows 本地 / Linux 本地 / GitHub CI / 服务栈 / profile / 模型会话”证据表，避免把它们互相替代。
2. Linux 使用独立干净克隆：从本地主仓库克隆未推送提交，明确 checkout 候选 SHA。WSL 现有 Node 18 不达要求，在隔离目录准备 Node 20 和 22 的 Linux 运行时，不覆盖用户全局 Node、不改系统配置。确认 node/npm/git 的实际路径和版本，不能用 Windows node.exe 冒充 Linux 测试。
3. 两个 Linux Node 版本分别跑 npm ci、npm run build、git diff --exit-code lib、npm run check、node --check lib/index.js、npm test、npm pack --dry-run。记录精确版本和退出码。网络/运行时无法准备时明确阻塞，不能退回 Node 18 后宣称达标。
4. 用精确 @deepseek-ai/dsh@0.2.0-rc.2 建独立安装，运行 node scripts/verify-real-dsh.mjs --dsh-root <安装目录>。打印实际加载的官方包版本和路径，确保插件侧与宿主侧加载目标一致。无需将这个大依赖验证加入日常 npm test/CI。
5. 检查验证脚本的 --dsh-root 缺值、异常退出和资源回收：任何新建临时仓库/上下文/子进程应在正常与失败退出时清理。确有缺陷才小修，并做针对性复验；不要重写整套脚本。
6. 独立 DSH_HOME/profile 完成安装、加载、schema、禁用、重新启用。随后在真正运行的 DSH 会话中让模型调用四个只读工具；斜杠命令实际运行，写命令只作用于临时 Git 仓库。记录实际调用证据，不把直接调用 tools.get().execute 当成模型会话。没有可用模型连接时交付可手动执行的验收单，标为未验证，不索取或输出凭据。
7. 必要时修复真实复现的问题；每次修改后跑与影响范围相符的回归。若源码/产物变动，需要新的审阅提交和提交后干净构建门。
8. 仅更新有新证据的 README 兼容表、AGENTS.md、维护计划及新增验证报告。远端 CI 在授权推送前仍是待验证。

## 完成标准

输出精确提交、平台、Node/Git/DSH 版本、检查结果；Linux 两个矩阵项与模型会话明确 PASS/FAIL/未执行。
不得用单元测试代替真实宿主或模型会话。保留尚未关闭的发布前条件，并给包 02 交接说明。
