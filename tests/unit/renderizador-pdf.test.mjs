import assert from "node:assert/strict";
import { hasUnfilledTableTemplate, structuredTableTemplate } from "../../client/src/lib/renderizador/table-editor.mjs";
import fs from "node:fs";
import { jsPDF } from "jspdf";
import {
  createPantPdf,
  contentFromMarkdown,
  pdfReleaseLabel,
  headingNumbering,
  layoutRuns,
  sample,
} from "../../client/src/lib/renderizador/document.mjs";

const root = process.cwd() + "/client/public/renderizador/";
const asset = (name) => JSON.parse(fs.readFileSync(root + name + ".json", "utf8")).data;
const assets = {
  fonts: {
    normal: asset("regular.ttf"),
    bold: asset("bold.ttf"),
    italic: asset("italic.ttf"),
  },
  logo: "data:image/png;base64," + asset("brasao.png"),
};
const meta = {
  patient: "Documento demonstrativo",
  detail: "Exemplo sem dados clínicos",
  title: "Laudo Neuropediátrico",
  subtitle: "Avaliação neuropediátrica",
};
const long = Array.from(
  { length: 14 },
  (_, i) => `## Seção ${i + 1}\n\n` +
    "Texto de teste para verificar continuidade e paginação sem dados clínicos. A informação deve permanecer integral e legível. ".repeat(12),
).join("\n\n") + "\n\n| Campo | Descrição |\n| --- | --- |\n" +
  Array.from({ length: 60 }, (_, i) => `| Linha ${i + 1} | Informação de teste preservada |`).join("\n");

for (const [name, markdown, minPages] of [["sample", sample, 2], ["long", long, 12]]) {
  const pdf = createPantPdf(jsPDF, markdown, meta, assets);
  assert.ok(pdf.getNumberOfPages() >= minPages, `${name}: paginou o conteúdo integral`);
  const bytes = Buffer.from(pdf.output("arraybuffer"));
  assert.equal(bytes.subarray(0, 5).toString(), "%PDF-");
  assert.ok(bytes.length > 5000, `${name}: PDF contém o documento renderizado`);
  fs.writeFileSync(`/tmp/pant-${name}.pdf`, bytes);
}

for (const markdown of ["<script>alert(1)</script>", "![foto](https://example.com/x.png)"]) {
  assert.throws(() => contentFromMarkdown(markdown), /HTML|Imagens/);
}
console.log("PDF PANT local, documento longo, tabela paginada e rejeição de HTML/imagens: OK");

const markers = contentFromMarkdown("+++Diagnóstico firmado+++ e ==revisão necessária==.");
assert.equal(markers[0].type, "paragraph");
assert.equal(markers[0].runs.map((run) => run.text).join(""), "Diagnóstico firmado e revisão necessária.");
assert.ok(markers[0].runs.filter((run) => run.bold).length >= 2, "destaques PANT preservam negrito");

const longParagraph = "Trecho demonstrativo sem informação clínica. ".repeat(1150);
const longPdf = createPantPdf(jsPDF, longParagraph, meta, assets);
assert.ok(longPdf.getNumberOfPages() >= 3, "parágrafo longo deve paginar sem extravasar da folha");
console.log("Marcadores PANT e paginação interna de parágrafos longos: OK");

const tableMarkdown = "| Terapia | Carga | Objetivo |\n| --- | --- | --- |\n| Fonoaudiologia | 3 h/semana | Comunicação funcional |";
const parsedTable = contentFromMarkdown(tableMarkdown);
assert.equal(parsedTable.length, 1, "tabela estruturada deve ser um único bloco");
assert.equal(parsedTable[0].type, "table");
assert.equal(parsedTable[0].header.map((cell) => cell.map((run) => run.text).join("")).join("|"), "Terapia|Carga|Objetivo");
assert.equal(parsedTable[0].rows[0].map((cell) => cell.map((run) => run.text).join("")).join("|"), "Fonoaudiologia|3 h/semana|Comunicação funcional");
const plainLines = contentFromMarkdown("Terapia Carga Objetivo\nFonoaudiologia 3 h/semana Comunicação funcional");
assert.ok(plainLines.every((block) => block.type === "paragraph"), "texto livre clínico nunca deve virar tabela por inferência");
console.log("Tabelas estruturadas preservadas e texto livre mantido sem inferência: OK");

const tableTemplate = structuredTableTemplate();
assert.equal(hasUnfilledTableTemplate(tableTemplate), true, "modelo de tabela deve permanecer pendente");
assert.equal(hasUnfilledTableTemplate(tableTemplate.replace("Cabeçalho 1", "Terapia")), true, "qualquer célula de exemplo restante deve bloquear a geração");
assert.equal(hasUnfilledTableTemplate(tableTemplate.replaceAll("Cabeçalho 1", "Terapia").replaceAll("Cabeçalho 2", "Carga").replaceAll("Cabeçalho 3", "Objetivo").replaceAll("[preencher]", "Exemplo")), false, "tabela preenchida deve liberar a validação");
const parsedTemplate = contentFromMarkdown(tableTemplate.replaceAll("Cabeçalho 1", "Terapia").replaceAll("Cabeçalho 2", "Carga").replaceAll("Cabeçalho 3", "Objetivo").replaceAll("[preencher]", "Exemplo"));
assert.equal(parsedTemplate[0].type, "table", "estrutura inserida deve chegar ao parser como tabela");


