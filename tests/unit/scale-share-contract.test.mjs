import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const root = new URL("../../", import.meta.url);
const read = (relativePath) => fs.readFileSync(new URL(relativePath, root), "utf8");

test("links familiares usam token em hash e expiração no contrato Express", () => {
  const source = read("server/routes/scale-shares.ts");
  assert.match(source, /generateRandomToken\(32\)/);
  assert.match(source, /tokenHash: sha256\(token\)/);
  assert.match(source, /SHARE_TTL_MS/);
  assert.match(source, /status: \"pending\"/);
  assert.match(source, /status: \"submitted\"/);
  assert.match(source, /db\.transaction/);
  assert.match(source, /scaleResults/);
  assert.match(source, /SHARE_ALREADY_SUBMITTED/);
});

test("middleware deixa públicos apenas abrir e submeter, não criar", () => {
  const source = read("functions/api/_middleware.ts");
  assert.match(source, /\/api\/scale-shares\/open/);
  assert.match(source, /\/api\/scale-shares\/submit/);
  assert.doesNotMatch(source, /PUBLIC_API_PATHS[\s\S]*\/api\/scale-shares["']/);
});

test("schema e página pública preservam a associação dos resultados", () => {
  const d1 = read("db/schema.d1.sql");
  const page = read("client/src/pages/responder-escalas.tsx");
  assert.match(d1, /CREATE TABLE IF NOT EXISTS scale_share_sessions_demo/);
  assert.match(d1, /token_hash TEXT UNIQUE NOT NULL/);
  assert.match(d1, /result_ids TEXT/);
  assert.match(page, /\/api\/scale-shares\/open/);
  assert.match(page, /\/api\/scale-shares\/submit/);
  assert.match(page, /Respostas enviadas e guardadas/);
});

test("rota tokenizada é pública somente com token em formato seguro", () => {
  const source = read("client/src/lib/publicRoutes.ts");
  assert.match(source, /FAMILY_SCALE_LINK_ROUTE/);
  assert.match(source, /responder-escalas/);
  assert.match(source, /A-Za-z0-9_-/);
  assert.match(source, /20,256/);
  assert.match(source, /FAMILY_SCALE_LINK_ROUTE\.test\(normalized\)/);
});
