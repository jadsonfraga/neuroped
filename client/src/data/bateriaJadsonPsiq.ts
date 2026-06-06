// ── ECAR-SI J26 — Escala Clínica de Risco de Autoagressão e Suicidalidade ──
export const ecarsiLabels = [
  "0 — Ausente",
  "1 — Discreto / remoto",
  "2 — Presente e relevante",
  "3 — Grave / recente",
];

export const ecarsiProtectiveLabels = [
  "0 — Ausente",
  "1 — Frágil",
  "2 — Presente",
  "3 — Forte",
];

export const ecarsiDomains = [
  {
    name: "A. Pensamento de morte",
    color: "text-red-600 dark:text-red-400",
    items: [
      "Nas últimas semanas, referiu cansaço de viver, desesperança ou sensação de que a vida perdeu o sentido.",
      "Expressou desejo de desaparecer, sumir ou não acordar mais, sem formular ato concreto.",
      "Demonstrou fala recorrente de vazio, inutilidade extrema ou ideia de ser um peso para os outros.",
      "Houve piora recente desse conteúdo, com maior frequência ou intensidade.",
    ],
  },
  {
    name: "B. Ideação suicida",
    color: "text-red-600 dark:text-red-400",
    items: [
      "Admitiu pensamento de provocar a própria morte, ainda que de forma vaga.",
      "Esses pensamentos ocorreram mais de uma vez nos últimos dias ou semanas.",
      "A ideia apareceu de modo espontâneo, não apenas como resposta genérica de raiva ou frustração.",
      "O paciente relatou dificuldade real de afastar esses pensamentos quando surgem.",
    ],
  },
  {
    name: "C. Progressão e gravidade",
    color: "text-red-600 dark:text-red-400",
    items: [
      "Os pensamentos passaram de algo genérico para algo mais concreto.",
      "O paciente já imaginou uma forma específica de se ferir ou morrer.",
      "Houve momento em que pareceu considerar essa possibilidade como uma saída real.",
      "A intensidade atual sugere sofrimento psíquico relevante e risco não banal.",
    ],
  },
  {
    name: "D. Intenção e proximidade",
    color: "text-red-600 dark:text-red-400",
    items: [
      "Em algum momento recente, pareceu haver vontade real de executar o ato, e não apenas pensamento passageiro.",
      "O paciente descreve sensação de perda de controle diante desses impulsos ou pensamentos.",
      "Relata que poderia agir se ficasse sozinho, desregulado ou sem supervisão.",
      "Há sinais de risco atual que exigem resposta rápida da equipe ou da família.",
    ],
  },
  {
    name: "E. Planejamento",
    color: "text-red-600 dark:text-red-400",
    items: [
      "Houve organização mental prévia sobre quando, onde ou em que contexto poderia ocorrer autoagressão grave.",
      "O paciente estruturou mentalmente algum passo preparatório para isso.",
      "Há maior definição do plano do que em avaliações anteriores.",
      "O planejamento, se presente, parece recente, repetido ou progressivamente mais consistente.",
    ],
  },
  {
    name: "F. Comportamentos preparatórios",
    color: "text-red-600 dark:text-red-400",
    items: [
      "Houve aproximação prática de objetos, locais, situações ou condições associadas ao risco.",
      "O paciente deixou mensagens, despedidas, conteúdos ambíguos ou sinais indiretos de encerramento.",
      "Passou a organizar pertences, encerrar vínculos ou agir como se estivesse se despedindo.",
      "A família ou a equipe percebeu mudança comportamental suspeita de preparação.",
    ],
  },
  {
    name: "G. Autoagressão e histórico",
    color: "text-red-600 dark:text-red-400",
    items: [
      "Existe história prévia de autoagressão intencional.",
      "Existe história de comportamento com potencial letal ou tentativa interrompida.",
      "Houve recorrência, escalada ou redução do intervalo entre episódios.",
      "O episódio mais recente ocorreu em janela temporal clinicamente preocupante.",
    ],
  },
  {
    name: "H. Fatores agravantes",
    color: "text-red-600 dark:text-red-400",
    items: [
      "Há impulsividade importante, agitação, intoxicação, descontrole afetivo ou rebaixamento do juízo crítico.",
      "Existe quadro depressivo, episódio misto, psicose, trauma recente, bullying, abuso, conflito grave ou perda significativa.",
      "Há isolamento importante, ruptura relacional ou baixa supervisão ambiental.",
      "O paciente demonstra baixa capacidade atual de pedir ajuda antes de agir.",
    ],
  },
  {
    name: "I. Fatores protetores (invertido)",
    color: "text-emerald-600 dark:text-emerald-400",
    items: [
      "Existe vínculo afetivo confiável com pelo menos um adulto protetor.",
      "O paciente aceita ajuda e consegue comunicar sofrimento antes de piorar.",
      "Há supervisão consistente, ambiente protegido e redução real de risco no domicílio.",
      "Existem razões concretas para viver, projetos, crenças, apego familiar ou senso de pertencimento que seguem ativos.",
    ],
  },
];

