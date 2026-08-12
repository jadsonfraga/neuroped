import type { PDFFont } from "pdf-lib";

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
        if (line) out.push(line);
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
