/**
 * Revisão de documentação neuropediátrica antes da emissão.
 * NÃO emite laudo e NÃO valida diagnóstico. Inventário manual com fontes de evidência.
 * Nenhum item do jogo, pontuação ou exame médico é marcado automaticamente.
 */
export const READINESS_VERSION = "2026-10-20.1";
export type ConsultationFocus = "neurodesenvolvimento" | "tea" | "tdah" | "linguagem" | "epilepsia" | "motor" | "aprendizagem" | "psiquiatria";
export const FOCUS_LABELS: Record<ConsultationFocus,string> = {
  neurodesenvolvimento: "Neurodesenvolvimento global",
  tea: "Investigação de TEA", tdah: "Investigação de TDAH",
  linguagem: "Linguagem / comunicação", epilepsia: "Epilepsia / eventos paroxísticos",
  motor: "Alteração motora", aprendizagem: "Aprendizagem",
  psiquiatria: "Saúde mental / comportamento",
};
export type EvidenceStatus = "documentado" | "pendente" | "inaplicavel" | "limitado";
export type EvidenceSource = "familia" | "escola" | "terapeuta" | "exame" | "documento" | "clinico";
export const EVIDENCE_SOURCE: Record<EvidenceSource,string> = {
  familia:"Relato familiar",escola:"Escola",terapeuta:"Equipe terapêutica",
  exame:"Exame presencial",documento:"Documento/exame complementar",clinico:"Entrevista e síntese médicas",
};
export const EVIDENCE_STATUS: Record<EvidenceStatus,string> = {
  documentado:"Documentado com fonte",
  pendente:"Ainda não documentado",
  inaplicavel:"Não pertinente, com justificativa",
  limitado:"Avaliação limitada, com motivo",
};
export type Requirement = {
  id: string;
  title: string;
  question: string;
  min: number;
  max: number;
  focus?: ConsultationFocus;
  clinicianOnly?: boolean;
  sourceHint: string;
  ageHint?: string;
};
export interface EvidenceEntry { status: EvidenceStatus; source?: EvidenceSource; note: string }
export type EvidenceMap = Record<string,EvidenceEntry>;
export interface ReadinessReview {
  completed: number;
  total: number;
  pending: string[];
  limited: string[];
  justified: string[];
  /** Descritivo. Nunca equivale a autorização de emissão. */
  summary: string;
}

