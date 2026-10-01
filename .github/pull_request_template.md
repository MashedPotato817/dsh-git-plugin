## Problem and behavior / 问题与改后行为

<!-- Explain the trigger and before/after behavior. / 说明触发场景与修改前后行为。 -->

## Reference and scope / 关联与范围

<!-- Refs #n; use Closes only when fully resolved. List files and compatibility impact. / 完整解决才使用 Closes，写明主要文件及兼容性影响。 -->

## Validation / 验证证据

<!-- Only report executed checks. Give SHA, OS, Node/Git/DSH versions; explain omissions. / 仅填写实际执行项，注明 SHA、环境及未执行原因。 -->

| Check / 检查 | Result / 结果与退出码 | Environment or omission / 环境或未执行原因 |
|---|---|---|
| Build / types / syntax | | |
| Unit / real Git | | |
| Clean post-commit artifact gate / 提交后干净产物门 | | |
| Pack file list / 打包内容 | | |
| DSH services / profile | | |
| Model / Web (if relevant) | | |
| CI for this PR SHA | | |

## Risks and unverified items / 风险与未验证项

<!-- Paths/argv, deadlines/cancellation, lifecycle, migration and declared vs tested range. Release PRs also list version/date/release-point/channel installs. / 参数目录、超时取消、启停、迁移和实测范围；发布 PR 另列版本日期、发布点及渠道安装证据。 -->

## Before submitting / 提交前确认

- [ ] Read CONTRIBUTING; focused scope, no unrelated changes. / 已读贡献指南，范围集中。
- [ ] Source, generated output, paired English/Chinese docs and regressions agree. / 源码、产物、英中文档与回归一致。
- [ ] No credentials, caches or independent test data in the commit. / 无凭据、缓存及独立测试数据。
- [ ] Declared support and tested versions are separate. / 声明范围与实测范围分列。
- [ ] Changes committed promptly; workspace and remaining work reported. / 已及时 commit 并说明工作区与待办。
