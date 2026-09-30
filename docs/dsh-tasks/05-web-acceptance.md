# 包 05：真实 DSH Web 联调与验收

请执行此任务。先读 AGENTS.md、docs/dsh-tasks/README.md、docs/web-panel-plan.md 及包 03/04 交付。
对 feat/web-git-panel 当前完整提交做验收。GUI 写操作、发布和社区回复不在本包范围。

## 执行与修复

1. 在独立 DSH_HOME/profile、独立临时仓库与本机 Web 服务中加载插件；记录 DSH/Node/Git/浏览器/插件 SHA。不要操作日常会话或修改上游工作树。
2. 用真实 Git 命令作基准，逐项比较面板：干净仓库、新增/修改/删除、已暂存和未暂存同时存在、rename、冲突、未跟踪、空仓库、detached HEAD、中文/空格/换行文件名、二进制/超大文件。
3. 验证历史与提交详情来自 Git 对象；工作区 diff 与回合变更卡片分别正确。不把回合前已存在改动丢掉，不把未跟踪/二进制伪装成干净。
4. 验证未认证请求、越权 sessionId、任意 cwd、目录穿越、pathspec magic、option-shaped ref 被拒；固定读取策略不触发 external diff/textconv 或 Git 写操作。
5. 测慢请求与连续切换会话/文件：旧响应不得覆盖新视图。取消/超时真实终止进程，输出限制与截断提示正确。
6. 连续禁用/启用插件，检查 tab/slot/style/routes/监听器全部清理且无重复；验证 CLI/headless 仍可只用命令/工具。
7. 对最小必要修复做回归；运行 build/check/test、客户端 node --check、npm pack；提交后干净重建产物一致。Linux/Windows 检查分别记录，远端 CI 需对应本次 SHA。
8. 在独立 profile 中安装本地 tgz，验证打包后的 Host 与 UI；不能只用 link 安装证明发布包完整。
9. 更新 README、CHANGELOG Unreleased、AGENTS 与维护方案状态。GUI 是后续功能，不回填已发布 0.2.0 内容；下个版本号与发布由后续明确任务决定。

## 验收输出

形成逐项 PASS/FAIL/未执行表，附浏览器截图/实际输出和运行命令；不记录凭据或私人会话内容。
用户尚未实际使用完整流程时，不将其标为“暂定稳定”。
交付下一步可审阅 PR 内容、Issue #1 回复草稿和 GUI 写操作的待决问题；本包不发送回复、不合并、不发布。
P3 必须另评审面板按钮无 open turn 时的审批契约与可恢复性，不能把 Web 读取认证等同于写权限。
