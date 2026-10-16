/**
 * LGPD + registro de uso de IA (Resolução CFM 2.454/2026) — regras puras, sem I/O.
 *
 * Fontes oficiais lidas em 16/10/2026 (ver docs/LGPD_REGISTRO_IA.md):
 * - Resolução CFM 2.454/2026 (DOU 27/02/2026, retif. 05/03/2026; vigência 26/08/2026).
 * - Lei 13.709/2018 (LGPD), texto compilado do Planalto.
 * - Lei 13.787/2018 (prontuário eletrônico), art. 6º.
 *
 * REGRA DO MÉDICO: nada aqui contém corte, nível ou classificação de teste do NeuroPad.
 * O registro de IA guarda só metadados estruturados (ferramenta, finalidade, quem, quando,
 * ciência da família) — nunca conteúdo clínico nem resultado de teste.
 */

export type LegalReference = { id: string; source: string; article: string; summary: string };

/** O que a norma diz e onde o produto atende. Citações curtas e fiéis ao texto lido. */
export const LEGAL_REFERENCES: readonly LegalReference[] = [
  { id: "cfm-4-v", source: "Resolução CFM 2.454/2026", article: "art. 4º, V", summary: "Dever do médico de registrar no prontuário o uso de sistemas de IA como apoio à decisão médica." },
  { id: "cfm-4-i-ii", source: "Resolução CFM 2.454/2026", article: "art. 4º, I e II", summary: "IA só como apoio; médico é o responsável final e exerce julgamento crítico." },
  { id: "cfm-5-p1", source: "Resolução CFM 2.454/2026", article: "art. 5º, § 1º", summary: "Paciente tem direito de ser informado, de forma clara, quando IA for apoio relevante ao cuidado." },
  { id: "cfm-5-p2", source: "Resolução CFM 2.454/2026", article: "art. 5º, § 2º", summary: "É vedado delegar à IA a comunicação de diagnóstico, prognóstico ou decisão terapêutica sem mediação humana." },
  { id: "cfm-5-p3", source: "Resolução CFM 2.454/2026", article: "art. 5º, § 3º", summary: "Respeitar a recusa informada do paciente ao uso de IA." },
  { id: "cfm-6", source: "Resolução CFM 2.454/2026", article: "art. 6º e §§", summary: "Confidencialidade; compartilhamento de dados com IA só se estritamente necessário e conforme finalidade informada." },
  { id: "cfm-11", source: "Resolução CFM 2.454/2026", article: "art. 11", summary: "Qualquer utilização de IA deve ser comunicada e explicada aos pacientes." },
  { id: "cfm-12-13", source: "Resolução CFM 2.454/2026", article: "arts. 12 e 13; Anexo II", summary: "Instituição avalia o grau de risco (baixo, médio, alto, inaceitável) e o informa ao usuário." },
  { id: "cfm-14-anexo3", source: "Resolução CFM 2.454/2026", article: "art. 14; Anexo III", summary: "Governança interna: transparência, monitoramento de vieses, responsável técnico, acesso de órgãos de controle." },
  { id: "lgpd-5-ii", source: "Lei 13.709/2018", article: "art. 5º, II", summary: "Dado de saúde é dado pessoal sensível." },
  { id: "lgpd-8", source: "Lei 13.709/2018", article: "art. 8º, §§ 2º, 4º, 5º", summary: "Ônus da prova do consentimento é do controlador; finalidade determinada; revogável a qualquer momento." },
  { id: "lgpd-11", source: "Lei 13.709/2018", article: "art. 11, I e II, a e f", summary: "Dado sensível: consentimento específico e destacado, ou obrigação legal / tutela da saúde." },
  { id: "lgpd-14", source: "Lei 13.709/2018", article: "art. 14, § 1º", summary: "Dados de crianças: consentimento específico e em destaque de ao menos um dos pais ou responsável legal." },
  { id: "lgpd-16", source: "Lei 13.709/2018", article: "art. 16, I", summary: "Eliminação após o término do tratamento, com conservação autorizada para cumprimento de obrigação legal ou regulatória." },
  { id: "lgpd-18-19", source: "Lei 13.709/2018", article: "arts. 18 e 19", summary: "Direitos do titular: confirmação, acesso, correção, anonimização/bloqueio/eliminação, portabilidade, informação sobre compartilhamento e revogação; resposta em formato simplificado imediato ou declaração em até 15 dias." },
  { id: "lgpd-20", source: "Lei 13.709/2018", article: "art. 20", summary: "Revisão de decisões tomadas unicamente com base em tratamento automatizado." },
  { id: "lgpd-37", source: "Lei 13.709/2018", article: "art. 37", summary: "Controlador e operador mantêm registro das operações de tratamento." },
  { id: "l13787-6", source: "Lei 13.787/2018", article: "art. 6º", summary: "Prontuário pode ser eliminado só após 20 anos do último registro; prazos diferenciados por regulamento; eliminação registrada e sigilosa." },
];

