/**
 * Biblioteca clínica NeuroPed — material educacional, sem dados de pacientes.
 * Publicação somente por revisão humana explícita em PR; a pauta diária não publica conteúdo.
 * Fontes são referências publicamente verificáveis, não representam pesquisa Consensus
 * executada em 28/10/2026 (cota mensal esgotada nessa data).
 */
export type ClinicalLibraryStatus = "revisao_medica" | "publicado";
export type WiscIndexKey = "ICV" | "IOP" | "IMO" | "IVP";

export interface ClinicalLibraryReference {
  id: string;
  title: string;
  year: number;
  url: string;
  note: string;
}
export interface WiscIndex {
  key: WiscIndexKey;
  name: string;
  subtitle: string;
  short: string;
  question: string;
  tests: string[];
  additional: string[];
  confounders: string[];
  functional: string;
  never: string;
  color: string;
}
export interface ClinicalLibraryChapter {
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  date: string;
  updated: string;
  status: ClinicalLibraryStatus;
  minutes: number;
  day?: number;
  /** Id estável da âncora `<article>` do capítulo; usado por cartão e link profundo. */
  anchor: string;
  review: string;
  sources: string[];
}
export const clinicalLibraryChapters: ClinicalLibraryChapter[] = [
  {
    slug: "ansiedade-separacao",
    anchor: "capitulo-ansiedade-separacao",
    day: 6,
    title: "Como reconhecer ansiedade de separação que ultrapassa o esperado?",
    subtitle: "Idade, prejuízo funcional, diferenciais e manejo graduado",
    category: "Saúde mental frequente",
    date: "2026-11-06",
    updated: "2026-11-06",
    status: "revisao_medica",
    minutes: 6,
    review: "Pesquisa Consensus em 06/11/2026; revisão médica pendente.",
    sources: ["giani-2021-separacao", "abidi-2026-recusa-escolar"],
  },
  {
    slug: "atraso-fala-avaliacao-global",
    anchor: "capitulo-atraso-fala-avaliacao-global",
    day: 5,
    title: "Quando o atraso de fala exige avaliação global?",
    subtitle: "Audição, compreensão, múltiplos domínios e decisão de investigação",
    category: "Desenvolvimento e triagem",
    date: "2026-11-03",
    updated: "2026-11-03",
    status: "revisao_medica",
    minutes: 6,
    review: "Rascunho educacional revisável. Revisão médica e aceite pendentes.",
    sources: ["uspstf-language-2024", "faruk-2020", "ms-caderneta-crianca"],
  },
  {
    slug: "alfabetizacao-dislexia",
    anchor: "capitulo-alfabetizacao-dislexia",
    day: 4,
    title: "Como diferenciar dificuldade de alfabetização de dislexia?",
    subtitle: "Oportunidade de ensino, decodificação, resposta à intervenção e decisão clínica",
    category: "Aprendizagem e escola",
    date: "2026-11-02",
    updated: "2026-11-02",
    status: "revisao_medica",
    minutes: 6,
    review: "Pesquisa Consensus Pro concluída em 02/11/2026; revisão médica e aceite pendentes.",
    sources: ["lei-14254", "hall-2022", "silva-2020", "barbosa-2015", "nrp-2000", "ida-structured", "icd11-6a03"],
  },
  {
    slug: "primeira-crise-afebril",
    anchor: "capitulo-primeira-crise-afebril",
    day: 3,
    title: "Primeira crise convulsiva afebril: qual a abordagem inicial?",
    subtitle: "Estabilização, red flags, EEG, imagem e risco de recorrência",
    category: "Epilepsia e eventos",
    date: "2026-11-01",
    updated: "2026-11-01",
    status: "revisao_medica",
    minutes: 6,
    review: "Pesquisa Consensus Pro concluída em 01/11/2026; revisão médica e aceite pendentes.",
    sources: ["ms-pcdt-epilepsia", "sbp-epilepsia", "nice-ng217", "rch-2025", "ilae-2014", "ilae-ifcn-2025", "wendt-2018", "jimenez-2021"],
  },
  {
    slug: "desatencao-imaturidade-etaria",
    anchor: "capitulo-desatencao-imaturidade",
    day: 2,
    title: "Como diferenciar desatenção de imaturidade etária?",
    subtitle: "Idade relativa, prejuízo em múltiplos contextos e decisão clínica",
    category: "TDAH",
    date: "2026-10-31",
    updated: "2026-10-31",
    status: "revisao_medica",
    minutes: 6,
    review: "Síntese provisória de fontes públicas. Consensus indisponível por cota; sem aceite médico.",
    sources: ["ms-pcdt-tdah", "aap-adhd-2019", "nice-ng87", "frisira-2025", "sayal-2018"],
  },
  {
    slug: "tea-timidez-primeira-infancia",
    anchor: "capitulo-tea-timidez",
    day: 1,
    title: "Como distinguir sinais de TEA de timidez na primeira infância?",
    subtitle: "Atenção compartilhada, reciprocidade, red flags e decisões de consultório",
    category: "TEA",
    date: "2026-10-29",
    updated: "2026-10-29",
    status: "revisao_medica",
    minutes: 6,
    review: "Síntese provisória baseada em fontes públicas; Consensus indisponível por cota. Sem aceite médico.",
    sources: ["ms-tea-aps", "ms-tea-2025", "aap-2020", "nice-cg128", "mchat-meta-2023", "cdc-18m", "mcglade-2023"],
  },
  {
    slug: "wisc-iv-interpretacao-neuropediatria",
    anchor: "capitulo-wisc",
    title: "Como interpretar o WISC-IV na neuropediatria",
    subtitle: "Os quatro índices, o QI Total e o raciocínio clínico por trás dos resultados",
    category: "Neuropsicologia",
    date: "2026-10-28",
    updated: "2026-10-28",
    status: "revisao_medica",
    minutes: 14,
    review: "Conteúdo bibliográfico para revisão e aceite clínico pelo médico responsável. Não equivale a laudo ou orientação individual.",
    sources: ["pearson-cpi", "adhd-2025", "autism-2026", "discrepancy", "learning", "satepsi", "aaidd"],
  },
];

