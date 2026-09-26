// @ts-check
/**
 * patient-access-anti-enumeration-static.test.mjs — AUTHZ-P2-11/LEG-10
 * (ciclo 4 da espiral SaaS, 2026-09-26 —
 * docs/audits/SAAS_TENANCY_AUDIT_2026-09-26.md).
 *
 * As rotas clínicas legadas resolviam `getPatientAccess` e respondiam 404
 * para paciente inexistente e 403 para paciente de outro owner. Isso é um
 * oráculo de enumeração: revela que um id pertence a alguém, só não a quem
 * perguntou. A correção unifica os dois casos na mesma resposta (404,
 * mesma mensagem/código).
 *
 * Este guard estático varre os arquivos corrigidos e falha o CI se
 * `access.exists` e `access.allowed` voltarem a aparecer como duas
 * checagens SEPARADAS (cada uma com seu próprio `return`) — a marca do
 * defeito original. A forma correta é uma condição combinada
 * (`!access.exists || !access.allowed`) resolvendo em uma resposta só.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const FILES = [
  "functions/api/patients/[id].ts",
  "functions/api/patients/[id]/results.ts",
  "functions/api/results.ts",
  "functions/api/results/[id].ts",
  "functions/api/scales/results.ts",
  "functions/api/consultations/index.ts",
  "functions/api/clinical-core/index.ts",
  "functions/api/conecta/index.ts",
  "functions/api/conecta/[id].ts",
  "functions/api/memory/index.ts",
];

// Marca do defeito: um `if` que testa SÓ `access.exists` (sem `access.allowed`
// na mesma condição) resolvendo em um `return` — ou seja, um `return` próprio
// para o caso "não existe", distinto do caso "existe mas não é permitido".
const SPLIT_EXISTS_CHECK = /if\s*\(\s*!access\.exists\s*\)\s*(?:\{[^}]*return|return)/;
const SPLIT_ALLOWED_CHECK = /if\s*\(\s*!access\.allowed\s*\)\s*(?:\{[^}]*return|return)/;
const COMBINED_CHECK = /!access\.exists\s*\|\|\s*!access\.allowed/;

let combinedTotal = 0;
for (const file of FILES) {
  const source = readFileSync(file, "utf8");
  assert.ok(source.includes("getPatientAccess("), `${file}: esperava usar getPatientAccess`);
  assert.doesNotMatch(
    source,
    SPLIT_EXISTS_CHECK,
    `${file}: checagem separada de access.exists reintroduz o oráculo de enumeração (404 distinto de 403)`,
  );
  assert.doesNotMatch(
    source,
    SPLIT_ALLOWED_CHECK,
    `${file}: checagem separada de access.allowed reintroduz o oráculo de enumeração`,
  );
  const matches = source.match(new RegExp(COMBINED_CHECK, "g")) ?? [];
  assert.ok(matches.length > 0, `${file}: esperava ao menos uma checagem combinada !access.exists || !access.allowed`);
  combinedTotal += matches.length;
}

assert.ok(combinedTotal >= FILES.length, `esperava pelo menos ${FILES.length} checagens combinadas, achou ${combinedTotal}`);

console.log(`✓ anti-enumeração de acesso a paciente: ${FILES.length} arquivos, ${combinedTotal} checagens combinadas, nenhuma checagem separada de exists/allowed`);
