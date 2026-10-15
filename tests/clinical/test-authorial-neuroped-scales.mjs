// Instrumentos autorais NeuroPed (ondas 2–3): rótulo honesto, sem corte, itens originais únicos, licença registrada.
import assert from "node:assert/strict";
import { openScaleSpecs } from "../../client/src/data/openScalesIndex.ts";
import { allScales } from "../../client/src/data/scaleFilter.ts";
import { getExplicitLicenseRecord } from "../../client/src/data/scaleLicenseRegistry.ts";

const specs = openScaleSpecs.filter((s) => s.authorial);
assert.ok(specs.length >= 1);
const seen = new Map();
for (const s of specs) {
  const where = s.id;
  assert.ok(/^na-/.test(s.id), `${where}: prefixo na-`);
  assert.ok(/autoral/i.test(s.name), `${where}: nome rotulado autoral`);
  assert.match(s.description, /Instrumento autoral NeuroPed, sem validação psicométrica\. Apoio à decisão clínica, não diagnóstico/, where);
  assert.match(s.scoringCutoff, /^Sem ponto de corte/, where);
  assert.equal(s.def.domainCutoff, undefined, `${where}: sem corte`);
  assert.equal(s.def.descriptiveDomainSummary, true, where);
  assert.match(s.validacaoBrasil, /Nenhuma/, where);
  const items = s.def.domains.flatMap((d) => d.items.map((i) => (typeof i === "string" ? i : i.text)));
  assert.ok(items.length >= 6 && items.length <= 24, `${where}: ${items.length} itens`);
  for (const t of items) {
    assert.ok(t.length >= 10 && /[.?]$/.test(t), `${where}: item mal formado "${t}"`);
    assert.ok(!seen.has(t), `${where}: item repetido com ${seen.get(t)}`);
    seen.set(t, s.id);
  }
  const rec = getExplicitLicenseRecord(s.id);
  assert.equal(rec?.status, "authorial", where);
  const entry = allScales.find((e) => e.id === s.id);
  assert.ok(entry && entry.licencaUso === "autoral" && entry.implementationStatus === "complete", `${where}: no catálogo, completo`);
  assert.ok(s.signalTags.length >= 3, `${where}: marcadores de sintoma`);
  assert.ok(s.queixas.includes(s.primaryDomain), `${where}: primaryDomain nas queixas`);
}
console.log(`✓ ${specs.length} instrumentos autorais NeuroPed: rótulo, sem corte, itens únicos, licença autoral`);
