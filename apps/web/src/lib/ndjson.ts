// Streams newline-delimited JSON events to the browser. One event per line.
export type StreamEvent = Record<string, unknown> & { type: string };

export function ndjsonResponse(run: (send: (e: StreamEvent) => void) => Promise<void>): Response {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (e: StreamEvent) => controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
      try {
        await run(send);
      } catch (err) {
        console.error(err);
        send({ type: "error", message: friendlyError(err) });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(body, { headers: { "content-type": "application/x-ndjson", "cache-control": "no-store" } });
}

/** Turns provider errors into something a person can act on. */
export function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/authentication|api[_ -]?key|x-api-key|401/i.test(msg)) return "The AI isn't connected. Add ANTHROPIC_API_KEY to .env and restart.";
  if (/rate limit|429|overloaded|529/i.test(msg)) return "The AI is busy. Try again in a few seconds.";
  return msg || "Something went wrong.";
}
