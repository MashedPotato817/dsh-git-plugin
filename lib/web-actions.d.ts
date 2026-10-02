import type { Context } from "@deepseek-ai/cordis";
import type { Caps, PluginContext, RunOptions, RunOutcome } from "./index.js";
type Runner = (ctx: PluginContext, argv: string[], opts: RunOptions) => Promise<RunOutcome>;
type Resolver = (ctx: PluginContext, cwd: string, signal: AbortSignal, caps: Caps) => Promise<{
    ok: true;
    root: string;
} | {
    ok: false;
    text: string;
    aborted?: true;
    timedOut?: true;
}>;
/** Authenticated operator writes; separate from model tool approval and never opens an artificial turn. */
export declare function registerWebActions(ctx: Context, caps: Caps, run: Runner, resolveRoot: Resolver): void;
export {};
