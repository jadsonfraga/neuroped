import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import express from "express";
import {
  CANONICAL_CONSENTS,
  CURRENT_CONSENT_VERSION,
  REQUIRED_CONSENT_TYPES,
  parseConsentBatchPayload,
} from "../../server/lib/consentContract";
import {
  CANONICAL_CONSENTS as CLOUDFLARE_CANONICAL_CONSENTS,
  CURRENT_CONSENT_VERSION as CLOUDFLARE_CONSENT_VERSION,
  REQUIRED_CONSENT_TYPES as CLOUDFLARE_REQUIRED_CONSENT_TYPES,
} from "../../functions/api/consents";

assert.equal(
  CURRENT_CONSENT_VERSION,
  CLOUDFLARE_CONSENT_VERSION,
  "Express e Cloudflare devem publicar a mesma versão",
);
assert.deepEqual(REQUIRED_CONSENT_TYPES, CLOUDFLARE_REQUIRED_CONSENT_TYPES);
assert.deepEqual(CANONICAL_CONSENTS, CLOUDFLARE_CANONICAL_CONSENTS);

function createPayload(acceptedAt: string) {
  return {
    version: CURRENT_CONSENT_VERSION,
    acceptedAt,
    consents: REQUIRED_CONSENT_TYPES.map((consentType) => ({
      consentType,
      consentVersion: CURRENT_CONSENT_VERSION,
      consentText: CANONICAL_CONSENTS[consentType].consentText,
      granted: true as const,
      legalBasis: CANONICAL_CONSENTS[consentType].legalBasis,
      purpose: CANONICAL_CONSENTS[consentType].purpose,
    })),
  };
}

const firstAcceptedAt = new Date(Date.now() - 60_000).toISOString();
const payload = createPayload(firstAcceptedAt);
assert.equal(parseConsentBatchPayload(payload).ok, true);

for (const invalid of [
  null,
  [],
  { ...payload, userId: "forjado" },
  { ...payload, patientId: crypto.randomUUID() },
  { ...payload, consents: payload.consents.slice(0, 2) },
  {
    ...payload,
    consents: [payload.consents[0], payload.consents[0], payload.consents[2]],
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
      index === 0 ? { ...item, consentText: "Texto adulterado." } : item,
    ),
  },
]) {
  assert.equal(
    parseConsentBatchPayload(invalid).ok,
    false,
    "payload parcial, forjado, duplicado ou não canônico deve falhar",
  );
}

const tempDirectory = mkdtempSync(join(tmpdir(), "neuroped-consents-express-"));
process.env.DATABASE_PATH = join(tempDirectory, "test.sqlite");
const deterministicTestSecret = "fixture-only".padEnd(64, "x");
process.env.NEUROPED_JWT_SECRET = deterministicTestSecret;

const [{ sqlite }, consentRoutes, { signAccessToken }] = await Promise.all([
  import("../../server/storage"),
  import("../../server/routes/consents"),
  import("../../server/lib/jwt"),
]);

function insertUser(id: string, email: string): void {
  const now = new Date().toISOString();
  sqlite
    .prepare(
      `INSERT INTO users
        (id, email, name, password_hash, role, is_active,
         failed_login_attempts, must_change_password, created_at, updated_at)
       VALUES (?, ?, 'Usuário de teste', ?, 'reader', 1, 0, 0, ?, ?)`,
    )
    .run(id, email, "hash".repeat(20), now, now);
}

const firstUserId = crypto.randomUUID();
const secondUserId = crypto.randomUUID();
insertUser(firstUserId, "reader-a@example.test");
insertUser(secondUserId, "reader-b@example.test");

const first = consentRoutes.recordConsentBatch({
  userId: firstUserId,
  input: payload,
  ipAddress: "203.0.113.10",
  userAgent: "test-agent",
  createdAt: firstAcceptedAt,
});
assert.equal(first.idempotent, false);
assert.equal(first.consents.length, 3);
assert.equal(
  sqlite.prepare("SELECT COUNT(*) AS count FROM consents").get().count,
  3,
);
assert.equal(
  sqlite.prepare("SELECT COUNT(*) AS count FROM audit_logs").get().count,
  1,
  "o lote completo gera uma única auditoria",
);

const replay = consentRoutes.recordConsentBatch({
  userId: firstUserId,
  input: payload,
});
assert.equal(replay.idempotent, true);
assert.equal(replay.batchId, first.batchId);
assert.equal(
  sqlite.prepare("SELECT COUNT(*) AS count FROM consents").get().count,
  3,
  "reenvio não duplica linhas",
);
assert.equal(
  sqlite.prepare("SELECT COUNT(*) AS count FROM audit_logs").get().count,
  1,
  "reenvio não duplica auditoria",
);

const otherOwner = consentRoutes.recordConsentBatch({
  userId: secondUserId,
  input: payload,
});
assert.equal(otherOwner.idempotent, false);
assert.notEqual(otherOwner.batchId, first.batchId);
assert.equal(consentRoutes.listOwnConsents(firstUserId).length, 3);
assert.equal(consentRoutes.listOwnConsents(secondUserId).length, 3);

