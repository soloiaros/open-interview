// Explicit opt-in integration test: uses the running app and makes paid AI calls.
// Creates a separate synthetic account. Private session details stay in ignored .data/.
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import postgres from "../apps/web/node_modules/postgres/src/index.js";
import { loadEnv } from "./env.mjs";

const env = loadEnv();
const base = env.APP_URL || "http://localhost:3000";
const sql = postgres(env.DATABASE_URL || `postgres://tacit:tacit@localhost:${env.PG_PORT || 5433}/tacit`, { max: 1 });
const results = [];
let cookie = "";
mkdirSync(".data/testing", { recursive: true });
async function request(path, body, { method = body ? "POST" : "GET", expected = 200, authenticated = true } = {}) {
  const start = performance.now();
  const res = await fetch(base + path, {
    method, headers: { "content-type": "application/json", origin: base, ...(authenticated && cookie ? { cookie } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(180000),
  });
  const cookies = res.headers.getSetCookie();
  if (cookies.length) cookie = cookies.map(c => c.split(";")[0]).join("; ");
  let firstDeltaMs;
  let text = "";
  for await (const chunk of res.body) {
    text += new TextDecoder().decode(chunk);
    if (firstDeltaMs === undefined && text.includes('"type":"delta"')) firstDeltaMs = Math.round(performance.now() - start);
  }
  assert.equal(res.status, expected, `${path}: ${text.slice(0, 500)}`);
  const streamed = res.headers.get("content-type")?.includes("ndjson");
  const data = streamed ? text.trim().split("\n").filter(Boolean).map(line => JSON.parse(line)) : JSON.parse(text);
  if (streamed) assert.ok(!data.some(e => e.type === "error"), JSON.stringify(data.filter(e => e.type === "error")));
  const measurement = { path, status: res.status, ms: Math.round(performance.now() - start), ...(firstDeltaMs === undefined ? {} : { firstDeltaMs }) };
  results.push(measurement);
  console.log(JSON.stringify(measurement));
  return data;
}

try {
  const email = `live-test-${Date.now()}@example.test`;
  const password = randomUUID() + "Aa9!";
  await request("/api/interviews", {}, { expected: 401, authenticated: false });
  await request("/api/auth/sign-up/email", { name: "MVP Test Expert", email, password });
  writeFileSync(".data/testing/session.json", JSON.stringify({ email, password, cookie }), { mode: 0o600 });
  const created = await request("/api/interviews", {
    mode: "process_mapping", title: "Synthetic test: supplier approval handover",
    goal: "Capture the supplier approval procedure, exception handling, and final checks.",
    expertName: "MVP Test Expert", checklist: ["Approval owner", "Urgent exception", "Audit evidence"],
  });
  const id = created.id;
  writeFileSync(".data/testing/interview.json", JSON.stringify({ id }));
  const opening = await request(`/api/interviews/${id}/turn`, {});
  assert.ok(opening.some(e => e.type === "interviewer" && e.utterance.text.length > 10));
  const answers = [
    "I own supplier onboarding for our fictional company, Northstar Test Labs. Every Tuesday I review the intake spreadsheet, check the tax certificate and bank details, and send complete requests to Maya Chen, our finance lead. Maya alone approves new suppliers. The approval must be recorded in ticket SUP-42 before procurement can create a purchase order.",
    "The hardest part is spotting mismatched bank details. I compare the bank account holder against the legal company name on the tax certificate. If they differ, I stop the request and call the supplier using the phone number already in our vendor directory, never the number in the new email. We learned this after a fraudulent change request last February.",
    "For an urgent supplier request, the purchasing manager marks the ticket urgent and calls Maya Chen. Maya can approve a temporary limit of 500 dollars for 48 hours, but only after the same bank verification. If Maya is unavailable, the request waits; the purchasing manager cannot approve it. We attach the verified certificate, callback timestamp, and Maya's written approval to SUP-42.",
    "The final check is that the supplier legal name, verified bank account, and approved spending limit match the purchase order. I check the ticket again after 48 hours and disable temporary suppliers unless Maya grants full approval. A new hire should shadow me on two Tuesday reviews, then process one request while I observe. That covers the procedure; please wrap up.",
  ];
  for (const text of answers) {
    const events = await request(`/api/interviews/${id}/turn`, { text });
    assert.ok(events.some(e => e.type === "state"), "coverage event missing");
  }
  let state = await request(`/api/interviews/${id}`);
  assert.equal(state.utterances.filter(u => u.speaker === "expert").length, answers.length);
  assert.ok(state.interview.notes.length > 0, "no live notes");
  const draft = await request(`/api/interviews/${id}/draft`, {});
  assert.ok(draft.some(e => e.type === "done"));
  state = await request(`/api/interviews/${id}`);
  assert.ok(state.interview.draftMd.includes("Maya"));
  assert.equal(state.interview.status, "ended");
  const published = await request(`/api/interviews/${id}/publish`, { draftMd: state.interview.draftMd, verified: true });
  await request(`/api/interviews/${id}/publish`, { draftMd: state.interview.draftMd, verified: true }, { expected: 409 });
  const ingestStart = performance.now();
  let run;
  while (performance.now() - ingestStart < 180000) {
    [run] = await sql`select status, stats from ingest_run where source_id = ${published.sourceId} order by created_at desc limit 1`;
    if (run?.status === "done" || run?.status === "failed") break;
    await new Promise(r => setTimeout(r, 1000));
  }
  assert.equal(run?.status, "done", "wiki ingest did not finish successfully");
  assert.ok(run.stats.claimsAdded > 0 && run.stats.pagesCreated > 0, "no grounded wiki content");
  results.push({ stage: "wiki-ingest", ms: Math.round(performance.now() - ingestStart), ...run.stats });
  console.log(JSON.stringify(results.at(-1)));
  const evidence = await sql`select e.quote, e.char_start, e.char_end, s.text from evidence e join source s on s.id=e.source_id where s.id=${published.sourceId}`;
  assert.ok(evidence.length > 0);
  for (const e of evidence) assert.equal(e.text.slice(e.char_start, e.char_end), e.quote, "citation quote does not match source");
  const ask = await request("/api/chat", { question: "Who approves urgent supplier requests and what is the temporary spending limit?" });
  const answer = ask.filter(e => e.type === "delta").map(e => e.text).join("");
  assert.match(answer, /Maya/);
  assert.match(answer, /500/);
  assert.ok(ask.find(e => e.type === "done")?.citations.length > 0, "Ask omitted citations");
  const unknown = await request("/api/chat", { question: "What is the launch code for the Zephyr lunar spaceship?" });
  assert.match(unknown.filter(e => e.type === "delta").map(e => e.text).join(""), /don't have|not.*wiki|no.*information/i);
  writeFileSync(".data/testing/live-results.json", JSON.stringify({ passed: true, interviewId: id, sourceId: published.sourceId, results, answer }, null, 2));
  console.log("PASS: text interview, coverage, draft, publish, grounded wiki, Ask, unknown-answer fallback");
} catch (error) {
  writeFileSync(".data/testing/live-results.json", JSON.stringify({ passed: false, results, error: String(error) }, null, 2));
  throw error;
} finally {
  await sql.end();
}
