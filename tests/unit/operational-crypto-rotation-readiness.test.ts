/**
 * operational-crypto-rotation-readiness.test.ts
 *
 * O keyring v2 (#575) tornou a rotação de `OPERATIONAL_DATA_KEY` POSSÍVEL, mas
 * não EXECUTÁVEL: registros v1 só migram para v2 quando reescritos, e nada
 * dizia quantos sobraram. Aposentar `OPERATIONAL_DATA_KEY_PREVIOUS` sem essa
 * contagem transforma nome de responsável em `OPERATIONAL_DECRYPT_FAILED`.
 *
 * Roda contra o schema REAL (db/schema.d1.sql + todas as migrações, com
 * foreign_keys ligado). Nenhum dado real: os envelopes aqui são cabeçalhos
 * sintéticos e o "ciphertext" é a string 'corpo-sintetico'.
 *
 * Invariantes provados:
 *  1. inventário conta v1, v2 e a chave citada por cada envelope;
 *  2. envelope v1 remanescente BLOQUEIA a aposentadoria da chave anterior;
 *  3. envelope v2 citando a chave anterior BLOQUEIA;
 *  4. só com tudo na chave atual a aposentadoria é liberada;
 *  5. versão desconhecida bloqueia — "não sei dizer" nunca vira "pode";
 *  6. keyId fora do padrão do escritor é contado, NUNCA ecoado;
 *  7. tabela ausente do schema não vira zero silencioso;
 *  8. o inventário NUNCA lê o corpo do envelope (nenhum plaintext atravessa);
 *  9. a rota exige admin e recusa profissional/anônimo;
 * 10. a resposta não carrega segredo algum, só contagens e rótulos de chave;
 * 11. keyring mal configurado é REPORTADO, não engolido.
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import Database from "better-sqlite3";
import {
  OPERATIONAL_ENVELOPE_COLUMNS,
  assessPreviousKeyRetirement,
  collectOperationalEnvelopeInventory,
} from "../../functions/api/admin/_operationalEnvelopes";
import { operationalKeyringStatus } from "../../functions/api/operations/_core";
import { onRequestGet } from "../../functions/api/admin/operational-crypto";

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
    return (
      (this.db.prepare(this.sql).get(...this.values) as T | undefined) ?? null
    );
  }
  async all<T>() {
    return {
      success: true,
      results: this.db.prepare(this.sql).all(...this.values) as T[],
      meta: {},
    };
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
}

const sqlite = new Database(":memory:");
sqlite.pragma("foreign_keys = ON");
sqlite.exec(readFileSync("db/schema.d1.sql", "utf8"));
for (const file of readdirSync("db/migrations").sort()) {
  try {
    sqlite.exec(readFileSync(`db/migrations/${file}`, "utf8"));
  } catch (error) {
    const message = (error as Error).message;
    assert.match(
      message,
      /duplicate column name/,
      `migração ${file} não aplicou por um motivo inesperado: ${message}`,
    );
  }
}
const db = new D1DatabaseMock(sqlite) as unknown as D1Database;

const PROVIDER = "user-provider-sintetico";
const SERVICE = "service-sintetico";
const CORPO = "corpo-sintetico";

sqlite
  .prepare(
    `INSERT INTO users (id, name, email, role) VALUES (?, ?, ?, 'professional')`,
  )
  .run(PROVIDER, "Profissional Sintético", "provider@example.test");
sqlite
  .prepare(
    `INSERT INTO booking_services (id, provider_user_id, name, duration_minutes)
     VALUES (?, ?, 'Consulta sintética', 30)`,
  )
  .run(SERVICE, PROVIDER);

let sequencia = 0;
/** Insere um agendamento cujo guardian_name_encrypted é o envelope dado. */
function inserirAgendamento(envelope: string | null): string {
  sequencia += 1;
  const id = `appt-sintetico-${sequencia}`;
  const hora = String(6 + sequencia).padStart(2, "0");
  sqlite
    .prepare(
      `INSERT INTO appointments
         (id, provider_user_id, service_id, starts_at_local, ends_at_local, timezone,
          source, booking_token_hash, guardian_name_encrypted)
       VALUES (?, ?, ?, ?, ?, 'America/Recife', 'professional', ?, ?)`,
    )
    .run(
      id,
      PROVIDER,
      SERVICE,
      `2026-03-10T${hora}:00:00`,
      `2026-03-10T${hora}:30:00`,
      `token-hash-sintetico-${sequencia}`,
      envelope,
    );
  return id;
}

