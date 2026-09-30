# 包 04：TSX 客户端与 DSH 模块构建

请执行此任务。先读 AGENTS.md、docs/dsh-tasks/README.md、docs/web-panel-plan.md 以及包 03 的数据契约。
沿用 feat/web-git-panel 与包 03 已验证提交，保留其他改动。

## 目标与范围

实现 DSH Web 右侧 Git tab：文件状态、staged/unstaged diff、历史与提交详情，严格只读。
不增加 GUI 写操作，不发布、不回复社区。包 03 的认证、会话边界不得在客户端绕过。

## 上游参考

只读参考桌面 GitHub/deepseek-harness 的 ui-sidebar-right、ui-slots、client-connection、
packages/client/tsdown.client.ts 和 apps/web/tests/fixtures/plugins/fixture-live-client。
核对目标 0.2.0-rc.2 的公开 require/服务名、tab 与 slot 注册、生命周期，以及模块加载格式。
不要直接复制依赖上游仓库 glob 的未发布打包预设。

## 实现步骤

1. 使用 src/client/index.tsx、独立 tsconfig.client.json 与小型 scripts/build-client.mjs；React/平台模块按真实宿主 external 契约处理。不要把第二份 React 打进包。
2. 从 TSX 生成 lib/client.js，符合 window.__ModuleLoader__.load 的 id/factory(require) 包装。不能手改产物。保持服务端 tsconfig 不错误编译客户端 JSX/DOM。
3. 同步 package.json 的 dsh.client、exports["./client"]、build:client 与总 build/prepack；lib/client.js 随 Git 和 npm 包交付。依赖用精确版本，检查 CLI/headless 安装/加载仍正常。
4. 按公开机制注册 sidebar.right.pane.tab 和 tab 定义。三个视图清楚显示仓库、分支、暂存/未暂存状态、diff 侧与提交身份；保持界面紧凑，适配 DSH 主题与窄侧栏。
5. 覆盖干净、非仓库、无 Git、空历史、加载、错误、截断、二进制、取消状态。显示 Host 返回的真实数据；文件路径与 diff 作为文本呈现，防止 HTML 注入。
6. 切换会话/仓库/文件时取消旧请求，避免慢响应覆盖新视图；可手动刷新，不依赖不存在的全局 Git 推送事件。
7. 插件禁用或卸载时清除 UI、style、tab、slot、监听器、请求；重新启用不重复注册。
8. CI 增加客户端 build/type/syntax 检查和构建产物门；npm pack 核对客户端文件。客户端构建连续两次应确定，无多余 sourcemap/绝对路径等无意产物。
9. 做与用户可见行为相关的组件测试；真实 Web 生命周期留包 05 联调，不能用 mock 测试宣称整个 Web 验收通过。

## 交付

给出修改文件、构建说明、实际 npm 清单、外部依赖契约、测试结果与未验证项。
需要变更包 03 契约时同步修改/复验，不在 UI 内静默兜底改变语义。
验证通过后立即执行已持续授权的本地 commit；提交后干净重建 lib 必须一致。推送等按各自授权处理。
