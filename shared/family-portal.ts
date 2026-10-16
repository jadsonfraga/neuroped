/**
 * Portal da família (item 5) — regras puras, compartilhadas entre o backend
 * (Cloudflare Functions), a página pública estática e o painel do médico.
 *
 * Princípios (não negociáveis):
 *  - acesso por link com expiração, número máximo de aberturas e consentimento
 *    LGPD explícito a cada abertura; o segredo nunca é guardado em claro;
 *  - mínimo de dados: só o que o médico selecionou, nunca o prontuário;
 *  - REGRA DO MÉDICO: nos testes próprios do NeuroPad (Super NeuroPad Game,
 *    Dyslexia Risk/ICED-8) não há corte, nível nem classificação. O portal só
 *    descreve como a avaliação foi feita e (texto do médico) como a criança
 *    respondeu. O médico interpreta;
 *  - nada de diagnóstico ou interpretação clínica gerada pelo app: textos
 *    livres que parecem diagnóstico/classificação são recusados;
 *  - o app não envia nada: gera mensagem/link para o médico enviar.
 */

export const FAMILY_PORTAL_CONSENT_VERSION = "family-portal-lgpd-2026-10";

export const FAMILY_PORTAL_CONSENT_NOTICE =
  "Li e autorizo a abertura deste conteúdo, que contém dados de saúde da criança (LGPD, Lei 13.709/2018). " +
  "O link é pessoal, temporário e tem número limitado de aberturas. Vou guardá-lo e não o compartilhar com terceiros.";

export const FAMILY_PORTAL_SUPPORT_NOTICE =
  "Este espaço reúne orientações, lembretes e documentos organizados pelo seu médico. " +
  "Ele não faz diagnóstico, não interpreta resultados e não substitui a consulta. " +
  "Em emergência, procure atendimento imediato ou ligue 192 (SAMU).";

export const FAMILY_PORTAL_LIMITS = Object.freeze({
  defaultExpiresHours: 72,
  minExpiresHours: 1,
  maxExpiresHours: 720,
  defaultMaxViews: 3,
  minMaxViews: 1,
  maxMaxViews: 10,
  maxOrientations: 12,
  maxReminders: 12,
  maxDocuments: 5,
  maxQuestionnaires: 4,
  maxOwnTests: 4,
  maxTitle: 120,
  maxText: 2000,
  maxDocumentText: 20000,
});

/** Textos-modelo neutros: preparo da consulta e uso do portal. Sem conteúdo clínico. Aguardam revisão do médico. */
export interface OrientationTemplate {
  id: string;
  titulo: string;
  texto: string;
}

export const ORIENTATION_TEMPLATES: ReadonlyArray<OrientationTemplate> = Object.freeze([
  {
    id: "preparar-consulta",
    titulo: "Como se preparar para a consulta",
    texto:
      "Leve documentos e exames anteriores, relatórios da escola ou de terapeutas e a lista dos medicamentos que a criança usa hoje, se houver. Anote com antecedência as dúvidas que quiser conversar.",
  },
  {
    id: "responder-questionario",
    titulo: "Como responder o questionário",
    texto:
      "Responda com calma, pensando em como a criança tem estado no dia a dia. Não existem respostas certas ou erradas. Se uma pergunta não se aplicar, pode deixá-la em branco. As respostas serão lidas pelo médico.",
  },
  {
    id: "atividades-no-aplicativo",
    titulo: "Atividades e jogos feitos antes da consulta",
    texto:
      "Algumas atividades são feitas como parte da preparação. Nelas, não há nota nem resultado para a família: o médico explica na consulta o que foi observado. Deixe a criança à vontade; ela não precisa acertar tudo.",
  },
  {
    id: "documentos-recebidos",
    titulo: "Sobre os documentos enviados",
    texto:
      "Os documentos deste espaço foram liberados pelo seu médico. Guarde-os com cuidado, pois contêm dados de saúde. Dúvidas sobre o conteúdo devem ser conversadas na consulta.",
  },
  {
    id: "privacidade-link",
    titulo: "Cuidados com este link",
    texto:
      "O link é pessoal e expira. Não o encaminhe a outras pessoas nem o publique em redes sociais. Se perdeu o acesso ou o prazo acabou, peça um novo link à clínica.",
  },
]);

