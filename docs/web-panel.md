# Git panel for DSH Web

English · [简体中文](web-panel_ZH.md)

The development branch `feat/web-git-panel` implements the first read-only phase of [Issue #1](https://github.com/MashedPotato817/dsh-git-plugin/issues/1). **Unreleased:** the published npm/GitHub `0.2.1` has commands and tools, without this panel. The new 0.3.0 release candidate contains the panel; it must never overwrite the published 0.2.1 package.

![Actual development panel in DSH Web](images/git-panel.png)

This is a screenshot from an independent DSH 0.2.0-rc.2 Web profile and a temporary Git repository. It is development evidence, not a published feature announcement.

## Try the development checkout

Use an independent `DSH_HOME` and profile. Do not replace your daily profile while testing. From this checkout:

```bash
npm ci
npm run build
npm run check
npm test
npm pack
```

Set `DSH_HOME` to a new test directory using your shell. Replace the paths below with absolute paths on your machine, and use the CLI belonging to your DSH installation:

```bash
dsh --profile git-panel-test --from-default-profile web --dump-config
dsh plugin --profile git-panel-test add /absolute/path/dsh-git-plugin-0.3.0.tgz
```

Start DSH from a temporary Git repository:

```bash
dsh --profile git-panel-test --no-open --port 17832
```

Open the official local authentication URL printed by DSH. Select a repository workspace/session, open the right sidebar, and choose **Git**. Installing or replacing a tarball requires restarting that profile's DSH process and refreshing its browser page. No model request or API key is needed to read the panel.

## What you can see

- Branch and repository, with a manual refresh button.
- Conflicted, staged, unstaged and untracked files. A file changed on both sides appears in both groups; each opens its own diff.
- Text diffs rendered as text, with added/deleted lines highlighted. Untracked files show a bounded current-content preview, not a fabricated HEAD diff. Binary/unavailable previews and truncation are explicit.
- Paginated commit history and commit detail from Git objects. Empty repositories and detached HEAD have explicit states.

The UI currently uses Chinese labels. Bilingual documentation does not imply an English UI. There are no stage, commit, branch-switch, restore or stash buttons in this phase. Existing slash commands retain their behavior.

## Host contract

All routes are fixed, read-only `GET` requests behind DSH Connection authentication. Responses are JSON; failures are `{ "error": { "code": "...", "message": "..." } }`. Browser requests use the current DSH base URL, including a mount prefix.

| Route | Query | Successful projection |
|---|---|---|
| `/api/git-panel/status` | `sessionId` | root, branch, HEAD and NUL-parsed XY file states |
| `/api/git-panel/diff` | `sessionId`, repository-relative `path`, `side=staged\|unstaged` | text, binary/untracked/truncated flags |
| `/api/git-panel/log` | `sessionId`, optional `count` (1–100, default 30), `skip` (0–10000, default 0) | entries, skip, hasMore, truncated |
| `/api/git-panel/show` | `sessionId`, full lowercase 40–64 hex `sha` | commit text and truncated flag |

The Host derives cwd from a live or persisted Session, and reuses the plugin's single-child repository discovery. Unknown Sessions are refused. Zero/multiple child repositories cannot silently select a target. Requests cannot supply arbitrary cwd, root, argv or repeated/unknown query keys.

Path traversal, absolute paths and `.git` paths are refused; literal pathspecs prevent Git magic expansion. Commit detail accepts a verified commit SHA, not arbitrary option-shaped revisions. Git runs through `ctx.subprocess` with pure argv, disabled external diff/textconv, no optional Git locks, bounded output and the configured deadline. An incomplete capped status response is an error, never a false clean state.

DSH 0.2.0-rc.2 authenticates one admitted operator. This is not a tenant-specific Session ACL; knowing another Session ID in the same admitted operator's host is not separate tenant authorization. The plugin adds unknown-Session and path boundaries within that host contract.

Disabling the plugin disposes the tab, slot, style and Host routes, aborts pending requests and terminates their subprocesses. Closing/navigating the tab aborts browser reads; stale responses cannot replace the new Session/file view. CLI/headless hosts keep their original commands/tools without requiring Web services.

## Repeat the browser check

The optional [acceptance script](../scripts/verify-web-panel.mjs) needs Playwright installed in a separate tools directory and a supported browser (tested with Edge on Windows). It is outside npm test/CI and is not an npm runtime dependency. It enables the plugin, then runs two disable/enable cycles in the supplied test profile; never point it at a daily profile.

Use the three-file fixture described by `--help`. Obtain its Session ID from the panel's `status?sessionId=...` request in browser DevTools; the ID is not a credential. Pass the isolated server log, not an account secret:

```bash
node scripts/verify-web-panel.mjs --help
node scripts/verify-web-panel.mjs --dsh-log /test/server.log --session-id <fixture-session-id> --playwright-module /test/tools/node_modules/playwright --screenshots /test/screenshots
```

The script reads the official local authentication URL into memory, closes its browser, and never exports browser storage. Keep that startup log private; it contains the temporary authentication link. The operator must stop the test server and delete the independent profile after testing.

## Validation and next phase

See the [validation record](web-panel-validation.md) for test levels, exact environments and remaining checks. Windows real Web reads and live enable/disable passed; unit/real-Git evidence is separate from browser evidence. The current implementation is not marked stable before actual user acceptance.

P3 must first resolve write approval for a sidebar click without an open model turn, define recoverability, and add focused regressions. Keep Issue #1 open with `Refs #1`; a read-only first phase does not close the entire request.
