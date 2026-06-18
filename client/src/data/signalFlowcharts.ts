/**
 * signalFlowcharts.ts — Fluxogramas de decisão POR SINAL/QUEIXA (editável).
 *
 * Cada sinal (ex.: "tea") define ramos por faixa etária; cada ramo lista as
 * escalas em tiers OURO / PRATA / BRONZE (curadoria clínica do Dr. Jadson).
 * O motor do filtro consome isto: tiers sempre cheios (curados) e toda escala
 * abre internamente (ferramenta quando aplicável; ficha quando licenciada).
 *
 * COMO EDITAR: mova ids entre ouro/prata/bronze, adicione/remova ids, ajuste as
 * faixas (em MESES). Os ids são os de allScales (scaleFilter.ts). Um guard de
 * desenvolvimento avisa se algum id não existir.
 */

export interface FlowchartTierSet {
  ouro: string[];
  prata: string[];
  bronze: string[];
}

export interface FlowchartAgeBranch {
  label: string;
  minMonths: number;
  maxMonths: number;
  tiers: FlowchartTierSet;
}

export interface SignalFlowchart {
  signal: string; // id da queixa (scaleFilter.queixas)
  label: string;
  branches: FlowchartAgeBranch[];
  /** Mostrado quando o contexto é de monitorização/acompanhamento. */
  monitoring?: FlowchartTierSet;
}

export const signalFlowcharts: Record<string, SignalFlowchart> = {
  tea: {
    signal: "tea",
    label: "Autismo / TEA",
    branches: [
      {
        label: "0–18 meses · rastreio precoce",
        minMonths: 0,
        maxMonths: 18,
        tiers: {
          ouro: ["mchat", "q-chat-10"],
          prata: ["j26-009", "csbs-dp"],
          bronze: ["j26-007"],
        },
      },
      {
        label: "18 meses–3 anos",
        minMonths: 18,
        maxMonths: 36,
        tiers: {
          ouro: ["mchat", "ados2"],
          prata: ["cars", "j26-021"],
          bronze: ["j26-026", "stat"],
        },
      },
      {
        label: "3–6 anos · diagnóstico",
        minMonths: 36,
        maxMonths: 72,
        tiers: {
          ouro: ["ados2", "cars"],
          prata: ["srs2", "scq", "gars3"],
          bronze: ["j26-020", "j26-022"],
        },
      },
      {
        label: "6–12 anos · escolar",
        minMonths: 72,
        maxMonths: 144,
        tiers: {
          ouro: ["ados2", "srs2"],
          prata: ["assq", "cast", "gars3"],
          bronze: ["j26-205", "sensory-profile2"],
        },
      },
      {
        label: "12–18 anos · adolescente",
        minMonths: 144,
        maxMonths: 216,
        tiers: {
          ouro: ["ados2", "adir"],
          prata: ["srs2", "catq", "assq"],
          bronze: ["j26-208"],
        },
      },
    ],
    monitoring: {
      ouro: ["atec"],
      prata: ["j26-030"],
      bronze: ["sensory-profile2"],
    },
  },
};

export function getSignalFlowchart(signalId: string): SignalFlowchart | null {
  return signalFlowcharts[signalId] ?? null;
}

/**
 * Seleciona o ramo etário do sinal para uma idade (meses). Sem idade → mescla
 * todos os ramos, mantendo cada escala no melhor tier em que aparece.
 */
export function resolveFlowchartTierIds(
  flow: SignalFlowchart,
  ageMonths: number | null,
  monitoring = false,
): FlowchartTierSet {
  if (monitoring && flow.monitoring) return flow.monitoring;

  if (ageMonths === null) {
    // Mescla: ouro vence prata vence bronze (dedupe entre tiers).
    const ouro = new Set<string>();
    const prata = new Set<string>();
    const bronze = new Set<string>();
    for (const b of flow.branches) {
      b.tiers.ouro.forEach((id) => ouro.add(id));
      b.tiers.prata.forEach((id) => prata.add(id));
      b.tiers.bronze.forEach((id) => bronze.add(id));
    }
    for (const id of ouro) {
      prata.delete(id);
      bronze.delete(id);
    }
    for (const id of prata) bronze.delete(id);
    return { ouro: [...ouro], prata: [...prata], bronze: [...bronze] };
  }

  // Ramo cuja faixa contém a idade; senão o ramo de borda mais próximo.
  const branch =
    flow.branches.find((b) => ageMonths >= b.minMonths && ageMonths < b.maxMonths) ??
    flow.branches.reduce((best, b) => {
      const d = Math.min(Math.abs(ageMonths - b.minMonths), Math.abs(ageMonths - b.maxMonths));
      const bd = Math.min(Math.abs(ageMonths - best.minMonths), Math.abs(ageMonths - best.maxMonths));
      return d < bd ? b : best;
    }, flow.branches[0]);
  return branch.tiers;
}
