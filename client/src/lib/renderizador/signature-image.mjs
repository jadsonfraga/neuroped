// Preparação da imagem da assinatura manuscrita do Renderizador. Só apresentação:
// recorta as margens transparentes (para que o 1,5× do fecho valha para o traço, não
// para o vazio) e reduz PNG grande para caber no limite guardado neste aparelho.
// A imagem nunca sai do navegador; nada do laudo passa por aqui.

export const SIGNATURE_STORED_MAX_BYTES = 400000;
export const SIGNATURE_INPUT_MAX_BYTES = 8000000;
export const SIGNATURE_MAX_WIDTH = 1600;
export const SIGNATURE_MIN_WIDTH = 400;
export const SIGNATURE_PADDING = 6;
const INK_ALPHA = 12;
const OPAQUE_ALPHA = 250;

/** Caixa que contém todos os pixels com alfa acima do limiar (o traço), ou null se a imagem é vazia. */
export function inkBounds(rgba, width, height, threshold = INK_ALPHA) {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    const row = y * width * 4;
    for (let x = 0; x < width; x++) {
      if (rgba[row + x * 4 + 3] > threshold) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null;
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

/** Acrescenta uma folga ao redor do traço, sem sair da imagem. */
export function paddedCrop(bounds, width, height, padding = SIGNATURE_PADDING) {
  const x = Math.max(0, bounds.x - padding);
  const y = Math.max(0, bounds.y - padding);
  const right = Math.min(width, bounds.x + bounds.w + padding);
  const bottom = Math.min(height, bounds.y + bounds.h + padding);
  return { x, y, w: right - x, h: bottom - y };
}

/** Reduz mantendo a proporção; nunca amplia. */
export function scaledSize(width, height, maxWidth) {
  if (width <= maxWidth) return { w: width, h: height };
  return { w: maxWidth, h: Math.max(1, Math.round((height * maxWidth) / width)) };
}

/** Verdadeiro se algum pixel é transparente (fundo transparente de verdade). */
export function hasTransparency(rgba) {
  for (let i = 3; i < rgba.length; i += 4) if (rgba[i] < OPAQUE_ALPHA) return true;
  return false;
}

/** Bytes do PNG dentro de uma data URL base64. */
export function dataUrlBytes(dataUrl) {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}

function drawCanvas(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw Error("O navegador não permitiu preparar a imagem da assinatura.");
  return { canvas, context };
}

/**
 * Lê o PNG escolhido, recorta as margens transparentes e reduz até caber no limite guardado.
 * @param {File} file
 * @returns {Promise<{dataUrl:string, opaque:boolean, cropped:boolean, resized:boolean}>}
 */
export async function prepareSignaturePng(file) {
  if (file.type !== "image/png") throw Error("A assinatura deve ser um arquivo PNG, de preferência com fundo transparente.");
  if (file.size > SIGNATURE_INPUT_MAX_BYTES) throw Error("A imagem da assinatura deve ter até 8 MB.");
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw Error("Não foi possível ler a imagem da assinatura. Use um PNG válido.");
  }
  try {
    const probe = drawCanvas(bitmap.width, bitmap.height);
    probe.context.drawImage(bitmap, 0, 0);
    const pixels = probe.context.getImageData(0, 0, bitmap.width, bitmap.height).data;
    const bounds = inkBounds(pixels, bitmap.width, bitmap.height);
    if (!bounds) throw Error("A imagem da assinatura está totalmente transparente.");
    const opaque = !hasTransparency(pixels);
    const crop = paddedCrop(bounds, bitmap.width, bitmap.height);
    const cropped = crop.w < bitmap.width || crop.h < bitmap.height;
    let maxWidth = SIGNATURE_MAX_WIDTH;
    for (;;) {
      const size = scaledSize(crop.w, crop.h, maxWidth);
      const out = drawCanvas(size.w, size.h);
      out.context.drawImage(bitmap, crop.x, crop.y, crop.w, crop.h, 0, 0, size.w, size.h);
      const dataUrl = out.canvas.toDataURL("image/png");
      if (dataUrlBytes(dataUrl) <= SIGNATURE_STORED_MAX_BYTES) {
        return { dataUrl, opaque, cropped, resized: size.w < crop.w };
      }
      if (maxWidth <= SIGNATURE_MIN_WIDTH) throw Error("Não foi possível reduzir a imagem da assinatura ao limite de 400 KB. Use um PNG mais simples.");
      maxWidth = Math.max(SIGNATURE_MIN_WIDTH, Math.floor(maxWidth * 0.75));
    }
  } finally {
    bitmap.close?.();
  }
}
