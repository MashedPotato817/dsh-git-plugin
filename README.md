# dsh-git-plugin

<p align="center">
  <img src="./assets/readme/hero.svg" width="100%" alt="Git 工作流进入 DeepSeek Harness 会话：查看改动、新建分支、提交和可恢复快照">
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/dsh-git-plugin"><img src="https://img.shields.io/npm/v/dsh-git-plugin?style=flat-square&amp;color=E76F51" alt="npm version"></a>
  <a href="https://github.com/MashedPotato817/dsh-git-plugin/actions/workflows/ci.yml"><img src="https://github.com/MashedPotato817/dsh-git-plugin/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI on main"></a>
  <a href="https://www.npmjs.com/package/dsh-git-plugin"><img src="https://img.shields.io/npm/dm/dsh-git-plugin?style=flat-square&amp;color=218C74" alt="npm downloads"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-218C74?style=flat-square" alt="MIT license"></a>
</p>

<p align="center">
  <a href="#安装">安装</a> · <a href="#使用">使用</a> · <a href="#文档与反馈">文档与反馈</a>
</p>

## 让 Git 工作流留在 DSH 会话里

查看改动、创建分支、提交前检查、保存可恢复快照。**5 个斜杠命令 + 4 个模型只读工具**，让你和模型看到同一份仓库状态。

- **看清改动** — 分支、工作区状态、已暂存 / 未暂存 diff 与提交历史。
- **顺手提交** — 创建分支，配置提交前检查，在会话中完成提交。
- **留一份快照** — 用 stash 暂存工作区，随时查看与恢复。

已发布 **[0.2.0](https://www.npmjs.com/package/dsh-git-plugin/v/0.2.0)**，实测宿主为 **DSH 0.2.0-rc.2**；需要 Node.js ≥20、Git ≥2.24。[完整兼容与验证记录](CONTRIBUTING.md#兼容性与验证记录)。

## 安装

在需要使用插件的 profile 中执行，将 `web` 替换为实际名称：

```bash
dsh plugin --profile web add dsh-git-plugin@0.2.0
```

**0.2.0 安装后需要手动启用。** 在 `<DSH_HOME>/profiles/web/cordis.patch.yml` 追加：

```yaml
- insert:
    - id: dsh-git-plugin
      name: dsh-git-plugin
```

重启对应 profile 的 DSH；使用 Web 时刷新页面。

也可通过 [GitHub 固定 tag 或源码安装](CONTRIBUTING.md#其他安装方式)。下一版本的自动启用正在准备中，迁移说明见[市场收录准备](docs/marketplace-submission.md)。

## 使用

```text
/status
/diff
/branch feat/my-change
/commit feat: 完成一项修改
```

| 命令 | 用途 |
|---|---|
| `/status` | 查看当前分支与工作区 |
| `/diff` | 查看已暂存、未暂存的改动 |
| `/branch [<name>]` | 查看分支，或新建并切换 |
| `/commit [<message>]` | 查看提交指引，或运行检查并提交 |
| `/undo [list\|pop]` | 创建、列出或恢复 stash 快照 |

模型可以使用 `git-status`、`git-diff`、`git-log`、`git-show` 四个只读工具。例如：

> 先查看 Git 状态、diff 和最近 5 条提交，说明哪些改动已暂存，并指出提交前需要检查的内容。

**提交范围：** `/commit <message>` 会暂存目标仓库的全部改动再提交；执行前确认范围。不带参数只显示指引与改动。

**快照含义：** `/undo` 保存工作区改动（含未跟踪文件），不是回退 commit；`pop` 恢复时可能遇到冲突。

需要提交前跑测试、调大超时？见[插件配置](CONTRIBUTING.md#插件配置)。

## 文档与反馈

- [贡献指南](CONTRIBUTING.md) · 配置、源码安装、开发与验证
- [CHANGELOG](CHANGELOG.md) · 版本变更
- [Issues](https://github.com/MashedPotato817/dsh-git-plugin/issues) · 缺陷与功能建议
- [市场收录准备](docs/marketplace-submission.md) · dsh-market 收录进展
- [Web 面板计划](docs/web-panel-plan.md) · 后续只读 Git 界面

当前提供命令与工具，Web Git 面板尚未实现，dsh-market 尚未收录。页面设计参考 [dsh-agent-teams](https://github.com/NanmiCoder/dsh-agent-teams)，横幅为原创 SVG。

## License

[MIT](LICENSE)