export function classifyEcarsi(riskScore: number, protectionScore: number) {
  const finalScore = riskScore - protectionScore;
  if (finalScore <= 12) return { classification: "Baixo", color: "emerald", description: "Risco baixo no momento. Manter acompanhamento clínico regular e orientação familiar sobre sinais de alerta." };
  if (finalScore <= 24) return { classification: "Leve a moderado", color: "amber", description: "Risco leve a moderado. Recomenda-se acompanhamento mais frequente, psicoeducação familiar, verificação de acesso a meios e plano de segurança." };
  if (finalScore <= 36) return { classification: "Moderado a importante", color: "orange", description: "Risco moderado a importante. Necessário plano de segurança ativo, supervisão intensificada, comunicação com família e equipe, avaliação psiquiátrica urgente." };
  if (finalScore <= 48) return { classification: "Alto", color: "red", description: "Risco alto. Avaliação psiquiátrica imediata, supervisão contínua, considerar internação ou observação em ambiente protegido. Acionar rede de suporte." };
  return { classification: "Muito alto", color: "red", description: "Risco muito alto. Encaminhamento emergencial imediato. Supervisão contínua sem interrupção. Considerar internação involuntária se necessário. SAMU 192 / CVV 188." };
}

// ── EDI-J26 — Escala de Depressão Infantil ──────────────────────────
export const ediLabels = [
  "0 — Nunca/ausente",
  "1 — Raro/leve",
  "2 — Frequente/moderado",
  "3 — Intenso/muito frequente",
];

export const ediDomains = [
  {
    name: "Sintomas Depressivos",
    color: "text-sky-600 dark:text-sky-400",
    items: [
      "Fica triste, desanimado ou \"para baixo\" na maior parte dos dias.",
      "Perdeu interesse por brincadeiras, atividades ou coisas que antes gostava.",
      "Demonstra pouca alegria mesmo em situações normalmente prazerosas.",
      "Parece cansado, lento ou sem energia com frequência.",
      "Irrita-se facilmente sem motivo proporcional.",
      "Chora com maior facilidade que o habitual.",
      "Fala mal de si mesmo ou parece se achar \"ruim\", \"incapaz\" ou \"sem valor\".",
      "Mostra culpa exagerada por erros pequenos.",
      "Acredita que nada vai melhorar.",
      "Parece sem esperança em relação ao futuro.",
      "Afasta-se de amigos, colegas ou familiares.",
      "Participa menos de conversas, jogos ou interações.",
      "Dorme pior do que antes, dorme demais ou acorda muito.",
      "Come menos, mais do que antes, ou mostra mudança importante no apetite.",
      "Queixa-se de dor, cansaço ou mal-estar sem explicação proporcional.",
      "Tem dificuldade de se concentrar em aula, tarefas ou conversas.",
      "Parece \"desligado\" ou com pensamento lento.",
      "Fica muito sensível a críticas ou correções.",
      "Mostra perda de confiança nas próprias capacidades.",
      "Expressa que se sente sozinho, incompreendido ou sem importância.",
      "Demonstra vontade de desistir facilmente das tarefas.",
      "Apresenta piora no rendimento escolar associada ao humor.",
      "A família percebe mudança clara em comparação ao funcionamento prévio.",
      "Houve episódios recentes de fala sobre morte, sumir ou não querer mais viver.",
    ],
  },
];

export function classifyEdi(total: number) {
  if (total <= 12) return { classification: "Poucos sinais", color: "emerald", description: "Poucos sinais de sintomatologia depressiva. Manter acompanhamento de rotina." };
  if (total <= 24) return { classification: "Sinais leves", color: "amber", description: "Sinais leves de sintomatologia depressiva. Observar evolução, considerar avaliação mais detalhada se persistirem." };
  if (total <= 42) return { classification: "Clinicamente relevante", color: "orange", description: "Sintomatologia depressiva clinicamente relevante. Recomenda-se avaliação psiquiátrica e acompanhamento psicoterapêutico." };
  return { classification: "Importante", color: "red", description: "Sintomatologia depressiva importante. Avaliação psiquiátrica prioritária, investigar risco, considerar intervenção farmacológica e psicoterapêutica." };
}

