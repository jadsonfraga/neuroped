// ============================================================
// Dados expandidos — 13 novas escalas de Neuropediatria
// CDI-2, CBCL, C-SSRS, CRAFFT, PHQ-A, ASQ-3, CSHQ, BRIEF-2,
// YGTSS, Vanderbilt, ABC, PedsQL, GMFCS
// ============================================================

// --- CDI-2 (Children's Depression Inventory) ---
export const cdi2Questions = [
  "Fico triste de vez em quando / Fico triste muitas vezes / Estou triste o tempo todo",
  "Nada vai dar certo para mim / Não tenho certeza se as coisas vão dar certo / As coisas vão dar certo para mim",
  "Faço a maioria das coisas bem / Faço muitas coisas errado / Faço tudo errado",
  "Tenho prazer em muitas coisas / Tenho prazer em algumas coisas / Nada me dá prazer",
  "Sou mau de vez em quando / Sou mau muitas vezes / Sou mau o tempo todo",
  "De vez em quando penso que coisas ruins vão me acontecer / Tenho medo que coisas ruins me aconteçam / Tenho certeza que coisas terríveis vão me acontecer",
  "Eu me gosto / Não me gosto / Me odeio",
  "Coisas ruins geralmente não são minha culpa / Muitas coisas ruins são minha culpa / Tudo de ruim é minha culpa",
  "Não penso em me machucar / Penso em me machucar mas não faria / Quero me machucar",
  "Tenho vontade de chorar de vez em quando / Tenho vontade de chorar muitos dias / Tenho vontade de chorar todo dia",
  "As coisas me incomodam de vez em quando / As coisas me incomodam muitas vezes / As coisas me incomodam o tempo todo",
  "Gosto de estar com as pessoas / Muitas vezes não gosto de estar com as pessoas / Não quero estar com ninguém",
  "Consigo me decidir / É difícil me decidir / Não consigo me decidir",
  "Tenho boa aparência / Há coisas ruins na minha aparência / Sou feio(a)",
  "Tenho que me esforçar para fazer a lição / Muitas vezes tenho que me esforçar muito / Não consigo fazer a lição",
  "Tenho dificuldade para dormir de vez em quando / Tenho dificuldade para dormir muitas noites / Tenho dificuldade para dormir toda noite",
  "Fico cansado(a) de vez em quando / Fico cansado(a) muitos dias / Estou cansado(a) o tempo todo",
  "Meu apetite está bom / Meu apetite não é tão bom / Não tenho fome nunca",
  "Não me preocupo com dores / Me preocupo com dores muitas vezes / Me preocupo com dores o tempo todo",
  "Não me sinto sozinho(a) / Me sinto sozinho(a) muitas vezes / Me sinto sozinho(a) o tempo todo",
  "A escola é divertida / A escola não é tão divertida / A escola nunca é divertida",
  "Tenho muitos amigos / Tenho alguns amigos mas queria mais / Não tenho amigos",
  "Meu desempenho escolar está bom / Meu desempenho escolar não é tão bom / Estou mal em matérias que costumava ir bem",
  "Sou tão bom quanto os outros / Posso ser tão bom quanto os outros se quiser / Não consigo ser tão bom quanto os outros",
  "Ninguém me ama de verdade / Não tenho certeza se alguém me ama / Sei que alguém me ama",
  "Geralmente faço o que me mandam / Muitas vezes não faço o que me mandam / Nunca faço o que me mandam",
  "Dou-me bem com as pessoas / Brigo muitas vezes / Brigo o tempo todo",
  "Sei o que quero fazer quando crescer / Não tenho certeza do que quero fazer / Não sei o que vou fazer",
];
export const cdi2Labels = ["0 — Ausente", "1 — Às vezes", "2 — Sempre"];
export function classifyCdi2(total: number) {
  if (total <= 13) return { classification: "Mínima", color: "emerald", description: "Sintomas depressivos mínimos. Manter acompanhamento de rotina." };
  if (total <= 19) return { classification: "Leve", color: "amber", description: "Sintomas depressivos leves. Sugere-se acompanhamento e reavaliação." };
  if (total <= 25) return { classification: "Moderada", color: "orange", description: "Sintomas depressivos moderados. Indicada avaliação especializada." };
  return { classification: "Grave", color: "red", description: "Sintomas depressivos graves. Encaminhamento urgente para psiquiatria infantil." };
}

