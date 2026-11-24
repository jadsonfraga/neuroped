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

// "Quadro de terapias" / "Quadro de farmacologia" do texto padrão: enquadrados automaticamente,
// em qualquer delimitação usual, sem alterar, acrescentar ou reordenar palavra.
{
  const tableCells = (markdown) =>
    contentFromMarkdown(markdown).filter((b) => b.type === "table").map((t) => ({
      header: t.header.map((c) => c.map((r) => r.text).join("")),
      rows: t.rows.map((row) => row.map((c) => c.map((r) => r.text).join(""))),
    }));
  const check = (label, input, expected) => {
    const r = structurePastedText(input);
    assert.deepEqual(wordsOf(r.markdown), wordsOf(input), `${label}: nenhuma palavra alterada`);
    assert.equal(r.tables, expected.tables, `${label}: tabelas convertidas`);
    assert.equal(structurePastedText(r.markdown).markdown, r.markdown, `${label}: reaplicar não muda o resultado`);
    return r;
  };

  // Espaços duplos (texto extraído de PDF/Word), título em caixa alta e seção seguinte preservada.
  const spaced = check("espaços duplos",
    "V. CONDUTA\nAbertura sintética da conduta.\n\nQUADRO DE TERAPIAS\nTerapia  Carga  Responsável  Objetivo\nFonoaudiologia  2 h/semana  Fonoaudióloga  Pedir ajuda\nPsicoterapia  1 h/semana  Psicóloga  Organizar a rotina\n\nVI. RETORNO\nEm 90 dias.",
    { tables: 1 });
  const t1 = tableCells(spaced.markdown);
  assert.equal(t1.length, 1);
  assert.deepEqual(t1[0].header, ["Terapia", "Carga", "Responsável", "Objetivo"]);
  assert.deepEqual(t1[0].rows[1], ["Psicoterapia", "1 h/semana", "Psicóloga", "Organizar a rotina"]);
  assert.ok(spaced.titles.includes("QUADRO DE TERAPIAS") && spaced.titles.includes("VI. RETORNO"), "título do quadro e seção seguinte continuam títulos");

  // Barras verticais sem as bordas externas e com a linha separadora.
  const bare = check("barras sem borda",
    "Quadro de terapias\nTerapia | Carga | Responsável | Objetivo\n--- | --- | --- | ---\nFonoaudiologia | 2 h/semana | Fonoaudióloga | Pedir ajuda",
    { tables: 1 });
  assert.deepEqual(tableCells(bare.markdown)[0].rows, [["Fonoaudiologia", "2 h/semana", "Fonoaudióloga", "Pedir ajuda"]]);

  // Tabulação com os tratamentos já na primeira linha: o título vira o cabeçalho, nenhum tratamento vira cabeçalho.
  const dataFirst = check("dados primeiro",
    "QUADRO DE TERAPIAS\nFonoaudiologia\t2 h/semana\tFonoaudióloga\tPedir ajuda\nPsicoterapia\t1 h/semana\tPsicóloga\tRotina",
    { tables: 1 });
  const t3 = tableCells(dataFirst.markdown)[0];
  assert.equal(t3.header[0], "QUADRO DE TERAPIAS");
  assert.equal(t3.rows.length, 2, "os dois tratamentos ficam como linhas do quadro");

  // Linhas livres sob "Quadro de terapias": cada linha inteira em uma célula; "Carga total" fica fora do quadro.
  const free = check("linhas livres",
    "Quadro de terapias\nFonoaudiologia, 2 h/semana, com a fonoaudióloga, para pedir ajuda\nPsicoterapia, 1 h/semana, com a psicóloga\nCarga total: 3 h/semana.",
    { tables: 1 });
  const t4 = tableCells(free.markdown)[0];
  assert.equal(t4.rows.length, 2);
  assert.ok(free.markdown.trim().endsWith("Carga total: 3 h/semana."), "carga total permanece como parágrafo depois do quadro");

  // Cabeçalho de colunas sem delimitador: o título continua título e a linha de colunas é o cabeçalho.
  const header = check("cabeçalho sem delimitador",
    "QUADRO DE TERAPIAS\nTerapia Carga Responsável Objetivo\nFonoaudiologia 2 h/semana Fonoaudióloga Pedir ajuda",
    { tables: 1 });
  assert.ok(header.titles.includes("QUADRO DE TERAPIAS"));
  assert.equal(tableCells(header.markdown)[0].header[0], "Terapia Carga Responsável Objetivo");

  // Heading Markdown explícito (modo markdown) também é enquadrado.
  check("markdown com ##", "# Laudo\n\n## Quadro de terapias\n\nFonoaudiologia, 2 h/semana, com a fonoaudióloga\nPsicoterapia, 1 h/semana, com a psicóloga", { tables: 1 });

  // Quadro de farmacologia com cabeçalho por espaços duplos e doses preservadas.
  const pharma = check("farmacologia",
    "QUADRO DE FARMACOLOGIA\nMedicamento e concentração  Dose por tomada  Horários  Duração e ajustes\nMedicamento A 2,5 mg/mL  0,5 mL (1,25 mg)  à noite  revisar em 30 dias",
    { tables: 1 });
  assert.deepEqual(tableCells(pharma.markdown)[0].rows[0], ["Medicamento A 2,5 mg/mL", "0,5 mL (1,25 mg)", "à noite", "revisar em 30 dias"]);

  // Prosa sob o título nunca vira quadro; seção de prosa que apenas cita terapias não é tocada.
  assert.equal(structurePastedText("Quadro de terapias\nAs terapias foram escolhidas porque a criança precisa de apoio na comunicação e na rotina escolar.").tables, 0);
  assert.equal(structurePastedText("V. O que as terapias registram\nA fonoterapia, com 2 horas semanais, tem como responsável a fonoaudióloga.").tables, 0);
  assert.equal(structurePastedText("Duas frases  com espaço duplo  no meio de um parágrafo comum.\nOutra linha  qualquer.").tables, 0, "espaços duplos fora de contexto clínico não formam tabela");
  console.log("Quadro de terapias e de farmacologia enquadrados automaticamente (tabulação, espaços, barras, linhas livres), sem alterar palavras: OK");
}

// Linha de registro profissional ao fim do texto não vira seção numerada.
{
  const tail = "Considerando a idade, recomenda-se avaliação em sessões curtas, com pausas programadas.\n\nDr. Nome Sintético\nNeuropediatra\nCRM-PE 00.000 | RQE 00.000\nSoli Deo Gloria";
  const r = structurePastedText(tail);
  assert.equal(r.headings, 0, "CRM/RQE não é título");
  assert.ok(!r.titles.some((t) => /CRM-PE/.test(t)));
  assert.deepEqual(wordsOf(r.markdown), wordsOf(tail));
  console.log("Linha de registro CRM/RQE permanece texto, sem criar seção: OK");
}