// ── EAI-J26 — Escala de Ansiedade Infantil ──────────────────────────
export const eaiLabels = [
  "0 — Nunca/ausente",
  "1 — Raro/leve",
  "2 — Frequente/moderado",
  "3 — Intenso/muito frequente",
];

export const eaiDomains = [
  {
    name: "Sintomas Ansiosos",
    color: "text-amber-600 dark:text-amber-400",
    items: [
      "Preocupa-se demais com coisas do dia a dia.",
      "Antecipadamente já teme que algo ruim aconteça.",
      "Faz muitas perguntas para ter certeza de que está tudo bem.",
      "Tem dificuldade de relaxar mesmo em ambiente seguro.",
      "Fica muito tenso antes de escola, prova, consulta ou mudanças de rotina.",
      "Apresenta dor de barriga, náusea, dor de cabeça ou mal-estar quando está nervoso.",
      "Dorme pior por preocupação ou medo.",
      "Tem medo excessivo de errar.",
      "Precisa de muita confirmação dos pais ou adultos.",
      "Sofre muito com separações, atrasos ou ausência breve dos responsáveis.",
      "Fica em alerta excessivo diante de novidades.",
      "Evita atividades por medo de não conseguir.",
      "Demora a iniciar tarefas por insegurança.",
      "Assusta-se com facilidade.",
      "Fica inquieto, tenso ou \"travado\" em situações novas.",
      "Preocupa-se com saúde, acidentes, morte ou segurança de familiares.",
      "Tem crises de choro ou irritação motivadas por medo.",
      "Seu medo atrapalha escola, socialização ou rotina da família.",
      "A ansiedade parece maior do que a esperada para a idade.",
      "A família sente que a criança vive \"sempre preocupada\".",
    ],
  },
];

export function classifyEai(total: number) {
  if (total <= 10) return { classification: "Esperado", color: "emerald", description: "Nível de ansiedade dentro do esperado para a faixa etária. Sem necessidade de intervenção específica." };
  if (total <= 24) return { classification: "Sinais leves", color: "amber", description: "Sinais leves de ansiedade. Observar evolução e considerar orientação familiar e estratégias de manejo." };
  if (total <= 40) return { classification: "Relevante", color: "orange", description: "Ansiedade clinicamente relevante com impacto funcional. Recomenda-se avaliação e intervenção psicoterapêutica." };
  return { classification: "Importante", color: "red", description: "Ansiedade importante com prejuízo significativo. Avaliação psiquiátrica indicada, considerar terapia cognitivo-comportamental e, se necessário, suporte farmacológico." };
}

// ── EASI-J26 — Escala de Ansiedade Social Infantil ──────────────────
export const easiLabels = [
  "0 — Nunca/ausente",
  "1 — Raro/leve",
  "2 — Frequente/moderado",
  "3 — Intenso/muito frequente",
];

export const easiDomains = [
  {
    name: "Ansiedade Social",
    color: "text-orange-600 dark:text-orange-400",
    items: [
      "Evita falar com pessoas que não conhece bem.",
      "Fica muito envergonhado ao ser observado.",
      "Tem medo intenso de responder em sala, apresentar trabalho ou ler em voz alta.",
      "Evita pedir ajuda por vergonha.",
      "Fica muito preocupado com o que os outros vão pensar.",
      "Parece travar quando precisa interagir fora do círculo familiar.",
      "Evita festas, grupos, esportes ou atividades coletivas.",
      "Tem poucos amigos por dificuldade de aproximação.",
      "Fica ruborizado, tenso, choroso ou irritado em situações sociais.",
      "Sofre antes mesmo do evento social acontecer.",
      "Depois da interação, fica revendo se \"passou vergonha\".",
      "Fala menos do que consegue por medo de julgamento.",
      "Evita contato visual ou se esconde atrás dos pais/responsáveis.",
      "Mostra maior segurança em casa do que na escola ou em público.",
      "O medo social compromete amizades, escola ou participação em atividades.",
    ],
  },
];

