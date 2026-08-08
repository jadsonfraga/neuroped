import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT_DIR = path.join(ROOT, "client/src/data/daily-authorial");

type Risk = "baixo" | "moderado" | "alto";
type Respondent =
  | "pais_cuidadores"
  | "professor"
  | "clinico"
  | "crianca_adolescente"
  | "multiplo";
type Context = "casa" | "escola" | "clinica" | "multicontexto";
type AssessmentUse =
  | "triagem_estruturada"
  | "monitoramento"
  | "registro_clinico"
  | "observacao_clinica";

type FallbackTopic = {
  id: string;
  code: string;
  title: string;
  category: string;
  subcategory: string;
  ageMinMonths: number;
  ageMaxMonths: number;
  respondent: Respondent;
  contexts: Context[];
  assessmentUse: AssessmentUse;
  riskClass: Risk;
  focus: string;
};

const TOPICS: FallbackTopic[] = [
  {
    id: "contingencia_familia_continuidade",
    code: "FAM",
    title: "Continuidade do cuidado e rotina familiar",
    category: "Família e cuidado",
    subcategory: "Monitoramento funcional",
    ageMinMonths: 0,
    ageMaxMonths: 215,
    respondent: "pais_cuidadores",
    contexts: ["casa", "multicontexto"],
    assessmentUse: "monitoramento",
    riskClass: "moderado",
    focus: "barreiras, previsibilidade, participação e necessidades de apoio",
  },
  {
    id: "contingencia_comunicacao_participacao",
    code: "COM",
    title: "Comunicação funcional e participação social",
    category: "Neurodesenvolvimento",
    subcategory: "Comunicação e interação",
    ageMinMonths: 12,
    ageMaxMonths: 215,
    respondent: "multiplo",
    contexts: ["casa", "escola", "clinica", "multicontexto"],
    assessmentUse: "observacao_clinica",
    riskClass: "baixo",
    focus: "iniciativa, resposta, compreensão, reparo comunicativo e participação",
  },
  {
    id: "contingencia_funcoes_executivas",
    code: "FEX",
    title: "Organização executiva em tarefas cotidianas",
    category: "Funções executivas",
    subcategory: "Organização e autorregulação",
    ageMinMonths: 48,
    ageMaxMonths: 251,
    respondent: "multiplo",
    contexts: ["casa", "escola", "multicontexto"],
    assessmentUse: "monitoramento",
    riskClass: "baixo",
    focus: "iniciação, manutenção, conclusão, tempo e necessidade de ajuda",
  },
  {
    id: "contingencia_emocional_seguranca",
    code: "EMO",
    title: "Mudanças emocionais, funcionamento e segurança",
    category: "Saúde mental infantil",
    subcategory: "Monitoramento emocional",
    ageMinMonths: 48,
    ageMaxMonths: 251,
    respondent: "multiplo",
    contexts: ["casa", "escola", "clinica", "multicontexto"],
    assessmentUse: "triagem_estruturada",
    riskClass: "alto",
    focus: "mudança basal, sofrimento, evitação, recuperação e proteção",
  },
  {
    id: "contingencia_desregulacao_seguranca",
    code: "REG",
    title: "Desregulação comportamental e necessidades de segurança",
    category: "Comportamento",
    subcategory: "Regulação e segurança",
    ageMinMonths: 24,
    ageMaxMonths: 251,
    respondent: "multiplo",
    contexts: ["casa", "escola", "clinica", "multicontexto"],
    assessmentUse: "registro_clinico",
    riskClass: "alto",
    focus: "antecedentes, intensidade, duração, impacto, recuperação e proteção",
  },
  {
    id: "contingencia_aprendizagem_funcional",
    code: "APR",
    title: "Desempenho funcional e participação escolar",
    category: "Aprendizagem e linguagem",
    subcategory: "Funcionamento escolar",
    ageMinMonths: 60,
    ageMaxMonths: 215,
    respondent: "multiplo",
    contexts: ["escola", "clinica", "multicontexto"],
    assessmentUse: "triagem_estruturada",
    riskClass: "baixo",
    focus: "acesso à tarefa, esforço, autonomia, compreensão e adaptações úteis",
  },
  {
    id: "contingencia_neurologia_seguranca",
    code: "NEU",
    title: "Eventos neurológicos e sinais de alerta",
    category: "Neurologia infantil",
    subcategory: "Registro e segurança",
    ageMinMonths: 0,
    ageMaxMonths: 251,
    respondent: "multiplo",
    contexts: ["casa", "escola", "clinica", "multicontexto"],
    assessmentUse: "registro_clinico",
    riskClass: "alto",
    focus: "início, duração, responsividade, recuperação, mudança de padrão e segurança",
  },
];

