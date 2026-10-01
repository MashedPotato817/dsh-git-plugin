# Changelog

English · [简体中文](CHANGELOG_ZH.md)

Actual changes to `dsh-git-plugin`, following [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.3.0] - 待发布

### Added

- Issue #1 read-only Git sidebar: branch/file states, independent staged/unstaged diff, untracked content preview, paginated history and commit detail. Fixed authenticated routes derive the repository from a Session.
- TSX client and small esbuild setup, generating the official loader factory with shell-owned React; exports, pack contents and CI syntax/artifact gates updated.
- Real-Git and DOM regressions for query/path boundaries, pathspecs, external diff/textconv, truncation, deadlines/cancellation, Session switching and lifecycle cleanup.
- Paired English/Chinese README, CONTRIBUTING, AGENTS, CHANGELOG and Web guides; bilingual Issue/PR templates.

### Fixed

- The panel reuses single-child repository discovery from its Session cwd, matching existing command resolution.

### Notes

- This release introduces the read-only panel; UI labels are Chinese, and translated documents do not imply English UI support.
- GUI writes and approval without an open turn remain P3. The read-only first phase does not close the whole Issue #1.

## [0.2.1] - 2026-10-01

### Added

- DSH bundle installation metadata and exported/packed `cordis.patch.yml`, automatically registering the plugin on a new installation.
- dsh-market inclusion criteria, Git-category submission draft, and old-profile migration instructions.
- `screenshots.json` market image declaration using the existing original capability banner.

### Changed

- README now uses an original SVG banner and short product/install/use content. Configuration, source installation, architecture and verification moved to CONTRIBUTING; maintenance constraints live in AGENTS. Corrected post-release CI wording and distinguished published 0.2.0 from the then-development bundle.

## [0.2.0] - 2026-10-01

Target: DeepSeek Harness 0.2.0-rc.2. Declared and actually tested ranges are separate; real model sessions remain unverified.

### Added

- Strict TypeScript `src/index.ts` and tsconfig; JS/types built into lib. Added build and no-emit type-check commands.
- Regressions for git-show option injection, slash/tool/preCommit deadlines, caller cancellation, and preCommit cwd after child-repository discovery.
- Optional real-host `scripts/verify-real-dsh.mjs` using official Cordis, commands, tools, system-prompt, subprocess-local and real Git. Deliberately excluded from npm test/CI.
- Repository, bugs, homepage, engines.dsh and dsh.manifestVersion metadata.
- CHANGELOG and maintenance plan with version evidence, checks and release steps.
- CONTRIBUTING, bug/feature/compatibility Issue forms and PR template; commit hook accepts ci subjects.

### Changed

- Four DSH peer packages moved from ^0.1.0-rc.6 to >=0.2.0-rc.2 <0.3.0-0; development packages pinned to 0.2.0-rc.2. The old range failed runtime peer admission.
- The plugin now owns timeout enforcement and process termination; tool timeoutMs was only declarative and did not cover slash commands/preCommit.
- /commit resolves the repository once; preCommit, git add and git commit use the same cwd after automatic child-repository discovery.
- Cancelled/timed-out repository probes are no longer misreported as non-repositories.
- files now includes lib declarations; exports gains a types condition.

### Fixed

- git-show fixes ref as a revision with --end-of-options. Option-shaped --output references cannot write arbitrary files; normal HEAD/HEAD~1/branch references retain behavior.
- Already-aborted caller signals return aborted before spawn rather than hanging.
- Deadline/grace timers remain referenced and are cleared on completion. Previously unref could drain the Linux Node 20/22 event loop while awaiting a timer, cancelling five tests and potentially skipping deadlines.