// --- PHQ-A (Patient Health Questionnaire for Adolescents) ---
export const phqaQuestions = [
  "Pouco interesse ou prazer em fazer as coisas",
  "Sentir-se para baixo, deprimido(a) ou sem esperança",
  "Dificuldade para adormecer, permanecer dormindo ou dormir demais",
  "Sentir-se cansado(a) ou com pouca energia",
  "Falta de apetite ou comendo demais",
  "Sentir-se mal consigo mesmo(a), achar que é um fracasso ou que decepcionou sua família",
  "Dificuldade para se concentrar nas coisas (como lição de casa ou assistir TV)",
  "Movimentar-se ou falar tão devagar que as outras pessoas notaram, ou o contrário — tão agitado(a) que fica andando de um lado para o outro",
  "Pensamentos de que seria melhor estar morto(a) ou de se machucar de alguma forma",
];
export const phqaLabels = ["Nenhuma vez", "Vários dias", "Mais da metade dos dias", "Quase todos os dias"];
export function classifyPhqa(total: number) {
  if (total <= 4) return { classification: "Mínima", color: "emerald", description: "Depressão mínima (0-4). Monitoramento." };
  if (total <= 9) return { classification: "Leve", color: "amber", description: "Depressão leve (5-9). Observação ativa, considerar reavaliação em 2 semanas." };
  if (total <= 14) return { classification: "Moderada", color: "orange", description: "Depressão moderada (10-14). Considerar tratamento psicoterápico e/ou farmacológico." };
  if (total <= 19) return { classification: "Moderada-Grave", color: "red", description: "Depressão moderadamente grave (15-19). Tratamento ativo indicado." };
  return { classification: "Grave", color: "red", description: "Depressão grave (20-27). Encaminhamento urgente para psiquiatria, avaliar risco." };
}

// --- C-SSRS (Columbia Suicide Severity Rating Scale) ---
export const cssrsQuestions = [
  { id: 1, text: "Desejou estar morto(a) ou desejou poder adormecer e não acordar?", level: "Ideação passiva" },
  { id: 2, text: "Teve pensamentos de se matar?", level: "Ideação ativa" },
  { id: 3, text: "Pensou em como faria isso (método)?", level: "Ideação com método" },
  { id: 4, text: "Teve intenção de agir com base nesses pensamentos?", level: "Ideação com intenção" },
  { id: 5, text: "Começou a elaborar os detalhes de como se matar ou fez preparativos?", level: "Ideação com plano" },
  { id: 6, text: "Já fez algo, começou a fazer algo ou se preparou para fazer algo para acabar com sua vida?", level: "Comportamento suicida" },
];
export function classifyCssrs(answers: Record<number, boolean>) {
  if (answers[6]) return { level: 6, classification: "Comportamento Suicida", color: "red", description: "Presença de comportamento suicida. Encaminhamento IMEDIATO para emergência psiquiátrica." };
  if (answers[5]) return { level: 5, classification: "Ideação com Plano", color: "red", description: "Ideação suicida ativa com plano específico. Alto risco — encaminhamento urgente." };
  if (answers[4]) return { level: 4, classification: "Ideação com Intenção", color: "red", description: "Ideação suicida ativa com intenção de agir. Encaminhamento psiquiátrico urgente." };
  if (answers[3]) return { level: 3, classification: "Ideação com Método", color: "orange", description: "Ideação suicida ativa com método, sem intenção. Avaliação de segurança necessária." };
  if (answers[2]) return { level: 2, classification: "Ideação Ativa", color: "orange", description: "Ideação suicida ativa sem método específico. Avaliação especializada indicada." };
  if (answers[1]) return { level: 1, classification: "Ideação Passiva", color: "amber", description: "Desejo de morte sem ideação ativa. Acompanhamento recomendado." };
  return { level: 0, classification: "Sem Risco Identificado", color: "emerald", description: "Sem ideação suicida identificada nesta avaliação." };
}

// --- CRAFFT (Screening de Uso de Substâncias) ---
export const crafftPartA = [
  "Nos últimos 12 meses, você bebeu alguma bebida alcoólica (mais do que apenas alguns goles)?",
  "Nos últimos 12 meses, você usou maconha?",
  "Nos últimos 12 meses, você usou alguma outra substância para 'ficar chapado(a)'?",
];
export const crafftPartB = [
  { letter: "C", question: "Você já andou em um CARRO dirigido por alguém (incluindo você) que estava sob efeito de álcool ou drogas?", keyword: "Car" },
  { letter: "R", question: "Você já usou álcool ou drogas para RELAXAR, se sentir melhor ou se enturmar?", keyword: "Relax" },
  { letter: "A", question: "Você já usou álcool ou drogas quando estava SOZINHO(A)?", keyword: "Alone" },
  { letter: "F", question: "Você já ESQUECEU coisas que fez enquanto usava álcool ou drogas?", keyword: "Forget" },
  { letter: "F", question: "Sua FAMÍLIA ou amigos já disseram que você deveria parar de beber ou usar drogas?", keyword: "Friends/Family" },
  { letter: "T", question: "Você já se meteu em PROBLEMAS enquanto usava álcool ou drogas?", keyword: "Trouble" },
];
export function classifyCrafft(score: number) {
  if (score === 0) return { classification: "Baixo Risco", color: "emerald", description: "Sem indicadores de uso problemático. Reforço positivo." };
  if (score === 1) return { classification: "Risco Moderado", color: "amber", description: "Algum risco identificado. Breve intervenção e orientação recomendadas." };
  return { classification: "Alto Risco", color: "red", description: `Pontuação ≥2 (${score}/6). Alto risco de uso problemático de substâncias. Avaliação aprofundada e possível encaminhamento.` };
}

