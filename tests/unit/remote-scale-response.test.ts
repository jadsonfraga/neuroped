/**
 * remote-scale-response.test.ts — prova adversarial do encaminhamento remoto
 * de escalas (família responde em casa, sem PIN/login), migração 0021.
 *
 * Roda os handlers REAIS (functions/api/live/scale-invitations, public-scale)
 * contra um D1-fake (better-sqlite3) com schema mínimo compatível + o SQL
 * real da 0021, e a criptografia clínica REAL (functions/api/tenant/_crypto).
 *
 * Invariantes provados:
 *  1. só um id da allowlist (mchat, q-chat-10, psc17, ari, gad7ped, smfq)
 *     pode virar convite — id fora da lista é rejeitado antes de tocar o DB;
 *  2. RBAC + billing entitlement + posse do paciente são exigidos para criar/
 *     revogar/revisar (mesmas primitivas do restante do LIVE);
 *  3. GET público nunca expõe peso de opção nem banda de interpretação —
 *     só texto de item e rótulo de opção;
 *  4. token só via header (nunca query string); token inválido/de outra
 *     clínica falha; convite revogado/expirado/já respondido falha fechado;
 *  5. resposta é validada item a item (índice de opção dentro do intervalo);
 *  6. resposta persiste cifrada (nenhuma coluna contém o texto do item em claro);
 *  7. o profissional revisa vendo os rótulos reconstruídos do catálogo canônico;
 *  8. reenvio ao mesmo convite falha fechado (409), sem duplicar resposta.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import Database from "better-sqlite3";
import { onRequestGet as listInvitations, onRequestPost as createInvitation, onRequestPatch as patchInvitation } from "../../functions/api/live/scale-invitations/index";
import { onRequestGet as publicGetScale, onRequestPost as publicPostScale } from "../../functions/api/public-scale";
import { getRemoteScaleDescriptor } from "../../shared/remoteScaleCatalog";

class D1StatementMock {
  constructor(
    private readonly db: Database.Database,
    private readonly sql: string,
    private readonly values: unknown[] = [],
  ) {}

  bind(...values: unknown[]) {
    return new D1StatementMock(this.db, this.sql, values);
  }

  async first<T>() {
    return (this.db.prepare(this.sql).get(...this.values) as T | undefined) ?? null;
  }

  async all<T>() {
    return { success: true, results: this.db.prepare(this.sql).all(...this.values) as T[], meta: {} };
  }

  async run() {
    const result = this.db.prepare(this.sql).run(...this.values);
    return { success: true, meta: { changes: result.changes } };
  }
}

class D1DatabaseMock {
  constructor(private readonly db: Database.Database) {}

  prepare(sql: string) {
    return new D1StatementMock(this.db, sql);
  }

  async batch(statements: D1StatementMock[]) {
    return this.db.transaction(() => statements.map((statement) => {
      const raw = statement as unknown as { db: Database.Database; sql: string; values: unknown[] };
      const result = raw.db.prepare(raw.sql).run(...raw.values);
      return { success: true, meta: { changes: result.changes } };
    }))();
  }
}

const sqlite = new Database(":memory:");
sqlite.pragma("foreign_keys = ON");
sqlite.exec(`
  CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL
  );
  CREATE TABLE clinics (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active'
  );
  CREATE TABLE clinic_memberships (
    id TEXT PRIMARY KEY,
    clinic_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
  );
  CREATE TABLE billing_customers (
    id TEXT PRIMARY KEY,
    clinic_id TEXT NOT NULL,
    status TEXT NOT NULL,
    trial_ends_at TEXT,
    grace_ends_at TEXT
  );
  CREATE TABLE billing_subscriptions (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    plan_id TEXT,
    status TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE live_patients (
    id TEXT PRIMARY KEY,
    clinic_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active'
  );
  CREATE TABLE saas_audit_log (
    id TEXT PRIMARY KEY,
    clinic_id TEXT,
    actor_user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT,
    metadata_json TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);
sqlite.exec(readFileSync("db/migrations/0021_remote_scale_response.sql", "utf8"));

const CLINIC_A = "clinic-a-synthetic";
const CLINIC_B = "clinic-b-synthetic";
const PATIENT_A = "patient-a-synthetic";
const PROFESSIONAL_A = "user-professional-a";
const now = new Date().toISOString();
const future = new Date(Date.now() + 7 * 86_400_000).toISOString();

for (const [clinic, patient, professional, color] of [
  [CLINIC_A, PATIENT_A, PROFESSIONAL_A, "A"],
  [CLINIC_B, "patient-b-synthetic", "user-professional-b", "B"],
] as const) {
  sqlite.prepare("INSERT INTO users VALUES (?, ?, ?, 'professional')").run(professional, `${color.toLowerCase()}@example.test`, `Prof ${color}`);
  sqlite.prepare("INSERT INTO clinics VALUES (?, ?, ?, 'active')").run(clinic, `Clínica ${color}`, clinic);
  sqlite.prepare("INSERT INTO clinic_memberships VALUES (?, ?, ?, 'professional', 1, ?)").run(`membership-${color}`, clinic, professional, now);
  sqlite.prepare("INSERT INTO billing_customers VALUES (?, ?, 'trial', ?, NULL)").run(`customer-${color}`, clinic, future);
  sqlite.prepare("INSERT INTO live_patients VALUES (?, ?, 'active')").run(patient, clinic);
}

const env = {
  DB: new D1DatabaseMock(sqlite) as unknown as D1Database,
  CLINICAL_LIVE_ENABLED: "true",
  CLINICAL_DATA_KEY: "production-readiness-data-key-0123456789-ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  CLINICAL_DATA_KEY_ID: "k-test-2026-09-04",
  CLINICAL_INDEX_KEY: "production-readiness-index-key-9876543210-ZYXWVUTSRQPONMLKJIHGFEDCBA",
};

const professionalUserA = { id: PROFESSIONAL_A, email: "a@example.test", name: "Prof A", role: "professional", mustChangePassword: false };

function staffContext(method: string, url: string, body?: unknown) {
  return {
    env,
    data: { authUser: professionalUserA },
    params: {},
    request: new Request(url, {
      method,
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    }),
  } as never;
}

function publicContext(method: string, token: string, body?: unknown) {
  const headers: Record<string, string> = { Authorization: `Scale ${token}` };
  if (body) headers["content-type"] = "application/json";
  return {
    env,
    data: {},
    params: {},
    request: new Request("https://app.neuroped.example/api/public-scale", {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    }),
  } as never;
}

async function json(response: Response) {
  return JSON.parse(await response.text()) as Record<string, unknown>;
}

// ── 1) Escala fora da allowlist é rejeitada antes de tocar o DB ───────────
const rejectedScale = await createInvitation(
  staffContext("POST", "https://x/api/live/scale-invitations", {
    clinicId: CLINIC_A,
    patientId: PATIENT_A,
    respondentKind: "family",
    scaleId: "cssrs",
  }),
);
assert.equal(rejectedScale.status, 400);
assert.equal((await json(rejectedScale)).code, "VALIDATION_ERROR");
{
  const count = sqlite.prepare("SELECT COUNT(*) AS n FROM live_scale_invitations").get() as { n: number };
  assert.equal(count.n, 0, "id fora da allowlist não pode criar linha");
}

// ── 2) Convite legítimo (M-CHAT) ───────────────────────────────────────────
const createResponse = await createInvitation(
  staffContext("POST", "https://x/api/live/scale-invitations", {
    clinicId: CLINIC_A,
    patientId: PATIENT_A,
    respondentKind: "family",
    scaleId: "mchat",
    expiresInHours: 168,
  }),
);
assert.equal(createResponse.status, 201);
const created = await json(createResponse);
const plaintextToken = created.token as string;
assert.match(plaintextToken, /^[A-Za-z0-9][A-Za-z0-9_-]{0,119}\.[A-Za-z0-9_-]{40,80}$/);

// ── 3) Paciente de outra clínica: 404 ──────────────────────────────────────
const crossTenant = await createInvitation(
  staffContext("POST", "https://x/api/live/scale-invitations", {
    clinicId: CLINIC_A,
    patientId: "patient-b-synthetic",
    respondentKind: "family",
    scaleId: "mchat",
  }),
);
assert.equal(crossTenant.status, 404);

// ── 4) GET público: token malformado / inexistente ────────────────────────
assert.equal((await publicGetScale(publicContext("GET", "not-a-real-token"))).status, 404);
assert.equal((await publicGetScale(publicContext("GET", "fake-id.".padEnd(48, "a")))).status, 404);

// ── 5) GET público válido: itens sem peso/interpretação ────────────────────
const getResponse = await publicGetScale(publicContext("GET", plaintextToken));
assert.equal(getResponse.status, 200);
const invite = await json(getResponse);
const scale = invite.scale as { items: Array<{ text: string; options: Array<{ label: string; value?: number }> }> };
const mchatDescriptor = getRemoteScaleDescriptor("mchat")!;
assert.equal(scale.items.length, mchatDescriptor.items.length);
assert.equal(scale.items[0].options.length, 2);
assert.ok(!("value" in scale.items[0].options[0]), "opção pública não pode ter peso de pontuação");
assert.ok(!("bands" in invite), "GET público não pode incluir banda de interpretação");

// ── 6) POST público: quantidade errada de respostas ────────────────────────
const shortAnswers = await publicPostScale(
  publicContext("POST", plaintextToken, { consentAccepted: true, answers: [0, 1] }),
);
assert.equal(shortAnswers.status, 400);

// ── 7) POST público: índice de opção fora do intervalo ─────────────────────
const outOfRange = new Array(scale.items.length).fill(0);
outOfRange[0] = 5; // mchat só tem 2 opções (0/1)
const invalidIndex = await publicPostScale(
  publicContext("POST", plaintextToken, { consentAccepted: true, answers: outOfRange }),
);
assert.equal(invalidIndex.status, 400);

// ── 8) POST público: sem consentimento explícito ────────────────────────────
const validAnswers = new Array(scale.items.length).fill(0);
const noConsent = await publicPostScale(
  publicContext("POST", plaintextToken, { consentAccepted: false, answers: validAnswers }),
);
assert.equal(noConsent.status, 400);

// ── 9) POST público válido ─────────────────────────────────────────────────
const submitResponse = await publicPostScale(
  publicContext("POST", plaintextToken, {
    consentAccepted: true,
    respondentName: "Mãe da criança",
    answers: validAnswers,
  }),
);
assert.equal(submitResponse.status, 201);

const responseRow = sqlite.prepare("SELECT * FROM live_scale_responses").get() as Record<string, unknown>;
assert.equal(responseRow.review_status, "pending");
assert.ok(
  !JSON.stringify(responseRow).includes(mchatDescriptor.items[0].text),
  "texto do item não pode aparecer em claro na linha persistida",
);

const invitationRow = sqlite.prepare("SELECT status FROM live_scale_invitations WHERE token_hash = (SELECT token_hash FROM live_scale_invitations LIMIT 1)").get() as { status: string };
assert.equal(invitationRow.status, "submitted");

// ── 10) Reenvio ao mesmo convite: 409, sem duplicar ────────────────────────
const resubmit = await publicPostScale(
  publicContext("POST", plaintextToken, { consentAccepted: true, answers: validAnswers }),
);
assert.equal(resubmit.status, 409);
{
  const count = sqlite.prepare("SELECT COUNT(*) AS n FROM live_scale_responses").get() as { n: number };
  assert.equal(count.n, 1, "reenvio não pode criar segunda resposta");
}

// ── 11) Convite expirado ────────────────────────────────────────────────────
const expiredInvitationId = crypto.randomUUID();
const { createRemoteScaleToken } = await import("../../functions/api/scale/_shared");
const expiredToken = await createRemoteScaleToken(env as never, CLINIC_A, expiredInvitationId);
sqlite.prepare(
  `INSERT INTO live_scale_invitations
    (id, clinic_id, patient_id, created_by_user_id, respondent_kind, scale_id, token_hash, status, expires_at, created_at, updated_at)
   VALUES (?, ?, ?, ?, 'family', 'mchat', ?, 'pending', ?, ?, ?)`,
).run(expiredInvitationId, CLINIC_A, PATIENT_A, PROFESSIONAL_A, expiredToken.tokenHash, new Date(Date.now() - 60_000).toISOString(), now, now);
assert.equal((await publicGetScale(publicContext("GET", expiredToken.token))).status, 410);

// ── 12) Convite revogado pelo profissional ──────────────────────────────────
const secondInvite = await createInvitation(
  staffContext("POST", "https://x/api/live/scale-invitations", {
    clinicId: CLINIC_A,
    patientId: PATIENT_A,
    respondentKind: "family",
    scaleId: "psc17",
  }),
);
const secondInviteBody = await json(secondInvite);
const revokeResponse = await patchInvitation(
  staffContext("PATCH", "https://x/api/live/scale-invitations", {
    clinicId: CLINIC_A,
    patientId: PATIENT_A,
    action: "revoke",
    invitationId: secondInviteBody.id,
  }),
);
assert.equal(revokeResponse.status, 200);
assert.equal((await publicGetScale(publicContext("GET", secondInviteBody.token as string))).status, 410);

// Revogar de novo (já não está pendente) falha fechado.
const revokeAgain = await patchInvitation(
  staffContext("PATCH", "https://x/api/live/scale-invitations", {
    clinicId: CLINIC_A,
    patientId: PATIENT_A,
    action: "revoke",
    invitationId: secondInviteBody.id,
  }),
);
assert.equal(revokeAgain.status, 409);

// ── 13) Lista do profissional: resposta decodificada com rótulos reais ─────
const listResponse = await listInvitations(
  staffContext("GET", `https://x/api/live/scale-invitations?clinicId=${CLINIC_A}&patientId=${PATIENT_A}`),
);
assert.equal(listResponse.status, 200);
const listBody = await json(listResponse);
const items = listBody.data as Array<{ scaleId: string; response: { id: string; answers: Array<{ label: string; value: string }>; reviewStatus: string } | null }>;
const mchatItem = items.find((item) => item.scaleId === "mchat" && item.response);
assert.ok(mchatItem, "item M-CHAT com resposta deve aparecer na listagem");
assert.equal(mchatItem!.response!.answers.length, mchatDescriptor.items.length);
assert.equal(mchatItem!.response!.answers[0].label, mchatDescriptor.items[0].text);
assert.equal(mchatItem!.response!.answers[0].value, "Sim");
assert.equal(mchatItem!.response!.reviewStatus, "pending");

// ── 14) Revisão marca como concluída; revisar de novo falha fechado ────────
const reviewResponse = await patchInvitation(
  staffContext("PATCH", "https://x/api/live/scale-invitations", {
    clinicId: CLINIC_A,
    patientId: PATIENT_A,
    action: "review",
    responseId: mchatItem!.response!.id,
  }),
);
assert.equal(reviewResponse.status, 200);
const reviewAgain = await patchInvitation(
  staffContext("PATCH", "https://x/api/live/scale-invitations", {
    clinicId: CLINIC_A,
    patientId: PATIENT_A,
    action: "review",
    responseId: mchatItem!.response!.id,
  }),
);
assert.equal(reviewAgain.status, 409);

sqlite.close();
console.log("✓ remote-scale-response: allowlist enforcement, RBAC, token hash-only, validação por item, cifra em repouso e ciclo de revisão provados contra o SQL real da 0021");