const dateNow = () =>
  process.env.NEUROPED_GENERATION_DATE ||
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Recife",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

const weekday = (date: string) => new Date(`${date}T12:00:00Z`).getUTCDay();

async function catalog(): Promise<any[]> {
  await mkdir(OUTPUT_DIR, { recursive: true });
  const files = (await readdir(OUTPUT_DIR)).filter((file) => file.endsWith(".json"));
  return Promise.all(
    files.map(async (file) =>
      JSON.parse(await readFile(path.join(OUTPUT_DIR, file), "utf8")),
    ),
  );
}

function buildItems(topic: FallbackTopic) {
  const target = topic.title.toLowerCase();
  return [
    {
      id: "CT01",
      domainId: "padrao",
      text: `As manifestações relacionadas a ${target} foram observadas em mais de uma ocasião no período de referência.`,
      responseMode: "frequencia_0_3",
      redFlag: false,
      clinicalNote: "Registrar exemplos concretos, datas e frequência aproximada.",
    },
    {
      id: "CT02",
      domainId: "padrao",
      text: "Houve mudança perceptível em relação ao funcionamento habitual da criança ou do adolescente.",
      responseMode: "frequencia_0_3",
      redFlag: false,
      clinicalNote: "Descrever o funcionamento anterior e o momento aproximado da mudança.",
    },
    {
      id: "CT03",
      domainId: "padrao",
      text: "O padrão observado mantém características semelhantes entre diferentes ocorrências.",
      responseMode: "frequencia_0_3",
      redFlag: false,
      clinicalNote: "Separar padrões distintos em registros diferentes.",
    },
    {
      id: "CT04",
      domainId: "contexto",
      text: "É possível identificar o que aconteceu imediatamente antes do comportamento, sintoma ou dificuldade observada.",
      responseMode: "frequencia_0_3",
      redFlag: false,
      clinicalNote: "Registrar antecedentes sem presumir causalidade.",
    },
    {
      id: "CT05",
      domainId: "contexto",
      text: "A manifestação ocorre em mais de um ambiente, atividade ou relação interpessoal relevante.",
      responseMode: "frequencia_0_3",
      redFlag: false,
      clinicalNote: "Comparar casa, escola, clínica e situações comunitárias quando disponíveis.",
    },
    {
      id: "CT06",
      domainId: "contexto",
      text: "Sono, dor, fome, transições, exigências, ruído ou outros fatores ambientais parecem modificar o padrão observado.",
      responseMode: "frequencia_0_3",
      redFlag: false,
      clinicalNote: "Distinguir associação temporal de explicação definitiva.",
    },
    {
      id: "CT07",
      domainId: "impacto",
      text: "O padrão interfere na participação em atividades esperadas para a idade e para o contexto.",
      responseMode: "frequencia_0_3",
      redFlag: false,
      clinicalNote: "Descrever qual atividade foi limitada e em que grau.",
    },
    {
      id: "CT08",
      domainId: "impacto",
      text: "A criança ou o adolescente passou a necessitar de ajuda maior do que a habitual para iniciar, manter ou concluir atividades.",
      responseMode: "frequencia_0_3",
      redFlag: false,
      clinicalNote: "Registrar tipo e intensidade do apoio necessário.",
    },
    {
      id: "CT09",
      domainId: "impacto",
      text: "Há evitação, afastamento, perda de oportunidades ou interrupção de atividades por causa do padrão observado.",
      responseMode: "frequencia_0_3",
      redFlag: false,
      clinicalNote: "Considerar participação social, escolar, familiar e autocuidado.",
    },
    {
      id: "CT10",
      domainId: "estrategias",
      text: "Estratégias de antecipação, comunicação, pausa, organização do ambiente ou apoio visual reduzem a dificuldade observada.",
      responseMode: "frequencia_0_3",
      redFlag: false,
      clinicalNote: "Anotar exatamente o que foi feito e qual resposta ocorreu.",
    },
    {
      id: "CT11",
      domainId: "estrategias",
      text: "O retorno ao funcionamento habitual ocorre em intervalo relativamente previsível.",
      responseMode: "frequencia_0_3",
      redFlag: false,
      clinicalNote: "Cronometrar quando possível e registrar o estado após a ocorrência.",
    },
    {
      id: "CT12",
      domainId: "estrategias",
      text: "Existem diferenças consistentes entre estratégias que ajudam e estratégias que intensificam a dificuldade.",
      responseMode: "frequencia_0_3",
      redFlag: false,
      clinicalNote: "Usar descrição funcional, sem atribuir intenção moral.",
    },
    {
      id: "CT13",
      domainId: "seguranca",
      text: "Há risco imediato de lesão, fuga, perda de consciência, dificuldade respiratória ou incapacidade de manter a segurança.",
      responseMode: "presente_ausente",
      redFlag: true,
      clinicalNote: "Sinal crítico independente de qualquer perfil ou soma.",
    },
    {
      id: "CT14",
      domainId: "seguranca",
      text: "O padrão é novo, surgiu de forma abrupta ou mudou de maneira importante em relação às ocorrências anteriores.",
      responseMode: "presente_ausente",
      redFlag: true,
      clinicalNote: "Registrar data, circunstâncias e natureza da mudança.",
    },
    {
      id: "CT15",
      domainId: "seguranca",
      text: "Após a ocorrência, não há retorno ao estado de responsividade ou funcionamento habitual.",
      responseMode: "presente_ausente",
      redFlag: true,
      clinicalNote: "Situação que pode exigir avaliação urgente conforme o estado clínico.",
    },
  ];
}

