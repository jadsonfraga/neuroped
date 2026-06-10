// Sistema de Recomendação Inteligente de Baterias
// Sugere combinação de 3-4 escalas complementares para diagnóstico/monitorização

import { ScaleEntry } from "./scaleFilter";

export interface BatteryRecommendation {
  id: string;
  name: string;
  description: string;
  indication: string;
  estimatedTime: string;
  estimatedCost: "baixo" | "médio" | "alto";
  scales: BatteryScale[];
  rationale: string;
  nextSteps: string[];
  warnings?: string[];
}

export interface BatteryScale {
  scaleId: string;
  scaleName: string;
  role: "screening" | "diagnosis" | "monitoring" | "complementary";
  purpose: string;
  estimatedTime: string;
}

export const batteryRecommendations: Record<string, BatteryRecommendation> = {
  // ===== TEA / AUTISMO =====
  "tea-comprehensive": {
    id: "tea-comprehensive",
    name: "Bateria TEA Completa (Triagem + Diagnóstico)",
    description: "Triagem inicial + Diagnóstico + Funcionalidade",
    indication: "Suspeita de Autismo/TEA com avaliação completa",
    estimatedTime: "4-6 horas (divididas em 2-3 sessões)",
    estimatedCost: "alto",
    scales: [
      {
        scaleId: "mchat",
        scaleName: "M-CHAT-R/F",
        role: "screening",
        purpose: "Rastreio inicial de sinais de TEA (16-30 meses)",
        estimatedTime: "5 min"
      },
      {
        scaleId: "ados2",
        scaleName: "ADOS-2",
        role: "diagnosis",
        purpose: "Diagnóstico padrão-ouro de TEA (observação direta)",
        estimatedTime: "60 min"
      },
      {
        scaleId: "vineland",
        scaleName: "Vineland-II",
        role: "complementary",
        purpose: "Avalia adaptação funcional (comportamentos adaptativos)",
        estimatedTime: "60-90 min"
      },
      {
        scaleId: "catclams",
        scaleName: "CAT/CLAMS",
        role: "monitoring",
        purpose: "Avalia marcos cognitivos e linguísticos",
        estimatedTime: "15 min"
      }
    ],
    rationale:
      "Combinação validada internacionalmente: M-CHAT para triagem rápida, ADOS-2 para diagnóstico direto, Vineland para funcionalidade, CAT/CLAMS para desenvolvimento. Essencial para diagnóstico diferencial com atraso global.",
    nextSteps: [
      "1. Aplicar M-CHAT em triagem (5 min) - se positivo, prosseguir",
      "2. Se M-CHAT positivo: agendar ADOS-2 (60 min)",
      "3. Avaliar funcionalidade paralela com Vineland",
      "4. Reavaliação a cada 6 meses (CAT/CLAMS + observação clínica)",
      "5. Encaminhar para acompanhamento de desenvolvimento se confirmado"
    ],
    warnings: [
      "⚠️ ADOS-2 requer treinamento específico",
      "⚠️ M-CHAT pode ter falsos positivos em atraso global",
      "⚠️ Considerar avaliação fonoaudiológica complementar"
    ]
  },

  // ===== TDAH =====
  "tdah-comprehensive": {
    id: "tdah-comprehensive",
    name: "Bateria TDAH Completa (Triagem + Função Executiva)",
    description: "Triagem comportamental + Função executiva + Contexto escolar",
    indication: "Suspeita de TDAH com avaliação de comorbidades e desempenho",
    estimatedTime: "2-3 horas (divididas em 2 sessões)",
    estimatedCost: "médio",
    scales: [
      {
        scaleId: "snap",
        scaleName: "SNAP-IV",
        role: "screening",
        purpose: "Rastreio TDAH com critérios DSM-5 (pais/professor)",
        estimatedTime: "10 min"
      },
      {
        scaleId: "brief2",
        scaleName: "BRIEF-2",
        role: "complementary",
        purpose: "Avalia função executiva (inibição, flexibilidade, controle emocional)",
        estimatedTime: "15 min"
      },
      {
        scaleId: "sdq",
        scaleName: "SDQ",
        role: "complementary",
        purpose: "Rastreio de comorbidades (comportamento, emoção, escola)",
        estimatedTime: "10 min"
      },
      {
        scaleId: "conners3",
        scaleName: "Conners 3",
        role: "monitoring",
        purpose: "Reavaliação de sintomas TDAH ao longo do tempo",
        estimatedTime: "15 min"
      }
    ],
    rationale:
      "SNAP-IV é ouro para triagem (sensibilidade 90%), BRIEF-2 complementa avaliando dificuldades executivas não comportamentais (comum em TDAH), SDQ detecta comorbidades, Conners para monitorização longitudinal.",
    nextSteps: [
      "1. Preencher SNAP-IV com pais E professor (compare respostas)",
      "2. Se SNAP positivo em 2+ domínios: prosseguir",
      "3. Aplicar BRIEF-2 (avalia inibição/flexibilidade prejudicadas)",
      "4. Usar SDQ para descartar comorbidade (comportamento, emoção)",
      "5. Conners a cada 3-6 meses para monitorar resposta medicamentosa"
    ],
    warnings: [
      "⚠️ SNAP pode ser positivo em comportamento primário sem TDAH",
      "⚠️ BRIEF-2 pode estar alterado em ansiedade também",
      "⚠️ Discordância pais/professor pode indicar contexto-dependência"
    ]
  },

  // ===== ATRASO GLOBAL =====
  "atraso-diagnostico": {
    id: "atraso-diagnostico",
    name: "Bateria Atraso do Desenvolvimento (Diagnóstico Completo)",
    description: "Diagnóstico de atraso global com avaliação de cada domínio",
    indication: "Bebê/criança pequena com suspeita de atraso global",
    estimatedTime: "3-4 horas (divididas em 2 sessões)",
    estimatedCost: "alto",
    scales: [
      {
        scaleId: "bayley",
        scaleName: "Bayley-III",
        role: "diagnosis",
        purpose: "Padrão-ouro para diagnóstico de atraso em lactentes (<3a)",
        estimatedTime: "60-90 min"
      },
      {
        scaleId: "griffiths",
        scaleName: "Griffiths III",
        role: "complementary",
        purpose: "Avalia 5 domínios (aprendizagem, linguagem, olho-mão, social, motor)",
        estimatedTime: "45-60 min"
      },
      {
        scaleId: "denver",
        scaleName: "Denver II",
        role: "screening",
        purpose: "Triagem rápida de marcos (se atraso confirmado)",
        estimatedTime: "15-20 min"
      },
      {
        scaleId: "vineland",
        scaleName: "Vineland-II",
        role: "monitoring",
        purpose: "Avalia habilidades adaptativas (AVD independência)",
        estimatedTime: "45 min"
      }
    ],
    rationale:
      "Bayley-III é ouro diagnóstico (sensibilidade 93%), Griffiths complementa com visão holística 5 domínios, Denver descarta/confirma se atraso leve, Vineland mostra impacto funcional real.",
    nextSteps: [
      "1. Bayley-III é MANDATÓRIO para diagnóstico formalmente",
      "2. Griffiths ou Denver complementam dependendo disponibilidade",
      "3. Vineland para planejar intervenção baseada em funcionalidade",
      "4. Se Bayley confirma atraso: encaminhar para intervenção (PT, OT, FGA)",
      "5. Reavaliação Bayley a cada 6-12 meses para monitorar progresso"
    ],
    warnings: [
      "⚠️ Bayley-III requer espaço tranquilo e criança descansada",
      "⚠️ Atraso motor não implica atraso cognitivo (avaliar separadamente)",
      "⚠️ Prematuridade: corrigir idade até 2-3 anos"
    ]
  },

  // ===== ANSIEDADE / DEPRESSÃO =====
  "ansiedade-depressao": {
    id: "ansiedade-depressao",
    name: "Bateria Ansiedade + Depressão (Comorbidade)",
    description: "Avaliação de sintomas ansiosos e depressivos com diferenciação",
    indication: "Adolescente/criança com possível transtorno de ansiedade e/ou depressão",
    estimatedTime: "1-2 horas",
    estimatedCost: "baixo",
    scales: [
      {
        scaleId: "rcads",
        scaleName: "RCADS",
        role: "diagnosis",
        purpose: "Diagnóstico de ansiedade + depressão (diferencia comorbidade)",
        estimatedTime: "15 min"
      },
      {
        scaleId: "scared",
        scaleName: "SCARED",
        role: "complementary",
        purpose: "Detalhamento específico de transtornos de ansiedade",
        estimatedTime: "10 min"
      },
      {
        scaleId: "phq9",
        scaleName: "PHQ-9 (ou MFQ)",
        role: "complementary",
        purpose: "Rastreio de depressão com avaliação de risco suicida",
        estimatedTime: "5 min"
      },
      {
        scaleId: "columbia",
        scaleName: "Columbia Suicide Risk Scale",
        role: "monitoring",
        purpose: "Avaliação de risco iminente (se PHQ sugere depressão moderada)",
        estimatedTime: "10 min"
      }
    ],
    rationale:
      "RCADS detecta padrão ansiedade+depressão comórbida (não separa como outros), SCARED para ansiedade específica, PHQ-9 para depressão, Columbia para risco iminente (MANDATÓRIO se depressão confirmada).",
    nextSteps: [
      "1. RCADS inicial (diferencia melhor que escalas isoladas)",
      "2. Se ambas presentes: SCARED + PHQ-9 para especificidade",
      "3. SE PHQ-9 ≥15 (depressão moderada+): APLICAR COLUMBIA OBRIGATORIAMENTE",
      "4. Se risco iminente: encaminhar urgente (psiquiatria/emergência)",
      "5. Reavaliação mensal RCADS ou PHQ-9 se em tratamento"
    ],
    warnings: [
      "⚠️ RCADS é melhor que SCARED sozinha para comorbidade",
      "⚠️ COLUMBIA é MANDATÓRIA em depressão moderada/grave",
      "⚠️ Adolescente pode minimizar depressão (validar com pais)",
      "⚠️ Se ideação suicida: comunicar responsável imediatamente"
    ]
  },

  // ===== COMPORTAMENTO DISRUPTIVO =====
  "comportamento-disruptivo": {
    id: "comportamento-disruptivo",
    name: "Bateria Comportamento Disruptivo (Contexto Múltiplo)",
    description: "Avaliação comportamental em casa, escola e clínica",
    indication: "Criança com problemas comportamentais externalizantes",
    estimatedTime: "1.5-2 horas",
    estimatedCost: "médio",
    scales: [
      {
        scaleId: "cbcl",
        scaleName: "CBCL (Child Behavior Checklist)",
        role: "diagnosis",
        purpose: "Padrão-ouro para psicopatologia infantil (pais + auto-relato)",
        estimatedTime: "20 min"
      },
      {
        scaleId: "sdq",
        scaleName: "SDQ (versão professor)",
        role: "complementary",
        purpose: "Comparar comportamento em contexto escolar",
        estimatedTime: "10 min"
      },
      {
        scaleId: "conners",
        scaleName: "Conners (versão comportamento)",
        role: "complementary",
        purpose: "Detalhe de impulsividade/hiperatividade se presente",
        estimatedTime: "10 min"
      },
      {
        scaleId: "snap",
        scaleName: "SNAP-IV",
        role: "screening",
        purpose: "Descartar TDAH como causa primária",
        estimatedTime: "10 min"
      }
    ],
    rationale:
      "CBCL é ouro para psicopatologia (100+ itens, sensível a padrões), SDQ professor detecta se contexto-dependência, Conners complementa se hiperatividade suspeita, SNAP descarta TDAH primário.",
    nextSteps: [
      "1. CBCL com pais (visão geral psicopatologia)",
      "2. SDQ com professor (validar se contexto-dependência)",
      "3. SNAP-IV (descartar TDAH como causa primária)",
      "4. Se SNAP negativo + comportamento positivo = 'comportamento primário'",
      "5. Encaminhar para terapia comportamental/familiar"
    ],
    warnings: [
      "⚠️ Discordância CBCL/SDQ pode indicar manejo diferente por contexto",
      "⚠️ CBCL pode estar elevado em ansiedade também",
      "⚠️ Descartar trauma/abuso se comportamento abrupto"
    ]
  }
};

