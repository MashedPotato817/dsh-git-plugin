# dsh-market 收录准备

## 当前状态（2026-10-01）

- 目标市场：[dsh-market/dsh-market](https://github.com/dsh-market/dsh-market)。它使用 [awesome-dsh-plugin/awesome-dsh-plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin) 的目录，不是 DshMarketPlace 同名仓库。
- 实际公开目录：<https://awesome-dsh-plugin.com/plugins.json>；本轮查询 updated=2026-09-30，未发现 URL 精确匹配本仓库的条目。不要将相似的 `dsh-git-plugins` 当成本插件。
- 已具备：公开仓库、MIT 许可证、实际实现、GitHub `dsh-plugin` topic、npm 对应关键词、0.2.0 双渠道发布与安装证据。
- 发布的 `0.2.0` 不含 `dsh.bundle`，需要手动启用；目录的收录 CI 明确要求 bundle。
- 本分支补齐 `dsh.bundle.patch`、根 `cordis.patch.yml`、patch 导出、打包内容与市场展示图片声明，供下一版本使用；**尚未发布新 npm 版本，尚未提交社区收录 PR，尚未宣称已上架**。

## 收录条目

已经准备 [MashedPotato817__dsh-git-plugin.yml](marketplace/MashedPotato817__dsh-git-plugin.yml)：

```yaml
url: https://github.com/MashedPotato817/dsh-git-plugin
name: MashedPotato817/dsh-git-plugin
category: git
description:
  en: 'Git workflow for DeepSeek Harness with five slash commands, four read-only Git tools, pre-commit checks and recoverable stash snapshots.'
  zh: '为 DeepSeek Harness 提供五个 Git 斜杠命令、四个只读 Git 工具、提交前检查与可恢复的 stash 快照。'
```

按上游 [contributing.md](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/blob/main/contributing.md)，向其 `data/plugins/MashedPotato817__dsh-git-plugin.yml` 提交这一份 YAML 文件。分类选 `git`，不用修改上游生成的 README。收录仍需维护者审查；目录合并与站点同步后，再查询 plugins.json 并在市场中搜索仓库名、包名与 git 关键词。

## 市场详情页图片

根目录的 [screenshots.json](../screenshots.json) 指定现有的原创能力横幅：

```json
[
  "assets/readme/hero.svg"
]
```

上游按仓库默认分支解析相对路径，图片声明必须与真实文件一起推送。使用这一显式列表可控制详情页展示顺序，避免依赖 README 图片自动提取。当前图片是能力示意图，不是 DSH 界面截图，不宣称已有 Web Git 面板。该声明由目录从 GitHub 读取，无需加入 npm files；横幅本身仍随 npm 包分发，以供 README 使用。

上游允许 1–8 张图片，路径不能跳出插件目录；规则和解析器分别见 [contributing.md](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/blob/main/contributing.md#screenshots--截图optional-recommended--可选推荐) 与 [probe-screenshots.mjs](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/blob/main/scripts/probe-screenshots.mjs)。收录合并与下一次目录构建后才能核验线上显示。

## 自动安装契约

包元数据声明：

```json
"dsh": {
  "manifestVersion": 1,
  "bundle": { "patch": "./cordis.patch.yml" }
}
```

bundle patch 只插入本插件自己的行：

```yaml
- insert:
    - id: dsh-git-plugin
      name: dsh-git-plugin
```

安装新源码后，DSH plugin-manager 应将包名加入 profile 的 `dsh.profile.bundles`；compose 阶段读取这个 patch。根 patch 必须进入 npm files，且可通过 `dsh-git-plugin/cordis.patch.yml` 导出解析。没有新增运行时代码、浏览器 UI 或依赖；`lib/` 继续由 TypeScript 生成。

## 从手工启用的 0.2.0 迁移

1. 先备份该 profile 的 `package.json` 和 `cordis.patch.yml`，核对升级后包的 bundle 声明。
2. 旧的 `- insert: … id: dsh-git-plugin` 会与 bundle 提供的同名行重复；改为覆盖行 `- id: dsh-git-plugin`，把 config / disabled 保留在该行中。
3. 核对 profile 的 `dsh.profile.bundles` 恰好含一次包名；0.2.0-rc.2 的 reconcile 只自动添加新依赖，普通依赖升级为 bundle 时不能假设它自动补层。在该 profile 的 `package.json` 中将 `dsh-git-plugin` 加入现有 `dsh.profile.bundles` 列表，保留其他条目且不重复添加；这正是本轮独立迁移验证所用的方法。
4. 重启对应 profile，核对 dump-config 只有一个插件行、schema 无诊断，以及实际命令/工具行为。

不改日常 profile，不通过重复 insert 掩盖迁移问题。

## 本轮验证结果

使用桌面版提供的 DSH CLI `0.2.0-rc.2`，在临时独立 `DSH_HOME` 中以 headless 模板验证；未运行模型会话，未修改日常 profile。

| 检查 | 实际结果 |
|---|---|
| 修改前 / 修改后 `npm test` | 各 26 通过，0 失败、0 cancelled |
| `npm run build` / `npm run check` | exit 0；src/lib 与发布后的基线无差异 |
| `npm pack` 实物 | 7 文件：原有 5 文件 + bundle patch + README SVG；patch 与图片实际在 tarball 内 |
| 独立 profile 实装本地 tarball | exit 0；profile bundles 自动加入且只有一个包名；有效配置只有一个插件行 |
| `--dump-config-schema` | 本插件 status=schema，无 diagnostics，五字段默认值精确匹配 |
| 用户 config 覆盖与重复安装 | timeoutMs=90000 保留；再次安装后仍只有一个层和一个插件行 |
| 卸载 | 包依赖与 bundle 层被移除，dump-config 不再包含本插件行 |
| 旧 0.2.0 普通依赖升级 | 实测没有自动补 bundle 层；与宿主 reconcile 源码一致 |
| 旧 insert 与新 bundle 同时保留 | dump-config 有两行；不能因为命令 exit 0 就当作迁移成功 |
| 迁移为 id 覆盖 | dump-config 只剩一行，timeoutMs=120000 保留，schema 可解析 |
| 横幅与文档 | SVG 实际渲染检查、XML / YAML 解析、相对链接与标题锚点核对通过；screenshots.json 指向现有 SVG |

临时 tarball 沿用工作树中的 0.2.0 版本号，只用于本地验证；与注册表已发布的 0.2.0 内容不同，不能拿它重发同一版本。真正发布时提升版本并同步 lock 与 CHANGELOG。收录必需的 bundle 声明仍需进入公开默认分支。npm 发布不是上游收录硬条件；本插件已有 npm 0.2.0，市场优先使用经过仓库关联核验的 npm 包时，应先发布带 bundle 的新版本，避免用户得到仍需手动启用的旧包。当前尚未执行市场 UI 搜索与一键安装。

## 执行安排

| 工作 | 负责人 | 验收 |
|---|---|---|
| README、bundle、展示图片与发布包准备 | 本仓库维护者 / coding agent | 独立 profile 自动注册、配置覆盖、卸载清理、打包文件完整 |
| 进入本仓库默认分支 | 本仓库维护者 | PR 审查与当前 SHA CI 通过；原 v0.2.0 tag 不移动 |
| 下个 npm 版本（保证现有 npm 优先渠道自动启用） | 本仓库维护者 | 提升补丁版本，版本/lock/CHANGELOG 一致，发布后实装验证；不是目录收录硬条件 |
| 社区目录 PR | 本仓库维护者发起，上游维护者审查 | 仅新增本插件的 YAML；默认分支 bundle 已可读取 |
| 市场可发现性验收 | 本仓库维护者 | plugins.json 出现本仓库，市场搜索能找到，确认实际 install spec |

新版本发布与向社区提交 PR 使用各自明确授权。本轮的本地开发与收录材料不能替代“已经在市场可搜到”的证据。GitHub README 可随源码 PR 更新，npm 已发布版本里的 README 不会因此被覆盖。
