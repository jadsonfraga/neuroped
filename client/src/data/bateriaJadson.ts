// ── EMDI-J26 — Escala Médica do Desenvolvimento Infantil ──────────────
export const emdiLabels = [
  "0 — Ainda não apresenta",
  "1 — Raramente / muita ajuda",
  "2 — Parcial / inconstante",
  "3 — Funcional e consistente",
];

export const emdiDomains = [
  {
    name: "A. Interação social",
    color: "text-emerald-600 dark:text-emerald-400",
    items: [
      "Busca espontaneamente a presença do adulto para dividir interesse, pedir ajuda ou mostrar algo.",
      "Responde ao próprio nome em ambientes tranquilos.",
      "Mantém contato visual funcional durante interação natural.",
      "Demonstra interesse por outras crianças, ainda que de forma breve ou imatura.",
      "Participa de brincadeiras compartilhadas com troca de turnos.",
    ],
  },
  {
    name: "B. Linguagem receptiva",
    color: "text-teal-600 dark:text-teal-400",
    items: [
      "Compreende ordens simples do cotidiano sem necessidade de muitos gestos.",
      "Entende perguntas concretas relacionadas à rotina.",
      "Identifica pessoas, objetos ou partes do corpo quando solicitado.",
      "Acompanha instruções com duas etapas conforme a idade.",
      "Demonstra compreender limites, combinados e mudanças simples de rotina.",
    ],
  },
  {
    name: "C. Linguagem expressiva",
    color: "text-green-600 dark:text-green-400",
    items: [
      "Usa vocalizações, gestos, palavras ou frases para comunicar necessidade real.",
      "Nomeia objetos, pessoas ou ações de forma funcional.",
      "Faz pedidos de maneira compreensível para familiares e profissionais.",
      "Relata desconforto, dor, fome, sede ou desejo.",
      "Mantém pequena troca comunicativa, ainda que simples.",
    ],
  },
  {
    name: "D. Cognição e jogo",
    color: "text-cyan-600 dark:text-cyan-400",
    items: [
      "Explora brinquedos de modo funcional, e não apenas repetitivo.",
      "Imita ações simples observadas no adulto.",
      "Resolve pequenos problemas práticos do cotidiano.",
      "Consegue manter atenção em atividade dirigida por tempo compatível com a idade.",
      "Demonstra brincadeira simbólica ou faz-de-conta, quando esperado para a faixa etária.",
    ],
  },
  {
    name: "E. Motricidade ampla",
    color: "text-blue-600 dark:text-blue-400",
    items: [
      "Corre, sobe, senta, levanta ou muda de posição com coordenação adequada para a idade.",
      "Consegue manter equilíbrio em tarefas motoras simples.",
      "Participa de brincadeiras corporais sem medo excessivo ou grande desorganização.",
      "Apresenta planejamento motor compatível com a faixa etária.",
    ],
  },
  {
    name: "F. Motricidade fina",
    color: "text-indigo-600 dark:text-indigo-400",
    items: [
      "Manipula objetos pequenos com controle progressivo.",
      "Usa pinça, encaixa, empilha, abre ou fecha materiais conforme a idade.",
      "Segura lápis, giz ou utensílio com preensão funcional para sua fase.",
      "Mostra coordenação visomotora em tarefas simples.",
    ],
  },
  {
    name: "G. Autonomia funcional",
    color: "text-violet-600 dark:text-violet-400",
    items: [
      "Participa de alimentação, higiene, vestir-se ou guardar objetos de forma compatível com a idade.",
      "Tolera pequenas esperas e transições com apoio previsível.",
      "Consegue seguir parte da rotina diária com menos comando direto.",
      "Sinaliza necessidades fisiológicas ou desconfortos de forma compreensível.",
    ],
  },
  {
    name: "H. Regulação emocional e comportamental",
    color: "text-amber-600 dark:text-amber-400",
    items: [
      "Recupera-se de frustração com ajuda razoável.",
      "Aceita correção sem colapso frequente e prolongado.",
      "Mostra flexibilidade mínima diante de pequenas mudanças.",
      "Mantém nível de atividade compatível com a proposta na maior parte do tempo.",
    ],
  },
];

