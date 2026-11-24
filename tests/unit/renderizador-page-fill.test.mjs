// Trava de layout do Renderizador: em dezenas de documentos sintéticos
// (títulos, parágrafos curtos e longos, listas, tabelas, citações, fios), nenhuma
// folha antes da última termina acima da metade, e a assinatura nunca fica
// sozinha. Determinístico (semente fixa), sem dados clínicos.
import assert from "node:assert/strict";
import fs from "node:fs";
import { jsPDF } from "jspdf";
import { createPantPdf, MIN_PAGE_FILL, assertPageFill } from "../../client/src/lib/renderizador/document.mjs";

const root = process.cwd() + "/client/public/renderizador/";
const asset = (name) => JSON.parse(fs.readFileSync(root + name + ".json", "utf8")).data;
const assets = {
  fonts: { normal: asset("regular.ttf"), bold: asset("bold.ttf"), italic: asset("italic.ttf") },
  logo: "data:image/png;base64," + asset("brasao.png"),
  // Traço sintético (não é a assinatura real).
  signature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAAAoCAYAAADAOHfQAAABKUlEQVR42u3aQQrCMBBA0QY8gmvP6RE8p2vvoNsiYoumYSbz/kYQdJGZRyO4LJIkSZIkSZIkSVLtzpfrc/0qZe9UCe6n9x73W7MGylqrhHYrmBVxj7/tZQMXZMXe3RKA98B9P4hfPiONftBMC7gXQJAV+VY4HeAjwcGsqFhTA957ML1wgaxoWFMCjgAJZlD//Y6j9qOBC7JyYA0POBMQmGGNMGMYQIY1AdSQgGdbfphhnR5whSUHGdbpAFddaphhTQ3YAjsHWJMBtqzOB9aEgC2m84I1GeDRf3GEGVZ1AOxpC3IvqHZlIGBwa2OGNSFgaGtChjU5YHDrYPZ7tRhgA8sLGdZCV+j1sA0uL2ZYCwM2xBqQzXlCwJoTM6xS8eu1JEmSJEmSJG32AioYHtEweQA9AAAAAElFTkSuQmCC",
};
const meta = { patient: "Documento demonstrativo", detail: "", title: "Laudo Neuropediátrico", subtitle: "Avaliação" };

let seed = 20261124;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const int = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const words = "texto sintético de demonstração sem dados de paciente com **destaque** para conferir a paginação e o respiro da folha".split(" ");
const sentence = () => {
  const n = int(6, 22);
  const w = Array.from({ length: n }, () => words[int(0, words.length - 1)]).join(" ");
  return w[0].toUpperCase() + w.slice(1) + ".";
};
const paragraphText = (a, b) => Array.from({ length: int(a, b) }, sentence).join(" ");
const block = (kind) => {
  switch (kind) {
    case "h2": return "## Seção " + sentence().slice(0, int(8, 60));
    case "h3": return "### Detalhe " + sentence().slice(0, int(6, 40));
    case "p": return paragraphText(1, 3);
    case "plong": return paragraphText(6, 30);
    case "list": return Array.from({ length: int(1, 6) }, () => "- " + paragraphText(1, 2)).join("\n");
    case "olist": return Array.from({ length: int(1, 5) }, (_, i) => i + 1 + ". " + paragraphText(1, 2)).join("\n");
    case "table": {
      const cols = int(2, 3);
      const head = "| " + Array.from({ length: cols }, (_, i) => "Coluna " + (i + 1)).join(" | ") + " |";
      const sep = "| " + Array.from({ length: cols }, () => "---").join(" | ") + " |";
      const rows = Array.from({ length: int(1, 14) }, () => "| " + Array.from({ length: cols }, () => sentence().slice(0, int(10, 160))).join(" | ") + " |");
      return [head, sep, ...rows].join("\n");
    }
    case "quote": return "> " + paragraphText(1, 4);
    case "rule": return "---";
  }
};
const kinds = ["h2", "h2", "h3", "p", "p", "plong", "plong", "list", "olist", "table", "quote", "rule"];
const lastKinds = ["p", "plong", "list", "olist", "table", "quote", "h2", "rule"];

let checked = 0;
let secondPass = 0;
let pages = 0;
// Cada PDF leva ~1 s (fontes incorporadas): 24 documentos cobrem 3× cada tipo de bloco final.
for (let doc = 0; doc < 24; doc++) {
  const parts = ["# Laudo"];
  const n = int(2, 26);
  for (let i = 0; i < n; i++) parts.push(block(kinds[int(0, kinds.length - 1)]));
  parts.push(block(lastKinds[doc % lastKinds.length]));
  const md = parts.join("\n\n");
  for (const releaseStatus of doc % 4 === 0 ? ["draft", "definitive"] : ["definitive"]) {
    let pdf;
    try {
      pdf = createPantPdf(jsPDF, md, { ...meta, releaseStatus }, assets);
    } catch (error) {
      fs.writeFileSync("/tmp/renderizador-page-fill-falha.md", md);
      throw Error(`documento sintético ${doc} (${releaseStatus}): ${error.message} — Markdown em /tmp/renderizador-page-fill-falha.md`);
    }
    const { fill, usable, closingAlone } = pdf.pantLayout;
    assert.equal(fill.length, pdf.getNumberOfPages() - 1, "uma medida por folha de conteúdo");
    fill.slice(0, -1).forEach((used, i) => assert.ok(used / usable >= MIN_PAGE_FILL, `doc ${doc}: folha ${i + 1} com ${Math.round((used / usable) * 100)}%`));
    assert.ok(fill.every((used) => used > 0), `doc ${doc}: folha sem conteúdo`);
    assert.equal(closingAlone, false, `doc ${doc}: assinatura sozinha na folha`);
    if (pdf.pantLayout.passes === 2) secondPass++;
    checked++;
    pages += fill.length;
  }
}
assert.ok(secondPass >= 1, "o corpus precisa exercitar o fecho que desce com o último trecho");
// A própria trava recusa um layout subpreenchido ou com fecho isolado.
assert.throws(() => assertPageFill({ fill: [200, 600], usable: 666, closingAlone: false }), /folha 1 ficaria preenchida só até 30%/);
assert.throws(() => assertPageFill({ fill: [600, 400], usable: 666, closingAlone: true }), /assinatura ficaria sozinha/);
assert.doesNotThrow(() => assertPageFill({ fill: [600, 40], usable: 666, closingAlone: false }), "a última folha pode ser curta");
console.log(`Trava de preenchimento: ${checked} PDFs sintéticos, ${pages} folhas, nenhuma abaixo de ${MIN_PAGE_FILL * 100}% antes da última e assinatura sempre acompanhada de texto (${secondPass} com fecho reposicionado): OK`);
