import { marked } from "marked";

export const sample = `## Quem é a criança

Este é um **documento demonstrativo**, sem dados de paciente. Substitua este texto pelo conteúdo integral do laudo aprovado.

## História e avaliação

O texto do Markdown é preservado na renderização. Títulos, parágrafos, listas e tabelas recebem a identidade visual SuperNeuroPed.

## Plano de acompanhamento

- Registre as orientações já definidas na avaliação.
- Descreva os objetivos individualizados.
- Informe o acompanhamento conforme a decisão médica.

| Domínio | Objetivo |
| --- | --- |
| Comunicação | Inserir objetivo aprovado |
| Autonomia | Inserir objetivo aprovado |`;

const COLORS = {
  navy: [10, 24, 48],
  gold: [196, 163, 77],
  ivory: [245, 239, 226],
  ink: [27, 32, 51],
  muted: [138, 133, 120],
  line: [217, 203, 169],
  white: [255, 255, 255],
  red: [164, 30, 30],
  // Negrito clínico em salmão profundo: 4,8:1 sobre o papel marfim (AA para texto).
  salmon: [176, 71, 58],
  numeral: [168, 128, 31],
  rule: [227, 207, 155],
};

const DOCTOR_NAME = "Dr. Jadson Fraga Araújo Júnior";
const DOCTOR_CREDENTIALS = "NEUROPEDIATRA · CRM-PE 25.227 · RQE 17.756";
const BODY_SIZE = 12.5;
const BODY_LEADING = 19;

function inlineRuns(tokens = [], style = {}) {
  return tokens.flatMap((token) => {
    if (token.type === "image")
      throw Error("Imagens no Markdown não são aceitas. Remova a referência à imagem antes de renderizar.");
    if (token.type === "html")
      throw Error("Use Markdown puro: HTML embutido não é aceito.");
    if (token.type === "br") return [{ text: "\n", ...style }];
    if (["strong", "em", "del", "link"].includes(token.type)) {
      const next = { ...style };
      if (token.type === "strong") next.bold = true;
      if (token.type === "em") next.italic = true;
      if (token.type === "del") next.strike = true;
      if (token.type === "link") next.link = /^https?:\/\//i.test(token.href || "") ? token.href : null;
      return inlineRuns(token.tokens, next);
    }
    if (token.tokens) return inlineRuns(token.tokens, style);
    return [{ text: token.text ?? token.raw ?? "", ...style }];
  });
}

function flattenText(tokens = []) {
  return inlineRuns(tokens).map((run) => run.text).join("");
}

export function contentFromMarkdown(md) {
  // PANT source documents can use +++...+++ and ==...== for clinical emphasis.
  // Convert only balanced, single-line markers; never rewrite clinical words.
  const normalized = md
    .replace(/\+\+\+([^\n+][^\n]*?)\+\+\+/g, "**$1**")
    .replace(/==([^\n=][^\n]*?)==/g, "**$1**");
  let headingNumber = 0;
  function visit(tokens, depth = 0) {
    return tokens.flatMap((token) => {
      switch (token.type) {
        case "space":
          return [];
        case "heading":
          headingNumber += 1;
          return [{ type: "heading", number: headingNumber, depth: token.depth, runs: inlineRuns(token.tokens) }];
        case "paragraph":
        case "text":
          return [{ type: "paragraph", runs: inlineRuns(token.tokens || [{ text: token.text }]), depth }];
        case "list":
          return [{
            type: "list",
            ordered: Boolean(token.ordered),
            start: token.start || 1,
            items: token.items.map((item) => ({
              runs: item.tokens.flatMap((part) => part.type === "list" ? [] : inlineRuns(part.tokens || [{ text: part.text ?? part.raw ?? "" }])),
              nested: item.tokens.filter((part) => part.type === "list").flatMap((part) => visit([part], depth + 1)),
            })),
            depth,
          }];
        case "table":
          return [{
            type: "table",
            header: token.header.map((cell) => inlineRuns(cell.tokens)),
            rows: token.rows.map((row) => row.map((cell) => inlineRuns(cell.tokens))),
          }];
        case "blockquote":
          return [{ type: "quote", blocks: visit(token.tokens, depth + 1) }];
        case "code":
          return [{ type: "code", text: token.text }];
        case "hr":
          return [{ type: "rule" }];
        case "html":
          throw Error("Use Markdown puro: HTML embutido não é aceito.");
        default:
          throw Error("Elemento Markdown não suportado: " + token.type);
      }
    });
  }
  return visit(marked.lexer(normalized));
}

