import type { InteractiveScaleDef } from "./interactiveScaleItems";
import {
  IPN_PC_FUN_FREQ_LABELS,
  IPN_PC_FUN_OBS_LABELS,
  IPN_PC_FUN_STRENGTH_LABELS,
  IPN_PC_FUN_TEXT_LABELS,
  IPN_PC_FUN_PROFILE_BANDS,
  IPN_PC_FUN_STRENGTH_BANDS,
  IPN_PC_FUN_TEXT_BANDS,
} from "./interactiveScaleItemsIpnPcFunCommon";
import { ipnPcFunFamilyDomains } from "./interactiveScaleItemsIpnPcFunFamily";
import { ipnPcFunSchoolDomains } from "./interactiveScaleItemsIpnPcFunSchool";
import { ipnPcFunSelfReportDomains } from "./interactiveScaleItemsIpnPcFunSelfReport";
import { ipnPcFunObservationDomains } from "./interactiveScaleItemsIpnPcFunObservation";
import { ipnPcFunToneDomains } from "./interactiveScaleItemsIpnPcFunTone";
import { ipnPcFunFeedingDomains } from "./interactiveScaleItemsIpnPcFunFeeding";
import { ipnPcFunAnamnesisDomains } from "./interactiveScaleItemsIpnPcFunAnamnesis";
import { ipnPcFunSynthesisDomains } from "./interactiveScaleItemsIpnPcFunSynthesis";