export function classifyEasi(total: number) {
  if (total <= 8) return { classification: "Poucos sinais", color: "emerald", description: "Poucos sinais de ansiedade social. Comportamento compatível com timidez ou introversão típica." };
  if (total <= 20) return { classification: "Sinais leves", color: "amber", description: "Sinais leves de ansiedade social. Monitorar evolução e considerar suporte se houver impacto funcional." };
  if (total <= 32) return { classification: "Relevante", color: "orange", description: "Ansiedade social clinicamente relevante com impacto em socialização e/ou escola. Intervenção psicoterapêutica recomendada." };
  return { classification: "Importante", color: "red", description: "Ansiedade social importante com prejuízo significativo. Avaliação psiquiátrica, TCC com foco em exposição gradual e, se necessário, suporte medicamentoso." };
}

// ── EMS-J26 — Escala de Mutismo Seletivo ────────────────────────────
export const emsLabels = [
  "0 — Nunca/ausente",
  "1 — Raro/leve",
  "2 — Frequente/moderado",
  "3 — Intenso/muito frequente",
];

export const emsDomains = [
  {
    name: "Mutismo Seletivo",
    color: "text-violet-600 dark:text-violet-400",
    items: [
      "Fala normalmente em casa com pessoas íntimas.",
      "Fala muito menos ou não fala em escola, consultório ou ambientes externos.",
      "Demonstra vontade de responder, mas parece travar.",
      "Usa gestos, acenos ou cochichos no lugar da fala em certos contextos.",
      "Fica congelado, enrijecido ou muito tenso quando alguém lhe dirige a palavra em público.",
      "Evita iniciar conversas com professores, colegas ou outros adultos.",
      "O padrão se repete de forma consistente, e não apenas em um dia ruim.",
      "Não parece haver incapacidade de linguagem que explique sozinho o quadro.",
      "Em ambiente seguro, mostra vocabulário e fala melhores do que fora dele.",
      "A dificuldade interfere na aprendizagem, socialização ou participação escolar.",
      "O silêncio parece ligado a medo, vergonha ou ansiedade.",
      "A família e a escola descrevem contraste marcante entre \"fala em casa\" e \"não fala fora\".",
      "Mantém expressão facial tensa, pouca espontaneidade ou comportamento de esquiva quando é chamado a falar.",
      "Pode falar com uma ou duas pessoas específicas, mas não com a maioria.",
      "O quadro persiste além da fase esperada de adaptação.",
    ],
  },
];

export function classifyEms(total: number) {
  if (total <= 10) return { classification: "Improvável", color: "emerald", description: "Quadro de mutismo seletivo improvável. Pode representar timidez situacional ou fase adaptativa." };
  if (total <= 22) return { classification: "Sinais parciais", color: "amber", description: "Sinais parciais de mutismo seletivo. Observar evolução e considerar avaliação fonoaudiológica e psicológica." };
  if (total <= 34) return { classification: "Provável", color: "orange", description: "Quadro provável de mutismo seletivo. Avaliação multidisciplinar recomendada (psicologia, fonoaudiologia, psiquiatria). Intervenção precoce indicada." };
  return { classification: "Importante", color: "red", description: "Mutismo seletivo importante com grande impacto funcional. Intervenção especializada urgente com abordagem comportamental gradual e suporte escolar." };
}

// ── ETARE-J26 — Escala de Transtorno Alimentar Restritivo Evitativo ─
export const etareLabels = [
  "0 — Nunca/ausente",
  "1 — Raro/leve",
  "2 — Frequente/moderado",
  "3 — Intenso/muito frequente",
];

export const etareDomains = [
  {
    name: "TARE",
    color: "text-lime-600 dark:text-lime-400",
    items: [
      "Come variedade muito pequena de alimentos.",
      "Recusa alimentos por textura, cheiro, cor, temperatura ou aparência.",
      "Demonstra medo de engasgar, vomitar, passar mal ou sentir desconforto ao comer.",
      "Mostra pouco interesse em comer, mesmo após horas sem se alimentar.",
      "Leva muito tempo para aceitar novos alimentos.",
      "As refeições costumam gerar tensão, choro, irritação ou fuga.",
      "A família precisa adaptar excessivamente o cardápio para que a criança aceite comer.",
      "Há prejuízo no ganho de peso, crescimento ou estado nutricional.",
      "Já houve necessidade de suplemento, estratégias especiais ou suporte nutricional adicional.",
      "Evita comer em escola, festas ou fora de casa.",
      "O padrão alimentar causa prejuízo social relevante.",
      "A seletividade vai além do esperado para a idade.",
      "Não há foco principal em emagrecer ou mudar o corpo.",
      "O padrão alimentar parece rígido e persistente.",
      "Pequenas mudanças no alimento são mal toleradas.",
      "A rotina familiar gira em torno do problema alimentar.",
      "A criança aceita muito melhor \"marcas\", formatos ou preparos específicos.",
      "O quadro causa sofrimento claro na família ou na própria criança.",
    ],
  },
];