const draftPdf = createPantPdf(jsPDF, "## Documento demonstrativo", { ...meta, releaseStatus: "draft" }, assets);
assert.ok(draftPdf.getNumberOfPages() >= 2);
assert.equal(pdfReleaseLabel("draft"), "RASCUNHO · NÃO LIBERADO");
assert.doesNotMatch(pdfReleaseLabel("draft") + pdfReleaseLabel("definitive"), /[—–]/, "selos do PDF sem travessão");
const definitivePdf = createPantPdf(jsPDF, "## Documento demonstrativo", { ...meta, releaseStatus: "definitive" }, assets);
assert.ok(definitivePdf.getNumberOfPages() >= 2);
assert.equal(pdfReleaseLabel("definitive"), "VERSÃO DEFINITIVA · REVISÃO MÉDICA CONFIRMADA");
console.log("PDF de rascunho identificado e versão definitiva separada após revisão: OK");

const oversizeCell = "| Terapia | Objetivo |\n| --- | --- |\n| Demonstração | " +
  "Descrição sintética longa para testar continuação de célula sem perder colunas. ".repeat(240) + " |";
const oversizedPdf = createPantPdf(jsPDF, oversizeCell, meta, assets);
assert.ok(oversizedPdf.getNumberOfPages() >= 4,
  "uma única célula muito longa deve continuar em outras páginas, repetindo cabeçalho e preservando colunas");
console.log("Célula de tabela muito extensa continua em outras páginas: OK");

// Numeração de seções: só no nível de seção e nunca sobre a numeração do autor.
const titled = contentFromMarkdown("# Laudo\n\n## Seção A\n\ntexto\n\n### Detalhe\n\ntexto\n\n## Seção B\n\ntexto");
const nums = headingNumbering(titled);
assert.deepEqual(titled.filter((b) => b.type === "heading").map((b) => nums.get(b) ?? null), [null, 1, null, 2]);
const authored = contentFromMarkdown("## 1. Identificação\n\ntexto\n\n## 2. História\n\ntexto");
assert.equal(headingNumbering(authored).size, 0, "títulos já numerados pelo autor não recebem segundo número");
const chapters = contentFromMarkdown("# Capítulo A\n\ntexto\n\n# Capítulo B\n\ntexto");
assert.equal(headingNumbering(chapters).size, 2, "capítulos # do PANT continuam numerados");
console.log("Numeração de seções sem duplicidade com a do autor: OK");

// Justificação: linhas quebradas preenchem a largura; a última linha não estica.
const probe = new jsPDF({ unit: "pt", format: "a4" });
probe.addFileToVFS("regular.ttf", assets.fonts.normal);
probe.addFont("regular.ttf", "Cormorant", "normal");
const laid = layoutRuns(probe, [{ text: "palavra ".repeat(80) + "fim" }], 437, 12.5);
assert.ok(laid.length > 2);
assert.ok(laid.slice(0, -1).every((l) => !l.hardBreak && l.width <= 437), "linhas quebradas cabem na largura");
assert.equal(laid.at(-1).hardBreak, true, "última linha do parágrafo fica alinhada à esquerda");
assert.equal(laid.flatMap((l) => l.words.map((w) => w.text)).join(" "), ("palavra ".repeat(80) + "fim").trim(), "layout preserva todas as palavras na ordem");
console.log("Justificação preserva palavras e não estica a última linha: OK");


// Justificação não pode separar fragmentos formatados sem espaço (doses como **5**,0 mg).
const drawn = [];
// jsPDF defines text() on each instance, so the instance itself is instrumented.
function RecordingPdf(options) {
  const pdf = new jsPDF(options);
  const original = pdf.text.bind(pdf);
  pdf.text = (text, x, y, opts) => {
    if (typeof text === "string") drawn.push({ text, x, y, width: pdf.getTextWidth(text) });
    return original(text, x, y, opts);
  };
  return pdf;
}
const doseMd = "Dose **5**,0 mg pela manhã " + "com texto sintético de preenchimento ".repeat(12);
createPantPdf(RecordingPdf, doseMd, meta, assets);
const five = drawn.findIndex((d) => d.text === "5");
assert.ok(five > -1 && drawn[five + 1].text === ",0", "número e vírgula decimal desenhados em sequência");
assert.equal(drawn[five + 1].y, drawn[five].y, "na mesma linha justificada");
assert.ok(Math.abs(drawn[five + 1].x - (drawn[five].x + drawn[five].width)) < 0.01, "5 e ,0 permanecem colados após justificar");
const lineWords = drawn.filter((d) => d.y === drawn[five].y);
assert.ok(lineWords.at(-1).x + lineWords.at(-1).width > 79 + 437 - 0.5, "a linha foi de fato justificada até a margem");
console.log("Justificação preserva números e palavras com formatação interna: OK");
