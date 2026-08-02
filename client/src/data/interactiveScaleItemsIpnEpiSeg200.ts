import type { InteractiveScaleDef } from "./interactiveScaleItems";
import {
  IPN_EPI_SEG_CHOICE_LABELS,
  IPN_EPI_SEG_STRENGTH_LABELS,
  IPN_EPI_SEG_TEXT_LABELS,
  IPN_EPI_SEG_PROFILE_BANDS,
  IPN_EPI_SEG_STRENGTH_BANDS,
  IPN_EPI_SEG_TEXT_BANDS,
} from "./interactiveScaleItemsIpnEpiSegCommon";
import { ipnEpiSegFamilyDomains } from "./interactiveScaleItemsIpnEpiSegFamily";
import { ipnEpiSegSchoolDomains } from "./interactiveScaleItemsIpnEpiSegSchool";
import { ipnEpiSegSelfReportDomains } from "./interactiveScaleItemsIpnEpiSegSelfReport";
import { ipnEpiSegObservationDomains } from "./interactiveScaleItemsIpnEpiSegObservation";
import { ipnEpiSegCharacterizationDomains } from "./interactiveScaleItemsIpnEpiSegCharacterization";
import { ipnEpiSegTreatmentDomains } from "./interactiveScaleItemsIpnEpiSegTreatment";
import { ipnEpiSegAnamnesisDomains } from "./interactiveScaleItemsIpnEpiSegAnamnesis";
import { ipnEpiSegSynthesisDomains } from "./interactiveScaleItemsIpnEpiSegSynthesis";

const profileInstruction = "Marque frequência ou relevância no contexto observado. Use N/O quando não houver oportunidade ou informação suficiente. Registre exemplos e sequência temporal.";
const profileInfo = "Instrumento autoral e não validado. A soma é apenas descritiva e não define epilepsia, tipo de crise, síndrome, prognóstico ou tratamento. Red flags permanecem fora do escore.";
const textInstruction = "Registre somente o que for pertinente, com fatos, curso temporal, fontes e próximo passo. Os campos são opcionais e não geram escore.";
const textInfo = "Módulo qualitativo autoral. Não produz pontuação diagnóstica; red flags exigem avaliação própria e permanecem fora do escore.";

export const ipnEpiSeg200Items: Record<string, InteractiveScaleDef> = {
  "ipn-epi-seg-familia-60": { instruction: profileInstruction, infoBox: profileInfo, labels: IPN_EPI_SEG_CHOICE_LABELS, optionPoints: [0,1,2,3,0], scoreDirection: "higher_worse", totalLabel: "Perfil descritivo — Família e Cuidadores", bands: [...IPN_EPI_SEG_PROFILE_BANDS], domains: ipnEpiSegFamilyDomains },
  "ipn-epi-seg-escola-30": { instruction: profileInstruction, infoBox: profileInfo, labels: IPN_EPI_SEG_CHOICE_LABELS, optionPoints: [0,1,2,3,0], scoreDirection: "higher_worse", totalLabel: "Perfil descritivo — Escola e Equipe Terapêutica", bands: [...IPN_EPI_SEG_PROFILE_BANDS], domains: ipnEpiSegSchoolDomains },
  "ipn-epi-seg-autopercepcao-20": { instruction: "Responda com apoio acessível, sem responder pela criança. Aceite fala, escrita, gesto, olhar, símbolo ou tecnologia. Maior resposta indica maior acesso e participação percebidos.", infoBox: "Autorrelato apoiado, autoral e não validado. Não exige fala oral nem alfabetização e não classifica gravidade da epilepsia.", labels: IPN_EPI_SEG_STRENGTH_LABELS, optionPoints: [0,1,2,3,0], scoreDirection: "higher_better", totalLabel: "Perfil descritivo — Autopercepção Apoiada", bands: [...IPN_EPI_SEG_STRENGTH_BANDS], domains: ipnEpiSegSelfReportDomains },
  "ipn-epi-seg-observacao-20": { instruction: profileInstruction, infoBox: profileInfo, labels: IPN_EPI_SEG_CHOICE_LABELS, optionPoints: [0,1,2,3,0], scoreDirection: "higher_worse", totalLabel: "Perfil descritivo — Observação Clínica", bands: [...IPN_EPI_SEG_PROFILE_BANDS], domains: ipnEpiSegObservationDomains },
  "ipn-epi-seg-caracterizacao-20": { instruction: profileInstruction, infoBox: profileInfo, labels: IPN_EPI_SEG_CHOICE_LABELS, optionPoints: [0,1,2,3,0], scoreDirection: "higher_worse", totalLabel: "Perfil descritivo — Caracterização do Evento", bands: [...IPN_EPI_SEG_PROFILE_BANDS], domains: ipnEpiSegCharacterizationDomains },
  "ipn-epi-seg-tratamento-20": { instruction: profileInstruction, infoBox: profileInfo, labels: IPN_EPI_SEG_CHOICE_LABELS, optionPoints: [0,1,2,3,0], scoreDirection: "higher_worse", totalLabel: "Perfil descritivo — Tratamento, Resgate e Redução de Risco", bands: [...IPN_EPI_SEG_PROFILE_BANDS], domains: ipnEpiSegTreatmentDomains },
  "ipn-epi-seg-anamnese-15": { instruction: textInstruction, infoBox: textInfo, labels: IPN_EPI_SEG_TEXT_LABELS, optionPoints: [0,0], scoreDirection: "higher_worse", totalLabel: "Perfil descritivo — Anamnese e Red Flags", bands: [...IPN_EPI_SEG_TEXT_BANDS], domains: ipnEpiSegAnamnesisDomains },
  "ipn-epi-seg-sintese-15": { instruction: textInstruction, infoBox: textInfo, labels: IPN_EPI_SEG_TEXT_LABELS, optionPoints: [0,0], scoreDirection: "higher_worse", totalLabel: "Perfil descritivo — Síntese, Metas e Plano", bands: [...IPN_EPI_SEG_TEXT_BANDS], domains: ipnEpiSegSynthesisDomains },
};

const EXPECTED_COUNTS: Record<string, number> = {
  "ipn-epi-seg-familia-60": 60,
  "ipn-epi-seg-escola-30": 30,
  "ipn-epi-seg-autopercepcao-20": 20,
  "ipn-epi-seg-observacao-20": 20,
  "ipn-epi-seg-caracterizacao-20": 20,
  "ipn-epi-seg-tratamento-20": 20,
  "ipn-epi-seg-anamnese-15": 15,
  "ipn-epi-seg-sintese-15": 15,
};

for (const [id, expected] of Object.entries(EXPECTED_COUNTS)) {
  const delivered = (ipnEpiSeg200Items[id]?.domains ?? []).reduce((total, domain) => total + domain.items.length, 0);
  if (delivered !== expected) throw new Error(`[IPN-EPI/SEG 200] ${id}: ${delivered}/${expected} itens entregues`);
}
