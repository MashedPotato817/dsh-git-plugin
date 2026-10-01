# 0.2.1 发布记录

日期：2026-10-01（Asia/Shanghai）。本报告仅记录实际完成的操作；待执行事项分别标注。

## 范围与当前状态

- README 精简为产品首页，原创横幅、徽章与快速上手；工程说明迁移至 CONTRIBUTING.md，代理约束保留 AGENTS.md。
- 新增 bundle manifest、根 cordis.patch.yml 及导出，随包分发；新安装可自动注册。旧 profile 需迁移，不能同时保留旧 insert 与新 bundle。
- 市场收录 YAML 与 screenshots.json 已准备，图片是能力示意图。尚未提交目录 PR，尚未收录。
- 本次未修改 src/index.ts / lib 运行逻辑、依赖版本或兼容范围；实测宿主仍仅 DSH 0.2.0-rc.2。
- 用户已明确授权上线：推送、PR 保留历史合并、0.2.1 双渠道发布、市场收录申请；本地 commit 持续授权。
- 候选、当前 SHA CI、最终发布点、npm 与 tag/Release 一致性、双渠道实装：待本次执行后记录。

## 验证

候选工作树（Windows Node 24.19.0）：npm ci/build/check、node --check、26 项回归全部通过（0 failed / cancelled）；实物 npm pack 含 7 文件，bundle patch 与横幅在包内，版本/lock 三处均为 0.2.1。src/lib 与 0.2.0 发布后基线无差异。

桌面 DSH CLI 0.2.0-rc.2、独立 DSH_HOME/headless profile：本地候选 tarball 新装自动加入 bundle 一次，配置恰有一个启用行；schema 无 diagnostics，五字段默认值匹配。覆盖 timeoutMs=90000 后重复安装仍仅一行且配置保留。卸载移除依赖、bundle 和插件行；用户自定义 id 覆盖会保留并提示找不到条目，清理测试覆盖行后可恢复空 patch，不能误称宿主会删除用户配置。

独立安装官方 DSH 0.2.0-rc.2：scripts/verify-real-dsh.mjs 实际 28 项 PASS、ALL CHECKS PASSED（exit 0），覆盖命令、工具、提示词、参数边界、启停清理与真实钩子超时。

候选 SHA 的独立干净检出、当前 CI 与发布渠道验证尚待执行。

## 未验证边界

真实模型会话、Linux 完整 DSH 宿主及其他 DSH 版本未验证；Web Git 面板尚未实现。市场 PR 的提交/CI/合并/目录同步是不同状态，不互相替代。