// --- CBCL (Child Behavior Checklist — versão abreviada para triagem) ---
export const cbclDomains = [
  {
    name: "Problemas Internalizantes",
    color: "text-blue-600 dark:text-blue-400",
    items: [
      "Queixa-se de solidão",
      "Chora muito",
      "Tem medo de certos animais, situações ou lugares",
      "Tem medo de ir à escola",
      "Tem medo de pensar ou fazer algo mau",
      "Acha que tem que ser perfeito(a)",
      "Sente que ninguém gosta dele(a)",
      "Sente-se sem valor ou inferior",
      "É nervoso(a), tenso(a) ou agitado(a)",
      "É muito medroso(a) ou ansioso(a)",
      "Sente-se tonto(a) ou com dores de cabeça",
      "Sente-se muito cansado(a) sem razão",
      "Tem dores (estômago, cabeça) sem causa médica",
      "Tem náuseas, sente-se mal",
      "É muito preocupado(a)",
    ],
  },
  {
    name: "Problemas Externalizantes",
    color: "text-red-600 dark:text-red-400",
    items: [
      "É desobediente em casa",
      "É desobediente na escola",
      "Não se sente culpado(a) depois de se comportar mal",
      "Mente ou engana os outros",
      "Rouba em casa",
      "Destrói suas próprias coisas",
      "Destrói coisas dos outros",
      "Mete-se em muitas brigas",
      "Agride fisicamente os outros",
      "Grita muito",
      "É teimoso(a), irritável",
      "Tem variações repentinas de humor",
      "Fala demais",
      "É provocador(a), irrita os outros",
      "Exige muita atenção",
    ],
  },
  {
    name: "Problemas Sociais e Atenção",
    color: "text-purple-600 dark:text-purple-400",
    items: [
      "É desajeitado(a), descoordenado(a)",
      "Prefere estar com crianças mais novas",
      "Não se dá bem com outras crianças",
      "As outras crianças não gostam dele(a)",
      "É provocado(a) pelas outras crianças",
      "Não consegue se concentrar ou prestar atenção",
      "Não consegue ficar sentado(a), é inquieto(a)",
      "É confuso(a), parece estar 'no mundo da lua'",
      "Fica sonhando acordado(a)",
      "É impulsivo(a), age sem pensar",
    ],
  },
];
export const cbclLabels = ["Falso", "Às vezes verdadeiro", "Frequentemente verdadeiro"];
export function classifyCbcl(internalizing: number, externalizing: number, social: number) {
  const total = internalizing + externalizing + social;
  const results = [];
  // Internalizantes (max 30)
  if (internalizing <= 8) results.push({ domain: "Internalizantes", score: internalizing, classification: "Normal", color: "emerald" });
  else if (internalizing <= 12) results.push({ domain: "Internalizantes", score: internalizing, classification: "Limítrofe", color: "amber" });
  else results.push({ domain: "Internalizantes", score: internalizing, classification: "Clínico", color: "red" });
  // Externalizantes (max 30)
  if (externalizing <= 10) results.push({ domain: "Externalizantes", score: externalizing, classification: "Normal", color: "emerald" });
  else if (externalizing <= 15) results.push({ domain: "Externalizantes", score: externalizing, classification: "Limítrofe", color: "amber" });
  else results.push({ domain: "Externalizantes", score: externalizing, classification: "Clínico", color: "red" });
  // Social/Atenção (max 20)
  if (social <= 6) results.push({ domain: "Social/Atenção", score: social, classification: "Normal", color: "emerald" });
  else if (social <= 9) results.push({ domain: "Social/Atenção", score: social, classification: "Limítrofe", color: "amber" });
  else results.push({ domain: "Social/Atenção", score: social, classification: "Clínico", color: "red" });

  return { total, results, description: total <= 24 ? "Faixa normal global." : total <= 36 ? "Faixa limítrofe — reavaliação recomendada." : "Faixa clínica — encaminhamento para avaliação especializada." };
}

