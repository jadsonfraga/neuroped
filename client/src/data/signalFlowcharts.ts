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

/** Ramo do fluxograma de atraso cujo ouro é o formulário SWYC Marcos da idade (janela [min, max) em meses). */
function swycMarcosBranch(form: string, minMonths: number, maxMonths: number, prata: string[], bronze: string[]): FlowchartAgeBranch {
  return {
    label: `${minMonths}–${maxMonths - 1} meses · SWYC Marcos ${form}`,
    minMonths,
    maxMonths,
    tiers: { ouro: [`swyc-marcos-${form}`], prata, bronze },
  };
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
          ouro: ["na-sinais-precoces-tea-pais", "q-chat-10"],
          prata: ["j26-009", "psn-np"],
          bronze: ["j26-007", "eci-fraga-qdce"],
        },
      },
      {
        label: "18 meses–3 anos",
        minMonths: 18,
        maxMonths: 36,
        tiers: {
          ouro: ["na-sinais-precoces-tea-pais"],
          prata: ["na-observacao-clinica-tea", "j26-216"],
          bronze: ["j26-217", "atec"],
        },
      },
      {
        label: "3–6 anos · diagnóstico",
        minMonths: 36,
        maxMonths: 72,
        tiers: {
          ouro: ["na-observacao-clinica-tea"],
          prata: ["tea-checklists", "ecsm"],
          bronze: ["j26-235", "j26-022"],
        },
      },
      {
        label: "6–12 anos · escolar",
        minMonths: 72,
        maxMonths: 144,
        tiers: {
          ouro: ["na-observacao-clinica-tea"],
          prata: ["tea-checklists", "ahsd-tea-triagem"],
          bronze: ["j26-205", "j26-022"],
        },
      },
      {
        label: "12–16 anos · adolescente",
        minMonths: 144,
        maxMonths: 192,
        tiers: {
          ouro: ["na-observacao-clinica-tea"],
          prata: ["aq10-adolescente", "tea-checklists"],
          bronze: ["j26-213", "ahsd-tea-triagem"],
        },
      },
      {
        label: "16–18 anos · adolescente (autorrelato disponível)",
        minMonths: 192,
        maxMonths: 216,
        tiers: {
          ouro: ["aq10-adolescente"],
          prata: ["na-observacao-clinica-tea", "camuflagem-tea-neuroped"],
          bronze: ["tea-checklists", "ahsd-tea-triagem"],
        },
      },
    ],
    monitoring: {
      ouro: ["atec"],
      prata: ["j26-030", "tea-checklists"],
      bronze: ["na-observacao-clinica-tea"],
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
          ouro: ["swyc-ppsc", "na-saude-mental-pre-escolar-pais"],
          prata: ["na-saude-mental-pre-escolar-pais", "na-funcoes-executivas-ampliado-pais"],
          bronze: ["eci-fraga-qdce"],
        },
      },
      {
        label: "6–12 anos · escolar",
        minMonths: 72,
        maxMonths: 144,
        tiers: {
          ouro: ["snap", "na-atencao-atividade-professor"],
          prata: ["na-funcoes-executivas-ampliado-pais", "na-perfil-emocional-comportamental-pais"],
          bronze: ["na-atencao-atividade-pais", "na-perfil-emocional-comportamental-professor"],
        },
      },
      {
        label: "12–18 anos · adolescente",
        minMonths: 144,
        maxMonths: 216,
        tiers: {
          ouro: ["snap", "na-atencao-atividade-pais"],
          prata: ["na-funcoes-executivas-ampliado-pais"],
          bronze: ["na-perfil-emocional-comportamental-adolescente"],
        },
      },
    ],
    monitoring: {
      ouro: ["snap"],
      prata: ["na-funcoes-executivas-ampliado-pais"],
      bronze: ["na-perfil-emocional-comportamental-pais", "na-saude-mental-pre-escolar-pais"],
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
          ouro: ["swyc-bpsc", "swyc-ppsc"],
          prata: ["tea-comportamentos"],
          bronze: ["orientacao-parental"],
        },
      },
      {
        label: "2–6 anos · pré-escolar",
        minMonths: 24,
        maxMonths: 72,
        tiers: {
          ouro: ["swyc-ppsc", "na-saude-mental-pre-escolar-pais"],
          prata: ["na-saude-mental-pre-escolar-pais", "na-comportamento-tea-di-pais"],
          bronze: ["na-comportamento-tea-di-pais"],
        },
      },
      {
        label: "6–18 anos · escolar/adolescente",
        minMonths: 72,
        maxMonths: 216,
        tiers: {
          ouro: ["na-perfil-emocional-comportamental-pais", "na-saude-mental-pre-escolar-pais"],
          prata: ["na-atencao-atividade-pais", "na-perfil-emocional-comportamental-professor"],
          bronze: ["na-perfil-emocional-comportamental-professor", "na-perfil-emocional-comportamental-adolescente"],
        },
      },
    ],
    monitoring: {
      ouro: ["na-perfil-emocional-comportamental-pais", "na-saude-mental-pre-escolar-pais"],
      prata: ["na-perfil-emocional-comportamental-professor"],
      bronze: ["na-comportamento-tea-di-pais"],
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
          ouro: ["swyc-ppsc", "na-saude-mental-pre-escolar-pais"],
          prata: ["na-saude-mental-pre-escolar-pais"],
          bronze: ["ems"],
        },
      },
      {
        label: "4–8 anos · escolar precoce",
        minMonths: 48,
        maxMonths: 96,
        tiers: {
          ouro: ["eai"],
          prata: ["na-perfil-emocional-comportamental-pais", "na-saude-mental-pre-escolar-pais"],
          bronze: ["easi"],
        },
      },
      {
        label: "8–12 anos · escolar",
        minMonths: 96,
        maxMonths: 144,
        tiers: {
          ouro: ["na-ansiedade-autorrelato"],
          prata: ["scas", "eai"],
          bronze: ["na-ansiedade-seguimento-pais", "eai"],
        },
      },
      {
        label: "12–18 anos · adolescente",
        minMonths: 144,
        maxMonths: 216,
        tiers: {
          ouro: ["na-ansiedade-autorrelato"],
          prata: ["gad7ped"],
          bronze: ["scas", "eai"],
        },
      },
    ],
    monitoring: {
      ouro: ["na-ansiedade-autorrelato", "na-ansiedade-seguimento-pais"],
      prata: ["eai"],
      bronze: ["na-perfil-emocional-comportamental-pais", "na-saude-mental-pre-escolar-pais"],
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
          prata: ["na-perfil-emocional-comportamental-pais", "na-saude-mental-pre-escolar-pais"],
          bronze: ["orientacao-parental"],
        },
      },
      {
        label: "7–11 anos · escolar",
        minMonths: 84,
        maxMonths: 132,
        tiers: {
          ouro: ["na-humor-crianca-autorrelato", "na-humor-depressivo-adolescente"],
          prata: ["cssrs"],
          bronze: ["na-perfil-emocional-comportamental-pais"],
        },
      },
      {
        label: "11–18 anos · adolescente",
        minMonths: 132,
        maxMonths: 216,
        tiers: {
          ouro: ["phqa"],
          prata: ["na-humor-crianca-autorrelato", "na-humor-depressivo-adolescente"],
          bronze: ["cssrs"],
        },
      },
    ],
    monitoring: {
      ouro: ["na-humor-crianca-autorrelato", "na-humor-depressivo-adolescente"],
      prata: ["phqa"],
      bronze: ["na-perfil-emocional-comportamental-pais", "na-saude-mental-pre-escolar-pais"],
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
          prata: ["cfcs"],
          bronze: ["fas-fluencia"],
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
      // 6–66 meses: o ouro é o formulário SWYC Marcos da idade (livre, Tufts), que substituiu
      // Denver II e ASQ-3 em 17/10/2026. Cada ramo segue a janela de idade do formulário.
      swycMarcosBranch("6m", 6, 9, ["j26-002"], ["j26-003"]),
      swycMarcosBranch("9m", 9, 12, ["j26-002"], ["j26-003"]),
      swycMarcosBranch("12m", 12, 15, ["emdi"], ["j26-003"]),
      swycMarcosBranch("15m", 15, 18, ["emdi"], ["j26-003"]),
      swycMarcosBranch("18m", 18, 23, ["emdi"], ["j26-003"]),
      swycMarcosBranch("24m", 23, 29, ["emdi"], ["j26-107"]),
      swycMarcosBranch("30m", 29, 35, ["emdi"], ["j26-107"]),
      swycMarcosBranch("36m", 35, 47, ["emdi"], ["j26-107"]),
      swycMarcosBranch("48m", 47, 59, ["emdi"], ["j26-107"]),
      swycMarcosBranch("60m", 59, 66, ["emdi"], ["na-comportamento-adaptativo-pais"]),
      {
        label: "5 anos e meio a 6 anos · pré-escolar",
        minMonths: 66,
        maxMonths: 72,
        tiers: {
          ouro: ["emdi"],
          prata: ["na-comportamento-adaptativo-pais"],
          bronze: ["efdi"],
        },
      },
      {
        label: "6–18 anos · escolar/adolescente",
        minMonths: 72,
        maxMonths: 216,
        tiers: {
          ouro: ["efdi"],
          prata: ["pant"],
          bronze: ["ips"],
        },
      },
    ],
    monitoring: {
      ouro: ["emdi"],
      prata: ["efdi"],
      bronze: ["j26-107"],
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
          ouro: ["pdae"],
          prata: ["j26-221"],
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
          bronze: ["efdi"],
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
          ouro: ["na-funcoes-executivas-ampliado-pais"],
          prata: ["funcoes-executivas"],
          bronze: ["memoria-teste"],
        },
      },
    ],
    monitoring: {
      ouro: ["na-funcoes-executivas-ampliado-pais"],
      prata: ["funcoes-executivas"],
      bronze: ["na-comportamento-adaptativo-pais"],
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
          prata: ["tdn-bebe"],
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
          ouro: ["j26-240"],
          prata: ["j26-242"],
          bronze: ["bfmf"],
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
          ouro: ["bisq"],
          prata: ["j26-137"],
          bronze: ["j26-136"],
        },
      },
      {
        label: "4–10 anos · escolar",
        minMonths: 48,
        maxMonths: 120,
        tiers: {
          ouro: ["na-sono-crianca-pais"],
          prata: ["bears"],
          bronze: ["j26-137", "bears"],
        },
      },
      {
        label: "10–18 anos · adolescente",
        minMonths: 120,
        maxMonths: 216,
        tiers: {
          ouro: ["ess-adol"],
          prata: ["bears", "j26-136"],
          bronze: ["bears", "j26-136"],
        },
      },
    ],
    monitoring: {
      ouro: ["na-sono-crianca-pais"],
      prata: ["bears"],
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
          ouro: ["efdi"],
          prata: ["ead-np"],
          bronze: ["pant"],
        },
      },
      {
        label: "2–18 anos · pré-escolar a adolescente",
        minMonths: 24,
        maxMonths: 216,
        tiers: {
          ouro: ["efdi"],
          prata: ["na-qualidade-vida-pais"],
          bronze: ["eaf"],
        },
      },
    ],
    monitoring: {
      ouro: ["efdi"],
      prata: ["na-qualidade-vida-pais"],
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
          prata: ["j26-216"],
          bronze: ["j26-009"],
        },
      },
      {
        label: "3–6 anos · cognição social precoce",
        minMonths: 36,
        maxMonths: 72,
        tiers: {
          ouro: ["j26-216"],
          prata: ["j26-022"],
          bronze: ["j26-217"],
        },
      },
      {
        label: "6–18 anos · escolar/adolescente",
        minMonths: 72,
        maxMonths: 216,
        tiers: {
          ouro: ["j26-022"],
          prata: ["j26-211"],
          bronze: ["j26-205"],
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
      prata: ["na-tiques-seguimento-pais"],
      bronze: [],
    },
  },

  // ═══════════════════════════════════════════════════════════
  // PARALISIA CEREBRAL — sistemas de classificação
  // GMFCS (motor grosso) + MACS (habilidade manual) + CFCS (comunicação)
  // são o trio de classificação padrão da PC; EDACS (comer/beber) entra
  // pela queixa de alimentação/disfagia. MACS abre a partir de 4 anos;
  // CFCS a partir de 2 anos — por isso os ramos mais novos usam exame
  // neurológico (HINE) e tônus (Ashworth) até essas ferramentas valerem.
  // ═══════════════════════════════════════════════════════════
  pc: {
    signal: "pc",
    label: "Paralisia Cerebral — classificação funcional",
    branches: [
      {
        label: "0–2 anos · lactente/toddler",
        minMonths: 0,
        maxMonths: 24,
        tiers: {
          ouro: ["gmfcs"],
          prata: ["hine"],
          bronze: ["ashworth", "j26-239"],
        },
      },
      {
        label: "2–4 anos · pré-escolar",
        minMonths: 24,
        maxMonths: 48,
        tiers: {
          ouro: ["gmfcs"],
          prata: ["cfcs"],
          bronze: ["ashworth", "j26-239"],
        },
      },
      {
        label: "4–18 anos · escolar/adolescente",
        minMonths: 48,
        maxMonths: 216,
        tiers: {
          ouro: ["gmfcs"],
          prata: ["macs"],
          bronze: ["cfcs", "ashworth"],
        },
      },
    ],
    monitoring: {
      ouro: ["gmfcs"],
      prata: ["macs"],
      bronze: ["cfcs"],
    },
  },

  // ═══════════════════════════════════════════════════════════
  // ALIMENTAÇÃO / DISFAGIA
  // ETARE (comportamento alimentar) na frente; EDACS classifica a
  // segurança de comer/beber quando há disfagia/base neurológica.
  // ═══════════════════════════════════════════════════════════
  alimentacao: {
    signal: "alimentacao",
    label: "Alimentação / Disfagia",
    branches: [
      {
        label: "0–2 anos · lactente",
        minMonths: 0,
        maxMonths: 24,
        tiers: {
          ouro: ["j26-146"],
          prata: ["pant-v7-067"],
          bronze: ["etare"],
        },
      },
      {
        label: "2–18 anos · pré-escolar a adolescente",
        minMonths: 24,
        maxMonths: 216,
        tiers: {
          ouro: ["etare"],
          prata: ["j26-146"],
          bronze: ["edacs", "inventarios-auto"],
        },
      },
    ],
    monitoring: {
      ouro: ["etare"],
      prata: ["edacs"],
      bronze: ["j26-146"],
    },
  },

  // ═══════════════════════════════════════════════════════════
  // NEONATAL / PREMATURIDADE
  // Triagem motora neonatal na frente; New Ballard classifica a
  // maturidade/idade gestacional no recém-nascido.
  // ═══════════════════════════════════════════════════════════
  neonatal: {
    signal: "neonatal",
    label: "Neonatal / Prematuridade",
    branches: [
      {
        label: "0–3 meses · recém-nascido",
        minMonths: 0,
        maxMonths: 3,
        tiers: {
          ouro: ["j26-001"],
          prata: ["ballard"],
          bronze: ["cries"],
        },
      },
      {
        label: "3–6 meses · lactente de risco",
        minMonths: 3,
        maxMonths: 6,
        tiers: {
          ouro: ["j26-001"],
          prata: ["ballard"],
          bronze: ["cries"],
        },
      },
      {
        label: "6–30 meses · seguimento do prematuro",
        minMonths: 6,
        maxMonths: 30,
        tiers: {
          ouro: ["hine"],
          prata: ["tdn-bebe"],
          bronze: ["j26-014"],
        },
      },
    ],
    monitoring: {
      ouro: ["hine"],
      prata: ["tdn-bebe"],
      bronze: ["j26-014"],
    },
  },

  // ═══════════════════════════════════════════════════════════
  // SENSORIAL / INTEGRAÇÃO
  // Sensory Profile 2 é a referência de padrões de processamento
  // sensorial (0–14 anos); triagens autorais autoral complementam
  // por faixa. Acima de 14 anos migra p/ autoavaliação/uso terapêutico.
  // ═══════════════════════════════════════════════════════════
  sensorial: {
    signal: "sensorial",
    label: "Sensorial / Integração",
    branches: [
      {
        label: "0–2 anos · lactente/toddler",
        minMonths: 0,
        maxMonths: 24,
        tiers: {
          ouro: ["psn-np"],
          prata: ["j26-013"],
          bronze: ["j26-014", "pant-v7-068"],
        },
      },
      {
        label: "2–14 anos · pré-escolar a escolar",
        minMonths: 24,
        maxMonths: 168,
        tiers: {
          ouro: ["psn-np"],
          prata: ["pant-v7-074"],
          bronze: ["j26-013"],
        },
      },
      {
        label: "14–18 anos · adolescente",
        minMonths: 168,
        maxMonths: 216,
        tiers: {
          ouro: ["psn-np"],
          prata: ["inventarios-auto"],
          bronze: ["pant-v7-074"],
        },
      },
    ],
    monitoring: {
      ouro: ["psn-np"],
      prata: ["pant-v7-074"],
      bronze: ["j26-013"],
    },
  },

  // ═══════════════════════════════════════════════════════════
  // DOR / CEFALEIA
  // Instrumento de dor segue o nível de desenvolvimento: RN/prematuro →
  // escalas fisiológico-comportamentais (NIPS/PIPP); pré-verbal →
  // observacional (FLACC/CHEOPS/COMFORT-B); a partir de 4a → autoavaliação
  // por faces (FPS-R/Wong-Baker); a partir de 8a → numérica (NRS). O
  // calendário de cefaleia entra quando a queixa é dor de cabeça recorrente.
  // ═══════════════════════════════════════════════════════════
  dor: {
    signal: "dor",
    label: "Dor / Cefaleia",
    branches: [
      {
        label: "0–3 meses · neonatal/procedural",
        minMonths: 0,
        maxMonths: 3,
        tiers: {
          ouro: ["flacc"],
          prata: ["comfort-b"],
          bronze: ["comfort-b", "cries"],
        },
      },
      {
        label: "3 meses–4 anos · pré-verbal (observacional)",
        minMonths: 3,
        maxMonths: 48,
        tiers: {
          ouro: ["flacc"],
          prata: ["comfort-b"],
          bronze: ["cheops"],
        },
      },
      {
        label: "4–8 anos · autoavaliação por faces",
        minMonths: 48,
        maxMonths: 96,
        tiers: {
          ouro: ["fps-r"],
          prata: ["wongbaker"],
          bronze: ["flacc", "cheops"],
        },
      },
      {
        label: "8–18 anos · autoavaliação numérica / cefaleia",
        minMonths: 96,
        maxMonths: 216,
        tiers: {
          ouro: ["nrs-pain"],
          prata: ["cefaleia-calendario"],
          bronze: ["fps-r"],
        },
      },
    ],
    monitoring: {
      ouro: ["nrs-pain"],
      prata: ["cefaleia-calendario"],
      bronze: ["flacc"],
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