export function classifyEmdi(total: number) {
  if (total <= 36) return { classification: "Prejuízo importante", color: "red", description: "Pontuação indica prejuízo importante no desenvolvimento global. Recomenda-se avaliação multidisciplinar detalhada e acompanhamento especializado." };
  if (total <= 72) return { classification: "Heterogêneo", color: "orange", description: "Perfil heterogêneo de desenvolvimento — áreas de força coexistem com áreas de vulnerabilidade significativa. Investigar domínios específicos." };
  if (total <= 92) return { classification: "Globalmente funcional com áreas vulneráveis", color: "amber", description: "Desenvolvimento globalmente funcional, porém com áreas vulneráveis que merecem atenção e possível intervenção pontual." };
  return { classification: "Funcional", color: "emerald", description: "Desenvolvimento funcional e consistente nos principais domínios avaliados." };
}

// ── EAF-J26 — Escala de Adaptação Funcional ──────────────────────────
export const eafLabels = [
  "0 — Dependência quase total",
  "1 — Faz pequena parte com ajuda intensa",
  "2 — Faz com supervisão frequente",
  "3 — Autonomia funcional",
];

export const eafDomains = [
  {
    name: "A. Comunicação funcional",
    color: "text-blue-600 dark:text-blue-400",
    items: [
      "Expressa necessidades básicas de modo compreensível.",
      "Compreende orientações do cotidiano.",
      "Consegue relatar fatos simples do dia.",
      "Faz perguntas ou pede esclarecimentos quando necessário.",
    ],
  },
  {
    name: "B. Vida pessoal",
    color: "text-cyan-600 dark:text-cyan-400",
    items: [
      "Alimenta-se com participação ativa compatível com a idade.",
      "Coopera com banho, escovação, troca de roupa ou higiene íntima.",
      "Reconhece sinais corporais como fome, sono, sede, dor ou vontade de evacuar/urinar.",
      "Mantém parte da própria organização pessoal.",
    ],
  },
  {
    name: "C. Vida doméstica",
    color: "text-teal-600 dark:text-teal-400",
    items: [
      "Guarda objetos após uso quando solicitado.",
      "Participa de tarefas simples da casa compatíveis com a idade.",
      "Segue rotina doméstica previsível com necessidade reduzida de repetição.",
      "Consegue iniciar ou concluir pequenas tarefas com orientação.",
    ],
  },
  {
    name: "D. Socialização",
    color: "text-indigo-600 dark:text-indigo-400",
    items: [
      "Respeita turnos básicos em conversa, jogo ou fila.",
      "Reconhece sinais simples de aceitação, recusa, alegria ou irritação no outro.",
      "Procura companhia ou participa de interação sem isolamento constante.",
      "Consegue permanecer em grupo por tempo compatível com a idade.",
    ],
  },
  {
    name: "E. Segurança e vida prática",
    color: "text-emerald-600 dark:text-emerald-400",
    items: [
      "Entende comandos de segurança básicos.",
      "Evita riscos óbvios no ambiente quando orientado previamente.",
      "Tolera deslocamentos, consultas, escola ou ambientes públicos sem desorganização extrema.",
      "Apresenta repertório mínimo para rotina fora de casa.",
    ],
  },
  {
    name: "F. Autorregulação",
    color: "text-violet-600 dark:text-violet-400",
    items: [
      "Tolera frustração com mediação proporcional.",
      "Aceita mudanças pequenas sem crise intensa na maior parte das vezes.",
      "Demonstra alguma capacidade de esperar.",
      "Reorganiza-se após contrariedade em tempo razoável.",
    ],
  },
];

export function classifyEaf(total: number) {
  if (total <= 24) return { classification: "Grande dependência", color: "red", description: "Pontuação indica grande dependência funcional. A criança/adolescente necessita de assistência intensiva na maioria das atividades do dia a dia." };
  if (total <= 48) return { classification: "Dependência moderada", color: "orange", description: "Dependência moderada — realiza parte das atividades com supervisão frequente, mas ainda precisa de suporte substancial." };
  if (total <= 60) return { classification: "Funcionalidade parcial", color: "amber", description: "Funcionalidade parcial alcançada. Algumas áreas já apresentam autonomia, mas outras ainda requerem supervisão ou apoio." };
  return { classification: "Satisfatória", color: "emerald", description: "Adaptação funcional satisfatória para a faixa etária. Autonomia presente nos principais domínios avaliados." };
}

// ── PDAE-J26 — Protocolo de Desempenho Acadêmico e Escolar ──────────
export const pdaeLabels = [
  "0 — Não realiza",
  "1 — Apenas com ajuda intensa",
  "2 — Com erros/lentidão/inconsistência",
  "3 — Adequado para a escolaridade",
];

