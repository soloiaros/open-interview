// Integration regression checks against the running local app. No AI calls.
import assert from "node:assert/strict";
import postgres from "../apps/web/node_modules/postgres/src/index.js";
import { loadEnv } from "./env.mjs";

const env = loadEnv();
const base = env.APP_URL || "http://localhost:3000";
const sql = postgres(env.DATABASE_URL || `postgres://tacit:tacit@localhost:${env.PG_PORT || 5433}/tacit`, { max: 1 });
async function request(path, cookie, body) {
  return fetch(base + path, { method: "POST", headers: { "content-type": "application/json", origin: base, cookie }, body: JSON.stringify(body), signal: AbortSignal.timeout(10000) });
}
async function account(name) {
  const res = await request("/api/auth/sign-up/email", "", { name, email: `access-${crypto.randomUUID()}@example.test`, password: crypto.randomUUID() });
  assert.equal(res.status, 200);
  const cookie = res.headers.getSetCookie().map(c => c.split(";")[0]).join("; ");
  const { user } = await res.json();
  // Resolves the workspace without triggering an AI request.
  assert.equal((await request("/api/chat", cookie, {})).status, 400);
  const [member] = await sql`select organization_id from member where user_id=${user.id}`;
  return { cookie, id: user.id, org: member.organization_id };
}
try {
  const owner = await account("Thread Owner");
  const stranger = await account("Other Workspace");
  const colleague = await account("Same Workspace Colleague");
  await sql`update member set organization_id=${owner.org} where user_id=${colleague.id}`;
  const threadId = crypto.randomUUID(), messageId = crypto.randomUUID();
  const marker = "Private test message " + crypto.randomUUID();
  await sql`insert into chat_thread (id,org_id,user_id,title) values (${threadId},${owner.org},${owner.id},'Isolation regression')`;
  await sql`insert into chat_message (id,thread_id,role,content) values (${messageId},${threadId},'assistant',${marker})`;
  for (const outsider of [stranger, colleague]) {
    for (const [path, body] of [["/api/chat", { threadId, question: "test" }], ["/api/chat/save", { messageId }]]) {
      const res = await request(path, outsider.cookie, body);
      assert.equal(res.status, 404, `${path} must reject another user's thread`);
    }
    const page = await fetch(`${base}/app/chat?t=${threadId}`, { headers: { cookie: outsider.cookie } });
    assert.ok(!(await page.text()).includes(marker), "private chat exposed in page HTML");
  }
  assert.equal((await request("/api/chat", owner.cookie, { threadId: crypto.randomUUID(), question: "test" })).status, 404);
  const [count] = await sql`select count(*)::int as n from chat_message where thread_id=${threadId}`;
  assert.equal(count.n, 1, "rejected request mutated thread");
  const ownerPage = await fetch(`${base}/app/chat?t=${threadId}`, { headers: { cookie: owner.cookie } });
  assert.ok((await ownerPage.text()).includes(marker), "owner lost access");
  console.log("PASS: cross-workspace and same-workspace private thread isolation, save isolation, unknown thread, invalid input, owner access");
} finally {
  await sql.end();
}
