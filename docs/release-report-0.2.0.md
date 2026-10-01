# 0.2.0 发布记录（2026-10-01）

## 发布点与合并

- PR：[#2](https://github.com/MashedPotato817/dsh-git-plugin/pull/2)，已使用 merge commit 合并，保留功能分支历史。
- 最终版本提交：`a32531437956ac01060ca7c99474555ef9545e6f`；CHANGELOG 日期已在发布前定为 2026-10-01。
- 统一发布点：`c83f3322950b0892022d6b3efd1e4f6edbed5be8`，两个 parent 为 `3bbb2534bd1d9ab4dcd46faf0ef4f0182797dfbd` 和上述最终提交；两者发布树相同。
- 远端 annotated tag `v0.2.0` 已指向发布点；[GitHub Release](https://github.com/MashedPotato817/dsh-git-plugin/releases/tag/v0.2.0) 已于 2026-10-01T05:31:43Z 公开。
- [npm 0.2.0](https://www.npmjs.com/package/dsh-git-plugin/v/0.2.0) 已于 2026-10-01T05:28:14.177Z 成功发布到 next，gitHead 为上述发布点。此前认证请求失败，未产生版本；维护者开启 2FA 并完成官方浏览器挑战后只成功发布一次。没有收集密码、OTP、token 或恢复码。
- dist-tags：latest=0.2.0，next=0.2.0（认证后查询确认）。推广通过 dist-tag 完成，不再 publish。

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
| 独立 DSH profile：npm dsh-git-plugin@0.2.0 | 实装、启用、schema 无诊断，五字段默认值匹配；官方 peer 下 28 项服务栈检查通过 |

两个渠道实装包由 DSH 加载器提供 SDK peer，直接以普通 Node 脱离宿主加载曾报缺少 `@deepseek-ai/dsh-tools`。服务栈复验通过临时 Node resolve hook，仅将该 peer 绑定至独立安装的官方 0.2.0-rc.2 入口；未更改发布包、源码或日常 profile。此项不能宣称为无宿主的独立 Node 使用支持。

## 构建产物

| 文件 | 发布点与 GitHub 实装的 SHA-256 |
|---|---|
| lib/index.js | `5A914E5E23F570881E647658DA3DCC54005D5C828E72EDF006153A164EDF48CE` |
| lib/index.d.ts | `9989F1E02FDCE6274A0A0994094B2E7A56D8AA86636AC82A3B01833163445A86` |

独立下载的注册表 tarball 仅包含 LICENSE、README.md、lib/index.d.ts、lib/index.js、package.json，共 5 文件，15,600 bytes。上述两个文件在发布点、注册表 tarball、npm 实装包、GitHub 实装包中的 SHA-256 全部相同。

- tarball SHA-1：`067440df0041aeacfcee986338cad9c26063611c`
- registry integrity：`sha512-kvvLGnh72MSXIo0cg9JhV/ADLszS0moncz3wIfBFffgu6WBPMlWMglSFGBl9hyRIpIEWEGFm2Zxi0bRJoAxgwg==`
- 一致性：npm gitHead == 远端 annotated tag 的 commit == Release tag 的 commit == 发布点；包内 lib 与该树相同。

## 收尾与边界

维护状态与发布报告通过单独的文档分支/PR 更新并及时 commit，不移动 v0.2.0。本轮独立发布克隆、DSH 运行时、测试 profile、注册表 tarball 与临时验证文件已清理；日常 DSH profile 未修改。

包 01 的适配与本地/Linux/CI 验证已完成；包 02 的 npm、GitHub 与双渠道安装已完成。后续工作交给 [包 03：只读 Web Host](dsh-tasks/03-web-host.md)，在独立功能分支实施，再执行包 04 TSX UI 与包 05 真实 Web 验收。

用户已授权本次发布与保留历史的合并；真实模型会话、Linux 完整 DSH 服务栈、其他 DSH 版本仍未验证，发布说明保留限制。Node 20 的开发 peer 链 undici engine 警告见 [原验证报告](validation-report-0.2.0.md)。Web 面板仅有方案；社区消息尚未发送。
