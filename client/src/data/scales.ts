// M-CHAT-R/F — Modified Checklist for Autism in Toddlers (16-30 meses)
export { mchatQuestions, mchatCriticalItems, mchatReversedItems, classifyMchat } from "./mchat";
export { carsCategories, classifyCars } from "./cars";

export const snapQuestions = [
  // Desatenção (1-9)
  "Não consegue prestar muita atenção a detalhes ou comete erros por descuido nos trabalhos escolares ou tarefas",
  "Tem dificuldade de manter a atenção em tarefas ou atividades lúdicas",
  "Parece não estar ouvindo quando se fala diretamente com ele",
  "Não segue instruções até o fim e não termina seus deveres de escola, tarefas ou obrigações",
  "Tem dificuldade para organizar tarefas e atividades",
  "Evita, não gosta ou reluta em se envolver em tarefas que exijam esforço mental prolongado",
  "Perde coisas necessárias para tarefas ou atividades (brinquedos, deveres, lápis, livros)",
  "Distrai-se com estímulos externos",
  "É esquecido em atividades do dia a dia",
  // Hiperatividade/Impulsividade (10-18)
  "Mexe com as mãos ou os pés ou se remexe na cadeira",
  "Sai do lugar na sala de aula ou em outras situações em que se espera que fique sentado",
  "Corre de um lado para outro ou sobe demais nas coisas em situações em que isto é inapropriado",
  "Tem dificuldade em brincar ou envolver-se em atividades de lazer de forma calma",
  "Não para ou frequentemente está a mil por hora",
  "Fala em excesso",
  "Responde as perguntas de forma precipitada antes delas serem concluídas",
  "Tem dificuldade de esperar sua vez",
  "Interrompe os outros ou se intromete (em conversas ou jogos)"
];

export const snapLabels = ["Nem um pouco", "Só um pouco", "Bastante", "Demais"];

export function classifySnap(inattention: number, hyperactivity: number): {
  inattentionResult: string;
  hyperactivityResult: string;
  combinedResult: string;
  description: string;
  color: string;
} {
  const inattentionAvg = inattention / 9;
  const hyperactivityAvg = hyperactivity / 9;

  const inattentionResult = inattentionAvg >= 1.5
    ? "Positivo para Desatenção"
    : "Sem indicativo de Desatenção";

  const hyperactivityResult = hyperactivityAvg >= 1.5
    ? "Positivo para Hiperatividade/Impulsividade"
    : "Sem indicativo de Hiperatividade/Impulsividade";

  let combinedResult: string;
  let description: string;
  let color: string;

  if (inattentionAvg >= 1.5 && hyperactivityAvg >= 1.5) {
    combinedResult = "Apresentação Combinada";
    description = "Os resultados sugerem comportamentos compatíveis com TDAH apresentação combinada (desatenção + hiperatividade/impulsividade). Recomenda-se avaliação clínica especializada.";
    color = "text-red-600 dark:text-red-400";
  } else if (inattentionAvg >= 1.5) {
    combinedResult = "Predominantemente Desatento";
    description = "Os resultados sugerem comportamentos compatíveis com TDAH com predomínio de desatenção. Recomenda-se avaliação clínica especializada.";
    color = "text-amber-600 dark:text-amber-400";
  } else if (hyperactivityAvg >= 1.5) {
    combinedResult = "Predominantemente Hiperativo/Impulsivo";
    description = "Os resultados sugerem comportamentos compatíveis com TDAH com predomínio de hiperatividade/impulsividade. Recomenda-se avaliação clínica especializada.";
    color = "text-amber-600 dark:text-amber-400";
  } else {
    combinedResult = "Sem indicativos de TDAH";
    description = "Os resultados não indicam comportamentos significativos de TDAH. Continuar o acompanhamento de rotina.";
    color = "text-emerald-600 dark:text-emerald-400";
  }

  return { inattentionResult, hyperactivityResult, combinedResult, description, color };
}

// Denver II — Marcos do Desenvolvimento (0 a 6 anos)
export interface DenverMilestone {
  id: string;
  area: "motor-grosso" | "motor-fino" | "linguagem" | "pessoal-social";
  description: string;
  ageRange: string;
  ageMonths: [number, number]; // [min, max] em meses
}

