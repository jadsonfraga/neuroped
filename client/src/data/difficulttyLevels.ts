// Níveis de Dificuldade para Testes de Reconhecimento (RQ-01 e RQ-02)
// Mapeamento: 6 níveis de dificuldade para faixas etárias 0-18 anos

export type DifficultyLevel = "nivel1" | "nivel2" | "nivel3" | "nivel4" | "nivel5" | "nivel6";

export interface DifficultyLevelConfig {
  id: DifficultyLevel;
  level: number;
  label: string;
  description: string;
  ageMin: number;    // meses
  ageMax: number;    // meses
  ageRangeLabel: string;
  characteristics: string[];
}

export const difficultyLevels: DifficultyLevelConfig[] = [
  {
    id: "nivel1",
    level: 1,
    label: "Nível 1 - Muito Simples",
    description: "Reconhecimento com estímulos muito contrastantes e claros, sem distrações",
    ageMin: 0,
    ageMax: 23,      // 0-2 anos
    ageRangeLabel: "0-2 anos",
    characteristics: [
      "Figuras grandes (mínimo 8cm) com cores primárias contrastantes",
      "Fundo branco ou neutro, sem elementos distratores",
      "Máximo 2-3 opções de resposta",
      "Tempo de apresentação: ilimitado",
      "Resposta por apontamento ou não-verbal"
    ]
  },
  {
    id: "nivel2",
    level: 2,
    label: "Nível 2 - Simples",
    description: "Reconhecimento com estímulos claros, com algumas variações de cor/forma",
    ageMin: 24,
    ageMax: 47,      // 3-5 anos
    ageRangeLabel: "3-5 anos",
    characteristics: [
      "Figuras grandes (mínimo 6cm) com cores variadas",
      "Fundo com padrão leve, mínimas distrações",
      "Máximo 4 opções de resposta",
      "Tempo de apresentação: 5-10 segundos",
      "Resposta por apontamento ou verbalmente"
    ]
  },
  {
    id: "nivel3",
    level: 3,
    label: "Nível 3 - Moderado",
    description: "Reconhecimento com estímulos em tamanhos variados e detalhes simples",
    ageMin: 48,
    ageMax: 71,      // 6-8 anos
    ageRangeLabel: "6-8 anos",
    characteristics: [
      "Figuras médias (4-6cm) com detalhes simples",
      "Fundo com padrão moderado, elementos leves de contexto",
      "Máximo 5 opções de resposta",
      "Tempo de apresentação: 3-5 segundos",
      "Resposta verbal ou por apontamento"
    ]
  },
  {
    id: "nivel4",
    level: 4,
    label: "Nível 4 - Intermediário",
    description: "Reconhecimento com estímulos em escala reduzida e detalhes mais finos",
    ageMin: 72,
    ageMax: 107,     // 9-11 anos
    ageRangeLabel: "9-11 anos",
    characteristics: [
      "Figuras pequenas-médias (3-4cm) com detalhes visuais",
      "Fundo contextualizado com elementos de suporte visual",
      "Máximo 6 opções de resposta",
      "Tempo de apresentação: 2-3 segundos",
      "Resposta verbal preferida"
    ]
  },
  {
    id: "nivel5",
    level: 5,
    label: "Nível 5 - Avançado",
    description: "Reconhecimento com estímulos pequenos, detalhes complexos e abstrações",
    ageMin: 108,
    ageMax: 143,     // 12-14 anos
    ageRangeLabel: "12-14 anos",
    characteristics: [
      "Figuras pequenas (2-3cm) com detalhes complexos",
      "Fundo elaborado com contexto realista",
      "Máximo 7-8 opções de resposta",
      "Tempo de apresentação: 1-2 segundos",
      "Resposta verbal, com tempo limitado"
    ]
  },
  {
    id: "nivel6",
    level: 6,
    label: "Nível 6 - Muito Avançado",
    description: "Reconhecimento com estímulos mínimos, detalhes finos e estímulos abstratos",
    ageMin: 144,
    ageMax: 215,     // 15-18 anos
    ageRangeLabel: "15-18 anos",
    characteristics: [
      "Figuras muito pequenas (<2cm) com detalhes minuciosos",
      "Fundo realista e potencialmente perturbador",
      "Até 10 opções de resposta",
      "Tempo de apresentação: <1 segundo ou sob condições de stress",
      "Resposta verbal, tempo rigorosamente controlado"
    ]
  }
];

export function getDifficultyLevelByAge(ageInMonths: number): DifficultyLevel {
  const config = difficultyLevels.find(d => ageInMonths >= d.ageMin && ageInMonths <= d.ageMax);
  return config?.id || "nivel1";
}

export function getDifficultyLevelConfig(level: DifficultyLevel): DifficultyLevelConfig | undefined {
  return difficultyLevels.find(d => d.id === level);
}

export function getDifficultyLevelsByAge(ageInMonths: number): DifficultyLevelConfig[] {
  const currentLevel = getDifficultyLevelByAge(ageInMonths);
  const currentLevelNumber = difficultyLevels.find(d => d.id === currentLevel)?.level || 1;

  // Retorna o nível apropriado para a idade
  return difficultyLevels.filter(d => d.level === currentLevelNumber);
}

export function getAgeRangeForDifficulty(level: DifficultyLevel): { min: number; max: number } {
  const config = getDifficultyLevelConfig(level);
  return config ? { min: config.ageMin, max: config.ageMax } : { min: 0, max: 215 };
}
