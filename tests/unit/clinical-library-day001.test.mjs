import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const data = readFileSync("client/src/data/clinicalLibrary.ts", "utf8");
const page = readFileSync("client/src/pages/biblioteca-clinica.tsx", "utf8");
const day = readFileSync("client/src/pages/biblioteca-clinica-tea-timidez.tsx", "utf8");
const workflow = readFileSync(".github/workflows/biblioteca-clinica-pauta-diaria.yml", "utf8");

const title = "Como distinguir sinais de TEA de timidez na primeira infância?";
assert.equal((data.match(/slug: "tea-timidez-primeira-infancia"/g) ?? []).length, 1, "Dia 01 duplicado no catálogo");
assert.equal((data.match(/day: 1,/g) ?? []).length, 1, "Dia 01 deve ser único");
assert.ok(data.includes('title: "' + title + '"'), "Pergunta deve coincidir com índice canônico");
assert.ok(day.includes("Dia 01/365 — " + title), "Título visível divergente do índice");
assert.ok(page.includes("<TeaTimidezChapter />"), "Capítulo não integrado à Biblioteca");
assert.ok(page.includes("capitulo-tea-timidez"), "Link do capítulo não navegável");
assert.ok(day.includes('id="capitulo-tea-timidez"'), "Âncora do capítulo ausente");
for (const heading of ["Em 30 segundos", "Sinais que mudam a conduta", "Fluxograma decisório", "Achado → interpretação → próxima ação", "Consulta operacional", "Investigar agora ou observar", "Manejo, família e escola", "Caso de treinamento", "Três erros frequentes", "Incerteza e força da evidência", "Bibliografia auditável"]) {
  assert.ok(day.includes(heading), "Seção obrigatória ausente: " + heading);
}
assert.equal((day.match(/url: "https:\/\//g) ?? []).length, 8, "Exigir oito referências verificáveis");
assert.ok(day.includes('rel="noopener noreferrer"'), "Links externos sem proteção");
assert.ok(day.includes('aria-label="Fluxo clínico'), "Fluxograma sem rótulo acessível");
assert.ok(day.includes("Consensus indisponível") && day.includes("cota mensal"), "Proveniência Consensus ausente");
assert.ok(day.includes("Sem aceite ou assinatura médica"), "Status clínico inseguro");
assert.ok(!day.includes("status: \"publicado\""), "Capítulo não pode se autopromover");
assert.ok(!workflow.includes("github.rest.issues.create"), "Workflow não pode inventar pauta independente do índice");
assert.ok(data.includes("Como diferenciar desatenção de imaturidade etária?"), "Próxima entrada não canônica");
console.log("clinical-library-day001 ok: índice, 11 seções, 8 fontes, fluxo, revisão, pauta protegida");
