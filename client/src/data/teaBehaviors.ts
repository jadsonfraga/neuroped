// ============================================================
// Escala de Comportamentos Atípicos em TEA
// 100 itens organizados por 6 faixas etárias
// Baseado em DSM-5 (critério B), revisões clínicas e diretrizes
// ============================================================

export interface TeaBehaviorItem {
  id: number;
  text: string;
}

export interface TeaAgeGroup {
  id: string;
  title: string;
  ageRange: string;
  description: string;
  clinicalNotes: string[];
  items: TeaBehaviorItem[];
  color: string;
  gradient: string;
}

export const teaConceptualBase = {
  title: "Base Conceitual",
  dsm5Criteria: "O TEA exige, pelo DSM-5, pelo menos 2 dos 4 domínios de comportamentos restritos/repetitivos (RRBs).",
  domains: [
    "Estereotipias motoras e uso repetitivo de objetos",
    "Rotinas rígidas, insistência em mesmice e inflexibilidade",
    "Interesses restritos/fixos de intensidade incomum",
    "Alterações sensoriais: hiper-reatividade, hiporreatividade e busca sensorial",
  ],
  developmentalNote: "Os comportamentos mudam com a idade: os mais 'motores-sensoriais' costumam aparecer mais cedo; com o crescimento, parte deles diminui, enquanto a rigidez cognitiva e os interesses circunscritos podem ficar mais evidentes.",
  functionalNote: "Muitos desses comportamentos têm função de autorregulação, previsibilidade, redução de ansiedade, organização corporal ou prazer sensorial, e não devem ser vistos automaticamente como 'comportamentos a serem apagados'.",
  clinicalRelevance: [
    "Frequência",
    "Intensidade",
    "Inflexibilidade",
    "Interferência funcional",
    "Desproporção para a idade",
    "Desorganização gerada quando é interrompido",
  ],
};