// --- Vanderbilt (NICHQ Vanderbilt — TDAH) ---
export const vanderbiltDomains = [
  {
    name: "Desatenção",
    color: "text-blue-600 dark:text-blue-400",
    items: [
      "Não presta atenção a detalhes ou comete erros por descuido",
      "Tem dificuldade em manter a atenção nas tarefas ou brincadeiras",
      "Parece não ouvir quando falam diretamente com ele(a)",
      "Não segue instruções e não consegue terminar tarefas",
      "Tem dificuldade para organizar tarefas e atividades",
      "Evita tarefas que exigem esforço mental prolongado",
      "Perde coisas necessárias para tarefas e atividades",
      "Distrai-se facilmente com estímulos externos",
      "É esquecido(a) em atividades do dia a dia",
    ],
  },
  {
    name: "Hiperatividade/Impulsividade",
    color: "text-orange-600 dark:text-orange-400",
    items: [
      "Mexe as mãos ou pés ou se remexe na cadeira",
      "Levanta-se da cadeira quando deveria ficar sentado(a)",
      "Corre ou escala em situações inapropriadas",
      "Tem dificuldade para brincar ou participar de atividades silenciosas",
      "Está sempre 'a mil' ou age como se estivesse 'ligado(a) no motor'",
      "Fala demais",
      "Dá respostas precipitadas antes das perguntas serem completadas",
      "Tem dificuldade para esperar sua vez",
      "Interrompe ou se intromete nas conversas ou jogos dos outros",
    ],
  },
  {
    name: "Transtorno de Conduta/Oposição",
    color: "text-red-600 dark:text-red-400",
    items: [
      "Perde a calma frequentemente",
      "Discute com adultos",
      "Recusa-se ativamente a cumprir regras",
      "Incomoda deliberadamente os outros",
      "Culpa os outros por seus erros",
      "É suscetível ou facilmente incomodado(a) pelos outros",
      "É raivoso(a) e ressentido(a)",
      "É maldoso(a) ou vingativo(a)",
    ],
  },
];
export const vanderbiltLabels = ["Nunca", "Às vezes", "Frequentemente", "Muito frequentemente"];
export function classifyVanderbilt(inattention: number, hyperactivity: number, conduct: number) {
  const results = [];
  // Desatenção: ≥6 itens com score ≥2 = positivo screening
  results.push({
    domain: "Desatenção",
    score: inattention,
    positive: inattention >= 6,
    description: inattention >= 6 ? "Triagem positiva para desatenção (≥6 itens pontuados 2-3)" : "Triagem negativa para desatenção",
  });
  results.push({
    domain: "Hiperatividade/Impulsividade",
    score: hyperactivity,
    positive: hyperactivity >= 6,
    description: hyperactivity >= 6 ? "Triagem positiva para hiperatividade/impulsividade" : "Triagem negativa para hiperatividade/impulsividade",
  });
  results.push({
    domain: "Conduta/Oposição",
    score: conduct,
    positive: conduct >= 4,
    description: conduct >= 4 ? "Triagem positiva para problemas de conduta" : "Triagem negativa para problemas de conduta",
  });
  return results;
}

// --- BRIEF-2 (Behavior Rating Inventory of Executive Function — screening) ---
export const brief2Domains = [
  {
    name: "Inibição",
    color: "text-red-600 dark:text-red-400",
    items: [
      "Age sem pensar",
      "Não consegue parar de fazer algo quando mandado",
      "Tem dificuldade em 'frear' seu comportamento",
      "É impulsivo(a)",
      "Não pensa nas consequências antes de agir",
    ],
  },
  {
    name: "Flexibilidade",
    color: "text-orange-600 dark:text-orange-400",
    items: [
      "Fica perturbado(a) com mudanças de planos",
      "Tem dificuldade em se adaptar a situações novas",
      "Fica preso(a) em um tema ou atividade",
      "Resiste a mudanças na rotina",
      "Tem dificuldade em mudar de uma atividade para outra",
    ],
  },
  {
    name: "Controle Emocional",
    color: "text-pink-600 dark:text-pink-400",
    items: [
      "Tem acessos de raiva explosivos",
      "Reage de forma exagerada a pequenos problemas",
      "Chora facilmente",
      "O humor muda frequentemente",
      "Fica perturbado(a) demais com coisas pequenas",
    ],
  },
  {
    name: "Memória de Trabalho",
    color: "text-blue-600 dark:text-blue-400",
    items: [
      "Esquece o que estava fazendo",
      "Tem dificuldade em lembrar instruções",
      "Precisa de ajuda dos adultos para continuar tarefas",
      "Perde o fio da meada do que está fazendo",
      "Tem dificuldade em manter informações na cabeça enquanto faz algo",
    ],
  },
  {
    name: "Planejamento/Organização",
    color: "text-purple-600 dark:text-purple-400",
    items: [
      "Não planeja com antecedência",
      "Tem dificuldade em organizar materiais",
      "Não sabe por onde começar uma tarefa",
      "Subestima o tempo necessário para tarefas",
      "Deixa tudo para última hora",
    ],
  },
];
export const brief2Labels = ["Nunca", "Às vezes", "Frequentemente"];
export function classifyBrief2(domainScores: Record<string, number>) {
  const results = Object.entries(domainScores).map(([domain, score]) => {
    // Each domain max = 10 (5 items × 2)
    const tScore = Math.round(50 + (score - 3) * 5); // Approximate T-score conversion
    let classification = "Normal";
    let color = "emerald";
    if (tScore >= 65) { classification = "Clinicamente significativo"; color = "red"; }
    else if (tScore >= 60) { classification = "Potencialmente clínico"; color = "amber"; }
    return { domain, score, tScore, classification, color };
  });
  return results;
}

