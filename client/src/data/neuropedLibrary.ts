export type WiscIndexAbbreviation = "ICV" | "IOP" | "IMO" | "IVP";

export interface LibraryReference {
  id: number;
  citation: string;
  url: string;
  verifiedAt: string;
  supports: string;
}

export interface WiscIndexGuide {
  abbreviation: WiscIndexAbbreviation;
  internationalLabel: string;
  title: string;
  guidingQuestion: string;
  measures: string;
  clinicalReading: string;
  confounders: string[];
  functionalClues: string[];
  tone: "indigo" | "cyan" | "amber" | "rose";
}

export interface DiagnosticLens {
  id:
    | "tdah"
    | "tea"
    | "transtorno-aprendizagem"
    | "deficiencia-intelectual"
    | "epilepsia"
    | "lesao-neurologica"
    | "altas-habilidades";
  title: string;
  pattern: string;
  interpretation: string;
  mustCorrelate: string;
  evidenceRefs: number[];
}

export interface LibraryChapter {
  id: string;
  slug: string;
  chapterNumber: number;
  title: string;
  subtitle: string;
  category: string;
  publishedAt: string;
  updatedAt: string;
  readingMinutes: number;
  audience: string;
  opening: string;
  learningObjectives: string[];
  indices: WiscIndexGuide[];
  readingSequence: Array<{
    step: string;
    title: string;
    description: string;
  }>;
  diagnosticLenses: DiagnosticLens[];
  vignette: {
    title: string;
    presentation: string;
    wrongShortcut: string;
    expertReading: string[];
    nextQuestions: string[];
  };
  qitGuide: {
    title: string;
    coherent: string;
    heterogeneous: string;
    neverDo: string;
  };
  keyPoints: string[];
  references: LibraryReference[];
  evidence: {
    literatureCutoff: string;
    consensus: {
      status: "blocked_usage_counter" | "completed";
      note: string;
    };
  };
  safety: {
    disclaimer: string;
    copyright: string;
    professionalBoundary: string;
  };
}

const wiscIvReferences: LibraryReference[] = [
  {
    id: 1,
    citation:
      "Pearson. WISC-IV Technical Report #1: estrutura dos quatro índices e composição do QI Total.",
    url: "https://www.pearsonassessments.com/content/dam/school/global/clinical/us/assets/wisc-iv/wisc-iv-technical-report-1.pdf",
    verifiedAt: "2026-10-28",
    supports:
      "Estrutura do instrumento, quatro índices e cautela para não tratar o QI Total como média aritmética.",
  },
  {
    id: 2,
    citation:
      "Thaler NS et al. WISC-IV profiles are associated with differences in symptomatology and outcome in children with ADHD. J Learn Disabil. 2013.",
    url: "https://pubmed.ncbi.nlm.nih.gov/22286109/",
    verifiedAt: "2026-10-28",
    supports:
      "Heterogeneidade de perfis no TDAH e associação de memória operacional/velocidade com funcionamento, sem equivalência diagnóstica.",
  },
  {
    id: 3,
    citation:
      "Oliveras-Rentas RE et al. WISC-IV profile in high-functioning autism spectrum disorders. J Autism Dev Disord. 2012.",
    url: "https://pubmed.ncbi.nlm.nih.gov/21638108/",
    verifiedAt: "2026-10-28",
    supports:
      "Possível fraqueza relativa em velocidade de processamento no TEA e relação com comunicação adaptativa em uma amostra clínica.",
  },
  {
    id: 4,
    citation:
      "Wilson AC et al. Cognitive Profile in Autism and ADHD: a meta-analysis of performance on Wechsler scales. Arch Clin Neuropsychol. 2024.",
    url: "https://pubmed.ncbi.nlm.nih.gov/37779387/",
    verifiedAt: "2026-10-28",
    supports:
      "Perfis médios não têm sensibilidade nem especificidade suficientes para uso diagnóstico individual.",
  },
  {
    id: 5,
    citation:
      "Alimoğlu EB et al. Cognitive Index Differences on the WISC-IV among children with SLD, ADHD and a comparison group. Dev Neuropsychol. 2026.",
    url: "https://pubmed.ncbi.nlm.nih.gov/42573982/",
    verifiedAt: "2026-10-28",
    supports:
      "Sobreposição entre grupos clínicos e necessidade de integrar achados cognitivos à avaliação clínica e psicoeducacional.",
  },
  {
    id: 6,
    citation:
      "Sherman EMS et al. Detecting epilepsy-related cognitive problems in clinically referred children with epilepsy: is the WISC-IV useful? Epilepsia. 2012.",
    url: "https://pubmed.ncbi.nlm.nih.gov/22554239/",
    verifiedAt: "2026-10-28",
    supports:
      "Sensibilidade a dificuldades cognitivas em crianças com epilepsia e alta carga de doença, sobretudo em memória operacional e velocidade.",
  },
  {
    id: 7,
    citation:
      "Allen DN et al. WISC-IV profiles in children with traumatic brain injury. Psychol Assess. 2010.",
    url: "https://pubmed.ncbi.nlm.nih.gov/20230152/",
    verifiedAt: "2026-10-28",
    supports:
      "Déficits amplos após traumatismo cranioencefálico pediátrico, com maior vulnerabilidade média em velocidade de processamento.",
  },
];