/** Dúvidas jurídicas: NÃO assumidas pelo produto. Dependem de decisão do médico/jurídico. */
export const PENDING_LEGAL_DECISIONS: readonly { id: string; question: string; productBehavior: string }[] = [
  { id: "ia-ciencia-forma", question: "A resolução exige comunicar/explicar o uso de IA (arts. 5º §1º e 11), mas não define forma nem se o aceite precisa ser escrito. Basta o registro de ciência pelo médico, ou a família deve assinar/aceitar?", productBehavior: "O produto registra a ciência marcada pelo médico (quem, quando); não cria aceite assinado pela família." },
  { id: "ia-classificacao-risco", question: "Qual grau de risco (Anexo II) se atribui a cada uso de IA do consultório, já que a avaliação é da instituição (art. 12)?", productBehavior: "O campo de risco é opcional e nunca é preenchido por padrão; o médico/jurídico define." },
  { id: "ia-quais-usos-registrar", question: "Todo uso de IA precisa de registro, ou só o uso como 'apoio à decisão médica' (art. 4º, V), excluídos usos como transcrição e redação de texto?", productBehavior: "O produto permite registrar qualquer finalidade; não decide o que é obrigatório." },
  { id: "retencao-prazo", question: "O prazo mínimo de 20 anos (Lei 13.787, art. 6º) se aplica a todo o conteúdo do prontuário de criança/adolescente? Há regulamento com prazo diferenciado ou norma do CFM aplicável?", productBehavior: "Piso de 20 anos a partir do último registro, não reduzível; a clínica pode ampliar, nunca diminuir." },
  { id: "retencao-ia-trilhas", question: "O registro de uso de IA, as trilhas de auditoria e as evidências de consentimento integram o prontuário (prazo de 20 anos) ou têm prazo próprio?", productBehavior: "Sem piso legal assumido: a clínica configura; padrão conservador de 20 anos para o registro de IA." },
  { id: "eliminacao-anonimizacao", question: "Dentro do prazo de guarda, o pedido de eliminação do titular (LGPD art. 18, VI) cede à obrigação legal (art. 16, I)? A anonimização do prontuário é admitida antes de 20 anos?", productBehavior: "Eliminação do prontuário é bloqueada até o fim do prazo; dados fora do prontuário (portal da família, links) podem ser eliminados." },
  { id: "encarregado-dpo", question: "Quem é o encarregado (art. 41) e como o contato é divulgado?", productBehavior: "Campo de contato do encarregado fica a cargo da clínica; o produto não define." },
  { id: "comissao-ia", question: "A Comissão de IA e Telemedicina (art. 14, parágrafo único) se aplica a consultório que apenas usa IA de terceiros?", productBehavior: "Não implementada; pendente de parecer." },
];

// ---------------------------------------------------------------- retenção ----

/** Lei 13.787/2018, art. 6º: 20 anos a partir do último registro. */
export const CLINICAL_RECORD_MIN_RETENTION_DAYS = 7300;
export const MAX_RETENTION_DAYS = 36_500;

export type RetentionCategory = "clinical_record" | "ai_use_registry" | "audit_trail" | "family_portal_links";

