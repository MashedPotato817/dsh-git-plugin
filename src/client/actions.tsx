import { useEffect, useRef, useState, type ReactNode } from "react";
import type {
  ActionInput,
  ActionPreview,
  ActionResult,
  FileState,
  OperationsView,
} from "../panel-types.js";
interface Props {
  sessionId: string;
  signal: AbortSignal;
  revision: number;
  files: FileState[];
  selected?: string;
  onChange: () => void;
}
export function Actions({
  sessionId,
  signal,
  revision,
  files,
  selected,
  onChange,
}: Props): ReactNode {
  const [preview, setPreview] = useState<ActionPreview | null>(null);
  const [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  const [message, setMessage] = useState(""),
    [branch, setBranch] = useState(""),
    [stashMessage, setStashMessage] = useState("");
  const [operations, setOperations] = useState<OperationsView>({
    branches: [],
    stashes: [],
  });
  const controller = useRef<AbortController | null>(null),
    opener = useRef<HTMLElement | null>(null);
  const generation = useRef(0);
  function cancel() {
    generation.current++;
    controller.current?.abort();
    setPreview(null);
    setBusy(false);
    opener.current?.focus();
  }
  useEffect(() => {
    generation.current++;
    controller.current?.abort();
    setPreview(null);
    setBusy(false);
    setMessage("");
    setBranch("");
    setStashMessage("");
    const abort = new AbortController();
    const requestSignal = AbortSignal.any([abort.signal, signal]);
    setOperations({ branches: [], stashes: [] });
    const url = new URL(
      "api/git-panel/operations",
      new URL("./", document.baseURI),
    );
    url.search = new URLSearchParams({ sessionId }).toString();
    void fetch(url, {
      signal: requestSignal,
      credentials: "same-origin",
      cache: "no-store",
    })
      .then(async (response) => {
        const data = (await response.json()) as OperationsView & {
          error?: { message: string };
        };
        if (!response.ok)
          throw new Error(data.error?.message ?? "读取分支失败。");
        if (!requestSignal.aborted)
          setOperations({
            branches: data.branches ?? [],
            stashes: data.stashes ?? [],
          });
      })
      .catch((error: unknown) => {
        if (!requestSignal.aborted)
          setNotice(error instanceof Error ? error.message : "读取失败。");
      });
    return () => {
      abort.abort();
      generation.current++;
      controller.current?.abort();
    };
  }, [sessionId, signal, revision]);
  async function request<T>(
    route: string,
    body: unknown,
    requestSignal: AbortSignal,
  ): Promise<T> {
    const url = new URL(
      `api/git-panel/${route}`,
      new URL("./", document.baseURI),
    );
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      credentials: "same-origin",
      cache: "no-store",
      signal: requestSignal,
    });
    const result = (await response.json()) as T & {
      error?: { message: string };
    };
    if (!response.ok)
      throw new Error(result.error?.message ?? `操作失败 (${response.status})`);
    return result;
  }
  async function prepare(input: Omit<ActionInput, "sessionId">) {
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    const version = ++generation.current,
      requestSignal = AbortSignal.any([abort.signal, signal]);
    opener.current =
      document.activeElement instanceof document.defaultView!.HTMLElement
        ? document.activeElement
        : null;
    setBusy(true);
    setNotice("");
    setPreview(null);
    try {
      const result = await request<ActionPreview>(
        "prepare",
        { sessionId, ...input },
        requestSignal,
      );
      if (!requestSignal.aborted && version === generation.current)
        setPreview(result);
    } catch (error) {
      if (!requestSignal.aborted && version === generation.current)
        setNotice(error instanceof Error ? error.message : "预览失败。");
    } finally {
      if (!requestSignal.aborted && version === generation.current)
        setBusy(false);
    }
  }
  async function execute() {
    if (!preview || busy) return;
    const abort = new AbortController();
    controller.current = abort;
    const version = ++generation.current,
      requestSignal = AbortSignal.any([abort.signal, signal]);
    setBusy(true);
    try {
      const result = await request<ActionResult>(
        "execute",
        { sessionId, token: preview.token, confirm: true },
        requestSignal,
      );
      if (!requestSignal.aborted && version === generation.current) {
        setPreview(null);
        onChange();
        setNotice(
          result.message + (result.backup ? ` 备份：${result.backup}` : ""),
        );
      }
    } catch (error) {
      if (!requestSignal.aborted && version === generation.current) {
        setPreview(null);
        onChange();
        setNotice(
          (error instanceof Error ? error.message : "操作失败。") +
            " 请核对当前状态后重新预览；不要重复执行。",
        );
      }
    } finally {
      if (!requestSignal.aborted && version === generation.current)
        setBusy(false);
    }
  }
  const unstaged = files
    .filter((f) => !f.conflict && (f.untracked || f.worktree !== " "))
    .map((f) => f.path);
  const staged = files
    .filter((f) => !f.conflict && !f.untracked && f.index !== " ")
    .map((f) => f.path);
  const chosen = files.find((f) => f.path === selected);
  return (
    <section className="gp-actions" aria-label="Git 操作">
      <div className="gp-action-row">
        <button
          type="button"
          aria-label="暂存全部未暂存文件"
          disabled={busy || !!preview || !unstaged.length}
          onClick={() => void prepare({ action: "stage", paths: unstaged })}
        >
          暂存全部
        </button>
        <button
          type="button"
          disabled={busy || !!preview || !staged.length}
          onClick={() => void prepare({ action: "unstage", paths: staged })}
        >
          取消全部暂存
        </button>
      </div>
      {chosen && (
        <div className="gp-action-row" aria-label="选定文件操作">
          <span className="gp-selected" title={chosen.path}>
            {chosen.path}
          </span>
          <button
            type="button"
            disabled={busy || !!preview}
            onClick={() =>
              void prepare({ action: "stage", paths: [chosen.path] })
            }
          >
            暂存此文件
          </button>
          {!chosen.untracked && chosen.index !== " " && (
            <button
              type="button"
              disabled={busy || !!preview}
              onClick={() =>
                void prepare({ action: "unstage", paths: [chosen.path] })
              }
            >
              取消此文件暂存
            </button>
          )}
          {!chosen.untracked && !chosen.conflict && chosen.worktree !== " " && (
            <button
              type="button"
              disabled={busy || !!preview}
              onClick={() =>
                void prepare({ action: "restore", paths: [chosen.path] })
              }
            >
              备份并还原此文件
            </button>
          )}
        </div>
      )}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void prepare({ action: "commit", message });
        }}
      >
        <label>
          提交说明
          <textarea
            aria-label="提交说明"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="只提交已暂存内容"
            maxLength={4096}
            disabled={busy || !!preview}
          />
        </label>
        <button
          type="submit"
          disabled={busy || !!preview || !message.trim() || !staged.length}
        >
          预览提交
        </button>
      </form>
      <details className="gp-operation-details">
        <summary>分支与 stash</summary>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void prepare({ action: "branch-create", branch });
          }}
        >
          <label>
            新分支
            <input
              aria-label="新分支名称"
              value={branch}
              onChange={(event) => setBranch(event.target.value)}
              maxLength={200}
              disabled={busy || !!preview}
            />
          </label>
          <button disabled={busy || !!preview || !branch.trim()} type="submit">
            创建并切换
          </button>
        </form>
        <ul>
          {operations.branches.map((item) => (
            <li key={item.name}>
              <span>
                {item.current ? "● " : ""}
                {item.name}
              </span>
              <button
                type="button"
                disabled={busy || !!preview || item.current}
                onClick={() =>
                  void prepare({ action: "branch-switch", branch: item.name })
                }
              >
                切换
              </button>
            </li>
          ))}
        </ul>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void prepare({ action: "stash-save", message: stashMessage });
          }}
        >
          <label>
            Stash 说明
            <input
              aria-label="Stash 说明"
              value={stashMessage}
              onChange={(event) => setStashMessage(event.target.value)}
              maxLength={4096}
              disabled={busy || !!preview}
            />
          </label>
          <button
            type="submit"
            disabled={
              busy || !!preview || !stashMessage.trim() || !files.length
            }
          >
            保存改动
          </button>
        </form>
        <ul>
          {operations.stashes.map((item) => (
            <li key={item.sha}>
              <span title={item.sha}>
                {item.ref} · {item.message}
              </span>
              <button
                type="button"
                disabled={busy || !!preview}
                onClick={() =>
                  void prepare({ action: "stash-apply", sha: item.sha })
                }
              >
                应用并保留
              </button>
              <button
                type="button"
                disabled={busy || !!preview}
                onClick={() =>
                  void prepare({ action: "stash-drop", sha: item.sha })
                }
              >
                删除
              </button>
            </li>
          ))}
        </ul>
        {!operations.stashes.length && <p className="gp-note">暂无 stash</p>}
      </details>
      {busy && !preview && <p role="status">正在准备 Git 操作…</p>}
      {notice && (
        <p className="gp-action-notice" role="status">
          {notice}
        </p>
      )}
      {preview && (
        <section
          className="gp-confirm"
          role="dialog"
          aria-label="确认 Git 操作"
          onKeyDown={(event) => {
            if (event.key === "Escape" && !busy) cancel();
          }}
        >
          <h3>确认 Git 操作</h3>
          <p>{preview.description}</p>
          <p className="gp-meta">
            {preview.root} · {preview.branch}
          </p>
          {preview.input.message && <p>{preview.input.message}</p>}
          {preview.input.branch && <p>分支：{preview.input.branch}</p>}
          {preview.input.sha && <p>Stash：{preview.input.sha}</p>}
          <ul>
            {preview.paths.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          {preview.preview && (
            <pre className="gp-review-patch">{preview.preview}</pre>
          )}
          {preview.destructive && (
            <p className="gp-warning">此操作会修改或删除内容，请核对预览。</p>
          )}
          <div className="gp-action-row">
            <button
              type="button"
              aria-label="取消操作"
              autoFocus
              disabled={busy}
              onClick={cancel}
            >
              取消
            </button>
            <button
              type="button"
              aria-label="确认执行操作"
              disabled={busy}
              onClick={() => void execute()}
            >
              {busy ? "正在执行…" : "确认执行"}
            </button>
          </div>
        </section>
      )}
    </section>
  );
}