const wiscIvChapter: LibraryChapter = {
  id: "biblioteca-capitulo-001",
  slug: "interpretacao-wisc-iv-neuropediatria",
  chapterNumber: 1,
  title: "Como interpretar o WISC-IV em Neurologia Infantil",
  subtitle:
    "Um mapa visual dos quatro índices — da descrição cognitiva à hipótese funcional, sem transformar perfil em diagnóstico.",
  category: "Neuropsicologia clínica",
  publishedAt: "2026-10-28",
  updatedAt: "2026-10-28",
  readingMinutes: 12,
  audience:
    "Neuropediatras, neurologistas infantis e profissionais que recebem um laudo psicológico ou neuropsicológico.",
  opening:
    "O WISC-IV organiza o desempenho em quatro grandes lentes. Elas não localizam uma lesão, não confirmam TDAH, TEA, transtorno específico de aprendizagem ou deficiência intelectual e não substituem a história clínica. Seu valor está em mostrar como a criança raciocina sob diferentes demandas e quais barreiras podem explicar a distância entre potencial, desempenho escolar e autonomia.",
  learningObjectives: [
    "Reconhecer o construto principal de ICV, IOP, IMO e IVP.",
    "Ler discrepâncias como perguntas clínicas, nunca como rótulos automáticos.",
    "Separar capacidade de raciocínio de eficiência cognitiva no momento da avaliação.",
    "Converter achados em hipóteses funcionais e próximos passos verificáveis.",
  ],
  indices: [
    {
      abbreviation: "ICV",
      internationalLabel: "VCI",
      title: "Índice de Compreensão Verbal",
      guidingQuestion: "Como a criança forma, organiza e expressa conceitos mediados pela linguagem?",
      measures:
        "Raciocínio verbal, conhecimento adquirido, abstração por palavras e qualidade da expressão conceitual.",
      clinicalReading:
        "Um ICV relativamente baixo pede investigação de linguagem receptiva/expressiva, acesso educacional e experiência sociocultural antes de qualquer inferência sobre inteligência global.",
      confounders: [
        "transtorno do desenvolvimento da linguagem",
        "perda auditiva ou compreensão insuficiente da instrução",
        "escolarização irregular e diferenças socioculturais",
        "ansiedade, mutismo ou baixa familiaridade linguística",
      ],
      functionalClues: [
        "explicar relações e conceitos",
        "compreender enunciados longos",
        "aprender por exposição verbal",
      ],
      tone: "indigo",
    },
    {
      abbreviation: "IOP",
      internationalLabel: "PRI",
      title: "Índice de Organização Perceptual",
      guidingQuestion: "Como a criança raciocina diante de relações visuais e problemas novos?",
      measures:
        "Análise visuoespacial, formação de conceitos não verbais e raciocínio fluido com menor dependência da linguagem.",
      clinicalReading:
        "Uma diferença ICV–IOP descreve canais de desempenho distintos; ela não prova dominância hemisférica, transtorno não verbal ou etiologia neurológica.",
      confounders: [
        "acuidade visual e percepção visuoespacial",
        "coordenação motora em tarefas que a exigem",
        "impulsividade e estratégia pouco sistemática",
        "exposição prévia a materiais e quebra-cabeças",
      ],
      functionalClues: [
        "resolver problemas por demonstração",
        "organizar informação visual",
        "inferir regras sem apoio verbal extenso",
      ],
      tone: "cyan",
    },
    {
      abbreviation: "IMO",
      internationalLabel: "WMI",
      title: "Índice de Memória Operacional",
      guidingQuestion: "Quanto a criança consegue manter e manipular enquanto pensa?",
      measures:
        "Retenção ativa, manipulação mental, atenção auditiva e controle do foco sob demanda sequencial.",
      clinicalReading:
        "IMO baixo é uma pista transdiagnóstica. Pode aparecer com desatenção, dificuldades de linguagem/aprendizagem, epilepsia, privação de sono, ansiedade ou efeito medicamentoso.",
      confounders: [
        "fadiga, sono e horário da aplicação",
        "audição e compreensão verbal",
        "ansiedade de desempenho",
        "medicações e controle de crises",
      ],
      functionalClues: [
        "seguir instruções em múltiplas etapas",
        "cálculo mental e cópia com retenção",
        "manter o objetivo enquanto executa",
      ],
      tone: "amber",
    },
    {
      abbreviation: "IVP",
      internationalLabel: "PSI",
      title: "Índice de Velocidade de Processamento",
      guidingQuestion: "Com que eficiência a criança percebe, decide e registra sob limite de tempo?",
      measures:
        "Velocidade e precisão do rastreio visual, decisão simples e resposta grafomotora em tarefas cronometradas.",
      clinicalReading:
        "IVP não é velocidade de pensamento pura. Um resultado baixo pode refletir cautela, grafomotricidade, visão, atenção, fadiga ou lentificação, e precisa ser decomposto.",
      confounders: [
        "coordenação motora fina e velocidade grafomotora",
        "alterações visuais ou oculomotoras",
        "perfeccionismo e prioridade por precisão",
        "desatenção, fadiga, dor ou sedação",
      ],
      functionalClues: [
        "terminar atividades no tempo previsto",
        "copiar, localizar e marcar estímulos",
        "sustentar eficiência em tarefas repetitivas",
      ],
      tone: "rose",
    },
  ],
  readingSequence: [
    {
      step: "01",
      title: "Validade primeiro",
      description:
        "Confirme idade normativa, condições de aplicação, esforço, sono, audição, visão, idioma, medicações e intercorrências.",
    },
    {
      step: "02",
      title: "Leia o conjunto",
      description:
        "Observe QI Total, índices, intervalos de confiança e dispersão descrita pelo psicólogo; não reconstrua escores por conta própria.",
    },
    {
      step: "03",
      title: "Dê função às diferenças",
      description:
        "Traduza cada força ou vulnerabilidade em tarefas reais de casa, escola, consulta e autonomia.",
    },
    {
      step: "04",
      title: "Procure explicações rivais",
      description:
        "Compare linguagem, atenção, aprendizagem, motricidade, visão, sono, humor, epilepsia e história neurológica.",
    },
    {
      step: "05",
      title: "Integre múltiplas fontes",
      description:
        "Confronte entrevista, observação, escola, desempenho acadêmico, adaptação, exame neurológico e outros testes.",
    },
    {
      step: "06",
      title: "Decida o próximo passo",
      description:
        "Defina apoio funcional, investigação adicional ou seguimento longitudinal; o perfil sozinho não encerra a hipótese.",
    },
  ],
  diagnosticLenses: [
    {
      id: "tdah",
      title: "TDAH",
      pattern:
        "IMO e/ou IVP podem aparecer relativamente mais baixos, mas há ampla heterogeneidade individual.",
      interpretation:
        "O padrão pode sustentar uma hipótese de ineficiência atencional/executiva; não confirma TDAH nem separa seus subtipos.",
      mustCorrelate:
        "Sintomas antes dos 12 anos, prejuízo em mais de um contexto, escalas por múltiplos informantes, sono, ansiedade, linguagem e aprendizagem.",
      evidenceRefs: [2, 4, 5],
    },
    {
      id: "tea",
      title: "Transtorno do Espectro Autista",
      pattern:
        "Alguns grupos mostram raciocínio relativamente preservado e IVP mais baixo; o perfil é variável e não universal.",
      interpretation:
        "A discrepância pode explicar diferença entre resolver problemas e responder com rapidez, mas não mede reciprocidade social nem comportamento repetitivo.",
      mustCorrelate:
        "História do desenvolvimento, comunicação social, flexibilidade, sensorialidade, comportamento adaptativo e avaliação específica para TEA.",
      evidenceRefs: [3, 4],
    },
    {
      id: "transtorno-aprendizagem",
      title: "Transtorno específico da aprendizagem",
      pattern:
        "IMO/IVP podem contribuir para a carga escolar, porém nenhum desenho de índices define dislexia, discalculia ou transtorno da escrita.",
      interpretation:
        "O WISC-IV ajuda a formular mecanismos e apoios; o diagnóstico depende de desempenho acadêmico padronizado e história de ensino/intervenção.",
      mustCorrelate:
        "Leitura, escrita e matemática; linguagem; frequência escolar; qualidade do ensino; visão/audição; resposta a intervenção.",
      evidenceRefs: [5],
    },
    {
      id: "deficiencia-intelectual",
      title: "Deficiência intelectual",
      pattern:
        "Pode haver desempenho globalmente baixo, com ou sem dispersão entre índices.",
      interpretation:
        "Um QI baixo isolado não basta. A classificação clínica exige também limitações significativas do funcionamento adaptativo com início no desenvolvimento.",
      mustCorrelate:
        "Comunicação, autonomia, participação social, aprendizagem prática, história do desenvolvimento e validade da avaliação.",
      evidenceRefs: [1],
    },
    {
      id: "epilepsia",
      title: "Epilepsia",
      pattern:
        "IMO e IVP podem ser vulneráveis, sobretudo em amostras clínicas com maior carga de doença; o efeito não é específico.",
      interpretation:
        "Considere o perfil como linha de base funcional e possível marcador de mudança, não como localizador do foco epileptogênico.",
      mustCorrelate:
        "Idade de início, síndrome, controle de crises, sono, politerapia/carga medicamentosa, EEG, escola e evolução longitudinal.",
      evidenceRefs: [6],
    },
    {
      id: "lesao-neurologica",
      title: "Lesão neurológica adquirida",
      pattern:
        "Pode ocorrer queda difusa, frequentemente com maior impacto em eficiência e IVP após traumatismo cranioencefálico.",
      interpretation:
        "A comparação com funcionamento prévio e medidas seriadas é mais informativa do que procurar uma assinatura fixa em um único exame.",
      mustCorrelate:
        "Gravidade e topografia da lesão, tempo desde o evento, motricidade, visão, fadiga, memória, funções executivas e adaptação.",
      evidenceRefs: [7],
    },
    {
      id: "altas-habilidades",
      title: "Altas habilidades/superdotação",
      pattern:
        "Índices de raciocínio muito elevados podem coexistir com IMO/IVP menos destacados e com dificuldades reais.",
      interpretation:
        "A menor velocidade relativa não apaga potencial elevado, e a força cognitiva não exclui TDAH, TEA, ansiedade ou transtorno de aprendizagem.",
      mustCorrelate:
        "Produção criativa, aprendizagem, interesses, desempenho acadêmico, adaptação e investigação de dupla excepcionalidade.",
      evidenceRefs: [1, 4],
    },
  ],
  vignette: {
    title: "Caso fictício: quando raciocínio e eficiência se afastam",
    presentation:
      "Criança de 10 anos, com bom repertório verbal e resolução visual de problemas, mas lentidão para copiar, perda do fio em instruções longas e tarefas incompletas. O laudo descreve ICV e IOP como forças relativas e IMO/IVP como vulnerabilidades.",
    wrongShortcut:
      "Atalho inadequado: “esse desenho prova TDAH”. O mesmo arranjo pode surgir com privação de sono, ansiedade, dificuldade de linguagem, transtorno de aprendizagem, epilepsia, efeito medicamentoso, alteração visuomotora ou simplesmente variabilidade individual.",
    expertReading: [
      "A criança parece compreender melhor do que consegue demonstrar sob carga temporal e retenção simultânea.",
      "A discrepância gera uma hipótese funcional: reduzir carga de memória, fracionar instruções e rever exigências cronometradas pode melhorar a expressão do potencial.",
      "A hipótese diagnóstica só avança se história, sintomas e prejuízo multicontextual convergirem.",
    ],
    nextQuestions: [
      "A lentidão aparece também em tarefas sem escrita?",
      "O problema muda com sono, horário, ansiedade ou medicação?",
      "Há diferença entre desempenho oral, escrito e prático?",
      "Escola e família descrevem o mesmo padrão?",
    ],
  },
  qitGuide: {
    title: "QI Total: resumo útil, não sentença",
    coherent:
      "Quando os índices contam uma história relativamente coerente e a aplicação foi válida, o QI Total oferece uma síntese do funcionamento intelectual global naquele contexto.",
    heterogeneous:
      "Quando há dispersão importante, o QI Total pode esconder forças e vulnerabilidades. Priorize a narrativa do perfil, os intervalos e a função cotidiana descritos no laudo.",
    neverDo:
      "Não calcule o QI Total como média dos quatro índices, não invente compostos ausentes e não use um único número para fechar diagnóstico ou prognóstico.",
  },
  keyPoints: [
    "Índice descreve desempenho em uma família de tarefas; não é uma área cerebral isolada.",
    "Diferença entre índices gera hipótese, não diagnóstico.",
    "IMO e IVP são especialmente sensíveis a interferentes transdiagnósticos.",
    "Resultado baixo precisa ser decomposto em linguagem, atenção, visão, motricidade, sono, emoção e contexto.",
    "O valor clínico aumenta quando o perfil conversa com função adaptativa, escola e evolução longitudinal.",
    "A aplicação, correção e interpretação psicométrica formal permanecem sob responsabilidade do psicólogo habilitado.",
  ],
  references: wiscIvReferences,
  evidence: {
    literatureCutoff: "2026-10-28",
    consensus: {
      status: "blocked_usage_counter",
      note:
        "Consulta nova não executada: o estado local do Consensus informa contador mensal indisponível e bloqueia consumo até obter snapshot autoritativo. Foram usadas fontes primárias verificadas diretamente.",
    },
  },
  safety: {
    disclaimer:
      "Material educacional para raciocínio clínico. O perfil do WISC-IV não estabelece diagnóstico, etiologia, localização cerebral ou conduta isoladamente.",
    copyright:
      "Este capítulo não reproduz itens, estímulos, instruções de aplicação, chaves de correção, tabelas normativas ou pontos de corte do instrumento licenciado.",
    professionalBoundary:
      "Aplicação, correção e interpretação psicométrica formal devem ser realizadas por psicólogo habilitado, com manual, normas e versão adequados.",
  },
};

export const neuropedLibraryChapters: readonly LibraryChapter[] = [
  wiscIvChapter,
];

function utcDayNumber(date: Date): number {
  return Math.floor(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) /
      86_400_000,
  );
}

export function getDailyFeaturedChapter(
  date = new Date(),
): LibraryChapter {
  const dayKey = date.toISOString().slice(0, 10);
  const available = neuropedLibraryChapters.filter(
    (chapter) => chapter.publishedAt <= dayKey,
  );
  const pool = available.length > 0 ? available : neuropedLibraryChapters;
  return pool[utcDayNumber(date) % pool.length];
}

export function getLibraryChapter(slug: string): LibraryChapter | undefined {
  return neuropedLibraryChapters.find((chapter) => chapter.slug === slug);
}
