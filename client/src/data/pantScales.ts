// ============================================================
// PANT — 100 Escalas Passivas de Neurodesenvolvimento
// Régua 0-4: Ausente → Espontâneo e Generalizado
// 5 Macrodomínios, 20 escalas cada
// ============================================================

export interface PantLevel {
  level: number;
  label: string;
  anchor: string;
  phrase: string;
}

export interface PantScale {
  number: number;
  name: string;
  domain: number;
  levels: PantLevel[];
}

export interface PantDomain {
  id: number;
  name: string;
  short: string;
  description: string;
  color: string;
}

export const pantDomains: PantDomain[] = [
  { id: 1, name: "Comunicação Social e Reciprocidade", short: "Comunicação Social", description: "Reciprocidade, atenção compartilhada, imitação, jogo social e leitura relacional.", color: "pink" },
  { id: 2, name: "Linguagem Funcional, Pragmática e Simbolização", short: "Linguagem", description: "Intenção comunicativa, gestos, compreensão, linguagem oral, narrativa e reparo comunicativo.", color: "violet" },
  { id: 3, name: "Atenção, Flexibilidade e Função Executiva", short: "Função Executiva", description: "Sustentação atencional, inibição, flexibilidade, memória operacional, tarefa escolar e transições.", color: "amber" },
  { id: 4, name: "Modulação Sensorial, Praxia e Autonomia", short: "Sensorial e Praxia", description: "Processamento sensorial, motricidade, praxia, oralidade, AVDs, sono e ritmo biológico.", color: "teal" },
  { id: 5, name: "Regulação Emocional, Risco e Ecologia", short: "Regulação Emocional", description: "Humor, irritabilidade, risco, crises, suporte, previsibilidade, permanência escolar e prognóstico.", color: "rose" },
];

export const pantLevelLabels = ["Ausente", "Muito frágil", "Inconsistente", "Funcional parcial", "Espontâneo e generalizado"];

export const pantLevelColors = [
  "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
];