async function main() {
  const date = dateNow();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("Data deve usar AAAA-MM-DD.");
  }

  const records = await catalog();
  if (records.some((record) => record.generatedOn === date)) {
    console.log(`Já existe inventário para ${date}; contingência não necessária.`);
    return;
  }

  const topic = TOPICS[weekday(date)];
  const serial = String(records.length + 1).padStart(3, "0");
  const items = buildItems(topic);
  const record = {
    schemaVersion: "1.0.0",
    id: `NEUROPED-DIARIO-${date.replaceAll("-", "")}-${serial}`,
    slug: `contingencia-${topic.code.toLowerCase()}-${date}`,
    version: "1.0.0",
    generatedOn: date,
    generatedAt: new Date().toISOString(),
    author: "NeuroPed SDG — Dr. Jadson Fraga",
    sourceType: "autoral_diario",
    validationStatus: "nao_validado_psicometricamente",
    status: "rascunho_revisao",
    title: `Registro Autoral de Contingência — ${topic.title}`,
    shortTitle: `RAC-${topic.code}-NeuroPed`,
    topicId: topic.id,
    topic: topic.title,
    category: topic.category,
    subcategory: topic.subcategory,
    rationale:
      "A continuidade documental reduz lacunas no acompanhamento longitudinal quando o gerador principal está temporariamente indisponível. Este registro conservador organiza observações sem produzir classificação diagnóstica.",
    purpose: `Registrar de forma estruturada ${topic.focus}, preservando a continuidade do catálogo diário até que o conteúdo possa ser revisto ou promovido pelo fluxo clínico habitual.`,
    ageMinMonths: topic.ageMinMonths,
    ageMaxMonths: topic.ageMaxMonths,
    respondent: topic.respondent,
    contexts: topic.contexts,
    assessmentUse: topic.assessmentUse,
    riskClass: topic.riskClass,
    timeframe:
      "Considerar os últimos sete dias e registrar separadamente ocorrências com características diferentes.",
    durationMinutes: 10,
    instructions:
      "Responder apenas com base no que foi diretamente observado ou relatado por fonte identificada. Usar exemplos concretos, registrar o contexto e marcar desconhecido quando não houver informação suficiente. Este registro não substitui avaliação clínica.",
    responseOptions: [
      { code: "N", label: "Não observado", value: 0 },
      { code: "O", label: "Ocasional", value: 1 },
      { code: "F", label: "Frequente", value: 2 },
      { code: "I", label: "Intenso ou com grande impacto", value: 3 },
      { code: "D", label: "Desconhecido", value: null },
    ],
    domains: [
      {
        id: "padrao",
        label: "Padrão e mudança basal",
        description: "Frequência, repetição e mudança em relação ao funcionamento habitual.",
      },
      {
        id: "contexto",
        label: "Contexto e antecedentes",
        description: "Situações associadas, ambientes e fatores que modificam a ocorrência.",
      },
      {
        id: "impacto",
        label: "Impacto funcional",
        description: "Participação, autonomia e necessidade de apoio.",
      },
      {
        id: "estrategias",
        label: "Estratégias e recuperação",
        description: "Respostas de apoio, retorno ao basal e fatores que ajudam ou agravam.",
      },
      {
        id: "seguranca",
        label: "Segurança",
        description: "Sinais críticos analisados separadamente de qualquer perfil qualitativo.",
      },
    ],
    items,
    scoring: {
      mode: "perfil_qualitativo_sem_total",
      totalScoreEnabled: false,
      instructions:
        "Não somar os itens. Organizar as respostas por domínio, descrever exemplos e comparar a evolução ao longo do tempo.",
      domainInterpretation:
        "A interpretação depende da idade, do desenvolvimento, do contexto, da mudança em relação ao basal e da convergência entre diferentes informantes.",
      redFlagRule:
        "Qualquer red flag exige análise independente e pode demandar ação imediata, mesmo quando os demais itens forem pouco frequentes.",
    },
    redFlags: [
      {
        itemId: "CT13",
        action:
          "Interromper a exposição ao risco e garantir segurança. Acionar o SAMU 192 diante de dificuldade respiratória, perda prolongada de responsividade, trauma importante ou ameaça imediata à vida.",
      },
      {
        itemId: "CT14",
        action:
          "Mudança abrupta, primeira ocorrência relevante ou agravamento importante exige avaliação clínica oportuna; buscar urgência quando houver instabilidade ou risco atual.",
      },
      {
        itemId: "CT15",
        action:
          "Ausência de recuperação do estado habitual exige avaliação urgente conforme responsividade, respiração, trauma e condição clínica geral.",
      },
    ],
    differentialConsiderations: [
      "Variações do desenvolvimento e do funcionamento basal.",
      "Fatores ambientais, comunicativos, sensoriais, familiares ou escolares.",
      "Sono insuficiente, dor, doença intercorrente ou outras condições clínicas.",
      "Diferenças entre observadores, contextos e oportunidades de participação.",
    ],
    clinicalIntegration: [
      "Comparar família, escola, profissionais e autorrelato quando apropriado para a idade.",
      "Relacionar os achados à anamnese, ao exame clínico e ao funcionamento adaptativo.",
      "Rever registros longitudinais e exemplos concretos antes de qualquer conclusão.",
      "Substituir ou complementar o registro de contingência após revisão clínica do instrumento principal.",
    ],
    limitations: [
      "Registro autoral de contingência sem validação psicométrica ou normas populacionais.",
      "Estrutura deliberadamente ampla, com menor especificidade temática que o gerador principal.",
      "Relatos retrospectivos podem omitir contexto, duração e mudança basal.",
      "Nenhum item isolado confirma ou exclui condição clínica.",
    ],
    safetyNote:
      "Este registro não substitui avaliação clínica, atendimento de urgência ou plano individual de segurança. Diante de risco atual, priorizar proteção e assistência apropriada.",
    tags: [
      "contingência",
      "continuidade diária",
      "monitoramento funcional",
      "segurança",
      topic.category.toLowerCase(),
    ],
    duplicateCooldownDays: 30,
    contingency: true,
    needsUpgrade: true,
    generation: {
      model: "fallback-deterministic-v1",
      reasoningMode: "pro",
      reasoningEffort: "high",
      pipelineVersion: "1.1.0-contingency",
    },
  };

  const filename = `${date}-contingencia-${topic.code.toLowerCase()}.json`;
  await writeFile(
    path.join(OUTPUT_DIR, filename),
    `${JSON.stringify(record, null, 2)}\n`,
    "utf8",
  );
  console.log(`Inventário de contingência criado: ${filename}`);
}

await main();
