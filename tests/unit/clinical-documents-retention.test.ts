import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import express from "express";
const dbPath = `/tmp/neuroped-clinical-documents-${process.pid}.db`;
fs.rmSync(dbPath, { force: true });
process.env.DATABASE_PATH = dbPath;
const testJwtSecret = ["test-secret-for-clinical-documents", "32-chars"].join("-");
process.env.NEUROPED_JWT_SECRET = testJwtSecret;
process.env.NODE_ENV = "test";

const { db, sqlite } = await import("../../server/storage.js");
const { files, users } = await import("../../shared/schema.js");
const { registerDocumentRoutes } = await import("../../server/routes/documents.js");
const { registerFileRoutes } = await import("../../server/routes/files.js");
const { signAccessToken } = await import("../../server/lib/jwt.js");

const app = express();
app.use(express.json());
registerFileRoutes(app);
registerDocumentRoutes(app);

const userId = crypto.randomUUID();
const fileId = crypto.randomUUID();
const pendingFileId = crypto.randomUUID();
const pdfBytes = Buffer.from("%PDF-1.7\nclinical-test\n%%EOF\n", "utf8");
const sha256 = crypto.createHash("sha256").update(pdfBytes).digest("hex");
const now = new Date().toISOString();
const sessionId = crypto.randomUUID();
const token = signAccessToken({
  userId,
  email: "document-test@example.test",
  role: "professional",
  name: "Profissional Teste",
  sessionId,
});

// O teste usa um arquivo confirmado no storage lógico; o upload remoto é coberto
// pelos testes existentes do cliente de arquivos e não é chamado neste cenário.
db.insert(users).values({
  id: userId,
  email: "document-test@example.test",
  name: "Profissional Teste",
  passwordHash: "test-only",
  role: "professional",
  isActive: true,
  createdAt: now,
  updatedAt: now,
}).run();

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

db.insert(files).values({
  id: fileId,
  ownerUserId: userId,
  patientId: null,
  filename: "receita-teste.pdf",
  mimeType: "application/pdf",
  sizeBytes: pdfBytes.length,
  storageProvider: "test",
  storageBucket: "test",
  storageKey: `clinical-test/${fileId}.pdf`,
  encryptionEnabled: true,
  sha256,
  category: "receita",
  isDeleted: false,
  deletedAt: null,
  createdAt: now,
}).run();

db.insert(files).values({
  id: pendingFileId,
  ownerUserId: userId,
  patientId: null,
  filename: "receita-pendente.pdf",
  mimeType: "application/pdf",
  sizeBytes: pdfBytes.length,
  storageProvider: "test",
  storageBucket: "test",
  storageKey: `clinical-test/${pendingFileId}.pdf`,
  encryptionEnabled: true,
  sha256: null,
  category: "receita",
  isDeleted: false,
  deletedAt: null,
  createdAt: now,
}).run();

const server = await new Promise<ReturnType<typeof app.listen>>((resolve) => {
  const instance = app.listen(0, () => resolve(instance));
});
const address = server.address();
if (!address || typeof address === "string") throw new Error("Servidor de teste sem porta");
const base = `http://127.0.0.1:${address.port}`;
const headers = {
  authorization: `Bearer ${token}`,
  "content-type": "application/json",
};

async function request(path: string, init: RequestInit = {}) {
  return fetch(`${base}${path}`, {
    ...init,
    headers: { ...headers, ...(init.headers ?? {}) },
  });
}

try {
  const pendingCreate = await request("/api/documents", {
    method: "POST",
    body: JSON.stringify({
      fileId: pendingFileId,
      documentType: "receita",
      title: "Receita pendente",
    }),
  });
  assert.equal(pendingCreate.status, 409);
  assert.equal((await pendingCreate.json()).code, "FILE_NOT_CONFIRMED");

  const create = await request("/api/documents", {
    method: "POST",
    body: JSON.stringify({
      fileId,
      documentType: "receita",
      title: "Receita de teste",
      signatureStatus: "signed",
      signatureType: "ICP-Brasil A1 / PAdES",
      signatureAlgorithm: "ETSI.CAdES.detached",
      signerName: "Profissional Teste",
      sha256,
      metadata: { test: true, retention: "permanent" },
    }),
  });
  assert.equal(create.status, 201);
  const createdPayload = await create.json() as { document: { id: string; retentionPolicy: string; isImmutable: boolean } };
  assert.equal(createdPayload.document.retentionPolicy, "permanent");
  assert.equal(createdPayload.document.isImmutable, true);

  const list = await request("/api/documents?type=receita");
  assert.equal(list.status, 200);
  const listPayload = await list.json() as { data: Array<{ id: string }>; retentionPolicy: string };
  assert.equal(listPayload.data.length, 1);
  assert.equal(listPayload.retentionPolicy, "permanent");

  const verify = await request(`/api/documents/${createdPayload.document.id}/verify`, { method: "POST", body: "{}" });
  assert.equal(verify.status, 503, "verificação sem storage não pode declarar integridade confirmada");
  assert.equal((await verify.json() as { code?: string }).code, "STORAGE_UNAVAILABLE");

  const deleteDocument = await request(`/api/documents/${createdPayload.document.id}`, { method: "DELETE" });
  assert.equal(deleteDocument.status, 409);
  assert.equal((await deleteDocument.json()).code, "PERMANENT_RETENTION");

  const deleteFile = await request(`/api/files/${fileId}`, { method: "DELETE" });
  assert.equal(deleteFile.status, 409);
  assert.equal((await deleteFile.json()).code, "CLINICAL_DOCUMENT_IMMUTABLE");

  console.log("[clinical-documents-retention] ✓ PDF confirmado, retenção permanente protegida e verificação sem storage falha fechado.");
} finally {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  sqlite.close();
  fs.rmSync(dbPath, { force: true });
  fs.rmSync(`${dbPath}-shm`, { force: true });
  fs.rmSync(`${dbPath}-wal`, { force: true });
}
