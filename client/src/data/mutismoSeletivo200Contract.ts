// Roteiro qualitativo NeuroPed para mutismo seletivo.
// 200 campos autorais derivados do PDF de 04/08/2026. Sem escore, corte ou classificação automática.

export type MutismoSeletivoModuleKey = "familia" | "escola" | "autopercepcao" | "anamnese" | "observacao" | "diferenciais" | "seguranca" | "sintese";
export type MutismoSeletivoInformant = "pais" | "professor" | "autoaplicavel" | "clinico" | "todos";
export type MutismoSeletivoAssessmentUse = "triagem" | "diagnostico" | "monitorizacao";

export interface MutismoSeletivoItemContract {
  id: string; module: MutismoSeletivoModuleKey; domain: string; title: string; prompt: string;
  ageMin: number; ageMax: number; informant: MutismoSeletivoInformant; scored: false; redFlag: boolean;
  contextTags: string[]; signalTags: string[];
}
export interface MutismoSeletivoModuleContract {
  key: MutismoSeletivoModuleKey; id: string; label: string; expectedItems: number; ageMin: number; ageMax: number;
  informants: Exclude<MutismoSeletivoInformant, "todos">[]; assessmentUse: MutismoSeletivoAssessmentUse;
  communication: "indiferente" | "nao_verbal_compativel"; literacy: "indiferente"; contextTags: string[];
  implementationStatus: "complete"; scored: false; redFlagsOutsideScore: boolean;
}

export const MUTISMO_SELETIVO_PROVENANCE = {
  slug: "mutismo-seletivo-200", title: "Mutismo seletivo — pré-consulta qualitativa NeuroPed", version: "1.0",
  generatedAt: "2026-08-04", sourcePdf: "2026-08-04 — Mutismo seletivo — NeuroPed.pdf", license: "autoral",
  validation: "Roteiro qualitativo; não é teste psicométrico e não possui validação formal",
  scoring: "Sem escore, ponto de corte, probabilidade diagnóstica ou classificação automática",
  redFlags: "Independentes e fora de qualquer escore", driveFileId: null as string | null,
  storageStatus: "blocked" as "confirmed" | "blocked",
  storageNote: "Upload bloqueado por BLOCKED_FILE_REFERENCE na primeira tentativa; segunda tentativa prevista após integração",
  sha256: "aea95638d3c1519449cce1559d6bb90b773cb38775af6a1bae610af357126e2c", bytes: 632257, pages: 200,
} as const;

