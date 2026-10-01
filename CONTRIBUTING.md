# Contributing

English · [简体中文](CONTRIBUTING_ZH.md)

Bug reports, compatibility evidence, documentation, and focused implementations are welcome. Discuss in English or Chinese; provide reproducible facts and respect other contributors.

[Configuration](#configuration) · [Installation](#other-installation-methods) · [Compatibility](#compatibility-and-validation)

## Where to start

- Use the [bug](https://github.com/MashedPotato817/dsh-git-plugin/issues/new?template=bug_report.yml), [feature](https://github.com/MashedPotato817/dsh-git-plugin/issues/new?template=feature_request.yml), or [compatibility](https://github.com/MashedPotato817/dsh-git-plugin/issues/new?template=compatibility_report.yml) form.
- Search existing [issues](https://github.com/MashedPotato817/dsh-git-plugin/issues) and [PRs](https://github.com/MashedPotato817/dsh-git-plugin/pulls); add evidence to an existing discussion when appropriate.
- Define the scenario, scope, and acceptance criteria before a large feature. Split it into reviewable stages; use Draft PRs for unfinished work.
- Read the [README](README.md), [maintenance instructions](AGENTS.md), and [release plan](docs/maintenance-plan.md). An allowed version range is not a verified matrix.
- GitHub forms work after they reach the default branch. Templates do not configure branch protection or create labels.

## Other installation methods

### Fixed GitHub tag

```bash
dsh plugin --profile web add github:MashedPotato817/dsh-git-plugin#v0.2.1
```

npm 0.2.1 and this tag contain compiled outputs and the bundle patch. They need no installation-time build. New installations register automatically; restart the profile. Migrate older manual 0.2.0 inserts instead of keeping duplicate rows.

### Source installation

```bash
git clone https://github.com/MashedPotato817/dsh-git-plugin.git
cd dsh-git-plugin
npm ci
npm run build
dsh plugin --profile web add .
```

Check your checkout first: v0.2.0 requires a manual insert; v0.2.1 declares a bundle patch. A bundle supplies the row; user configuration overrides it by id. Upgrading an existing ordinary dependency does not automatically add the bundle layer in DSH 0.2.0-rc.2. See [migration evidence](docs/marketplace-submission.md).

Rebuild after editing source, then restart that profile. The Web panel exists only on the development branch until a new release; neither published 0.2.1 channel contains it.

## Configuration

| Field | Default | Meaning |
|---|---|---|
| `maxBytes` | `1048576` | stdout byte cap per Git call |
| `stderrMaxBytes` | `65536` | stderr byte cap |
| `timeoutMs` | `30000` | Per-command, tool, or preCommit deadline in ms |
| `graceMs` | `3000` | Process termination grace period in ms |
| `preCommit` | `[]` | One argv command; failure or timeout aborts the commit |

A manually enabled 0.2.0 profile can configure a slower check on its insert:

```yaml
- insert:
    - id: dsh-git-plugin
      name: dsh-git-plugin
      config:
        preCommit: [npm, test]
        timeoutMs: 300000
```

For a 0.2.1 bundle, override the existing row instead:

```yaml
- id: dsh-git-plugin
  config:
    preCommit: [npm, test]
    timeoutMs: 300000
```

`preCommit` is an argv array, not a shell script. It runs in the same repository directory as `git add` and `git commit`.

## How it works

| DSH capability | Usage |
|---|---|
| `ctx.commands` | Five human-facing slash commands |
| `ctx.tools` | Four read-only Git tools |
| `ctx.systemPrompt` | Git tool and commit guidance |
| `ctx.subprocess` | Plain argv, output caps, cancellation and deadlines |
| Optional Web services | Authenticated routes and Session-derived repository reads |

Commands resolve the repository from the session cwd, including exactly one immediate child repository. Tools return text. Disabling removes commands, tools and prompt registrations; the development panel also removes routes, tabs, slots, styles and pending requests.

| Tool | Arguments and behavior |
|---|---|
| `git-status` | Branch and working-tree status |
| `git-diff` | Unstaged by default; `staged=true` reads staged diff |
| `git-log` | `count` recent entries; optional `path` filter |
| `git-show` | Commit message, author and diff; `ref` defaults to `HEAD` |

## Compatibility and validation

| Component | Declared range | Actual verification |
|---|---|---|
| DSH | `>=0.2.0-rc.2 <0.3.0-0` | Only `0.2.0-rc.2` |
| Node.js | `>=20` | Windows 24.19.0; historical Linux 20.20.2 / 22.23.3 matrix |
| Git | `>=2.24`, including `--end-of-options` | Windows 2.53.0.windows.2; historical Linux 2.43.0 |

Release evidence: [0.2.0](docs/release-report-0.2.0.md), [0.2.1](docs/release-report-0.2.1.md), and [original validation](docs/validation-report-0.2.0.md). Development panel evidence: [Web validation](docs/web-panel-validation.md).

- DSH 0.1.x and `0.2.0-rc.1` are unsupported. Other versions within the declaration must still be verified. Plugin 0.1.0 is not compatible with DSH 0.2.0-rc.2.
- This is a DSH-hosted plugin, not a standalone Node CLI. Ordinary Node loading needs the SDK peers supplied separately.
- Repository discovery checks the session cwd and immediate children. Multiple candidates require choosing a session cwd inside the desired repository.
- Slow preCommit checks need an explicit higher `timeoutMs`.
- Node-only Linux tests or CI do not prove the complete Linux DSH runtime works. Upstream development peer engine warnings are recorded in the original validation report.
- Real model sessions, other DSH versions and the complete Linux Web host remain unverified. Published 0.2.1 contains commands and tools; the read-only panel is unreleased.

## Development setup

Read [AGENTS.md](AGENTS.md), then verify the actual checkout:

```bash
git status
git branch -vv
git remote -v
git log --oneline --graph --decorate -15
```

External contributors should fork first, then verify that `origin` is their fork and `upstream` is this repository. Start a feature branch from a confirmed baseline:

```bash
git switch -c feat/your-feature main
npm ci
git config core.hooksPath .githooks
```

The hook setting is repository-local. Do not install every DSH package with `@latest`; check exact versions, peers and dist-tags. Read the matching upstream source and plugin examples. Local reference paths in AGENTS.md are maintainer-specific.

## Changes and commits

- Host source is in `src/`; TSX client source is in `src/client/`. Keep strict typing, ESM, existing public behavior and migration guidance.
- Generate `lib/` with `npm run build`; commit it together with source. Never hand-edit compiled files.
- Keep `ctx.subprocess`, pure argv, repository boundaries, deadlines, caps and lifecycle cleanup.
- Use temporary repositories and independent DSH_HOME/profiles; leave daily work untouched.
- Keep fixes focused. Do not mix unrelated refactors, formatting, version bumps or GUI write actions into them.
- Maintain the English/Chinese README, contribution and maintenance pairs together. Keep commands, limits and verification claims equivalent.
- After each reviewable stage passes its relevant checks, explicitly stage its files and commit locally. Do not wait for maintainer approval merely to commit.
- Preserve unrelated changes. Do not delete, reset, stash or include unrelated work just to obtain a clean status.

Use conventional commits with Chinese subjects: `<type>(<scope>): <中文主体>`. Optional scope; types are `feat/fix/docs/chore/style/refactor/test/perf/ci`.

```text
fix(timeout): 修复取消后的进程清理
docs(contributing): 补充贡献说明
ci: 增加客户端构建检查
```

Preserve generated revert subjects and merge history. Do not default to squash/rebase or force-push others' branches. Pushes, merges, tags, releases and community messages follow their own authorization; do not request it again when already granted.

## Verification and evidence

For source, dependency or build changes:

```bash
npm run build
npm run check
node --check lib/index.js
node --check lib/client.js
npm test
npm pack --dry-run
```

Tests consume compiled outputs; build first. Add regressions for actual behavior and defects. Documentation-only changes need link/format checks and `git diff --check`, not unrelated runtime tests.

```bash
git add <explicit-task-files>
git diff --cached --check
git diff --cached --stat
git commit -m "fix(scope): 描述本次修复"
git status --porcelain
```

The artifact gate runs after a commit in a clean checkout: rebuild, then `git diff --exit-code lib`. Clone locally for unpushed SHAs; a remote clone must actually contain the target SHA.

### Real DSH service verification

Use a separate exact-version host when changing DSH interfaces, lifecycle or command/tool behavior:

```bash
npm install --prefix .tmp-dsh-verify --no-save @deepseek-ai/dsh@0.2.0-rc.2
node scripts/verify-real-dsh.mjs --dsh-root .tmp-dsh-verify
```

Exit codes: 0 passed, 1 failed, 2 unresolved host or invalid parameters. This optional script is not part of normal npm test/CI. Service stacks, profiles, Web UI and model sessions are separate evidence; record versions, platforms, commands and unexecuted checks honestly.

## Pull requests and review

Use the [PR template](.github/pull_request_template.md): problem, resulting behavior, issue, validation and limitations. Use `Refs #N` for partial work and `Closes #N` only when the full requirement is resolved. Opening a PR does not authorize merging or publishing.

| Stage | Owner | Output |
|---|---|---|
| Triage | Maintainer | Plugin/upstream/environment classification and minimal missing evidence |
| Scope | Maintainer + contributor | Goal, acceptance criteria, versions and exclusions |
| Implementation | Contributor | Focused commits, tests and stage handoff |
| Review + CI | Maintainer | argv/authority/cleanup/artifact audit and current SHA Node 20/22 CI |
| Merge + release | Authorized maintainer | Actual release point and channel installation evidence |

Optional labels include bug, enhancement, compatibility and needs-info; templates do not require pre-created labels. No fixed response SLA is promised. Explain missing evidence, duplicate closures and postponed scope. CI does not replace actual-use acceptance; branch protection is a separate maintainer setting.

## Release boundaries

Contribution PRs normally do not bump versions. Follow [the release plan](docs/maintenance-plan.md): finalize the date before publication; publish once to next; verify and promote with dist-tag. Tag, Release, npm gitHead and packaged lib must identify the same release point. Changed published contents require a new version.
