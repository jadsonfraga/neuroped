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

// Texto livre separado por espaços nunca vira tabela por inferência.
const free = structurePastedText("Terapia Carga Objetivo\nFonoaudiologia 3 h/semana Comunicação funcional");
assert.ok(contentFromMarkdown(free.markdown).every((b) => b.type !== "table"));

// Texto sem nenhum título continua renderizável (sem bloqueio).
const none = structurePastedText("apenas um parágrafo sintético em minúsculas, sem título.");
assert.equal(none.headings, 0);
assert.ok(contentFromMarkdown(none.markdown).length >= 1);
console.log("Markdown explícito respeitado, tabela com barras corrigida e texto livre sem inferência de tabela: OK");