export const mutismoSeletivoModules: MutismoSeletivoModuleContract[] = [
  { key: "familia", id: "mutismo-seletivo-familia-30", label: "Família e cuidadores", expectedItems: 30, ageMin: 24, ageMax: 215, informants: ["pais"], assessmentUse: "triagem", communication: "indiferente", literacy: "indiferente", contextTags: ["casa", "família", "rotina", "autonomia"], implementationStatus: "complete", scored: false, redFlagsOutsideScore: false },
  { key: "escola", id: "mutismo-seletivo-escola-30", label: "Escola e equipe pedagógica", expectedItems: 30, ageMin: 36, ageMax: 215, informants: ["professor"], assessmentUse: "triagem", communication: "indiferente", literacy: "indiferente", contextTags: ["escola", "sala de aula", "recreio", "avaliação"], implementationStatus: "complete", scored: false, redFlagsOutsideScore: false },
  { key: "autopercepcao", id: "mutismo-seletivo-autopercepcao-20", label: "Autopercepção apoiada", expectedItems: 20, ageMin: 96, ageMax: 215, informants: ["autoaplicavel"], assessmentUse: "triagem", communication: "nao_verbal_compativel", literacy: "indiferente", contextTags: ["criança", "adolescente", "preferências", "segurança"], implementationStatus: "complete", scored: false, redFlagsOutsideScore: false },
  { key: "anamnese", id: "mutismo-seletivo-anamnese-20", label: "Anamnese profissional", expectedItems: 20, ageMin: 24, ageMax: 215, informants: ["clinico"], assessmentUse: "diagnostico", communication: "indiferente", literacy: "indiferente", contextTags: ["pré-consulta", "história clínica", "documentos"], implementationStatus: "complete", scored: false, redFlagsOutsideScore: false },
  { key: "observacao", id: "mutismo-seletivo-observacao-20", label: "Observação e exame adaptado", expectedItems: 20, ageMin: 24, ageMax: 215, informants: ["clinico"], assessmentUse: "diagnostico", communication: "nao_verbal_compativel", literacy: "indiferente", contextTags: ["consulta", "observação", "exame"], implementationStatus: "complete", scored: false, redFlagsOutsideScore: false },
  { key: "diferenciais", id: "mutismo-seletivo-diferenciais-20", label: "Diferenciais e condições associadas", expectedItems: 20, ageMin: 24, ageMax: 215, informants: ["clinico"], assessmentUse: "diagnostico", communication: "indiferente", literacy: "indiferente", contextTags: ["diferenciais", "linguagem", "ansiedade", "neurodesenvolvimento"], implementationStatus: "complete", scored: false, redFlagsOutsideScore: false },
  { key: "seguranca", id: "mutismo-seletivo-seguranca-10", label: "Segurança e red flags", expectedItems: 10, ageMin: 24, ageMax: 215, informants: ["pais", "professor", "autoaplicavel", "clinico"], assessmentUse: "triagem", communication: "nao_verbal_compativel", literacy: "indiferente", contextTags: ["segurança", "urgência", "proteção"], implementationStatus: "complete", scored: false, redFlagsOutsideScore: true },
  { key: "sintese", id: "mutismo-seletivo-sintese-50", label: "Fundamentos, síntese e ferramentas", expectedItems: 50, ageMin: 24, ageMax: 215, informants: ["clinico"], assessmentUse: "monitorizacao", communication: "indiferente", literacy: "indiferente", contextTags: ["pré-consulta", "síntese", "plano", "devolutiva"], implementationStatus: "complete", scored: false, redFlagsOutsideScore: false },
];

