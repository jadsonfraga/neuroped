/**
 * Registro das tarefas do Cognitive Lab com RUNNER PRÓPRIO (interações que o
 * runner estímulo-resposta não cobre: entrada de sequência, tabuleiro
 * espacial, alvos tocáveis, encaixe de discos). Metadados para o hub; o
 * componente é resolvido em pages/cognitive-task.tsx.
 */
export interface CustomTaskMeta {
  id: string;
  name: string;
  emoji: string;
  domain: string;
  ageLabel: string;
  durationLabel: string;
  description: string;
  formatLabel: string;
}

export const customCognitiveTasks: CustomTaskMeta[] = [
  {
    id: "digit-span",
    name: "Span de Dígitos",
    emoji: "🔢",
    domain: "Memória de curto prazo e de trabalho (verbal)",
    ageLabel: "6–17 anos",
    durationLabel: "≈5 min",
    description:
      "Guarde a sequência de números e digite na mesma ordem; depois, de trás pra frente. Span direto e inverso, adaptativo.",
    formatLabel: "adaptativo 2→9",
  },
  {
    id: "corsi-block",
    name: "Corsi Block",
    emoji: "🟪",
    domain: "Memória de curto prazo visuoespacial",
    ageLabel: "5–17 anos",
    durationLabel: "≈4 min",
    description:
      "Os blocos acendem em sequência no tabuleiro clássico de 9 posições; toque na mesma ordem. Span espacial adaptativo.",
    formatLabel: "adaptativo 2→9",
  },
  {
    id: "trail-making",
    name: "Trilhas (A e B)",
    emoji: "🔗",
    domain: "Velocidade visuomotora e alternância",
    ageLabel: "8–17 anos",
    durationLabel: "≈5 min",
    description:
      "Ligue os alvos na ordem: parte A só números (1→2→3…); parte B alternando número e letra (1→A→2→B…). Tempos, erros e razão B/A.",
    formatLabel: "2 partes",
  },
  {
    id: "busca-visual",
    name: "Busca Visual",
    emoji: "🔎",
    domain: "Atenção seletiva visual (varredura)",
    ageLabel: "5–17 anos",
    durationLabel: "≈4 min",
    description:
      "Encontre a borboleta escondida entre as abelhas o mais rápido possível. Compara telas com 12 e 24 itens (custo por item).",
    formatLabel: "16 telas",
  },
  {
    id: "torre-np",
    name: "Torre NeuroPed",
    emoji: "🗼",
    domain: "Planejamento e resolução de problemas",
    ageLabel: "6–17 anos",
    durationLabel: "≈6 min",
    description:
      "Mova os discos entre os pinos para copiar o modelo no menor número de movimentos. Mede latência de planejamento e excesso de movimentos.",
    formatLabel: "5 problemas",
  },
];