export const teaAgeGroups: TeaAgeGroup[] = [
  // ========== FAIXA 1: 0-2 anos ==========
  {
    id: "faixa1",
    title: "Lactentes e Primeira Infância",
    ageRange: "0 a 2 anos",
    description: "Nesta fase, predominam sinais sensório-motores precoces, uso atípico de objetos, repetição simples e respostas sensoriais incomuns. Diferenças em RRBs podem ser percebidas já no primeiro ano, tornando-se mais visíveis entre 12 e 36 meses.",
    color: "text-pink-600 dark:text-pink-400",
    gradient: "from-pink-500 to-rose-500",
    clinicalNotes: [
      "Predominam: busca sensorial, inspeção visual atípica e repetição motora simples",
      "Interesse exagerado por padrões visuais e fascínio por movimento repetitivo",
      "Recusa incomum a texturas, banho, corte de unhas, vestir roupas",
      "Ou o oposto: baixa reação à dor, frio, calor, sujeira, molhado ou pequenos traumas",
    ],
    items: [
      { id: 1, text: "Agitar mãos quando excitado" },
      { id: 2, text: "Balançar braços repetidamente" },
      { id: 3, text: "Chacoalhar dedos diante dos olhos" },
      { id: 4, text: "Fixar o olhar em luzes ou reflexos" },
      { id: 5, text: "Girar rodas de carrinho sem função simbólica" },
      { id: 6, text: "Aproximar objetos muito perto do rosto para inspecionar" },
      { id: 7, text: "Olhar objetos de lado ou em ângulo incomum" },
      { id: 8, text: "Sacudir cordões, fitas ou etiquetas" },
      { id: 9, text: "Bater objetos repetidamente na mesma superfície" },
      { id: 10, text: "Deixar cair objetos para ver/escutar a repetição" },
      { id: 11, text: "Girar o próprio corpo em círculo" },
      { id: 12, text: "Balançar o tronco sentado" },
      { id: 13, text: "Esfregar superfícies com as mãos repetidamente" },
      { id: 14, text: "Passar o objeto nos lábios/rosto de forma recorrente" },
      { id: 15, text: "Cheirar brinquedos ou objetos com frequência incomum" },
      { id: 16, text: "Apertar repetidamente orelhas, cabelo ou roupa" },
      { id: 17, text: "Fascínio persistente por ventiladores, hélices, sombras ou movimentos circulares" },
      { id: 18, text: "Reação muito intensa a certos sons domésticos" },
      { id: 19, text: "Pouca reação ao ser chamado ou a sons que incomodariam outras crianças" },
      { id: 20, text: "Busca repetida por pressão corporal, colo apertado, quinas, cantos ou superfícies firmes" },
    ],
  },

  // ========== FAIXA 2: 2-4 anos ==========
  {
    id: "faixa2",
    title: "Toddler / Pré-Escolar Inicial",
    ageRange: "2 a 4 anos",
    description: "Entre 2 e 4 anos, os comportamentos repetitivos ficam mais evidentes porque a exigência social e simbólica aumenta. Aparecem com força: alinhamento de objetos, ecolalia, rigidez de rotinas, uso estereotipado de brinquedos e alterações sensoriais marcantes.",
    color: "text-orange-600 dark:text-orange-400",
    gradient: "from-orange-500 to-amber-500",
    clinicalNotes: [
      "Estereotipias motoras mais visíveis e ecolalia",
      "Seletividade alimentar por textura, temperatura, cor ou cheiro",
      "Crises diante de mudança de rotina e forte dependência de previsibilidade",
      "Interesses parecem 'simples', mas mostram qualidade restrita e inflexível — não é só 'gostar', é precisar, repetir e resistir à ampliação do repertório",
    ],
    items: [
      { id: 21, text: "Alinhar brinquedos em fileiras longas" },
      { id: 22, text: "Organizar por cor/tamanho sem brincar funcionalmente" },
      { id: 23, text: "Abrir e fechar portas repetidamente" },
      { id: 24, text: "Ligar e desligar interruptores em sequência" },
      { id: 25, text: "Girar tampas, potes ou peças repetidamente" },
      { id: 26, text: "Repetir o mesmo trajeto dentro de casa" },
      { id: 27, text: "Exigir o mesmo copo, prato, colher ou mamadeira específica" },
      { id: 28, text: "Irritar-se intensamente se um objeto muda de lugar" },
      { id: 29, text: "Precisar da mesma sequência para dormir" },
      { id: 30, text: "Precisar sentar sempre no mesmo lugar" },
      { id: 31, text: "Repetir cenas curtas de desenho sem variação" },
      { id: 32, text: "Ver o mesmo trecho do vídeo muitas vezes" },
      { id: 33, text: "Ecolalia imediata" },
      { id: 34, text: "Ecolalia tardia" },
      { id: 35, text: "Repetição de jingles, vinhetas ou falas de comerciais" },
      { id: 36, text: "Repetição ritualizada de perguntas já respondidas" },
      { id: 37, text: "Vocalizações guturais ou agudas em momentos de excitação" },
      { id: 38, text: "Cobrir ouvidos diante de sons específicos" },
      { id: 39, text: "Recusar certas texturas alimentares com forte seletividade sensorial" },
      { id: 40, text: "Buscar girar, pular, correr em círculos ou cair no colchão repetidamente" },
    ],
  },

  // ========== FAIXA 3: 4-6 anos ==========
  {
    id: "faixa3",
    title: "Pré-Escolar Tardio e Início Escolar",
    ageRange: "4 a 6 anos",
    description: "Os comportamentos se distribuem entre sensório-motores, rigidez de rotina, interesses fixos e fala repetitiva/roteirizada. Cresce a relevância clínica da inflexibilidade e do brincar restrito.",
    color: "text-purple-600 dark:text-purple-400",
    gradient: "from-purple-500 to-violet-500",
    clinicalNotes: [
      "Famílias descrevem: 'presa em manias', 'muito sensível', 'muito rígida', 'fixada em certos assuntos'",
      "'Não brinca, organiza' e 'repete tudo' e 'não aceita mudar nada'",
      "Sintomas sensoriais e RRBs frequentemente co-ocorrem",
      "Podem compartilhar mecanismos ligados a regulação, ansiedade e função executiva",
    ],
    items: [
      { id: 41, text: "Pular repetidamente no mesmo lugar ao se regular" },
      { id: 42, text: "Correr de um lado para outro sem função social compartilhada" },
      { id: 43, text: "Bater palmas estereotipadamente" },
      { id: 44, text: "Balançar o corpo para frente e para trás" },
      { id: 45, text: "Andar na ponta dos pés de modo recorrente" },
      { id: 46, text: "Rodar objetos pequenos muito perto do olho" },
      { id: 47, text: "Fascínio intenso por letras, números ou formas geométricas" },
      { id: 48, text: "Interesse excessivo por calendários, placas, logotipos ou mapas" },
      { id: 49, text: "Falar constantemente sobre um mesmo tema" },
      { id: 50, text: "Repetir scripts inteiros de desenhos ou vídeos" },
      { id: 51, text: "Perguntar a mesma coisa para confirmar previsibilidade" },
      { id: 52, text: "Brincar de modo rígido, com pouca variação imaginativa" },
      { id: 53, text: "Reencenar a mesma cena todos os dias" },
      { id: 54, text: "Insistir que o adulto fale frases exatas" },
      { id: 55, text: "Sofrer muito com mudança de caminho" },
      { id: 56, text: "Resistir a roupas específicas por costura, etiqueta ou tecido" },
      { id: 57, text: "Cheirar pessoas, objetos, livros ou alimentos" },
      { id: 58, text: "Lamber, morder ou mastigar objetos não alimentares" },
      { id: 59, text: "Procurar superfícies, texturas ou vibrações específicas" },
      { id: 60, text: "Fascínio por água correndo, areia caindo, sombras, hélices ou movimentos repetitivos" },
    ],
  },

  // ========== FAIXA 4: 7-10 anos ==========
  {
    id: "faixa4",
    title: "Escolar",
    ageRange: "7 a 10 anos",
    description: "Podem reduzir comportamentos motores grosseiros, mas ficam mais nítidos: rigidez mental, colecionismo restrito, interesse enciclopédico, necessidade de regras próprias, sofrimento diante de imprevistos e perseveração verbal.",
    color: "text-blue-600 dark:text-blue-400",
    gradient: "from-blue-500 to-indigo-500",
    clinicalNotes: [
      "RRBs repercutem em: adaptação à escola, transição entre tarefas, tolerância a frustração",
      "Interferem na ampliação do brincar, aprendizagem e convivência com colegas",
      "Diferenças sensoriais se associam a mais sintomas internalizantes e externalizantes",
      "Crianças ficam mais ansiosas, irritadas, explosivas ou evitativas diante do ambiente escolar",
    ],
    items: [
      { id: 61, text: "Mexer dedos ou mãos discretamente sob a mesa" },
      { id: 62, text: "Manipular lápis, tampinhas ou pequenos objetos em padrões repetidos" },
      { id: 63, text: "Rabiscos repetitivos com o mesmo formato" },
      { id: 64, text: "Repetir a mesma palavra/tema ao longo do dia" },
      { id: 65, text: "Monólogo extenso sobre assunto de interesse" },
      { id: 66, text: "Corrigir os outros o tempo todo em temas de regra" },
      { id: 67, text: "Intolerância a erro no próprio ritual" },
      { id: 68, text: "Exigência de ordem fixa no material escolar" },
      { id: 69, text: "Arranjar objetos da mochila de forma ritualizada" },
      { id: 70, text: "Recusa a atividades novas por imprevisibilidade" },
      { id: 71, text: "Apego incomum a objetos específicos" },
      { id: 72, text: "Colecionar itens de forma altamente restrita" },
      { id: 73, text: "Interesse fixo por dinossauros, planetas, mapas, bandeiras, trens, carros, elevadores, placas, números ou horários" },
      { id: 74, text: "Necessidade de seguir roteiro fixo na ida para escola" },
      { id: 75, text: "Grande incômodo com campainha, apito, recreio barulhento ou microfone" },
      { id: 76, text: "Evitar banheiro, refeitório ou fila por sobrecarga sensorial" },
      { id: 77, text: "Procurar cheirar materiais, cola, papel, borracha, livros" },
      { id: 78, text: "Mastigar manga de camisa, lápis, máscara ou gola" },
      { id: 79, text: "Buscar apertos, abraços fortes ou esmagamento corporal" },
      { id: 80, text: "Crises desproporcionais quando um plano muda sem aviso" },
    ],
  },

  // ========== FAIXA 5: 11-13 anos ==========
  {
    id: "faixa5",
    title: "Pré-Adolescência",
    ageRange: "11 a 13 anos",
    description: "Comportamentos ficam mais 'socialmente disfarçados', porém não desaparecem. Predomina: perseveração verbal/cognitiva, temas fixos, rigidez moral ou lógica, rituais privados e maior sofrimento com estímulos sociais e sensoriais complexos.",
    color: "text-teal-600 dark:text-teal-400",
    gradient: "from-teal-500 to-cyan-500",
    clinicalNotes: [
      "Comum confundir com: ansiedade isolada, TOC, 'mania de perfeccionismo', 'gênio difícil'",
      "No TEA esses elementos se conectam a uma arquitetura maior de neurodesenvolvimento",
      "Diferencial com TOC: comportamento egodistônico e temido (TOC) vs. regulador, prazeroso, estruturante ou identitário (RRB do TEA)",
      "Ambos podem coexistir — avaliação cuidadosa é essencial",
    ],
    items: [
      { id: 81, text: "Repetir mentalmente ou em voz baixa listas, números, falas ou sequências" },
      { id: 82, text: "Fazer movimentos discretos de autorregulação escondidos" },
      { id: 83, text: "Necessidade de rotina matinal rígida" },
      { id: 84, text: "Grande sofrimento se a agenda muda em cima da hora" },
      { id: 85, text: "Pensamento excessivamente literal e rígido" },
      { id: 86, text: "Interesse hiperfocal em tema técnico muito específico" },
      { id: 87, text: "Fala detalhista, extensa e pouco flexível sobre o tema fixo" },
      { id: 88, text: "Ritual para estudo, sono, banho ou organização pessoal" },
      { id: 89, text: "Hipersensibilidade importante a perfume, suor, barulho coletivo, textura de uniforme ou contato físico" },
      { id: 90, text: "Busca de isolamento após sobrecarga sensorial/social" },
    ],
  },

  // ========== FAIXA 6: 14-18 anos ==========
  {
    id: "faixa6",
    title: "Adolescência",
    ageRange: "14 a 18 anos",
    description: "Comportamentos menos chamativos do ponto de vista motor, porém mais complexos: rituais cognitivos, inflexibilidade social, hiperfoco temático, dependência de previsibilidade, exaustão sensorial em ambientes sociais e uso de stimming discreto para autorregulação.",
    color: "text-indigo-600 dark:text-indigo-400",
    gradient: "from-indigo-500 to-purple-600",
    clinicalNotes: [
      "Parte dos comportamentos fica camuflada, mas o custo interno cresce",
      "Adolescentes relatam: cansaço após escola, irritabilidade pós-estímulo, necessidade de 'desligar'",
      "Sofrimento com imprevisibilidade, dificuldade de alternar foco, fusão intensa com temas de interesse",
      "RRBs e diferenças sensoriais funcionam como formas de organização do sistema nervoso, regulação e economia de energia psíquica",
    ],
    items: [
      { id: 91, text: "Movimentos finos repetitivos com dedos, unhas ou articulações" },
      { id: 92, text: "Balanço corporal discreto sentado" },
      { id: 93, text: "Necessidade intensa de previsibilidade acadêmica" },
      { id: 94, text: "Crises ou shutdown diante de mudanças de planejamento" },
      { id: 95, text: "Interesses ultrafocados com padrão enciclopédico" },
      { id: 96, text: "Pesquisa obsessiva de um mesmo assunto por horas" },
      { id: 97, text: "Repetição de playlists, cenas, falas ou conteúdos específicos" },
      { id: 98, text: "Evitação de certos ambientes por ruído, luz, cheiro ou excesso de gente" },
      { id: 99, text: "Uso de roupas muito restritas por conforto sensorial" },
      { id: 100, text: "Rituais privados de organização, estudo, sono ou deslocamento" },
    ],
  },
];