export const pdaeDomains = [
  {
    name: "A. Leitura",
    color: "text-amber-600 dark:text-amber-400",
    items: [
      "Reconhece letras ou símbolos escritos compatíveis com sua etapa escolar.",
      "Faz correspondência entre som e grafema em nível esperado.",
      "Lê palavras familiares com relativa segurança.",
      "Lê pequenos trechos com compreensão global.",
      "Consegue localizar informação explícita em frase ou texto curto.",
    ],
  },
  {
    name: "B. Escrita",
    color: "text-orange-600 dark:text-orange-400",
    items: [
      "Escreve o próprio nome ou identificação básica conforme a fase escolar.",
      "Registra palavras com correspondência fonológica minimamente compreensível.",
      "Produz frase simples com sentido.",
      "Organiza escrita com legibilidade funcional.",
      "Revisa ou percebe erros quando orientado.",
    ],
  },
  {
    name: "C. Matemática",
    color: "text-yellow-600 dark:text-yellow-400",
    items: [
      "Reconhece números e quantidades compatíveis com a idade.",
      "Realiza cálculos simples conforme a série.",
      "Entende noções de maior/menor, antes/depois, mais/menos.",
      "Resolve situações-problema simples quando mediado.",
      "Mantém raciocínio em tarefa numérica sem abandonar rapidamente.",
    ],
  },
  {
    name: "D. Organização e função acadêmica",
    color: "text-red-600 dark:text-red-400",
    items: [
      "Inicia tarefa após instrução.",
      "Mantém-se na atividade por tempo suficiente para produzir algo.",
      "Compreende o que foi pedido antes de começar.",
      "Finaliza parte relevante da proposta.",
      "Tolera correção e recomeço sem grande desorganização.",
    ],
  },
  {
    name: "E. Linguagem acadêmica e compreensão",
    color: "text-rose-600 dark:text-rose-400",
    items: [
      "Entende vocabulário escolar simples.",
      "Responde perguntas sobre conteúdo recém-apresentado.",
      "Explica oralmente o que entendeu de uma tarefa.",
      "Generaliza aprendizagem simples para situação parecida.",
    ],
  },
];

export function classifyPdae(total: number) {
  if (total <= 24) return { classification: "Prejuízo importante", color: "red", description: "Prejuízo importante no desempenho acadêmico. Necessidade de avaliação psicopedagógica e neuropsicológica detalhada." };
  if (total <= 48) return { classification: "Abaixo do esperado", color: "orange", description: "Desempenho abaixo do esperado para a escolaridade. Recomenda-se investigação de dificuldades de aprendizagem e suporte pedagógico direcionado." };
  if (total <= 60) return { classification: "Heterogêneo", color: "amber", description: "Perfil acadêmico heterogêneo — algumas áreas estão adequadas enquanto outras apresentam inconsistência ou lentidão." };
  return { classification: "Adequado", color: "emerald", description: "Desempenho acadêmico adequado para a escolaridade atual nos domínios avaliados." };
}

// ── ECSM-J26 — Escala de Cognição Social e Mentalização ─────────────
export const ecsmLabels = [
  "0 — Não demonstra",
  "1 — Raramente / muita mediação",
  "2 — Parcialmente",
  "3 — De forma consistente",
];

export const ecsmDomains = [
  {
    name: "Cognição Social",
    color: "text-purple-600 dark:text-purple-400",
    items: [
      "Percebe quando outra pessoa está triste, zangada ou alegre por sinais básicos do rosto e do tom de voz.",
      "Ajusta parte do comportamento quando percebe reação negativa do outro.",
      "Entende que outra pessoa pode querer algo diferente do que ela quer.",
      "Consegue esperar sua vez em interação ou brincadeira.",
      "Percebe quando alguém não entendeu sua fala e tenta reformular.",
      "Compreende brincadeiras sociais simples sem interpretar tudo literalmente.",
      "Identifica que duas pessoas podem olhar a mesma situação de maneiras diferentes.",
      "Reconhece quando uma ação sua pode ter incomodado alguém.",
      "Faz perguntas sobre pensamentos, sentimentos ou intenções do outro.",
      "Consegue imaginar o que um personagem pode estar sentindo em história simples.",
      "Entende pequenas situações de mal-entendido social.",
      "Demonstra reciprocidade afetiva em contexto natural.",
      "Percebe ironia muito leve ou humor concreto, quando compatível com a idade.",
      "Ajusta tom, volume ou forma da fala conforme o contexto.",
      "Mostra empatia prática, ainda que simples, diante de choro, dor ou frustração do outro.",
    ],
  },
];

