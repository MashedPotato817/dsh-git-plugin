# Git operation panel design / Git 操作面板设计

Goal: finish Issue #1 with a usable native DSH Web Git workflow, then close it only after the published package is verified. 目标：完整交付网页 Git 工作流，正式包验收后回复并关闭 Issue。

## Scope / 范围
Keep status, independent index/worktree diffs, previews and history. Add selected/bulk staging and unstaging, staged-only commit, local branch creation/switching, stash save/apply/drop, and tracked-file restore with a retained stash backup. Remote push/pull and forced history rewriting are outside this request. 保留只读能力，补暂存/取消暂存、仅提交暂存区、分支及 stash 操作、带保留备份的已跟踪文件还原；不引入远端推送或强制改写历史。

## Human confirmation / 人工确认
- Upstream user-approval request rejects calls outside an open agent turn (packages/interaction/user-approval/src/index.ts:215). Subprocess spawn is a capability, not a model approval answerer. GUI actions originate from the admitted operator, not a model tool; no fabricated turn, model call or API key.
- 新增人工 GUI 确认，不复用或绕过模型审批，不伪造 turn。
- Authenticated GET operations lists branches/stashes. POST prepare validates fixed JSON keys, Session-derived canonical root and Git argv, and returns action/paths/message/branch, bounded preview, root and a random two-minute single-use token.
- POST execute accepts only sessionId/token/confirm:true. Consume token once, lock that repository against concurrent panel mutations and recheck the Session/root, HEAD/branch, refs, index/worktree diffs and relevant untracked contents. Drift returns 409 before writes; cancellation/disable aborts processes and invalidates confirmations.
- 同源 JSON、一次性两分钟确认、执行前身份与状态复核、每仓库单写锁，变化后要求重新预览。自动截止与启停清理覆盖写进程。
- Read authentication alone does not mutate. Reject foreign/missing Origin, unknown/repeated query fields, extra JSON keys, unknown Sessions, absolute/traversal/.git paths, arbitrary cwd/argv, option-shaped refs and untracked symlink reads.

## Behavior / 操作语义
- stage uses git add -A -- exact listed files; an already indexed rename stages only its selected destination; an unstaged rename includes its still-indexed source. unstage retains worktree; unborn HEAD uses git rm --cached.
- commit uses only the existing index, honors configured preCommit, refuses conflicts/empty index, rechecks the reviewed snapshot after the hook and reports Git hook failures. Never git add -A during commit.
- Branch switch uses ordinary Git protections, no force. A clean workspace is required; create-and-switch preserves changes.
- Stash save includes untracked files; apply --index retains its stash even on conflicts; drop requires explicit destructive confirmation. Submodule internal edits need their own repository.
- Restore backs up tracked edits with git stash create/store before restoring selected worktree paths from the index; it never deletes untracked files or uses reset --hard. The backup remains visible in stash.
- 提交只用暂存区，分支不强制；stash 应用保留原记录；还原先保留备份，不删除未跟踪文件。

## Acceptance / 验收
Real Git: prepare does not mutate; cancel/replay/foreign Session/root/index/worktree/untracked drift fails closed; stage/unstage incl unborn and rename; staged-only commit/failed hook; branches; stash and backup restore; conflicts, literal/Chinese/space paths; route and process disposal. DOM: explicit confirmation, no POST execute before confirm, stale Session cannot execute. Installed real DSH Web: click through the actual workflow, assert Git state independently, test carrier boundaries and lifecycle. CI Node20/22 and Windows/Linux, clean artifact gate, pack closure. Important documents English/Chinese. Publish new 0.4.0 once to next; verify both channels and then latest. Close Issue with installation, features, evidence and honest limits.
