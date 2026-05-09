// ============================================================
// Checklists Clínicos Adaptados para Avaliação do TEA
// Inspirados em: ADOS-2, ADI-R, CARS-2, GARS-3, SRS-2
// ============================================================

export interface ChecklistItem {
  id: string;
  text: string;
}

export interface ChecklistDomain {
  id: string;
  title: string;
  items: ChecklistItem[];
}

export interface SeverityOption {
  value: number;
  label: string;
}

export interface DimensionalItem {
  id: string;
  text: string;
  severityOptions: SeverityOption[];
}

export interface DimensionalDomain {
  id: string;
  title: string;
  items: DimensionalItem[];
}

export interface PsychometricInfo {
  sensitivity: string;
  specificity: string;
  note: string;
}

export interface AutismScale {
  id: string;
  shortName: string;
  fullName: string;
  fullNamePt: string;
  focus: string;
  type: "checklist" | "dimensional";
  color: string;
  gradient: string;
  psychometrics: PsychometricInfo;
  bestFor: string;
  domains?: ChecklistDomain[];
  dimensionalDomains?: DimensionalDomain[];
  synthesisDomain?: ChecklistDomain;
}

// ============================================================
// 1. ADOS-2 Adaptado
// ============================================================
const ados2: AutismScale = {
  id: "ados2",
  shortName: "ADOS-2",
  fullName: "Autism Diagnostic Observation Schedule – Second Edition",
  fullNamePt: "Escala de Observação para o Diagnóstico do Autismo – 2ª Edição",
  focus: "Observação direta da interação social, comunicação, brincadeira e comportamentos restritos/repetitivos.",
  type: "checklist",
  color: "blue",
  gradient: "from-blue-500 to-indigo-500",
  psychometrics: {
    sensitivity: "~87%",
    specificity: "~75%",
    note: "Melhor instrumento de observação direta. Desempenho varia por módulo e contexto clínico.",
  },
  bestFor: "Observação direta — o que a criança faz na sua frente.",
  domains: [
    {
      id: "ados2-a",
      title: "A. Contato Social e Reciprocidade",
      items: [
        { id: "ados2-a1", text: "Faz contato visual espontâneo" },
        { id: "ados2-a2", text: "Mantém contato visual de forma funcional durante a interação" },
        { id: "ados2-a3", text: "Responde ao nome de forma consistente" },
        { id: "ados2-a4", text: "Compartilha interesse com o examinador" },
        { id: "ados2-a5", text: "Mostra objetos para dividir atenção, e não apenas para pedir ajuda" },
        { id: "ados2-a6", text: "Busca envolver o outro em atividade prazerosa" },
        { id: "ados2-a7", text: "Demonstra prazer compartilhado" },
        { id: "ados2-a8", text: "Alterna atenção entre objeto e pessoa" },
        { id: "ados2-a9", text: "Responde a tentativas de interação social" },
        { id: "ados2-a10", text: "Inicia interação social espontaneamente" },
      ],
    },
    {
      id: "ados2-b",
      title: "B. Comunicação Verbal e Não Verbal",
      items: [
        { id: "ados2-b1", text: "Usa gestos comunicativos espontâneos" },
        { id: "ados2-b2", text: "Aponta para pedir" },
        { id: "ados2-b3", text: "Aponta para mostrar/interessar-se" },
        { id: "ados2-b4", text: "Usa expressões faciais adequadas ao contexto" },
        { id: "ados2-b5", text: "Coordena olhar + gesto + vocalização" },
        { id: "ados2-b6", text: "A comunicação tem intenção social clara" },
        { id: "ados2-b7", text: "Mantém trocas comunicativas mínimas" },
        { id: "ados2-b8", text: "Responde a perguntas simples" },
        { id: "ados2-b9", text: "Sustenta pequena conversação, quando a idade permite" },
        { id: "ados2-b10", text: "A prosódia (ritmo/entonação da fala) parece natural" },
        { id: "ados2-b11", text: "Há ecolalia imediata" },
        { id: "ados2-b12", text: "Há ecolalia tardia" },
        { id: "ados2-b13", text: "Há linguagem estereotipada ou repetitiva" },
        { id: "ados2-b14", text: "Há inversão pronominal" },
        { id: "ados2-b15", text: "Há fala excessivamente formal, robotizada ou pedante" },
      ],
    },
    {
      id: "ados2-c",
      title: "C. Brincadeira e Imaginação",
      items: [
        { id: "ados2-c1", text: "Manipula brinquedos de modo funcional" },
        { id: "ados2-c2", text: "Realiza brincadeira simbólica simples" },
        { id: "ados2-c3", text: "Faz faz-de-conta espontâneo" },
        { id: "ados2-c4", text: "Inclui personagens ou papéis na brincadeira" },
        { id: "ados2-c5", text: "Consegue variar a brincadeira" },
        { id: "ados2-c6", text: "Tolera sugestão de nova forma de brincar" },
        { id: "ados2-c7", text: "Demonstra imaginação compatível com a idade" },
        { id: "ados2-c8", text: "Fixa-se apenas em partes do brinquedo" },
        { id: "ados2-c9", text: "Repete padrões de brincar de modo rígido" },
      ],
    },
    {
      id: "ados2-d",
      title: "D. Comportamentos Restritos e Repetitivos",
      items: [
        { id: "ados2-d1", text: "Realiza movimentos repetitivos com mãos/dedos" },
        { id: "ados2-d2", text: "Balança corpo, pula ou gira repetidamente" },
        { id: "ados2-d3", text: "Alinha objetos" },
        { id: "ados2-d4", text: "Gira objetos ou observa movimento repetido" },
        { id: "ados2-d5", text: "Apega-se a rotinas de forma excessiva" },
        { id: "ados2-d6", text: "Mostra incômodo importante com pequenas mudanças" },
        { id: "ados2-d7", text: "Apresenta interesses incomuns em intensidade ou foco" },
        { id: "ados2-d8", text: "Fixa-se em temas muito restritos" },
        { id: "ados2-d9", text: "Usa objetos de modo repetitivo e pouco funcional" },
        { id: "ados2-d10", text: "Demonstra fascínio sensorial atípico" },
        { id: "ados2-d11", text: "Cheira, lambe, encosta ou observa estímulos de modo incomum" },
      ],
    },
  ],
};