export const wiscIndices: WiscIndex[] = [
  {
    key: "ICV", name: "Compreensão Verbal", subtitle: "Raciocínio com palavras",
    short: "O que a criança consegue explicar, relacionar e compreender verbalmente?",
    question: "Ela compreende conceitos e consegue organizar respostas verbais?",
    tests: ["Semelhanças", "Vocabulário", "Compreensão"],
    additional: ["Informação", "Raciocínio com Palavras"],
    confounders: ["Linguagem receptiva e expressiva", "Escolarização e oportunidades culturais", "Audição e bilinguismo"],
    functional: "Dificuldade na elaboração de conceitos e na resposta oral pode justificar investigação de linguagem, sem inferir inteligência global baixa.",
    never: "ICV reduzido não é, isoladamente, transtorno de linguagem ou deficiência intelectual.",
    color: "sky",
  },
  {
    key: "IOP", name: "Organização Perceptual", subtitle: "Raciocínio com estímulos visuais",
    short: "Como a criança percebe relações e resolve problemas não verbais?",
    question: "Ela identifica padrões, organiza elementos e resolve problemas visuais?",
    tests: ["Cubos", "Conceitos Figurativos", "Raciocínio Matricial"],
    additional: ["Completar Figuras"],
    confounders: ["Visão e integração visuoespacial", "Coordenação visuomotora", "Compreensão das instruções"],
    functional: "Ajuda a reconhecer forças de raciocínio com estímulos visuais, considerando as exigências motoras e de compreensão de cada tarefa.",
    never: "IOP é sensível a fatores visuais e motores; não é uma medida de inteligência totalmente livre de linguagem.",
    color: "teal",
  },
  {
    key: "IMO", name: "Memória Operacional", subtitle: "Manter e manipular informação",
    short: "A criança consegue reter dados brevemente enquanto pensa com eles?",
    question: "Consegue acompanhar instruções em etapas ou fazer operações mentalmente?",
    tests: ["Dígitos", "Sequência de Números e Letras"],
    additional: ["Aritmética"],
    confounders: ["Atenção durante a aplicação", "Compreensão auditivo-verbal", "Fadiga, ansiedade e sono"],
    functional: "Pode ajudar a explicar dificuldade com instruções extensas, cálculo mental ou manipulação verbal de informações, sem medir todas as funções executivas.",
    never: "IMO baixo não é teste confirmatório de TDAH; IMO normal não exclui TDAH.",
    color: "amber",
  },
  {
    key: "IVP", name: "Velocidade de Processamento", subtitle: "Rapidez e precisão sob tempo",
    short: "Com que eficiência a criança executa tarefas visuais simples cronometradas?",
    question: "Ela encontra símbolos e responde com precisão dentro do tempo?",
    tests: ["Código", "Procurar Símbolos"],
    additional: ["Cancelamento"],
    confounders: ["Motricidade fina e grafomotricidade", "Varredura visual", "Atenção, ansiedade e pressão de tempo"],
    functional: "Lentidão nessas tarefas pode ser compatível com menor produtividade de cópia e atividades sob tempo; é necessário verificar o funcionamento escolar.",
    never: "IVP baixo não mede diretamente a velocidade global do cérebro e não define TEA ou TDAH.",
    color: "rose",
  },
];

