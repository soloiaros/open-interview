import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";
import { env } from "@/lib/env";

// One client for the whole app. Credentials come from ANTHROPIC_API_KEY (or an `ant auth login` profile).
const globalForLlm = globalThis as unknown as { anthropic?: Anthropic };
export const anthropic = globalForLlm.anthropic ?? new Anthropic();
if (process.env.NODE_ENV !== "production") globalForLlm.anthropic = anthropic;

export type Effort = "low" | "medium" | "high" | "xhigh" | "max";
type Msg = Anthropic.Beta.BetaMessageParam;

// Server-side refusal fallback exists on Opus/Sonnet/Fable, not on Haiku 5.5, so only send it there.
const supportsFallback = (model: string) => !model.startsWith("claude-haiku");
const fallback = (model: string) =>
  supportsFallback(model)
    ? { betas: ["server-side-fallback-2026-07-01"] as Anthropic.Beta.AnthropicBeta[], fallbacks: "default" as const }
    : {};
// "fast": no thinking, lowest effort. Haiku 5.5 accepts disabled thinking at low/medium/high effort; Opus 5.5 does not.
const thinkingFor = (model: string, fast?: boolean) =>
  fast && model.startsWith("claude-haiku") ? { thinking: { type: "disabled" as const } } : {};

// Stable instructions go first and get cached; volatile context goes in messages.
function systemBlocks(system: string | string[]): Anthropic.Beta.BetaTextBlockParam[] {
  const parts = Array.isArray(system) ? system : [system];
  return parts.map((text, i) => ({
    type: "text" as const,
    text,
    ...(i === parts.length - 1 ? { cache_control: { type: "ephemeral" as const } } : {}),
  }));
}

export class RefusalError extends Error {}

/** Typed JSON output validated against a Zod schema. */
export async function structured<S extends z.ZodType>(opts: {
  schema: S;
  system: string | string[];
  messages: Msg[];
  effort?: Effort;
  maxTokens?: number;
  fast?: boolean;
}): Promise<z.infer<S>> {
  const response = await anthropic.beta.messages.parse({
    ...fallback(env.model),
    ...thinkingFor(env.model, opts.fast),
    model: env.model,
    max_tokens: opts.maxTokens ?? 16000,
    system: systemBlocks(opts.system),
    messages: opts.messages,
    output_config: { effort: opts.effort ?? "medium", format: betaZodOutputFormat(opts.schema) },
  });
  if (response.stop_reason === "refusal") throw new RefusalError("The model declined this request.");
  if (response.parsed_output == null) throw new Error(`Structured output failed (stop_reason: ${response.stop_reason})`);
  return response.parsed_output as z.infer<S>;
}

/** Streams plain text deltas. Returns the full text when done. */
export async function* streamText(opts: {
  system: string | string[];
  messages: Msg[];
  effort?: Effort;
  maxTokens?: number;
  signal?: AbortSignal;
  fast?: boolean;
}): AsyncGenerator<string, string> {
  const stream = anthropic.beta.messages.stream(
    {
      ...fallback(env.model),
      ...thinkingFor(env.model, opts.fast),
      model: env.model,
      max_tokens: opts.maxTokens ?? 64000,
      system: systemBlocks(opts.system),
      messages: opts.messages,
      output_config: { effort: opts.effort ?? "medium" },
    },
    { signal: opts.signal },
  );
  let full = "";
  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      full += event.delta.text;
      yield event.delta.text;
    }
  }
  const final = await stream.finalMessage();
  if (final.stop_reason === "refusal") throw new RefusalError("The model declined this request.");
  return full;
}

/** Collects a full text response without streaming it to a client. */
export async function completeText(opts: Parameters<typeof streamText>[0]): Promise<string> {
  const gen = streamText(opts);
  let r = await gen.next();
  while (!r.done) r = await gen.next();
  return r.value;
}