export const pantScales: PantScale[] = [
  {
    number: 1,
    name: "Atenção compartilhada espontânea",
    domain: 1,
    levels: [
      { level: 0, label: "ausente", anchor: "Atenção compartilhada espontânea não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Atenção compartilhada espontânea aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Atenção compartilhada espontânea surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Atenção compartilhada espontânea já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Atenção compartilhada espontânea está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 2,
    name: "Atenção compartilhada responsiva",
    domain: 1,
    levels: [
      { level: 0, label: "ausente", anchor: "Atenção compartilhada responsiva não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Atenção compartilhada responsiva aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Atenção compartilhada responsiva surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Atenção compartilhada responsiva já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Atenção compartilhada responsiva está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 3,
    name: "Mostra social de objetos",
    domain: 1,
    levels: [
      { level: 0, label: "ausente", anchor: "Mostra social de objetos não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Mostra social de objetos aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Mostra social de objetos surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Mostra social de objetos já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Mostra social de objetos está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 4,
    name: "Procura do outro para validação",
    domain: 1,
    levels: [
      { level: 0, label: "ausente", anchor: "Procura do outro para validação não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Procura do outro para validação aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Procura do outro para validação surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Procura do outro para validação já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Procura do outro para validação está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 5,
    name: "Uso social do sorriso",
    domain: 1,
    levels: [
      { level: 0, label: "ausente", anchor: "Uso social do sorriso não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Uso social do sorriso aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Uso social do sorriso surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Uso social do sorriso já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Uso social do sorriso está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 6,
    name: "Resposta ao nome",
    domain: 1,
    levels: [
      { level: 0, label: "ausente", anchor: "Resposta ao nome não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Resposta ao nome aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Resposta ao nome surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Resposta ao nome já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Resposta ao nome está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 7,
    name: "Qualidade do contato ocular",
    domain: 1,
    levels: [
      { level: 0, label: "ausente", anchor: "Qualidade do contato ocular não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Qualidade do contato ocular aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Qualidade do contato ocular surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Qualidade do contato ocular já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Qualidade do contato ocular está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 8,
    name: "Alternância de olhar pessoa-objeto",
    domain: 1,
    levels: [
      { level: 0, label: "ausente", anchor: "Alternância de olhar pessoa-objeto não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Alternância de olhar pessoa-objeto aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Alternância de olhar pessoa-objeto surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Alternância de olhar pessoa-objeto já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Alternância de olhar pessoa-objeto está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 9,
    name: "Iniciativa de interação",
    domain: 1,
    levels: [
      { level: 0, label: "ausente", anchor: "Iniciativa de interação não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Iniciativa de interação aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Iniciativa de interação surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Iniciativa de interação já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Iniciativa de interação está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 10,
    name: "Manutenção da troca social",
    domain: 1,
    levels: [
      { level: 0, label: "ausente", anchor: "Manutenção da troca social não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Manutenção da troca social aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Manutenção da troca social surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Manutenção da troca social já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Manutenção da troca social está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 11,
    name: "Imitação espontânea",
    domain: 1,
    levels: [
      { level: 0, label: "ausente", anchor: "Imitação espontânea não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Imitação espontânea aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Imitação espontânea surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Imitação espontânea já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Imitação espontânea está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 12,
    name: "Imitação sob modelo",
    domain: 1,
    levels: [
      { level: 0, label: "ausente", anchor: "Imitação sob modelo não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Imitação sob modelo aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Imitação sob modelo surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Imitação sob modelo já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Imitação sob modelo está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 13,
    name: "Jogo simbólico emergente",
    domain: 1,
    levels: [
      { level: 0, label: "ausente", anchor: "Jogo simbólico emergente não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Jogo simbólico emergente aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Jogo simbólico emergente surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Jogo simbólico emergente já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Jogo simbólico emergente está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 14,
    name: "Flexibilidade de brincadeira",
    domain: 1,
    levels: [
      { level: 0, label: "ausente", anchor: "Flexibilidade de brincadeira não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Flexibilidade de brincadeira aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Flexibilidade de brincadeira surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Flexibilidade de brincadeira já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Flexibilidade de brincadeira está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 15,
    name: "Interesse por pares",
    domain: 1,
    levels: [
      { level: 0, label: "ausente", anchor: "Interesse por pares não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Interesse por pares aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Interesse por pares surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Interesse por pares já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Interesse por pares está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 16,
    name: "Reciprocidade em pares",
    domain: 1,
    levels: [
      { level: 0, label: "ausente", anchor: "Reciprocidade em pares não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Reciprocidade em pares aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Reciprocidade em pares surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Reciprocidade em pares já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Reciprocidade em pares está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 17,
    name: "Entendimento de turnos",
    domain: 1,
    levels: [
      { level: 0, label: "ausente", anchor: "Entendimento de turnos não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Entendimento de turnos aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Entendimento de turnos surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Entendimento de turnos já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Entendimento de turnos está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 18,
    name: "Percepção de regras sociais implícitas",
    domain: 1,
    levels: [
      { level: 0, label: "ausente", anchor: "Percepção de regras sociais implícitas não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Percepção de regras sociais implícitas aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Percepção de regras sociais implícitas surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Percepção de regras sociais implícitas já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Percepção de regras sociais implícitas está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 19,
    name: "Comunicação de prazer compartilhado",
    domain: 1,
    levels: [
      { level: 0, label: "ausente", anchor: "Comunicação de prazer compartilhado não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Comunicação de prazer compartilhado aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Comunicação de prazer compartilhado surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Comunicação de prazer compartilhado já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Comunicação de prazer compartilhado está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 20,
    name: "Sinais sutis de isolamento social",
    domain: 1,
    levels: [
      { level: 0, label: "ausente", anchor: "Não se observam sinais clinicamente relevantes de sinais sutis de isolamento social.", phrase: "“Isso não chama atenção no dia a dia.”" },
      { level: 1, label: "leve / ocasional", anchor: "Sinais sutis de isolamento social aparece de forma rara, breve ou leve, sem repercussão funcional consistente.", phrase: "“Acontece de vez em quando, mas passa rápido.”" },
      { level: 2, label: "situacional", anchor: "Sinais sutis de isolamento social surge em gatilhos específicos e já merece registro, embora ainda não seja um padrão amplo e contínuo.", phrase: "“Quando sai da rotina ou aperta mais, isso aparece.”" },
      { level: 3, label: "frequente", anchor: "Sinais sutis de isolamento social é frequente e já interfere de modo perceptível no funcionamento, pedindo adaptações ambientais e leitura integrada.", phrase: "“Tem sido frequente e já atrapalha bastante.”" },
      { level: 4, label: "marcado / generalizado", anchor: "Sinais sutis de isolamento social é intenso, aparece em múltiplos contextos e tem peso relevante na definição de suporte e prognóstico.", phrase: "“É muito marcado, aparece em vários contextos e pesa bastante no dia.”" },
    ],
  },
  {
    number: 21,
    name: "Intenção comunicativa global",
    domain: 2,
    levels: [
      { level: 0, label: "ausente", anchor: "Intenção comunicativa global não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Intenção comunicativa global aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Intenção comunicativa global surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Intenção comunicativa global já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Intenção comunicativa global está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 22,
    name: "Gesto protoimperativo",
    domain: 2,
    levels: [
      { level: 0, label: "ausente", anchor: "Gesto protoimperativo não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Gesto protoimperativo aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Gesto protoimperativo surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Gesto protoimperativo já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Gesto protoimperativo está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 23,
    name: "Gesto protodeclarativo",
    domain: 2,
    levels: [
      { level: 0, label: "ausente", anchor: "Gesto protodeclarativo não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Gesto protodeclarativo aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Gesto protodeclarativo surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Gesto protodeclarativo já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Gesto protodeclarativo está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 24,
    name: "Apontar funcional",
    domain: 2,
    levels: [
      { level: 0, label: "ausente", anchor: "Apontar funcional não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Apontar funcional aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Apontar funcional surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Apontar funcional já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Apontar funcional está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 25,
    name: "Repertório gestual substitutivo",
    domain: 2,
    levels: [
      { level: 0, label: "ausente", anchor: "Repertório gestual substitutivo não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Repertório gestual substitutivo aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Repertório gestual substitutivo surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Repertório gestual substitutivo já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Repertório gestual substitutivo está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 26,
    name: "Compreensão de ordens simples",
    domain: 2,
    levels: [
      { level: 0, label: "ausente", anchor: "Compreensão de ordens simples não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Compreensão de ordens simples aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Compreensão de ordens simples surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Compreensão de ordens simples já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Compreensão de ordens simples está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 27,
    name: "Compreensão de ordens complexas",
    domain: 2,
    levels: [
      { level: 0, label: "ausente", anchor: "Compreensão de ordens complexas não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Compreensão de ordens complexas aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Compreensão de ordens complexas surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Compreensão de ordens complexas já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Compreensão de ordens complexas está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 28,
    name: "Vocabulário receptivo funcional",
    domain: 2,
    levels: [
      { level: 0, label: "ausente", anchor: "Vocabulário receptivo funcional não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Vocabulário receptivo funcional aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Vocabulário receptivo funcional surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Vocabulário receptivo funcional já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Vocabulário receptivo funcional está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 29,
    name: "Vocabulário expressivo funcional",
    domain: 2,
    levels: [
      { level: 0, label: "ausente", anchor: "Vocabulário expressivo funcional não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Vocabulário expressivo funcional aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Vocabulário expressivo funcional surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Vocabulário expressivo funcional já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Vocabulário expressivo funcional está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 30,
    name: "Combinação de palavras",
    domain: 2,
    levels: [
      { level: 0, label: "ausente", anchor: "Combinação de palavras não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Combinação de palavras aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Combinação de palavras surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Combinação de palavras já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Combinação de palavras está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 31,
    name: "Organização sintática espontânea",
    domain: 2,
    levels: [
      { level: 0, label: "ausente", anchor: "Organização sintática espontânea não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Organização sintática espontânea aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Organização sintática espontânea surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Organização sintática espontânea já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Organização sintática espontânea está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 32,
    name: "Coerência narrativa",
    domain: 2,
    levels: [
      { level: 0, label: "ausente", anchor: "Coerência narrativa não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Coerência narrativa aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Coerência narrativa surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Coerência narrativa já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Coerência narrativa está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 33,
    name: "Pragmática conversacional",
    domain: 2,
    levels: [
      { level: 0, label: "ausente", anchor: "Pragmática conversacional não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Pragmática conversacional aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Pragmática conversacional surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Pragmática conversacional já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Pragmática conversacional está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 34,
    name: "Resposta a perguntas abertas",
    domain: 2,
    levels: [
      { level: 0, label: "ausente", anchor: "Resposta a perguntas abertas não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Resposta a perguntas abertas aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Resposta a perguntas abertas surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Resposta a perguntas abertas já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Resposta a perguntas abertas está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 35,
    name: "Prosódia funcional",
    domain: 2,
    levels: [
      { level: 0, label: "ausente", anchor: "Prosódia funcional não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Prosódia funcional aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Prosódia funcional surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Prosódia funcional já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Prosódia funcional está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 36,
    name: "Ecolalia imediata",
    domain: 2,
    levels: [
      { level: 0, label: "ausente", anchor: "Não se observam sinais clinicamente relevantes de ecolalia imediata.", phrase: "“Isso não chama atenção no dia a dia.”" },
      { level: 1, label: "leve / ocasional", anchor: "Ecolalia imediata aparece de forma rara, breve ou leve, sem repercussão funcional consistente.", phrase: "“Acontece de vez em quando, mas passa rápido.”" },
      { level: 2, label: "situacional", anchor: "Ecolalia imediata surge em gatilhos específicos e já merece registro, embora ainda não seja um padrão amplo e contínuo.", phrase: "“Quando sai da rotina ou aperta mais, isso aparece.”" },
      { level: 3, label: "frequente", anchor: "Ecolalia imediata é frequente e já interfere de modo perceptível no funcionamento, pedindo adaptações ambientais e leitura integrada.", phrase: "“Tem sido frequente e já atrapalha bastante.”" },
      { level: 4, label: "marcado / generalizado", anchor: "Ecolalia imediata é intenso, aparece em múltiplos contextos e tem peso relevante na definição de suporte e prognóstico.", phrase: "“É muito marcado, aparece em vários contextos e pesa bastante no dia.”" },
    ],
  },
  {
    number: 37,
    name: "Ecolalia tardia",
    domain: 2,
    levels: [
      { level: 0, label: "ausente", anchor: "Não se observam sinais clinicamente relevantes de ecolalia tardia.", phrase: "“Isso não chama atenção no dia a dia.”" },
      { level: 1, label: "leve / ocasional", anchor: "Ecolalia tardia aparece de forma rara, breve ou leve, sem repercussão funcional consistente.", phrase: "“Acontece de vez em quando, mas passa rápido.”" },
      { level: 2, label: "situacional", anchor: "Ecolalia tardia surge em gatilhos específicos e já merece registro, embora ainda não seja um padrão amplo e contínuo.", phrase: "“Quando sai da rotina ou aperta mais, isso aparece.”" },
      { level: 3, label: "frequente", anchor: "Ecolalia tardia é frequente e já interfere de modo perceptível no funcionamento, pedindo adaptações ambientais e leitura integrada.", phrase: "“Tem sido frequente e já atrapalha bastante.”" },
      { level: 4, label: "marcado / generalizado", anchor: "Ecolalia tardia é intenso, aparece em múltiplos contextos e tem peso relevante na definição de suporte e prognóstico.", phrase: "“É muito marcado, aparece em vários contextos e pesa bastante no dia.”" },
    ],
  },
  {
    number: 38,
    name: "Linguagem para regular o outro",
    domain: 2,
    levels: [
      { level: 0, label: "ausente", anchor: "Linguagem para regular o outro não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Linguagem para regular o outro aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Linguagem para regular o outro surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Linguagem para regular o outro já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Linguagem para regular o outro está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 39,
    name: "Linguagem para compartilhar experiência",
    domain: 2,
    levels: [
      { level: 0, label: "ausente", anchor: "Linguagem para compartilhar experiência não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Linguagem para compartilhar experiência aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Linguagem para compartilhar experiência surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Linguagem para compartilhar experiência já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Linguagem para compartilhar experiência está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 40,
    name: "Reparo comunicativo",
    domain: 2,
    levels: [
      { level: 0, label: "ausente", anchor: "Reparo comunicativo não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Reparo comunicativo aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Reparo comunicativo surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Reparo comunicativo já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Reparo comunicativo está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 41,
    name: "Atenção sustentada",
    domain: 3,
    levels: [
      { level: 0, label: "ausente", anchor: "Atenção sustentada não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Atenção sustentada aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Atenção sustentada surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Atenção sustentada já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Atenção sustentada está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 42,
    name: "Atenção seletiva",
    domain: 3,
    levels: [
      { level: 0, label: "ausente", anchor: "Atenção seletiva não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Atenção seletiva aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Atenção seletiva surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Atenção seletiva já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Atenção seletiva está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 43,
    name: "Atenção alternada",
    domain: 3,
    levels: [
      { level: 0, label: "ausente", anchor: "Atenção alternada não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Atenção alternada aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Atenção alternada surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Atenção alternada já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Atenção alternada está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 44,
    name: "Controle inibitório",
    domain: 3,
    levels: [
      { level: 0, label: "ausente", anchor: "Controle inibitório não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Controle inibitório aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Controle inibitório surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Controle inibitório já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Controle inibitório está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 45,
    name: "Tolerância à espera",
    domain: 3,
    levels: [
      { level: 0, label: "ausente", anchor: "Tolerância à espera não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Tolerância à espera aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Tolerância à espera surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Tolerância à espera já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Tolerância à espera está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 46,
    name: "Persistência em tarefa",
    domain: 3,
    levels: [
      { level: 0, label: "ausente", anchor: "Persistência em tarefa não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Persistência em tarefa aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Persistência em tarefa surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Persistência em tarefa já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Persistência em tarefa está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 47,
    name: "Monitoramento de erro",
    domain: 3,
    levels: [
      { level: 0, label: "ausente", anchor: "Monitoramento de erro não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Monitoramento de erro aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Monitoramento de erro surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Monitoramento de erro já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Monitoramento de erro está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 48,
    name: "Flexibilidade cognitiva",
    domain: 3,
    levels: [
      { level: 0, label: "ausente", anchor: "Flexibilidade cognitiva não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Flexibilidade cognitiva aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Flexibilidade cognitiva surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Flexibilidade cognitiva já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Flexibilidade cognitiva está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 49,
    name: "Planejamento motor-cognitivo",
    domain: 3,
    levels: [
      { level: 0, label: "ausente", anchor: "Planejamento motor-cognitivo não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Planejamento motor-cognitivo aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Planejamento motor-cognitivo surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Planejamento motor-cognitivo já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Planejamento motor-cognitivo está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 50,
    name: "Organização sequencial",
    domain: 3,
    levels: [
      { level: 0, label: "ausente", anchor: "Organização sequencial não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Organização sequencial aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Organização sequencial surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Organização sequencial já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Organização sequencial está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 51,
    name: "Memória operacional verbal",
    domain: 3,
    levels: [
      { level: 0, label: "ausente", anchor: "Memória operacional verbal não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Memória operacional verbal aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Memória operacional verbal surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Memória operacional verbal já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Memória operacional verbal está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 52,
    name: "Memória operacional visuoespacial",
    domain: 3,
    levels: [
      { level: 0, label: "ausente", anchor: "Memória operacional visuoespacial não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Memória operacional visuoespacial aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Memória operacional visuoespacial surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Memória operacional visuoespacial já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Memória operacional visuoespacial está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 53,
    name: "Velocidade de processamento funcional",
    domain: 3,
    levels: [
      { level: 0, label: "ausente", anchor: "Velocidade de processamento funcional não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Velocidade de processamento funcional aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Velocidade de processamento funcional surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Velocidade de processamento funcional já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Velocidade de processamento funcional está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 54,
    name: "Compreensão de regras",
    domain: 3,
    levels: [
      { level: 0, label: "ausente", anchor: "Compreensão de regras não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Compreensão de regras aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Compreensão de regras surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Compreensão de regras já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Compreensão de regras está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 55,
    name: "Generalização de aprendizagem",
    domain: 3,
    levels: [
      { level: 0, label: "ausente", anchor: "Generalização de aprendizagem não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Generalização de aprendizagem aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Generalização de aprendizagem surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Generalização de aprendizagem já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Generalização de aprendizagem está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 56,
    name: "Dependência de mediação",
    domain: 3,
    levels: [
      { level: 0, label: "ausente", anchor: "Não se observam sinais clinicamente relevantes de dependência de mediação.", phrase: "“Isso não chama atenção no dia a dia.”" },
      { level: 1, label: "leve / ocasional", anchor: "Dependência de mediação aparece de forma rara, breve ou leve, sem repercussão funcional consistente.", phrase: "“Acontece de vez em quando, mas passa rápido.”" },
      { level: 2, label: "situacional", anchor: "Dependência de mediação surge em gatilhos específicos e já merece registro, embora ainda não seja um padrão amplo e contínuo.", phrase: "“Quando sai da rotina ou aperta mais, isso aparece.”" },
      { level: 3, label: "frequente", anchor: "Dependência de mediação é frequente e já interfere de modo perceptível no funcionamento, pedindo adaptações ambientais e leitura integrada.", phrase: "“Tem sido frequente e já atrapalha bastante.”" },
      { level: 4, label: "marcado / generalizado", anchor: "Dependência de mediação é intenso, aparece em múltiplos contextos e tem peso relevante na definição de suporte e prognóstico.", phrase: "“É muito marcado, aparece em vários contextos e pesa bastante no dia.”" },
    ],
  },
  {
    number: 57,
    name: "Autonomia diante de tarefa escolar",
    domain: 3,
    levels: [
      { level: 0, label: "ausente", anchor: "Autonomia diante de tarefa escolar não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Autonomia diante de tarefa escolar aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Autonomia diante de tarefa escolar surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Autonomia diante de tarefa escolar já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Autonomia diante de tarefa escolar está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 58,
    name: "Leitura do contexto de sala",
    domain: 3,
    levels: [
      { level: 0, label: "ausente", anchor: "Leitura do contexto de sala não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Leitura do contexto de sala aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Leitura do contexto de sala surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Leitura do contexto de sala já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Leitura do contexto de sala está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 59,
    name: "Fragilidade em transições",
    domain: 3,
    levels: [
      { level: 0, label: "ausente", anchor: "Não se observam sinais clinicamente relevantes de fragilidade em transições.", phrase: "“Isso não chama atenção no dia a dia.”" },
      { level: 1, label: "leve / ocasional", anchor: "Fragilidade em transições aparece de forma rara, breve ou leve, sem repercussão funcional consistente.", phrase: "“Acontece de vez em quando, mas passa rápido.”" },
      { level: 2, label: "situacional", anchor: "Fragilidade em transições surge em gatilhos específicos e já merece registro, embora ainda não seja um padrão amplo e contínuo.", phrase: "“Quando sai da rotina ou aperta mais, isso aparece.”" },
      { level: 3, label: "frequente", anchor: "Fragilidade em transições é frequente e já interfere de modo perceptível no funcionamento, pedindo adaptações ambientais e leitura integrada.", phrase: "“Tem sido frequente e já atrapalha bastante.”" },
      { level: 4, label: "marcado / generalizado", anchor: "Fragilidade em transições é intenso, aparece em múltiplos contextos e tem peso relevante na definição de suporte e prognóstico.", phrase: "“É muito marcado, aparece em vários contextos e pesa bastante no dia.”" },
    ],
  },
  {
    number: 60,
    name: "Sinais passivos de fadiga cognitiva",
    domain: 3,
    levels: [
      { level: 0, label: "ausente", anchor: "Não se observam sinais clinicamente relevantes de sinais passivos de fadiga cognitiva.", phrase: "“Isso não chama atenção no dia a dia.”" },
      { level: 1, label: "leve / ocasional", anchor: "Sinais passivos de fadiga cognitiva aparece de forma rara, breve ou leve, sem repercussão funcional consistente.", phrase: "“Acontece de vez em quando, mas passa rápido.”" },
      { level: 2, label: "situacional", anchor: "Sinais passivos de fadiga cognitiva surge em gatilhos específicos e já merece registro, embora ainda não seja um padrão amplo e contínuo.", phrase: "“Quando sai da rotina ou aperta mais, isso aparece.”" },
      { level: 3, label: "frequente", anchor: "Sinais passivos de fadiga cognitiva é frequente e já interfere de modo perceptível no funcionamento, pedindo adaptações ambientais e leitura integrada.", phrase: "“Tem sido frequente e já atrapalha bastante.”" },
      { level: 4, label: "marcado / generalizado", anchor: "Sinais passivos de fadiga cognitiva é intenso, aparece em múltiplos contextos e tem peso relevante na definição de suporte e prognóstico.", phrase: "“É muito marcado, aparece em vários contextos e pesa bastante no dia.”" },
    ],
  },
  {
    number: 61,
    name: "Hiporreatividade dolorosa",
    domain: 4,
    levels: [
      { level: 0, label: "ausente", anchor: "Não se observam sinais clinicamente relevantes de hiporreatividade dolorosa.", phrase: "“Isso não chama atenção no dia a dia.”" },
      { level: 1, label: "leve / ocasional", anchor: "Hiporreatividade dolorosa aparece de forma rara, breve ou leve, sem repercussão funcional consistente.", phrase: "“Acontece de vez em quando, mas passa rápido.”" },
      { level: 2, label: "situacional", anchor: "Hiporreatividade dolorosa surge em gatilhos específicos e já merece registro, embora ainda não seja um padrão amplo e contínuo.", phrase: "“Quando sai da rotina ou aperta mais, isso aparece.”" },
      { level: 3, label: "frequente", anchor: "Hiporreatividade dolorosa é frequente e já interfere de modo perceptível no funcionamento, pedindo adaptações ambientais e leitura integrada.", phrase: "“Tem sido frequente e já atrapalha bastante.”" },
      { level: 4, label: "marcado / generalizado", anchor: "Hiporreatividade dolorosa é intenso, aparece em múltiplos contextos e tem peso relevante na definição de suporte e prognóstico.", phrase: "“É muito marcado, aparece em vários contextos e pesa bastante no dia.”" },
    ],
  },
  {
    number: 62,
    name: "Hiperreatividade auditiva",
    domain: 4,
    levels: [
      { level: 0, label: "ausente", anchor: "Não se observam sinais clinicamente relevantes de hiperreatividade auditiva.", phrase: "“Isso não chama atenção no dia a dia.”" },
      { level: 1, label: "leve / ocasional", anchor: "Hiperreatividade auditiva aparece de forma rara, breve ou leve, sem repercussão funcional consistente.", phrase: "“Acontece de vez em quando, mas passa rápido.”" },
      { level: 2, label: "situacional", anchor: "Hiperreatividade auditiva surge em gatilhos específicos e já merece registro, embora ainda não seja um padrão amplo e contínuo.", phrase: "“Quando sai da rotina ou aperta mais, isso aparece.”" },
      { level: 3, label: "frequente", anchor: "Hiperreatividade auditiva é frequente e já interfere de modo perceptível no funcionamento, pedindo adaptações ambientais e leitura integrada.", phrase: "“Tem sido frequente e já atrapalha bastante.”" },
      { level: 4, label: "marcado / generalizado", anchor: "Hiperreatividade auditiva é intenso, aparece em múltiplos contextos e tem peso relevante na definição de suporte e prognóstico.", phrase: "“É muito marcado, aparece em vários contextos e pesa bastante no dia.”" },
    ],
  },
  {
    number: 63,
    name: "Hiperreatividade tátil",
    domain: 4,
    levels: [
      { level: 0, label: "ausente", anchor: "Não se observam sinais clinicamente relevantes de hiperreatividade tátil.", phrase: "“Isso não chama atenção no dia a dia.”" },
      { level: 1, label: "leve / ocasional", anchor: "Hiperreatividade tátil aparece de forma rara, breve ou leve, sem repercussão funcional consistente.", phrase: "“Acontece de vez em quando, mas passa rápido.”" },
      { level: 2, label: "situacional", anchor: "Hiperreatividade tátil surge em gatilhos específicos e já merece registro, embora ainda não seja um padrão amplo e contínuo.", phrase: "“Quando sai da rotina ou aperta mais, isso aparece.”" },
      { level: 3, label: "frequente", anchor: "Hiperreatividade tátil é frequente e já interfere de modo perceptível no funcionamento, pedindo adaptações ambientais e leitura integrada.", phrase: "“Tem sido frequente e já atrapalha bastante.”" },
      { level: 4, label: "marcado / generalizado", anchor: "Hiperreatividade tátil é intenso, aparece em múltiplos contextos e tem peso relevante na definição de suporte e prognóstico.", phrase: "“É muito marcado, aparece em vários contextos e pesa bastante no dia.”" },
    ],
  },
  {
    number: 64,
    name: "Busca vestibular",
    domain: 4,
    levels: [
      { level: 0, label: "ausente", anchor: "Não se observam sinais clinicamente relevantes de busca vestibular.", phrase: "“Isso não chama atenção no dia a dia.”" },
      { level: 1, label: "leve / ocasional", anchor: "Busca vestibular aparece de forma rara, breve ou leve, sem repercussão funcional consistente.", phrase: "“Acontece de vez em quando, mas passa rápido.”" },
      { level: 2, label: "situacional", anchor: "Busca vestibular surge em gatilhos específicos e já merece registro, embora ainda não seja um padrão amplo e contínuo.", phrase: "“Quando sai da rotina ou aperta mais, isso aparece.”" },
      { level: 3, label: "frequente", anchor: "Busca vestibular é frequente e já interfere de modo perceptível no funcionamento, pedindo adaptações ambientais e leitura integrada.", phrase: "“Tem sido frequente e já atrapalha bastante.”" },
      { level: 4, label: "marcado / generalizado", anchor: "Busca vestibular é intenso, aparece em múltiplos contextos e tem peso relevante na definição de suporte e prognóstico.", phrase: "“É muito marcado, aparece em vários contextos e pesa bastante no dia.”" },
    ],
  },
  {
    number: 65,
    name: "Busca proprioceptiva",
    domain: 4,
    levels: [
      { level: 0, label: "ausente", anchor: "Não se observam sinais clinicamente relevantes de busca proprioceptiva.", phrase: "“Isso não chama atenção no dia a dia.”" },
      { level: 1, label: "leve / ocasional", anchor: "Busca proprioceptiva aparece de forma rara, breve ou leve, sem repercussão funcional consistente.", phrase: "“Acontece de vez em quando, mas passa rápido.”" },
      { level: 2, label: "situacional", anchor: "Busca proprioceptiva surge em gatilhos específicos e já merece registro, embora ainda não seja um padrão amplo e contínuo.", phrase: "“Quando sai da rotina ou aperta mais, isso aparece.”" },
      { level: 3, label: "frequente", anchor: "Busca proprioceptiva é frequente e já interfere de modo perceptível no funcionamento, pedindo adaptações ambientais e leitura integrada.", phrase: "“Tem sido frequente e já atrapalha bastante.”" },
      { level: 4, label: "marcado / generalizado", anchor: "Busca proprioceptiva é intenso, aparece em múltiplos contextos e tem peso relevante na definição de suporte e prognóstico.", phrase: "“É muito marcado, aparece em vários contextos e pesa bastante no dia.”" },
    ],
  },
  {
    number: 66,
    name: "Seletividade alimentar sensorial",
    domain: 4,
    levels: [
      { level: 0, label: "ausente", anchor: "Não se observam sinais clinicamente relevantes de seletividade alimentar sensorial.", phrase: "“Isso não chama atenção no dia a dia.”" },
      { level: 1, label: "leve / ocasional", anchor: "Seletividade alimentar sensorial aparece de forma rara, breve ou leve, sem repercussão funcional consistente.", phrase: "“Acontece de vez em quando, mas passa rápido.”" },
      { level: 2, label: "situacional", anchor: "Seletividade alimentar sensorial surge em gatilhos específicos e já merece registro, embora ainda não seja um padrão amplo e contínuo.", phrase: "“Quando sai da rotina ou aperta mais, isso aparece.”" },
      { level: 3, label: "frequente", anchor: "Seletividade alimentar sensorial é frequente e já interfere de modo perceptível no funcionamento, pedindo adaptações ambientais e leitura integrada.", phrase: "“Tem sido frequente e já atrapalha bastante.”" },
      { level: 4, label: "marcado / generalizado", anchor: "Seletividade alimentar sensorial é intenso, aparece em múltiplos contextos e tem peso relevante na definição de suporte e prognóstico.", phrase: "“É muito marcado, aparece em vários contextos e pesa bastante no dia.”" },
    ],
  },
  {
    number: 67,
    name: "Mastigação e coordenação oral",
    domain: 4,
    levels: [
      { level: 0, label: "ausente", anchor: "Mastigação e coordenação oral não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Mastigação e coordenação oral aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Mastigação e coordenação oral surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Mastigação e coordenação oral já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Mastigação e coordenação oral está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 68,
    name: "Controle postural",
    domain: 4,
    levels: [
      { level: 0, label: "ausente", anchor: "Controle postural não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Controle postural aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Controle postural surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Controle postural já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Controle postural está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 69,
    name: "Praxia global",
    domain: 4,
    levels: [
      { level: 0, label: "ausente", anchor: "Praxia global não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Praxia global aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Praxia global surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Praxia global já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Praxia global está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 70,
    name: "Praxia fina",
    domain: 4,
    levels: [
      { level: 0, label: "ausente", anchor: "Praxia fina não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Praxia fina aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Praxia fina surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Praxia fina já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Praxia fina está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 71,
    name: "Coordenação bimanual",
    domain: 4,
    levels: [
      { level: 0, label: "ausente", anchor: "Coordenação bimanual não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Coordenação bimanual aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Coordenação bimanual surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Coordenação bimanual já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Coordenação bimanual está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 72,
    name: "Marcha e padrão motor",
    domain: 4,
    levels: [
      { level: 0, label: "ausente", anchor: "Marcha e padrão motor não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Marcha e padrão motor aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Marcha e padrão motor surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Marcha e padrão motor já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Marcha e padrão motor está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 73,
    name: "Estereotipias motoras",
    domain: 4,
    levels: [
      { level: 0, label: "ausente", anchor: "Não se observam sinais clinicamente relevantes de estereotipias motoras.", phrase: "“Isso não chama atenção no dia a dia.”" },
      { level: 1, label: "leve / ocasional", anchor: "Estereotipias motoras aparece de forma rara, breve ou leve, sem repercussão funcional consistente.", phrase: "“Acontece de vez em quando, mas passa rápido.”" },
      { level: 2, label: "situacional", anchor: "Estereotipias motoras surge em gatilhos específicos e já merece registro, embora ainda não seja um padrão amplo e contínuo.", phrase: "“Quando sai da rotina ou aperta mais, isso aparece.”" },
      { level: 3, label: "frequente", anchor: "Estereotipias motoras é frequente e já interfere de modo perceptível no funcionamento, pedindo adaptações ambientais e leitura integrada.", phrase: "“Tem sido frequente e já atrapalha bastante.”" },
      { level: 4, label: "marcado / generalizado", anchor: "Estereotipias motoras é intenso, aparece em múltiplos contextos e tem peso relevante na definição de suporte e prognóstico.", phrase: "“É muito marcado, aparece em vários contextos e pesa bastante no dia.”" },
    ],
  },
  {
    number: 74,
    name: "Autorregulação corporal",
    domain: 4,
    levels: [
      { level: 0, label: "ausente", anchor: "Autorregulação corporal não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Autorregulação corporal aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Autorregulação corporal surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Autorregulação corporal já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Autorregulação corporal está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 75,
    name: "Tolerância ao toque de cuidado",
    domain: 4,
    levels: [
      { level: 0, label: "ausente", anchor: "Não se observam sinais clinicamente relevantes de tolerância ao toque de cuidado.", phrase: "“Isso não chama atenção no dia a dia.”" },
      { level: 1, label: "leve / ocasional", anchor: "Tolerância ao toque de cuidado aparece de forma rara, breve ou leve, sem repercussão funcional consistente.", phrase: "“Acontece de vez em quando, mas passa rápido.”" },
      { level: 2, label: "situacional", anchor: "Tolerância ao toque de cuidado surge em gatilhos específicos e já merece registro, embora ainda não seja um padrão amplo e contínuo.", phrase: "“Quando sai da rotina ou aperta mais, isso aparece.”" },
      { level: 3, label: "frequente", anchor: "Tolerância ao toque de cuidado é frequente e já interfere de modo perceptível no funcionamento, pedindo adaptações ambientais e leitura integrada.", phrase: "“Tem sido frequente e já atrapalha bastante.”" },
      { level: 4, label: "marcado / generalizado", anchor: "Tolerância ao toque de cuidado é intenso, aparece em múltiplos contextos e tem peso relevante na definição de suporte e prognóstico.", phrase: "“É muito marcado, aparece em vários contextos e pesa bastante no dia.”" },
    ],
  },
  {
    number: 76,
    name: "Vestir-se e despir-se",
    domain: 4,
    levels: [
      { level: 0, label: "ausente", anchor: "Vestir-se e despir-se não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Vestir-se e despir-se aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Vestir-se e despir-se surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Vestir-se e despir-se já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Vestir-se e despir-se está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 77,
    name: "Higiene pessoal assistida",
    domain: 4,
    levels: [
      { level: 0, label: "ausente", anchor: "Higiene pessoal assistida não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Higiene pessoal assistida aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Higiene pessoal assistida surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Higiene pessoal assistida já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Higiene pessoal assistida está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 78,
    name: "Controle esfincteriano funcional",
    domain: 4,
    levels: [
      { level: 0, label: "ausente", anchor: "Controle esfincteriano funcional não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Controle esfincteriano funcional aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Controle esfincteriano funcional surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Controle esfincteriano funcional já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Controle esfincteriano funcional está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 79,
    name: "Sono e ritmicidade biológica",
    domain: 4,
    levels: [
      { level: 0, label: "ausente", anchor: "Não se observam sinais clinicamente relevantes de sono e ritmicidade biológica.", phrase: "“Isso não chama atenção no dia a dia.”" },
      { level: 1, label: "leve / ocasional", anchor: "Sono e ritmicidade biológica aparece de forma rara, breve ou leve, sem repercussão funcional consistente.", phrase: "“Acontece de vez em quando, mas passa rápido.”" },
      { level: 2, label: "situacional", anchor: "Sono e ritmicidade biológica surge em gatilhos específicos e já merece registro, embora ainda não seja um padrão amplo e contínuo.", phrase: "“Quando sai da rotina ou aperta mais, isso aparece.”" },
      { level: 3, label: "frequente", anchor: "Sono e ritmicidade biológica é frequente e já interfere de modo perceptível no funcionamento, pedindo adaptações ambientais e leitura integrada.", phrase: "“Tem sido frequente e já atrapalha bastante.”" },
      { level: 4, label: "marcado / generalizado", anchor: "Sono e ritmicidade biológica é intenso, aparece em múltiplos contextos e tem peso relevante na definição de suporte e prognóstico.", phrase: "“É muito marcado, aparece em vários contextos e pesa bastante no dia.”" },
    ],
  },
  {
    number: 80,
    name: "Rotina adaptativa cotidiana",
    domain: 4,
    levels: [
      { level: 0, label: "ausente", anchor: "Rotina adaptativa cotidiana não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Rotina adaptativa cotidiana aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Rotina adaptativa cotidiana surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Rotina adaptativa cotidiana já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Rotina adaptativa cotidiana está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 81,
    name: "Regulação emocional basal",
    domain: 5,
    levels: [
      { level: 0, label: "ausente", anchor: "Regulação emocional basal não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Regulação emocional basal aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Regulação emocional basal surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Regulação emocional basal já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Regulação emocional basal está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 82,
    name: "Irritabilidade reativa",
    domain: 5,
    levels: [
      { level: 0, label: "ausente", anchor: "Não se observam sinais clinicamente relevantes de irritabilidade reativa.", phrase: "“Isso não chama atenção no dia a dia.”" },
      { level: 1, label: "leve / ocasional", anchor: "Irritabilidade reativa aparece de forma rara, breve ou leve, sem repercussão funcional consistente.", phrase: "“Acontece de vez em quando, mas passa rápido.”" },
      { level: 2, label: "situacional", anchor: "Irritabilidade reativa surge em gatilhos específicos e já merece registro, embora ainda não seja um padrão amplo e contínuo.", phrase: "“Quando sai da rotina ou aperta mais, isso aparece.”" },
      { level: 3, label: "frequente", anchor: "Irritabilidade reativa é frequente e já interfere de modo perceptível no funcionamento, pedindo adaptações ambientais e leitura integrada.", phrase: "“Tem sido frequente e já atrapalha bastante.”" },
      { level: 4, label: "marcado / generalizado", anchor: "Irritabilidade reativa é intenso, aparece em múltiplos contextos e tem peso relevante na definição de suporte e prognóstico.", phrase: "“É muito marcado, aparece em vários contextos e pesa bastante no dia.”" },
    ],
  },
  {
    number: 83,
    name: "Frustração e recuperação",
    domain: 5,
    levels: [
      { level: 0, label: "ausente", anchor: "Frustração e recuperação não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Frustração e recuperação aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Frustração e recuperação surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Frustração e recuperação já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Frustração e recuperação está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 84,
    name: "Ansiedade antecipatória",
    domain: 5,
    levels: [
      { level: 0, label: "ausente", anchor: "Não se observam sinais clinicamente relevantes de ansiedade antecipatória.", phrase: "“Isso não chama atenção no dia a dia.”" },
      { level: 1, label: "leve / ocasional", anchor: "Ansiedade antecipatória aparece de forma rara, breve ou leve, sem repercussão funcional consistente.", phrase: "“Acontece de vez em quando, mas passa rápido.”" },
      { level: 2, label: "situacional", anchor: "Ansiedade antecipatória surge em gatilhos específicos e já merece registro, embora ainda não seja um padrão amplo e contínuo.", phrase: "“Quando sai da rotina ou aperta mais, isso aparece.”" },
      { level: 3, label: "frequente", anchor: "Ansiedade antecipatória é frequente e já interfere de modo perceptível no funcionamento, pedindo adaptações ambientais e leitura integrada.", phrase: "“Tem sido frequente e já atrapalha bastante.”" },
      { level: 4, label: "marcado / generalizado", anchor: "Ansiedade antecipatória é intenso, aparece em múltiplos contextos e tem peso relevante na definição de suporte e prognóstico.", phrase: "“É muito marcado, aparece em vários contextos e pesa bastante no dia.”" },
    ],
  },
  {
    number: 85,
    name: "Rigidez comportamental",
    domain: 5,
    levels: [
      { level: 0, label: "ausente", anchor: "Não se observam sinais clinicamente relevantes de rigidez comportamental.", phrase: "“Isso não chama atenção no dia a dia.”" },
      { level: 1, label: "leve / ocasional", anchor: "Rigidez comportamental aparece de forma rara, breve ou leve, sem repercussão funcional consistente.", phrase: "“Acontece de vez em quando, mas passa rápido.”" },
      { level: 2, label: "situacional", anchor: "Rigidez comportamental surge em gatilhos específicos e já merece registro, embora ainda não seja um padrão amplo e contínuo.", phrase: "“Quando sai da rotina ou aperta mais, isso aparece.”" },
      { level: 3, label: "frequente", anchor: "Rigidez comportamental é frequente e já interfere de modo perceptível no funcionamento, pedindo adaptações ambientais e leitura integrada.", phrase: "“Tem sido frequente e já atrapalha bastante.”" },
      { level: 4, label: "marcado / generalizado", anchor: "Rigidez comportamental é intenso, aparece em múltiplos contextos e tem peso relevante na definição de suporte e prognóstico.", phrase: "“É muito marcado, aparece em vários contextos e pesa bastante no dia.”" },
    ],
  },
  {
    number: 86,
    name: "Oposição reativa versus sobrecarga",
    domain: 5,
    levels: [
      { level: 0, label: "ausente", anchor: "Não se observam sinais clinicamente relevantes de oposição reativa versus sobrecarga.", phrase: "“Isso não chama atenção no dia a dia.”" },
      { level: 1, label: "leve / ocasional", anchor: "Oposição reativa versus sobrecarga aparece de forma rara, breve ou leve, sem repercussão funcional consistente.", phrase: "“Acontece de vez em quando, mas passa rápido.”" },
      { level: 2, label: "situacional", anchor: "Oposição reativa versus sobrecarga surge em gatilhos específicos e já merece registro, embora ainda não seja um padrão amplo e contínuo.", phrase: "“Quando sai da rotina ou aperta mais, isso aparece.”" },
      { level: 3, label: "frequente", anchor: "Oposição reativa versus sobrecarga é frequente e já interfere de modo perceptível no funcionamento, pedindo adaptações ambientais e leitura integrada.", phrase: "“Tem sido frequente e já atrapalha bastante.”" },
      { level: 4, label: "marcado / generalizado", anchor: "Oposição reativa versus sobrecarga é intenso, aparece em múltiplos contextos e tem peso relevante na definição de suporte e prognóstico.", phrase: "“É muito marcado, aparece em vários contextos e pesa bastante no dia.”" },
    ],
  },
  {
    number: 87,
    name: "Autoagressão",
    domain: 5,
    levels: [
      { level: 0, label: "ausente", anchor: "Não se observam sinais clinicamente relevantes de autoagressão.", phrase: "“Isso não chama atenção no dia a dia.”" },
      { level: 1, label: "leve / ocasional", anchor: "Autoagressão aparece de forma rara, breve ou leve, sem repercussão funcional consistente.", phrase: "“Acontece de vez em quando, mas passa rápido.”" },
      { level: 2, label: "situacional", anchor: "Autoagressão surge em gatilhos específicos e já merece registro, embora ainda não seja um padrão amplo e contínuo.", phrase: "“Quando sai da rotina ou aperta mais, isso aparece.”" },
      { level: 3, label: "frequente", anchor: "Autoagressão é frequente e já interfere de modo perceptível no funcionamento, pedindo adaptações ambientais e leitura integrada.", phrase: "“Tem sido frequente e já atrapalha bastante.”" },
      { level: 4, label: "marcado / generalizado", anchor: "Autoagressão é intenso, aparece em múltiplos contextos e tem peso relevante na definição de suporte e prognóstico.", phrase: "“É muito marcado, aparece em vários contextos e pesa bastante no dia.”" },
    ],
  },
  {
    number: 88,
    name: "Heteroagressão",
    domain: 5,
    levels: [
      { level: 0, label: "ausente", anchor: "Não se observam sinais clinicamente relevantes de heteroagressão.", phrase: "“Isso não chama atenção no dia a dia.”" },
      { level: 1, label: "leve / ocasional", anchor: "Heteroagressão aparece de forma rara, breve ou leve, sem repercussão funcional consistente.", phrase: "“Acontece de vez em quando, mas passa rápido.”" },
      { level: 2, label: "situacional", anchor: "Heteroagressão surge em gatilhos específicos e já merece registro, embora ainda não seja um padrão amplo e contínuo.", phrase: "“Quando sai da rotina ou aperta mais, isso aparece.”" },
      { level: 3, label: "frequente", anchor: "Heteroagressão é frequente e já interfere de modo perceptível no funcionamento, pedindo adaptações ambientais e leitura integrada.", phrase: "“Tem sido frequente e já atrapalha bastante.”" },
      { level: 4, label: "marcado / generalizado", anchor: "Heteroagressão é intenso, aparece em múltiplos contextos e tem peso relevante na definição de suporte e prognóstico.", phrase: "“É muito marcado, aparece em vários contextos e pesa bastante no dia.”" },
    ],
  },
  {
    number: 89,
    name: "Segurança e percepção de risco",
    domain: 5,
    levels: [
      { level: 0, label: "ausente", anchor: "Segurança e percepção de risco não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Segurança e percepção de risco aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Segurança e percepção de risco surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Segurança e percepção de risco já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Segurança e percepção de risco está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 90,
    name: "Pistas passivas de humor deprimido",
    domain: 5,
    levels: [
      { level: 0, label: "ausente", anchor: "Não se observam sinais clinicamente relevantes de pistas passivas de humor deprimido.", phrase: "“Isso não chama atenção no dia a dia.”" },
      { level: 1, label: "leve / ocasional", anchor: "Pistas passivas de humor deprimido aparece de forma rara, breve ou leve, sem repercussão funcional consistente.", phrase: "“Acontece de vez em quando, mas passa rápido.”" },
      { level: 2, label: "situacional", anchor: "Pistas passivas de humor deprimido surge em gatilhos específicos e já merece registro, embora ainda não seja um padrão amplo e contínuo.", phrase: "“Quando sai da rotina ou aperta mais, isso aparece.”" },
      { level: 3, label: "frequente", anchor: "Pistas passivas de humor deprimido é frequente e já interfere de modo perceptível no funcionamento, pedindo adaptações ambientais e leitura integrada.", phrase: "“Tem sido frequente e já atrapalha bastante.”" },
      { level: 4, label: "marcado / generalizado", anchor: "Pistas passivas de humor deprimido é intenso, aparece em múltiplos contextos e tem peso relevante na definição de suporte e prognóstico.", phrase: "“É muito marcado, aparece em vários contextos e pesa bastante no dia.”" },
    ],
  },
  {
    number: 91,
    name: "Pistas passivas de crises paroxísticas",
    domain: 5,
    levels: [
      { level: 0, label: "ausente", anchor: "Não se observam sinais clinicamente relevantes de pistas passivas de crises paroxísticas.", phrase: "“Isso não chama atenção no dia a dia.”" },
      { level: 1, label: "leve / ocasional", anchor: "Pistas passivas de crises paroxísticas aparece de forma rara, breve ou leve, sem repercussão funcional consistente.", phrase: "“Acontece de vez em quando, mas passa rápido.”" },
      { level: 2, label: "situacional", anchor: "Pistas passivas de crises paroxísticas surge em gatilhos específicos e já merece registro, embora ainda não seja um padrão amplo e contínuo.", phrase: "“Quando sai da rotina ou aperta mais, isso aparece.”" },
      { level: 3, label: "frequente", anchor: "Pistas passivas de crises paroxísticas é frequente e já interfere de modo perceptível no funcionamento, pedindo adaptações ambientais e leitura integrada.", phrase: "“Tem sido frequente e já atrapalha bastante.”" },
      { level: 4, label: "marcado / generalizado", anchor: "Pistas passivas de crises paroxísticas é intenso, aparece em múltiplos contextos e tem peso relevante na definição de suporte e prognóstico.", phrase: "“É muito marcado, aparece em vários contextos e pesa bastante no dia.”" },
    ],
  },
  {
    number: 92,
    name: "Eventos noturnos e sono",
    domain: 5,
    levels: [
      { level: 0, label: "ausente", anchor: "Não se observam sinais clinicamente relevantes de eventos noturnos e sono.", phrase: "“Isso não chama atenção no dia a dia.”" },
      { level: 1, label: "leve / ocasional", anchor: "Eventos noturnos e sono aparece de forma rara, breve ou leve, sem repercussão funcional consistente.", phrase: "“Acontece de vez em quando, mas passa rápido.”" },
      { level: 2, label: "situacional", anchor: "Eventos noturnos e sono surge em gatilhos específicos e já merece registro, embora ainda não seja um padrão amplo e contínuo.", phrase: "“Quando sai da rotina ou aperta mais, isso aparece.”" },
      { level: 3, label: "frequente", anchor: "Eventos noturnos e sono é frequente e já interfere de modo perceptível no funcionamento, pedindo adaptações ambientais e leitura integrada.", phrase: "“Tem sido frequente e já atrapalha bastante.”" },
      { level: 4, label: "marcado / generalizado", anchor: "Eventos noturnos e sono é intenso, aparece em múltiplos contextos e tem peso relevante na definição de suporte e prognóstico.", phrase: "“É muito marcado, aparece em vários contextos e pesa bastante no dia.”" },
    ],
  },
  {
    number: 93,
    name: "Sinais de dor somática ou cefaleia",
    domain: 5,
    levels: [
      { level: 0, label: "ausente", anchor: "Não se observam sinais clinicamente relevantes de sinais de dor somática ou cefaleia.", phrase: "“Isso não chama atenção no dia a dia.”" },
      { level: 1, label: "leve / ocasional", anchor: "Sinais de dor somática ou cefaleia aparece de forma rara, breve ou leve, sem repercussão funcional consistente.", phrase: "“Acontece de vez em quando, mas passa rápido.”" },
      { level: 2, label: "situacional", anchor: "Sinais de dor somática ou cefaleia surge em gatilhos específicos e já merece registro, embora ainda não seja um padrão amplo e contínuo.", phrase: "“Quando sai da rotina ou aperta mais, isso aparece.”" },
      { level: 3, label: "frequente", anchor: "Sinais de dor somática ou cefaleia é frequente e já interfere de modo perceptível no funcionamento, pedindo adaptações ambientais e leitura integrada.", phrase: "“Tem sido frequente e já atrapalha bastante.”" },
      { level: 4, label: "marcado / generalizado", anchor: "Sinais de dor somática ou cefaleia é intenso, aparece em múltiplos contextos e tem peso relevante na definição de suporte e prognóstico.", phrase: "“É muito marcado, aparece em vários contextos e pesa bastante no dia.”" },
    ],
  },
  {
    number: 94,
    name: "Impacto gastrointestinal funcional",
    domain: 5,
    levels: [
      { level: 0, label: "ausente", anchor: "Não se observam sinais clinicamente relevantes de impacto gastrointestinal funcional.", phrase: "“Isso não chama atenção no dia a dia.”" },
      { level: 1, label: "leve / ocasional", anchor: "Impacto gastrointestinal funcional aparece de forma rara, breve ou leve, sem repercussão funcional consistente.", phrase: "“Acontece de vez em quando, mas passa rápido.”" },
      { level: 2, label: "situacional", anchor: "Impacto gastrointestinal funcional surge em gatilhos específicos e já merece registro, embora ainda não seja um padrão amplo e contínuo.", phrase: "“Quando sai da rotina ou aperta mais, isso aparece.”" },
      { level: 3, label: "frequente", anchor: "Impacto gastrointestinal funcional é frequente e já interfere de modo perceptível no funcionamento, pedindo adaptações ambientais e leitura integrada.", phrase: "“Tem sido frequente e já atrapalha bastante.”" },
      { level: 4, label: "marcado / generalizado", anchor: "Impacto gastrointestinal funcional é intenso, aparece em múltiplos contextos e tem peso relevante na definição de suporte e prognóstico.", phrase: "“É muito marcado, aparece em vários contextos e pesa bastante no dia.”" },
    ],
  },
  {
    number: 95,
    name: "Sobrecarga familiar observável",
    domain: 5,
    levels: [
      { level: 0, label: "ausente", anchor: "Não se observam sinais clinicamente relevantes de sobrecarga familiar observável.", phrase: "“Isso não chama atenção no dia a dia.”" },
      { level: 1, label: "leve / ocasional", anchor: "Sobrecarga familiar observável aparece de forma rara, breve ou leve, sem repercussão funcional consistente.", phrase: "“Acontece de vez em quando, mas passa rápido.”" },
      { level: 2, label: "situacional", anchor: "Sobrecarga familiar observável surge em gatilhos específicos e já merece registro, embora ainda não seja um padrão amplo e contínuo.", phrase: "“Quando sai da rotina ou aperta mais, isso aparece.”" },
      { level: 3, label: "frequente", anchor: "Sobrecarga familiar observável é frequente e já interfere de modo perceptível no funcionamento, pedindo adaptações ambientais e leitura integrada.", phrase: "“Tem sido frequente e já atrapalha bastante.”" },
      { level: 4, label: "marcado / generalizado", anchor: "Sobrecarga familiar observável é intenso, aparece em múltiplos contextos e tem peso relevante na definição de suporte e prognóstico.", phrase: "“É muito marcado, aparece em vários contextos e pesa bastante no dia.”" },
    ],
  },
  {
    number: 96,
    name: "Necessidade de previsibilidade ambiental",
    domain: 5,
    levels: [
      { level: 0, label: "ausente", anchor: "Não se observam sinais clinicamente relevantes de necessidade de previsibilidade ambiental.", phrase: "“Isso não chama atenção no dia a dia.”" },
      { level: 1, label: "leve / ocasional", anchor: "Necessidade de previsibilidade ambiental aparece de forma rara, breve ou leve, sem repercussão funcional consistente.", phrase: "“Acontece de vez em quando, mas passa rápido.”" },
      { level: 2, label: "situacional", anchor: "Necessidade de previsibilidade ambiental surge em gatilhos específicos e já merece registro, embora ainda não seja um padrão amplo e contínuo.", phrase: "“Quando sai da rotina ou aperta mais, isso aparece.”" },
      { level: 3, label: "frequente", anchor: "Necessidade de previsibilidade ambiental é frequente e já interfere de modo perceptível no funcionamento, pedindo adaptações ambientais e leitura integrada.", phrase: "“Tem sido frequente e já atrapalha bastante.”" },
      { level: 4, label: "marcado / generalizado", anchor: "Necessidade de previsibilidade ambiental é intenso, aparece em múltiplos contextos e tem peso relevante na definição de suporte e prognóstico.", phrase: "“É muito marcado, aparece em vários contextos e pesa bastante no dia.”" },
    ],
  },
  {
    number: 97,
    name: "Capacidade de permanência escolar",
    domain: 5,
    levels: [
      { level: 0, label: "ausente", anchor: "Capacidade de permanência escolar não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Capacidade de permanência escolar aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Capacidade de permanência escolar surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Capacidade de permanência escolar já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Capacidade de permanência escolar está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 98,
    name: "Necessidade de apoio escolar individualizado",
    domain: 5,
    levels: [
      { level: 0, label: "ausente", anchor: "Não se observam sinais clinicamente relevantes de necessidade de apoio escolar individualizado.", phrase: "“Isso não chama atenção no dia a dia.”" },
      { level: 1, label: "leve / ocasional", anchor: "Necessidade de apoio escolar individualizado aparece de forma rara, breve ou leve, sem repercussão funcional consistente.", phrase: "“Acontece de vez em quando, mas passa rápido.”" },
      { level: 2, label: "situacional", anchor: "Necessidade de apoio escolar individualizado surge em gatilhos específicos e já merece registro, embora ainda não seja um padrão amplo e contínuo.", phrase: "“Quando sai da rotina ou aperta mais, isso aparece.”" },
      { level: 3, label: "frequente", anchor: "Necessidade de apoio escolar individualizado é frequente e já interfere de modo perceptível no funcionamento, pedindo adaptações ambientais e leitura integrada.", phrase: "“Tem sido frequente e já atrapalha bastante.”" },
      { level: 4, label: "marcado / generalizado", anchor: "Necessidade de apoio escolar individualizado é intenso, aparece em múltiplos contextos e tem peso relevante na definição de suporte e prognóstico.", phrase: "“É muito marcado, aparece em vários contextos e pesa bastante no dia.”" },
    ],
  },
  {
    number: 99,
    name: "Convergência multiprofissional dos achados",
    domain: 5,
    levels: [
      { level: 0, label: "ausente", anchor: "Convergência multiprofissional dos achados não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Convergência multiprofissional dos achados aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Convergência multiprofissional dos achados surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Convergência multiprofissional dos achados já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Convergência multiprofissional dos achados está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
  {
    number: 100,
    name: "Potencial de aprendizagem e prognóstico dinâmico",
    domain: 5,
    levels: [
      { level: 0, label: "ausente", anchor: "Potencial de aprendizagem e prognóstico dinâmico não se evidencia de modo útil no cotidiano; a criança não sustenta esse recurso de forma espontânea.", phrase: "“Ele ainda não faz isso sozinho.”" },
      { level: 1, label: "muito frágil", anchor: "Potencial de aprendizagem e prognóstico dinâmico aparece apenas sob convite intenso, modelagem forte ou contexto muito facilitado.", phrase: "“Só acontece quando a gente puxa muito.”" },
      { level: 2, label: "inconsistente", anchor: "Potencial de aprendizagem e prognóstico dinâmico surge em alguns momentos, mas oscila bastante, depende do contexto e não se mantém com estabilidade.", phrase: "“Tem dias que aparece e tem dias que some.”" },
      { level: 3, label: "funcional parcial", anchor: "Potencial de aprendizagem e prognóstico dinâmico já aparece de forma funcional em parte do cotidiano, porém ainda com custo, oscilação ou baixa generalização.", phrase: "“Já consegue em boa parte das vezes, mas ainda varia bastante.”" },
      { level: 4, label: "espontâneo e generalizado", anchor: "Potencial de aprendizagem e prognóstico dinâmico está presente de forma espontânea, estável e generalizada entre ambientes, com boa utilidade funcional.", phrase: "“Faz sozinho, em vários lugares, sem precisar puxar.”" },
    ],
  },
];

export function classifyPantDomain(scores: number[], scaleCount: number): {
  average: number;
  classification: string;
  color: string;
  description: string;
} {
  const total = scores.reduce((s, v) => s + v, 0);
  const average = scaleCount > 0 ? total / scaleCount : 0;
  const rounded = Math.round(average * 100) / 100;

  if (average >= 3.5) return {
    average: rounded,
    classification: "Espontâneo e Generalizado",
    color: "text-emerald-600 dark:text-emerald-400",
    description: "Competências presentes de forma estável e generalizada entre ambientes."
  };
  if (average >= 2.5) return {
    average: rounded,
    classification: "Funcional Parcial",
    color: "text-blue-600 dark:text-blue-400",
    description: "Funcional em parte do cotidiano, porém com oscilação dependente de contexto e suporte."
  };
  if (average >= 1.5) return {
    average: rounded,
    classification: "Inconsistente",
    color: "text-amber-600 dark:text-amber-400",
    description: "Surge em alguns momentos, oscila bastante, dependente de contexto e mediação."
  };
  if (average >= 0.5) return {
    average: rounded,
    classification: "Muito Frágil",
    color: "text-orange-600 dark:text-orange-400",
    description: "Aparece apenas sob convite intenso ou contexto muito facilitado."
  };
  return {
    average: rounded,
    classification: "Ausente",
    color: "text-red-600 dark:text-red-400",
    description: "Recurso ainda não aparece ou frequência muito baixa."
  };
}