export const ipnPcFun200Items: Record<string, InteractiveScaleDef> = {
  "ipn-pc-fun-familia-50": {
    instruction: "Considere o funcionamento recente e compare com as próprias oportunidades, metas e apoios da criança. Para 2 ou 3, registre exemplo, impacto e suporte que modificou o desempenho. Use N/O quando não houver observação suficiente.",
    infoBox: "Instrumento autoral não validado. A soma organiza carga neste informante, sem classificar gravidade, nível funcional, diagnóstico ou indicação terapêutica. N/O não significa ausência.",
    labels: IPN_PC_FUN_FREQ_LABELS,
    optionPoints: [0, 1, 2, 3, 0],
    scoreDirection: "higher_worse",
    totalLabel: "Perfil descritivo — Família 50",
    bands: [...IPN_PC_FUN_PROFILE_BANDS],
    domains: ipnPcFunFamilyDomains,
  },
  "ipn-pc-fun-escola-30": {
    instruction: "Considere o funcionamento recente e compare com as próprias oportunidades, metas e apoios da criança. Para 2 ou 3, registre exemplo, impacto e suporte que modificou o desempenho. Use N/O quando não houver observação suficiente.",
    infoBox: "Instrumento autoral não validado. A soma organiza carga neste informante, sem classificar gravidade, nível funcional, diagnóstico ou indicação terapêutica. N/O não significa ausência.",
    labels: IPN_PC_FUN_FREQ_LABELS,
    optionPoints: [0, 1, 2, 3, 0],
    scoreDirection: "higher_worse",
    totalLabel: "Perfil descritivo — Escola/Terapia 30",
    bands: [...IPN_PC_FUN_PROFILE_BANDS],
    domains: ipnPcFunSchoolDomains,
  },
  "ipn-pc-fun-autopercepcao-20": {
    instruction: "Responda com apoio acessível e sem responder pela criança. Considere fala, olhar, gesto, símbolo ou tecnologia. Maior resposta indica maior acesso e participação percebidos.",
    infoBox: "Autorrelato apoiado, autoral e não validado. Maior percentual descreve maior acesso percebido, não menor gravidade clínica; aceite fala, gesto, olhar, símbolo ou tecnologia.",
    labels: IPN_PC_FUN_STRENGTH_LABELS,
    optionPoints: [0, 1, 2, 3, 0],
    scoreDirection: "higher_better",
    totalLabel: "Perfil descritivo — Autopercepção Apoiada 20",
    bands: [...IPN_PC_FUN_STRENGTH_BANDS],
    domains: ipnPcFunSelfReportDomains,
  },
  "ipn-pc-fun-observacao-20": {
    instruction: "Considere o funcionamento recente e compare com as próprias oportunidades, metas e apoios da criança. Para 2 ou 3, registre exemplo, impacto e suporte que modificou o desempenho. Use N/O quando não houver observação suficiente.",
    infoBox: "Instrumento autoral não validado. A soma organiza carga neste informante, sem classificar gravidade, nível funcional, diagnóstico ou indicação terapêutica. N/O não significa ausência.",
    labels: IPN_PC_FUN_OBS_LABELS,
    optionPoints: [0, 1, 2, 3, 0],
    scoreDirection: "higher_worse",
    totalLabel: "Perfil descritivo — Observação Clínica 20",
    bands: [...IPN_PC_FUN_PROFILE_BANDS],
    domains: ipnPcFunObservationDomains,
  },
  "ipn-pc-fun-tonus-20": {
    instruction: "Considere o funcionamento recente e compare com as próprias oportunidades, metas e apoios da criança. Para 2 ou 3, registre exemplo, impacto e suporte que modificou o desempenho. Use N/O quando não houver observação suficiente.",
    infoBox: "Instrumento autoral não validado. A soma organiza carga neste informante, sem classificar gravidade, nível funcional, diagnóstico ou indicação terapêutica. N/O não significa ausência.",
    labels: IPN_PC_FUN_OBS_LABELS,
    optionPoints: [0, 1, 2, 3, 0],
    scoreDirection: "higher_worse",
    totalLabel: "Perfil descritivo — Tônus e Movimento 20",
    bands: [...IPN_PC_FUN_PROFILE_BANDS],
    domains: ipnPcFunToneDomains,
  },
  "ipn-pc-fun-alimentacao-20": {
    instruction: "Considere o funcionamento recente e compare com as próprias oportunidades, metas e apoios da criança. Para 2 ou 3, registre exemplo, impacto e suporte que modificou o desempenho. Use N/O quando não houver observação suficiente.",
    infoBox: "Instrumento autoral não validado. A soma organiza carga neste informante, sem classificar gravidade, nível funcional, diagnóstico ou indicação terapêutica. N/O não significa ausência.",
    labels: IPN_PC_FUN_OBS_LABELS,
    optionPoints: [0, 1, 2, 3, 0],
    scoreDirection: "higher_worse",
    totalLabel: "Perfil descritivo — Alimentação/Respiração 20",
    bands: [...IPN_PC_FUN_PROFILE_BANDS],
    domains: ipnPcFunFeedingDomains,
  },
  "ipn-pc-fun-anamnese-20": {
    instruction: "Registre apenas o que for pertinente, com fatos, curso temporal, exemplos, fontes e próximo passo. Os campos são opcionais e não geram ponto de corte.",
    infoBox: "Instrumento autoral não validado. Os campos são qualitativos e não geram escore; integre com história, exame e avaliações apropriadas.",
    labels: IPN_PC_FUN_TEXT_LABELS,
    optionPoints: [0, 0],
    scoreDirection: "higher_worse",
    totalLabel: "Perfil descritivo — Anamnese e Red Flags 20",
    bands: [...IPN_PC_FUN_TEXT_BANDS],
    domains: ipnPcFunAnamnesisDomains,
  },
  "ipn-pc-fun-sintese-20": {
    instruction: "Registre apenas o que for pertinente, com fatos, curso temporal, exemplos, fontes e próximo passo. Os campos são opcionais e não geram ponto de corte.",
    infoBox: "Instrumento autoral não validado. Os campos são qualitativos e não geram escore; integre com história, exame e avaliações apropriadas.",
    labels: IPN_PC_FUN_TEXT_LABELS,
    optionPoints: [0, 0],
    scoreDirection: "higher_worse",
    totalLabel: "Perfil descritivo — Síntese e Metas 20",
    bands: [...IPN_PC_FUN_TEXT_BANDS],
    domains: ipnPcFunSynthesisDomains,
  },
};

const EXPECTED_COUNTS: Record<string, number> = {
  "ipn-pc-fun-familia-50": 50,
  "ipn-pc-fun-escola-30": 30,
  "ipn-pc-fun-autopercepcao-20": 20,
  "ipn-pc-fun-observacao-20": 20,
  "ipn-pc-fun-tonus-20": 20,
  "ipn-pc-fun-alimentacao-20": 20,
  "ipn-pc-fun-anamnese-20": 20,
  "ipn-pc-fun-sintese-20": 20,
};

for (const [id, expected] of Object.entries(EXPECTED_COUNTS)) {
  const delivered = (ipnPcFun200Items[id]?.domains ?? []).reduce(
    (total, domain) => total + domain.items.length,
    0,
  );
  if (delivered !== expected) {
    throw new Error(`[IPN-PC/FUN 200] ${id}: ${delivered}/${expected} itens entregues`);
  }
}