export const RETENTION_CATEGORIES: Record<RetentionCategory, { label: string; floorDays: number; defaultDays: number; basis: string }> = {
  clinical_record: { label: "Prontuário e documentos clínicos", floorDays: CLINICAL_RECORD_MIN_RETENTION_DAYS, defaultDays: CLINICAL_RECORD_MIN_RETENTION_DAYS, basis: "Lei 13.787/2018, art. 6º (mínimo de 20 anos do último registro)" },
  ai_use_registry: { label: "Registro de uso de IA", floorDays: 0, defaultDays: CLINICAL_RECORD_MIN_RETENTION_DAYS, basis: "Pendente de decisão jurídica (integra o prontuário?); padrão conservador" },
  audit_trail: { label: "Trilha de auditoria", floorDays: 0, defaultDays: 1825, basis: "Pendente de decisão jurídica; LGPD art. 37 exige registro das operações" },
  family_portal_links: { label: "Links do portal da família", floorDays: 0, defaultDays: 90, basis: "Dado fora do prontuário; minimização (LGPD art. 6º, III)" },
};

export function isRetentionCategory(value: unknown): value is RetentionCategory {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(RETENTION_CATEGORIES, value);
}

export type RetentionValidation = { ok: true; days: number } | { ok: false; code: "INVALID_DAYS" | "BELOW_LEGAL_FLOOR"; message: string };

export function validateRetentionDays(category: RetentionCategory, days: unknown): RetentionValidation {
  if (typeof days !== "number" || !Number.isInteger(days) || days < 0 || days > MAX_RETENTION_DAYS) {
    return { ok: false, code: "INVALID_DAYS", message: `Prazo deve ser inteiro entre 0 e ${MAX_RETENTION_DAYS} dias.` };
  }
  const rule = RETENTION_CATEGORIES[category];
  if (days < rule.floorDays) {
    return { ok: false, code: "BELOW_LEGAL_FLOOR", message: `${rule.label}: o prazo mínimo legal é de ${rule.floorDays} dias (${rule.basis}).` };
  }
  return { ok: true, days };
}

/** Fim do prazo de guarda do prontuário: último registro + dias (nunca abaixo do piso legal). */
export function clinicalRetentionUntil(lastRecordIso: string | null, configuredDays?: number | null): string | null {
  if (!lastRecordIso) return null;
  const last = new Date(lastRecordIso);
  if (!Number.isFinite(last.getTime())) return null;
  const days = Math.max(configuredDays ?? 0, CLINICAL_RECORD_MIN_RETENTION_DAYS);
  return new Date(last.getTime() + days * 86_400_000).toISOString();
}

// ------------------------------------------------- pedidos do titular (art. 18) ----

export type SubjectRequestType = "confirmation" | "access" | "correction" | "anonymization" | "deletion" | "portability" | "sharing_info" | "consent_revocation";

export const SUBJECT_REQUEST_LABELS: Record<SubjectRequestType, string> = {
  confirmation: "Confirmação de tratamento",
  access: "Acesso aos dados",
  correction: "Correção de dados",
  anonymization: "Anonimização, bloqueio ou eliminação de dados desnecessários",
  deletion: "Eliminação de dados tratados com consentimento",
  portability: "Portabilidade",
  sharing_info: "Informação sobre compartilhamento",
  consent_revocation: "Revogação de consentimento",
};

export type SubjectRequestOutcome = {
  type: SubjectRequestType;
  decision: "attend" | "attend_partially" | "deny_with_reason" | "pending_legal_decision";
  reason: string;
  legalRefs: string[];
  /** Resposta ao titular em até 15 dias (art. 19, II). */
  responseDays: number;
};

/**
 * Orienta o médico; não decide sozinho. `withinRecordRetention` = existe prontuário dentro do prazo de guarda.
 * Onde a lei é ambígua o resultado é `pending_legal_decision`, nunca uma suposição.
 */
