import type { Context } from "@deepseek-ai/cordis";
import type { Caps, PluginContext, RunOptions, RunOutcome } from "./index.js";
import type { FileState } from "./panel-types.js";
type Runner = (ctx: PluginContext, argv: string[], opts: RunOptions) => Promise<RunOutcome>;
/** Porcelain -z puts the destination first, then the rename/copy source. */
export declare function parseStatus(text: string): {
    branch: string;
    files: FileState[];
};
/** Routes live only while all optional Web capabilities are present. */
export declare function registerWebPanel(ctx: Context, caps: Caps, run: Runner, resolveRoot: (ctx: PluginContext, cwd: string, signal: AbortSignal, caps: Caps) => Promise<{
    ok: true;
    root: string;
} | {
    ok: false;
    text: string;
    aborted?: true;
    timedOut?: true;
}>): void;
export {};