export const denverMilestones: DenverMilestone[] = [
  // Motor Grosso
  { id: "mg1", area: "motor-grosso", description: "Levanta a cabeça em prono (bruços)", ageRange: "0-3 meses", ageMonths: [0, 3] },
  { id: "mg2", area: "motor-grosso", description: "Sustenta a cabeça sentado", ageRange: "1-4 meses", ageMonths: [1, 4] },
  { id: "mg3", area: "motor-grosso", description: "Rola (vira de barriga para baixo/cima)", ageRange: "2-5 meses", ageMonths: [2, 5] },
  { id: "mg4", area: "motor-grosso", description: "Senta sem apoio", ageRange: "5-8 meses", ageMonths: [5, 8] },
  { id: "mg5", area: "motor-grosso", description: "Fica de pé com apoio", ageRange: "5-10 meses", ageMonths: [5, 10] },
  { id: "mg6", area: "motor-grosso", description: "Puxa-se para ficar de pé", ageRange: "6-10 meses", ageMonths: [6, 10] },
  { id: "mg7", area: "motor-grosso", description: "Anda com apoio (de mão)", ageRange: "7-13 meses", ageMonths: [7, 13] },
  { id: "mg8", area: "motor-grosso", description: "Fica de pé sozinho", ageRange: "9-14 meses", ageMonths: [9, 14] },
  { id: "mg9", area: "motor-grosso", description: "Anda sozinho", ageRange: "11-15 meses", ageMonths: [11, 15] },
  { id: "mg10", area: "motor-grosso", description: "Anda para trás", ageRange: "12-22 meses", ageMonths: [12, 22] },
  { id: "mg11", area: "motor-grosso", description: "Sobe escadas com apoio", ageRange: "14-22 meses", ageMonths: [14, 22] },
  { id: "mg12", area: "motor-grosso", description: "Chuta bola para frente", ageRange: "15-24 meses", ageMonths: [15, 24] },
  { id: "mg13", area: "motor-grosso", description: "Pula com os dois pés", ageRange: "22-36 meses", ageMonths: [22, 36] },
  { id: "mg14", area: "motor-grosso", description: "Equilibra-se em um pé (1-2s)", ageRange: "30-44 meses", ageMonths: [30, 44] },
  { id: "mg15", area: "motor-grosso", description: "Pedala triciclo", ageRange: "24-36 meses", ageMonths: [24, 36] },

  // Motor Fino-Adaptativo
  { id: "mf1", area: "motor-fino", description: "Acompanha objeto até a linha média", ageRange: "0-3 meses", ageMonths: [0, 3] },
  { id: "mf2", area: "motor-fino", description: "Segura objeto (preensão palmar)", ageRange: "2-4 meses", ageMonths: [2, 4] },
  { id: "mf3", area: "motor-fino", description: "Alcança objetos", ageRange: "3-5 meses", ageMonths: [3, 5] },
  { id: "mf4", area: "motor-fino", description: "Transfere objetos de uma mão para outra", ageRange: "4-8 meses", ageMonths: [4, 8] },
  { id: "mf5", area: "motor-fino", description: "Preensão em pinça (polegar-indicador)", ageRange: "7-12 meses", ageMonths: [7, 12] },
  { id: "mf6", area: "motor-fino", description: "Bate dois cubos (um contra o outro)", ageRange: "7-12 meses", ageMonths: [7, 12] },
  { id: "mf7", area: "motor-fino", description: "Coloca cubos em recipiente", ageRange: "10-14 meses", ageMonths: [10, 14] },
  { id: "mf8", area: "motor-fino", description: "Torre de 2 cubos", ageRange: "13-21 meses", ageMonths: [13, 21] },
  { id: "mf9", area: "motor-fino", description: "Torre de 4 cubos", ageRange: "16-24 meses", ageMonths: [16, 24] },
  { id: "mf10", area: "motor-fino", description: "Torre de 6 cubos", ageRange: "20-30 meses", ageMonths: [20, 30] },
  { id: "mf11", area: "motor-fino", description: "Copia linha vertical", ageRange: "22-36 meses", ageMonths: [22, 36] },
  { id: "mf12", area: "motor-fino", description: "Copia círculo", ageRange: "30-48 meses", ageMonths: [30, 48] },

  // Linguagem
  { id: "l1", area: "linguagem", description: "Responde a som (vira a cabeça)", ageRange: "0-3 meses", ageMonths: [0, 3] },
  { id: "l2", area: "linguagem", description: "Vocaliza (aaah, ooooh)", ageRange: "1-5 meses", ageMonths: [1, 5] },
  { id: "l3", area: "linguagem", description: "Ri alto (gargalhada)", ageRange: "1-4 meses", ageMonths: [1, 4] },
  { id: "l4", area: "linguagem", description: "Balbucio (baba, dada, mama)", ageRange: "4-8 meses", ageMonths: [4, 8] },
  { id: "l5", area: "linguagem", description: "Imita sons de fala", ageRange: "5-10 meses", ageMonths: [5, 10] },
  { id: "l6", area: "linguagem", description: "Diz papa/mama (específico)", ageRange: "8-15 meses", ageMonths: [8, 15] },
  { id: "l7", area: "linguagem", description: "Fala 3 palavras além de papa/mama", ageRange: "12-21 meses", ageMonths: [12, 21] },
  { id: "l8", area: "linguagem", description: "Aponta partes do corpo", ageRange: "15-24 meses", ageMonths: [15, 24] },
  { id: "l9", area: "linguagem", description: "Combina 2 palavras (frase)", ageRange: "14-24 meses", ageMonths: [14, 24] },
  { id: "l10", area: "linguagem", description: "Fala metade inteligível para estranhos", ageRange: "18-30 meses", ageMonths: [18, 30] },
  { id: "l11", area: "linguagem", description: "Conhece 2 ações (mostra verbos)", ageRange: "15-28 meses", ageMonths: [15, 28] },
  { id: "l12", area: "linguagem", description: "Nomeia 4 figuras", ageRange: "22-36 meses", ageMonths: [22, 36] },

  // Pessoal-Social
  { id: "ps1", area: "pessoal-social", description: "Olha rosto do examinador", ageRange: "0-2 meses", ageMonths: [0, 2] },
  { id: "ps2", area: "pessoal-social", description: "Sorri espontaneamente", ageRange: "1-3 meses", ageMonths: [1, 3] },
  { id: "ps3", area: "pessoal-social", description: "Sorri em resposta (sorriso social)", ageRange: "1-3 meses", ageMonths: [1, 3] },
  { id: "ps4", area: "pessoal-social", description: "Olha as próprias mãos", ageRange: "2-4 meses", ageMonths: [2, 4] },
  { id: "ps5", area: "pessoal-social", description: "Alimenta-se sozinho (biscoito)", ageRange: "4-8 meses", ageMonths: [4, 8] },
  { id: "ps6", area: "pessoal-social", description: "Acena 'tchau'", ageRange: "7-14 meses", ageMonths: [7, 14] },
  { id: "ps7", area: "pessoal-social", description: "Brinca de 'esconder e achar'", ageRange: "5-12 meses", ageMonths: [5, 12] },
  { id: "ps8", area: "pessoal-social", description: "Imita atividades domésticas", ageRange: "12-20 meses", ageMonths: [12, 20] },
  { id: "ps9", area: "pessoal-social", description: "Bebe de copo", ageRange: "10-17 meses", ageMonths: [10, 17] },
  { id: "ps10", area: "pessoal-social", description: "Usa colher/garfo", ageRange: "13-22 meses", ageMonths: [13, 22] },
  { id: "ps11", area: "pessoal-social", description: "Tira roupas (peça fácil)", ageRange: "15-24 meses", ageMonths: [15, 24] },
  { id: "ps12", area: "pessoal-social", description: "Lava e seca as mãos", ageRange: "20-36 meses", ageMonths: [20, 36] },
];

export const denverAreaLabels: Record<string, { name: string; color: string; bg: string }> = {
  "motor-grosso": { name: "Motor Grosso", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/40" },
  "motor-fino": { name: "Motor Fino-Adaptativo", color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-100 dark:bg-purple-900/40" },
  "linguagem": { name: "Linguagem", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-900/40" },
  "pessoal-social": { name: "Pessoal-Social", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/40" },
};