// Classificação de frequência/intensidade para cada item
export const behaviorRatingLabels = [
  "Não observado",
  "Raramente / Leve",
  "Frequente / Moderado",
  "Muito frequente / Intenso",
];

export function classifyTeaBehaviors(
  answers: Record<number, number>,
  items: TeaBehaviorItem[]
) {
  const total = items.length;
  const answered = Object.keys(answers).length;
  const present = Object.values(answers).filter((v) => v > 0).length;
  const highIntensity = Object.values(answers).filter((v) => v >= 2).length;
  const sum = Object.values(answers).reduce((a, b) => a + b, 0);
  const maxPossible = total * 3;
  const pct = Math.round((sum / maxPossible) * 100);

  let classification = "Poucos comportamentos atípicos identificados";
  let color = "emerald";
  if (pct >= 50) {
    classification = "Alta frequência de comportamentos atípicos — avaliação diagnóstica aprofundada recomendada";
    color = "red";
  } else if (pct >= 30) {
    classification = "Frequência moderada de comportamentos atípicos — monitoramento e avaliação indicados";
    color = "orange";
  } else if (pct >= 15) {
    classification = "Alguns comportamentos atípicos identificados — acompanhamento recomendado";
    color = "amber";
  }

  return {
    total,
    answered,
    present,
    highIntensity,
    sum,
    maxPossible,
    pct,
    classification,
    color,
  };
}