const partialAcceptedAt = new Date(Date.now() - 50_000).toISOString();
const partial = createPayload(partialAcceptedAt).consents[0];
sqlite
  .prepare(
    `INSERT INTO consents
      (id, batch_id, user_id, consent_type, consent_version, consent_text,
       granted, granted_at, accepted_at, legal_basis, purpose)
     VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)`,
  )
  .run(
    crypto.randomUUID(),
    crypto.randomUUID(),
    firstUserId,
    partial.consentType,
    partial.consentVersion,
    partial.consentText,
    partialAcceptedAt,
    partialAcceptedAt,
    partial.legalBasis,
    partial.purpose,
  );
assert.throws(
  () =>
    consentRoutes.recordConsentBatch({
      userId: firstUserId,
      input: createPayload(partialAcceptedAt),
    }),
  consentRoutes.ConsentBatchConflictError,
  "um lote parcial preexistente não pode ser completado silenciosamente",
);

sqlite.exec(`
  CREATE TRIGGER reject_consent_batch_audit
  BEFORE INSERT ON audit_logs
  WHEN NEW.event_type = 'consent.batch.granted'
  BEGIN
    SELECT RAISE(ABORT, 'forced audit failure');
  END;
`);
const rollbackAcceptedAt = new Date(Date.now() - 40_000).toISOString();
assert.throws(() =>
  consentRoutes.recordConsentBatch({
    userId: firstUserId,
    input: createPayload(rollbackAcceptedAt),
  }),
);
assert.equal(
  sqlite
    .prepare(
      "SELECT COUNT(*) AS count FROM consents WHERE user_id = ? AND accepted_at = ?",
    )
    .get(firstUserId, rollbackAcceptedAt).count,
  0,
  "falha de auditoria reverte as três inserções de consentimento",
);
sqlite.exec("DROP TRIGGER reject_consent_batch_audit");

const app = express();
app.set("trust proxy", 1);
app.use(
  express.json({
    limit: "1mb",
    verify: (req, _res, buffer) => {
      req.rawBody = buffer;
    },
  }),
);
consentRoutes.registerConsentRoutes(app);

const server = await new Promise<ReturnType<typeof app.listen>>((resolve) => {
  const listening = app.listen(0, "127.0.0.1", () => resolve(listening));
});
const address = server.address() as AddressInfo;
const baseUrl = `http://127.0.0.1:${address.port}`;

function tokenFor(userId: string, email: string): string {
  const sessionId = crypto.randomUUID();
  const now = new Date().toISOString();
  sqlite
    .prepare(
      `INSERT INTO refresh_tokens
        (id, user_id, token_hash, issued_at, expires_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(
      sessionId,
      userId,
      `fixture-session-${sessionId}`,
      now,
      new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    );
  return signAccessToken({
    userId,
    email,
    role: "reader",
    name: "Leitor",
    sessionId,
  });
}

const unauthenticated = await fetch(`${baseUrl}/api/consents`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(createPayload(new Date().toISOString())),
});
assert.equal(unauthenticated.status, 401);

const firstToken = tokenFor(firstUserId, "reader-a@example.test");
const httpAcceptedAt = new Date(Date.now() - 30_000).toISOString();
const httpPayload = createPayload(httpAcceptedAt);
const created = await fetch(`${baseUrl}/api/consents`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${firstToken}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(httpPayload),
});
assert.equal(created.status, 201, "reader autenticado registra o próprio lote");
const createdBody = (await created.json()) as { idempotent?: boolean };
assert.equal(createdBody.idempotent, false);

const replayed = await fetch(`${baseUrl}/api/consents`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${firstToken}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(httpPayload),
});
assert.equal(replayed.status, 200);
assert.equal((await replayed.json()).idempotent, true);

const forgedOwner = await fetch(`${baseUrl}/api/consents`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${firstToken}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ ...httpPayload, userId: secondUserId }),
});
assert.equal(forgedOwner.status, 400);

const oversized = await fetch(`${baseUrl}/api/consents`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${firstToken}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ ...httpPayload, padding: "x".repeat(33 * 1024) }),
});
assert.equal(oversized.status, 413);

const listed = await fetch(`${baseUrl}/api/consents`, {
  headers: { Authorization: `Bearer ${firstToken}` },
});
assert.equal(listed.status, 200);
const listBody = (await listed.json()) as { data: Array<{ batchId: string }> };
assert.equal(listBody.data.length, 7, "lista contém somente registros do titular");
assert.ok(listBody.data.every((item) => typeof item.batchId === "string"));

await new Promise<void>((resolve, reject) => {
  server.close((error) => (error ? reject(error) : resolve()));
});
sqlite.close();
rmSync(tempDirectory, { recursive: true, force: true });

console.log(
  "✓ consentimentos Express são estritos, atômicos, auditados, idempotentes e isolados",
);
