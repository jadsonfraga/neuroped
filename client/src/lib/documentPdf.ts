// ============================================================
// Construtor de PDF clínico premium — pdf-lib.
// Gera A4 multipágina com identidade NeuroPed SDG, logo mestre, seções,
// validação por QR e estrutura pronta para assinatura digital PFX/P12.
// ============================================================
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFImage,
  type PDFPage,
} from "pdf-lib";
import QRCode from "qrcode";
import { buildAppHashUrl } from "@/lib/appUrl";
import drJadsonLogoFile from "@assets/dr-jadson-logo.jpeg";

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
  validationUrl?: string;
}

const A4 = { w: 595.28, h: 841.89 };
const M = 46;
const LINE = 14;

// Paleta editorial do NeuroPed Master 2026: navy, bordô, dourado, teal,
// branco quente e cinza técnico. Centralizar as cores também evita espalhar
// valores visuais crus pelos templates clínicos.
const C = {
  navy: rgb(0.043, 0.122, 0.227),
  bordo: rgb(0.478, 0.118, 0.173),
  gold: rgb(0.788, 0.635, 0.29),
  teal: rgb(0.059, 0.463, 0.431),
  warm: rgb(0.973, 0.961, 0.937),
  white: rgb(1, 1, 1),
  ink: rgb(0.2, 0.255, 0.333),
  muted: rgb(0.39, 0.43, 0.49),
  soft: rgb(0.94, 0.945, 0.95),
};

// pdf-lib desenha com Helvetica/WinAnsi (Windows-1252) e lança em qualquer
// caractere fora do Latin-1 — inclusive ao só medir a largura. Texto clínico
// colado costuma trazer ≥, ≤, setas, letras gregas e emoji; normalizamos aqui.
export function pdfSafe(input: string): string {
  return (input ?? "")
    .replace(/[–—]/g, "-")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, "...")
    .replace(/[≥]/g, ">=")
    .replace(/[≤]/g, "<=")
    .replace(/[→⇒]/g, "->")
    .replace(/[←]/g, "<-")
    .replace(/[×]/g, "x")
    .replace(/[^\t\n\r\x20-\x7E\xA0-\xFF]/g, "");
}

function splitOverlongToken(
  token: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
): string[] {
  if (!token || font.widthOfTextAtSize(token, size) <= maxWidth) return [token];

  const chunks: string[] = [];
  let chunk = "";
  for (const char of Array.from(token)) {
    const candidate = chunk + char;
    if (chunk && font.widthOfTextAtSize(candidate, size) > maxWidth) {
      chunks.push(chunk);
      chunk = char;
    } else {
      chunk = candidate;
    }
  }
  if (chunk) chunks.push(chunk);
  return chunks;
}

/**
 * Quebra texto sem perder conteúdo e garante que também tokens sem espaços
 * (URLs, hashes, IDs de exames/arquivos) permaneçam dentro da largura do PDF.
 */
export function wrapPdfText(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
): string[] {
  if (maxWidth <= 0) return [text ?? ""];

  const out: string[] = [];
  for (const rawLine of (text ?? "").split("\n")) {
    if (rawLine.trim() === "") {
      out.push("");
      continue;
    }

    let line = "";
    for (const word of rawLine.split(/\s+/)) {
      const pieces = splitOverlongToken(word, font, size, maxWidth);
      const wasSplit = pieces.length > 1;

      if (wasSplit) {
        if (line) {
          out.push(line);
          line = "";
        }
        for (let index = 0; index < pieces.length - 1; index += 1) {
          out.push(pieces[index]);
        }
        line = pieces.at(-1) ?? "";
        continue;
      }

      const piece = pieces[0] ?? "";
      const test = line ? `${line} ${piece}` : piece;
      if (font.widthOfTextAtSize(test, size) > maxWidth && line) {
        out.push(line);
        line = piece;
      } else {
        line = test;
      }
    }
    if (line) out.push(line);
  }
  return out;
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  return wrapPdfText(text, font, size, maxWidth);
}

function defaultValidationUrl(): string {
  return buildAppHashUrl("/verificar");
}

async function embedValidationQr(pdf: PDFDocument, url: string) {
  const dataUrl = await QRCode.toDataURL(url, {
    width: 280,
    margin: 1,
    errorCorrectionLevel: "M",
  });
  const base64 = dataUrl.split(",")[1] ?? "";
  return pdf.embedPng(base64);
}

