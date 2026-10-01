import z from "@deepseek-ai/schemastery";
import type { ToolDefinition } from "@deepseek-ai/dsh-tools";
import type { CommandDefinition } from "@deepseek-ai/dsh-commands";
import type { PromptSection } from "@deepseek-ai/dsh-system-prompt";
import type { SubprocessOutcome, SubprocessSpawnSpec } from "@deepseek-ai/dsh-subprocess";
/**
 * dsh-git-plugin — Git workflow plugin for DeepSeek Harness.
 *
 * Registers human-facing slash commands (`/status`, `/diff`, `/branch`,
 * `/commit`, `/undo`) and read-only model-facing tools (`git-status`,
 * `git-diff`, `git-log`, `git-show`), all backed by the `ctx.subprocess` seam.
 * Git is always invoked as a plain argv vector — no shell layer — and every run
 * is bounded by the plugin's output-byte and timeout caps.
 *
 * @module dsh-git-plugin
 */
declare const name = "dsh-git-plugin";
declare const inject: string[];
declare const Config: z<Schemastery.ObjectS<NoInfer<{
    maxBytes: z<number, number, "defined">;
    stderrMaxBytes: z<number, number, "defined">;
    graceMs: z<number, number, "defined">;
    timeoutMs: z<number, number, "defined">;
    preCommit: z<string[], string[], "defined">;
}>>, Schemastery.ObjectT<NoInfer<{
    maxBytes: z<number, number, "defined">;
    stderrMaxBytes: z<number, number, "defined">;
    graceMs: z<number, number, "defined">;
    timeoutMs: z<number, number, "defined">;
    preCommit: z<string[], string[], "defined">;
}>>, "plain">;
/** The validated plugin config, as Schemastery's own output type. */
type GitConfig = Schemastery.TypeT<typeof Config>;
/**
 * The subprocess capability this plugin calls: one collect-mode spawn whose
 * `stdout`/`stderr` are buffered, plus the exit outcome and the provider
 * teardown verbs. The full `SubprocessRuntime` service also exposes executable
 * lookup and a terminal primitive, which are declared separately here because
 * the plugin calls none of them and a caller that mounts only this much can
 * still drive the plugin.
 */
interface SpawnedHandle {
    readonly done: Promise<SubprocessOutcome>;
    /** Whole-stream collected reads; present because the plugin always requests collect mode. */
    readonly collected: {
        readonly stdout?: {
            readFrom(fromByte: number): {
                text: string;
                lossy: boolean;
            };
        } | undefined;
        readonly stderr?: {
            readFrom(fromByte: number): {
                text: string;
                lossy: boolean;
            };
        } | undefined;
    };
    /** Provider teardown; absent on a caller-supplied stand-in that has nothing to tear down. */
    terminate?(): void;
    /** Quiescence of the provider's managed process range; absent for the same reason. */
    waitForExit?(): Promise<boolean>;
}
/** The exact `ctx.subprocess` surface the plugin uses. */
interface SubprocessCapability {
    spawn(spec: SubprocessSpawnSpec): SpawnedHandle;
}
/**
 * The context `apply` receives: exactly the four injected DSH services this
 * plugin reads. `@deepseek-ai/cordis` service registration is a module
 * augmentation that this standalone package does not import, so naming the
 * members here keeps `apply` assignable from a real Cordis context and from the
 * partial stand-ins the tests mount.
 */
interface PluginContext {
    readonly commands: {
        register(definition: CommandDefinition): unknown;
    };
    readonly tools: {
        register(definition: ToolDefinition): unknown;
    };
    readonly systemPrompt: {
        section(section: PromptSection): unknown;
    };
    readonly subprocess: SubprocessCapability;
}
/**
 * Register the plugin's commands, tools, and system-prompt section.
 * @param ctx - the Cordis context carrying the four injected services.
 * @param config - the plugin config as Cordis supplies it; every field has a schema default, so a partial object is accepted and each missing field falls back to its default.
 * @returns a promise that settles once every registration is installed.
 */
declare function apply(ctx: PluginContext, config: Partial<GitConfig>): Promise<void>;
export { Config, apply, inject, name };
