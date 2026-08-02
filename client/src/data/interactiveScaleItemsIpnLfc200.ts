import type { InteractiveScaleDef } from "./interactiveScaleItems";
import {
  IPN_LFC_CHOICE_LABELS,
  IPN_LFC_TEXT_LABELS,
  IPN_LFC_PROFILE_BANDS,
  IPN_LFC_TEXT_BANDS,
} from "./interactiveScaleItemsIpnLfcCommon";
import { ipnLfcFamilyDomains } from "./interactiveScaleItemsIpnLfcFamily";
import { ipnLfcSchoolDomains } from "./interactiveScaleItemsIpnLfcSchool";
import { ipnLfcSelfReportDomains } from "./interactiveScaleItemsIpnLfcSelfReport";
import { ipnLfcObservationDomains } from "./interactiveScaleItemsIpnLfcObservation";
import { ipnLfcMotorSpeechDomains } from "./interactiveScaleItemsIpnLfcMotorSpeech";
import { ipnLfcAnamnesisDomains } from "./interactiveScaleItemsIpnLfcAnamnesis";
import { ipnLfcDifferentialsDomains } from "./interactiveScaleItemsIpnLfcDifferentials";
import { ipnLfcSynthesisDomains } from "./interactiveScaleItemsIpnLfcSynthesis";

