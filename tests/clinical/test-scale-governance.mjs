// Onda 0 — governança do banco de escalas: o filtro só oferece o que abre por inteiro,
// um instrumento = um id, os licenciados mantidos pelo responsável seguem no app e os de
// ASEBA, MHS, PAR e WPS ficam só como ficha de referência, com alternativa autoral.
import assert from "node:assert/strict";
import { allScales } from "../../client/src/data/scaleFilter.ts";
import { noCostWorldScales } from "../../client/src/data/noCostWorldScales.ts";
import { mergeFilterableCatalog } from "../../client/src/data/filterableCatalog.ts";
import { getImplementationStatus, isLicenseRestricted } from "../../client/src/data/advancedFilterLogic.ts";
import { CANONICAL_ALIASES, OWNER_RETAINED_LICENSED_IDS, getExplicitLicenseRecord } from "../../client/src/data/scaleLicenseRegistry.ts";

const offered = mergeFilterableCatalog([...allScales, ...noCostWorldScales]);
const ids = new Set(offered.map((s) => s.id));

for (const s of offered) assert.equal(getImplementationStatus(s), "complete", `${s.id} oferecida sem abrir por inteiro`);
for (const id of ["world-swyc-milestones", "world-swyc-posi", "world-cast", "world-assq", "world-rcads-25", "world-eat26", "world-promis-anxiety"]) {
  assert.ok(!ids.has(id), `${id} (ficha/não implementada) não pode estar no filtro`);
}
for (const [canon, aliases] of Object.entries(CANONICAL_ALIASES)) {
  assert.ok(ids.has(canon), `canônico ${canon} ausente`);
  for (const a of aliases) assert.ok(!ids.has(a), `alias ${a} duplicado no filtro`);
}
// Decisão do responsável: os licenciados com aplicação completa continuam disponíveis.
for (const id of ["asq3", "denver", "pedsql", "cshq", "abc", "mchat", "sdq", "scared", "vanderbilt", "crafft"]) {
  assert.ok(ids.has(id), `${id} deveria seguir no app`);
  assert.ok(OWNER_RETAINED_LICENSED_IDS.includes(id));
}
// ASEBA, MHS, PAR e WPS (17/10/2026): só ficha de referência; a aplicação é a alternativa autoral.
for (const id of ["cbcl", "conners", "brief2", "cdi2", "cars"]) {
  assert.ok(!ids.has(id), `${id} não pode ser oferecido como aplicação no app`);
  assert.ok(!OWNER_RETAINED_LICENSED_IDS.includes(id), `${id} saiu da lista mantida pelo responsável`);
  assert.equal(getExplicitLicenseRecord(id)?.softwareAllowed, false, `${id}: uso em software não licenciado`);
}
// Licença contraditória resolvida: a entrada canônica nunca é mais permissiva que o registro.
const by = new Map(offered.map((s) => [s.id, s]));
// Mantidos por decisão do responsável: comportamento do app inalterado (a licença legada não é rebaixada nem promovida).
for (const id of ["mchat", "sdq", "scared", "vanderbilt", "crafft"]) assert.equal(getExplicitLicenseRecord(id)?.basis, "owner_decision", `${id} deve constar como decisão do responsável`);
for (const id of ["phqa", "snap", "cssrs", "psc17"]) assert.ok(!isLicenseRestricted(by.get(id)), `${id} é de uso livre verificado`);
console.log(`test-scale-governance OK (${offered.length} escalas oferecidas)`);
