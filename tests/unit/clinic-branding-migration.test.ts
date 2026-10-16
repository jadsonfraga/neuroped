import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

test("migration 0035 é versionada e nenhum handler cria tabela em runtime", () => {
  const sql = readFileSync("db/migrations/0035_clinic_branding.sql", "utf8");
  assert.match(sql, /CREATE TABLE IF NOT EXISTS clinic_branding/);
  assert.match(sql, /Rollback/i);
  for (const f of ["functions/api/tenant/_branding.ts", "functions/api/tenants/[id]/index.ts"]) {
    assert.doesNotMatch(readFileSync(f, "utf8"), /CREATE TABLE/i, f);
  }
  assert.ok(readdirSync("db/migrations").includes("0035_clinic_branding.sql"));
});