export function evaluateSubjectRequest(type: SubjectRequestType, ctx: { withinRecordRetention: boolean }): SubjectRequestOutcome {
  const base = { type, responseDays: 15 };
  switch (type) {
    case "confirmation":
    case "access":
    case "portability":
    case "sharing_info":
      return { ...base, decision: "attend", reason: "Direito de acesso/confirmação/portabilidade; atender sem custo, em formato simplificado ou declaração completa.", legalRefs: ["lgpd-18-19"] };
    case "correction":
      return { ...base, decision: "attend_partially", reason: "Correção cadastral é atendida; no prontuário, registre retificação por adendo datado — não sobrescreva o registro original.", legalRefs: ["lgpd-18-19", "l13787-6"] };
    case "consent_revocation":
      return { ...base, decision: "attend_partially", reason: "Revogação vale daqui para frente (art. 8º, § 5º); tratamentos já feitos permanecem. Não elimina o prontuário dentro do prazo legal.", legalRefs: ["lgpd-8", "lgpd-16"] };
    case "deletion":
    case "anonymization":
      if (ctx.withinRecordRetention) {
        return { ...base, decision: "deny_with_reason", reason: "Prontuário dentro do prazo de 20 anos: conservação para cumprimento de obrigação legal (LGPD art. 16, I; Lei 13.787 art. 6º). Dados fora do prontuário (portal da família, links) podem ser eliminados. Anonimização do prontuário antes do prazo: pendente de decisão jurídica.", legalRefs: ["lgpd-16", "l13787-6"] };
      }
      return { ...base, decision: "pending_legal_decision", reason: "Prazo mínimo vencido: eliminação possível, mas exige aprovação de segundo gestor, conferência de legal hold e registro da eliminação (Lei 13.787 art. 6º, § 4º).", legalRefs: ["l13787-6", "lgpd-16"] };
  }
}

// ----------------------------------------------------------- registro de IA ----

export const AI_PURPOSES = {
  apoio_decisao_clinica: "Apoio à decisão clínica",
  redacao_documento: "Apoio à redação de documento/laudo (revisado pelo médico)",
  resumo_informacoes: "Resumo/organização de informações",
  transcricao: "Transcrição de consulta",
  comunicacao_administrativa: "Comunicação administrativa/agenda",
  pesquisa_literatura: "Busca/sumarização de literatura",
} as const;
export type AiPurpose = keyof typeof AI_PURPOSES;

export const AI_DATA_SHARING = {
  nenhum: "Nenhum dado do paciente enviado",
  pseudonimizado: "Dados pseudonimizados (sem identificadores diretos)",
  identificado: "Dados identificáveis enviados",
} as const;
export type AiDataSharing = keyof typeof AI_DATA_SHARING;

export const AI_RISK_LEVELS = { baixo: "Baixo", medio: "Médio", alto: "Alto" } as const;
export type AiRiskLevel = keyof typeof AI_RISK_LEVELS;

export const AI_FAMILY_STATUS = { nao_informada: "Família ainda não informada", informada: "Família informada", recusou: "Família recusou o uso de IA" } as const;
export type AiFamilyStatus = keyof typeof AI_FAMILY_STATUS;

export interface AiUseInput {
  patientId: string | null;
  tool: string;
  purpose: AiPurpose;
  dataSharing: AiDataSharing;
  riskLevel: AiRiskLevel | null;
  /** O médico revisou criticamente o resultado e manteve a decisão final (art. 4º, I e II). */
  humanReviewed: boolean;
  usedAt: string;
}

export const AI_TOOL_MAX = 80;
const TOOL_PATTERN = /^[\p{L}\p{N} ._:/+()-]{2,80}$/u;
const OPAQUE_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,119}$/;

export type AiUseValidation = { ok: true; value: AiUseInput } | { ok: false; code: string; message: string };