export const clinicalConditions = [
  {
    name: "TDAH", evidence: "Associação em grupos", impact: "IMO e/ou IVP podem ser relativamente menores.",
    investigate: "Sintomas persistentes, início, prejuízo em mais de um ambiente, sono, ansiedade e aprendizagem.",
    caveat: "Não existe ponto de corte dos índices que confirme ou exclua TDAH.", sources: ["adhd-2025"],
  },
  {
    name: "TEA", evidence: "Heterogeneidade importante", impact: "IVP frequentemente inferior ao raciocínio em médias de grupos; IMO também pode ser menor.",
    investigate: "Comunicação social, padrões restritos/repetitivos, desenvolvimento e comportamento adaptativo.",
    caveat: "Não existe assinatura individual do WISC-IV para TEA; estudos incluem versões distintas.", sources: ["autism-2026"],
  },
  {
    name: "Transtornos da aprendizagem", evidence: "Perfil não específico", impact: "IMO e IVP podem contribuir para dificuldades, mas não identificam domínio acadêmico isoladamente.",
    investigate: "Leitura, escrita, ortografia e matemática por avaliação específica, considerando ensino oferecido.",
    caveat: "QI na média não exclui dislexia ou discalculia.", sources: ["learning"],
  },
  {
    name: "Transtorno do desenvolvimento da linguagem", evidence: "Influência do construto", impact: "ICV e tarefas auditivo-verbais podem ser penalizados por dificuldades linguísticas.",
    investigate: "Linguagem receptiva/expressiva, audição, desenvolvimento comunicativo e avaliação fonoaudiológica.",
    caveat: "Não interpretar diferença ICV–IOP como diagnóstico automático.", sources: [],
  },
  {
    name: "Deficiência intelectual", evidence: "Critérios multidimensionais", impact: "Resultados intelectuais significativamente baixos podem apoiar a investigação.",
    investigate: "Funcionamento adaptativo conceitual, social e prático, com início no desenvolvimento.",
    caveat: "QIT isolado não estabelece diagnóstico nem gravidade.", sources: ["aaidd"],
  },
  {
    name: "Altas habilidades", evidence: "Perfil pode ser irregular", impact: "Forças expressivas em raciocínio podem coexistir com eficiência inferior.",
    investigate: "História de habilidades específicas, desempenho, produções, interesses e contexto escolar.",
    caveat: "O IAG não é o 'QI verdadeiro' e não deve ser substituto automático do QIT.", sources: ["pearson-cpi"],
  },
] as const;

export const wiscFictionalCases = [
  {
    label: "Caso A", title: "Raciocina bem, mas é muito lento",
    scores: { ICV: 118, IOP: 116, IMO: 87, IVP: 80 },
    observation: "Relato fictício: ótimo raciocínio oral e visual; demanda muito tempo para copiar e concluir tarefas.",
    interpret: "Há contraste entre raciocínio e eficiência de execução. Conferir intervalos de confiança, valor crítico, taxa de base e validade dos subtestes antes de atribuir significado.",
    next: "Investigar escrita, coordenação fina, visão, contexto escolar, atenção e ansiedade. Não fechar TDAH pelo gráfico.",
  },
  {
    label: "Caso B", title: "Dificuldade verbal com raciocínio visual preservado",
    scores: { ICV: 78, IOP: 107, IMO: 85, IVP: 101 },
    observation: "Relato fictício: dificuldade para compreender explicações longas, mas resolve problemas visuais.",
    interpret: "O contraste sugere explorar demandas linguísticas, repertório cultural e a consistência dos resultados.",
    next: "Investigar audição, linguagem, aprendizagem e condições de aplicação, sem concluir TEA ou deficiência intelectual.",
  },
  {
    label: "Caso C", title: "QI global baixo e dificuldades cotidianas",
    scores: { ICV: 70, IOP: 73, IMO: 72, IVP: 74 },
    observation: "Relato fictício: dificuldades acadêmicas e necessidade de apoio nas atividades cotidianas.",
    interpret: "Desempenho global reduzido requer análise de precisão, desenvolvimento e oportunidades educacionais.",
    next: "Avaliar funcionamento adaptativo e história do desenvolvimento; não diagnosticar deficiência intelectual somente pelos escores.",
  },
] as const;

