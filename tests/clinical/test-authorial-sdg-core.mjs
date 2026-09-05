import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  authorialSdgRegistry,
  escalasAutoraisSdg,
  sdgOperationalItems,
  buildSdgPublicManifest,
} from "../../client/src/data/authorialSdgRegistry.ts";

// Conferidos independentemente contra os 36 itens dos PDFs de 05/09/2026.
// Uma mudança de redação exige versão/proveniência novas e revisão desta trava.
export const sourceContracts = {
  "afi-12-sdg": { ageMin: 60, ageMax: 215, domains: [6, 6], respondents: ["pais", "professor"], textSha256: "524b86926dfd552867bd2c0ce462262cb0bcb9bf76ce14286ec6b9fe55537204" },
  "sdrd-12-sdg": { ageMin: 36, ageMax: 215, domains: [4, 4, 4], respondents: ["pais"], textSha256: "feca17058895d8b379a253099f05b7f51713353a379d03119a036f0e5893b646" },
  "sarf-12-sdg": { ageMin: 24, ageMax: 179, domains: [4, 4, 4], respondents: ["pais"], textSha256: "108ef066f98a83a0e874197911bb91ac8c5dbd5ab8003a32155801f7b0a4a1fe" },
};

assert.ok(authorialSdgRegistry.length >= 3);
assert.equal(new Set(authorialSdgRegistry.map((s) => s.id)).size, authorialSdgRegistry.length, "IDs autorais devem ser únicos");
assert.equal(escalasAutoraisSdg.length, authorialSdgRegistry.length);
assert.equal(Object.keys(sdgOperationalItems).length, authorialSdgRegistry.length);
for (const id of Object.keys(sourceContracts)) assert.ok(authorialSdgRegistry.some((s) => s.id === id), `${id}: não pode desaparecer`);

for (const instrument of authorialSdgRegistry) {
  const id = instrument.id;
  const entry = escalasAutoraisSdg.find((s) => s.id === id);
  const definition = sdgOperationalItems[id];
  const items = instrument.domains.flatMap((d) => d.items);
  assert.ok(entry && definition, `${id}: catálogo e aplicação presentes`);
  assert.match(id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert.match(instrument.sourceSha256, /^[a-f0-9]{64}$/);
  assert.match(instrument.version, /^\d+\.\d+(?:\.\d+)?$/);
  assert.match(instrument.releasedOn, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(Number.isInteger(entry.ageMin) && Number.isInteger(entry.ageMax) && entry.ageMin >= 0 && entry.ageMin <= entry.ageMax);
  assert.ok(items.length > 0 && items.every((item) => item.trim().length > 10));
  assert.equal(new Set(items).size, items.length, `${id}: sem itens duplicados`);
  assert.ok(entry.queixas.length && entry.respondente.length && entry.signalTags.length);
  assert.equal(entry.prioridade, "monitorizacao");
  assert.equal(entry.assessmentUse, "monitorizacao");
  assert.equal(entry.licencaUso, "autoral");
  assert.equal(entry.implementationStatus, "complete");
  assert.equal(entry.pendente_validacao_clinica, true);
  assert.equal(entry.suicideRiskInstrument, false);
  assert.equal(entry.psychosisRiskInstrument, false);
  assert.ok(!entry.queixas.includes("suicidio") && !entry.queixas.includes("psicose"), "Risco agudo exige implementação e classificação próprias, não esta fábrica longitudinal");
  assert.equal(entry.appRoute, `/generic-scale/${id}`);
  assert.match(entry.fonte, new RegExp(instrument.sourceSha256));
  assert.match(definition.instruction, /últimos 7 dias/);
  assert.match(definition.infoBox, /sem validação psicométrica/);
  assert.ok(definition.infoBox.includes(instrument.version));
  assert.equal(definition.scoreDirection, "higher_worse");
  assert.equal(definition.labels.length, 4);
  assert.deepEqual(definition.optionPoints, [0, 1, 2, 3]);
  assert.deepEqual(definition.domains.map((d) => d.items), instrument.domains.map((d) => d.items));
  assert.equal(definition.bands.length, 1, "Não inventar bandas transversais de gravidade");
  assert.equal(definition.bands[0].minPct, 0);
  assert.match(definition.bands[0].classification, /sem ponto de corte validado/);
  for (const alert of instrument.alerts) {
    assert.ok(definition.infoBox.includes(alert), `${id}: alerta visível`);
    assert.ok(definition.bands[0].description.includes(alert), `${id}: alerta preservado no resultado`);
    assert.ok(!items.includes(alert), `${id}: alerta não contamina o escore`);
  }
  const contract = sourceContracts[id];
  if (contract) {
    assert.equal(items.length, 12);
    assert.equal(entry.ageMin, contract.ageMin);
    assert.equal(entry.ageMax, contract.ageMax);
    assert.deepEqual(entry.respondente, contract.respondents);
    assert.deepEqual(instrument.domains.map((d) => d.items.length), contract.domains);
    assert.equal(createHash("sha256").update(items.join("\n")).digest("hex"), contract.textSha256, `${id}: fidelidade ao PDF-fonte`);
  }
}
const manifest = buildSdgPublicManifest();
assert.equal(manifest.instruments.length, authorialSdgRegistry.length);
assert.deepEqual(manifest, buildSdgPublicManifest(), "Manifesto determinístico, sem relógio nem dados de paciente");
console.log(`[SDG core] ${authorialSdgRegistry.length} instrumentos: fonte, itens, metadados, alertas, pontuação declarada e determinismo íntegros.`);