export function classifyEtare(total: number) {
  if (total <= 12) return { classification: "Leve/comum", color: "emerald", description: "Padrão alimentar dentro da faixa de seletividade leve ou comum para a idade. Orientação nutricional de rotina." };
  if (total <= 24) return { classification: "Relevante", color: "amber", description: "Seletividade alimentar relevante. Investigar impacto nutricional e considerar acompanhamento com fonoaudiologia e nutrição." };
  if (total <= 40) return { classification: "Provável TARE", color: "orange", description: "Quadro provável de Transtorno Alimentar Restritivo Evitativo. Avaliação multidisciplinar indicada (nutrição, fonoaudiologia, terapia ocupacional, psicologia)." };
  return { classification: "Importante", color: "red", description: "TARE importante com repercussão nutricional e/ou funcional significativa. Intervenção especializada urgente e monitoramento nutricional rigoroso." };
}

// ── EAAH-J26 — Escala de Autoagressividade e Heteroagressividade ────
export const eaahLabels = [
  "0 — Nunca/ausente",
  "1 — Raro/leve",
  "2 — Frequente/moderado",
  "3 — Intenso/muito frequente",
];

export const eaahProtectiveLabels = [
  "0 — Muito ruim",
  "1 — Frágil",
  "2 — Parcial",
  "3 — Bom",
];

export const eaahDomains = [
  {
    name: "A. Autoagressão",
    color: "text-red-600 dark:text-red-400",
    items: [
      "Morde-se, bate em si, arranha-se, puxa os cabelos ou se machuca de propósito.",
      "Bate a cabeça contra superfícies de forma repetitiva.",
      "A autoagressão aumenta em situações de frustração, sobrecarga sensorial ou mudança de rotina.",
      "Há marcas, feridas ou lesões visíveis decorrentes da autoagressão.",
      "A intensidade dos episódios dificulta cuidados, escola ou participação social.",
    ],
  },
  {
    name: "B. Heteroagressão e ambiente",
    color: "text-orange-600 dark:text-orange-400",
    items: [
      "Agride fisicamente cuidadores, colegas, professores ou profissionais.",
      "Destrói objetos, materiais, mobília ou pertences durante episódios de desregulação.",
      "Os episódios ocorrem com frequência superior a uma vez por semana.",
      "Há escalada na intensidade ou imprevisibilidade dos ataques.",
      "A agressão parece impulsiva, não planejada, e frequentemente seguida de arrependimento ou confusão.",
      "A agressão parece reativa a frustração, dor, medo, sobrecarga ou invasão sensorial.",
      "Ocorre em contexto de rigidez cognitiva, falta de linguagem funcional ou baixa compreensão social.",
      "Há risco real de lesão a terceiros.",
      "A família ou a escola já limitou atividades, saídas ou matrícula por causa do comportamento.",
      "O padrão gera sofrimento e sobrecarga importante para a família.",
      "Os episódios duram mais de 10 minutos ou ocorrem em sequência.",
      "A contenção física já foi necessária para evitar danos.",
    ],
  },
  {
    name: "C. Fatores protetores (invertido)",
    color: "text-emerald-600 dark:text-emerald-400",
    items: [
      "Existe ao menos uma estratégia conhecida que ajuda a regular a crise.",
      "A família e a escola compreendem os antecedentes e sabem antecipar parte dos episódios.",
      "Há acompanhamento terapêutico ativo e funcional.",
    ],
  },
];

export function classifyEaah(riskScore: number, protectionScore: number) {
  const total = riskScore - protectionScore;
  if (total <= 15) return { classification: "Baixos sinais", color: "emerald", description: "Poucos sinais de auto ou heteroagressividade. Manter acompanhamento de rotina e orientação familiar preventiva." };
  if (total <= 30) return { classification: "Leve a moderado", color: "amber", description: "Sinais leves a moderados. Investigar gatilhos, implementar estratégias de regulação e reforçar suporte terapêutico." };
  if (total <= 45) return { classification: "Relevante", color: "orange", description: "Padrão relevante de agressividade com impacto funcional. Plano comportamental estruturado, avaliação psiquiátrica e suporte intensivo recomendados." };
  return { classification: "Importante", color: "red", description: "Agressividade importante com risco de lesão. Avaliação psiquiátrica urgente, plano de segurança, possível ajuste farmacológico e suporte ambiental intensivo." };
}
