/**
 * lgpd-deletion-four-eyes.test.ts — a mesma pessoa nunca solicita E aprova a
 * eliminação física de um paciente (LTB-10, docs/audits/SAAS_TENANCY_AUDIT_2026-09-26.md).
 *
 * Achado original: `POST /api/live/governance` (criar) e `PATCH .../governance`
 * (aprovar) só exigiam `membershipCanManage`, sem comparar requester e
 * approver — um único gestor conseguia criar, aprovar e (via run-deletion)
 * executar sozinho a eliminação irreversível do prontuário de um paciente.
 * Este teste prova RED (sem a trava) → aplica a trava em
 * functions/api/live/governance/index.ts → prova BLUE (com a trava).
 *
 * Fora de escopo deste teste (permanece LEGAL_REVIEW_REQUIRED, não alterado
 * aqui): o piso mínimo de retenção do prontuário para eliminação de escopo
 * 'patient' numa clínica ATIVA. `evaluateDeletionEligibility` deliberadamente
 * não exige retentionUntil nesse caso — ver tests/unit/cliente-zero-journey.test.ts,
 * que exercita um pedido de eliminação como exercício legítimo de direito do
 * titular (LGPD art. 18) numa clínica ativa. Mudar esse comportamento é
 * decisão jurídico-regulatória (Lei 13.787/2018 vs. LGPD art. 16), não deste
 * teste.
 *
 * Rodar: node --import tsx tests/unit/lgpd-deletion-four-eyes.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

import { onRequestPost as governancePost, onRequestPatch as governancePatch } from "../../functions/api/live/governance/index";

const CLINIC = "clinic-four-eyes-synthetic";
const GESTOR_A = "gestor-a-synthetic";
const GESTOR_B = "gestor-b-synthetic";
const PATIENT = "patient-four-eyes-synthetic";

const raw = new DatabaseSync(":memory:");
raw.exec("PRAGMA foreign_keys = OFF");
raw.exec(readFileSync("db/schema.d1.sql", "utf8"));
const superseded: string[] = [];
for (const name of readdirSync("db/migrations").filter((f) => f.endsWith(".sql")).sort()) {
  try {
    raw.exec(readFileSync(`db/migrations/${name}`, "utf8"));
  } catch (error) {
    assert.match(String(error), /duplicate column name/i, `migração ${name}: ${String(error)}`);
    superseded.push(name);
  }
}
assert.deepEqual(superseded, ["0001_users_auth.sql", "0002_patient_ownership.sql"]);
raw.exec("PRAGMA foreign_keys = ON");

function makeDb(database: DatabaseSync): D1Database {
  const prepare = (sql: string) => {
    const bound = (args: unknown[]) => ({
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
      sql,
    });
    return { ...bound([]), bind: (...args: unknown[]) => bound(args) };
  };
  return {
    prepare,
    async batch(statements: Array<{ run(): Promise<unknown> }>) {
      database.exec("BEGIN");
      try {
        const results = [];
        for (const statement of statements) results.push(await statement.run());
        database.exec("COMMIT");
        return results;
      } catch (error) {
        database.exec("ROLLBACK");
        throw error;
      }
    },
  } as unknown as D1Database;
}
const db = makeDb(raw);

for (const id of [GESTOR_A, GESTOR_B]) {
  raw.prepare("INSERT INTO users (id, name, email, role, is_active) VALUES (?, ?, ?, 'professional', 1)")
    .run(id, `Synthetic ${id}`, `${id}@example.test`);
}
raw.prepare("INSERT INTO clinics (id, slug, name, created_by_user_id) VALUES (?, ?, ?, ?)")
  .run(CLINIC, CLINIC, "Clínica Quatro Olhos", GESTOR_A);
raw.prepare("INSERT INTO clinic_memberships (clinic_id, user_id, role) VALUES (?, ?, 'owner')").run(CLINIC, GESTOR_A);
raw.prepare("INSERT INTO clinic_memberships (clinic_id, user_id, role) VALUES (?, ?, 'clinic_admin')").run(CLINIC, GESTOR_B);
raw.prepare(
  `INSERT INTO live_patients (id, clinic_id, created_by_user_id, profile_encrypted)
   VALUES (?, ?, ?, 'cipher-sintetico')`,
).run(PATIENT, CLINIC, GESTOR_A);

const env = {
  DB: db,
  CLINICAL_LIVE_ENABLED: "true",
  CLINICAL_DATA_KEY: "chave-clinica-de-teste-com-32-chars!",
  CLINICAL_INDEX_KEY: "chave-indice-de-teste-com-32-caracteres",
};

interface Sessao { id: string; role: string }

function ctx(request: Request, user: Sessao) {
  return {
    env,
    request,
    params: {},
    data: { authUser: user },
    waitUntil: () => undefined,
    next: async () => new Response(null),
  } as never;
}
const req = (url: string, method: string, body?: unknown) =>
  new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

const gestorA: Sessao = { id: GESTOR_A, role: "professional" };
const gestorB: Sessao = { id: GESTOR_B, role: "professional" };

function statusDoPedido(tabela: string, id: string): string {
  return (raw.prepare(`SELECT status FROM ${tabela} WHERE id = ?`).get(id) as { status: string }).status;
}

// ═══ 1. Criar o pedido de eliminação como gestora A ═════════════════════════
const pedidoId = await (async () => {
  const resposta = await governancePost(
    ctx(
      req("https://x.test/api/live/governance", "POST", {
        clinicId: CLINIC,
        requestType: "delete",
        scope: "patient",
        patientId: PATIENT,
        reason: "Pedido sintético de teste do controle de quatro olhos.",
      }),
      gestorA,
    ),
  );
  assert.equal(resposta.status, 201, "gestora A solicita a eliminação");
  const corpo = (await resposta.json()) as { id: string; status: string };
  assert.equal(corpo.status, "requested");
  return corpo.id;
})();

// ═══ 2. A MESMA gestora não pode aprovar o próprio pedido ═══════════════════
{
  const resposta = await governancePatch(
    ctx(
      req("https://x.test/api/live/governance", "PATCH", {
        clinicId: CLINIC,
        requestType: "delete",
        requestId: pedidoId,
        status: "approved",
      }),
      gestorA,
    ),
  );
  assert.equal(resposta.status, 409, "autoaprovação deve ser recusada");
  const corpo = (await resposta.json()) as { code: string };
  assert.equal(corpo.code, "FOUR_EYES_REQUIRED");
  assert.equal(statusDoPedido("live_deletion_requests", pedidoId), "requested", "o pedido não pode avançar sozinho");
}

// ═══ 3. Uma segunda gestora, diferente da solicitante, aprova normalmente ═══
{
  const resposta = await governancePatch(
    ctx(
      req("https://x.test/api/live/governance", "PATCH", {
        clinicId: CLINIC,
        requestType: "delete",
        requestId: pedidoId,
        status: "approved",
      }),
      gestorB,
    ),
  );
  assert.equal(resposta.status, 200, "segundo gestor aprova o pedido de outra pessoa");
  assert.equal(statusDoPedido("live_deletion_requests", pedidoId), "approved");
}

// ═══ 4. A trava é específica de 'delete': export continua sem quatro olhos ══
// (exportação não apaga nada; o self-service de portabilidade não pode
// exigir um segundo gestor para uma titular exportar os próprios dados.)
{
  const criacao = await governancePost(
    ctx(
      req("https://x.test/api/live/governance", "POST", {
        clinicId: CLINIC,
        requestType: "export",
        scope: "patient",
        patientId: PATIENT,
      }),
      gestorA,
    ),
  );
  assert.equal(criacao.status, 201);
  const exportId = ((await criacao.json()) as { id: string }).id;

  const aprovacao = await governancePatch(
    ctx(
      req("https://x.test/api/live/governance", "PATCH", {
        clinicId: CLINIC,
        requestType: "export",
        requestId: exportId,
        status: "approved",
      }),
      gestorA,
    ),
  );
  assert.equal(aprovacao.status, 200, "export não exige segundo gestor para autoaprovação");
  assert.equal(statusDoPedido("live_export_requests", exportId), "approved");
}

raw.close();
console.log("✓ eliminação LGPD: a mesma pessoa não solicita e aprova (LTB-10); export permanece sem essa exigência");

