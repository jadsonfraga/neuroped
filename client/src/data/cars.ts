// CARS — registro descritivo interno. Não equivale à aplicação oficial CARS-2.
export const carsCategories = [
  { name: "Relação com as pessoas", options: ["Nenhuma dificuldade ou anormalidade — comportamento adequado para a idade", "Levemente anormal — alguma timidez, agitação ou irritação leve", "Moderadamente anormal — evita adultos, precisa de estímulo excessivo para responder", "Gravemente anormal — extremamente retraído, quase nunca responde ou inicia contato"] },
  { name: "Imitação", options: ["Apropriada — imita sons, palavras e movimentos adequadamente", "Levemente anormal — imita comportamentos simples, com algum atraso", "Moderadamente anormal — imita só às vezes e com ajuda do adulto", "Gravemente anormal — raramente ou nunca imita sons, palavras ou movimentos"] },
  { name: "Resposta emocional", options: ["Adequada para a idade e situação", "Levemente anormal — respostas emocionais por vezes inadequadas ao tipo ou intensidade", "Moderadamente anormal — sinais de resposta inadequada; reação exagerada ou sem relação com a situação", "Gravemente anormal — respostas raramente adequadas; humor muito rígido; reações extremas sem motivo aparente"] },
  { name: "Uso do corpo", options: ["Adequado para a idade — boa coordenação e uso funcional", "Levemente anormal — algumas peculiaridades menores (desajeitamento, movimentos repetitivos leves)", "Moderadamente anormal — comportamentos claramente estranhos ou incomuns para a idade (movimentos estereotipados, postura incomum)", "Gravemente anormal — movimentos contínuos, bizarros e intensos, que não cessam mesmo com redirecionamento"] },
  { name: "Uso de objetos", options: ["Interesse e uso apropriado de brinquedos e objetos", "Levemente anormal — interesse reduzido ou uso levemente incomum de objetos", "Moderadamente anormal — pouco interesse em brinquedos; uso repetitivo ou incomum de objetos", "Gravemente anormal — preocupação intensa com partes de objetos; movimentos repetitivos com objetos"] },
  { name: "Adaptação a mudanças", options: ["Resposta adequada — aceita mudanças de rotina sem grandes dificuldades", "Levemente anormal — tenta continuar atividade anterior ou resiste inicialmente à mudança", "Moderadamente anormal — resiste ativamente a mudanças; tenta continuar antiga atividade de forma persistente", "Gravemente anormal — reação severa a mudanças; raiva ou recusa intensa; muito difícil redirecionamento"] },
  { name: "Resposta visual", options: ["Adequada para a idade", "Levemente anormal — precisa ser lembrado de olhar; mais interesse em espelhos ou luzes; olhar fixo no vazio", "Moderadamente anormal — olhar distante frequentemente; pode olhar objetos de ângulos incomuns; leva objetos próximos aos olhos", "Gravemente anormal — evita consistentemente olhar para pessoas ou objetos; apresenta formas extremas de peculiaridade visual"] },
  { name: "Resposta auditiva", options: ["Adequada para a idade", "Levemente anormal — alguma falta de resposta ou leve hipersensibilidade a sons", "Moderadamente anormal — resposta variável a sons; frequentemente ignora sons na primeira vez; pode assustar-se com sons do cotidiano", "Gravemente anormal — hiper ou hipo-reatividade extrema aos sons, independente do tipo"] },
  { name: "Resposta ao paladar, olfato e tato", options: ["Normal — explora objetos de forma adequada para a idade", "Levemente anormal — alguma exploração oral de objetos; reação leve a dor ou texturas", "Moderadamente anormal — preocupação moderada em cheirar, tocar ou provar objetos ou pessoas; reação moderada a dor ou texturas", "Gravemente anormal — preocupação intensa em cheirar, tocar, provar; reação extrema a dor, texturas ou temperaturas"] },
  { name: "Medo ou nervosismo", options: ["Normal — reações de medo adequadas para a idade e situação", "Levemente anormal — medo leve a mais ou a menos que o esperado para a idade e situação", "Moderadamente anormal — medo acima ou abaixo do normal, mesmo em situações benignas", "Gravemente anormal — medo extremo de itens inofensivos ou ausência de medo em situações perigosas"] },
  { name: "Comunicação verbal", options: ["Normal para a idade", "Levemente anormal — atraso leve na fala; linguagem significativa, com alguma ecolalia ou inversão pronominal", "Moderadamente anormal — fala pode estar ausente; quando presente, mistura com linguagem peculiar (ecolalia, jargão)", "Gravemente anormal — fala ausente ou ininteligível; grunhidos, gritos, sons estranhos; uso bizarro de palavras reconhecíveis"] },
  { name: "Comunicação não-verbal", options: ["Normal para a idade — usa gestos e expressões faciais adequados", "Levemente anormal — uso imaturo de comunicação não-verbal (aponta ou pega vagamente o que quer)", "Moderadamente anormal — geralmente incapaz de expressar desejos/necessidades de forma não-verbal; dificuldade em compreender comunicação não-verbal de outros", "Gravemente anormal — usa apenas gestos bizarros sem significado aparente; sem apreciação de gestos ou expressões faciais de outros"] },
  { name: "Nível de atividade", options: ["Normal para a idade e situação", "Levemente anormal — hiperatividade leve ou alguma letargia; leve inquietação", "Moderadamente anormal — bastante ativo ou lento; difícil de controlar; nível de atividade varia da hiperatividade à letargia", "Gravemente anormal — nível de atividade extremo (constantemente ativo ou muito letárgico); pode alternar entre os dois"] },
  { name: "Nível e consistência da resposta intelectual", options: ["Inteligência normal — sem habilidades ou dificuldades incomuns", "Levemente anormal — habilidades menos atrasadas que o típico; poucas habilidades especiais peculiares", "Moderadamente anormal — menos inteligente que o típico, mas funcional em algumas áreas; habilidades especiais ilhadas", "Gravemente anormal — menos inteligente que o típico com grande variação de habilidades; habilidades especiais chamativas em áreas restritas"] },
  { name: "Impressão geral", options: ["Sem autismo — a criança não apresenta características de autismo", "Autismo leve — poucos ou leves sintomas de autismo", "Autismo moderado — vários sintomas de autismo", "Autismo grave — muitos ou graves sintomas de autismo"] },
] as const;

export function classifyCars(score: number): { classification: string; description: string; color: string } {
  if (score < 30) return {
    classification: "Sem Autismo",
    description: "A pontuação não indica presença de Transtorno do Espectro Autista. A criança pode ser acompanhada na rotina pediátrica habitual.",
    color: "text-emerald-600 dark:text-emerald-400",
  };
  if (score <= 36) return {
    classification: "Autismo Leve a Moderado",
    description: "A pontuação sugere autismo leve a moderado. Recomenda-se encaminhamento para avaliação especializada multidisciplinar.",
    color: "text-amber-600 dark:text-amber-400",
  };
  return {
    classification: "Autismo Moderado a Grave",
    description: "A pontuação sugere autismo moderado a grave. É essencial o encaminhamento imediato para avaliação e intervenção especializadas.",
    color: "text-red-600 dark:text-red-400",
  };
}
