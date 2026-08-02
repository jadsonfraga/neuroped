import type { InteractiveBand } from "./interactiveScaleItems";

export const IPN_EPI_SEG_CHOICE_LABELS = [
  "0 · Não observado / preservado",
  "1 · Possível / ocasional",
  "2 · Frequente / relevante",
  "3 · Intenso / prioritário",
  "N/O · Sem oportunidade / informação",
];

export const IPN_EPI_SEG_STRENGTH_LABELS = [
  "0 · Ainda não / nunca",
  "1 · Às vezes / com muita ajuda",
  "2 · Frequentemente / com alguma ajuda",
  "3 · Consistentemente / de modo acessível",
  "N/O · Não foi possível responder",
];

export const IPN_EPI_SEG_TEXT_LABELS = ["Registro qualitativo", "Sem registro aplicável"];

export const IPN_EPI_SEG_PROFILE_BANDS: InteractiveBand[] = [
  { minPct: 70, classification: "Carga descritiva alta — revisão prioritária", color: "red", description: "Muitos itens foram marcados como relevantes. Isso não define epilepsia nem gravidade; priorize cronologia, segurança, red flags, impacto funcional e avaliação clínica." },
  { minPct: 45, classification: "Carga descritiva moderada — aprofundar", color: "orange", description: "Há sinais e impactos em vários itens. Triangule informantes, vídeos, exame, EEG e contexto antes de classificar." },
  { minPct: 15, classification: "Sinais focais — contextualizar", color: "amber", description: "Alguns itens merecem aprofundamento. Registre frequência, duração, sequência e recuperação." },
  { minPct: 0, classification: "Poucos sinais neste módulo", color: "emerald", description: "Poucos itens foram assinalados neste contexto. Isso não exclui eventos em outro ambiente nem substitui avaliação clínica." },
];

export const IPN_EPI_SEG_STRENGTH_BANDS: InteractiveBand[] = [
  { minPct: 75, classification: "Autonomia e acesso amplos", color: "emerald", description: "A criança relata boa participação no próprio plano. Preserve facilitadores e revise metas pessoais." },
  { minPct: 50, classification: "Autonomia parcial", color: "amber", description: "Há recursos presentes e barreiras relevantes. Priorize comunicação, segurança e participação nas decisões." },
  { minPct: 25, classification: "Autonomia restrita", color: "orange", description: "Poucas condições de acesso foram relatadas. Reforce comunicação apoiada, privacidade e treinamento." },
  { minPct: 0, classification: "Acesso muito limitado ou resposta insuficiente", color: "red", description: "Verifique se o formato permitiu resposta autêntica e construa um plano acessível de segurança e autonomia." },
];

export const IPN_EPI_SEG_TEXT_BANDS: InteractiveBand[] = [
  { minPct: 0, classification: "Roteiro qualitativo — revisão médica necessária", color: "emerald", description: "Este módulo organiza narrativa clínica e não produz escore, diagnóstico, prescrição ou prognóstico." },
];