export function validateAiUseInput(raw: unknown, now: Date = new Date()): AiUseValidation {
  const fail = (code: string, message: string): AiUseValidation => ({ ok: false, code, message });
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return fail("INVALID_BODY", "Corpo inválido.");
  const b = raw as Record<string, unknown>;
  const patientId = b.patientId == null || b.patientId === "" ? null : b.patientId;
  if (patientId !== null && (typeof patientId !== "string" || !OPAQUE_ID.test(patientId))) return fail("INVALID_PATIENT", "patientId inválido.");
  const tool = typeof b.tool === "string" ? b.tool.trim() : "";
  if (!TOOL_PATTERN.test(tool)) return fail("INVALID_TOOL", "Informe o nome da ferramenta (2 a 80 caracteres, sem texto clínico).");
  if (typeof b.purpose !== "string" || !(b.purpose in AI_PURPOSES)) return fail("INVALID_PURPOSE", "Finalidade inválida.");
  if (typeof b.dataSharing !== "string" || !(b.dataSharing in AI_DATA_SHARING)) return fail("INVALID_DATA_SHARING", "Informe quais dados foram enviados à IA.");
  const riskLevel = b.riskLevel == null || b.riskLevel === "" ? null : b.riskLevel;
  if (riskLevel !== null && (typeof riskLevel !== "string" || !(riskLevel in AI_RISK_LEVELS))) return fail("INVALID_RISK", "Grau de risco inválido.");
  if (typeof b.humanReviewed !== "boolean") return fail("INVALID_REVIEW", "Informe se houve revisão crítica pelo médico.");
  const usedAt = typeof b.usedAt === "string" ? new Date(b.usedAt) : now;
  if (!Number.isFinite(usedAt.getTime())) return fail("INVALID_DATE", "Data/hora de uso inválida.");
  if (usedAt.getTime() > now.getTime() + 5 * 60_000) return fail("FUTURE_DATE", "A data de uso não pode estar no futuro.");
  if (patientId === null && b.dataSharing !== "nenhum") return fail("PATIENT_REQUIRED", "Uso com dados de paciente exige vincular o paciente.");
  return {
    ok: true,
    value: {
      patientId: patientId as string | null,
      tool,
      purpose: b.purpose as AiPurpose,
      dataSharing: b.dataSharing as AiDataSharing,
      riskLevel: riskLevel as AiRiskLevel | null,
      humanReviewed: b.humanReviewed,
      usedAt: usedAt.toISOString(),
    },
  };
}

export interface AiChartLineInput {
  tool: string;
  purpose: AiPurpose;
  dataSharing: AiDataSharing;
  humanReviewed: boolean;
  usedAt: string;
  actorName: string;
  familyStatus: AiFamilyStatus;
  familyAt?: string | null;
}

function brDate(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  // Fuso do consultório (UTC-3) fixo e determinístico, igual em Node e navegador.
  const local = new Date(d.getTime() - 3 * 3_600_000);
  return `${p(local.getUTCDate())}/${p(local.getUTCMonth() + 1)}/${local.getUTCFullYear()} ${p(local.getUTCHours())}:${p(local.getUTCMinutes())}`;
}

/**
 * Linha SUGERIDA para o prontuário (CFM 2.454/2026, art. 4º, V). Só descreve o uso;
 * não traz resultado, nível, corte ou interpretação. O médico copia e assina.
 */
export function buildAiChartLine(i: AiChartLineInput): string {
  const sharing = i.dataSharing === "nenhum" ? "sem envio de dados do paciente" : i.dataSharing === "pseudonimizado" ? "com dados pseudonimizados" : "com dados identificáveis";
  const review = i.humanReviewed ? "Resultado revisado criticamente pelo médico, que manteve a decisão final." : "Revisão crítica pelo médico ainda não registrada.";
  const fam = i.familyStatus === "informada"
    ? `Família informada sobre o uso de IA${i.familyAt ? ` em ${brDate(i.familyAt)}` : ""}.`
    : i.familyStatus === "recusou"
      ? `Família recusou o uso de IA${i.familyAt ? ` (${brDate(i.familyAt)})` : ""}; uso não aplicado ao cuidado.`
      : "Ciência da família ainda não registrada.";
  return `Em ${brDate(i.usedAt)}, ${i.actorName} utilizou o sistema de IA "${i.tool}" como apoio (${AI_PURPOSES[i.purpose].toLowerCase()}), ${sharing}. ${review} A IA não substitui a decisão médica. ${fam}`;
}

export type AiFamilyAckInput = { status: AiFamilyStatus; informedAt: string };

export function validateFamilyAck(raw: unknown, now: Date = new Date()): { ok: true; value: AiFamilyAckInput } | { ok: false; message: string } {
  if (!raw || typeof raw !== "object") return { ok: false, message: "Corpo inválido." };
  const b = raw as Record<string, unknown>;
  if (b.status !== "informada" && b.status !== "recusou") return { ok: false, message: "status deve ser 'informada' ou 'recusou'." };
  const at = typeof b.informedAt === "string" ? new Date(b.informedAt) : now;
  if (!Number.isFinite(at.getTime()) || at.getTime() > now.getTime() + 5 * 60_000) return { ok: false, message: "Data inválida." };
  return { ok: true, value: { status: b.status, informedAt: at.toISOString() } };
}