export function pdfReleaseLabel(status) {
  return status === "definitive"
    ? "VERSÃO DEFINITIVA · REVISÃO MÉDICA CONFIRMADA"
    : "RASCUNHO · NÃO LIBERADO";
}

function fontStyle(run = {}) {
  if (run.bold && run.italic) return "bolditalic";
  if (run.bold) return "bold";
  if (run.italic) return "italic";
  return "normal";
}

function withFont(doc, run = {}, size = 12.5) {
  doc.setFont(run.mono ? "courier" : "Cormorant", run.mono ? "normal" : fontStyle(run));
  doc.setFontSize(size);
  if (run.link) doc.setTextColor(...COLORS.gold);
  else if (run.bold && !run.mono) doc.setTextColor(...COLORS.salmon);
  else if (run.quote) doc.setTextColor(105, 86, 49);
  else doc.setTextColor(...COLORS.ink);
}

// Lays out styled runs into lines first, then paints them. Lines that wrap
// are justified (extra space spread across word gaps); the last line of a
// paragraph and lines ended by an explicit break stay left-aligned.
export function layoutRuns(doc, runs, maxWidth, size = 12.5) {
  const lines = [];
  let line = { words: [], width: 0, hardBreak: false };
  let pendingSpace = 0;
  const push = (hardBreak) => {
    line.hardBreak = hardBreak;
    lines.push(line);
    line = { words: [], width: 0, hardBreak: false };
    pendingSpace = 0;
  };
  for (const run of runs) {
    const pieces = String(run.text || "").split(/(\s+|\n)/).filter((part) => part.length);
    for (const piece of pieces) {
      if (piece === "\n") {
        push(true);
        continue;
      }
      withFont(doc, run, size);
      if (/^\s+$/.test(piece)) {
        if (line.words.length) pendingSpace = doc.getTextWidth(" ");
        continue;
      }
      const width = doc.getTextWidth(piece);
      if (line.words.length && line.width + pendingSpace + width > maxWidth) push(false);
      const gap = line.words.length ? pendingSpace : 0;
      line.words.push({ text: piece, run, width, gap });
      line.width += gap + width;
      pendingSpace = 0;
    }
  }
  if (line.words.length || !lines.length) push(true);
  return lines;
}

function drawRuns(doc, runs, x, y, maxWidth, opts = {}) {
  const size = opts.size || 12.5;
  const leading = opts.leading || size * 1.45;
  const indent = opts.indent || 0;
  const width = maxWidth - indent;
  const lines = layoutRuns(doc, runs, width, size);
  let lineY = y;
  lines.forEach((line, index) => {
    if (index > 0) {
      lineY += leading;
      // Fecho do laudo: as duas últimas linhas do último parágrafo descem
      // junto com a assinatura, que nunca fica sozinha numa folha.
      const tailNeed = opts.tailReserve && index === lines.length - 2 ? leading + opts.tailReserve : 0;
      if (opts.bottom && (lineY > opts.bottom || lineY + tailNeed > opts.bottom)) {
        if (!opts.onPageBreak) throw Error("Texto ultrapassou o limite da página.");
        lineY = opts.onPageBreak();
      }
    }
    // Only real spaces stretch; style boundaries inside a word or number (e.g. **5**,0 mg) stay joined.
    const gaps = line.words.filter((word, i) => i > 0 && word.gap > 0).length;
    const slack = width - line.width;
    // Justify only wrapped lines with real gaps and a reasonable stretch.
    const justify = opts.justify !== false && !line.hardBreak && gaps > 0 && slack > 0 && slack / gaps < size * 1.2;
    const extra = justify ? slack / gaps : 0;
    let lineX = x + indent;
    line.words.forEach((word, i) => {
      if (i > 0) lineX += word.gap + (word.gap > 0 ? extra : 0);
      withFont(doc, word.run, size);
      doc.text(word.text, lineX, lineY);
      if (word.run.strike) {
        doc.setDrawColor(...COLORS.ink);
        doc.setLineWidth(0.45);
        doc.line(lineX, lineY - size * 0.3, lineX + word.width, lineY - size * 0.3);
      }
      lineX += word.width;
    });
    opts.onLine?.(lineY);
  });
  doc.setTextColor(...COLORS.ink);
  return { y: lineY + leading, lines: lines.length };
}