export const REQUIREMENTS: readonly Requirement[] = [
  {id:"identity",title:"Identificação e idade verificadas no prontuário protegido",question:"Confirmar identidade, idade/data e responsável sem copiar identificadores para o jogo.",min:2,max:17,sourceHint:"Registro clínico; confirmação por profissional."},
  {id:"complaint",title:"Queixa principal, duração, prejuízo e objetivo do laudo",question:"Queixa em termos funcionais; início, trajetória, repercussões, motivo e destinatário do documento.",min:2,max:17,sourceHint:"Família e entrevista."},
  {id:"timeline",title:"História e evolução temporal",question:"Cronologia, início, curso, agravantes, flutuação, perdas de habilidades e intervenções prévias.",min:2,max:17,sourceHint:"Família; outros registros conforme disponíveis."},
  {id:"development",title:"Neurodesenvolvimento e autonomia",question:"Gestação/parto, marcos motores, linguagem, socialização, adaptação e autonomia pertinentes à idade; dados não obtidos ficam explicitados.",min:2,max:17,sourceHint:"História familiar e registros.",ageHint:"Aos 2–5 anos detalhar atenção conjunta, jogo simbólico, linguagem e motricidade; a partir de 6 anos integrar percurso escolar e autonomia."},
  {id:"history",title:"Antecedentes clínicos, familiares e medicamentos",question:"Condições prévias, epilepsia, doenças, exames, comorbidades, medicações/doses conferidas e efeitos descritos, sono e história familiar pertinente.",min:2,max:17,sourceHint:"Família, prontuário e documentos."},
  {id:"contexts",title:"Fontes e contexto funcional",question:"Distinguir relato familiar, observação direta e documento escolar/terapêutico; registrar concordância, divergência e indisponibilidade.",min:2,max:17,sourceHint:"Fontes explicitadas; nenhuma fonte inexistente é presumida."},
  {id:"preschool",title:"Brincadeira, interação e adaptação na educação infantil",question:"Descrever brincar, comunicação funcional, comportamento em casa e creche/pré-escola se frequentada.",min:2,max:5,sourceHint:"Família; educação infantil quando existente."},
  {id:"school",title:"Funcionamento escolar e adaptações já realizadas",question:"Registrar desempenho real, frequência, demandas, suportes, barreiras, resposta às adaptações e relatório escolar se disponível.",min:6,max:17,sourceHint:"Família, boletim, escola/AEE; ausência documentada."},
  {id:"physical",title:"Exame físico e dados antropométricos relevantes",question:"Achados positivos/negativos reais e medidas pertinentes, com justificativa se não aferidas; sem declarar dados presumidos.",min:2,max:17,sourceHint:"Exame presencial por profissional.",clinicianOnly:true},
  {id:"neuro",title:"Exame neurológico presencial documentado",question:"Registrar estado de consciência e interação, pares cranianos pertinentes, tônus, força/função motora, reflexos quando indicados, sensibilidade, coordenação e marcha conforme colaboração. Explicitar limitações.",min:2,max:17,sourceHint:"Exame presencial; missão digital não substitui.",clinicianOnly:true},
  {id:"mental",title:"Exame do estado mental ajustado ao desenvolvimento",question:"Aparência, comportamento, linguagem, atenção, psicomotricidade, humor/afeto; pensamento/percepção, orientação, juízo e segurança conforme idade/indicação.",min:2,max:17,sourceHint:"Observação e entrevista profissionais, não inferência do jogo.",clinicianOnly:true},
  {id:"differential",title:"Convergência dos dados e diagnóstico diferencial",question:"Explicitar achados que sustentam, contradizem ou permanecem inconclusivos; avaliar alternativas, comorbidades e limitações sem inferência automatizada.",min:2,max:17,sourceHint:"Síntese médica assinada após revisão.",clinicianOnly:true},
  {id:"plan",title:"Conduta, necessidade documental e revisão médica",question:"Adequar recomendações, seguimento, encaminhamentos e orientações ao caso; confirmar que médico revisou diagnóstico, CID e documento final antes de emitir.",min:2,max:17,sourceHint:"Responsabilidade exclusiva do médico.",clinicianOnly:true},
  {id:"tea-social",focus:"tea",title:"TEA — comunicação e reciprocidade em contextos",question:"Descrever reciprocidade socioemocional, comunicação não verbal e relacionamentos, distinguindo observação e relatos; diferenças culturais e comunicação alternativa.",min:2,max:17,sourceHint:"História, interação, família e escola quando disponíveis."},
  {id:"tea-rb",focus:"tea",title:"TEA — padrões restritos/repetitivos, início e diferencial",question:"Documentar padrões comportamentais/sensoriais, início no desenvolvimento, impacto funcional e diferenciais; não usar apenas contato ocular ou preferência por alinhar objetos.",min:2,max:17,sourceHint:"História longitudinal e fontes múltiplas."},
  {id:"tdah-context",focus:"tdah",title:"TDAH — sintomas, início, duração e múltiplos ambientes",question:"Investigar sintomas desatentos/hiperativos, curso, prejuízo e mais de um contexto. Excluir privação de sono, ansiedade, deficiências sensoriais e dificuldades de aprendizagem.",min:4,max:17,sourceHint:"Família, escola e entrevista médica."},
  {id:"lang",focus:"linguagem",title:"Linguagem — compreensão, expressão, pragmática e audição",question:"Descrever inteligibilidade, comunicação funcional, recepção/expressão, audição investigada e necessidade de fonoaudiologia/audiologia.",min:2,max:17,sourceHint:"Observação, família, fonoaudiologia ou testes auditivos se disponíveis."},
  {id:"epilepsy-event",focus:"epilepsia",title:"Epilepsia — caracterização dos eventos e exame neurológico",question:"Detalhar semiologia, duração, frequência, consciência, gatilhos, pós-ictal, vídeos disponíveis sob consentimento e diagnósticos diferenciais.",min:2,max:17,sourceHint:"Testemunhas, relatos e documentos clínicos."},
  {id:"epilepsy-plan",focus:"epilepsia",title:"Epilepsia — segurança, tratamento e interpretação de exames",question:"Medicações verificadas, adesão/efeitos, EEG e neuroimagem quando pertinentes e disponíveis, plano de segurança e sinais de urgência.",min:2,max:17,sourceHint:"Profissional, medicações e exames; não exigir EEG novo em todo caso.",clinicianOnly:true},
  {id:"motor-function",focus:"motor",title:"Motricidade — topografia, função e evolução",question:"Caracterizar força, tônus, reflexos, postura, marcha, lateralidade, função manual e repercussões, com achados diretos e limitações.",min:2,max:17,sourceHint:"Exame profissional, história e terapeutas.",clinicianOnly:true},
  {id:"learn",focus:"aprendizagem",title:"Aprendizagem — oportunidade educacional e desempenho",question:"Verificar escolarização, leitura, escrita, matemática, visão/audição, frequência, ensino, provas e resposta a suportes; diferenciar dificuldade de transtorno.",min:6,max:17,sourceHint:"Escola, família, produções escolares e avaliação quando disponível."},
  {id:"psych",focus:"psiquiatria",title:"Saúde mental — sintomas, duração e contexto",question:"Distinguir humor referido, afeto observado, ansiedade, atenção, sono, comportamento, conteúdos de pensamento e impacto funcional.",min:2,max:17,sourceHint:"Entrevista médica, paciente quando capaz e cuidadores."},
  {id:"risk8",focus:"psiquiatria",title:"Segurança emocional — entrevista quando indicada",question:"A partir de 12 anos considerar instrumento de rastreio validado; entre 8–11 anos somente se indicação clínica. Em qualquer idade, sinais concretos de risco demandam avaliação clínica e proteção, fora do jogo.",min:8,max:17,sourceHint:"Avaliação médica reservada; dados sensíveis em prontuário protegido.",clinicianOnly:true},
];

