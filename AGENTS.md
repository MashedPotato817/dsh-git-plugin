# Maintenance instructions

English · [简体中文](AGENTS_ZH.md)

## Baseline (2026-10-01)

- Working repository: `C:/Users/Mashed Potato/Desktop/npm/dsh-git-plugin`. Check the actual checkout; do not edit another worktree inadvertently.
- Previous published package: **0.2.1**. PR #4 preserved history; release point `084a767aa3055d5cb0e06ddf4fb42dda4156458c` matches npm gitHead, annotated v0.2.1, and public GitHub Release. At the last release audit, latest=next=0.2.1. Channel installs and 28 official-service checks per installed entry passed. See `docs/release-report-0.2.1.md`.
- Historical 0.2.0 release point: `c83f3322950b0892022d6b3efd1e4f6edbed5be8`, PR #2. Its package contained five files; do not replace it or move its tag. See `docs/release-report-0.2.0.md`.
- Adaptation commit `8181856` introduced strict TypeScript, DSH 0.2.0-rc.2 compatibility and argv/deadline/hook-directory fixes. Timer correction `922408d` removed unref from deadline/grace timers: Linux Node 20/22 could otherwise drain the event loop before timeout. Keep timers referenced and clear them when done.
- Historical verification: 26 original tests; Windows Node 24.19.0 / Git 2.53.0.windows.2; isolated WSL2 Ubuntu 24.04 Node 20.20.2 / 22.23.3 and Git 2.43.0; clean artifact gate and release-point CI passed. See `docs/validation-report-0.2.0.md`.
- Only **DSH 0.2.0-rc.2** has actual host evidence. Model sessions, other DSH versions remain unverified; Linux Node 22 real services/Web are now verified in the 0.3.0 record. Declared range is not the tested range.
- Market PR #6296 is a separate catalog submission. It closed unmerged on 2026-10-01, with no comments explaining the closure. Do not claim market inclusion without querying the actual catalog. See `docs/marketplace-submission.md`.

## Current development

- PR #6 merged the first read-only right-sidebar panel for Issue #1 as **0.3.0**, release point 85fa7d1c4a7e6f7c274d83df242d10c65e319d24. GitHub v0.3.0 is public and its installed entry passed 28 service checks plus real Web acceptance. npm accepted the upload (202); registry availability and latest promotion remain pending. See docs/release-report-0.3.0.md. Do not overwrite npm 0.2.1 or add GUI writes.
- Source: `src/index.ts`, `src/web-host.ts`, browser-safe `src/panel-types.ts`, `src/client/`. Build Host declarations/JS and generated `lib/client.js`; keep ESM and existing commands/tools.
- English primary documents and `_ZH.md` counterparts: README, CONTRIBUTING, AGENTS; also paired Web usage documents. Synchronize facts, commands and validation boundaries. README stays a short product page; engineering details belong in CONTRIBUTING/docs and maintenance constraints here. Do not add a skill just for a documentation edit.
- Web evidence: `docs/web-panel-validation.md`. Old release CI does not certify a new development SHA.

## Required references