// Section numbers are added only when the author did not number the headings
// and only at the section level: the shallowest depth used by two or more
// headings (a lone document title above the sections stays unnumbered).
export function romanNumeral(n) {
  const table = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
  let rest = Math.floor(n);
  let out = "";
  for (const [value, glyph] of table) while (rest >= value) { out += glyph; rest -= value; }
  return out;
}

// Texto com espaçamento entre letras centralizado: o align do jsPDF ignora o
// charSpace na largura, então a posição é calculada aqui.
function spacedText(doc, text, centerX, y, charSpace) {
  const width = doc.getTextWidth(text) + charSpace * Math.max(0, text.length - 1);
  doc.text(text, centerX - width / 2, y, { charSpace });
  return width;
}

export function headingNumbering(blocks) {
  const headings = blocks.filter((block) => block.type === "heading");
  const text = (block) => flattenText(block.runs).trim();
  const authorNumbered = headings.some((block) => /^(?:\d{1,3}(?:\.\d{1,3})*[.)]?|[IVXLC]{1,6}[.)])\s/.test(text(block)));
  const numbers = new Map();
  if (authorNumbered) return numbers;
  const counts = {};
  headings.forEach((block) => { counts[block.depth] = (counts[block.depth] || 0) + 1; });
  const levels = Object.keys(counts).map(Number).filter((depth) => counts[depth] >= 2).sort((a, b) => a - b);
  if (!levels.length) return numbers;
  let n = 0;
  headings.forEach((block) => { if (block.depth === levels[0]) numbers.set(block, ++n); });
  return numbers;
}

// Trava de layout: nenhuma folha de conteúdo antes da última pode terminar
// acima da metade da área útil, e o fecho (assinatura) nunca fica sozinho.
export const MIN_PAGE_FILL = 0.5;
const CONTENT_TOP = 111;
const SIGNATURE_BOX_H = 66;
const SIGNATURE_MAX_W = 375;
const CLOSING_HEIGHT = 26 + SIGNATURE_BOX_H + 70;

export function createPantPdf(jsPDF, md, meta, assets) {
  let doc = renderPantPdf(jsPDF, md, meta, assets, null);
  if (doc.pantLayout.closingAlone) {
    // Segunda passada determinística: o último trecho de texto reserva espaço
    // para o fecho e desce com ele.
    doc = renderPantPdf(jsPDF, md, meta, assets, doc.pantLayout.tail);
    doc.pantLayout.passes = 2;
  }
  assertPageFill(doc.pantLayout);
  return doc;
}

export function assertPageFill(layout) {
  const { fill, usable } = layout;
  for (let i = 0; i < fill.length - 1; i++) {
    const ratio = fill[i] / usable;
    if (ratio < MIN_PAGE_FILL) {
      throw Error(
        `A folha ${i + 1} ficaria preenchida só até ${Math.round(ratio * 100)}% da altura. ` +
          "O PDF não foi gerado para não sair com folha subpreenchida: reduza o cabeçalho da tabela ou divida o bloco extenso e gere novamente.",
      );
    }
  }
  if (layout.closingAlone) throw Error("A assinatura ficaria sozinha numa folha. Gere novamente após ajustar o último parágrafo.");
}