export function getBatteryForPattern(pattern: string): BatteryRecommendation | null {
  const patternToBattery: Record<string, string> = {
    // TEA patterns
    "tea-social-comportamento-linguagem": "tea-comprehensive",
    "tea-atraso": "tea-comprehensive",

    // TDAH patterns
    "tdah-comportamento": "tdah-comprehensive",
    "tdah-cognicao": "tdah-comprehensive",

    // Atraso patterns
    "atraso-linguagem-motor": "atraso-diagnostico",
    "atraso-desenvolvimento": "atraso-diagnostico",

    // Ansiedade/Depressão patterns
    "ansiedade-depressao": "ansiedade-depressao",
    "ansiedade": "ansiedade-depressao",
    "depressao": "ansiedade-depressao",

    // Comportamento patterns
    "comportamento": "comportamento-disruptivo",
    "comportamento-aprendizagem": "comportamento-disruptivo"
  };

  const batteryId = patternToBattery[pattern];
  return batteryId ? batteryRecommendations[batteryId] : null;
}

export function getAllBatteries(): BatteryRecommendation[] {
  return Object.values(batteryRecommendations);
}

export function getBatteryById(id: string): BatteryRecommendation | undefined {
  return batteryRecommendations[id];
}

export function estimateBatteryTime(scales: string[]): string {
  const times = scales
    .map(id => {
      // Parse estimated time to minutes
      const match = id.match(/(\d+)-(\d+)/);
      return match ? (parseInt(match[1]) + parseInt(match[2])) / 2 : 30;
    })
    .reduce((a, b) => a + b, 0);

  if (times < 60) return `${Math.round(times)} min`;
  if (times < 180) return `${(times / 60).toFixed(1)}h`;
  return `${(times / 60).toFixed(1)}h (${Math.ceil(times / 60)} sessões)`;
}

export function estimateBatteryCost(cost: "baixo" | "médio" | "alto"): string {
  const costs = {
    baixo: "R$ 50-150",
    médio: "R$ 150-400",
    alto: "R$ 400-1000+"
  };
  return costs[cost];
}