- Read-only local Harness: `C:/Users/Mashed Potato/Desktop/github/deepseek-harness`. Verify its branch/SHA/version and AGENTS.md; do not assume it is newest or modify it.
- Prioritize `packages/interaction/commands`, `packages/core/tools`, `packages/core/system-prompt`, `packages/subprocess/subprocess`, `packages/core/agent`, `packages/core/session`.
- Web seams: `packages/client/connection`, `ui-sidebar-right`, `ui-slots`, `ui-renderer`, `ui-session`, `packages/api/workspace-files`, `packages/boot/plugin-manager`, and `apps/web/tests/plugin-*.e2e.ts` / live-client fixtures. The upstream tsdown preset depends on workspace globbing and is not an installable third-party build preset.
- Read `docs/cordis-primer.zh.md`, `docs/cordis-tutorial/01-first-plugin.zh.md`, and `docs/cookbook/extension-cookbook.zh.md` in that checkout.
- This repository: README, CONTRIBUTING, CHANGELOG, `docs/maintenance-plan.md`, tests, `scripts/verify-real-dsh.mjs`, and CI.
- Online: [official releases](https://github.com/deepseek-ai/deepseek-harness/releases), npm registry, [issues](https://github.com/MashedPotato817/dsh-git-plugin/issues), and [PRs](https://github.com/MashedPotato817/dsh-git-plugin/pulls). Check exact package versions and dist-tags separately; never assume latest aligns across packages.

## Workflow and verification

- Communicate in Chinese by default. Start with git status, branch -vv, remote -v and graph/log -15. Explain files and reasons before editing; use feature branches and preserve existing changes.
- Reproduce before fixing. Keep changes focused, `ctx.subprocess` and pure argv, option/path boundaries, repository cwd, deadlines/cancellation, output caps and registration cleanup.
- Run build/check/test/pack for relevant source changes. Add regressions for actual fixes, not tests that merely mirror implementation.
- Build artifacts with source in the same commit. After a commit, rebuild in a clean checkout and run `git diff --exit-code lib`; normal pre-commit artifact differences are expected.
- Use independent DSH_HOME/profiles and temporary Git repositories. Do not touch daily profiles. Run the exact-host service script when appropriate; mocks do not replace host, Web or model validation.
- Web: authenticate through the official Connection carrier; derive cwd from an existing Session, never request-supplied cwd/root/argv. DSH 0.2.0-rc.2 has one admitted operator, not tenant-specific session ACLs. Refuse unknown Sessions and constrain paths; disable external diff/textconv and keep routes read-only.
- Client: generate the loader factory from TSX with a small build; externalize shell-owned React/JSX runtime. Never hand-edit client.js or bundle a second React. Dispose UI, styles, slots, tabs, routes and in-flight requests on disable; ignore stale responses on navigation.
- Report actual type/unit/real-Git/host/Web/model/platform evidence separately, including failed or unexecuted checks.

## Commit and delivery policy

- Local commits have continuing user authorization. After each reviewable stage passes relevant checks, explicitly git add its files, inspect cached diff/check and commit with a conventional Chinese subject. Do not stop at a suggested commit or ask for approval again.
- Verify git status --porcelain. If the task started clean without concurrent work, finish clean. Preserve others' changes; never delete/reset/stash or include unrelated files merely to clear status.
- Separate different purposes; never automatically amend existing commits. An unfinished checkpoint may be committed if clearly marked incomplete; never claim it passed.
- Credentials, caches, team state and temporary profiles never enter commits. Resolve commit failures normally; do not delete unknown lock files.
- Push, merge, tag, publish and community messages follow their specific user authorization; existing authorization remains valid. Delivery includes SHA, changed files/reasons, verification, remaining limits and workspace state.

## Roadmap and releases

- The 0.2.1 channels, bundle registration and presentation are complete. Follow the market submission through review and catalog sync, then verify search and actual install spec.
- P2 / Issue #1: read-only status, diff and history; reuse the sidebar carrier, not turn-based workspace-change summaries. That summary excludes pre-existing edits and is not an index/worktree Git source.
- P3: review stage/commit/branch/stash buttons separately. Turn-bound approval is unresolved for clicks outside an open turn; read authentication is not write authorization.
- Stage prompts: `docs/dsh-tasks/README.md` and packages 03–05. Adapt them to actual completed evidence rather than repeating historical instructions. Plan/history documents remain clearly dated.
- Finalize release date before publish. Version/lock/CHANGELOG/source/types/lib and tag/Release/npm gitHead/artifacts identify one release point. Publish each version once to next, verify, then promote with dist-tag. Changed published content needs a new version.
- AGENTS/docs/team state are engineering resources, not npm runtime files. Pack only closed runtime outputs, bilingual READMEs, license, patch and referenced assets; verify actual file list. Published 0.2.0/0.2.1 contents are immutable.

## Community collaboration

- CONTRIBUTING and bilingual issue/PR templates describe triage, scope, ownership, evidence, review and release. Labels and branch protection are separate settings; do not claim templates enabled them.
- Use `Refs #1` for the read-only first phase; do not close the whole issue merely because a draft/partial UI exists.
- Root screenshots.json references the capability illustration and actual released read-only panel screenshots in docs/images. The banner is an illustration; panel images use isolated fixture repositories. Catalog readiness and catalog inclusion are different states.
- Old manual inserts must migrate to id/config overrides when enabling the bundle. DSH 0.2.0-rc.2 does not automatically add a bundle layer when upgrading an old ordinary dependency.
- Preserve the isolated WSL runtimes `~/dsh-node-runtimes/node-v20.20.2-linux-x64` and `node-v22.23.3-linux-x64` unless removal is specifically requested. System Node 18 was not used for the prior matrix.