function renderPantPdf(jsPDF, md, meta, assets, tail) {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4", compress: true });
  doc.setProperties({
    title: meta.title,
    author: DOCTOR_NAME,
    subject: "Laudo neuropediátrico",
    creator: "NeuroPed · Renderizador PANT",
  });
  const fontFiles = [
    ["regular.ttf", "normal"],
    ["bold.ttf", "bold"],
    ["italic.ttf", "italic"],
  ];
  for (const [file, style] of fontFiles) {
    doc.addFileToVFS(file, assets.fonts[style]);
    doc.addFont(file, "Cormorant", style);
  }

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const left = 79;
  const right = pageWidth - 79;
  const maxWidth = right - left;
  const bottom = pageHeight - 65;
  const releaseStatus = meta.releaseStatus === "definitive" ? "definitive" : "draft";

  // Brasão sempre na proporção real da imagem (o PNG é vertical, ~0,79:1):
  // encaixado na caixa e centralizado nela, nunca esticado.
  const logoProps = doc.getImageProperties(assets.logo);
  const logoRatio = logoProps.width > 0 && logoProps.height > 0 ? logoProps.width / logoProps.height : 1;
  function drawLogo(boxX, boxY, boxW, boxH, align = "center") {
    const fitW = Math.min(boxW, boxH * logoRatio);
    const fitH = fitW / logoRatio;
    const x = align === "left" ? boxX : boxX + (boxW - fitW) / 2;
    const y = boxY + (boxH - fitH) / 2;
    doc.addImage(assets.logo, "PNG", x, y, fitW, fitH, "brasao", "SLOW");
    return { x, y, w: fitW, h: fitH };
  }

  function drawFrame(cover) {
    doc.setFillColor(...(cover ? COLORS.navy : COLORS.ivory));
    doc.rect(0, 0, pageWidth, pageHeight, "F");
    doc.setDrawColor(...COLORS.gold);
    doc.setLineWidth(0.6);
    doc.rect(26, 26, pageWidth - 52, pageHeight - 52);
    doc.setLineWidth(0.3);
    doc.rect(30, 30, pageWidth - 60, pageHeight - 60);
    if (!cover) {
      drawLogo(left, 38, 25, 31, "left");
      doc.setFont("Cormorant", "normal");
      doc.setFontSize(11);
      doc.setTextColor(...COLORS.navy);
      doc.text("S U P E R N E U R O P E D", left + 37, 55);
      doc.setFontSize(8);
      doc.setTextColor(119, 119, 119);
      doc.text(DOCTOR_NAME, right, 49, { align: "right" });
      doc.text("Neuropediatra · CRM-PE 25.227 · RQE 17.756", right, 61, { align: "right" });
      doc.setFontSize(7);
      doc.setTextColor(...(releaseStatus === "draft" ? COLORS.red : COLORS.navy));
      doc.text(pdfReleaseLabel(releaseStatus), right, 91, { align: "right" });
      const y = 77;
      doc.setLineWidth(1.5);
      doc.setDrawColor(...COLORS.gold);
      doc.line(left, y, left + maxWidth * 0.5, y);
      doc.setDrawColor(...COLORS.red);
      doc.line(left + maxWidth * 0.5, y, left + maxWidth * 0.59, y);
      doc.setDrawColor(...COLORS.navy);
      doc.line(left + maxWidth * 0.59, y, right, y);
    }
  }

  drawFrame(true);
  drawLogo((pageWidth - 245) / 2, 50, 245, 130);
  doc.setFont("Cormorant", "normal");
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.gold);
  doc.text("S U P E R N E U R O P E D", pageWidth / 2, 205, { align: "center" });
  doc.setFontSize(35);
  doc.setTextColor(...COLORS.ivory);
  doc.text(doc.splitTextToSize(meta.title, 440), pageWidth / 2, 266, { align: "center" });
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.gold);
  doc.text(doc.splitTextToSize(meta.subtitle.toLocaleUpperCase("pt-BR"), 440), pageWidth / 2, 315, { align: "center" });
  doc.setFontSize(10);
  doc.text("P A C I E N T E", pageWidth / 2, 414, { align: "center" });
  doc.setFontSize(25);
  doc.setTextColor(...COLORS.ivory);
  doc.text(doc.splitTextToSize(meta.patient, 440), pageWidth / 2, 458, { align: "center" });
  doc.setFontSize(12);
  doc.text(doc.splitTextToSize(meta.detail || "", 440), pageWidth / 2, 489, { align: "center" });
  doc.setFontSize(8);
  // Both statuses must remain legible on the dark cover.
  doc.setTextColor(...COLORS.ivory);
  doc.text(pdfReleaseLabel(releaseStatus), pageWidth / 2, 665, { align: "center" });
  doc.setFontSize(15);
  doc.setTextColor(...COLORS.ivory);
  doc.text(DOCTOR_NAME, pageWidth / 2, 715, { align: "center" });
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.gold);
  doc.text(DOCTOR_CREDENTIALS, pageWidth / 2, 733, { align: "center" });
  doc.setFontSize(8);
  doc.setTextColor(180, 184, 192);
  doc.text("Rua Raimundo Lacerda, 001 · São José · Petrolina/PE · CEP 56302-470", pageWidth / 2, 752, { align: "center" });

  doc.addPage();
  drawFrame(false);
  let y = CONTENT_TOP;
  // Linha de base mais baixa realmente usada em cada folha de conteúdo.
  const fill = [0];
  let closingAlone = false;
  let paragraphCalls = 0;
  let tableRowCalls = 0;
  let lastKind = "";
  function ink(baseline) {
    const i = fill.length - 1;
    fill[i] = Math.max(fill[i], baseline - CONTENT_TOP);
  }
  function newContentPage() {
    fill.push(0);
    doc.addPage();
    drawFrame(false);
    y = 111;
  }
  function ensureSpace(height) {
    if (y + height > bottom) newContentPage();
  }
  function paragraph(runs, opts = {}) {
    const size = opts.size || BODY_SIZE;
    const leading = opts.leading || (size === BODY_SIZE ? BODY_LEADING : size * 1.45);
    const lineCount = layoutRuns(doc, runs, maxWidth - (opts.depth || 0) * 12 - (opts.indent || 0), size).length;
    // Never leave a single line of a multi-line paragraph at the foot of a page.
    // A one-line paragraph only needs its baseline to fit; the first line of a
    // longer paragraph must be accompanied by at least one more line.
    paragraphCalls += 1;
    lastKind = "paragraph";
    const tailReserve = tail?.kind === "paragraph" && paragraphCalls === tail.count ? CLOSING_HEIGHT + 14 : 0;
    ensureSpace((Math.min(lineCount, 2) - 1) * leading + (tailReserve && lineCount <= 2 ? tailReserve : 0));
    opts.beforeDraw?.();
    const out = drawRuns(doc, runs, left + (opts.depth || 0) * 12, y, maxWidth - (opts.depth || 0) * 12, {
      ...opts,
      leading,
      bottom,
      tailReserve,
      onLine: ink,
      onPageBreak: () => {
        newContentPage();
        return y;
      },
    });
    y = out.y + (opts.after ?? 9);
  }
  function renderTable(block) {
    const cols = Math.max(1, block.header.length);
    const colWidth = maxWidth / cols;
    const lineHeight = 13;
    const topPadding = 16;
    const rowHeight = (count) => Math.max(25, count * lineHeight + 12);
    const wrapCells = (cells, header) => cells.map((cell) => {
      doc.setFont("Cormorant", header ? "bold" : "normal");
      doc.setFontSize(10.5);
      return doc.splitTextToSize(flattenText(cell), colWidth - 13);
    });
    const paintSegment = (wraps, header, offset, count) => {
      const height = rowHeight(count);
      if (y + height > bottom) throw Error("Uma linha da tabela excedeu o limite da página.");
      if (header) {
        doc.setFillColor(233, 223, 201);
        doc.rect(left, y, maxWidth, height, "F");
      }
      doc.setDrawColor(...COLORS.line);
      doc.setLineWidth(0.5);
      doc.rect(left, y, maxWidth, height);
      for (let i = 1; i < cols; i++) doc.line(left + i * colWidth, y, left + i * colWidth, y + height);
      wraps.forEach((lines, i) => {
        doc.setFont("Cormorant", header ? "bold" : "normal");
        doc.setFontSize(10.5);
        doc.setTextColor(...COLORS.ink);
        const segment = lines.slice(offset, offset + count);
        if (segment.length) doc.text(segment, left + i * colWidth + 7, y + topPadding, {
          maxWidth: colWidth - 13,
        });
      });
      y += height;
      ink(y);
    };
    const headerWraps = wrapCells(block.header, true);
    const headerLines = Math.max(1, ...headerWraps.map((lines) => lines.length));
    const headerHeight = rowHeight(headerLines);
    if (headerHeight + rowHeight(1) > bottom - 111) {
      throw Error("Cabeçalho da tabela demasiado extenso. Reduza as células do cabeçalho.");
    }
    const drawHeader = () => {
      if (y + headerHeight + rowHeight(1) > bottom) newContentPage();
      paintSegment(headerWraps, true, 0, headerLines);
    };
    drawHeader();
    for (const row of block.rows) {
      const wraps = wrapCells(row, false);
      const total = Math.max(1, ...wraps.map((lines) => lines.length));
      tableRowCalls += 1;
      lastKind = "table";
      const reserve = tail?.kind === "table" && tableRowCalls === tail.count ? CLOSING_HEIGHT + 16 : 0;
      let offset = 0;
      while (offset < total) {
        const availableLines = Math.floor((bottom - reserve - y - 12) / lineHeight);
        const count = Math.min(total - offset, availableLines);
        if (count < 1 || y + rowHeight(count) > bottom) {
          newContentPage();
          drawHeader();
          continue;
        }
        paintSegment(wraps, false, offset, count);
        offset += count;
        if (offset < total) {
          newContentPage();
          drawHeader();
        }
      }
    }
    y += 16;
  }
  function renderBlock(block) {
    if (block.type === "heading") {
      // Padrão PANT: numeral romano em versalete dourado com fio curto acima de
      // um título grande, navy e em negrito.
      const number = numbering.get(block);
      const sectionLevel = number !== undefined;
      const fontSize = block.depth === 1 ? 27 : block.depth === 2 ? 24 : block.depth === 3 ? 18 : 15;
      const lineGap = fontSize * 1.18;
      doc.setFont("Cormorant", "bold");
      doc.setFontSize(fontSize);
      const lines = doc.splitTextToSize(flattenText(block.runs), maxWidth);
      const numeralHeight = sectionLevel ? 20 : 0;
      const headingHeight = numeralHeight + fontSize * 0.72 + (lines.length - 1) * lineGap + (block.depth <= 2 ? 26 : 18);
      // Respiro antes do título; no topo da folha, só o afastamento do fio do cabeçalho.
      y += y > 111 ? (block.depth <= 2 ? 22 : 12) : 10;
      // Mantém o título na mesma folha que ao menos três linhas do que vem depois.
      // Título no fim do texto desce junto com o fecho.
      ensureSpace(headingHeight + (block === blocks.at(-1) ? CLOSING_HEIGHT : 3 * BODY_LEADING));
      if (sectionLevel) {
        const numeral = romanNumeral(number);
        doc.setFont("Cormorant", "normal");
        doc.setFontSize(10);
        doc.setTextColor(...COLORS.numeral);
        doc.text(numeral, left, y, { charSpace: 2.6 });
        const numeralWidth = doc.getTextWidth(numeral) + 2.6 * Math.max(0, numeral.length - 1);
        doc.setDrawColor(...COLORS.gold);
        doc.setLineWidth(0.8);
        doc.line(left + numeralWidth + 7, y - 3.2, left + numeralWidth + 7 + 34, y - 3.2);
        y += numeralHeight;
      }
      y += fontSize * 0.72;
      doc.setFont("Cormorant", "bold");
      doc.setFontSize(fontSize);
      doc.setTextColor(...COLORS.navy);
      doc.text(lines, left, y, { lineHeightFactor: 1.18 });
      ink(y + (lines.length - 1) * lineGap);
      lastKind = "heading";
      y += (lines.length - 1) * lineGap + (block.depth <= 2 ? 26 : 18);
      return;
    }
    if (block.type === "paragraph") {
      paragraph(block.runs, { depth: block.depth });
      return;
    }
    if (block.type === "list") {
      block.items.forEach((item, i) => {
        ensureSpace(34);
        // O marcador é desenhado depois da decisão de quebra do parágrafo,
        // para nunca ficar sozinho na folha anterior.
        const marker = block.ordered ? `${block.start + i}.` : "•";
        paragraph(item.runs, {
          indent: 19,
          depth: block.depth,
          after: 5,
          beforeDraw: () => {
            doc.setFont("Cormorant", "normal");
            doc.setFontSize(12.5);
            doc.setTextColor(...COLORS.gold);
            doc.text(marker, left + block.depth * 12, y);
          },
        });
        item.nested.forEach(renderBlock);
      });
      y += 3;
      return;
    }
    if (block.type === "table") {
      renderTable(block);
      return;
    }
    if (block.type === "quote") {
      block.blocks.forEach((child) => {
        if (child.type === "paragraph") paragraph(child.runs.map((run) => ({ ...run, quote: true })), { depth: 1, after: 5 });
        else renderBlock(child);
      });
      y += 3;
      return;
    }
    if (block.type === "code") {
      paragraph([{ text: block.text, mono: true }], { size: 10, after: 10, indent: 8 });
      return;
    }
    if (block.type === "rule") {
      ensureSpace(block === blocks.at(-1) ? 20 + CLOSING_HEIGHT : 20);
      doc.setDrawColor(...COLORS.gold);
      doc.setLineWidth(0.7);
      doc.line(left, y, right, y);
      ink(y);
      lastKind = "rule";
      y += 14;
    }
  }

  // Fecho do laudo no padrão PANT: assinatura manuscrita (só na versão
  // definitiva, após o aceite médico), nome, credenciais, fio e lema.
  function drawClosing() {
    const signatureH = SIGNATURE_BOX_H;
    if (y + CLOSING_HEIGHT > bottom) {
      newContentPage();
      closingAlone = true;
    }
    y += 26;
    const center = pageWidth / 2;
    const sign = releaseStatus === "definitive" && assets.signature ? assets.signature : null;
    if (sign) {
      const props = doc.getImageProperties(sign);
      const ratio = props.width > 0 && props.height > 0 ? props.width / props.height : 6;
      const w = Math.min(SIGNATURE_MAX_W, signatureH * ratio);
      const h = w / ratio;
      doc.addImage(sign, "PNG", center - w / 2, y + (signatureH - h), w, h, "assinatura", "SLOW");
    } else {
      // Rascunho (ou definitiva sem assinatura cadastrada): linha para assinar à caneta.
      doc.setDrawColor(138, 122, 85);
      doc.setLineWidth(0.5);
      doc.line(center - 110, y + signatureH - 2, center + 110, y + signatureH - 2);
    }
    y += signatureH + 16;
    doc.setFont("Cormorant", "normal");
    doc.setFontSize(13.5);
    doc.setTextColor(...COLORS.navy);
    doc.text(DOCTOR_NAME, center, y, { align: "center" });
    y += 14;
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.numeral);
    spacedText(doc, DOCTOR_CREDENTIALS, center, y, 1.3);
    y += 16;
    doc.setDrawColor(...COLORS.rule);
    doc.setLineWidth(0.6);
    doc.line(left, y, right, y);
    y += 22;
    doc.setFont("Cormorant", "italic");
    doc.setFontSize(12.5);
    doc.setTextColor(...COLORS.numeral);
    doc.text("Soli Deo Gloria", center, y, { align: "center" });
    ink(y);
    y += 10;
  }

  const blocks = contentFromMarkdown(md);
  const numbering = headingNumbering(blocks);
  for (const block of blocks) renderBlock(block);
  drawClosing();

  const pageCount = doc.getNumberOfPages();
  for (let page = 2; page <= pageCount; page++) {
    doc.setPage(page);
    doc.setFont("Cormorant", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.muted);
    doc.text(meta.patient, left, pageHeight - 41, { maxWidth: 180 });
    doc.setTextColor(139, 106, 30);
    doc.text(`fl. ${page - 1} de ${pageCount - 1}`, right, pageHeight - 41, { align: "right" });
  }
  doc.setPage(pageCount);
  doc.pantLayout = {
    fill,
    usable: bottom - CONTENT_TOP,
    closingAlone,
    tail: { kind: lastKind === "table" ? "table" : "paragraph", count: lastKind === "table" ? tableRowCalls : paragraphCalls },
  };
  return doc;
}

export function createPdfBlob(jsPDF, md, meta, assets) {
  const pdf = createPantPdf(jsPDF, md, meta, assets);
  return pdf.output("blob");
}