// --- ASQ-3 (Ages and Stages Questionnaire — simplified screening) ---
export const asq3AgeGroups = [
  { label: "2 meses", months: 2 },
  { label: "4 meses", months: 4 },
  { label: "6 meses", months: 6 },
  { label: "8 meses", months: 8 },
  { label: "10 meses", months: 10 },
  { label: "12 meses", months: 12 },
  { label: "14 meses", months: 14 },
  { label: "16 meses", months: 16 },
  { label: "18 meses", months: 18 },
  { label: "20 meses", months: 20 },
  { label: "22 meses", months: 22 },
  { label: "24 meses", months: 24 },
  { label: "27 meses", months: 27 },
  { label: "30 meses", months: 30 },
  { label: "33 meses", months: 33 },
  { label: "36 meses", months: 36 },
  { label: "42 meses", months: 42 },
  { label: "48 meses", months: 48 },
  { label: "54 meses", months: 54 },
  { label: "60 meses", months: 60 },
];
export const asq3Domains = [
  {
    name: "Comunicação",
    color: "text-blue-600 dark:text-blue-400",
    items: [
      "Faz sons ou balbucios quando está sozinho(a) ou brincando",
      "Produz sons longos como 'mamama' ou 'bababa'",
      "Olha para você quando você fala com ele(a)",
      "Responde ao próprio nome",
      "Aponta para coisas que deseja",
      "Diz pelo menos 3 palavras",
    ],
  },
  {
    name: "Coordenação Motora Ampla",
    color: "text-green-600 dark:text-green-400",
    items: [
      "Sustenta a cabeça quando apoiado(a) no colo",
      "Rola de barriga para cima ou para baixo",
      "Senta-se sem apoio",
      "Engatinha",
      "Fica em pé segurando-se nos móveis",
      "Anda sozinho(a)",
    ],
  },
  {
    name: "Coordenação Motora Fina",
    color: "text-purple-600 dark:text-purple-400",
    items: [
      "Segura um brinquedo pequeno com a mão inteira",
      "Passa objetos de uma mão para outra",
      "Pega objetos pequenos com polegar e indicador (pinça)",
      "Empilha 2 ou mais blocos",
      "Faz rabiscos com giz ou lápis",
      "Desenha uma linha vertical imitando",
    ],
  },
  {
    name: "Resolução de Problemas",
    color: "text-amber-600 dark:text-amber-400",
    items: [
      "Olha para um brinquedo e tenta alcançá-lo",
      "Tenta pegar um brinquedo caído",
      "Explora objetos virando, sacudindo, batendo",
      "Coloca objetos dentro de um recipiente",
      "Encaixa formas simples no lugar correto",
      "Usa um objeto como ferramenta para alcançar outro",
    ],
  },
  {
    name: "Pessoal-Social",
    color: "text-pink-600 dark:text-pink-400",
    items: [
      "Sorri de volta quando você sorri para ele(a)",
      "Levanta os braços para ser pego(a) no colo",
      "Come com os dedos sozinho(a)",
      "Tenta usar a colher sozinho(a)",
      "Ajuda a se vestir colocando os braços nas mangas",
      "Brinca de faz-de-conta (ex: dar comidinha a boneca)",
    ],
  },
];
export const asq3Labels = ["Sim", "Às vezes", "Ainda não"];
export const asq3Values = [10, 5, 0];
export function classifyAsq3Domain(score: number) {
  // Simplified cutoffs (real ASQ-3 has age-specific norms)
  if (score >= 40) return { classification: "Adequado", color: "emerald", description: "Desenvolvimento dentro do esperado." };
  if (score >= 25) return { classification: "Monitorar", color: "amber", description: "Próximo ao ponto de corte. Atividades de estimulação e reavaliação." };
  return { classification: "Encaminhar", color: "red", description: "Abaixo do esperado. Avaliação profissional recomendada." };
}

// --- CSHQ (Children's Sleep Habits Questionnaire) ---
export const cshqDomains = [
  {
    name: "Resistência para Dormir",
    color: "text-indigo-600 dark:text-indigo-400",
    items: [
      "A criança vai para a cama na hora certa",
      "A criança resiste a ir para a cama na hora de dormir",
      "A criança luta na hora de dormir (chora, se recusa, etc.)",
      "A criança tem medo de dormir no escuro",
      "A criança tem medo de dormir sozinha",
    ],
  },
  {
    name: "Início do Sono",
    color: "text-blue-600 dark:text-blue-400",
    items: [
      "A criança adormece sozinha na própria cama",
      "A criança precisa de um dos pais no quarto para adormecer",
      "A criança demora mais de 20 minutos para adormecer",
    ],
  },
  {
    name: "Duração do Sono",
    color: "text-purple-600 dark:text-purple-400",
    items: [
      "A criança dorme pouco (menos do que o esperado para a idade)",
      "A criança dorme a quantidade certa",
      "A criança dorme demais",
    ],
  },
  {
    name: "Ansiedade do Sono",
    color: "text-pink-600 dark:text-pink-400",
    items: [
      "A criança precisa dos pais na hora de dormir",
      "A criança tem problemas para dormir fora de casa",
      "A criança tem pensamentos/preocupações na hora de dormir",
    ],
  },
  {
    name: "Despertares Noturnos",
    color: "text-red-600 dark:text-red-400",
    items: [
      "A criança acorda uma ou mais vezes durante a noite",
      "A criança vai para a cama dos pais durante a noite",
      "A criança tem pesadelos",
    ],
  },
  {
    name: "Parassonias",
    color: "text-orange-600 dark:text-orange-400",
    items: [
      "A criança fala dormindo",
      "A criança é sonâmbula",
      "A criança range os dentes durante o sono (bruxismo)",
      "A criança ronca alto",
      "A criança transpira excessivamente durante o sono",
    ],
  },
  {
    name: "Sonolência Diurna",
    color: "text-amber-600 dark:text-amber-400",
    items: [
      "A criança acorda por conta própria pela manhã",
      "A criança parece cansada/sonolenta durante o dia",
      "A criança adormece enquanto assiste TV ou no carro",
    ],
  },
];
export const cshqLabels = ["Raramente (0-1x/sem)", "Às vezes (2-4x/sem)", "Habitualmente (5-7x/sem)"];
export function classifyCshq(total: number) {
  if (total <= 41) return { classification: "Normal", color: "emerald", description: "Hábitos de sono dentro da normalidade (≤41)." };
  return { classification: "Distúrbio do Sono", color: "red", description: `Pontuação ${total} (ponto de corte: 41). Sugere distúrbio do sono — avaliação do sono recomendada.` };
}

