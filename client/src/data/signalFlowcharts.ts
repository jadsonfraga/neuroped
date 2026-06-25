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
  // ═══════════════════════════════════════════════════════════
  // TEA / AUTISMO
  // ═══════════════════════════════════════════════════════════
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

  // ═══════════════════════════════════════════════════════════
  // TDAH
  // ═══════════════════════════════════════════════════════════
  tdah: {
    signal: "tdah",
    label: "TDAH",
    branches: [
      {
        label: "0–6 anos · pré-escolar",
        minMonths: 0,
        maxMonths: 72,
        tiers: {
          ouro: ["sdq", "cbcl"],
          prata: ["cbcl", "sdq"],
          bronze: ["j26-051"],
        },
      },
      {
        label: "6–12 anos · escolar",
        minMonths: 72,
        maxMonths: 144,
        tiers: {
          ouro: ["snap", "vanderbilt"],
          prata: ["brief2", "cbcl"],
          bronze: ["sdq", "conners"],
        },
      },
      {
        label: "12–18 anos · adolescente",
        minMonths: 144,
        maxMonths: 216,
        tiers: {
          ouro: ["snap", "conners"],
          prata: ["brief2"],
          bronze: ["sdq"],
        },
      },
    ],
    monitoring: {
      ouro: ["snap"],
      prata: ["brief2"],
      bronze: ["cbcl"],
    },
  },

  // ═══════════════════════════════════════════════════════════
  // COMPORTAMENTO
  // ═══════════════════════════════════════════════════════════
  comportamento: {
    signal: "comportamento",
    label: "Comportamento / Disruptividade",
    branches: [
      {
        label: "0–2 anos · primeira infância",
        minMonths: 0,
        maxMonths: 24,
        tiers: {
          ouro: ["cbcl"],
          prata: ["tea-comportamentos"],
          bronze: ["orientacao-parental"],
        },
      },
      {
        label: "2–6 anos · pré-escolar",
        minMonths: 24,
        maxMonths: 72,
        tiers: {
          ouro: ["cbcl", "sdq"],
          prata: ["sdq", "abc"],
          bronze: ["abc"],
        },
      },
      {
        label: "6–18 anos · escolar/adolescente",
        minMonths: 72,
        maxMonths: 216,
        tiers: {
          ouro: ["cbcl"],
          prata: ["conners", "sdq"],
          bronze: ["sdq"],
        },
      },
    ],
    monitoring: {
      ouro: ["cbcl"],
      prata: ["sdq"],
      bronze: ["abc"],
    },
  },

  // ═══════════════════════════════════════════════════════════
  // ANSIEDADE
  // ═══════════════════════════════════════════════════════════
  ansiedade: {
    signal: "ansiedade",
    label: "Ansiedade",
    branches: [
      {
        label: "2–4 anos · pré-escolar",
        minMonths: 24,
        maxMonths: 48,
        tiers: {
          ouro: ["cbcl"],
          prata: ["sdq"],
          bronze: ["ems"],
        },
      },
      {
        label: "4–8 anos · escolar precoce",
        minMonths: 48,
        maxMonths: 96,
        tiers: {
          ouro: ["eai"],
          prata: ["cbcl"],
          bronze: ["easi"],
        },
      },
      {
        label: "8–12 anos · escolar",
        minMonths: 96,
        maxMonths: 144,
        tiers: {
          ouro: ["scared"],
          prata: ["eai"],
          bronze: ["sdq"],
        },
      },
      {
        label: "12–18 anos · adolescente",
        minMonths: 144,
        maxMonths: 216,
        tiers: {
          ouro: ["scared"],
          prata: ["gad7ped"],
          bronze: ["eai"],
        },
      },
    ],
    monitoring: {
      ouro: ["scared"],
      prata: ["eai"],
      bronze: ["cbcl"],
    },
  },

  // ═══════════════════════════════════════════════════════════
  // DEPRESSÃO
  // ═══════════════════════════════════════════════════════════
  depressao: {
    signal: "depressao",
    label: "Depressão / Humor",
    branches: [
      {
        label: "4–7 anos · pré-escolar",
        minMonths: 48,
        maxMonths: 84,
        tiers: {
          ouro: ["edi"],
          prata: ["cbcl"],
          bronze: ["orientacao-parental"],
        },
      },
      {
        label: "7–11 anos · escolar",
        minMonths: 84,
        maxMonths: 132,
        tiers: {
          ouro: ["cdi2"],
          prata: ["cssrs"],
          bronze: ["cbcl"],
        },
      },
      {
        label: "11–18 anos · adolescente",
        minMonths: 132,
        maxMonths: 216,
        tiers: {
          ouro: ["phqa"],
          prata: ["cdi2"],
          bronze: ["cssrs"],
        },
      },
    ],
    monitoring: {
      ouro: ["cdi2"],
      prata: ["phqa"],
      bronze: ["cbcl"],
    },
  },

  // ═══════════════════════════════════════════════════════════
  // RISCO DE SUICÍDIO
  // ═══════════════════════════════════════════════════════════
  suicidio: {
    signal: "suicidio",
    label: "Risco de Suicídio / Autolesão",
    branches: [
      {
        label: "3–6 anos · avaliação clínica",
        minMonths: 36,
        maxMonths: 72,
        tiers: {
          ouro: ["eaah"],
          prata: ["cssrs"],
          bronze: [],
        },
      },
      {
        label: "6–18 anos · rastreio estruturado",
        minMonths: 72,
        maxMonths: 216,
        tiers: {
          ouro: ["cssrs"],
          prata: ["ecar-si"],
          bronze: ["eaah"],
        },
      },
    ],
    monitoring: {
      ouro: ["cssrs"],
      prata: ["ecar-si"],
      bronze: [],
    },
  },

  // ═══════════════════════════════════════════════════════════
  // LINGUAGEM
  // ═══════════════════════════════════════════════════════════
  linguagem: {
    signal: "linguagem",
    label: "Linguagem / Comunicação",
    branches: [
      {
        label: "0–2 anos · marcos precoces",
        minMonths: 0,
        maxMonths: 24,
        tiers: {
          ouro: ["j26-003"],
          prata: ["j26-091"],
          bronze: ["j26-009"],
        },
      },
      {
        label: "2–5 anos · pré-escolar",
        minMonths: 24,
        maxMonths: 60,
        tiers: {
          ouro: ["ems"],
          prata: ["linguagem-fonologia"],
          bronze: ["j26-091"],
        },
      },
      {
        label: "5–12 anos · escolar",
        minMonths: 60,
        maxMonths: 144,
        tiers: {
          ouro: ["linguagem-fonologia"],
          prata: ["j26-085"],
          bronze: ["j26-090"],
        },
      },
      {
        label: "12–18 anos · adolescente",
        minMonths: 144,
        maxMonths: 216,
        tiers: {
          ouro: ["j26-086"],
          prata: ["j26-020"],
          bronze: ["j26-089"],
        },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // ATRASO DO DESENVOLVIMENTO
  // ═══════════════════════════════════════════════════════════
  atraso: {
    signal: "atraso",
    label: "Atraso do Desenvolvimento",
    branches: [
      {
        label: "0–6 meses · lactente",
        minMonths: 0,
        maxMonths: 6,
        tiers: {
          ouro: ["j26-001"],
          prata: ["j26-003"],
          bronze: ["j26-004"],
        },
      },
      {
        label: "6–12 meses · bebê",
        minMonths: 6,
        maxMonths: 12,
        tiers: {
          ouro: ["j26-002"],
          prata: ["j26-003"],
          bronze: ["denver"],
        },
      },
      {
        label: "1–4 anos · toddler",
        minMonths: 12,
        maxMonths: 48,
        tiers: {
          ouro: ["denver"],
          prata: ["asq3"],
          bronze: ["j26-010"],
        },
      },
      {
        label: "4–6 anos · pré-escolar",
        minMonths: 48,
        maxMonths: 72,
        tiers: {
          ouro: ["denver"],
          prata: ["asq3"],
          bronze: ["emdi"],
        },
      },
      {
        label: "6–18 anos · escolar/adolescente",
        minMonths: 72,
        maxMonths: 216,
        tiers: {
          ouro: ["vineland"],
          prata: ["pant"],
          bronze: ["ips"],
        },
      },
    ],
    monitoring: {
      ouro: ["denver"],
      prata: ["asq3"],
      bronze: ["vineland"],
    },
  },

  // ═══════════════════════════════════════════════════════════
  // APRENDIZAGEM / DIFICULDADES ESCOLARES
  // ═══════════════════════════════════════════════════════════
  aprendizagem: {
    signal: "aprendizagem",
    label: "Aprendizagem / Dificuldades Escolares",
    branches: [
      {
        label: "4–6 anos · pré-alfabetização",
        minMonths: 48,
        maxMonths: 72,
        tiers: {
          ouro: ["j26-084"],
          prata: ["linguagem-fonologia"],
          bronze: ["conhecimento-visual"],
        },
      },
      {
        label: "6–14 anos · escolar",
        minMonths: 72,
        maxMonths: 168,
        tiers: {
          ouro: ["tde2-adaptado"],
          prata: ["j26-094"],
          bronze: ["j26-101"],
        },
      },
      {
        label: "14–18 anos · adolescente",
        minMonths: 168,
        maxMonths: 216,
        tiers: {
          ouro: ["j26-098"],
          prata: ["j26-104"],
          bronze: ["portal-familia-psicoeducacao"],
        },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // COGNIÇÃO / FUNÇÕES EXECUTIVAS
  // ═══════════════════════════════════════════════════════════
  cognicao: {
    signal: "cognicao",
    label: "Cognição / Funções Executivas",
    branches: [
      {
        label: "0–3 anos · lactente/toddler",
        minMonths: 0,
        maxMonths: 36,
        tiers: {
          ouro: ["j26-004"],
          prata: ["testes-reconhecimento"],
          bronze: ["j26-011"],
        },
      },
      {
        label: "3–6 anos · pré-escolar",
        minMonths: 36,
        maxMonths: 72,
        tiers: {
          ouro: ["conhecimento-visual"],
          prata: ["j26-022"],
          bronze: ["ecsm"],
        },
      },
      {
        label: "6–18 anos · escolar/adolescente",
        minMonths: 72,
        maxMonths: 216,
        tiers: {
          ouro: ["brief2"],
          prata: ["funcoes-executivas"],
          bronze: ["memoria-teste"],
        },
      },
    ],
    monitoring: {
      ouro: ["brief2"],
      prata: ["funcoes-executivas"],
      bronze: [],
    },
  },

  // ═══════════════════════════════════════════════════════════
  // MOTOR / COORDENAÇÃO
  // ═══════════════════════════════════════════════════════════
  motor: {
    signal: "motor",
    label: "Desenvolvimento Motor",
    branches: [
      {
        label: "0–12 meses · lactente",
        minMonths: 0,
        maxMonths: 12,
        tiers: {
          ouro: ["j26-001"],
          prata: ["j26-117"],
          bronze: ["j26-002"],
        },
      },
      {
        label: "1–4 anos · toddler/pré-escolar",
        minMonths: 12,
        maxMonths: 48,
        tiers: {
          ouro: ["j26-107"],
          prata: ["j26-008"],
          bronze: ["j26-112"],
        },
      },
      {
        label: "4–12 anos · escolar",
        minMonths: 48,
        maxMonths: 144,
        tiers: {
          ouro: ["motricidade-teste"],
          prata: ["j26-108"],
          bronze: ["escrita-desenho"],
        },
      },
      {
        label: "12–18 anos · adolescente",
        minMonths: 144,
        maxMonths: 216,
        tiers: {
          ouro: ["j26-115"],
          prata: ["j26-111"],
          bronze: ["j26-240"],
        },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // SONO
  // ═══════════════════════════════════════════════════════════
  sono: {
    signal: "sono",
    label: "Sono",
    branches: [
      {
        label: "1–4 anos · toddler",
        minMonths: 12,
        maxMonths: 48,
        tiers: {
          ouro: ["j26-130"],
          prata: ["j26-137"],
          bronze: ["j26-136"],
        },
      },
      {
        label: "4–10 anos · escolar",
        minMonths: 48,
        maxMonths: 120,
        tiers: {
          ouro: ["cshq"],
          prata: ["j26-130"],
          bronze: ["j26-137"],
        },
      },
      {
        label: "10–18 anos · adolescente",
        minMonths: 120,
        maxMonths: 216,
        tiers: {
          ouro: ["j26-136"],
          prata: ["inventarios-auto"],
          bronze: ["j26-130"],
        },
      },
    ],
    monitoring: {
      ouro: ["cshq"],
      prata: ["j26-130"],
      bronze: ["j26-136"],
    },
  },

  // ═══════════════════════════════════════════════════════════
  // FUNCIONALIDADE / COMPORTAMENTO ADAPTATIVO
  // ═══════════════════════════════════════════════════════════
  funcionalidade: {
    signal: "funcionalidade",
    label: "Funcionalidade / Comportamento Adaptativo",
    branches: [
      {
        label: "0–2 anos · lactente/toddler",
        minMonths: 0,
        maxMonths: 24,
        tiers: {
          ouro: ["vineland"],
          prata: ["denver"],
          bronze: ["pant"],
        },
      },
      {
        label: "2–18 anos · pré-escolar a adolescente",
        minMonths: 24,
        maxMonths: 216,
        tiers: {
          ouro: ["vineland"],
          prata: ["pedsql"],
          bronze: ["eaf"],
        },
      },
    ],
    monitoring: {
      ouro: ["vineland"],
      prata: ["pedsql"],
      bronze: [],
    },
  },

  // ═══════════════════════════════════════════════════════════
  // HABILIDADES SOCIAIS
  // ═══════════════════════════════════════════════════════════
  social: {
    signal: "social",
    label: "Habilidades Sociais / Cognição Social",
    branches: [
      {
        label: "0–3 anos · desenvolvimento socioemocional",
        minMonths: 0,
        maxMonths: 36,
        tiers: {
          ouro: ["j26-007"],
          prata: ["j26-021"],
          bronze: ["j26-009"],
        },
      },
      {
        label: "3–6 anos · cognição social precoce",
        minMonths: 36,
        maxMonths: 72,
        tiers: {
          ouro: ["j26-203"],
          prata: ["j26-022"],
          bronze: ["j26-026"],
        },
      },
      {
        label: "6–18 anos · escolar/adolescente",
        minMonths: 72,
        maxMonths: 216,
        tiers: {
          ouro: ["j26-022"],
          prata: ["j26-181"],
          bronze: ["j26-176"],
        },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // TIQUES / TOURETTE
  // ═══════════════════════════════════════════════════════════
  tiques: {
    signal: "tiques",
    label: "Tiques / Síndrome de Tourette",
    branches: [
      {
        label: "3–18 anos",
        minMonths: 36,
        maxMonths: 216,
        tiers: {
          ouro: ["ygtss"],
          prata: [],
          bronze: [],
        },
      },
    ],
    monitoring: {
      ouro: ["ygtss"],
      prata: [],
      bronze: [],
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
