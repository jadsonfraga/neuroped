// ============================================================
// Construtor de PDF (texto real) para documentos clínicos — pdf-lib.
// Gera um PDF A4 multipágina com cabeçalho institucional, seções e rodapé,
// pronto para ser assinado (ICP-Brasil) por icpSign.signPdfWithP12.
// ============================================================
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

export interface DocSection {
  heading: string;
  body: string;
}

export interface DocSpec {
  title: string;
  subtitle?: string;
  /** Linhas do cabeçalho do profissional (nome, CRM/RQE, especialidade...). */
  credentials: string[];
  sections: DocSection[];
  /** Texto do rodapé (aviso legal, validade etc.). */
  footer?: string;
}

const A4 = { w: 595.28, h: 841.89 };
const M = 50; // margem
const LINE = 14;

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const out: string[] = [];
  for (const rawLine of (text ?? "").split("\n")) {
    if (rawLine.trim() === "") { out.push(""); continue; }
    let line = "";
    for (const word of rawLine.split(/\s+/)) {
      const test = line ? line + " " + word : word;
      if (font.widthOfTextAtSize(test, size) > maxWidth && line) {
        out.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) out.push(line);
  }
  return out;
}

export async function buildDocumentPdf(spec: DocSpec): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const maxW = A4.w - M * 2;

  let page: PDFPage = pdf.addPage([A4.w, A4.h]);
  let y = A4.h - M;

  const ensure = (need: number) => {
    if (y - need < M + 40) {
      page = pdf.addPage([A4.w, A4.h]);
      y = A4.h - M;
    }
  };
  const text = (s: string, f: PDFFont, size: number, color = rgb(0.1, 0.1, 0.12)) => {
    page.drawText(s, { x: M, y, size, font: f, color });
  };

  // Cabeçalho
  text(spec.title, bold, 16);
  y -= 20;
  if (spec.subtitle) { text(spec.subtitle, font, 10, rgb(0.35, 0.35, 0.4)); y -= 14; }
  for (const c of spec.credentials) { text(c, font, 9, rgb(0.3, 0.3, 0.35)); y -= 11; }
  y -= 4;
  page.drawLine({ start: { x: M, y }, end: { x: A4.w - M, y }, thickness: 1, color: rgb(0.8, 0.6, 0.2) });
  y -= 18;

  // Seções
  for (const sec of spec.sections) {
    if (!sec.body || !sec.body.trim()) continue;
    ensure(LINE * 3);
    if (sec.heading && sec.heading.trim()) {
      text(sec.heading.toUpperCase(), bold, 10, rgb(0.15, 0.15, 0.2));
      y -= LINE;
    }
    for (const ln of wrap(sec.body, font, 10, maxW)) {
      ensure(LINE);
      text(ln, font, 10);
      y -= LINE;
    }
    y -= 8;
  }

  // Rodapé na última página
  if (spec.footer) {
    const lines = wrap(spec.footer, font, 7.5, maxW);
    let fy = M + 12 + lines.length * 9;
    for (const ln of lines) {
      page.drawText(ln, { x: M, y: fy, size: 7.5, font, color: rgb(0.45, 0.45, 0.5) });
      fy -= 9;
    }
  }

  return await pdf.save({ useObjectStreams: false });
}