// ============================================================
// 2. ADI-R Adaptado
// ============================================================
const adir: AutismScale = {
  id: "adir",
  shortName: "ADI-R",
  fullName: "Autism Diagnostic Interview – Revised",
  fullNamePt: "Entrevista Diagnóstica para o Autismo – Revisada",
  focus: "História do desenvolvimento e padrão comportamental ao longo do tempo.",
  type: "checklist",
  color: "emerald",
  gradient: "from-emerald-500 to-teal-500",
  psychometrics: {
    sensitivity: "~75–77%",
    specificity: "~68–82%",
    note: "Melhor entrevista desenvolvimental estruturada. Oscila conforme perfil verbal e qualidade da história obtida.",
  },
  bestFor: "Entender como o quadro nasceu e evoluiu.",
  domains: [
    {
      id: "adir-a",
      title: "A. História do Desenvolvimento Social",
      items: [
        { id: "adir-a1", text: "Sorriu socialmente no período esperado" },
        { id: "adir-a2", text: "Buscava colo, aconchego ou proximidade afetiva" },
        { id: "adir-a3", text: "Demonstrava preferência por pessoas familiares" },
        { id: "adir-a4", text: "Imitava expressões ou gestos" },
        { id: "adir-a5", text: "Compartilhava interesses com os pais" },
        { id: "adir-a6", text: "Gostava de brincar com outras crianças" },
        { id: "adir-a7", text: "Tinha iniciativa espontânea de interação" },
        { id: "adir-a8", text: "Respondia adequadamente a expressões emocionais dos outros" },
        { id: "adir-a9", text: "Demonstrava reciprocidade afetiva" },
        { id: "adir-a10", text: 'Parecia "no próprio mundo" em fases do desenvolvimento' },
      ],
    },
    {
      id: "adir-b",
      title: "B. Linguagem e Comunicação ao Longo do Desenvolvimento",
      items: [
        { id: "adir-b1", text: "Houve atraso para balbucio/falas iniciais" },
        { id: "adir-b2", text: "Houve atraso para palavras isoladas" },
        { id: "adir-b3", text: "Houve atraso para frases espontâneas" },
        { id: "adir-b4", text: "Já perdeu palavras que antes dizia" },
        { id: "adir-b5", text: "Já perdeu habilidades comunicativas previamente adquiridas" },
        { id: "adir-b6", text: "Usava gestos para se comunicar" },
        { id: "adir-b7", text: "Apontava para mostrar" },
        { id: "adir-b8", text: "Apontava para pedir" },
        { id: "adir-b9", text: "Entendia ordens simples no tempo esperado" },
        { id: "adir-b10", text: "Fazia uso funcional da linguagem" },
        { id: "adir-b11", text: "Mantinha diálogo recíproco, quando esperado para a idade" },
        { id: "adir-b12", text: "Havia ecolalia marcante" },
        { id: "adir-b13", text: "Havia linguagem repetitiva/roteirizada" },
        { id: "adir-b14", text: "Fazia perguntas repetitivas" },
        { id: "adir-b15", text: "A linguagem tinha pouca finalidade social" },
      ],
    },
    {
      id: "adir-c",
      title: "C. Padrões Repetitivos, Interesses Restritos e Rigidez",
      items: [
        { id: "adir-c1", text: "Demonstrava apego excessivo a rotinas" },
        { id: "adir-c2", text: "Tinha crises diante de mudanças" },
        { id: "adir-c3", text: "Insistia em trajetos, objetos ou sequências fixas" },
        { id: "adir-c4", text: "Possuía interesses muito intensos e restritos" },
        { id: "adir-c5", text: "Repetia movimentos corporais" },
        { id: "adir-c6", text: "Manipulava objetos de forma repetitiva" },
        { id: "adir-c7", text: "Fixava-se em partes de objetos" },
        { id: "adir-c8", text: "Tinha rituais incomuns" },
        { id: "adir-c9", text: "Demonstrava fascínio por sons, luzes, giros ou texturas" },
        { id: "adir-c10", text: "Apresentava seletividade sensorial marcante" },
      ],
    },
    {
      id: "adir-d",
      title: "D. Marcos Clínicos Relevantes",
      items: [
        { id: "adir-d1", text: "Sinais estavam presentes desde a primeira infância" },
        { id: "adir-d2", text: "Os sintomas eram perceptíveis antes dos 3 anos" },
        { id: "adir-d3", text: "Houve regressão do desenvolvimento" },
        { id: "adir-d4", text: "Houve perda de linguagem" },
        { id: "adir-d5", text: "Houve perda de interação social" },
        { id: "adir-d6", text: "O quadro interfere no funcionamento diário" },
        { id: "adir-d7", text: "Os sintomas aparecem em casa, escola e outros ambientes" },
      ],
    },
  ],
};