// --- YGTSS (Yale Global Tic Severity Scale — triagem) ---
export const ygtssMotorTics = [
  "Piscar os olhos de forma excessiva",
  "Movimentos da boca, lábios ou língua",
  "Movimentos da cabeça (sacudir, girar)",
  "Encolher os ombros",
  "Movimentos dos braços ou mãos",
  "Movimentos das pernas ou pés",
  "Movimentos abdominais (contrações)",
  "Movimentos faciais complexos (caretas)",
  "Gestos ou posturas complexas",
  "Tocar em si mesmo ou nos outros repetidamente",
];
export const ygtssVocalTics = [
  "Fungadas/limpar a garganta",
  "Grunhidos ou sons guturais",
  "Gritos ou berros",
  "Repetição de sons ou sílabas",
  "Repetição de palavras próprias (palilalia)",
  "Repetição de palavras dos outros (ecolalia)",
  "Palavras ou frases inapropriadas (coprolalia)",
  "Assobios, sopros ou outros sons",
];
export const ygtssFrequencyLabels = ["Ausente", "Raramente", "Frequentemente", "Quase sempre", "Constante"];
export const ygtssIntensityLabels = ["Nenhuma", "Mínima", "Leve", "Moderada", "Grave", "Muito grave"];
export function classifyYgtss(motorScore: number, vocalScore: number, impairment: number) {
  const totalTic = motorScore + vocalScore;
  const globalScore = totalTic + impairment;
  let severity = "Ausente";
  let color = "emerald";
  if (globalScore >= 50) { severity = "Grave"; color = "red"; }
  else if (globalScore >= 30) { severity = "Moderado"; color = "orange"; }
  else if (globalScore >= 10) { severity = "Leve"; color = "amber"; }
  else if (globalScore > 0) { severity = "Mínimo"; color = "emerald"; }
  return { motorScore, vocalScore, totalTic, impairment, globalScore, severity, color };
}

// --- ABC (Aberrant Behavior Checklist) ---
export const abcDomains = [
  {
    name: "Irritabilidade/Agitação",
    color: "text-red-600 dark:text-red-400",
    items: [
      "Fere-se (bate a cabeça, morde-se, etc.)",
      "É agressivo(a) com outros",
      "Grita de forma inadequada",
      "Birras/acessos de raiva",
      "Chora e grita por motivos mínimos",
      "Humor muda rapidamente",
      "Machuca outros puxando, mordendo, chutando",
      "Busca isolamento",
      "Destrói objetos",
      "É resistente a qualquer forma de contato físico",
      "Movimentos repetitivos de corpo (balança-se)",
      "Fica perturbado(a) se rotina é alterada",
      "É irritável e mal-humorado(a)",
      "Exige muita atenção",
      "É desobediente, difícil de controlar",
    ],
  },
  {
    name: "Letargia/Retraimento Social",
    color: "text-blue-600 dark:text-blue-400",
    items: [
      "Não reage quando abordado(a)",
      "Olhar fixo e sem expressão",
      "Inativo(a), nunca se move espontaneamente",
      "Não responde a comandos verbais",
      "É inexpressivo(a) (cara de poucos amigos)",
      "Evita contato visual",
      "Prefere ficar sozinho(a)",
      "Resposta emocional reduzida",
      "Não explora o ambiente",
      "Tem pouca interação com pares",
    ],
  },
  {
    name: "Comportamento Estereotipado",
    color: "text-purple-600 dark:text-purple-400",
    items: [
      "Movimentos repetitivos de corpo (balançar-se, sacudir mãos)",
      "Movimentos repetitivos de cabeça",
      "Movimentos bizarros (girar, andar na ponta dos pés)",
      "Faz barulhos repetitivos",
      "Movimentos repetitivos de mãos, dedos ou corpo",
      "Interesse excessivo por partes de objetos",
      "Rituais ou rotinas fixas",
    ],
  },
  {
    name: "Hiperatividade/Não conformidade",
    color: "text-orange-600 dark:text-orange-400",
    items: [
      "É excessivamente ativo(a)",
      "Fala excessivamente",
      "Corre ou pula de forma inadequada",
      "É inquieto(a), não para quieto(a)",
      "Não consegue sentar-se calmamente",
      "É desobediente, difícil de controlar",
      "Perturba os outros",
      "Não consegue esperar",
    ],
  },
  {
    name: "Fala Inadequada",
    color: "text-teal-600 dark:text-teal-400",
    items: [
      "Fala repetitiva (ecolalia)",
      "Fala monótona, sem entonação",
      "Fala de si mesmo(a) na terceira pessoa",
      "Conversa apenas sobre um tema específico",
    ],
  },
];
export const abcLabels = ["Não é problema", "Problema leve", "Problema moderado", "Problema grave"];
export function classifyAbc(domainScores: Record<string, number>) {
  return Object.entries(domainScores).map(([domain, score]) => ({
    domain,
    score,
    level: score <= 5 ? "Baixo" : score <= 15 ? "Moderado" : "Elevado",
    color: score <= 5 ? "emerald" : score <= 15 ? "amber" : "red",
  }));
}

