import type {} from "@deepseek-ai/dsh-client-ui-renderer/client";
import type {} from "@deepseek-ai/dsh-client-ui-session/client";
import { useEffect, useState, type ReactNode } from "react";
import type { Context } from "@deepseek-ai/cordis";
import type { PropsRuntime } from "@deepseek-ai/dsh-client-ui-slots";
import type {} from "@deepseek-ai/dsh-client-ui-sidebar-right/client";
import type {
	StatusView,
	DiffView,
	LogView,
	ShowView,
	FileState,
} from "../panel-types.js";
import styles from "./panel.css";

export const inject = ["slots", "sidebarRightTabs"];
const ID = "dsh-git-plugin";
type PanelProps = PropsRuntime<"sidebar.right.pane.tab">;
type Selection =
	{ path: string; side: "staged" | "unstaged" } | { sha: string } | null;
interface Load<T> {
	value?: T;
	error?: string;
	busy: boolean;
	key?: string;
}
const labels = {
	files: "文件",
	history: "历史",
	refresh: "刷新",
	staged: "已暂存",
	unstaged: "未暂存",
	untracked: "未跟踪",
	conflict: "冲突",
};
/** Abort on dependency change, and ignore even a transport that completes after abort. */
function useRead<T>(
	sessionId: string,
	route: string | null,
	params: Record<string, string>,
	revision: number,
	signal: AbortSignal,
): Load<T> {
	const [state, setState] = useState<Load<T>>({ busy: false });
	const key = JSON.stringify(params);
	const identity = JSON.stringify([sessionId, route, key, revision]);
	useEffect(() => {
		const abort = new AbortController();
		const requestSignal = AbortSignal.any([abort.signal, signal]);
		if (route === null) {
			setState({ busy: false, key: identity });
			return () => abort.abort();
		}
		setState({ busy: true, key: identity });
		const query = new URLSearchParams({
			sessionId,
			...(JSON.parse(key) as Record<string, string>),
		});
		const url = new URL(
			`api/git-panel/${route}`,
			new URL("./", document.baseURI),
		);
		url.search = query.toString();
		void fetch(url, {
			signal: requestSignal,
			credentials: "same-origin",
			cache: "no-store",
		})
			.then(async (response) => {
				const body = (await response.json()) as T & {
					error?: { message: string };
				};
				if (!response.ok)
					throw new Error(
						body.error?.message ?? `请求失败 (${response.status})`,
					);
				if (!requestSignal.aborted)
					setState({ busy: false, value: body, key: identity });
			})
			.catch((error: unknown) => {
				if (!requestSignal.aborted)
					setState({
						busy: false,
						error: error instanceof Error ? error.message : "读取失败。",
						key: identity,
					});
			});
		return () => abort.abort();
	}, [sessionId, route, key, revision, signal, identity]);
	return state.key === identity ? state : { busy: route !== null };
}
function Notice({ state }: { state: Load<unknown> }): ReactNode {
	if (state.busy)
		return (
			<div className="gp-note" role="status">
				正在读取 Git…
			</div>
		);
	if (state.error)
		return (
			<div className="gp-error" role="alert">
				{state.error}
			</div>
		);
	return null;
}
function Patch({ text }: { text: string }): ReactNode {
	return (
		<pre className="gp-patch">
			{text.split("\n").map((line, i) => (
				<span
					key={i}
					className={`gp-line ${line.startsWith("+") && !line.startsWith("+++") ? "gp-line-add" : line.startsWith("-") && !line.startsWith("---") ? "gp-line-del" : line.startsWith("@@") ? "gp-line-hunk" : ""}`}
				>
					{line || " "}
				</span>
			))}
		</pre>
	);
}
export function GitPanel({ sessionId, useTabInfo }: PanelProps): ReactNode {
	const { tab } = useTabInfo();
	const [mode, setMode] = useState<"files" | "history">("files");
	const [revision, setRevision] = useState(0);
	const [skip, setSkip] = useState(0);
	const [selection, setSelection] = useState<Selection>(null);
	useEffect(() => {
		setSelection(null);
		setSkip(0);
	}, [sessionId]);
	const status = useRead<StatusView>(
		sessionId,
		"status",
		{},
		revision,
		tab.signal,
	);
	const history = useRead<LogView>(
		sessionId,
		mode === "history" ? "log" : null,
		{ count: "30", skip: String(skip) },
		revision,
		tab.signal,
	);
	const detailRoute = selection ? ("sha" in selection ? "show" : "diff") : null;
	const detailParams: Record<string, string> = selection
		? "sha" in selection
			? { sha: selection.sha }
			: { path: selection.path, side: selection.side }
		: {};
	const detail = useRead<DiffView | ShowView>(
		sessionId,
		detailRoute,
		detailParams,
		revision,
		tab.signal,
	);
	const files = status.value?.files ?? [];
	const groups: Array<{
		label: string;
		side: "staged" | "unstaged";
		files: FileState[];
	}> = [
		{
			label: labels.conflict,
			side: "unstaged",
			files: files.filter((f) => f.conflict),
		},
		{
			label: labels.staged,
			side: "staged",
			files: files.filter(
				(f) => !f.conflict && !f.untracked && f.index !== " ",
			),
		},
		{
			label: labels.unstaged,
			side: "unstaged",
			files: files.filter(
				(f) => !f.conflict && !f.untracked && f.worktree !== " ",
			),
		},
		{
			label: labels.untracked,
			side: "unstaged",
			files: files.filter((f) => f.untracked),
		},
	];
	const switchMode = (next: "files" | "history") => {
		setMode(next);
		setSelection(null);
	};
	return (
		<section data-git-panel="" aria-label="Git 面板">
			<header className="gp-head">
				<span className="gp-brand" aria-hidden="true">
					git.
				</span>
				<div className="gp-repo">
					<strong title={status.value?.root}>
						{status.value?.root.split(/[\\/]/).pop() ?? "当前仓库"}
					</strong>
					<div className="gp-branch" title={status.value?.branch}>
						{status.value?.branch ?? "会话工作目录"}
					</div>
				</div>
				<button
					type="button"
					className="gp-refresh"
					aria-label="刷新 Git 面板"
					onClick={() => {
						setSelection(null);
						setRevision((n) => n + 1);
					}}
				>
					↻
				</button>
			</header>
			<nav className="gp-nav" aria-label="Git 视图">
				<button
					type="button"
					aria-pressed={mode === "files"}
					onClick={() => switchMode("files")}
				>
					{labels.files}{" "}
					<span className="gp-count">{status.value?.files.length ?? "—"}</span>
				</button>
				<button
					type="button"
					aria-pressed={mode === "history"}
					onClick={() => switchMode("history")}
				>
					{labels.history}
				</button>
			</nav>
			<div className="gp-body">
				<Notice state={status} />
				{mode === "files" && status.value && (
					<>
						{files.length === 0 ? (
							<div className="gp-note">工作区干净</div>
						) : (
							groups
								.filter((g) => g.files.length)
								.map((group) => (
									<section className="gp-group" key={group.label}>
										<h3>
											{group.label}
											<span className="gp-count">{group.files.length}</span>
										</h3>
										<ul className="gp-files">
											{group.files.map((file) => (
												<li key={file.path}>
													<button
														type="button"
														className="gp-file"
														aria-pressed={
															selection !== null &&
															"path" in selection &&
															selection.path === file.path &&
															selection.side === group.side
														}
														onClick={() =>
															setSelection({
																path: file.path,
																side: group.side,
															})
														}
													>
														<span className="gp-code">
															{file.untracked
																? "?"
																: file.conflict
																	? "!"
																	: group.side === "staged"
																		? file.index
																		: file.worktree}
														</span>
														<span className="gp-file-path">
															{file.path}
															{file.oldPath && (
																<span className="gp-old">← {file.oldPath}</span>
															)}
														</span>
													</button>
												</li>
											))}
										</ul>
									</section>
								))
						)}
					</>
				)}
				{mode === "history" && (
					<>
						<Notice state={history} />
						{history.value && (
							<>
								{history.value.entries.length === 0 ? (
									<div className="gp-note">暂无提交</div>
								) : (
									<ul className="gp-history">
										{history.value.entries.map((commit) => (
											<li key={commit.sha}>
												<button
													type="button"
													className="gp-commit"
													onClick={() => setSelection({ sha: commit.sha })}
												>
													<span className="gp-subject">{commit.subject}</span>
													<span className="gp-meta">
														<span className="gp-sha">{commit.short}</span>
														<span>{commit.author}</span>
														<time dateTime={commit.date}>
															{commit.date.slice(0, 10)}
														</time>
													</span>
												</button>
											</li>
										))}
									</ul>
								)}
								{history.value.truncated && (
									<div className="gp-warning">
										历史输出已截断，请减少条数或提高输出上限。
									</div>
								)}
								<div className="gp-pager">
									<button
										type="button"
										disabled={skip === 0}
										onClick={() => {
											setSelection(null);
											setSkip((n) => Math.max(0, n - 30));
										}}
									>
										← 上一页
									</button>
									<button
										type="button"
										disabled={!history.value.hasMore}
										onClick={() => {
											setSelection(null);
											setSkip((n) => n + 30);
										}}
									>
										下一页 →
									</button>
								</div>
							</>
						)}
					</>
				)}
				{selection && (
					<section className="gp-detail" aria-label="Git 详情">
						<div className="gp-detail-head">
							<span className="gp-detail-title">
								{"sha" in selection
									? selection.sha.slice(0, 12)
									: selection.path}
							</span>
							<span className="gp-tag">
								{"sha" in selection
									? "commit"
									: selection.side === "staged"
										? "已暂存"
										: "未暂存"}
							</span>
							<button
								type="button"
								aria-label="关闭详情"
								onClick={() => setSelection(null)}
							>
								×
							</button>
						</div>
						<Notice state={detail} />
						{detail.value && (
							<>
								{detail.value.truncated && (
									<div className="gp-warning">输出已截断</div>
								)}
								{"untracked" in detail.value && detail.value.untracked && (
									<div className="gp-warning">未跟踪文件：当前内容预览</div>
								)}
								{"binary" in detail.value && detail.value.binary ? (
									<div className="gp-note">二进制文件，无法显示文本 diff。</div>
								) : detail.value.text ? (
									<Patch text={detail.value.text} />
								) : (
									<div className="gp-note">
										该侧暂无差异；文件可能已发生变化，请刷新。
									</div>
								)}
							</>
						)}
					</section>
				)}
			</div>
			<footer className="gp-footer">只读 · 数据来自当前会话的 Git 仓库</footer>
		</section>
	);
}
export function apply(ctx: Context): void {
	ctx.effect(() => {
		const style = document.createElement("style");
		style.dataset.plugin = ID;
		style.textContent = styles;
		document.head.append(style);
		return () => style.remove();
	});
	ctx.effect(() =>
		ctx.sidebarRightTabs.register({
			id: ID,
			kind: "git",
			priority: "extension",
			title: () => "Git",
			guide: [
				{
					id: "git",
					order: 30,
					title: () => "Git",
					description: () => "文件状态、diff 与提交历史",
				},
			],
		}),
	);
	ctx.effect(() =>
		ctx.slots.inject("sidebar.right.pane.tab", () =>
			ctx.slots.register({ name: "sidebar.right.pane.tab", key: ID }, GitPanel),
		),
	);
}