function bucketsDaColuna(
  inventory: Awaited<ReturnType<typeof collectOperationalEnvelopeInventory>>,
  table: string,
  column: string,
) {
  const found = inventory.columns.find(
    (c) => c.table === table && c.column === column,
  );
  assert.ok(found, `coluna ${table}.${column} deveria estar no inventário`);
  return found.buckets;
}

// ---------------------------------------------------------------------------
// 1. O inventário conta versão e chave citada.
// ---------------------------------------------------------------------------
inserirAgendamento(`v2.k2.aXY=.${CORPO}`);
inserirAgendamento(`v2.k2.bXY=.${CORPO}`);
inserirAgendamento(`v2.k1.cXY=.${CORPO}`);
inserirAgendamento(`v1.dXY=.${CORPO}`);
// Nulo e vazio não são envelopes: não podem inflar contagem alguma.
inserirAgendamento(null);
inserirAgendamento("");

let inventory = await collectOperationalEnvelopeInventory(db);
let buckets = bucketsDaColuna(
  inventory,
  "appointments",
  "guardian_name_encrypted",
);

const v2k2 = buckets.find((b) => b.version === "v2" && b.keyId === "k2");
const v2k1 = buckets.find((b) => b.version === "v2" && b.keyId === "k1");
const v1 = buckets.find((b) => b.version === "v1");
assert.equal(v2k2?.total, 2, "deveria contar 2 envelopes v2 na chave k2");
assert.equal(v2k1?.total, 1, "deveria contar 1 envelope v2 na chave k1");
assert.equal(v1?.total, 1, "deveria contar 1 envelope v1");
assert.equal(
  buckets.reduce((soma, b) => soma + b.total, 0),
  4,
  "nulo e string vazia não podem entrar na contagem",
);
assert.equal(
  OPERATIONAL_ENVELOPE_COLUMNS.length,
  11,
  "a allowlist cobre as 11 colunas de PII operacional da 0007",
);

// ---------------------------------------------------------------------------
// 2. v1 remanescente bloqueia a aposentadoria da chave anterior.
// ---------------------------------------------------------------------------
let assessment = assessPreviousKeyRetirement(inventory, "k1");
assert.equal(assessment.legacyV1, 1);
assert.equal(assessment.citingPrevious, 1);
assert.equal(
  assessment.previousKeyRetirementSafe,
  false,
  "com v1 e com v2 citando k1, aposentar k1 é perda de dado",
);

// ---------------------------------------------------------------------------
// 3. Só o v2 citando a anterior já basta para bloquear.
// ---------------------------------------------------------------------------
sqlite
  .prepare(`DELETE FROM appointments WHERE guardian_name_encrypted LIKE 'v1.%'`)
  .run();
inventory = await collectOperationalEnvelopeInventory(db);
assessment = assessPreviousKeyRetirement(inventory, "k1");
assert.equal(assessment.legacyV1, 0, "os v1 foram removidos");
assert.equal(assessment.citingPrevious, 1);
assert.equal(
  assessment.previousKeyRetirementSafe,
  false,
  "um único envelope citando k1 ainda impede aposentá-la",
);

