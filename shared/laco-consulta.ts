/**
 * Onda 1 — medição do laço da consulta. Sem I/O, sem relógio, sem banco.
 *
 * Não calcula escore, não aplica ponto de corte, não classifica e não diagnostica.
 * Casa e escola permanecem separados. Ausência não vira zero nem concordância.
 * Minutos até o laudo só existem quando os dois instantes foram informados
 * e a assinatura não antecede o início. O agregado não carrega escore nem identificador.
 */

export const LACO_AVISO =
  "Medição do que foi informado. Não é diagnóstico, não é ponto de corte e não estima tempo.";

export type MotivoParAusente =
  | "casa-ausente"
  | "escola-ausente"
  | "ambos-ausentes"
  | "escore-invalido";

export type ParCasaEscola =
  | { status: "nao-medido"; motivo: MotivoParAusente }
  | { status: "medido"; casa: number; escola: number; deltaEscolaMenosCasa: number };

export type MotivoTempoAusente =
  | "inicio-ausente"
  | "assinatura-ausente"
  | "ambos-ausentes"
  | "instante-invalido"
  | "assinatura-antes-do-inicio";

export type TempoAteLaudo =
  | { status: "nao-medido"; motivo: MotivoTempoAusente }
  | { status: "medido"; minutos: number };

export interface CasoLaco {
  casa: number | null;
  escola: number | null;
  inicioIso: string | null;
  assinaturaIso: string | null;
}

export interface ResumoLaco {
  aviso: typeof LACO_AVISO;
  casos: number;
  paresMedidos: number;
  paresNaoMedidos: number;
  temposMedidos: number;
  temposNaoMedidos: number;
  /** null se nenhum tempo foi medido. Pares sem tempo não entram na mediana. */
  medianaMinutos: number | null;
}

function escoreInformado(v: number | null | undefined): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

export function parCasaEscola(
  casa: number | null | undefined,
  escola: number | null | undefined,
): ParCasaEscola {
  const casaInvalida = casa != null && !escoreInformado(casa);
  const escolaInvalida = escola != null && !escoreInformado(escola);
  if (casaInvalida || escolaInvalida) return { status: "nao-medido", motivo: "escore-invalido" };
  const casaOk = escoreInformado(casa);
  const escolaOk = escoreInformado(escola);
  if (!casaOk && !escolaOk) return { status: "nao-medido", motivo: "ambos-ausentes" };
  if (!casaOk) return { status: "nao-medido", motivo: "casa-ausente" };
  if (!escolaOk) return { status: "nao-medido", motivo: "escola-ausente" };
  return { status: "medido", casa, escola, deltaEscolaMenosCasa: escola - casa };
}

function instante(iso: string | null | undefined): number | null | "invalido" {
  if (iso == null || iso === "") return null;
  if (typeof iso !== "string") return "invalido";
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : "invalido";
}

export function tempoAteLaudo(
  inicioIso: string | null | undefined,
  assinaturaIso: string | null | undefined,
): TempoAteLaudo {
  const inicio = instante(inicioIso);
  const assinatura = instante(assinaturaIso);
  if (inicio === "invalido" || assinatura === "invalido") {
    return { status: "nao-medido", motivo: "instante-invalido" };
  }
  if (inicio === null && assinatura === null) return { status: "nao-medido", motivo: "ambos-ausentes" };
  if (inicio === null) return { status: "nao-medido", motivo: "inicio-ausente" };
  if (assinatura === null) return { status: "nao-medido", motivo: "assinatura-ausente" };
  if (assinatura < inicio) return { status: "nao-medido", motivo: "assinatura-antes-do-inicio" };
  return { status: "medido", minutos: Math.floor((assinatura - inicio) / 60_000) };
}

function mediana(valores: readonly number[]): number | null {
  if (valores.length === 0) return null;
  const ordenados = [...valores].sort((a, b) => a - b);
  const meio = Math.floor(ordenados.length / 2);
  if (ordenados.length % 2 === 1) return ordenados[meio];
  return (ordenados[meio - 1] + ordenados[meio]) / 2;
}

export function resumirLaco(casos: readonly CasoLaco[]): ResumoLaco {
  let paresMedidos = 0;
  let paresNaoMedidos = 0;
  let temposMedidos = 0;
  let temposNaoMedidos = 0;
  const minutos: number[] = [];
  for (const caso of casos) {
    if (parCasaEscola(caso.casa, caso.escola).status === "medido") paresMedidos += 1;
    else paresNaoMedidos += 1;
    const tempo = tempoAteLaudo(caso.inicioIso, caso.assinaturaIso);
    if (tempo.status === "medido") {
      temposMedidos += 1;
      minutos.push(tempo.minutos);
    } else {
      temposNaoMedidos += 1;
    }
  }
  return {
    aviso: LACO_AVISO,
    casos: casos.length,
    paresMedidos,
    paresNaoMedidos,
    temposMedidos,
    temposNaoMedidos,
    medianaMinutos: mediana(minutos),
  };
}

const TEXTO_PAR: Record<MotivoParAusente, string> = {
  "ambos-ausentes": "Casa não informada. Escola não informada. Diferença não medida. Ausência não é zero.",
  "casa-ausente": "Escola informada. Casa não informada. Diferença não medida. Ausência não é zero.",
  "escola-ausente": "Casa informada. Escola não informada. Diferença não medida. Ausência não é zero.",
  "escore-invalido": "Escore de casa ou escola inválido. Diferença não medida.",
};

export function textoParCasaEscola(casa: number | null | undefined, escola: number | null | undefined): string {
  const par = parCasaEscola(casa, escola);
  if (par.status === "nao-medido") return TEXTO_PAR[par.motivo];
  return `Casa ${par.casa}. Escola ${par.escola}. Diferença (escola − casa): ${par.deltaEscolaMenosCasa}. Os dois contextos permanecem separados. Isto não é classificação.`;
}
