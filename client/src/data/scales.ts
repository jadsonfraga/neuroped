// M-CHAT-R/F e Denver II saíram em 17/10/2026 (licenciados): ficha de referência + alternativa no app.
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