export type ReminderKind = "consulta" | "questionario" | "documentos" | "exame" | "outro";
export const REMINDER_KINDS: ReadonlyArray<ReminderKind> = ["consulta", "questionario", "documentos", "exame", "outro"];

export type OwnTestId = "super-neuropad-game" | "dyslexia-risk-iced8";
export const OWN_TEST_LABELS: Readonly<Record<OwnTestId, string>> = Object.freeze({
  "super-neuropad-game": "Super NeuroPad Game",
  "dyslexia-risk-iced8": "Dyslexia Risk / ICED-8",
});

/** Como a avaliação foi feita: texto fixo e descritivo. Nada de resultado. */
export const OWN_TEST_HOW_DONE =
  "Atividade aplicada como parte da preparação para a consulta. Esta página não mostra nota, nível, classificação nem conclusão; a leitura do resultado é feita pelo médico na consulta.";

export interface PortalOrientation { titulo: string; texto: string }
export interface PortalReminder { tipo: ReminderKind; titulo: string; quando: string | null; texto: string }
export interface PortalDocument { documentId: string; titulo: string; tipo: string; emitidoEm: string; texto: string }
export interface PortalQuestionnaire { titulo: string; token: string }
export interface PortalOwnTest { instrumento: OwnTestId; data: string; comoRespondeu: string }

export interface PortalContent {
  orientacoes: PortalOrientation[];
  lembretes: PortalReminder[];
  documentos: PortalDocument[];
  questionarios: PortalQuestionnaire[];
  avaliacoesProprias: PortalOwnTest[];
}

export const EMPTY_PORTAL_CONTENT: PortalContent = Object.freeze({
  orientacoes: [], lembretes: [], documentos: [], questionarios: [], avaliacoesProprias: [],
}) as PortalContent;

function fold(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

/**
 * Termos que indicam diagnóstico, classificação, nível, corte ou pontuação.
 * Aplicados a textos livres de orientação, lembrete e descrição de avaliação
 * própria. (Documentos/laudos são do médico e seguem outro fluxo: liberação
 * explícita no prontuário.)
 */
const FORBIDDEN_INTERPRETATION = [
  /\bdiagnostic\w*/, /\bdiagnose\b/, /\bcid[- ]?10\b/, /\bcid\b/, /\bf\d{2}(\.\d)?\b/,
  /\b(tdah|tea|dislexia|discalculia|autismo|autista|epilepsia|transtorno|deficiencia intelectual|atraso)\b/,
  /\brisco\b/, /\b(alto|baixo|moderado|elevado|grave|severo)\b/, /\bgrau leve\b/,
  /\bnivel\b/, /\bclassifica\w*/, /\bescore\b/, /\bpontua\w*/, /\bpontos?\b/, /\bponto de corte\b/, /\bcorte\b/,
  /\bpercentil\w*/, /\bpositivo\b/, /\bnegativo\b/, /\bcompativel\b/, /\bsugestivo\b/, /\bindica(tivo|do|m)?\b/,
  /\b(abaixo|acima) do esperado\b/, /\bdentro do esperado\b/, /\balterad[oa]s?\b/, /\bnormal\b/, /\banormal\b/,
  /\bacertou \d/, /\b\d+\s*(\/|de)\s*\d+\s*(acertos|desafios|pontos)\b/,
];

export function findForbiddenInterpretation(text: string): string | null {
  const folded = fold(text);
  for (const pattern of FORBIDDEN_INTERPRETATION) {
    const match = folded.match(pattern);
    if (match) return match[0];
  }
  return null;
}

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; message: string };

function str(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;
const OPAQUE_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,119}$/;
const QUESTIONNAIRE_TOKEN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,119}\.[A-Za-z0-9_-]{40,80}$/;

