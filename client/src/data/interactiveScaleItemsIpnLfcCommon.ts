import type { InteractiveBand } from "./interactiveScaleItems";

export const IPN_LFC_CHOICE_LABELS = [
  "0 · Não observado / ausente",
  "1 · Ocasional / leve",
  "2 · Frequente / moderado",
  "3 · Consistente / intenso",
  "N/O · Sem oportunidade ou informação",
];

export const IPN_LFC_TEXT_LABELS = [
  "Registro qualitativo",
  "Sem registro aplicável",
];

export const IPN_LFC_PROFILE_BANDS: InteractiveBand[] = [
  {
    minPct: 0,
    classification: "Perfil descritivo — interpretar por item e domínio",
    color: "emerald",
    description:
      "A soma é apenas organizacional. Não há ponto de corte, percentil, probabilidade diagnóstica ou classificação de gravidade validada. Compare domínios, contextos, exemplos funcionais, discrepâncias entre informantes e resposta aos apoios.",
  },
];

export const IPN_LFC_TEXT_BANDS: InteractiveBand[] = [
  {
    minPct: 0,
    classification: "Roteiro qualitativo — integração clínica necessária",
    color: "emerald",
    description:
      "Este módulo não produz escore. Integre história, exame, audição, desenvolvimento, linguagem, fala, participação e avaliações específicas.",
  },
];