type DomainBlueprint = { domain: string; count: number; topics: string[]; contexts: string[]; signals: string[] };
const BLUEPRINTS: Record<MutismoSeletivoModuleKey, DomainBlueprint[]> = {
  familia: [
    { domain: "Mapa da fala por contexto", count: 8, topics: ["fala espontânea em casa", "fala com familiares", "fala com visitas", "sussurro", "voz audível", "uso de gestos", "escrita ou mensagem", "variação por pessoa"], contexts: ["casa", "família"], signals: ["silêncio situacional", "fala", "sussurro"] },
    { domain: "Ansiedade e resposta corporal", count: 7, topics: ["congelamento", "evitação", "tensão facial", "choro", "dor abdominal", "urgência urinária", "recuperação após demanda"], contexts: ["casa", "transições"], signals: ["ansiedade", "congelamento", "sintomas somáticos"] },
    { domain: "Acomodação e apoio familiar", count: 8, topics: ["adulto fala pela criança", "pressão para responder", "tempo de espera", "escolhas fechadas", "reforço sem barganha", "exposição gradual", "rotina previsível", "comunicação alternativa"], contexts: ["família", "rotina"], signals: ["acomodação familiar", "pressão para falar", "exposição gradual"] },
    { domain: "Função e autonomia", count: 7, topics: ["pedir ajuda", "expressar dor", "ir ao banheiro", "fazer compras", "atender telefone", "participar de encontros", "impacto familiar"], contexts: ["casa", "comunidade"], signals: ["autonomia", "pedido de ajuda", "impacto funcional"] },
  ],
  escola: [
    { domain: "Participação acadêmica", count: 8, topics: ["responder à chamada", "leitura em voz alta", "apresentação", "avaliação oral", "perguntar dúvida", "trabalho em grupo", "educação física", "atividades extracurriculares"], contexts: ["escola", "sala de aula"], signals: ["participação", "avaliação oral", "silêncio situacional"] },
    { domain: "Comunicação funcional e segurança", count: 8, topics: ["pedir banheiro", "relatar dor", "informar bullying", "pedir ajuda", "responder em emergência", "usar cartão de comunicação", "usar dispositivo", "identificar adulto seguro"], contexts: ["escola", "segurança"], signals: ["pedido de ajuda", "bullying", "comunicação alternativa"] },
    { domain: "Contextos e parceiros", count: 7, topics: ["professor titular", "professor auxiliar", "colegas próximos", "grupo grande", "recreio", "transporte escolar", "ambiente virtual"], contexts: ["escola", "recreio"], signals: ["ansiedade social", "variação por pessoa", "fala"] },
    { domain: "Estratégias pedagógicas", count: 7, topics: ["tempo de resposta", "perguntas de escolha", "não expor publicamente", "resposta escrita", "gravação prévia", "hierarquia de fala", "monitorização conjunta"], contexts: ["escola", "plano individual"], signals: ["acomodação escolar", "exposição gradual", "participação"] },
  ],
  autopercepcao: [
    { domain: "Experiência interna", count: 6, topics: ["vontade de falar", "medo de errar", "sensação de travamento", "vergonha", "pensamentos antecipatórios", "alívio após situação"], contexts: ["criança", "adolescente"], signals: ["ansiedade", "congelamento", "vergonha"] },
    { domain: "Mapa pessoal de segurança", count: 5, topics: ["pessoas seguras", "lugares seguros", "formas preferidas de responder", "sinais para pedir pausa", "adulto de confiança"], contexts: ["segurança", "escola"], signals: ["preferências", "comunicação alternativa", "pedido de ajuda"] },
    { domain: "Metas e escolhas", count: 5, topics: ["meta pequena escolhida", "ritmo aceitável", "recompensa não coercitiva", "como celebrar avanço", "o que evitar"], contexts: ["tratamento", "escola"], signals: ["autonomia", "exposição gradual", "motivação"] },
    { domain: "Impacto funcional", count: 4, topics: ["amizades", "aprendizagem", "família", "atividades desejadas"], contexts: ["escola", "comunidade"], signals: ["impacto funcional", "isolamento", "participação"] },
  ],
  anamnese: [
    { domain: "Linha do tempo", count: 5, topics: ["idade de início", "contexto de início", "curso", "mudanças escolares", "períodos de melhora"], contexts: ["história clínica"], signals: ["início", "curso", "regressão"] },
    { domain: "Desenvolvimento e comunicação", count: 5, topics: ["marcos de linguagem", "inteligibilidade", "fluência", "audição", "multilinguismo"], contexts: ["desenvolvimento"], signals: ["linguagem", "fala", "audição"] },
    { domain: "Saúde e comorbidades", count: 5, topics: ["ansiedade", "TEA", "TDAH", "sono", "medicações e efeitos"], contexts: ["saúde"], signals: ["ansiedade", "TEA", "TDAH", "sono"] },
    { domain: "Documentos e intervenções", count: 5, topics: ["relatório escolar", "avaliação fonoaudiológica", "avaliação psicológica", "intervenções prévias", "resposta e adesão"], contexts: ["documentos", "tratamento"], signals: ["fonoaudiologia", "psicologia", "evolução"] },
  ],
  observacao: [
    { domain: "Acolhimento e regulação", count: 5, topics: ["entrada na consulta", "proximidade do cuidador", "contato visual", "brincar", "recuperação da ansiedade"], contexts: ["consulta"], signals: ["ansiedade", "regulação", "congelamento"] },
    { domain: "Canais comunicativos", count: 5, topics: ["gesto", "apontar", "escrita", "digitação", "vocalização ou sussurro"], contexts: ["consulta", "exame"], signals: ["comunicação", "gestos", "sussurro"] },
    { domain: "Modulação da demanda", count: 5, topics: ["pergunta aberta", "escolha binária", "comentário sem pergunta", "tempo de espera", "presença de parceiro seguro"], contexts: ["observação"], signals: ["pressão para falar", "tempo de resposta", "estímulo fading"] },
    { domain: "Exame adaptado", count: 5, topics: ["cooperação não verbal", "compreensão", "motricidade orofacial sem coerção", "sinais neurológicos", "limites e dados não observáveis"], contexts: ["exame"], signals: ["compreensão", "fala motora", "neurológico"] },
  ],
  diferenciais: [
    { domain: "Linguagem, fala e audição", count: 5, topics: ["transtorno de linguagem", "transtorno dos sons da fala", "apraxia de fala", "gagueira", "perda auditiva"], contexts: ["diferenciais"], signals: ["linguagem", "fala motora", "fluência", "audição"] },
    { domain: "Neurodesenvolvimento", count: 5, topics: ["TEA", "TDAH", "deficiência intelectual", "transtorno de aprendizagem", "comunicação social"], contexts: ["neurodesenvolvimento"], signals: ["TEA", "TDAH", "deficiência intelectual"] },
    { domain: "Ansiedade e trauma", count: 5, topics: ["ansiedade social", "ansiedade de separação", "pânico", "trauma", "depressão"], contexts: ["saúde mental"], signals: ["ansiedade social", "trauma", "depressão"] },
    { domain: "Condições raras ou adquiridas", count: 5, topics: ["catatonia", "psicose", "regressão neurológica", "efeito medicamentoso", "oposição sem ansiedade"], contexts: ["diferenciais", "urgência"], signals: ["catatonia", "psicose", "regressão", "medicação"] },
  ],
  seguranca: [
    { domain: "Red flags independentes", count: 10, topics: ["incapacidade de pedir ajuda em perigo", "incapacidade de comunicar dor intensa", "incapacidade de solicitar banheiro", "bullying ou abuso não comunicável", "recusa alimentar ou hídrica situacional", "desmaio ou sinais médicos agudos", "regressão abrupta da fala", "sinais neurológicos novos", "ideação suicida ou autoagressão", "suspeita de catatonia ou psicose"], contexts: ["segurança", "urgência"], signals: ["pedido de ajuda", "dor", "bullying", "regressão", "neurológico", "suicídio", "catatonia", "psicose"] },
  ],
  sintese: [
    { domain: "Fundamentos clínicos", count: 10, topics: ["padrão situacional", "fala preservada em contexto seguro", "duração e persistência", "prejuízo funcional", "exclusão por idioma", "ansiedade como mecanismo", "acomodação", "reforço negativo", "generalização", "prognóstico"], contexts: ["síntese"], signals: ["mutismo seletivo", "ansiedade", "impacto funcional"] },
    { domain: "Formulação a favor e contra", count: 10, topics: ["achados a favor", "achados contra", "dados ausentes", "contradições entre fontes", "hipóteses alternativas", "fatores predisponentes", "precipitantes", "perpetuadores", "protetores", "incerteza residual"], contexts: ["formulação"], signals: ["hipótese", "contradição", "incerteza"] },
    { domain: "Plano família e escola", count: 10, topics: ["psicoeducação", "reduzir pressão", "adulto seguro", "canais alternativos", "tempo de espera", "hierarquia de exposição", "estímulo fading", "reforço funcional", "adaptação de avaliação", "plano de emergência comunicativa"], contexts: ["família", "escola", "plano"], signals: ["exposição gradual", "estímulo fading", "comunicação alternativa"] },
    { domain: "Encaminhamentos e monitorização", count: 10, topics: ["psicologia", "fonoaudiologia", "escola", "audiologia", "psiquiatria quando indicada", "metas observáveis", "medidas por contexto", "revisão de efeitos adversos", "frequência de seguimento", "critérios de escalonamento"], contexts: ["tratamento", "monitorização"], signals: ["psicologia", "fonoaudiologia", "evolução"] },
    { domain: "Devolutiva e governança", count: 10, topics: ["explicação à família", "explicação à criança", "orientação à escola", "consentimento", "LGPD", "registro de fonte", "limitações", "revisão médica", "checklist de fechamento", "próximo passo"], contexts: ["devolutiva", "LGPD"], signals: ["consentimento", "privacidade", "revisão médica"] },
  ],
};