async function embedBrandLogo(pdf: PDFDocument): Promise<PDFImage | null> {
  try {
    const response = await fetch(drJadsonLogoFile);
    if (!response.ok) return null;
    return await pdf.embedJpg(await response.arrayBuffer());
  } catch {
    // O documento continua gerável se o asset estiver temporariamente
    // indisponível; o fallback visual abaixo mantém a identificação textual.
    return null;
  }
}

function drawLogo(page: PDFPage, logo: PDFImage | null, x: number, y: number, box = 54) {
  if (!logo) {
    page.drawRectangle({ x, y, width: box, height: box, color: C.bordo, borderColor: C.gold, borderWidth: 1.2 });
    page.drawText("NF", { x: x + 14, y: y + 19, size: 15, font: undefined, color: C.white });
    return;
  }
  const scale = Math.min(box / logo.width, box / logo.height);
  const width = logo.width * scale;
  const height = logo.height * scale;
  page.drawImage(logo, {
    x: x + (box - width) / 2,
    y: y + (box - height) / 2,
    width,
    height,
  });
}

export async function buildDocumentPdf(rawSpec: DocSpec): Promise<Uint8Array> {
  const spec: DocSpec = {
    ...rawSpec,
    title: pdfSafe(rawSpec.title),
    subtitle: rawSpec.subtitle ? pdfSafe(rawSpec.subtitle) : undefined,
    credentials: rawSpec.credentials.map(pdfSafe),
    sections: rawSpec.sections.map((section) => ({
      heading: pdfSafe(section.heading),
      body: pdfSafe(section.body),
    })),
    footer: rawSpec.footer ? pdfSafe(rawSpec.footer) : undefined,
  };

  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const serif = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const maxW = A4.w - M * 2;
  const validationUrl = spec.validationUrl ?? defaultValidationUrl();
  const qrImage = await embedValidationQr(pdf, validationUrl);
  const logo = await embedBrandLogo(pdf);

  const titleX = M + 70;
  const titleW = A4.w - M - titleX;

  const drawMasthead = (page: PDFPage, continuation: boolean): number => {
    page.drawRectangle({ x: 0, y: 0, width: A4.w, height: A4.h, color: C.warm });
    const bandH = continuation ? 72 : 112;
    const bandY = A4.h - bandH;
    page.drawRectangle({ x: 0, y: bandY, width: A4.w, height: bandH, color: C.navy });
    page.drawRectangle({ x: 0, y: bandY, width: 7, height: bandH, color: C.bordo });
    page.drawRectangle({ x: 0, y: bandY - 3, width: A4.w, height: 3, color: C.gold });

    const logoBox = continuation ? 38 : 56;
    const logoY = continuation ? A4.h - 55 : A4.h - 84;
    drawLogo(page, logo, M, logoY, logoBox);

    const x = continuation ? M + 50 : titleX;
    const w = continuation ? A4.w - M - x : titleW;
    const titleSize = continuation ? 10.5 : 18;
    const titleLines = wrap(spec.title, continuation ? bold : serif, titleSize, w).slice(0, continuation ? 2 : 3);
    let ty = continuation ? A4.h - 34 : A4.h - 43;
    for (const line of titleLines) {
      page.drawText(line, { x, y: ty, size: titleSize, font: continuation ? bold : serif, color: C.white });
      ty -= continuation ? 13 : 21;
    }

    if (!continuation && spec.subtitle) {
      const subtitleLines = wrap(spec.subtitle, font, 9.5, titleW).slice(0, 2);
      let sy = Math.min(ty - 2, A4.h - 83);
      for (const line of subtitleLines) {
        page.drawText(line, { x: titleX, y: sy, size: 9.5, font, color: C.gold });
        sy -= 12;
      }
    }

    if (!continuation) {
      const metaY = bandY - 24;
      page.drawText("NEUROPED SDG  |  DOCUMENTO CLINICO", {
        x: M,
        y: metaY,
        size: 7.2,
        font: bold,
        color: C.bordo,
      });
      let cy = metaY - 15;
      for (const credential of spec.credentials.slice(0, 4)) {
        for (const line of wrap(credential, font, 8.3, maxW)) {
          page.drawText(line, { x: M, y: cy, size: 8.3, font, color: C.muted });
          cy -= 11;
        }
      }
      return cy - 10;
    }

    return bandY - 22;
  };

  let page: PDFPage = pdf.addPage([A4.w, A4.h]);
  let y = drawMasthead(page, false);

  const footerLineCount = spec.footer ? wrap(spec.footer, font, 7.3, maxW).length : 0;
  const bottomContentFloor = 166 + footerLineCount * 9;

  const newPage = () => {
    page = pdf.addPage([A4.w, A4.h]);
    y = drawMasthead(page, true);
  };

  const ensure = (need: number) => {
    if (y - need < bottomContentFloor) newPage();
  };

  const drawBodyText = (value: string, size = 10, x = M + 12, color = C.ink) => {
    page.drawText(value, { x, y, size, font, color });
  };

  for (const section of spec.sections) {
    if (!section.body || !section.body.trim()) continue;
    ensure(LINE * 4);

    page.drawRectangle({
      x: M,
      y: y - 5,
      width: 4,
      height: 20,
      color: C.gold,
    });
    page.drawText(section.heading.toUpperCase(), {
      x: M + 12,
      y,
      size: 10.2,
      font: bold,
      color: C.bordo,
    });
    y -= 17;
    page.drawLine({
      start: { x: M + 12, y: y + 4 },
      end: { x: A4.w - M, y: y + 4 },
      thickness: 0.55,
      color: C.gold,
      opacity: 0.7,
    });
    y -= 7;

    const bodyLines = wrap(section.body, font, 10, maxW - 24);
    for (const line of bodyLines) {
      ensure(LINE);
      if (!line) {
        y -= LINE * 0.7;
        continue;
      }
      drawBodyText(line);
      y -= LINE;
    }
    y -= 12;
  }

  // Rodapé textual e card de validação ficam apenas na última página, sem
  // invadir o corpo graças ao bottomContentFloor calculado acima.
  if (spec.footer) {
    const lines = wrap(spec.footer, font, 7.3, maxW);
    let fy = 156 + lines.length * 9;
    for (const line of lines) {
      page.drawText(line, { x: M, y: fy, size: 7.3, font, color: C.muted });
      fy -= 9;
    }
  }

  const validationY = 48;
  const validationH = 92;
  page.drawRectangle({
    x: M,
    y: validationY,
    width: maxW,
    height: validationH,
    borderWidth: 0.9,
    borderColor: C.gold,
    color: C.white,
  });
  page.drawRectangle({
    x: M,
    y: validationY,
    width: 6,
    height: validationH,
    color: C.teal,
  });
  page.drawText("VALIDACAO E ASSINATURA DIGITAL", {
    x: M + 16,
    y: validationY + 68,
    size: 8.8,
    font: bold,
    color: C.navy,
  });
  page.drawText("O PDF pode ser assinado localmente com certificado A1 PFX/P12.", {
    x: M + 16,
    y: validationY + 51,
    size: 7.5,
    font,
    color: C.ink,
  });
  page.drawText("Depois de assinado, confira o certificado e a integridade em leitor compativel.", {
    x: M + 16,
    y: validationY + 39,
    size: 7.2,
    font,
    color: C.ink,
  });
  const safeValidationUrl = pdfSafe(validationUrl);
  const urlLines = wrap(safeValidationUrl, font, 6.2, maxW - 105).slice(0, 2);
  let uy = validationY + 22;
  for (const line of urlLines) {
    page.drawText(line, { x: M + 16, y: uy, size: 6.2, font, color: C.teal });
    uy -= 8;
  }
  const qrSize = 62;
  page.drawImage(qrImage, {
    x: A4.w - M - qrSize - 10,
    y: validationY + 14,
    width: qrSize,
    height: qrSize,
  });

  // Assinatura editorial discreta em todas as páginas. A numeração é desenhada
  // depois que todas as quebras foram definidas.
  const pages = pdf.getPages();
  pages.forEach((currentPage, index) => {
    currentPage.drawLine({
      start: { x: M, y: 31 },
      end: { x: A4.w - M, y: 31 },
      thickness: 0.5,
      color: C.gold,
      opacity: 0.65,
    });
    currentPage.drawText("NeuroPed SDG  |  Soli Deo Gloria", {
      x: M,
      y: 18,
      size: 6.4,
      font: bold,
      color: C.navy,
    });
    const pageLabel = `${index + 1}/${pages.length}`;
    currentPage.drawText(pageLabel, {
      x: A4.w - M - font.widthOfTextAtSize(pageLabel, 6.4),
      y: 18,
      size: 6.4,
      font,
      color: C.muted,
    });
  });

  return await pdf.save({ useObjectStreams: false });
}
