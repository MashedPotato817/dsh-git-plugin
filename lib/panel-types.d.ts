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
    error: {
        code: string;
        message: string;
    };
}