// ---------------------------------------------------------------------------
// 4. Tudo na chave atual: liberado.
// ---------------------------------------------------------------------------
sqlite
  .prepare(
    `DELETE FROM appointments WHERE guardian_name_encrypted LIKE 'v2.k1.%'`,
  )
  .run();
inventory = await collectOperationalEnvelopeInventory(db);
assessment = assessPreviousKeyRetirement(inventory, "k1");
assert.equal(assessment.legacyV1, 0);
assert.equal(assessment.citingPrevious, 0);
assert.equal(assessment.unreadable, 0);
assert.equal(
  assessment.previousKeyRetirementSafe,
  true,
  "sem nada dependendo de k1, a rotação pode ser concluída",
);

// ---------------------------------------------------------------------------
// 5 e 6. Versão desconhecida e keyId malformado: contados, nunca ecoados.
// ---------------------------------------------------------------------------
const idEstranho = inserirAgendamento(`v9.qualquer.coisa.${CORPO}`);
inventory = await collectOperationalEnvelopeInventory(db);
buckets = bucketsDaColuna(inventory, "appointments", "guardian_name_encrypted");
const desconhecido = buckets.find((b) => b.version === "unknown");
assert.equal(
  desconhecido?.total,
  1,
  "envelope de versão desconhecida precisa aparecer",
);
assessment = assessPreviousKeyRetirement(inventory, "k1");
assert.equal(assessment.unreadable, 1);
assert.equal(
  assessment.previousKeyRetirementSafe,
  false,
  "'não sei classificar' nunca pode virar 'pode aposentar'",
);
sqlite.prepare(`DELETE FROM appointments WHERE id = ?`).run(idEstranho);

// keyId com caractere fora de [A-Za-z0-9_-]: contado como malformado e o valor
// bruto NÃO pode aparecer em lugar nenhum do inventário.
const VENENO = "chave com espaço e ç";
const idVeneno = inserirAgendamento(`v2.${VENENO}.eXY=.${CORPO}`);
inventory = await collectOperationalEnvelopeInventory(db);
buckets = bucketsDaColuna(inventory, "appointments", "guardian_name_encrypted");
const malformado = buckets.find((b) => b.malformedKeyId);
assert.ok(malformado, "keyId fora do padrão precisa ser sinalizado");
assert.equal(malformado.keyId, null, "keyId malformado nunca é ecoado");
assert.equal(
  JSON.stringify(inventory).includes(VENENO),
  false,
  "nenhum byte arbitrário do banco pode atravessar o inventário",
);
assert.equal(
  assessPreviousKeyRetirement(inventory, "k1").previousKeyRetirementSafe,
  false,
  "keyId malformado é incerteza e bloqueia",
);
sqlite.prepare(`DELETE FROM appointments WHERE id = ?`).run(idVeneno);

// ---------------------------------------------------------------------------
// 7. Tabela ausente não vira zero silencioso.
// ---------------------------------------------------------------------------
const semTabela = new Database(":memory:");
semTabela.exec(`CREATE TABLE appointments (id TEXT PRIMARY KEY, guardian_name_encrypted TEXT,
                 guardian_email_encrypted TEXT, guardian_phone_encrypted TEXT,
                 patient_name_encrypted TEXT)`);
const inventarioParcial = await collectOperationalEnvelopeInventory(
  new D1DatabaseMock(semTabela) as unknown as D1Database,
);
assert.ok(
  inventarioParcial.missingTables.includes("waitlist_entries"),
  "tabela ausente precisa ser denunciada, não contada como zero",
);

// ---------------------------------------------------------------------------
// 8. O corpo do envelope nunca é lido.
// ---------------------------------------------------------------------------
inserirAgendamento(`v2.k2.fXY=.${CORPO}`);
inventory = await collectOperationalEnvelopeInventory(db);
assert.equal(
  JSON.stringify(inventory).includes(CORPO),
  false,
  "o inventário não pode carregar o corpo cifrado",
);

