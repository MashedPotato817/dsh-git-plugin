/** Browser-safe, read-only Git projections. */
export interface FileState {
  path: string;
  oldPath?: string;
  index: string;
  worktree: string;
  conflict: boolean;
  untracked: boolean;
}
export interface StatusView {
  root: string;
  branch: string;
  head: string | null;
  files: FileState[];
  truncated: boolean;
}
export interface DiffView {
  path: string;
  side: "staged" | "unstaged";
  text: string;
  binary: boolean;
  truncated: boolean;
  untracked: boolean;
}
export interface CommitEntry {
  sha: string;
  short: string;
  author: string;
  date: string;
  subject: string;
}
export interface LogView {
  entries: CommitEntry[];
  skip: number;
  hasMore: boolean;
  truncated: boolean;
}
export interface ShowView {
  sha: string;
  text: string;
  truncated: boolean;
}
export interface PanelFailure {
  error: { code: string; message: string };
}

/** Fixed operator actions, never arbitrary argv or a model tool grant. */
export type ActionName =
  | "stage"
  | "unstage"
  | "commit"
  | "branch-create"
  | "branch-switch"
  | "stash-save"
  | "stash-apply"
  | "stash-drop"
  | "restore";
export interface ActionInput {
  sessionId: string;
  action: ActionName;
  paths?: string[];
  message?: string;
  branch?: string;
  sha?: string;
}
export interface ActionPreview {
  token: string;
  expiresAt: string;
  root: string;
  branch: string;
  input: ActionInput;
  description: string;
  preview: string;
  paths: string[];
  destructive: boolean;
}
export interface ActionResult {
  ok: true;
  message: string;
  backup?: string;
}
export interface OperationsView {
  branches: Array<{ name: string; sha: string; current: boolean }>;
  stashes: Array<{ sha: string; ref: string; message: string }>;
}