export function classifyEcsm(total: number) {
  if (total <= 15) return { classification: "Comprometimento importante", color: "red", description: "Comprometimento importante na cognição social e mentalização. Dificuldade significativa em reconhecer estados mentais e emocionais no outro." };
  if (total <= 30) return { classification: "Fragilidade relevante", color: "orange", description: "Fragilidade relevante na cognição social — capacidade parcial de compreender estados mentais, com necessidade de muita mediação." };
  if (total <= 38) return { classification: "Intermediário", color: "amber", description: "Nível intermediário de cognição social. Habilidades parcialmente presentes, mas nem sempre consistentes em diferentes contextos." };
  return { classification: "Satisfatório", color: "emerald", description: "Cognição social e mentalização satisfatórias para a faixa etária avaliada." };
}

// ── IPS-J26 — Inventário de Processamento Sensorial ─────────────────
export const ipsLabels = [
  "0 — Nunca/quase nunca",
  "1 — Raramente",
  "2 — Frequentemente",
  "3 — Quase sempre",
];

export const ipsDomains = [
  {
    name: "A. Auditivo",
    color: "text-rose-600 dark:text-rose-400",
    items: [
      "Incomoda-se com sons comuns que outras crianças toleram bem.",
      "Distrai-se facilmente com barulhos do ambiente.",
      "Procura sons repetitivos, músicas, ruídos ou estímulos auditivos específicos.",
      "Parece não responder adequadamente a chamados em certos contextos, apesar de audição funcional.",
    ],
  },
  {
    name: "B. Tátil",
    color: "text-pink-600 dark:text-pink-400",
    items: [
      "Reage mal a etiquetas, tecidos, cortes de unha, escovação ou toque inesperado.",
      "Procura apertar, esfregar, encostar ou manipular texturas de modo intenso.",
      "Evita sujeira, areia, tinta, massinha, grama ou superfícies pegajosas.",
      "Tolera mal cuidados corporais de rotina por sensibilidade ao toque.",
    ],
  },
  {
    name: "C. Movimento e propriocepção",
    color: "text-red-600 dark:text-red-400",
    items: [
      "Busca girar, correr, pular ou mover-se o tempo todo.",
      "Parece não medir força ao tocar objetos ou pessoas.",
      "Cai, esbarra ou se desorganiza motoramente com frequência.",
      "Procura pressão corporal, apertos, colisões ou apoio físico intenso.",
    ],
  },
  {
    name: "D. Oral/alimentar",
    color: "text-orange-600 dark:text-orange-400",
    items: [
      "Apresenta seletividade alimentar importante por textura, temperatura, cheiro ou consistência.",
      "Mastiga de forma imatura, lenta ou desorganizada.",
      "Busca morder, colocar objetos na boca ou fazer exploração oral frequente.",
      "Reage intensamente a determinados cheiros ou sabores.",
    ],
  },
  {
    name: "E. Visual",
    color: "text-amber-600 dark:text-amber-400",
    items: [
      "Distrai-se com estímulos visuais em excesso.",
      "Fixa-se em luzes, movimentos, detalhes ou padrões visuais de maneira incomum.",
      "Evita ambientes visualmente intensos ou muito movimentados.",
      "Tem dificuldade de filtrar estímulos visuais para focar no essencial.",
    ],
  },
  {
    name: "F. Regulação sensorial e impacto funcional",
    color: "text-fuchsia-600 dark:text-fuchsia-400",
    items: [
      "Fica desorganizado em ambientes cheios, barulhentos ou com muitas pessoas.",
      "Precisa de rotinas sensoriais específicas para se acalmar.",
      "Apresenta crises, irritação ou fuga diante de certos estímulos.",
      "O perfil sensorial interfere de modo real em escola, alimentação, sono ou convívio.",
    ],
  },
];

export function classifyIps(total: number) {
  // NOTE: Higher score = MORE sensory issues
  if (total <= 18) return { classification: "Poucos sinais", color: "emerald", description: "Poucos sinais de alteração no processamento sensorial. Perfil dentro da faixa típica." };
  if (total <= 36) return { classification: "Leve a moderado", color: "amber", description: "Sinais leves a moderados de alteração sensorial. Algumas áreas podem requerer adaptações ambientais ou acompanhamento." };
  if (total <= 54) return { classification: "Clinicamente significativo", color: "orange", description: "Alteração sensorial clinicamente significativa com impacto funcional. Recomenda-se avaliação de integração sensorial e estratégias de regulação." };
  return { classification: "Importante impacto", color: "red", description: "Importante impacto sensorial em múltiplos domínios. Necessidade de intervenção especializada em integração sensorial e adaptações em todos os ambientes." };
}
