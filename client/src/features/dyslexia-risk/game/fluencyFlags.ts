/**
 * Sinais descritivos da fluência do jogo (JLN) SEM norma.
 *
 * O jogo mede palavras (ou sílabas) corretas por minuto, mas não tem tabela de referência por faixa e este
 * código NÃO inventa uma. Os sinais abaixo vêm só do próprio registro (precisão, nenhuma leitura, tempo
 * curto). Para comparar com uma referência, preencha FLUENCY_REFERENCES com `wcpmMinimo` E `fonte`
 * (citação verificável): enquanto `fonte` for null a comparação fica desligada. Decisão do Dr. Jadson.
 */
import type { BandBank, BandId } from "./bank";

export interface FluencyReferenceRow { wcpmMinimo: number | null; fonte: string | null; versao: string }

const NONE: FluencyReferenceRow = { wcpmMinimo: null, fonte: null, versao: "2026-10-16.1" };
export const FLUENCY_REFERENCES: Record<BandId, FluencyReferenceRow> = {
  "5-6": NONE, "7-8": NONE, "9-10": NONE, "11-12": NONE, "13-14": NONE, "15-18": NONE,
};

export interface FluencyFlag {
  id: "precisao" | "nenhuma_leitura" | "extrapolada" | "abaixo_referencia" | "dentro_referencia";
  tipo: "info" | "dado" | "atencao";
  texto: string;
}

export interface FluencyLike { totalWords: number; lidas: number; erros: number; segundos: number; wcpm: number | null }

export function fluencyReferenceActive(row: FluencyReferenceRow | undefined): row is FluencyReferenceRow & { wcpmMinimo: number; fonte: string } {
  return !!row && row.wcpmMinimo != null && !!row.fonte;
}

export function fluencyFlags(band: BandBank | null, flu: FluencyLike | null): FluencyFlag[] {
  if (!flu) return [];
  const unidade = band?.fluencia.kind === "silabas" ? "sílabas" : "palavras";
  const flags: FluencyFlag[] = [];
  if (flu.lidas <= 0) {
    flags.push({ id: "nenhuma_leitura", tipo: "atencao", texto: `Nenhuma ${unidade === "sílabas" ? "sílaba" : "palavra"} lida registrada em ${flu.segundos} s: confirmar recusa, bloqueio ou erro de registro antes de interpretar.` });
  } else {
    const certas = Math.max(0, flu.lidas - flu.erros);
    flags.push({ id: "precisao", tipo: "info", texto: `precisão de leitura ${Math.round((certas / flu.lidas) * 100)}% (${flu.erros} erro(s) em ${flu.lidas} lidas)` });
  }
  if (flu.segundos > 0 && flu.segundos < 30) {
    flags.push({ id: "extrapolada", tipo: "dado", texto: "leitura com menos de 30 s: taxa extrapolada, pouco confiável" });
  }
  const ref = band ? FLUENCY_REFERENCES[band.band] : undefined;
  if (fluencyReferenceActive(ref) && flu.wcpm != null && flu.lidas > 0) {
    flags.push(flu.wcpm < ref.wcpmMinimo
      ? { id: "abaixo_referencia", tipo: "atencao", texto: `${flu.wcpm} ${unidade}/min abaixo da referência configurada (${ref.wcpmMinimo}; fonte: ${ref.fonte})` }
      : { id: "dentro_referencia", tipo: "info", texto: `${flu.wcpm} ${unidade}/min na referência configurada (${ref.wcpmMinimo}; fonte: ${ref.fonte})` });
  }
  return flags;
}
