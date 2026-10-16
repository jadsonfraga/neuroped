/**
 * Multiclínica (item 6): isolamento entre tenants, perfis de permissão mínima e marca da clínica.
 * Roda os handlers REAIS + middleware global + todas as migrações em SQLite (node:sqlite; Node >= 22,
 * como no CI). Dados 100% fictícios.
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { onRequest as globalMiddleware } from "../../functions/api/_middleware";
import { onRequestGet as getClinic, onRequestPatch as patchClinic } from "../../functions/api/tenants/[id]/index";
import { onRequestGet as listDocuments, onRequestPost as createDocument } from "../../functions/api/live/documents/index";
import { onRequestGet as listShares, onRequestPost as createShare } from "../../functions/api/live/family-portal/index";
import { onRequestGet as publicGet, onRequestPost as publicPost } from "../../functions/api/public-family-portal";
import { onRequestPatch as revokeShare } from "../../functions/api/live/family-portal/index";
import { createSessionTokens } from "../../functions/api/auth/_sessions";
import { getUserById } from "../../functions/api/auth/_shared";

const SECRET = "synthetic-multiclinic-session-secret-32chars-min";
const ALFA = "clinica-alfa-sintetica";
const BETA = "clinica-beta-sintetica";
const PNG_1PX = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

async function fixture() {
  const raw = new DatabaseSync(":memory:");
  raw.exec("PRAGMA foreign_keys = OFF");
  raw.exec(readFileSync("db/schema.d1.sql", "utf8"));
  for (const name of readdirSync("db/migrations").filter((n) => n.endsWith(".sql")).sort()) {
    try { raw.exec(readFileSync(`db/migrations/${name}`, "utf8")); } catch (e) { assert.match(String(e), /duplicate column name/); }
  }
  raw.exec("PRAGMA foreign_keys = ON");
  const prepare = (sql: string) => {
    const bound = (args: unknown[]) => ({
      async first<T>() { return (raw.prepare(sql).get(...args as never[]) as T | undefined) ?? null; },
      async all<T>() { return { results: raw.prepare(sql).all(...args as never[]) as T[] }; },
      async run() { return { meta: { changes: Number(raw.prepare(sql).run(...args as never[]).changes) } }; },
      sql,
    });
    return { ...bound([]), bind: (...args: unknown[]) => bound(args) };
  };
  const db = {
    prepare,
    async batch(statements: Array<{ run(): Promise<unknown> }>) {
      raw.exec("BEGIN");
      try { const out = []; for (const s of statements) out.push(await s.run()); raw.exec("COMMIT"); return out; }
      catch (e) { raw.exec("ROLLBACK"); throw e; }
    },
  } as unknown as D1Database;

  const users: Record<string, string> = { "owner-a": "professional", "owner-b": "professional", "prof-a": "professional", "sec-a": "operator", "prof-b": "professional", "admin-a": "professional", "fin-a": "reader" };
  for (const [id, role] of Object.entries(users)) {
    raw.prepare("INSERT INTO users (id, name, email, role, is_active) VALUES (?, ?, ?, ?, 1)").run(id, `Fictício ${id}`, `${id}@example.test`, role);
  }
  for (const [id, owner] of [[ALFA, "owner-a"], [BETA, "owner-b"]]) {
    raw.prepare("INSERT INTO clinics (id, slug, name, created_by_user_id) VALUES (?, ?, ?, ?)").run(id, id, id, owner);
    raw.prepare("UPDATE billing_subscriptions SET seats = 20 WHERE customer_id IN (SELECT id FROM billing_customers WHERE clinic_id = ?)").run(id);
    raw.prepare("INSERT INTO clinic_memberships (clinic_id, user_id, role) VALUES (?, ?, 'owner')").run(id, owner);
  }
  for (const [clinic, user, role] of [[ALFA, "prof-a", "professional"], [ALFA, "sec-a", "assistant"], [ALFA, "admin-a", "clinic_admin"], [ALFA, "fin-a", "financial"], [BETA, "prof-b", "professional"]]) {
    raw.prepare("INSERT INTO clinic_memberships (clinic_id, user_id, role) VALUES (?, ?, ?)").run(clinic, user, role);
  }
  for (const [pid, clinic, who] of [["paciente-alfa", ALFA, "prof-a"], ["paciente-beta", BETA, "prof-b"]]) {
    raw.prepare("INSERT INTO live_patients (id, clinic_id, created_by_user_id, profile_encrypted) VALUES (?, ?, ?, 'cifrado-ficticio')").run(pid, clinic, who);
  }
  const tokens: Record<string, string> = {};
  for (const id of Object.keys(users)) {
    const row = await getUserById(db, id);
    assert.ok(row);
    tokens[id] = (await createSessionTokens(db, row, SECRET)).accessToken;
  }
  const env = {
    DB: db, NEUROPED_JWT_SECRET: SECRET, ENVIRONMENT: "production", CLINICAL_LIVE_ENABLED: "true",
    CLINICAL_DATA_KEY: "multiclinic-data-key-0123456789-ABCDEFGHIJKLMNOPQRSTUVWXYZ", CLINICAL_DATA_KEY_ID: "k-mc-1",
    CLINICAL_INDEX_KEY: "multiclinic-index-key-9876543210-ZYXWVUTSRQPONMLKJIHGFEDCBA",
  };
  let n = 0;
  async function call(user: string, handler: (c: never) => Promise<Response> | Response, path: string, method = "GET", body?: unknown, tenantHeader?: string) {
    const url = new URL(path, "https://neuroped.test");
    const match = /^\/api\/tenants\/([^/]+)/.exec(url.pathname);
    const context = {
      request: new Request(url, {
        method,
        headers: { Authorization: `Bearer ${tokens[user]}`, "Content-Type": "application/json", ...(tenantHeader ? { "X-Tenant-Id": tenantHeader } : {}), "CF-Connecting-IP": `203.0.${++n}.9` },
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
      env, data: {}, params: { id: match?.[1] ?? "" }, waitUntil: () => undefined,
      next: async () => handler(context as never),
    };
    return globalMiddleware(context as never);
  }
  return { raw, call, env };
}

const snap = (raw: DatabaseSync, clinic: string) => ({
  branding: raw.prepare("SELECT * FROM clinic_branding WHERE clinic_id = ?").get(clinic) ?? null,
  settings: raw.prepare("SELECT * FROM clinic_settings WHERE clinic_id = ?").get(clinic) ?? null,
  docs: raw.prepare("SELECT id FROM live_documents WHERE clinic_id = ? ORDER BY id").all(clinic),
});

test("marca: só gestor altera; tenant vizinho e perfis sem gestão ficam intactos", async () => {
  const f = await fixture();
  try {
    const branding = { primaryColor: "#123a5c", accentColor: "#f2c14e", headerText: "Clínica Alfa · Neuropediatria", footerText: "Rodapé institucional fictício", logoDataUri: PNG_1PX };
    const before = snap(f.raw, BETA);

    // proprietário e administrador da ALFA salvam a marca
    for (const user of ["owner-a", "admin-a"]) {
      const r = await f.call(user, patchClinic as never, `/api/tenants/${ALFA}`, "PATCH", { branding }, ALFA);
      assert.equal(r.status, 200, user);
    }
    const got = await f.call("owner-a", getClinic as never, `/api/tenants/${ALFA}`, "GET", undefined, ALFA);
    const payload = await got.json() as { branding: { primaryColor: string; logoDataUri: string; configured: boolean } };
    assert.equal(payload.branding.primaryColor, "#123a5c");
    assert.equal(payload.branding.logoDataUri, PNG_1PX);
    assert.equal(payload.branding.configured, true);

    // BETA não mudou e continua sem marca
    assert.deepEqual(snap(f.raw, BETA), before);
    const betaGet = await f.call("owner-b", getClinic as never, `/api/tenants/${BETA}`, "GET", undefined, BETA);
    assert.equal(((await betaGet.json()) as { branding: { configured: boolean } }).branding.configured, false);

    // sem gestão (profissional, secretaria, financeiro) não altera
    for (const user of ["prof-a", "sec-a", "fin-a"]) {
      const r = await f.call(user, patchClinic as never, `/api/tenants/${ALFA}`, "PATCH", { branding: { ...branding, headerText: "INVADIDO" } }, ALFA);
      assert.equal(r.status, 403, user);
    }
    assert.equal((f.raw.prepare("SELECT header_text FROM clinic_branding WHERE clinic_id = ?").get(ALFA) as { header_text: string }).header_text, "Clínica Alfa · Neuropediatria");

    // gestor da ALFA não toca a BETA, nem com X-Tenant-Id forjado
    for (const header of [ALFA, BETA]) {
      const r = await f.call("owner-a", patchClinic as never, `/api/tenants/${BETA}`, "PATCH", { branding: { ...branding, headerText: "INVADIDO" } }, header);
      assert.ok([403, 404].includes(r.status), `header ${header}: ${r.status}`);
    }
    assert.deepEqual(snap(f.raw, BETA), before);
    // e não lê a BETA
    const peek = await f.call("owner-a", getClinic as never, `/api/tenants/${BETA}`, "GET", undefined, ALFA);
    assert.ok([403, 404].includes(peek.status));
  } finally { f.raw.close(); }
});

test("marca: validação (SVG, contraste, cor inválida) e logo preservado quando omitido", async () => {
  const f = await fixture();
  try {
    const patch = (branding: unknown) => f.call("owner-a", patchClinic as never, `/api/tenants/${ALFA}`, "PATCH", { branding }, ALFA);
    const svg = "data:image/svg+xml;base64," + Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'><script>alert(1)</script></svg>").toString("base64");
    assert.equal((await patch({ logoDataUri: svg })).status, 400);
    // PNG declarado, bytes de outro tipo
    assert.equal((await patch({ logoDataUri: "data:image/png;base64," + Buffer.from("not-a-png-at-all").toString("base64") })).status, 400);
    assert.equal((await patch({ primaryColor: "#ffffe0" })).status, 400); // claro demais para texto branco
    assert.equal((await patch({ primaryColor: "azul" })).status, 400);
    assert.equal((await patch({ primaryColor: "#123a5c", accentColor: "#143b5e" })).status, 400); // destaque sem contraste
    assert.equal(f.raw.prepare("SELECT COUNT(*) AS n FROM clinic_branding").get()?.n, 0);

    assert.equal((await patch({ primaryColor: "#123a5c", logoDataUri: PNG_1PX, headerText: "A" })).status, 200);
    // atualização sem logoDataUri mantém o logo; com null remove
    assert.equal((await patch({ primaryColor: "#123a5c", headerText: "B" })).status, 200);
    assert.equal((f.raw.prepare("SELECT logo_data_uri FROM clinic_branding WHERE clinic_id = ?").get(ALFA) as { logo_data_uri: string }).logo_data_uri, PNG_1PX);
    assert.equal((await patch({ primaryColor: "#123a5c", headerText: "B", logoDataUri: null })).status, 200);
    assert.equal((f.raw.prepare("SELECT logo_data_uri FROM clinic_branding WHERE clinic_id = ?").get(ALFA) as { logo_data_uri: string | null }).logo_data_uri, null);

    // auditoria: só nomes de campos, nunca conteúdo da marca
    const audit = f.raw.prepare("SELECT metadata_json FROM saas_audit_log WHERE clinic_id = ? AND action = 'clinic_update'").all(ALFA) as Array<{ metadata_json: string }>;
    assert.ok(audit.length >= 3);
    for (const row of audit) { assert.doesNotMatch(row.metadata_json, /#123a5c|data:image|"A"|"B"/); assert.match(row.metadata_json, /branding/); }
  } finally { f.raw.close(); }
});

test("isolamento clínico: um tenant nunca lê documentos de outro; secretaria não lê conteúdo clínico", async () => {
  const f = await fixture();
  try {
    const mk = (user: string, clinicId: string, patientId: string, title: string) =>
      f.call(user, createDocument as never, "/api/live/documents", "POST", {
        clinicId, patientId, documentType: "report", origin: "clinician", status: "published", familyVisibility: false,
        content: { title, text: `Conteúdo sigiloso fictício ${title}` },
      }, clinicId);
    assert.equal((await mk("prof-a", ALFA, "paciente-alfa", "DOC-ALFA")).status, 201);
    assert.equal((await mk("prof-b", BETA, "paciente-beta", "DOC-BETA")).status, 201);

    const list = async (user: string, clinicId: string, patientId: string, header = clinicId) =>
      f.call(user, listDocuments as never, `/api/live/documents?clinicId=${clinicId}&patientId=${patientId}`, "GET", undefined, header);

    const own = await list("prof-a", ALFA, "paciente-alfa");
    assert.equal(own.status, 200);
    const ownBody = JSON.stringify(await own.json());
    assert.match(ownBody, /DOC-ALFA/);
    assert.doesNotMatch(ownBody, /DOC-BETA/);

    // cruzar clínica (pelo clinicId, pelo header, ou misturando paciente de outra clínica)
    for (const [clinic, patient, header] of [[BETA, "paciente-beta", BETA], [BETA, "paciente-beta", ALFA], [ALFA, "paciente-beta", ALFA]] as const) {
      const r = await list("prof-a", clinic, patient, header);
      const text = await r.text();
      assert.doesNotMatch(text, /DOC-BETA|sigiloso fictício DOC-BETA/, `${clinic}/${patient}/${header}`);
      if (clinic === BETA) assert.equal(r.status, 403);
    }
    // o dono da BETA não lê a ALFA
    assert.equal((await list("owner-b", ALFA, "paciente-alfa", BETA)).status, 403);
    assert.doesNotMatch(await (await list("prof-b", BETA, "paciente-beta")).text(), /DOC-ALFA/);

    // secretaria (assistant) e financeiro: sem leitura nem escrita clínica
    for (const user of ["sec-a", "fin-a"]) {
      assert.equal((await list(user, ALFA, "paciente-alfa")).status, 403, `${user} leitura`);
      assert.equal((await mk(user, ALFA, "paciente-alfa", "INVASOR")).status, 403, `${user} escrita`);
    }
    assert.equal(f.raw.prepare("SELECT COUNT(*) AS n FROM live_documents WHERE clinic_id = ?").get(ALFA)?.n, 1);
  } finally { f.raw.close(); }
});

test("portal da família: isolamento por clínica e secretaria sem acesso", async () => {
  const f = await fixture();
  try {
    const create = (user: string, clinicId: string, patientId: string, documentIds: string[] = []) =>
      f.call(user, createShare as never, "/api/live/family-portal", "POST", {
        clinicId, patientId, maxViews: 2, doctorReviewed: true,
        content: { orientacoes: [{ titulo: "Preparo", texto: "Leve os documentos." }], documentIds },
      }, clinicId);
    assert.equal((await create("prof-a", ALFA, "paciente-alfa")).status, 201);
    assert.equal((await create("sec-a", ALFA, "paciente-alfa")).status, 403);
    assert.equal((await create("prof-a", BETA, "paciente-beta")).status, 403);
    assert.equal((await create("prof-a", ALFA, "paciente-beta")).status, 404);

    // documento da BETA não entra num portal da ALFA
    const docB = await f.call("prof-b", createDocument as never, "/api/live/documents", "POST", { clinicId: BETA, patientId: "paciente-beta", documentType: "report", origin: "clinician", status: "published", familyVisibility: true, content: { title: "DOC-BETA", text: "texto beta" } }, BETA);
    const docBId = ((await docB.json()) as { id: string }).id;
    const leak = await create("prof-a", ALFA, "paciente-alfa", [docBId]);
    assert.equal(leak.status, 400);
    assert.doesNotMatch(await leak.text(), /texto beta/);

    const listed = (clinic: string, patient: string, user: string) => f.call(user, listShares as never, `/api/live/family-portal?clinicId=${clinic}&patientId=${patient}`, "GET", undefined, clinic);
    assert.equal((await listed(ALFA, "paciente-alfa", "prof-a")).status, 200);
    assert.equal((await listed(ALFA, "paciente-alfa", "sec-a")).status, 403);
    assert.equal((await listed(ALFA, "paciente-alfa", "prof-b")).status, 403);
    assert.equal(f.raw.prepare("SELECT COUNT(*) AS n FROM family_portal_shares WHERE clinic_id = ?").get(BETA)?.n, 0);
  } finally { f.raw.close(); }
});

test("portal da família (handlers reais): consentimento, abertura limitada, revogação e auditoria", async () => {
  const f = await fixture();
  try {
    const created = await f.call("prof-a", createShare as never, "/api/live/family-portal", "POST", {
      clinicId: ALFA, patientId: "paciente-alfa", maxViews: 2, expiresInHours: 24, doctorReviewed: true,
      content: {
        orientacoes: [{ titulo: "Preparo", texto: "Leve os documentos." }],
        avaliacoesProprias: [{ instrumento: "super-neuropad-game", data: "2026-10-01", comoRespondeu: "Participou com interesse." }],
      },
    }, ALFA);
    assert.equal(created.status, 201);
    const { token, id } = (await created.json()) as { token: string; id: string };
    const row = f.raw.prepare("SELECT token_hash, content_encrypted FROM family_portal_shares WHERE id = ?").get(id) as { token_hash: string; content_encrypted: string };
    assert.ok(!token.includes(row.token_hash), "o segredo não é guardado em claro");
    assert.doesNotMatch(row.content_encrypted, /Leve os documentos|Participou/, "conteúdo cifrado");

    const pub = (method: "GET" | "POST", body?: unknown, tk = token) =>
      (method === "GET" ? publicGet : publicPost)({
        request: new Request("https://neuroped.test/api/public-family-portal", { method, headers: { Authorization: `Portal ${tk}`, "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) }),
        env: f.env, data: {}, params: {}, waitUntil: () => undefined, next: async () => new Response(null),
      } as never) as Promise<Response>;
    const VERSION = "family-portal-lgpd-2026-10";

    // GET: só aviso de consentimento, sem conteúdo e sem consumir
    const meta = await pub("GET");
    assert.equal(meta.status, 200);
    const metaText = await meta.text();
    assert.doesNotMatch(metaText, /Leve os documentos|Participou/);
    assert.equal(f.raw.prepare("SELECT view_count FROM family_portal_shares WHERE id = ?").get(id)?.view_count, 0);

    // POST sem consentimento: recusado, nada consumido
    assert.equal((await pub("POST", { consentAccepted: false, consentVersion: VERSION })).status, 400);
    assert.equal((await pub("POST", { consentAccepted: true, consentVersion: "outra" })).status, 400);
    assert.equal(f.raw.prepare("SELECT view_count FROM family_portal_shares WHERE id = ?").get(id)?.view_count, 0);

    // token errado e token de outra clínica não abrem
    assert.equal((await pub("GET", undefined, `${id}.${"z".repeat(43)}`)).status, 404);
    assert.equal((await pub("GET", undefined, `inexistente.${"z".repeat(43)}`)).status, 404);

    // abertura 1 e 2 entregam; 3 é recusada
    const open1 = await pub("POST", { consentAccepted: true, consentVersion: VERSION });
    assert.equal(open1.status, 200);
    const body1 = (await open1.json()) as { content: { orientacoes: unknown[]; avaliacoesProprias: Array<Record<string, unknown>> }; remainingViews: number };
    assert.equal(body1.remainingViews, 1);
    assert.equal(body1.content.orientacoes.length, 1);
    // regra do médico: a avaliação própria só tem descrição, nunca nível/nota/classe
    assert.deepEqual(Object.keys(body1.content.avaliacoesProprias[0]).sort(), ["comoFoiFeita", "comoRespondeu", "data", "instrumento", "nome"]);
    assert.equal((await pub("POST", { consentAccepted: true, consentVersion: VERSION })).status, 200);
    assert.equal((await pub("POST", { consentAccepted: true, consentVersion: VERSION })).status, 429);
    assert.equal((await pub("GET")).status, 429);

    // trilha: consentimentos e visualizações só com metadados
    const actions = (f.raw.prepare("SELECT action, COUNT(*) AS n FROM family_portal_audit_log WHERE share_id = ? GROUP BY action").all(id) as Array<{ action: string; n: number }>);
    const byAction = Object.fromEntries(actions.map((a) => [a.action, a.n]));
    assert.equal(byAction.consent_accepted, 2);
    assert.equal(byAction.content_viewed, 2);
    assert.ok(byAction.denied_exhausted >= 1);

    // revogação: secretaria não pode; profissional pode; depois o link para de abrir
    const second = await f.call("prof-a", createShare as never, "/api/live/family-portal", "POST", { clinicId: ALFA, patientId: "paciente-alfa", maxViews: 3, doctorReviewed: true, content: { orientacoes: [{ titulo: "Preparo", texto: "Leve os documentos." }] } }, ALFA);
    const s2 = (await second.json()) as { token: string; id: string };
    const revoke = (user: string) => f.call(user, revokeShare as never, "/api/live/family-portal", "PATCH", { clinicId: ALFA, patientId: "paciente-alfa", shareId: s2.id, action: "revoke" }, ALFA);
    assert.equal((await revoke("sec-a")).status, 403);
    assert.equal((await revoke("prof-b")).status, 403);
    assert.equal((await revoke("prof-a")).status, 200);
    assert.equal((await pub("GET", undefined, s2.token)).status, 410);

    // clínica suspensa bloqueia o acesso público
    const third = await f.call("prof-a", createShare as never, "/api/live/family-portal", "POST", { clinicId: ALFA, patientId: "paciente-alfa", maxViews: 3, doctorReviewed: true, content: { orientacoes: [{ titulo: "Preparo", texto: "Leve os documentos." }] } }, ALFA);
    const s3 = (await third.json()) as { token: string };
    f.raw.prepare("UPDATE clinics SET status = 'suspended' WHERE id = ?").run(ALFA);
    assert.equal((await pub("GET", undefined, s3.token)).status, 410);
  } finally { f.raw.close(); }
});