export const wiscCheckpoints = [
  "Idade, versão brasileira e condições de aplicação estão documentadas?",
  "QIT e os quatro índices foram apresentados com intervalos de confiança?",
  "As diferenças foram avaliadas quanto a valor crítico e frequência normativa?",
  "Foram considerados variáveis de linguagem, visão, motricidade, sono e ansiedade?",
  "A interpretação diferencia fraqueza relativa e fraqueza normativa?",
  "O perfil foi correlacionado com funcionamento em casa, escola e exame clínico?",
  "O relatório evitou transformar índices em rótulos diagnósticos?",
  "As recomendações funcionais foram individualizadas e justificadas?",
] as const;

export const wiscReferences: ClinicalLibraryReference[] = [
  { id: "pearson-cpi", title: "Weiss & Gabel. Using the Cognitive Proficiency Index in Psychoeducational Assessment — WISC-IV Technical Report #6", year: 2008, url: "https://www.pearsonassessments.com/content/dam/school/global/clinical/us/assets/wisc-iv/wisc-iv-technical-report-6.pdf", note: "Fonte técnica do IPC e sua finalidade. Tabelas de conversão dependem da adaptação utilizada." },
  { id: "adhd-2025", title: "Rosales-Gómez et al. Cognitive Profiling of Children and Adolescents with ADHD Using the WISC-IV", year: 2025, url: "https://doi.org/10.3390/bs15091279", note: "Estudo observacional com 719 participantes; diferenças médias não são ferramenta diagnóstica individual." },
  { id: "autism-2026", title: "Cognitive Profile of Autism and Intellectual Disorder in Wechsler’s Scales: Meta-Analysis", year: 2026, url: "https://pubmed.ncbi.nlm.nih.gov/41590022/", note: "31 estudos com múltiplas versões de Wechsler; elevada heterogeneidade e extrapolação limitada ao WISC-IV." },
  { id: "discrepancy", title: "Glass et al. Discrepancy Score Reliabilities in the WISC-IV Standardization Sample", year: 2009, url: "https://doi.org/10.1177/0734282908325158", note: "Discrepâncias exigem cautela psicométrica, além de significância estatística." },
  { id: "learning", title: "Toffalini, Giofrè & Cornoldi. Strengths and Weaknesses in the Intellectual Profile of Different Subtypes of Specific Learning Disorder", year: 2017, url: "https://doi.org/10.1177/2167702616672038", note: "Perfis em dificuldades de aprendizagem: sobreposições e heterogeneidade clínica." },
  { id: "satepsi", title: "Conselho Federal de Psicologia — SATEPSI e Resolução CFP 31/2022", year: 2022, url: "https://satepsi.cfp.org.br/", note: "Consultar situação atual de instrumentos, adequação normativa e competências profissionais." },
  { id: "aaidd", title: "AAIDD — Definition of Intellectual Disability", year: 2026, url: "https://aaidd.org/intellectual-disability/definition", note: "Deficiência intelectual requer avaliação do funcionamento intelectual e adaptativo." },
];

export const nextClinicalTopics = [
  "Quando a criança que não fala precisa de avaliação auditiva urgente?",
  "Como avaliar insônia comportamental no pré-escolar?",
];

/** Trilha 365: somente capítulos numerados pelo índice canônico, em ordem crescente de Dia. */
export const clinicalLibraryTrail: ClinicalLibraryChapter[] = clinicalLibraryChapters
  .filter((chapter) => typeof chapter.day === "number")
  .sort((a, b) => (a.day ?? 0) - (b.day ?? 0));

/** Estudos anteriores à Trilha 365 (sem Dia canônico); não contam como Dia do índice. */
export const clinicalLibraryEarlierStudies: ClinicalLibraryChapter[] = clinicalLibraryChapters
  .filter((chapter) => typeof chapter.day !== "number");

/** Converte o `?capitulo=` do link profundo na âncora estável; slug desconhecido não navega. */
export function clinicalLibraryAnchorForSlug(slug: string | null | undefined): string | null {
  if (!slug) return null;
  return clinicalLibraryChapters.find((chapter) => chapter.slug === slug)?.anchor ?? null;
}

/**
 * Rótulo exibido para o estado clínico. `publicado` só existe após aceite médico
 * explícito registrado em PR; integração técnica ou deploy não mudam este estado.
 */
export const clinicalLibraryStatusLabel: Record<ClinicalLibraryStatus, string> = {
  revisao_medica: "Revisão médica pendente",
  publicado: "Aceite médico registrado",
};
