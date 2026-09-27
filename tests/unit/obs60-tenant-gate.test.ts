/**
 * obs60-tenant-gate.test.ts — fecha o bloqueio "Endpoint integrado autenticado e
 * isolamento tenant A/B" listado na PR do OBS-60 (docs/audits/BLOCKED_EXTERNAL_OBS60_VIDEO_AI.md).
 *
 * tests/unit/obs60.test.mjs cobre o contrato de evidência e o transporte
 * (`_video.ts`) isoladamente, com um `fetcher` injetado — nunca o `onRequest`
 * real do endpoint. Este arquivo encadeia o `onRequest` real de
 * functions/api/integrations/obs60/index.ts sobre o schema D1 real (mesma
 * política de tests/unit/integrations-tenant-gate.test.ts), sem mock de SQL,
 * para provar: 401/403/409/402 nas fronteiras de auth/papel/clínica/billing,
 * isolamento entre duas clínicas com o mesmo usuário, e que o log de
 * auditoria fecha sempre (requested → completed OU requested → failed),
 * nunca vídeo/hash/idade/transcrição em metadata_json.
 *
 * Nenhum dado real: tudo aqui é sintético. Nenhuma chamada de rede real —
 * `globalThis.fetch` é substituído durante os testes que chegam ao transporte.
 *
 * Rodar: node --import tsx --test tests/unit/obs60-tenant-gate.test.ts
 */
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

import { onRequest as obs60Gate } from "../../functions/api/integrations/obs60/index";
import { ITEM_IDS, VERSION } from "../../shared/obs60";

// ── Banco: bootstrap real (mesma política de integrations-tenant-gate.test.ts) ──
const raw = new DatabaseSync(":memory:");
raw.exec("PRAGMA foreign_keys = OFF;");
raw.exec(readFileSync("db/schema.d1.sql", "utf8"));
const superadas: string[] = [];
for (const nome of readdirSync("db/migrations").filter((f) => f.endsWith(".sql")).sort()) {
  try {
    raw.exec(readFileSync(`db/migrations/${nome}`, "utf8"));
  } catch (erro) {
    assert.match(String(erro), /duplicate column name/i, `migração ${nome}: ${String(erro)}`);
    superadas.push(nome);
  }
}
assert.deepEqual(superadas, ["0001_users_auth.sql", "0002_patient_ownership.sql"]);
raw.exec("PRAGMA foreign_keys = ON;");

function makeDb(database: DatabaseSync): D1Database {
  const prepare = (sql: string) => {
    const make = (args: unknown[]) => ({
      async first<T>() {
        return (database.prepare(sql).get(...(args as never[])) as T | undefined) ?? null;
      },
      async run() {
        const info = database.prepare(sql).run(...(args as never[]));
        return { meta: { changes: Number(info.changes) } };
      },
      async all<T>() {
        return { results: database.prepare(sql).all(...(args as never[])) as T[] };
      },
    });
    return { bind: (...args: unknown[]) => make(args), ...make([]) };
  };
  return { prepare } as unknown as D1Database;
}
const db = makeDb(raw);

function user(id: string, role: "admin" | "professional" | "reader" | "operator" = "professional") {
  return { id, email: `${id}@example.test`, name: id, role, mustChangePassword: false };
}

