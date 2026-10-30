import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Contrato estático: proteção contra deriva e publicações clínicas sem revisão.
const data = readFileSync("client/src/data/clinicalLibrary.ts", "utf8");
const page = readFileSync("client/src/pages/biblioteca-clinica.tsx", "utf8");
const app = readFileSync("client/src/App.tsx", "utf8");
const nav = readFileSync("client/src/data/navigation.ts", "utf8");
const known = readFileSync("client/src/security/knownRoutes.ts", "utf8");
const workflow = readFileSync(".github/workflows/biblioteca-clinica-pauta-diaria.yml", "utf8");

for (const key of ["ICV", "IOP", "IMO", "IVP"]) {
  assert.ok(data.includes(`key: "${key}"`), `Índice ${key} ausente`);
}
for (const section of ["fundamentos", "indices", "discrepancias", "diagnosticos", "casos", "checklist", "fontes"]) {
  assert.ok(page.includes(`id="${section}"`), `Seção ${section} ausente`);
}
assert.match(data, /status: "revisao_medica"/, "Capítulo inicial precisa revisão médica");
assert.match(page, /Rascunho científico.*revisão médica pendente/);
assert.match(page, /aria-label="Escolha um dos quatro índices"/);
assert.match(page, /role="tabpanel"/);
assert.match(page, /rel="noopener noreferrer"/);
assert.match(page, /nenhuma|Nenhum|Não|não/);
assert.ok(app.includes('path="/biblioteca-clinica"'), "Rota não integrada no App");
assert.ok(nav.includes('href: "/biblioteca-clinica"'), "Menu sem Biblioteca");
assert.ok(known.includes('"/biblioteca-clinica"'), "Rota não reconhecida pela guarda");
assert.match(workflow, /cron: "0 11 \* \* \*"/);
assert.match(workflow, /issues: write/);
assert.match(workflow, /Revisão clínica e aceite explícito/);
assert.match(workflow, /Nenhum conteúdo clínico é promovido sem revisão humana/);

const refs = [...data.matchAll(/url: "(https:\/\/[^"]+)"/g)].map(x => x[1]);
assert.ok(refs.length >= 6, "Bibliografia insuficiente");
assert.ok(refs.every(url => url.startsWith("https://")), "Referência insegura");
assert.ok(data.includes("Consensus") && data.includes("cota mensal esgotada"), "Falta proveniência científica");
assert.equal((data.match(/slug: "wisc-iv-interpretacao-neuropediatria"/g) || []).length, 1, "Capítulo duplicado");
console.log(`clinical-library-static ok (4 índices, ${refs.length} fontes, 7 seções)`);
