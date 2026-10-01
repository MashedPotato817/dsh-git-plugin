# 0.2.0 发布记录（2026-10-01）

## 发布点与合并

- PR：[#2](https://github.com/MashedPotato817/dsh-git-plugin/pull/2)，已使用 merge commit 合并，保留功能分支历史。
- 最终版本提交：`a32531437956ac01060ca7c99474555ef9545e6f`；CHANGELOG 日期已在发布前定为 2026-10-01。
- 统一发布点：`c83f3322950b0892022d6b3efd1e4f6edbed5be8`，两个 parent 为 `3bbb2534bd1d9ab4dcd46faf0ef4f0182797dfbd` 和上述最终提交；两者发布树相同。
- 远端 annotated tag `v0.2.0` 已指向发布点；GitHub Release 已创建草稿，尚未公开。
- npm：仍只有 0.1.0。官方 CLI 重新登录成功，`npm whoami` 为 mashedpotato，但 publish 返回 E403，要求 2FA；只查询的账号状态为 `tfa=false`。等待维护者在 npm 官方页面开启认证，不收集密码、OTP、token 或恢复码。尚无成功的 0.2.0 发布，未推广 latest。

## 当前提交的证据

| 验证 | 结果 |
|---|---|
| [PR CI](https://github.com/MashedPotato817/dsh-git-plugin/actions/runs/36818004042) | Ubuntu Node 20/22 均成功 |
| [main 发布点 CI](https://github.com/MashedPotato817/dsh-git-plugin/actions/runs/36818107888) | Ubuntu Node 20/22 均成功，head SHA 为发布点 |
| 发布点的独立干净克隆（Windows Node 24.19.0） | npm ci/build/check、语法检查、26 项测试、重建后 git diff --exit-code lib、打包预检全部 exit 0 |
| 官方 DSH 0.2.0-rc.2 服务栈 | 28 项通过，包括真实 Git、命令/工具、启停清理与真实 preCommit 超时 |
| 独立 DSH profile：本地 link | 安装、启用、schema 无诊断、五字段默认值匹配 |
| 独立 DSH profile：github:MashedPotato817/dsh-git-plugin#v0.2.0 | 实装、启用、schema 无诊断；实装 lib 哈希与发布点一致 |
| GitHub 实装入口 + 官方 DSH peer 的服务栈 | 28 项通过；没有修改实装源码 |

GitHub 实装包由 DSH 加载器提供 SDK peer，直接以普通 Node 脱离宿主加载曾报缺少 `@deepseek-ai/dsh-tools`。服务栈复验通过临时 Node resolve hook，仅将该 peer 绑定至独立安装的官方 0.2.0-rc.2 入口；未更改发布包、源码或日常 profile。此项不能宣称为无宿主的独立 Node 使用支持。

## 构建产物

| 文件 | 发布点与 GitHub 实装的 SHA-256 |
|---|---|
| lib/index.js | `5A914E5E23F570881E647658DA3DCC54005D5C828E72EDF006153A164EDF48CE` |
| lib/index.d.ts | `9989F1E02FDCE6274A0A0994094B2E7A56D8AA86636AC82A3B01833163445A86` |

打包预检仅包含 LICENSE、README.md、lib/index.d.ts、lib/index.js、package.json，共 5 文件。npm 注册表的实际 tarball 与 gitHead 尚待成功发布后比对，不把预检作为注册表验证。

## 剩余步骤与边界

1. 完成 npm 官方 2FA 后，从发布点的干净检出发布到 next；执行前再查询版本，避免重复发布已存在版本。
2. 核对注册表 gitHead、下载 tarball 并比对产物，在独立 profile 实装 npm 0.2.0 并复验官方服务栈。
3. 安装验证通过后仅用 dist-tag 推广 latest，公开同 tag 的 GitHub Release，补齐四者一致性结果。
4. 更新本报告与维护状态并及时单独 commit，后续文档提交不移动 v0.2.0。

用户已授权本次发布与保留历史的合并；真实模型会话、Linux 完整 DSH 服务栈、其他 DSH 版本仍未验证，发布说明保留限制。Node 20 的开发 peer 链 undici engine 警告见 [原验证报告](validation-report-0.2.0.md)。Web 面板仅有方案；社区消息尚未发送。