export const ipnLfc200Items: Record<string, InteractiveScaleDef> = {
  "ipn-lfc-familia-50": {
    instruction: "Marque a frequência ou intensidade no contexto observado. Use N/O quando não houver oportunidade ou informação suficiente. Registre exemplos e fatores que melhoram ou pioram o desempenho.",
    infoBox: "Instrumento autoral e não validado. A soma é apenas descritiva e não deve ser usada como ponto de corte, probabilidade diagnóstica ou medida isolada de gravidade. Red flags permanecem fora do escore.",
    labels: IPN_LFC_CHOICE_LABELS,
    optionPoints: [0, 1, 2, 3, 0],
    scoreDirection: "higher_better",
    totalLabel: "Perfil descritivo — Família 50",
    bands: [...IPN_LFC_PROFILE_BANDS],
    domains: ipnLfcFamilyDomains,
  },
  "ipn-lfc-escola-30": {
    instruction: "Marque a frequência ou intensidade no contexto observado. Use N/O quando não houver oportunidade ou informação suficiente. Registre exemplos e fatores que melhoram ou pioram o desempenho.",
    infoBox: "Instrumento autoral e não validado. A soma é apenas descritiva e não deve ser usada como ponto de corte, probabilidade diagnóstica ou medida isolada de gravidade. Red flags permanecem fora do escore.",
    labels: IPN_LFC_CHOICE_LABELS,
    optionPoints: [0, 1, 2, 3, 0],
    scoreDirection: "higher_better",
    totalLabel: "Perfil descritivo — Escola/Terapia 30",
    bands: [...IPN_LFC_PROFILE_BANDS],
    domains: ipnLfcSchoolDomains,
  },
  "ipn-lfc-autopercepcao-20": {
    instruction: "Marque a frequência ou intensidade no contexto observado. Use N/O quando não houver oportunidade ou informação suficiente. Registre exemplos e fatores que melhoram ou pioram o desempenho.",
    infoBox: "Instrumento autoral e não validado. A soma é apenas descritiva e não deve ser usada como ponto de corte, probabilidade diagnóstica ou medida isolada de gravidade. Red flags permanecem fora do escore.",
    labels: IPN_LFC_CHOICE_LABELS,
    optionPoints: [0, 1, 2, 3, 0],
    scoreDirection: "higher_better",
    totalLabel: "Perfil descritivo — Autopercepção Apoiada 20",
    bands: [...IPN_LFC_PROFILE_BANDS],
    domains: ipnLfcSelfReportDomains,
  },
  "ipn-lfc-observacao-30": {
    instruction: "Marque a frequência ou intensidade no contexto observado. Use N/O quando não houver oportunidade ou informação suficiente. Registre exemplos e fatores que melhoram ou pioram o desempenho.",
    infoBox: "Instrumento autoral e não validado. A soma é apenas descritiva e não deve ser usada como ponto de corte, probabilidade diagnóstica ou medida isolada de gravidade. Red flags permanecem fora do escore.",
    labels: IPN_LFC_CHOICE_LABELS,
    optionPoints: [0, 1, 2, 3, 0],
    scoreDirection: "higher_better",
    totalLabel: "Perfil descritivo — Observação Clínica 30",
    bands: [...IPN_LFC_PROFILE_BANDS],
    domains: ipnLfcObservationDomains,
  },
  "ipn-lfc-fala-motora-20": {
    instruction: "Marque a frequência ou intensidade no contexto observado. Use N/O quando não houver oportunidade ou informação suficiente. Registre exemplos e fatores que melhoram ou pioram o desempenho.",
    infoBox: "Instrumento autoral e não validado. A soma é apenas descritiva e não deve ser usada como ponto de corte, probabilidade diagnóstica ou medida isolada de gravidade. Red flags permanecem fora do escore.",
    labels: IPN_LFC_CHOICE_LABELS,
    optionPoints: [0, 1, 2, 3, 0],
    scoreDirection: "higher_better",
    totalLabel: "Perfil descritivo — Fala Motora/Fluência/Voz 20",
    bands: [...IPN_LFC_PROFILE_BANDS],
    domains: ipnLfcMotorSpeechDomains,
  },
  "ipn-lfc-anamnese-20": {
    instruction: "Registre somente o que for pertinente, com fatos, exemplos, curso temporal, fontes e próximo passo. Os campos são opcionais e não geram escore.",
    infoBox: "Módulo qualitativo autoral. Não produz pontuação diagnóstica; red flags exigem avaliação própria e não entram no escore.",
    labels: IPN_LFC_TEXT_LABELS,
    optionPoints: [0, 0],
    scoreDirection: "higher_better",
    totalLabel: "Perfil descritivo — Anamnese e Red Flags 20",
    bands: [...IPN_LFC_TEXT_BANDS],
    domains: ipnLfcAnamnesisDomains,
  },
  "ipn-lfc-diferenciais-15": {
    instruction: "Registre somente o que for pertinente, com fatos, exemplos, curso temporal, fontes e próximo passo. Os campos são opcionais e não geram escore.",
    infoBox: "Módulo qualitativo autoral. Não produz pontuação diagnóstica; red flags exigem avaliação própria e não entram no escore.",
    labels: IPN_LFC_TEXT_LABELS,
    optionPoints: [0, 0],
    scoreDirection: "higher_better",
    totalLabel: "Perfil descritivo — Diferenciais 15",
    bands: [...IPN_LFC_TEXT_BANDS],
    domains: ipnLfcDifferentialsDomains,
  },
  "ipn-lfc-sintese-15": {
    instruction: "Registre somente o que for pertinente, com fatos, exemplos, curso temporal, fontes e próximo passo. Os campos são opcionais e não geram escore.",
    infoBox: "Módulo qualitativo autoral. Não produz pontuação diagnóstica; red flags exigem avaliação própria e não entram no escore.",
    labels: IPN_LFC_TEXT_LABELS,
    optionPoints: [0, 0],
    scoreDirection: "higher_better",
    totalLabel: "Perfil descritivo — Síntese e Metas 15",
    bands: [...IPN_LFC_TEXT_BANDS],
    domains: ipnLfcSynthesisDomains,
  },
};

const EXPECTED_COUNTS: Record<string, number> = {
  "ipn-lfc-familia-50": 50,
  "ipn-lfc-escola-30": 30,
  "ipn-lfc-autopercepcao-20": 20,
  "ipn-lfc-observacao-30": 30,
  "ipn-lfc-fala-motora-20": 20,
  "ipn-lfc-anamnese-20": 20,
  "ipn-lfc-diferenciais-15": 15,
  "ipn-lfc-sintese-15": 15,
};

for (const [id, expected] of Object.entries(EXPECTED_COUNTS)) {
  const delivered = (ipnLfc200Items[id]?.domains ?? []).reduce(
    (total, domain) => total + domain.items.length,
    0,
  );
  if (delivered !== expected) {
    throw new Error(`[IPN-LFC 200] ${id}: ${delivered}/${expected} itens entregues`);
  }
}
