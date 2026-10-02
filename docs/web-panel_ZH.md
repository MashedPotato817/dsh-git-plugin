# DSH Web Git 面板

[English](web-panel.md) · 简体中文

**0.4.0** 完成 [Issue #1](https://github.com/MashedPotato817/dsh-git-plugin/issues/1) 的 Git 操作面板。界面使用中文，重要文档英中双语。

## 安装并打开

```bash
dsh plugin --profile web add dsh-git-plugin@0.4.0
```

将 `web` 替换为你的 profile。重启 DSH 并刷新浏览器。选择仓库工作区／会话，展开右侧栏，点击 **Git**。旧版手工插入的 0.2.0 配置先按[迁移说明](marketplace-submission.md#从手工启用的-020-迁移)处理，避免重复注册。

## 日常流程

1. 查看冲突、已暂存、未暂存和未跟踪文件。同一文件两侧都有改动时出现两行，各自打开对应 diff。历史和提交详情来自真实 Git 对象。
2. 点击文件后使用单文件操作，或批量暂存／取消暂存。核对操作、路径及差异后点 **确认执行**；取消不写入。
3. 输入提交说明并预览。**Web 只提交现有暂存区。** 配置的 preCommit 与 Git 原生钩子仍执行；配置钩子改变预览快照后须重新预览。原有 `/commit <message>` 仍会暂存全部改动后提交。
4. 展开 **分支与 stash**，创建／切换本地分支，保存／应用／删除 stash。切换要求干净工作区；保存包含未跟踪文件，应用恢复暂存状态并保留原 stash，冲突时也保留。删除需要明确确认。
5. **备份并还原此文件** 先将所有已跟踪改动存入保留的 stash，再把选定工作区文件还原为暂存区内容。暂存区及未跟踪文件保留；需要恢复时应用备份，冲突自行处理。

确认两分钟失效、只能使用一次。会话／仓库、HEAD／分支、引用、暂存区、工作区或相关未跟踪内容变化后须重新预览。错误后先检查当前 Git 状态，不假设失败或取消意味着回滚。外部编辑器／Git 进程可能并发修改；原生钩子是受信仓库代码。子模块内部改动须进入其仓库处理。不提供远端推拉或强制改写历史。

## 宿主与客户端契约

全部接口通过官方 Connection 认证载体。宿主从已有活动／持久化 Session 推导规范化仓库，复用唯一子仓库发现。拒绝任意 cwd/root/argv、未知会话、越界／.git 路径、选项注入及不安全的未跟踪符号链接。

| 接口 | 请求 | 结果 |
|---|---|---|
| status | GET sessionId | 分支／目录／HEAD／文件状态 |
| diff | GET sessionId/path/side | 受限的暂存／工作区或未跟踪预览 |
| log / show | GET sessionId/count/skip 或完整 SHA | 历史／提交详情 |
| operations | GET sessionId | 本地分支与 stash |
| prepare | POST 固定操作字段 | 预览及短期凭证，不写入 |
| execute | POST sessionId/token/confirm:true | 执行一次已确认操作 |

POST 需要 JSON 和与受信 Host authority 匹配的浏览器 Origin；HTTP bridge 的 dsh.internal 内部 URL 不代表浏览器地址。DSH 0.2.0-rc.2 认证单一操作用户，并非租户级 Session ACL。GUI 人工确认与模型审批分开，不伪造 agent turn；模型工具仍只读。

Git 通过 ctx.subprocess、纯 argv、输出上限及每次调用截止执行；禁用外部 diff/textconv。每仓库写锁防止面板操作相互并发。停用时移除接口／tab／slot／样式，清除凭证并中止请求与进程；导航不显示过期响应。请求尊重 base URL，但反向代理挂载前缀仍须真实部署验收。

未跟踪 stash 预览要求 Git >=2.32（[官方文档](https://git-scm.com/docs/git-stash/2.32.0)）；实际验证版本与最低要求分开记录。

## 开发与验收

使用独立 DSH_HOME／profile 和临时仓库，不在日常配置上验收。

```bash
npm ci
npm run build
npm run check
npm test
npm pack
```

用 `dsh --profile git-panel-test --from-default-profile web --dump-config` 建立 Web profile；`dsh plugin --profile git-panel-test add <绝对 tarball 路径>` 安装；从临时仓库运行 `dsh --profile git-panel-test --no-open --port 17834`。

[读取验收](../scripts/verify-web-panel.mjs)和[操作验收](../scripts/verify-web-actions.mjs)不进入 CI/npm test。后者文件顶部列出 actions-repo 临时夹具和参数，通过真实浏览器确认流程操作，并独立核对 Git 结果。不调用模型、不导出浏览器存储；启动认证日志须保密。每个开发 SHA 使用不同 tarball 文件名：pnpm 可能缓存同一路径，必须比较实际安装哈希并重启。

发布证据：[0.3.0](release-report-0.3.0.md)、[0.4.0](release-report-0.4.0.md)。真实模型会话及其他 DSH 版本仍未验证。
