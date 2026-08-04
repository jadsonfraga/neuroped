import type { InteractiveBand, InteractiveScaleDef } from "./interactiveScaleItems";
import { mutismoSeletivoItems, type MutismoSeletivoModuleKey } from "./mutismoSeletivo200Contract";

const QUALITATIVE_BANDS: InteractiveBand[] = [
  { minPct: 0, classification: "Registro qualitativo — sem classificação automática", color: "emerald", description: "Integre fatos, fonte, contexto, impacto, achados a favor/contra, red flags e próximo passo. Este roteiro não gera escore, corte ou probabilidade diagnóstica." },
];
const SAFETY_BANDS: InteractiveBand[] = [
  { minPct: 0, classification: "Red flags fora de qualquer escore", color: "red", description: "Cada alerta exige avaliação própria e ação proporcional ao risco. A ausência de soma não reduz urgência." },
];
function domainsFor(module: MutismoSeletivoModuleKey) {
  const items = mutismoSeletivoItems.filter((item) => item.module === module);
  const names = [...new Set(items.map((item) => item.domain))];
  return names.map((name) => ({
    name,
    items: items.filter((item) => item.domain === name).map((item) => ({
      text: item.prompt, example: `${item.title}. Registre observação, relato, fonte, data, contexto, impacto, incerteza e ação.`,
      responseType: "text" as const, required: false, maxLength: 1800, placeholder: "Registro qualitativo opcional…",
    })),
  }));
}
function qualitative(module: MutismoSeletivoModuleKey, label: string, safety = false): InteractiveScaleDef {
  return {
    instruction: safety ? "Registre presença/ausência, fonte, contexto e ação. Não espere outros campos diante de risco." : "Preencha somente os campos pertinentes. Diferencie fato documentado, relato, observação, inferência, hipótese, contradição, incerteza e dado ausente.",
    infoBox: safety ? "RED FLAGS FORA DE QUALQUER ESCORE. Este módulo não soma, não classifica e não substitui urgência ou avaliação clínica." : "Roteiro qualitativo autoral. Sem escore, ponto de corte, percentil, probabilidade diagnóstica ou diagnóstico automático.",
    labels: ["Registro qualitativo", "Sem registro aplicável"], optionPoints: [0, 0], scoreDirection: "higher_worse",
    totalLabel: `Registro qualitativo — ${label}`, bands: safety ? SAFETY_BANDS : QUALITATIVE_BANDS, domains: domainsFor(module),
  };
}
export const mutismoSeletivo200Items: Record<string, InteractiveScaleDef> = {
  "mutismo-seletivo-familia-30": qualitative("familia", "Família 30"),
  "mutismo-seletivo-escola-30": qualitative("escola", "Escola 30"),
  "mutismo-seletivo-autopercepcao-20": qualitative("autopercepcao", "Autopercepção 20"),
  "mutismo-seletivo-anamnese-20": qualitative("anamnese", "Anamnese 20"),
  "mutismo-seletivo-observacao-20": qualitative("observacao", "Observação 20"),
  "mutismo-seletivo-diferenciais-20": qualitative("diferenciais", "Diferenciais 20"),
  "mutismo-seletivo-seguranca-10": qualitative("seguranca", "Segurança 10", true),
  "mutismo-seletivo-sintese-50": qualitative("sintese", "Síntese e Ferramentas 50"),
};
const EXPECTED_COUNTS: Record<string, number> = {
  "mutismo-seletivo-familia-30": 30, "mutismo-seletivo-escola-30": 30,
  "mutismo-seletivo-autopercepcao-20": 20, "mutismo-seletivo-anamnese-20": 20,
  "mutismo-seletivo-observacao-20": 20, "mutismo-seletivo-diferenciais-20": 20,
  "mutismo-seletivo-seguranca-10": 10, "mutismo-seletivo-sintese-50": 50,
};
for (const [id, expected] of Object.entries(EXPECTED_COUNTS)) {
  const delivered = (mutismoSeletivo200Items[id]?.domains ?? []).reduce((sum, domain) => sum + domain.items.length, 0);
  if (delivered !== expected) throw new Error(`[Mutismo seletivo 200] ${id}: ${delivered}/${expected} campos`);
}
