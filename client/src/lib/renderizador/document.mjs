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
};

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
    : "RASCUNHO — NÃO LIBERADO";
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
  else if (run.quote) doc.setTextColor(105, 86, 49);
  else doc.setTextColor(...COLORS.ink);
}

function drawRuns(doc, runs, x, y, maxWidth, opts = {}) {
  const size = opts.size || 12.5;
  const leading = opts.leading || size * 1.45;
  const indent = opts.indent || 0;
  const actualX = x + indent;
  let lineX = actualX;
  let lineY = y;
  let lines = 1;
  const nextLine = () => {
    lineX = actualX;
    lineY += leading;
    lines++;
    if (opts.bottom && lineY > opts.bottom) {
      if (!opts.onPageBreak) throw Error("Texto ultrapassou o limite da página.");
      lineY = opts.onPageBreak();
    }
  };
  for (const run of runs) {
    const text = String(run.text || "");
    const pieces = text.split(/(\s+|\n)/).filter((part) => part.length);
    for (const piece of pieces) {
      if (piece === "\n") {
        nextLine();
        continue;
      }
      withFont(doc, run, size);
      const width = doc.getTextWidth(piece);
      if (/^\s+$/.test(piece)) {
        if (lineX + width <= x + maxWidth) lineX += width;
        continue;
      }
      if (lineX > actualX && lineX + width > x + maxWidth) {
        nextLine();
      }
      doc.text(piece, lineX, lineY);
      if (run.strike) {
        doc.setDrawColor(...COLORS.ink);
        doc.setLineWidth(0.45);
        doc.line(lineX, lineY - size * 0.3, lineX + width, lineY - size * 0.3);
      }
      lineX += width;
    }
  }
  doc.setTextColor(...COLORS.ink);
  return { y: lineY + leading, lines };
}

export function createPantPdf(jsPDF, md, meta, assets) {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4", compress: true });
  doc.setProperties({
    title: meta.title,
    author: "Dr. Jadson Fraga Araújo Júnior",
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

  function drawFrame(cover) {
    doc.setFillColor(...(cover ? COLORS.navy : COLORS.ivory));
    doc.rect(0, 0, pageWidth, pageHeight, "F");
    doc.setDrawColor(...COLORS.gold);
    doc.setLineWidth(0.6);
    doc.rect(26, 26, pageWidth - 52, pageHeight - 52);
    doc.setLineWidth(0.3);
    doc.rect(30, 30, pageWidth - 60, pageHeight - 60);
    if (!cover) {
      doc.addImage(assets.logo, "PNG", left, 41, 25, 25);
      doc.setFont("Cormorant", "normal");
      doc.setFontSize(11);
      doc.setTextColor(...COLORS.navy);
      doc.text("S U P E R N E U R O P E D", left + 37, 55);
      doc.setFontSize(8);
      doc.setTextColor(119, 119, 119);
      doc.text("Dr. Jadson Fraga Araújo Júnior", right, 49, { align: "right" });
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
  doc.addImage(assets.logo, "PNG", (pageWidth - 245) / 2, 69, 245, 112);
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
  doc.text("Dr. Jadson Fraga Araújo Júnior", pageWidth / 2, 715, { align: "center" });
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.gold);
  doc.text("NEUROPEDIATRA · CRM-PE 25.227 · RQE 17.756", pageWidth / 2, 733, { align: "center" });
  doc.setFontSize(8);
  doc.setTextColor(180, 184, 192);
  doc.text("Rua Raimundo Lacerda, 001 · São José · Petrolina/PE · CEP 56302-470", pageWidth / 2, 752, { align: "center" });

  doc.addPage();
  drawFrame(false);
  let y = 111;
  function newContentPage() {
    doc.addPage();
    drawFrame(false);
    y = 111;
  }
  function ensureSpace(height) {
    if (y + height > bottom) newContentPage();
  }
  function paragraph(runs, opts = {}) {
    ensureSpace(30);
    const out = drawRuns(doc, runs, left + (opts.depth || 0) * 12, y, maxWidth - (opts.depth || 0) * 12, {
      ...opts,
      bottom,
      onPageBreak: () => {
        newContentPage();
        return y;
      },
    });
    y = out.y + (opts.after ?? 7);
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
        doc.text(lines.slice(offset, offset + count), left + i * colWidth + 7, y + topPadding, {
          maxWidth: colWidth - 13,
        });
      });
      y += height;
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
      let offset = 0;
      while (offset < total) {
        const availableLines = Math.floor((bottom - y - 12) / lineHeight);
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
    y += 11;
  }
  function renderBlock(block) {
    if (block.type === "heading") {
      const fontSize = block.depth === 1 ? 22 : block.depth === 2 ? 19 : block.depth === 3 ? 16 : 14;
      doc.setFont("Cormorant", "bold");
      doc.setFontSize(fontSize);
      const headingText = flattenText(block.runs);
      const lines = doc.splitTextToSize(headingText, maxWidth - 38);
      ensureSpace(Math.max(50, lines.length * (fontSize + 3) + 18));
      y += 7;
      doc.setFont("Cormorant", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...COLORS.gold);
      doc.text(String(block.number).padStart(2, "0"), left, y);
      doc.setFont("Cormorant", "bold");
      doc.setFontSize(fontSize);
      doc.setTextColor(...COLORS.navy);
      doc.text(lines, left + 35, y + 1);
      y += Math.max(fontSize + 4, lines.length * (fontSize + 3)) + 11;
      return;
    }
    if (block.type === "paragraph") {
      paragraph(block.runs, { depth: block.depth });
      return;
    }
    if (block.type === "list") {
      block.items.forEach((item, i) => {
        ensureSpace(34);
        doc.setFont("Cormorant", "normal");
        doc.setFontSize(12.5);
        doc.setTextColor(...COLORS.gold);
        doc.text(block.ordered ? `${block.start + i}.` : "•", left + block.depth * 12, y);
        paragraph(item.runs, { indent: 19, depth: block.depth, after: 4 });
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
      ensureSpace(20);
      doc.setDrawColor(...COLORS.gold);
      doc.setLineWidth(0.7);
      doc.line(left, y, right, y);
      y += 14;
    }
  }

  for (const block of contentFromMarkdown(md)) renderBlock(block);

  const pageCount = doc.getNumberOfPages();
  for (let page = 2; page <= pageCount; page++) {
    doc.setPage(page);
    doc.setFont("Cormorant", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.muted);
    doc.text(meta.patient, left, pageHeight - 41, { maxWidth: 180 });
    doc.text("Soli Deo Gloria", pageWidth / 2, pageHeight - 41, { align: "center" });
    doc.setTextColor(139, 106, 30);
    doc.text(`fl. ${page - 1} de ${pageCount - 1}`, right, pageHeight - 41, { align: "right" });
  }
  doc.setPage(pageCount);
  return doc;
}

export function createPdfBlob(jsPDF, md, meta, assets) {
  const pdf = createPantPdf(jsPDF, md, meta, assets);
  return pdf.output("blob");
}