// ---------------------------------------------------------------------------
// 9, 10 e 11. A rota: RBAC, ausência de segredo e keyring reportado.
// ---------------------------------------------------------------------------
const CHAVE_ATUAL = "chave-operacional-sintetica-com-32+".padEnd(40, "x");
const CHAVE_ANTERIOR = "chave-operacional-anterior-sintetica".padEnd(40, "y");

function contexto(role: string | null, env: Record<string, unknown>) {
  return {
    env: { DB: db, ...env },
    data: role
      ? { authUser: { id: "user-x", name: "X", email: "x@example.test", role } }
      : {},
    request: new Request("https://exemplo.test/api/admin/operational-crypto"),
  } as never;
}

const envOk = {
  OPERATIONAL_DATA_KEY: CHAVE_ATUAL,
  OPERATIONAL_DATA_KEY_ID: "k2",
  OPERATIONAL_DATA_KEY_PREVIOUS: CHAVE_ANTERIOR,
  OPERATIONAL_DATA_KEY_PREVIOUS_ID: "k1",
};

const anonimo = await onRequestGet(contexto(null, envOk));
assert.equal(anonimo.status, 401, "anônimo não lê estado de keyring");

const profissional = await onRequestGet(contexto("professional", envOk));
assert.equal(
  profissional.status,
  403,
  "profissional não lê infraestrutura cross-tenant",
);

const admin = await onRequestGet(contexto("admin", envOk));
assert.equal(admin.status, 200);
const corpoResposta = await admin.text();
const payload = JSON.parse(corpoResposta);
assert.equal(payload.keyring.configured, true);
assert.equal(payload.keyring.currentKeyId, "k2");
assert.equal(payload.keyring.previousKeyId, "k1");
assert.equal(payload.envelopes.legacyV1, 0);
assert.equal(
  payload.previousKeyRetirementSafe,
  true,
  "tudo em k2: k1 pode sair",
);

// Nenhum material secreto na resposta — nem inteiro, nem em pedaço.
for (const segredo of [CHAVE_ATUAL, CHAVE_ANTERIOR]) {
  assert.equal(corpoResposta.includes(segredo), false, "segredo inteiro vazou");
  assert.equal(
    corpoResposta.includes(segredo.slice(0, 12)),
    false,
    "prefixo de segredo vazou",
  );
  assert.equal(
    corpoResposta.includes(segredo.slice(-12)),
    false,
    "sufixo de segredo vazou",
  );
}
assert.equal(
  corpoResposta.includes(CORPO),
  false,
  "corpo cifrado não pode atravessar a rota",
);

// Keyring quebrado é reportado com o código, não engolido nem disfarçado de OK.
const colisao = operationalKeyringStatus({
  OPERATIONAL_DATA_KEY: CHAVE_ATUAL,
  OPERATIONAL_DATA_KEY_ID: "k1",
  OPERATIONAL_DATA_KEY_PREVIOUS: CHAVE_ANTERIOR,
  OPERATIONAL_DATA_KEY_PREVIOUS_ID: "k1",
} as never);
assert.equal(colisao.ok, false);
assert.equal(
  colisao.ok === false && colisao.code,
  "OPERATIONAL_KEY_ID_COLLISION",
);

const semChave = await onRequestGet(contexto("admin", {}));
assert.equal(semChave.status, 200, "sem keyring o inventário ainda é útil");
const semChavePayload = JSON.parse(await semChave.text());
assert.equal(semChavePayload.keyring.configured, false);
assert.equal(semChavePayload.keyring.code, "OPERATIONAL_CRYPTO_NOT_CONFIGURED");
assert.equal(
  semChavePayload.previousKeyRetirementSafe,
  false,
  "keyring não configurado nunca autoriza aposentar chave",
);

console.log(
  "✓ prontidão de rotação operacional: inventário por versão/chave, bloqueio fail-closed, RBAC e ausência de segredo aprovados",
);
