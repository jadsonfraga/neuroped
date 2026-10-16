/**
 * Marca própria da clínica (item 6): logo, cores, cabeçalho e rodapé dos
 * documentos gerados. Regras puras, compartilhadas entre servidor, cliente e testes.
 *
 * A marca só altera a MOLDURA do documento (faixa, cores, logo, linhas de
 * cabeçalho/rodapé). Nunca toca nas seções de conteúdo — portanto não pode
 * introduzir corte, nível ou classificação nos testes próprios do NeuroPad.
 */

export interface ClinicBranding {
  primaryColor: string | null;
  accentColor: string | null;
  headerText: string;
  footerText: string;
  /** data URI PNG/JPEG (≤ 150 KB); null = sem logo (nunca se herda logo de outro lugar). */
  logoDataUri: string | null;
  configured: boolean;
  updatedAt: string | null;
}

export const EMPTY_BRANDING: ClinicBranding = Object.freeze({
  primaryColor: null,
  accentColor: null,
  headerText: "",
  footerText: "",
  logoDataUri: null,
  configured: false,
  updatedAt: null,
}) as ClinicBranding;

export const BRANDING_LIMITS = Object.freeze({
  maxLogoBytes: 150 * 1024,
  maxHeaderText: 160,
  maxFooterText: 400,
  /** Cor primária é fundo da faixa com texto branco: contraste mínimo AA para texto grande. */
  minPrimaryContrastWithWhite: 4.5,
  /** Cor de destaque desenha filetes e subtítulo sobre a faixa primária. */
  minAccentContrastWithPrimary: 3,
});

const HEX = /^#[0-9a-fA-F]{6}$/;

export function normalizeHexColor(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim();
  return HEX.test(v) ? v.toLowerCase() : null;
}

export function hexToRgb(hex: string): [number, number, number] {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
}

export function hexToUnit(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex);
  return [r / 255, g / 255, b / 255];
}

function channel(v: number): number {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}
export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}
export function contrastRatio(a: string, b: string): number {
  const [la, lb] = [relativeLuminance(a), relativeLuminance(b)];
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

const DATA_URI = /^data:(image\/png|image\/jpeg);base64,([A-Za-z0-9+/]+={0,2})$/;

export interface DecodedLogo { mime: "image/png" | "image/jpeg"; bytes: Uint8Array }

function b64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
  return out;
}

/** Valida tipo declarado × assinatura real dos bytes (PNG/JPEG apenas; SVG é recusado de propósito). */
export function decodeLogoDataUri(value: unknown): DecodedLogo | null {
  if (typeof value !== "string" || value.length > BRANDING_LIMITS.maxLogoBytes * 1.4) return null;
  const m = DATA_URI.exec(value);
  if (!m) return null;
  let bytes: Uint8Array;
  try { bytes = b64ToBytes(m[2]); } catch { return null; }
  if (bytes.length === 0 || bytes.length > BRANDING_LIMITS.maxLogoBytes) return null;
  const isPng = bytes.length > 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  const isJpg = bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (m[1] === "image/png" && isPng) return { mime: "image/png", bytes };
  if (m[1] === "image/jpeg" && isJpg) return { mime: "image/jpeg", bytes };
  return null;
}

export type BrandingValidation = { ok: true; value: Omit<ClinicBranding, "configured" | "updatedAt"> } | { ok: false; message: string };

function cleanText(value: unknown, max: number): string {
  // eslint-disable-next-line no-control-regex -- rejeita caracteres de controle de propósito
  return typeof value === "string" ? value.replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, "").trim().slice(0, max) : "";
}

/** `logoDataUri === undefined` mantém o logo atual (tratado pelo chamador); `null`/"" remove. */
export function validateBrandingInput(raw: unknown): BrandingValidation {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { ok: false, message: "Marca inválida." };
  const input = raw as Record<string, unknown>;
  const L = BRANDING_LIMITS;

  const primaryRaw = input.primaryColor;
  const accentRaw = input.accentColor;
  const primary = primaryRaw === null || primaryRaw === "" || primaryRaw === undefined ? null : normalizeHexColor(primaryRaw);
  const accent = accentRaw === null || accentRaw === "" || accentRaw === undefined ? null : normalizeHexColor(accentRaw);
  if (primaryRaw && !primary) return { ok: false, message: "Cor primária inválida. Use o formato #RRGGBB." };
  if (accentRaw && !accent) return { ok: false, message: "Cor de destaque inválida. Use o formato #RRGGBB." };
  if (primary && contrastRatio(primary, "#ffffff") < L.minPrimaryContrastWithWhite) {
    return { ok: false, message: "A cor primária é clara demais: o texto branco do cabeçalho ficaria ilegível (contraste mínimo 4,5:1)." };
  }
  if (accent && primary && contrastRatio(accent, primary) < L.minAccentContrastWithPrimary) {
    return { ok: false, message: "A cor de destaque tem pouco contraste com a cor primária (mínimo 3:1)." };
  }

  const headerText = cleanText(input.headerText, L.maxHeaderText);
  const footerText = cleanText(input.footerText, L.maxFooterText);

  let logoDataUri: string | null = null;
  if (input.logoDataUri) {
    if (!decodeLogoDataUri(input.logoDataUri)) {
      return { ok: false, message: "Logo inválido: use PNG ou JPEG de até 150 KB (SVG não é aceito)." };
    }
    logoDataUri = input.logoDataUri as string;
  }
  return { ok: true, value: { primaryColor: primary, accentColor: accent, headerText, footerText, logoDataUri } };
}

/** Paleta efetiva para o PDF: cores da clínica ou, na falta, o padrão do NeuroPed. */
export interface PdfBrandPalette {
  band: [number, number, number];
  accent: [number, number, number];
  isCustom: boolean;
}
export const DEFAULT_PDF_BAND_HEX = "#0b1f3a";
export const DEFAULT_PDF_ACCENT_HEX = "#c9a24a";

export function pdfPaletteFor(branding: Pick<ClinicBranding, "primaryColor" | "accentColor"> | null | undefined): PdfBrandPalette {
  const band = branding?.primaryColor ?? DEFAULT_PDF_BAND_HEX;
  const accent = branding?.accentColor ?? (branding?.primaryColor ? "#ffffff" : DEFAULT_PDF_ACCENT_HEX);
  return { band: hexToUnit(band), accent: hexToUnit(accent), isCustom: Boolean(branding?.primaryColor || branding?.accentColor) };
}