// --- PedsQL (Pediatric Quality of Life Inventory — triagem) ---
export const pedsqlDomains = [
  {
    name: "Funcionamento Físico",
    color: "text-green-600 dark:text-green-400",
    items: [
      "É difícil para mim andar mais de um quarteirão",
      "É difícil para mim correr",
      "É difícil para mim praticar esportes ou exercícios",
      "É difícil para mim carregar coisas pesadas",
      "É difícil para mim tomar banho sozinho(a)",
      "É difícil para mim ajudar nas tarefas de casa",
      "Sinto dor",
      "Tenho pouca energia",
    ],
  },
  {
    name: "Funcionamento Emocional",
    color: "text-pink-600 dark:text-pink-400",
    items: [
      "Sinto medo ou pavor",
      "Fico triste",
      "Fico com raiva",
      "Tenho dificuldade para dormir",
      "Fico preocupado(a) com o que vai acontecer",
    ],
  },
  {
    name: "Funcionamento Social",
    color: "text-blue-600 dark:text-blue-400",
    items: [
      "Tenho dificuldade para me dar com outras crianças",
      "Outras crianças não querem ser minhas amigas",
      "Outras crianças implicam comigo",
      "Não consigo fazer coisas que outras crianças da minha idade fazem",
      "É difícil acompanhar os outros quando brincam",
    ],
  },
  {
    name: "Funcionamento Escolar",
    color: "text-amber-600 dark:text-amber-400",
    items: [
      "É difícil prestar atenção na aula",
      "Esqueço as coisas",
      "Tenho dificuldade para acompanhar as lições",
      "Falto à escola porque não me sinto bem",
      "Falto à escola para ir ao médico ou hospital",
    ],
  },
];
export const pedsqlLabels = ["Nunca", "Quase nunca", "Às vezes", "Frequentemente", "Quase sempre"];
export const pedsqlValues = [100, 75, 50, 25, 0]; // Reverse scored
export function classifyPedsql(domainScores: Record<string, number>) {
  return Object.entries(domainScores).map(([domain, avgScore]) => ({
    domain,
    score: Math.round(avgScore),
    level: avgScore >= 70 ? "Boa qualidade de vida" : avgScore >= 50 ? "Qualidade moderada" : "Qualidade comprometida",
    color: avgScore >= 70 ? "emerald" : avgScore >= 50 ? "amber" : "red",
  }));
}