// ============================================================
// 3. CARS-2 Adaptado (Dimensional)
// ============================================================
const severityOptions: SeverityOption[] = [
  { value: 0, label: "Dentro do esperado" },
  { value: 1, label: "Levemente alterada" },
  { value: 2, label: "Moderadamente alterada" },
  { value: 3, label: "Intensamente alterada" },
];

const cars2: AutismScale = {
  id: "cars2",
  shortName: "CARS-2",
  fullName: "Childhood Autism Rating Scale – Second Edition",
  fullNamePt: "Escala de Avaliação do Autismo na Infância – 2ª Edição",
  focus: "Julgamento clínico dimensional da intensidade dos sinais.",
  type: "dimensional",
  color: "amber",
  gradient: "from-amber-500 to-orange-500",
  psychometrics: {
    sensitivity: "~89% (até 100% no ponto de corte 30)",
    specificity: "~79% (até 86% no ponto de corte ótimo)",
    note: "Melhor escala clínica dimensional de apoio. Ponto de corte 30,25 apresentou Se 98,9% e Sp 86,1% para módulos 1 e 2 do ADOS-2.",
  },
  bestFor: 'Sair do "tem ou não tem" e medir o quanto compromete.',
  dimensionalDomains: [
    {
      id: "cars2-areas",
      title: "Áreas para Julgamento Clínico",
      items: [
        { id: "cars2-1", text: "Relação com pessoas", severityOptions },
        { id: "cars2-2", text: "Imitação", severityOptions },
        { id: "cars2-3", text: "Resposta emocional", severityOptions },
        { id: "cars2-4", text: "Uso do corpo", severityOptions },
        { id: "cars2-5", text: "Uso de objetos", severityOptions },
        { id: "cars2-6", text: "Adaptação a mudanças", severityOptions },
        { id: "cars2-7", text: "Resposta visual", severityOptions },
        { id: "cars2-8", text: "Resposta auditiva", severityOptions },
        { id: "cars2-9", text: "Respostas de paladar, olfato e tato", severityOptions },
        { id: "cars2-10", text: "Medo ou ansiedade", severityOptions },
        { id: "cars2-11", text: "Comunicação verbal", severityOptions },
        { id: "cars2-12", text: "Comunicação não verbal", severityOptions },
        { id: "cars2-13", text: "Nível de atividade", severityOptions },
        { id: "cars2-14", text: "Nível e consistência intelectual / perfil cognitivo", severityOptions },
        { id: "cars2-15", text: "Impressão clínica global de compatibilidade com TEA", severityOptions },
      ],
    },
  ],
  synthesisDomain: {
    id: "cars2-synthesis",
    title: "Síntese Dimensional",
    items: [
      { id: "cars2-s1", text: "Predomínio de alterações leves" },
      { id: "cars2-s2", text: "Predomínio de alterações moderadas" },
      { id: "cars2-s3", text: "Predomínio de alterações marcantes" },
      { id: "cars2-s4", text: "Comprometimento funcional discreto" },
      { id: "cars2-s5", text: "Comprometimento funcional moderado" },
      { id: "cars2-s6", text: "Comprometimento funcional importante" },
      { id: "cars2-s7", text: "Quadro compatível com traços autísticos" },
      { id: "cars2-s8", text: "Quadro compatível com TEA provável" },
      { id: "cars2-s9", text: "Quadro compatível com TEA claramente estabelecido" },
    ],
  },
};

