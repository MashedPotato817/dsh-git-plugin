# 包 03：只读 Web Git 面板的 Host 与数据契约

请执行此任务。先读 AGENTS.md、docs/dsh-tasks/README.md、docs/web-panel-plan.md。默认包 02 完成后，从确认过的 main 建 feat/web-git-panel；不要把 GUI 合入 0.2.0 发布候选。

## 目标

实现状态、逐文件 staged/unstaged diff、历史、提交详情的 Host 数据与路由。
本包不实现前端，不增加 stage/commit/checkout/stash 等写路由，不发布、不回复社区。

## 先核实源码契约

只读参考桌面 GitHub/deepseek-harness 中的 session、connection、subprocess、client modules、workspace files、workspace changes 源码与 README，核对其版本。
方案中“结构化注入即可，不加 peer”和“纯读无需权限”的建议必须重新审查：以宿主准入、认证、会话可访问性和读权限的真实契约为准，禁止通过伪造类型绕过。
workspace-changes 是回合变更审阅，不能作为完整工作区/暂存/历史数据源。
porcelain v1 的 XY 状态本身不含相似度分数；按官方 Git 实际输出核对 rename/copy 的 -z 双路径顺序。

## 实现范围

1. 按需拆出 src 下的小模块和共享类型，复用现有仓库解析、ctx.subprocess、纯 argv、deadline、maxBytes；保持已有命令/工具行为。
2. 提供精确 /api/git-panel/status、diff、log、show 路由。服务端从可访问 sessionId 取得 cwd，再解析仓库；客户端不能提供任意 cwd/root、Git 参数数组或任意命令。确认身份认证之外还有会话访问范围检查。
3. 缺少 Web 服务时仍能在 CLI/headless 加载现有插件；用公开的可选注入/依赖机制，必要的依赖与 peer 明确声明并实测。
4. status 用 NUL 分隔解析，覆盖 staged/unstaged 同文件、rename/copy、冲突、untracked、中文/空格/换行文件名、空仓库、detached HEAD、子模块。
5. diff/log/show 固定 argv、限制条数与大小，ref/路径严格验证。路径作为字面路径处理并限制仓库边界，防止 pathspec magic/目录穿越/跨会话读取；防止 ref 被解释成选项。禁用外部 diff/textconv，不执行 shell。未跟踪文件、二进制、超大文件的行为在契约中明确，不能伪装为空 diff。
6. 返回可辨识的未授权、非仓库、缺 Git、超时、取消、截断、无 HEAD 等结果。取消与插件禁用时结束请求/进程，清理路由和注册；重启无重复。
7. 以临时真实 Git 仓库验证解析与行为，另测认证/会话隔离/argv 边界及可选服务缺失。只为实际行为与风险写测试，不镜像实现。

## 交付与验收

build/check/test、真实 Host 路由与 CLI/headless 回归通过。提交构建后的 lib；提交后干净检出重建应无 lib 差异。
输出路由/类型/错误契约和包 04 所需客户端接口，记录上游参考路径/版本。
若公开认证或注入契约不足，先明确证据与可行最小调整，不偷偷开放未认证路由。
本地 commit 已持续授权；验证通过后立即提交本包改动并报告 SHA。推送、合并等按各自授权执行。