const MODULE_META = Object.fromEntries(mutismoSeletivoModules.map((module) => [module.key, module])) as Record<MutismoSeletivoModuleKey, MutismoSeletivoModuleContract>;
function slug(value: string): string { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }
function buildItems(moduleKey: MutismoSeletivoModuleKey): MutismoSeletivoItemContract[] {
  const module = MODULE_META[moduleKey]; let sequence = 0;
  return BLUEPRINTS[moduleKey].flatMap((blueprint) => Array.from({ length: blueprint.count }, (_, index) => {
    sequence += 1; const topic = blueprint.topics[index % blueprint.topics.length]; const redFlag = moduleKey === "seguranca";
    return {
      id: `mutismo-seletivo-${moduleKey}-${String(sequence).padStart(3, "0")}-${slug(topic)}`,
      module: moduleKey, domain: blueprint.domain, title: topic,
      prompt: `Registre qualitativamente ${topic}: presença ou ausência, exemplos concretos, fonte, data, contextos em que ocorre ou não ocorre, impacto funcional, achados a favor e contra, incertezas e próximo passo.`,
      ageMin: module.ageMin, ageMax: module.ageMax,
      informant: module.informants.length === 1 ? module.informants[0] : "todos",
      scored: false as const, redFlag, contextTags: [...module.contextTags, ...blueprint.contexts], signalTags: [...blueprint.signals, topic],
    };
  }));
}
export const mutismoSeletivoItems: MutismoSeletivoItemContract[] = ["familia", "escola", "autopercepcao", "anamnese", "observacao", "diferenciais", "seguranca", "sintese"].flatMap((key) => buildItems(key as MutismoSeletivoModuleKey));

