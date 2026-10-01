# 0.2.1 发布记录

日期：2026-10-01（Asia/Shanghai）。报告区分实际发布、标签推广、GitHub Release 与目录审查，不互相替代。

## 当前状态

- [PR #4](https://github.com/MashedPotato817/dsh-git-plugin/pull/4) 已以 merge commit 合并，保留历史。
- 最终版本提交：aea3815e32cf9036df05a2c6c0c270960d716048；CHANGELOG 日期在 publish 前定稿。
- 统一发布点：084a767aa3055d5cb0e06ddf4fb42dda4156458c；parents 为 eaadaf755a7513f2e56b129c3c45223734a609d6 与上述最终提交，两者发布树完全一致。
- npm 0.2.1 已成功发布到 next，注册表 gitHead 对应发布点；只成功 publish 一次。首次无交互请求需要 EOTP，一次浏览器会话返回 404 未创建版本，后续官方挑战通过并成功发布。
- latest 推广正在等待官方认证；不会再次 publish。
- annotated tag v0.2.1 已推送且指向发布点；GitHub Release 草稿已创建，待推广后公开。
- GitHub 默认分支的 README、SVG、screenshots.json、manifest 和 patch 与本地发布点逐字节一致；搜索 topics 为 deepseek/deepseek-harness/dsh/dsh-plugin/git/git-plugin，简介与 npm 入口已核对。
- [市场 PR #6296](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/pull/6296) 已提交为草稿，仅新增 data/plugins/MashedPotato817__dsh-git-plugin.yml；上游 CI 尚在运行，尚未收录。发布/推广验证完成后转为可审查。

## 已执行的验证

| 检查 | 结果 |
|---|---|
| Windows Node 24.19.0 候选 | npm ci/build/check、语法、26 项测试通过，0 failed / cancelled |
| 候选 dd06ec0 的独立干净克隆 | ci/build 后 git diff --exit-code lib、类型、语法、26 项测试全部 exit 0 |
| [PR SHA CI](https://github.com/MashedPotato817/dsh-git-plugin/actions/runs/36828223058) | Ubuntu Node 20/22 均通过，head aea3815 |
| [main 发布点 CI](https://github.com/MashedPotato817/dsh-git-plugin/actions/runs/36828379872) | Ubuntu Node 20/22 均通过，head 084a767 |
| 官方 DSH 0.2.0-rc.2 服务栈 | 候选 28 项 PASS，覆盖命令、工具、提示词、启停清理与真实 preCommit 超时 |
| 候选 bundle 生命周期 | 独立 profile 新装自动注册一次；schema 五字段默认值匹配；timeoutMs=90000 重装保留；卸载移除依赖/bundle/插件行 |
| npm dsh-git-plugin@0.2.1 实装 | 独立 profile 自动注册一次，启用行唯一，schema 无诊断；实际安装入口在官方 peer 下 28 项 PASS |
| github:MashedPotato817/dsh-git-plugin#v0.2.1 实装 | 同上，实际安装入口在官方 peer 下 28 项 PASS |
| 注册表 tarball | 7 文件，所有文件逐字节与发布点一致；npm/GitHub 实装 lib、patch、hero 哈希一致 |

服务栈验证的临时副本只改变被测入口路径，指向实际安装的 lib/index.js；临时 Node resolve hook 将 SDK peer dsh-tools 绑定至独立官方宿主入口，没有修改实际安装包。此结果不能作为无宿主独立 Node 支持或真实模型会话证据。

卸载后 DSH 保留用户的 id/config 覆盖，并可能提示目标条目不存在；清理该自定义覆盖行后恢复空 patch。不能宣称宿主自动删除用户配置。

## 产物一致性

注册表 tarball：f5a55b4bc806c411049fbf7fb743d4cde48df69a（SHA-1），38,665 bytes unpacked、7 文件：LICENSE、README.md、assets/readme/hero.svg、cordis.patch.yml、lib/index.js、lib/index.d.ts、package.json。

| 文件 | SHA-256（发布点 / 注册表 / npm 与 GitHub 实装一致） |
|---|---|
| lib/index.js | `5a914e5e23f570881e647658da3dcc54005d5c828e72edf006153a164edf48ce` |
| lib/index.d.ts | `9989f1e02fdce6274a0a0994094b2e7a56d8aa86636ac82a3b01833163445a86` |
| cordis.patch.yml | `5e87b7a971fb0c5b5944dff6f1f96eb27340aeb61d0743a821707c70d5e9fc2c` |
| assets/readme/hero.svg | `562b4ea41fbfc24192e4171d51e9de41c7c485283a4bfacfd7c6d013e20caeff` |

## 边界与收尾

真实模型会话、Linux 完整 DSH 宿主及其他 DSH 版本未验证；Web Git 面板尚未实现。目录 PR 提交、CI、审查合并与市场目录同步是不同状态，不把申请写成已上架。没有收集密码、OTP 或恢复码；没有修改日常 DSH profile。

独立官方宿主、候选/渠道 profile、tarball、临时验证器与目录 fork 克隆待线上步骤结束后清理。最终 evidence 单独通过文档 PR 提交，不移动 v0.2.1 或覆盖 npm 包。