// --- GMFCS (Gross Motor Function Classification System) ---
export const gmfcsLevels = [
  {
    level: "I",
    title: "Nível I — Anda sem Limitações",
    color: "emerald",
    description: "Anda em casa, na escola, ao ar livre e na comunidade. Consegue subir escadas sem apoio no corrimão. Realiza habilidades motoras grossas como correr e pular, mas a velocidade, equilíbrio e coordenação podem ser reduzidos.",
    characteristics: [
      "Anda sem limitações dentro e fora de casa",
      "Sobe e desce escadas sem apoio",
      "Corre e pula mas com limitações de velocidade e coordenação",
      "Participa de atividades físicas e esportivas",
    ],
  },
  {
    level: "II",
    title: "Nível II — Anda com Limitações",
    color: "amber",
    description: "Anda na maioria dos ambientes. Pode ter dificuldade em superfícies irregulares, inclinadas, em áreas lotadas ou espaços apertados. Pode usar dispositivos auxiliares para longas distâncias. Sobe escadas com apoio.",
    characteristics: [
      "Anda na maioria dos ambientes com limitações",
      "Dificuldade em terrenos irregulares e inclinações",
      "Sobe escadas com apoio no corrimão",
      "Pode precisar de cadeira de rodas para longas distâncias",
    ],
  },
  {
    level: "III",
    title: "Nível III — Anda com Dispositivo Auxiliar",
    color: "orange",
    description: "Anda usando dispositivo auxiliar de mobilidade manual (andador, muletas) em ambientes internos. Senta-se com apoio ou pode necessitar de cinto pélvico. Usa cadeira de rodas para distâncias maiores.",
    characteristics: [
      "Anda com andador ou muletas em ambientes internos",
      "Senta-se com apoio — pode precisar de cinto",
      "Usa cadeira de rodas manual para longas distâncias",
      "Pode conseguir subir escadas com apoio e supervisão",
    ],
  },
  {
    level: "IV",
    title: "Nível IV — Mobilidade Limitada (Cadeira de Rodas)",
    color: "red",
    description: "A auto-mobilidade é limitada. É transportado ou usa cadeira de rodas motorizada. Necessita de adaptações para sentar-se. Pode conseguir andar curtas distâncias com dispositivo e supervisão intensa.",
    characteristics: [
      "Usa cadeira de rodas na maioria dos ambientes",
      "Pode andar curtas distâncias com muito apoio",
      "Necessita de assento adaptado com suporte de tronco",
      "Pode operar cadeira de rodas motorizada",
    ],
  },
  {
    level: "V",
    title: "Nível V — Transportado em Cadeira de Rodas",
    color: "red",
    description: "Deficiências físicas graves limitam o controle voluntário do movimento. Não consegue manter posturas contra gravidade de cabeça e tronco. Requer tecnologia assistiva e assistência física total.",
    characteristics: [
      "Transportado em cadeira de rodas em todos os ambientes",
      "Limitações graves no controle de cabeça e tronco",
      "Necessita de equipamento adaptado extensivo",
      "Requer assistência física total para mobilidade",
    ],
  },
];

// --- Tipos para Diário de Crises Epilépticas ---
export interface EpilepsyEntry {
  date: string;
  time: string;
  type: string;
  duration: string;
  consciousness: string;
  triggers: string[];
  description: string;
  postIctal: string[];
  medication: string;
  notes: string;
}
export const epilepsyTypes = [
  "Tônico-clônica generalizada",
  "Ausência típica",
  "Ausência atípica",
  "Mioclônica",
  "Tônica",
  "Clônica",
  "Atônica",
  "Focal com consciência preservada",
  "Focal com consciência alterada",
  "Focal evoluindo para bilateral",
  "Espasmos epilépticos",
  "Outro / Não classificada",
];
export const epilepsyTriggers = [
  "Privação de sono",
  "Febre / Infecção",
  "Estresse emocional",
  "Exercício intenso",
  "Estímulo luminoso (fotossensibilidade)",
  "Menstruação",
  "Esquecimento de medicação",
  "Álcool",
  "Alimentação irregular",
  "Outro",
];
export const postIctalSymptoms = [
  "Sonolência",
  "Confusão mental",
  "Cefaleia",
  "Dor muscular",
  "Náusea/vômito",
  "Amnésia do evento",
  "Afasia transitória",
  "Fraqueza de membro (Todd)",
  "Nenhum",
];

// --- Tipos para Calendário de Cefaleia ---
export interface HeadacheEntry {
  date: string;
  intensity: number; // 0-10 VAS
  type: string;
  location: string;
  duration: string;
  aura: boolean;
  auraType: string;
  triggers: string[];
  symptoms: string[];
  medication: string;
  relief: string;
  notes: string;
}
export const headacheTypes = [
  "Migranosa (pulsátil, unilateral)",
  "Tensional (pressão, bilateral)",
  "Em salvas (cluster)",
  "Cervicogênica",
  "Secundária a sinusite",
  "Pós-traumática",
  "Outro / Não definida",
];
export const headacheLocations = [
  "Frontal bilateral",
  "Frontal unilateral",
  "Temporal bilateral",
  "Temporal unilateral",
  "Occipital",
  "Parietal",
  "Hemicraniana direita",
  "Hemicraniana esquerda",
  "Holocraniana (cabeça toda)",
  "Retro-orbitária",
];
export const headacheTriggers = [
  "Estresse/Ansiedade",
  "Privação de sono",
  "Excesso de sono",
  "Jejum prolongado",
  "Alimentos (chocolate, queijo, etc.)",
  "Mudança climática",
  "Exercício físico",
  "Telas (computador/celular)",
  "Menstruação",
  "Desidratação",
  "Outro",
];
export const headacheSymptoms = [
  "Náusea",
  "Vômito",
  "Fotofobia (sensibilidade à luz)",
  "Fonofobia (sensibilidade ao som)",
  "Osmofobia (sensibilidade a cheiros)",
  "Tontura",
  "Lacrimejamento",
  "Congestão nasal",
  "Piora com atividade física",
];
export const headacheAuraTypes = [
  "Visual (escotomas, linhas em zigue-zague)",
  "Sensitiva (formigamento, dormência)",
  "Motora (fraqueza)",
  "Linguagem (dificuldade para falar)",
  "Vestibular (vertigem)",
];
