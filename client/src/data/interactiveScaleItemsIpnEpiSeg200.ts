import type { InteractiveBand, InteractiveScaleDef } from "./interactiveScaleItems";
import { ipnEpiSegItems, type IpnEpiSegModuleKey } from "./ipnEpiSeg200Contract";

const NEED_LABELS = [
  "0 · Sem pendência clínica relevante",
  "1 · Necessidade leve ou pontual",
  "2 · Necessidade recorrente ou moderada",
  "3 · Prioridade alta ou impacto intenso",
  "N/O · Sem oportunidade ou informação",
];

const RED_FLAG_LABELS = [
  "Não presente no momento",
  "Presente / requer decisão clínica própria",
  "Informação insuficiente",
];

const NEED_BANDS: InteractiveBand[] = [
  { minPct: 75, classification: "Alta prioridade clínica relatada", color: "red", description: "Pontuação autoral de necessidade clínica. Revise itens, exemplos, contexto, discrepâncias entre informantes e red flags fora do escore. Não estima diagnóstico, gravidade validada ou prognóstico." },
  { minPct: 50, classification: "Necessidades recorrentes ou impacto relevante", color: "orange", description: "Use o resultado apenas para priorizar domínios da consulta. Não há ponto de corte, norma, sensibilidade, especificidade ou probabilidade diagnóstica." },
  { minPct: 25, classification: "Lacunas ou sinais leves/dependentes de contexto", color: "amber", description: "Aprofunde exemplos e compare ambientes. O percentual é organizacional, não diagnóstico." },
  { minPct: 0, classification: "Baixa necessidade de aprofundamento neste registro", color: "emerald", description: "Baixa carga relatada não exclui epilepsia nem outro diagnóstico. Red flags independem do escore." },
];

const TEXT_BANDS: InteractiveBand[] = [
  { minPct: 0, classification: "Roteiro qualitativo — integração clínica necessária", color: "emerald", description: "O módulo não produz escore. Registre fatos, fontes, temporalidade, impacto, incertezas e próximo passo." },
];

const SAFETY_BANDS: InteractiveBand[] = [
  { minPct: 0, classification: "Red flags fora do escore", color: "red", description: "Cada sinal presente exige avaliação própria conforme plano individualizado, contexto e rede local. A ausência de soma não reduz a urgência." },
];

function domainsFor(module: IpnEpiSegModuleKey, responseType: "choice" | "text") {
  const items = ipnEpiSegItems.filter((item) => item.module === module);
  const names = [...new Set(items.map((item) => item.domain))];
  return names.map((name) => ({
    name,
    items: items.filter((item) => item.domain === name).map((item) => responseType === "text"
      ? { text: item.prompt, example: `${item.title}. Registre presença/ausência, tempo, fonte, impacto e ação tomada.`, responseType: "text" as const, required: false, maxLength: 1200, placeholder: "Registro clínico opcional…" }
      : { text: item.prompt, example: `${item.title}. Pontue a necessidade de aprofundamento/intervenção relacionada ao tópico, não a frequência literal das palavras da pergunta.` }),
  }));
}

function scored(module: IpnEpiSegModuleKey, label: string): InteractiveScaleDef {
  return {
    instruction: "Para cada tópico, marque a NECESSIDADE CLÍNICA: 0 quando o assunto está bem caracterizado, o cuidado esperado está presente ou não há carga relevante; 3 quando há lacuna crítica, sinal intenso, alto impacto ou prioridade. Use N/O sem penalização quando não houver oportunidade real.",
    infoBox: "Instrumento autoral e não validado. A soma é apenas descritiva, sem ponto de corte, percentil, probabilidade diagnóstica ou diagnóstico automático. Red flags ficam fora do escore.",
    labels: NEED_LABELS, optionPoints: [0, 1, 2, 3, 0], scoreDirection: "higher_worse", totalLabel: `Perfil descritivo — ${label}`, bands: NEED_BANDS, domains: domainsFor(module, "choice"),
  };
}

function qualitative(module: IpnEpiSegModuleKey, label: string): InteractiveScaleDef {
  return {
    instruction: "Preencha somente os campos pertinentes. Registre fatos, exemplos, fonte, curso temporal, impacto e próximo passo; os campos são opcionais e não geram escore.",
    infoBox: "Módulo qualitativo autoral. Não gera soma, corte ou probabilidade diagnóstica.",
    labels: ["Registro qualitativo", "Sem registro aplicável"], optionPoints: [0, 0], scoreDirection: "higher_worse", totalLabel: `Registro qualitativo — ${label}`, bands: TEXT_BANDS, domains: domainsFor(module, "text"),
  };
}

export const ipnEpiSeg200Items: Record<string, InteractiveScaleDef> = {
  "ipn-epi-seg-familia-50": scored("familia", "Família 50"),
  "ipn-epi-seg-escola-30": scored("escola", "Escola 30"),
  "ipn-epi-seg-autopercepcao-20": scored("autopercepcao", "Autopercepção 20"),
  "ipn-epi-seg-observacao-20": scored("observacao", "Observação 20"),
  "ipn-epi-seg-anamnese-20": qualitative("anamnese", "Anamnese 20"),
  "ipn-epi-seg-diferenciais-20": qualitative("diferenciais", "Diferenciais 20"),
  "ipn-epi-seg-seguranca-20": {
    instruction: "Marque presença, ausência ou informação insuficiente e descreva a ação tomada. Este módulo é independente: não some, não espere outros campos e não derive risco por percentual.",
    infoBox: "RED FLAGS FORA DO ESCORE. Uma resposta presente exige decisão clínica própria conforme plano individualizado, contexto e rede local. Não substitui emergência, prescrição, bula ou protocolo institucional.",
    labels: RED_FLAG_LABELS, optionPoints: [0, 0, 0], scoreDirection: "higher_worse", totalLabel: "Segurança — sem escore", bands: SAFETY_BANDS, domains: domainsFor("seguranca", "choice"),
  },
  "ipn-epi-seg-sintese-20": qualitative("sintese", "Síntese e Plano 20"),
};

const EXPECTED_COUNTS: Record<string, number> = {
  "ipn-epi-seg-familia-50": 50, "ipn-epi-seg-escola-30": 30,
  "ipn-epi-seg-autopercepcao-20": 20, "ipn-epi-seg-observacao-20": 20,
  "ipn-epi-seg-anamnese-20": 20, "ipn-epi-seg-diferenciais-20": 20,
  "ipn-epi-seg-seguranca-20": 20, "ipn-epi-seg-sintese-20": 20,
};
for (const [id, expected] of Object.entries(EXPECTED_COUNTS)) {
  const delivered = (ipnEpiSeg200Items[id]?.domains ?? []).reduce((sum, domain) => sum + domain.items.length, 0);
  if (delivered !== expected) throw new Error(`[IPN-EPI/SEG 200] ${id}: ${delivered}/${expected} itens`);
}
