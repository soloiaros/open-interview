// Client-side reader for the NDJSON streams the API returns.
export async function readStream<E extends { type: string }>(res: Response, onEvent: (e: E) => void) {
  if (!res.ok || !res.body) {
    const msg = await res.json().catch(() => ({ error: `Request failed (${res.status})` }));
    throw new Error(msg.error ?? `Request failed (${res.status})`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line) continue;
      const e = JSON.parse(line) as E;
      if (e.type === "error") throw new Error((e as unknown as { message: string }).message);
      onEvent(e);
    }
  }
}