function validDay(value: string): boolean {
  if (!ISO_DAY.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

function checkFree(label: string, text: string): string | null {
  const hit = findForbiddenInterpretation(text);
  return hit ? `${label}: o texto contém "${hit}", que sugere diagnóstico, nível ou classificação. Esses conteúdos ficam para a consulta.` : null;
}

/** Valida o que o médico montou (sem documentos: esses são resolvidos no servidor a partir do prontuário). */
export function validatePortalDraft(raw: unknown): ValidationResult<Omit<PortalContent, "documentos"> & { documentIds: string[] }> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { ok: false, message: "Conteúdo inválido." };
  const input = raw as Record<string, unknown>;
  const L = FAMILY_PORTAL_LIMITS;
  const list = (key: string, max: number): unknown[] | string => {
    const value = input[key];
    if (value === undefined || value === null) return [];
    if (!Array.isArray(value)) return `${key} deve ser uma lista.`;
    if (value.length > max) return `${key}: no máximo ${max} itens.`;
    return value;
  };

  const orientRaw = list("orientacoes", L.maxOrientations);
  if (typeof orientRaw === "string") return { ok: false, message: orientRaw };
  const orientacoes: PortalOrientation[] = [];
  for (const item of orientRaw) {
    const o = (item ?? {}) as Record<string, unknown>;
    const titulo = str(o.titulo, L.maxTitle);
    const texto = str(o.texto, L.maxText);
    if (!titulo || !texto) return { ok: false, message: "Cada orientação precisa de título e texto." };
    const bad = checkFree(`Orientação "${titulo}"`, `${titulo} ${texto}`);
    if (bad) return { ok: false, message: bad };
    orientacoes.push({ titulo, texto });
  }

  const remRaw = list("lembretes", L.maxReminders);
  if (typeof remRaw === "string") return { ok: false, message: remRaw };
  const lembretes: PortalReminder[] = [];
  for (const item of remRaw) {
    const r = (item ?? {}) as Record<string, unknown>;
    const tipo = str(r.tipo, 20) as ReminderKind;
    const titulo = str(r.titulo, L.maxTitle);
    const texto = str(r.texto, L.maxText);
    const quandoRaw = str(r.quando, 40);
    if (!REMINDER_KINDS.includes(tipo) || !titulo) return { ok: false, message: "Cada lembrete precisa de tipo válido e título." };
    if (quandoRaw && !ISO_INSTANT.test(quandoRaw) && !validDay(quandoRaw)) return { ok: false, message: `Lembrete "${titulo}": data inválida.` };
    const bad = checkFree(`Lembrete "${titulo}"`, `${titulo} ${texto}`);
    if (bad) return { ok: false, message: bad };
    lembretes.push({ tipo, titulo, quando: quandoRaw || null, texto });
  }

  const qRaw = list("questionarios", L.maxQuestionnaires);
  if (typeof qRaw === "string") return { ok: false, message: qRaw };
  const questionarios: PortalQuestionnaire[] = [];
  for (const item of qRaw) {
    const q = (item ?? {}) as Record<string, unknown>;
    const titulo = str(q.titulo, L.maxTitle);
    const token = str(q.token, 220);
    if (!titulo || !QUESTIONNAIRE_TOKEN.test(token)) return { ok: false, message: "Questionário inválido: informe título e o token do convite de pré-consulta." };
    questionarios.push({ titulo, token });
  }

  const tRaw = list("avaliacoesProprias", L.maxOwnTests);
  if (typeof tRaw === "string") return { ok: false, message: tRaw };
  const avaliacoesProprias: PortalOwnTest[] = [];
  for (const item of tRaw) {
    const t = (item ?? {}) as Record<string, unknown>;
    const instrumento = str(t.instrumento, 40) as OwnTestId;
    const data = str(t.data, 10);
    const comoRespondeu = str(t.comoRespondeu, L.maxText);
    if (!(instrumento in OWN_TEST_LABELS)) return { ok: false, message: "Avaliação própria inválida." };
    if (!validDay(data)) return { ok: false, message: `Avaliação "${OWN_TEST_LABELS[instrumento]}": data inválida.` };
    const bad = checkFree(`Avaliação "${OWN_TEST_LABELS[instrumento]}"`, comoRespondeu);
    if (bad) return { ok: false, message: `${bad} Descreva apenas como a criança respondeu (ex.: atenção, ritmo, colaboração), sem nível, nota ou conclusão.` };
    avaliacoesProprias.push({ instrumento, data, comoRespondeu });
  }

  const dRaw = list("documentIds", L.maxDocuments);
  if (typeof dRaw === "string") return { ok: false, message: dRaw };
  const documentIds: string[] = [];
  for (const id of dRaw) {
    if (typeof id !== "string" || !OPAQUE_ID.test(id)) return { ok: false, message: "Identificador de documento inválido." };
    if (!documentIds.includes(id)) documentIds.push(id);
  }

  const total = orientacoes.length + lembretes.length + questionarios.length + avaliacoesProprias.length + documentIds.length;
  if (total === 0) return { ok: false, message: "Inclua ao menos um item no portal." };
  return { ok: true, value: { orientacoes, lembretes, questionarios, avaliacoesProprias, documentIds } };
}

export function clampExpiresHours(value: unknown): number | null {
  const n = value === undefined ? FAMILY_PORTAL_LIMITS.defaultExpiresHours : Number(value);
  return Number.isInteger(n) && n >= FAMILY_PORTAL_LIMITS.minExpiresHours && n <= FAMILY_PORTAL_LIMITS.maxExpiresHours ? n : null;
}
export function clampMaxViews(value: unknown): number | null {
  const n = value === undefined ? FAMILY_PORTAL_LIMITS.defaultMaxViews : Number(value);
  return Number.isInteger(n) && n >= FAMILY_PORTAL_LIMITS.minMaxViews && n <= FAMILY_PORTAL_LIMITS.maxMaxViews ? n : null;
}

export type ShareAccessState = "ok" | "revoked" | "expired" | "exhausted" | "clinic_unavailable";
export interface ShareAccessInput {
  status: "active" | "revoked";
  expiresAt: string;
  viewCount: number;
  maxViews: number;
  clinicStatus: string;
}
/** Estado de acesso do link. A mesma regra é reaplicada, de forma atômica, no UPDATE do servidor. */
export function shareAccessState(share: ShareAccessInput, now: Date = new Date()): ShareAccessState {
  if (share.clinicStatus !== "active") return "clinic_unavailable";
  if (share.status === "revoked") return "revoked";
  if (Date.parse(share.expiresAt) <= now.getTime()) return "expired";
  if (share.viewCount >= share.maxViews) return "exhausted";
  return "ok";
}

export const SHARE_STATE_MESSAGES: Readonly<Record<Exclude<ShareAccessState, "ok">, string>> = Object.freeze({
  revoked: "Este link foi cancelado. Peça um novo link à clínica.",
  expired: "Este link expirou. Peça um novo link à clínica.",
  exhausted: "Este link atingiu o número máximo de aberturas. Peça um novo link à clínica.",
  clinic_unavailable: "Este conteúdo não está mais disponível.",
});

/** Mensagem-rascunho para o médico copiar e enviar (o app nunca envia). */
export function buildFamilyMessageDraft(input: { link: string; clinicName?: string; expiresAt: string; maxViews: number; hasQuestionnaire: boolean }): string {
  const quando = new Date(input.expiresAt);
  const dia = Number.isNaN(quando.getTime())
    ? ""
    : new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(quando);
  return [
    "Olá! Segue o link seguro com as orientações" + (input.hasQuestionnaire ? ", o questionário" : "") + " e os documentos da consulta:",
    "",
    input.link,
    "",
    `O link é pessoal, pode ser aberto até ${input.maxViews} vez${input.maxViews > 1 ? "es" : ""}${dia ? ` e vale até ${dia} (horário de Brasília)` : ""}.`,
    "Ao abrir, você precisará confirmar a autorização de acesso aos dados de saúde (LGPD). Não encaminhe o link a outras pessoas.",
    "Este conteúdo não substitui a consulta; dúvidas, converse com o médico.",
    "Em emergência, ligue 192 (SAMU).",
    ...(input.clinicName ? ["", input.clinicName] : []),
  ].join("\n");
}
