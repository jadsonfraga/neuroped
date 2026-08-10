import assert from "node:assert/strict";
import { nextAuditIsoDay, onRequestGet, parseAuditLogQuery } from "../../functions/api/audit-log";

const sane = parseAuditLogQuery(new URL("https://neuroped.invalid/api/audit-log?page=abc&limit=-5"));
assert.equal(sane.ok, true);
if (sane.ok) {
  assert.equal(sane.page, 1, "page inválida deve cair no fallback seguro");
  assert.equal(sane.limit, 50, "limit inválido deve cair no fallback seguro");
}

const capped = parseAuditLogQuery(new URL("https://neuroped.invalid/api/audit-log?page=999999999999999999999&limit=999"));
assert.equal(capped.ok, true);
if (capped.ok) {
  assert.equal(capped.page, 1, "inteiro fora do intervalo seguro não pode virar Infinity/NaN");
  assert.equal(capped.limit, 100, "limit numérico deve respeitar teto");
}

for (const query of [
  "from=2026-02-31",
  "to=2026-13-01",
  "from=2026-08-11&to=2026-08-10",
]) {
  assert.equal(
    parseAuditLogQuery(new URL(`https://neuroped.invalid/api/audit-log?${query}`)).ok,
    false,
    `${query}: intervalo/data inválido deve ser rejeitado`,
  );
}

const noDb = await onRequestGet({
  env: {},
  request: new Request("https://neuroped.invalid/api/audit-log"),
  data: {},
} as never);
assert.equal(noDb.status, 503, "log administrativo sem D1 deve falhar fechado");
const payload = await noDb.json() as { code?: string; data?: unknown };
assert.equal(payload.code, "DB_REQUIRED");
assert.equal("data" in payload, false, "falha sem DB não pode expor logs fictícios");
assert.equal(nextAuditIsoDay("2026-02-28"), "2026-03-01");
assert.equal(nextAuditIsoDay("2024-02-28"), "2024-02-29");
assert.equal(nextAuditIsoDay("2026-12-31"), "2027-01-01");

console.log("✓ audit-log falha fechado e normaliza paginação/filtros sem NaN ou datas impossíveis");