// ============================================================
// 4. GARS-3 Adaptado
// ============================================================
const gars3: AutismScale = {
  id: "gars3",
  shortName: "GARS-3",
  fullName: "Gilliam Autism Rating Scale – Third Edition",
  fullNamePt: "Escala de Avaliação do Autismo de Gilliam – 3ª Edição",
  focus: "Leitura por subdomínios comportamentais, com visão global probabilística.",
  type: "checklist",
  color: "violet",
  gradient: "from-violet-500 to-purple-500",
  psychometrics: {
    sensitivity: "Variável — literatura inconsistente",
    specificity: "Variável — falsos positivos altos em amostras de comunidade (82–88%)",
    note: "Mais frágil como eixo isolado de decisão diagnóstica. Útil para triagem e fracionamento em subdomínios. Deve ser interpretado com cautela e correlação clínica.",
  },
  bestFor: "Deixar o protocolo mais operacional e rastreável por blocos.",
  domains: [
    {
      id: "gars3-a",
      title: "A. Interação Social",
      items: [
        { id: "gars3-a1", text: "Evita ou reduz contato com pares" },
        { id: "gars3-a2", text: "Tem dificuldade de compartilhar interesses" },
        { id: "gars3-a3", text: "Não percebe bem sinais sociais" },
        { id: "gars3-a4", text: "Responde pouco à aproximação do outro" },
        { id: "gars3-a5", text: "Tem dificuldade em manter amizade compatível com a idade" },
        { id: "gars3-a6", text: "Parece indiferente à presença de outras pessoas" },
        { id: "gars3-a7", text: "Interage de modo estranho, unilateral ou pouco recíproco" },
      ],
    },
    {
      id: "gars3-b",
      title: "B. Comunicação Social",
      items: [
        { id: "gars3-b1", text: "Dificuldade de iniciar conversa" },
        { id: "gars3-b2", text: "Dificuldade de manter conversa" },
        { id: "gars3-b3", text: "Fala pouco funcional socialmente" },
        { id: "gars3-b4", text: "Linguagem repetitiva" },
        { id: "gars3-b5", text: "Uso estranho de tom, ritmo ou volume" },
        { id: "gars3-b6", text: "Dificuldade para compreender linguagem implícita" },
        { id: "gars3-b7", text: "Dificuldade para ajustar fala ao contexto" },
      ],
    },
    {
      id: "gars3-c",
      title: "C. Comportamentos Repetitivos",
      items: [
        { id: "gars3-c1", text: "Movimentos motores repetitivos" },
        { id: "gars3-c2", text: "Uso repetitivo de objetos" },
        { id: "gars3-c3", text: "Fala repetitiva" },
        { id: "gars3-c4", text: "Insistência em rotinas" },
        { id: "gars3-c5", text: "Resistência a mudanças" },
        { id: "gars3-c6", text: "Interesse fixo incomum" },
        { id: "gars3-c7", text: "Comportamento ritualizado" },
      ],
    },
    {
      id: "gars3-d",
      title: "D. Respostas Emocionais e Comportamentais Associadas",
      items: [
        { id: "gars3-d1", text: "Irrita-se facilmente com mudanças" },
        { id: "gars3-d2", text: "Crises por frustração ou quebra de rotina" },
        { id: "gars3-d3", text: "Dificuldade de autorregulação" },
        { id: "gars3-d4", text: "Reação intensa a estímulos sensoriais" },
        { id: "gars3-d5", text: "Oscilações comportamentais em ambientes sociais" },
        { id: "gars3-d6", text: "Baixa flexibilidade diante de demandas novas" },
      ],
    },
  ],
  synthesisDomain: {
    id: "gars3-global",
    title: "Leitura Global",
    items: [
      { id: "gars3-g1", text: "Poucos traços" },
      { id: "gars3-g2", text: "Traços leves, porém consistentes" },
      { id: "gars3-g3", text: "Múltiplos sinais em mais de um domínio" },
      { id: "gars3-g4", text: "Padrão global fortemente sugestivo de TEA" },
      { id: "gars3-g5", text: "Necessidade de correlação com exame clínico e história evolutiva" },
    ],
  },
};