export interface MutismoSeletivoFilterInput { ageMonths: number; informant?: Exclude<MutismoSeletivoInformant, "todos">; assessmentUse?: MutismoSeletivoAssessmentUse; isVerbal?: boolean; isLiterate?: boolean; signals?: string[]; contexts?: string[]; implementationStatus?: "complete"; }
function normalize(value: string): string { return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
export function filterMutismoSeletivoModules(input: MutismoSeletivoFilterInput): MutismoSeletivoModuleContract[] {
  const selectedSignals = (input.signals ?? []).map(normalize); const selectedContexts = (input.contexts ?? []).map(normalize);
  return mutismoSeletivoModules.filter((module) => {
    if (input.ageMonths < module.ageMin || input.ageMonths > module.ageMax) return false;
    if (input.informant && !module.informants.includes(input.informant)) return false;
    if (input.assessmentUse && module.assessmentUse !== input.assessmentUse) return false;
    if (input.implementationStatus && module.implementationStatus !== input.implementationStatus) return false;
    if (input.isVerbal === false && module.communication !== "indiferente" && module.communication !== "nao_verbal_compativel") return false;
    if (input.isLiterate === false && module.literacy !== "indiferente") return false;
    const items = mutismoSeletivoItems.filter((item) => item.module === module.key);
    const signals = items.flatMap((item) => item.signalTags).map(normalize);
    const contexts = [...module.contextTags, ...items.flatMap((item) => item.contextTags)].map(normalize);
    if (selectedSignals.length && !selectedSignals.some((term) => signals.some((tag) => tag.includes(term) || term.includes(tag)))) return false;
    if (selectedContexts.length && !selectedContexts.some((term) => contexts.some((tag) => tag.includes(term) || term.includes(tag)))) return false;
    return true;
  });
}
export const MUTISMO_SELETIVO_EXPECTED_TOTAL = 200 as const;
if (mutismoSeletivoItems.length !== MUTISMO_SELETIVO_EXPECTED_TOTAL) throw new Error(`[Mutismo seletivo 200] ${mutismoSeletivoItems.length}/200 campos`);
