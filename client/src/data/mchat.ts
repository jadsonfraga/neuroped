export const mchatQuestions = [
  "Se você aponta algo do outro lado do quarto, seu filho olha para esse objeto?",
  "Você já se perguntou se seu filho poderia ser surdo?",
  "Seu filho brinca de faz de conta? (Ex: finge beber de um copo vazio, finge falar ao telefone, finge alimentar uma boneca)",
  "Seu filho gosta de subir em coisas? (Ex: móveis, brinquedos do playground, escadas)",
  "Seu filho faz movimentos incomuns com os dedos perto dos olhos?",
  "Seu filho aponta com o dedo indicador para pedir algo ou para pedir ajuda?",
  "Seu filho aponta com o dedo indicador para mostrar algo interessante?",
  "Seu filho se interessa por outras crianças?",
  "Seu filho traz objetos para mostrar a você?",
  "Seu filho responde quando você o chama pelo nome?",
  "Quando você sorri para seu filho, ele sorri de volta?",
  "Seu filho fica incomodado com barulhos do cotidiano? (Ex: aspirador, música alta)",
  "Seu filho anda?",
  "Seu filho olha nos seus olhos quando você fala, brinca ou veste?",
  "Seu filho tenta copiar o que você faz? (Ex: acenar tchau, bater palmas)",
  "Se você virar a cabeça para olhar algo, seu filho olha ao redor para ver o que está observando?",
  "Seu filho tenta fazer você olhar para ele?",
  "Seu filho compreende quando você diz algo? (Ex: sem gestos: coloca na mesa, me dá o cobertor)",
  "Quando acontece algo novo, seu filho olha para seu rosto para ver como você se sente?",
  "Seu filho gosta de atividades de movimento? (Ex: ser balançado, ser erguido no joelho)",
] as const;

// Itens críticos do M-CHAT (índices 0-based).
export const mchatCriticalItems = [2, 5, 6, 7, 9, 13, 14, 15] as const;

// Itens invertidos: resposta "sim" indica risco (índices 0-based).
export const mchatReversedItems = [1, 4, 11] as const;

export function classifyMchat(score: number): { risk: string; description: string; color: string } {
  if (score <= 2) return {
    risk: "Baixo Risco",
    description: "Resultado dentro da normalidade. O acompanhamento pediátrico de rotina é suficiente. Se a criança for menor de 24 meses, reavaliar aos 24 meses.",
    color: "text-emerald-600 dark:text-emerald-400",
  };
  if (score <= 7) return {
    risk: "Risco Moderado",
    description: "Recomenda-se a aplicação da Entrevista de Seguimento (Follow-up). Se o escore do follow-up permanecer ≥ 2, encaminhar para avaliação diagnóstica especializada.",
    color: "text-amber-600 dark:text-amber-400",
  };
  return {
    risk: "Alto Risco",
    description: "Encaminhamento imediato para avaliação diagnóstica e intervenção precoce. Não é necessário aguardar a Entrevista de Seguimento.",
    color: "text-red-600 dark:text-red-400",
  };
}