async function invoke(
  method: "GET" | "POST" | "DELETE",
  actor: ReturnType<typeof user> | null,
  options: { env?: Record<string, string>; headers?: Record<string, string>; body?: unknown; withDb?: boolean } = {},
) {
  const headers = { ...(options.headers ?? {}) };
  const request = new Request("https://neuroped.test/api/integrations/obs60", {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  const context = {
    request,
    env: { DB: options.withDb === false ? undefined : db, ...(options.env ?? {}) },
    params: {},
    data: actor ? { authUser: actor } : {},
    waitUntil: () => undefined,
  };
  return obs60Gate(context as never);
}

function auditRows(clinicId: string, requestId?: string) {
  const rows = raw
    .prepare(
      `SELECT action, target_id, metadata_json FROM saas_audit_log
        WHERE clinic_id = ? AND target_type = 'obs60' ${requestId ? "AND target_id = ?" : ""}
        ORDER BY created_at ASC, rowid ASC`,
    )
    .all(...(requestId ? [clinicId, requestId] : [clinicId])) as Array<{ action: string; target_id: string; metadata_json: string }>;
  return rows.map((r) => ({ action: r.action, targetId: r.target_id, metadata: JSON.parse(r.metadata_json) as Record<string, unknown> }));
}

// mp4 ftyp header sintético (idêntico ao fixture de tests/unit/obs60.test.mjs)
const mp4Prefix = Uint8Array.from([0, 0, 0, 24, 102, 116, 121, 112, 109, 112, 52, 50, 0, 0, 0, 0, 109, 112, 52, 50, 105, 115, 111, 109]);
const validData = Buffer.from(mp4Prefix).toString("base64");
function videoBody(overrides: Record<string, unknown> = {}) {
  return { ageMonths: 39, windowSeconds: 60, consent: true, mime: "video/mp4", data: validData, ...overrides };
}
function fixtureObservations() {
  const codes = ["oriented", "both_steps", "pointed", "spoken", "walked_no_visible_support", "picked_and_stood_no_visible_support"];
  const spans = [[0, 7], [10, 20], [25, 30], [30, 38], [42, 51], [51, 59]];
  return {
    observations: ITEM_IDS.map((id, i) => ({
      id, event: codes[i], start: spans[i][0], end: spans[i][1], opportunity: "clear",
      audioClear: true, viewClear: true, sequenceClear: true, childSpeakerClear: true, initiallyFacingAdult: false,
      help: "initial", transcript: id === "speech" ? "bola" : "", reason: "none",
    })),
  };
}
const VIDEO_ENV = { OBS60_VIDEO_AI_ENABLED: "true", OBS60_PRIVACY_APPROVED: "true", OBS60_GEMINI_MODEL: "gemini-test-fixture", OBS60_GEMINI_API_KEY: "synthetic-not-a-real-key" };
function geminiResponse(body: unknown = fixtureObservations(), status = 200) {
  return new Response(JSON.stringify({ modelVersion: "synthetic-model", candidates: [{ finishReason: "STOP", content: { parts: [{ text: JSON.stringify(body) }] } }] }), { status, headers: { "Content-Type": "application/json" } });
}

const now = new Date().toISOString();
raw.prepare(`INSERT INTO users (id, name, email, role) VALUES (?, ?, ?, 'professional')`).run("sem-clinica", "Sem Clínica", "sem-clinica@example.test");
raw.prepare(`INSERT INTO users (id, name, email, role) VALUES (?, ?, ?, 'reader')`).run("leitor", "Leitor", "leitor@example.test");
raw.prepare(`INSERT INTO users (id, name, email, role) VALUES (?, ?, ?, 'professional')`).run("clinica-a", "Clínica A", "clinica-a@example.test");
raw.prepare(`INSERT INTO users (id, name, email, role) VALUES (?, ?, ?, 'professional')`).run("clinica-assistente", "Assistente", "assistente@example.test");
raw.prepare(`INSERT INTO users (id, name, email, role) VALUES (?, ?, ?, 'professional')`).run("clinica-suspensa", "Clínica Suspensa", "clinica-suspensa@example.test");

raw.prepare(`INSERT INTO clinics (id, slug, name, status, created_by_user_id, created_at, updated_at) VALUES ('clinica-a', 'clinica-a', 'Clínica A', 'active', 'clinica-a', ?, ?)`).run(now, now);
raw.prepare(`INSERT INTO clinic_memberships (clinic_id, user_id, role, active, created_at, updated_at) VALUES ('clinica-a', 'clinica-a', 'professional', 1, ?, ?)`).run(now, now);

raw.prepare(`INSERT INTO clinics (id, slug, name, status, created_by_user_id, created_at, updated_at) VALUES ('clinica-b', 'clinica-b', 'Clínica B', 'active', 'clinica-a', ?, ?)`).run(now, now);

raw.prepare(`INSERT INTO clinics (id, slug, name, status, created_by_user_id, created_at, updated_at) VALUES ('clinica-assistente', 'clinica-assistente', 'Clínica Assistente', 'active', 'clinica-assistente', ?, ?)`).run(now, now);
raw.prepare(`INSERT INTO clinic_memberships (clinic_id, user_id, role, active, created_at, updated_at) VALUES ('clinica-assistente', 'clinica-assistente', 'assistant', 1, ?, ?)`).run(now, now);

raw.prepare(`INSERT INTO clinics (id, slug, name, status, created_by_user_id, created_at, updated_at) VALUES ('clinica-suspensa', 'clinica-suspensa', 'Clínica Suspensa', 'active', 'clinica-suspensa', ?, ?)`).run(now, now);
raw.prepare(`INSERT INTO clinic_memberships (clinic_id, user_id, role, active, created_at, updated_at) VALUES ('clinica-suspensa', 'clinica-suspensa', 'professional', 1, ?, ?)`).run(now, now);
raw.prepare(`UPDATE billing_customers SET status = 'past_due', grace_ends_at = NULL WHERE clinic_id = 'clinica-suspensa'`).run();

test("método fora de GET/POST é rejeitado antes de qualquer checagem", async () => {
  const response = await invoke("DELETE", null);
  assert.equal(response.status, 405);
  assert.equal((await response.json() as { code?: string }).code, "METHOD_NOT_ALLOWED");
});

test("sem DB, endpoint falha fechado (nunca modo demo/simulado)", async () => {
  const response = await invoke("GET", user("clinica-a"), { withDb: false });
  assert.equal(response.status, 503);
  assert.equal((await response.json() as { code?: string }).code, "DB_REQUIRED");
});

test("sem sessão autenticada, 401 antes de tocar o banco", async () => {
  const response = await invoke("GET", null);
  assert.equal(response.status, 401);
  assert.equal((await response.json() as { code?: string }).code, "UNAUTHENTICATED");
});

test("papel global sem permissão clínica é barrado, sem linha de auditoria", async () => {
  const response = await invoke("GET", user("leitor", "reader"));
  assert.equal(response.status, 403);
  assert.equal((await response.json() as { code?: string }).code, "FORBIDDEN");
});

test("conta sem nenhuma clínica é barrada com o mesmo código de patients/operations", async () => {
  const response = await invoke("GET", user("sem-clinica"));
  assert.equal(response.status, 409);
  assert.equal((await response.json() as { code?: string }).code, "CLINIC_REQUIRED");
});

test("membership ativa sem permissão clinical.write (assistant) é barrada", async () => {
  const response = await invoke("GET", user("clinica-assistente"), { headers: { "x-tenant-id": "clinica-assistente" } });
  assert.equal(response.status, 403);
  assert.equal((await response.json() as { code?: string }).code, "FORBIDDEN");
});

test("billing suspenso nega com a mesma paridade de patients/operations, sem auditoria", async () => {
  const antes = auditRows("clinica-suspensa").length;
  const response = await invoke("GET", user("clinica-suspensa"), { headers: { "x-tenant-id": "clinica-suspensa" } });
  assert.equal(response.status, 402);
  assert.equal((await response.json() as { code?: string }).code, "ENTITLEMENT_SUSPENDED");
  assert.equal(auditRows("clinica-suspensa").length, antes, "nenhuma linha de auditoria para requisição negada por billing");
});

test("header x-tenant-id de uma clínica sem membership ativa não concede acesso (isolamento A/B)", async () => {
  const response = await invoke("GET", user("clinica-a"), { headers: { "x-tenant-id": "clinica-b" } });
  assert.equal(response.status, 409, "clínica pedida sem membership ativa cai no mesmo 409 de 'sem clínica', sem revelar que clinica-b existe");
  assert.equal((await response.json() as { code?: string }).code, "CLINIC_REQUIRED");
});

test("GET com clínica/billing válidos retorna configuração fechada por padrão (sem envs), sem auditoria", async () => {
  const antes = auditRows("clinica-a").length;
  const response = await invoke("GET", user("clinica-a"), { headers: { "x-tenant-id": "clinica-a" } });
  assert.equal(response.status, 200);
  const body = await response.json() as { configured: boolean; version: string; provider: string };
  assert.equal(body.configured, false);
  assert.equal(body.version, VERSION);
  assert.equal(body.provider, "Google Gemini");
  assert.equal(auditRows("clinica-a").length, antes, "GET nunca escreve auditoria de vídeo");
});

test("POST sem OBS60_VIDEO_AI_ENABLED etc. é indisponível, sem resultado simulado e sem auditoria", async () => {
  const antes = auditRows("clinica-a").length;
  const response = await invoke("POST", user("clinica-a"), { headers: { "x-tenant-id": "clinica-a", "Content-Type": "application/json" }, body: videoBody() });
  assert.equal(response.status, 503);
  assert.equal((await response.json() as { code?: string }).code, "VIDEO_AI_UNAVAILABLE");
  assert.equal(auditRows("clinica-a").length, antes);
});

test("POST configurado sem Content-Type JSON é rejeitado antes da auditoria", async () => {
  const antes = auditRows("clinica-a").length;
  const response = await invoke("POST", user("clinica-a"), { env: VIDEO_ENV, headers: { "x-tenant-id": "clinica-a" }, body: videoBody() });
  assert.equal(response.status, 415);
  assert.equal((await response.json() as { code?: string }).code, "INVALID_CONTENT_TYPE");
  assert.equal(auditRows("clinica-a").length, antes);
});

test("POST sem consentimento explícito é rejeitado antes da auditoria (parseInput roda antes do requestId)", async () => {
  const antes = auditRows("clinica-a").length;
  const response = await invoke("POST", user("clinica-a"), { env: VIDEO_ENV, headers: { "x-tenant-id": "clinica-a", "Content-Type": "application/json" }, body: videoBody({ consent: false }) });
  assert.equal(response.status, 403);
  assert.equal((await response.json() as { code?: string }).code, "CONSENT_REQUIRED");
  assert.equal(auditRows("clinica-a").length, antes, "nenhuma auditoria antes do consentimento validado");
});

test("caminho feliz: 200, resultado fechado em 6 registros, e auditoria requested→completed sem PHI", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = (async () => geminiResponse()) as typeof fetch;
    const response = await invoke("POST", user("clinica-a"), { env: VIDEO_ENV, headers: { "x-tenant-id": "clinica-a", "Content-Type": "application/json" }, body: videoBody() });
    assert.equal(response.status, 200);
    const body = await response.json() as { requestId: string; reviewRequired: true; result: { observations: unknown[] } };
    assert.equal(body.reviewRequired, true);
    assert.equal(body.result.observations.length, 6);
    assert.ok(body.requestId);

    const rows = auditRows("clinica-a", body.requestId);
    assert.deepEqual(rows.map((r) => r.action), ["obs60.video_ai.requested", "obs60.video_ai.completed"]);
    for (const row of rows) {
      assert.deepEqual(Object.keys(row.metadata).sort(), ["consent", "protocol"]);
      assert.equal(row.metadata.protocol, VERSION);
      assert.equal(row.metadata.consent, true);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("falha do provedor: 502, sem resultado, e auditoria fecha requested→failed com o código (sem corpo/segredo do provedor)", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = (async () => new Response("SECRET_TOKEN_AND_PHI", { status: 500 })) as typeof fetch;
    const response = await invoke("POST", user("clinica-a"), { env: VIDEO_ENV, headers: { "x-tenant-id": "clinica-a", "Content-Type": "application/json" }, body: videoBody() });
    assert.equal(response.status, 502);
    const errorBody = await response.json() as { code?: string; error?: string };
    assert.equal(errorBody.code, "VIDEO_PROVIDER_FAILURE");
    assert.ok(!errorBody.error?.includes("SECRET"));

    // O requestId não volta no corpo de erro; localiza pela linha mais recente da clínica.
    const rows = auditRows("clinica-a");
    const last2 = rows.slice(-2);
    assert.deepEqual(last2.map((r) => r.action), ["obs60.video_ai.requested", "obs60.video_ai.failed"]);
    assert.equal(last2[0].targetId, last2[1].targetId, "requested e failed compartilham o mesmo requestId");
    assert.equal(last2[1].metadata.code, "VIDEO_PROVIDER_FAILURE");
    assert.deepEqual(Object.keys(last2[1].metadata).sort(), ["code", "consent", "protocol"]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