// ============================================================
// 5. SRS-2 Adaptado
// ============================================================
const srs2: AutismScale = {
  id: "srs2",
  shortName: "SRS-2",
  fullName: "Social Responsiveness Scale – Second Edition",
  fullNamePt: "Escala de Responsividade Social – 2ª Edição",
  focus: "Prejuízo em comunicação social e comportamentos restritos/repetitivos, sobretudo em crianças maiores e adolescentes.",
  type: "checklist",
  color: "rose",
  gradient: "from-rose-500 to-pink-500",
  psychometrics: {
    sensitivity: "~93% (em validações específicas; cai para ~60% vs. outros TND)",
    specificity: "~98% (em validações específicas; cai para ~78% vs. outros TND)",
    note: "Mais útil para traços sociais dimensionais em maiores. Ótimo para rastreio dimensional, mas não deve ser prova diagnóstica isolada.",
  },
  bestFor: "Captar casos sutis, quando o paciente fala bem mas a interação social é atípica.",
  domains: [
    {
      id: "srs2-a",
      title: "A. Percepção Social",
      items: [
        { id: "srs2-a1", text: "Percebe mal pistas sociais" },
        { id: "srs2-a2", text: "Tem dificuldade de notar expressões faciais" },
        { id: "srs2-a3", text: "Não compreende bem a intenção do outro" },
        { id: "srs2-a4", text: "Perde nuances da interação social" },
        { id: "srs2-a5", text: "Interpreta de forma literal situações sociais" },
      ],
    },
    {
      id: "srs2-b",
      title: "B. Cognição Social",
      items: [
        { id: "srs2-b1", text: "Dificuldade para entender contextos sociais" },
        { id: "srs2-b2", text: "Dificuldade para inferir sentimentos/pensamentos alheios" },
        { id: "srs2-b3", text: "Dificuldade para compreender ironia, indiretas ou duplo sentido" },
        { id: "srs2-b4", text: "Dificuldade para ajustar comportamento conforme o ambiente" },
        { id: "srs2-b5", text: "Ingenuidade social ou leitura social empobrecida" },
      ],
    },
    {
      id: "srs2-c",
      title: "C. Comunicação Social",
      items: [
        { id: "srs2-c1", text: "Conversa pouco recíproca" },
        { id: "srs2-c2", text: "Monólogos sobre temas de interesse" },
        { id: "srs2-c3", text: "Dificuldade para respeitar turnos de fala" },
        { id: "srs2-c4", text: "Pouca adaptação da linguagem ao ouvinte" },
        { id: "srs2-c5", text: "Dificuldade de iniciar/manter amizades" },
        { id: "srs2-c6", text: 'Interação social parece "mecânica" ou "estranha"' },
      ],
    },
    {
      id: "srs2-d",
      title: "D. Motivação Social",
      items: [
        { id: "srs2-d1", text: "Busca pouco espontânea por interação" },
        { id: "srs2-d2", text: "Prefere ficar isolado" },
        { id: "srs2-d3", text: "Aproxima-se apenas quando há interesse próprio" },
        { id: "srs2-d4", text: "Interesse social reduzido ou atípico" },
        { id: "srs2-d5", text: "Relações sociais superficiais ou inconsistentes" },
      ],
    },
    {
      id: "srs2-e",
      title: "E. Padrões Restritos e Repetitivos",
      items: [
        { id: "srs2-e1", text: "Rigidez comportamental" },
        { id: "srs2-e2", text: "Apego a rotina" },
        { id: "srs2-e3", text: "Interesses excessivamente circunscritos" },
        { id: "srs2-e4", text: "Repetição de temas, falas ou ações" },
        { id: "srs2-e5", text: "Resistência a mudanças" },
        { id: "srs2-e6", text: "Sensibilidade sensorial associada" },
      ],
    },
  ],
};

