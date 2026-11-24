import assert from "node:assert/strict";
import { structurePastedText, wordsOf } from "../../client/src/lib/renderizador/auto-structure.mjs";
import { contentFromMarkdown } from "../../client/src/lib/renderizador/document.mjs";

// Texto 100% sintético, no formato de um laudo colado do Word (sem #).
const pasted = [
  "DOCUMENTO DEMONSTRATIVO",
  "1. IDENTIFICAÇÃO",
  "Criança fictícia de demonstração, sete anos, segundo ano, acompanhada pela responsável.",
  "Seção de demonstração",
  "A responsável relata dificuldade de atenção desde a pré-escola, com piora no ano",
  "letivo atual e queixas escolares frequentes.",
  "Itens de exemplo:",
  "• Primeiro item sintético",
  "• Segundo item sintético",
  "Intervenção\tFrequência\tObjetivo",
  "Exemplo A\t1 h/semana\tObjetivo sintético",
  "Exemplo B\t1 h/quinzena\tOutro objetivo",
  "Encerramento",
  "Texto final de demonstração sem conteúdo clínico real.",
].join("\r\n");

const r = structurePastedText(pasted);
assert.equal(r.mode, "plain");
assert.deepEqual(wordsOf(r.markdown), wordsOf(pasted), "nenhuma palavra pode ser alterada, removida ou reordenada");
const blocks = contentFromMarkdown(r.markdown);
const headings = blocks.filter((b) => b.type === "heading").map((b) => b.runs.map((x) => x.text).join(""));
assert.equal(blocks.find((b) => b.type === "heading").depth, 1, "primeira linha em caixa alta vira título do documento");
assert.deepEqual(r.titles, headings, "a tela lista exatamente os títulos usados no PDF");
assert.deepEqual(headings, ["DOCUMENTO DEMONSTRATIVO", "1. IDENTIFICAÇÃO", "Seção de demonstração", "Itens de exemplo:", "Encerramento"]);
assert.equal(blocks.filter((b) => b.type === "table").length, 1, "tabela colada com tabulações vira tabela");
assert.equal(blocks.find((b) => b.type === "list").items.length, 2, "marcadores • viram lista");
assert.ok(r.markdown.includes("piora no ano letivo atual"), "linha quebrada no meio da frase é reunida no mesmo parágrafo");
console.log("Texto colado sem #: títulos, lista, tabela e parágrafos estruturados sem alterar palavras: OK");

// Texto já marcado com # é respeitado como está.
const md = "# Título\n\nParágrafo único.\n\n## Seção\n\nOutro parágrafo.";
assert.equal(structurePastedText(md).markdown.trim(), md);
assert.equal(structurePastedText(md).mode, "markdown");

// Tabela com barras verticais sem a linha separadora recebe a separação.
const pipe = structurePastedText("# T\n\n| A | B |\n| um | dois |");
assert.equal(contentFromMarkdown(pipe.markdown).filter((b) => b.type === "table").length, 1);

// Cabeçalho clínico explícito e unidade reconhecida geram tabela sem inferir campos.
const free = structurePastedText("Terapia Carga Objetivo\nFonoaudiologia 3 h/semana Comunicação funcional");
assert.equal(contentFromMarkdown(free.markdown).filter((b) => b.type === "table").length, 1);
assert.deepEqual(wordsOf(free.markdown), wordsOf("Terapia Carga Objetivo\nFonoaudiologia 3 h/semana Comunicação funcional"));

// Texto sem nenhum título continua renderizável (sem bloqueio).
const none = structurePastedText("apenas um parágrafo sintético em minúsculas, sem título.");
assert.equal(none.headings, 0);
assert.ok(contentFromMarkdown(none.markdown).length >= 1);
console.log("Markdown explícito respeitado, tabela com barras corrigida e prescrição reconhecida sem inferência de campos: OK");

const meds = "# Prescrição de medicamentos\n\nMedicamento A 2,5 mg/mL — 0,5 mL à noite\nMedicamento B 10 mg — 1 comprimido pela manhã\n\n## Observações\nReavaliar.";
const medResult = structurePastedText(meds);
assert.equal(medResult.tables, 1);
assert.deepEqual(wordsOf(medResult.markdown), wordsOf(meds));
assert.ok(medResult.markdown.includes("2,5 mg/mL — 0,5 mL à noite"));
assert.ok(medResult.markdown.includes("10 mg — 1 comprimido pela manhã"));
assert.equal(structurePastedText(medResult.markdown).markdown, medResult.markdown);
const ambiguous = "# Prescrição de medicamentos\n\nConsiderar ajuste após revisão.";
assert.equal(structurePastedText(ambiguous).tables, 0);
assert.equal(structurePastedText("Histórico\nMedicamento A 10 mg em uso").tables, 0);

// Linha de registro profissional ao fim do texto não vira seção numerada.
{
  const tail = "Considerando a idade, recomenda-se avaliação em sessões curtas, com pausas programadas.\n\nDr. Nome Sintético\nNeuropediatra\nCRM-PE 00.000 | RQE 00.000\nSoli Deo Gloria";
  const r = structurePastedText(tail);
  assert.equal(r.headings, 0, "CRM/RQE não é título");
  assert.ok(!r.titles.some((t) => /CRM-PE/.test(t)));
  assert.deepEqual(wordsOf(r.markdown), wordsOf(tail));
  console.log("Linha de registro CRM/RQE permanece texto, sem criar seção: OK");
}
