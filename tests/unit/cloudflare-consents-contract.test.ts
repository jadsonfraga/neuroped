import assert from "node:assert/strict";
import {
  CANONICAL_CONSENTS,
  CURRENT_CONSENT_VERSION,
  onRequestGet,
  onRequestPost,
  parseConsentBatchPayload,
  REQUIRED_CONSENT_TYPES,
} from "../../functions/api/consents";

interface FakeResult {
  results?: Array<Record<string, unknown>>;
  meta?: { changes?: number };
}

class FakeStatement {
  bindings: unknown[] = [];

  constructor(
    readonly database: FakeDatabase,
    readonly sql: string,
  ) {}

  bind(...values: unknown[]): this {
    this.bindings = values;
    return this;
  }

  async all<T>(): Promise<{ results: T[] }> {
    const result = await this.database.all(this);
    return { results: (result.results ?? []) as T[] };
  }
}

class FakeDatabase {
  readonly statements: FakeStatement[] = [];
  batchStatements: FakeStatement[] = [];

  constructor(
    readonly allHandler?: (statement: FakeStatement) => FakeResult,
  ) {}

  prepare(sql: string): FakeStatement {
    const statement = new FakeStatement(this, sql);
    this.statements.push(statement);
    return statement;
  }

  async all(statement: FakeStatement): Promise<FakeResult> {
    return this.allHandler?.(statement) ?? { results: [] };
  }

  async batch(statements: FakeStatement[]): Promise<FakeResult[]> {
    this.batchStatements = statements;
    return statements.map(() => ({ meta: { changes: 1 } }));
  }
}

const reader = {
  id: "reader-a",
  email: "reader@example.com",
  name: "Leitor",
  role: "reader",
  mustChangePassword: false,
};

const otherUser = {
  ...reader,
  id: "reader-b",
  email: "reader-b@example.com",
};

const acceptedAt = "2026-07-16T00:00:00.000Z";
const version = CURRENT_CONSENT_VERSION;
const payload = {
  version,
  acceptedAt,
  consents: REQUIRED_CONSENT_TYPES.map((consentType) => ({
    consentType,
    consentVersion: version,
    consentText: CANONICAL_CONSENTS[consentType].consentText,
    granted: true,
    legalBasis: CANONICAL_CONSENTS[consentType].legalBasis,
    purpose: CANONICAL_CONSENTS[consentType].purpose,
  })),
};

function context(
  database: FakeDatabase | undefined,
  request: Request,
  user: typeof reader | null = reader,
) {
  return {
    env: database ? { DB: database } : {},
    request,
    data: user ? { authUser: user } : {},
  } as never;
}

function postRequest(body: unknown): Request {
  return new Request("https://neuroped.test/api/consents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

assert.equal(
  parseConsentBatchPayload(payload, Date.parse(acceptedAt)).ok,
  true,
  "o contrato completo deve ser aceito",
);
for (const invalid of [
  null,
  [],
  { ...payload, extra: true },
  { ...payload, consents: payload.consents.slice(0, 2) },
  {
    ...payload,
    consents: [payload.consents[0], payload.consents[0], payload.consents[2]],
  },
  {
    ...payload,
    consents: payload.consents.map((item, index) =>
      index === 0 ? { ...item, consentVersion: "outra-versao" } : item,
    ),
  },
  {
    ...payload,
    consents: payload.consents.map((item, index) =>
      index === 0 ? { ...item, granted: false } : item,
    ),
  },
  {
    ...payload,
    consents: payload.consents.map((item, index) =>
      index === 0 ? { ...item, consentText: "Texto legal adulterado." } : item,
    ),
  },
]) {
  assert.equal(
    parseConsentBatchPayload(invalid, Date.parse(acceptedAt)).ok,
    false,
    "payload parcial, duplicado ou não estrito deve falhar",
  );
}

const unavailable = await onRequestPost(
  context(undefined, postRequest(payload)),
);
assert.equal(unavailable.status, 503, "sem D1 a UI deve acionar fallback local");

const unauthenticated = await onRequestPost(
  context(new FakeDatabase(), postRequest(payload), null),
);
assert.equal(unauthenticated.status, 401);

const postDb = new FakeDatabase();
const created = await onRequestPost(context(postDb, postRequest(payload)));
assert.equal(created.status, 201, "reader autenticado registra o próprio aceite");
assert.equal(
  postDb.batchStatements.length,
  4,
  "três consentimentos e a auditoria devem usar um único batch D1",
);
for (const statement of postDb.batchStatements.slice(0, 3)) {
  assert.match(statement.sql, /INSERT INTO consents/);
  assert.equal(statement.bindings[2], reader.id, "user_id sempre vem da sessão");
}
const audit = postDb.batchStatements[3];
assert.match(audit.sql, /INSERT INTO audit_logs/);
assert.match(audit.sql, /consent\.batch\.granted/);
assert.equal(audit.bindings[2], reader.id);

const oversized = await onRequestPost(
  context(
    new FakeDatabase(),
    postRequest({
      ...payload,
      padding: "x".repeat(33 * 1024),
    }),
  ),
);
assert.equal(oversized.status, 413, "o limite de 32 KiB deve ser aplicado ao corpo real");

const ownRow = {
  id: "consent-a",
  batch_id: "batch-a",
  consent_type: "termo_uso",
  consent_version: version,
  consent_text: CANONICAL_CONSENTS.termo_uso.consentText,
  granted: 1,
  accepted_at: acceptedAt,
  legal_basis: "Art. 7",
  purpose: "Finalidade",
  created_at: acceptedAt,
};
const listDb = new FakeDatabase(() => ({ results: [ownRow] }));
const listed = await onRequestGet(
  context(
    listDb,
    new Request("https://neuroped.test/api/consents"),
    otherUser,
  ),
);
assert.equal(listed.status, 200);
const select = listDb.statements.at(-1);
assert.ok(select);
assert.match(select.sql, /WHERE user_id = \?/);
assert.deepEqual(
  select.bindings,
  [otherUser.id],
  "a leitura nunca aceita user_id do cliente e fica isolada pela sessão",
);

const existingRows = REQUIRED_CONSENT_TYPES.map((consentType, index) => ({
  ...ownRow,
  id: `consent-${index}`,
  consent_type: consentType,
}));
const idempotentDb = new FakeDatabase(() => ({ results: existingRows }));
const replayed = await onRequestPost(
  context(idempotentDb, postRequest(payload)),
);
assert.equal(replayed.status, 200);
const replayBody = (await replayed.json()) as { idempotent?: boolean };
assert.equal(replayBody.idempotent, true);
assert.equal(
  idempotentDb.batchStatements.length,
  0,
  "reenvio do mesmo lote não duplica consentimentos nem auditoria",
);

console.log("✓ consentimentos D1 são estritos, atômicos, auditados e isolados por usuário");