export function requirementsForAge(age: number, foci: readonly ConsultationFocus[] = []): Requirement[] {
  if (!Number.isInteger(age) || age < 2 || age > 17) return [];
  const selected = new Set(foci);
  return REQUIREMENTS.filter((item) => age >= item.min && age <= item.max && (!item.focus || selected.has(item.focus)));
}

/** Campos nucleares não podem ser dispensados pelo operador para declarar cobertura documental.
 *  Nos demais, justificativa de inaplicabilidade pode ser registrada sem inventar dados. */
export const CRITICAL_REQUIREMENTS = new Set(["identity","complaint","neuro","mental","differential","plan"]);
export function evidenceIsComplete(task: Requirement, entry?: EvidenceEntry): boolean {
  if (!entry || entry.status === "pendente") return false;
  const note = entry.note?.trim() || "";
  if (!note) return false;
  if (entry.status === "documentado") {
    if (!entry.source) return false;
    if (task.clinicianOnly && !["exame","clinico"].includes(entry.source)) return false;
    return true;
  }
  if (entry.status === "inaplicavel") return !CRITICAL_REQUIREMENTS.has(task.id);
  return entry.status === "limitado";
}

export function reviewDocumentarySufficiency(age: number, foci: readonly ConsultationFocus[], entries: EvidenceMap): ReadinessReview {
  const tasks = requirementsForAge(age,foci);
  const pending: string[] = [], limited: string[] = [], justified: string[] = [];
  let completed = 0;
  for (const task of tasks) {
    const entry = entries[task.id];
    if (!evidenceIsComplete(task,entry)) { pending.push(task.title); continue; }
    completed += 1;
    if (entry.status === "limitado") limited.push(task.title);
    if (entry.status === "inaplicavel") justified.push(task.title);
  }
  const summary = pending.length
    ? "Documentação ainda incompleta para revisão clínica."
    : limited.length
      ? "Documentação registrada com limitações explícitas; avaliação médica necessária."
      : "Itens do roteiro documentados; revisão, julgamento e autorização médica permanecem indispensáveis.";
  return { completed,total:tasks.length,pending,limited,justified,summary };
}

export function buildReadinessReport(age: number,foci: readonly ConsultationFocus[],entries:EvidenceMap, at = new Date()): string {
  const tasks=requirementsForAge(age,foci), review=reviewDocumentarySufficiency(age,foci,entries);
  if(!tasks.length)return "Roteiro não disponível para a idade informada.";
  const lines=[
    `SUPER NEUROPAD GAME — MATRIZ DE DOCUMENTAÇÃO CLÍNICA v${READINESS_VERSION}`,
    `Faixa anual: ${age} anos. Registro local: ${at.toLocaleString("pt-BR")}`,
    `Focos selecionados: ${foci.map(x=>FOCUS_LABELS[x]).join(", ")||"Avaliação geral"}`,
    `Itens com estado e justificativa válidos: ${review.completed}/${review.total}.`,
    review.summary,
    "Este checklist não é laudo, diagnóstico, autorização de assinatura, parecer de adequação legal ou substituto de exame presencial.",
    "A marcação é manual; a aplicação lúdica jamais equivale à confirmação de achados clínicos.",
    ""
  ];
  for(const task of tasks) {
    const entry=entries[task.id];
    const status = entry && evidenceIsComplete(task,entry) ? entry.status : "pendente";
    lines.push(`• ${task.title}: ${EVIDENCE_STATUS[status]}`);
    if(status!=="pendente"){
      if(entry.source)lines.push(`  Fonte declarada: ${EVIDENCE_SOURCE[entry.source]}`);
      lines.push(`  Registro: ${entry.note.trim()}`);
    }
  }
  lines.push("Revisão clínica de diagnóstico diferencial, CID, conduta e emissão continua exclusiva do médico responsável.");
  return lines.join("\n");
}
