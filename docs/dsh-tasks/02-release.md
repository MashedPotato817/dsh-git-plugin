# 包 02：完成 0.2.0 双渠道发布

请执行此任务。先读 AGENTS.md、docs/dsh-tasks/README.md、包 01 的验证结果，以及 docs/maintenance-plan.md 第 9 节。

## 前提

0.2.0 candidate 已存在，不重复提升版本、不重复创建候选提交。
发布前先确认包 01 的失败项已解决；真实模型会话若仍未验证，报告其影响并由维护者决定能否发布。
当前只授权过本地维护与候选 commit；本包不自动增加 push、PR/merge、tag、npm publish、推广 latest 或社区消息授权。已经获得的新授权直接使用，不重复询问。缺授权时先完成可审阅的准备，再明确列出待执行动作。

## 执行顺序

1. 重新核查工作树、远端 main、npm versions/dist-tags 与 GitHub tags/releases。版本若已发布，不再 publish 同一版本。确认 package.json、lock 顶层、packages[""].version 都为 0.2.0。
2. 审阅候选之后的全部变更；版本、源码、配置、测试、lib 和文档必须一致。对待发布提交做干净克隆的构建新鲜度门、类型、测试、打包清单和独立 profile 验证。未推送 SHA 使用本地克隆，不从远端检出不存在的提交。
3. 在准备实际发布时确定 CHANGELOG 日期，在 npm publish 之前进入最终发布提交，保留 Unreleased。只改日期；如源码/lib 也改动，重做产物门。commit 按当前明确授权执行。
4. 已授权后推送发布分支，开 PR 到 main，等待当前 PR 对应 SHA 的 Ubuntu Node 20/22 CI 完整成功，审阅后按授权正常合并保留历史。不要把旧 main 的 Actions 结果作为通过依据，不直接强推 main。
5. 确定 main 的实际发布点 SHA，并与最终候选树比对；如果 main 同期变动导致树不同，重新审查/验证合并后的完整发布树，不直接发布。合并可能改变 SHA，npm gitHead、tag、Release 均以实际发布点为准。
6. 在发布点的干净检出运行 npm ci/build/check/test、产物门、npm pack --dry-run。再次检查 lib 哈希和无敏感/临时文件。Release 文案来自已定稿 CHANGELOG，先准备给维护者审阅。
7. 授权发布后，同一版本仅运行一次 npm publish --tag next。查 npm view dsh-git-plugin@0.2.0 version gitHead dist.integrity 和 npm dist-tag ls，核对发布点。独立目录下载注册表 tarball，比对 lib 哈希；用独立 DSH profile 实装 0.2.0，验证加载及功能。
8. next 安装验证通过且授权推广后，npm dist-tag add dsh-git-plugin@0.2.0 latest；不要再次 publish。
9. 按授权创建并推送 v0.2.0 annotated tag，指向同一发布点；以该 tag 创建 GitHub Release。验证固定 tag 的 GitHub 安装渠道，并核对 tag commit、Release tag、npm gitHead、包内 lib。
10. 发布后更新文档中的已发布状态，后续文档提交不改变原 tag/发布点。npm 内容需修复时提升补丁版本。未经明确授权不回复 Issue #1。

## 交付

给出 PR/CI、npm、tag/Release、两个渠道安装证据和四者一致性结果；分清已执行与待授权。
当前候选允许版本仍是 >=0.2.0-rc.2 <0.3.0-0，实测仍仅写实际通过版本。
发布完成后把 Web 工作交给包 03，另开功能分支。