// ============================================================
// Export
// ============================================================
export const autismScales: AutismScale[] = [ados2, adir, cars2, gars3, srs2];

// ============================================================
// Quick-reference summary items for consultation
// ============================================================
export interface QuickRefScale {
  shortName: string;
  domains: string[];
}

export const quickRefSummary: QuickRefScale[] = [
  {
    shortName: "ADOS-2",
    domains: [
      "Interação social",
      "Comunicação",
      "Brincadeira simbólica",
      "RRBs (comportamentos restritos e repetitivos)",
    ],
  },
  {
    shortName: "ADI-R",
    domains: [
      "História social precoce",
      "Linguagem/desenvolvimento",
      "RRBs e rigidez",
      "Regressão/perda de habilidades",
    ],
  },
  {
    shortName: "CARS-2",
    domains: [
      "Gravidade leve",
      "Gravidade moderada",
      "Gravidade importante",
      "Impacto funcional",
    ],
  },
  {
    shortName: "GARS-3",
    domains: [
      "Interação social",
      "Comunicação social",
      "Comportamentos repetitivos",
      "Leitura global sugestiva",
    ],
  },
  {
    shortName: "SRS-2",
    domains: [
      "Percepção social",
      "Cognição social",
      "Comunicação social",
      "Motivação social",
      "Interesses restritos/rigidez",
    ],
  },
];

// Best-of-each summary
export const bestOfEach = [
  {
    scale: "ADOS-2",
    strength: "Observação direta estruturada",
    picks: [
      "Análise de contato social recíproco",
      "Avaliação da comunicação verbal e não verbal",
      "Observação da brincadeira simbólica",
      "Observação ao vivo de RRBs",
    ],
    motto: "O que a criança faz na sua frente.",
  },
  {
    scale: "ADI-R",
    strength: "Entrevista desenvolvimental",
    picks: [
      "História desenvolvimental detalhada",
      "Investigação de sinais precoces",
      "Pesquisa de regressão",
      "Eixo temporal: reciprocidade social + linguagem + rigidez",
      "Comparação entre antes e agora",
    ],
    motto: "Entender como o quadro nasceu e evoluiu.",
  },
  {
    scale: "CARS-2",
    strength: "Julgamento dimensional",
    picks: [
      "Lógica de julgamento clínico dimensional",
      "Leitura de gravidade",
      "Noção de intensidade por domínio",
      "Síntese de impacto funcional",
      "Visão de conjunto do caso",
    ],
    motto: 'Sair do "tem ou não tem" e medir o quanto compromete.',
  },
  {
    scale: "GARS-3",
    strength: "Subdomínios operacionais",
    picks: [
      "Divisão em subdomínios",
      "Checklist mais fracionado",
      "Leitura organizada por blocos",
      "Transformar sintomas em perfil de áreas alteradas",
    ],
    motto: "Protocolo operacional e rastreável.",
  },
  {
    scale: "SRS-2",
    strength: "Responsividade social fina",
    picks: [
      "Foco fino em responsividade social",
      "Avaliação de percepção e cognição social",
      "Análise da motivação social",
      "Utilidade em crianças maiores e adolescentes verbais",
    ],
    motto: "Captar os casos sutis, quando a fala é boa mas a interação é atípica.",
  },
];
