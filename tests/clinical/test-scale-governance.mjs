// Onda 0 — governança do banco de escalas: o filtro só oferece o que abre por inteiro,
// um instrumento = um id e os licenciados retirados pelo responsável (17/10/2026) ficam só
// como ficha de referência, com alternativa no app.
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
// Licenciados retirados (17/10/2026): só ficha de referência; a aplicação é a alternativa no app.
const RETIRADOS = ["cbcl", "conners", "brief2", "cdi2", "cars", "asq3", "denver", "pedsql", "cshq", "abc", "mchat", "sdq", "scared", "vanderbilt", "crafft", "vineland"];
for (const [canon, aliases] of Object.entries(CANONICAL_ALIASES)) {
  if (!RETIRADOS.includes(canon)) assert.ok(ids.has(canon), `canônico ${canon} ausente`);
  for (const a of aliases) {
    assert.ok(!ids.has(a), `alias ${a} duplicado no filtro`);
    if (RETIRADOS.includes(canon)) assert.equal(getExplicitLicenseRecord(a)?.softwareAllowed, false, `${a}: alias de retirado`);
  }
}
assert.equal(OWNER_RETAINED_LICENSED_IDS.length, 0, "nenhum licenciado segue no app por decisão do responsável");
for (const id of RETIRADOS) {
  assert.ok(!ids.has(id), `${id} não pode ser oferecido como aplicação no app`);
  assert.equal(getExplicitLicenseRecord(id)?.softwareAllowed, false, `${id}: uso em software não licenciado`);
  assert.equal(getExplicitLicenseRecord(id)?.basis, "owner_decision", `${id} deve constar como decisão do responsável`);
}
// Licença contraditória resolvida: a entrada canônica nunca é mais permissiva que o registro.
const by = new Map(offered.map((s) => [s.id, s]));
for (const id of ["phqa", "snap", "cssrs", "psc17"]) assert.ok(!isLicenseRestricted(by.get(id)), `${id} é de uso livre verificado`);
console.log(`test-scale-governance OK (${offered.length} escalas oferecidas)`);
