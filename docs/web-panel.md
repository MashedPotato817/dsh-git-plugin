# Git panel for DSH Web

English · [简体中文](web-panel_ZH.md)

**0.4.0** completes the Git operation panel requested in [Issue #1](https://github.com/MashedPotato817/dsh-git-plugin/issues/1). The UI uses Chinese labels; important documentation is bilingual.

## Install and open

```bash
dsh plugin --profile web add dsh-git-plugin@0.4.0
```

Replace `web` with your profile. Restart DSH and refresh the browser. Select a repository workspace/session, open the right sidebar and choose **Git**. Older manual 0.2.0 inserts need the [migration](marketplace-submission.md#从手工启用的-020-迁移); do not register duplicate rows.

## Daily workflow

1. Inspect conflicted, staged, unstaged and untracked files. A file changed on both sides appears twice; each opens its own diff. History comes from Git objects, with pagination and commit details.
2. Select a file for its actions, or stage/unstage all eligible files. Review the operation, paths and diff, then **确认执行**. Cancel performs no write.
3. Enter a commit message and preview. **Web commits only the existing index.** Configured preCommit and native Git hooks still run. If the configured hook changes the reviewed snapshot, a new preview is required. The existing `/commit <message>` command still stages all changes before committing.
4. Expand **分支与 stash** to create/switch local branches or save/apply/drop a stash. Switching requires a clean workspace. Save includes untracked files; apply restores the index and retains the stash, including on conflicts. Delete is explicitly confirmed.
5. **备份并还原此文件** first stores all tracked edits in a retained stash, then restores the selected worktree file from the index. It preserves the index and untracked files. Apply the backup when recovery is needed; resolve conflicts manually.

Confirmation expires after two minutes and is single-use. Session/root, branch/HEAD, refs, index, worktree or relevant untracked content changes invalidate it. Errors require checking current Git state before retrying; do not assume a failed or cancelled write rolled back. External editors/Git processes can race the checks. Native hooks are trusted repository code. Submodule internal edits require their own repository. There are no remote push/pull or forced history operations.

## Host and client contract

All routes use the official authenticated Connection carrier. The Host derives a canonical repository from an existing live/persisted Session, including single-child discovery. It rejects arbitrary cwd/root/argv, unknown Sessions, traversal/.git paths, Git option injection and unsafe untracked symlinks.

| Route | Request | Result |
|---|---|---|
| status | GET sessionId | branch/root/HEAD/file states |
| diff | GET sessionId/path/side | bounded staged/worktree or untracked preview |
| log / show | GET sessionId/count/skip or full commit SHA | history / commit detail |
| operations | GET sessionId | local branches and stashes |
| prepare | POST fixed action input | review and expiring token; no mutation |
| execute | POST sessionId/token/confirm:true | one reviewed mutation |

POST requires JSON and a browser Origin matching the carrier's trusted Host authority. The native HTTP bridge uses dsh.internal internally, so that synthetic URL is not the browser origin. DSH 0.2.0-rc.2 has one admitted operator, not tenant-specific Session ACLs. GUI confirmation is separate from model tool approval and never fabricates an agent turn. Model tools remain read-only.

Git runs through ctx.subprocess with pure argv, bounded output and per-call deadlines. Diffs disable external diff/textconv. Writes are locked against concurrent panel writes. Disable removes routes/tab/slot/style, expires tokens and aborts requests/processes. Navigation ignores stale results. Client requests respect the current base URL; reverse-proxy mount prefixes still need real deployment acceptance.

Requires Git >=2.32 for stash previews including untracked content ([Git documentation](https://git-scm.com/docs/git-stash/2.32.0)). Actual tested versions and evidence are separate from this requirement.

## Development and acceptance

Use an independent DSH_HOME/profile and disposable repositories. Never use your daily profile for acceptance.

```bash
npm ci
npm run build
npm run check
npm test
npm pack
```

Create the Web profile with `dsh --profile git-panel-test --from-default-profile web --dump-config`, install the absolute tarball path using `dsh plugin --profile git-panel-test add <tarball>`, then start it from a fixture repository with `dsh --profile git-panel-test --no-open --port 17834`.

[Read acceptance](../scripts/verify-web-panel.mjs) and [operation acceptance](../scripts/verify-web-actions.mjs) run separately from CI/npm test. The latter documents its disposable actions-repo fixture and arguments at its top, uses the actual browser confirmation flow and independently checks Git results. It does not make model calls or export browser storage. Keep the startup authentication log private. Use a unique tarball filename for each development SHA: pnpm may cache a repeated pathname despite changed bytes; compare installed hashes and restart.

Release evidence: [0.3.0](release-report-0.3.0.md) and [0.4.0](release-report-0.4.0.md). Real model sessions and other DSH versions remain unverified.
