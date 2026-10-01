/**
 * _notificationDelivery.ts — entrega por e-mail da caixa de saída operacional
 * (`notification_outbox`) e o texto que a família lê.
 *
 * Contrato:
 *   - O transporte é o mesmo de redefinição de senha, verificação de e-mail e
 *     convite (`../auth/_mailTransport`). Nenhum `fetch` novo a provedor.
 *   - Sem transporte configurado NADA muda: a linha continua `manual` /
 *     `pending_provider`, sem tentativa registrada, exatamente como antes.
 *   - Só confirmações, cancelamentos e remarcações vão por e-mail. Os demais
 *     templates (check-in, atendimento, falta, conclusão) seguem manuais.
 *   - Cada envio conta uma tentativa (`attempts`, migração 0031). Falha deixa a
 *     linha pendente até `MAX_EMAIL_ATTEMPTS`; na última vira `failed`. Não há
 *     reenvio automático em laço: um novo envio só acontece por ação explícita
 *     da equipe (`notification_retry_email`).
 *   - O destinatário nunca vai para log. `last_error` guarda só um código.
 *   - Teto por destinatário (`EMAIL_RECIPIENT_MAX_PER_HOUR` / `_PER_DAY`): o
 *     endereço do responsável é digitado num formulário público, então sem
 *     teto qualquer pessoa poderia usar a clínica para encher a caixa de
 *     terceiros (agendar, cancelar e remarcar em laço). Estourado o teto, o
 *     e-mail NÃO sai, a reserva e a mensagem seguem normais na caixa de saída
 *     (envio manual) com `last_error = 'rate_limited'`. O teto é gravado como
 *     hash HMAC do endereço normalizado: nenhum e-mail em claro é persistido.
 */
import {
  mailTransportConfigured,
  publicAppBaseUrl,
  sendTransactionalEmail,
  type MailTransportEnv,
} from "../auth/_mailTransport";

export const MAX_EMAIL_ATTEMPTS = 3;
/** Folgado para uma família legítima (vários filhos, remarcações) e curto para disparo em massa. */
export const EMAIL_RECIPIENT_MAX_PER_HOUR = 10;
export const EMAIL_RECIPIENT_MAX_PER_DAY = 30;
const QUOTA_HOUR_MS = 60 * 60 * 1000;
const QUOTA_DAY_MS = 24 * QUOTA_HOUR_MS;
/** Janela mínima entre tentativas: evita envio duplo por cliques/abas concorrentes. */
const RETRY_COOLDOWN_MS = 60_000;
export const PATIENT_TIMEZONE = "America/Sao_Paulo";

export const EMAIL_NOTIFICATION_TEMPLATES = new Set([
  "booking_requested",
  "booking_cancelled",
  "booking_rescheduled",
  "appointment_created",
  "appointment_confirmed",
  "appointment_rescheduled",
  "appointment_cancelled",
]);

const SUBJECTS: Record<string, string> = {
  booking_requested: "Solicitação de consulta recebida",
  booking_cancelled: "Reserva cancelada",
  booking_rescheduled: "Remarcação solicitada",
  appointment_created: "Consulta agendada",
  appointment_confirmed: "Consulta confirmada",
  appointment_rescheduled: "Consulta remarcada",
  appointment_cancelled: "Consulta cancelada",
};

export function emailDeliveryActive(env: MailTransportEnv): boolean {
  return mailTransportConfigured(env);
}

export function looksLikeEmail(value: string | null | undefined): value is string {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

// ── Teto por destinatário ─────────────────────────────────────────────────

/** Ambiente do envio: o transporte e a chave que dá o hash do destinatário. */
export type DeliveryEnv = MailTransportEnv & { OPERATIONAL_DATA_KEY?: string };

/**
 * Forma canônica só para CONTAR: caixa baixa, sem `+etiqueta` e, no Gmail, sem
 * pontos. Variações do mesmo endereço (`a+1@x`, `A@x`, `a.b@gmail.com`) caem na
 * mesma caixa de entrada e precisam dividir o mesmo teto. Não é usada para enviar.
 */
export function normalizeRecipientForQuota(email: string): string {
  const value = email.trim().toLowerCase();
  const at = value.lastIndexOf("@");
  if (at < 1) return value;
  let local = value.slice(0, at);
  let domain = value.slice(at + 1);
  const plus = local.indexOf("+");
  if (plus > 0) local = local.slice(0, plus);
  if (domain === "googlemail.com") domain = "gmail.com";
  if (domain === "gmail.com") local = local.replace(/\./g, "");
  return `${local}@${domain}`;
}

async function recipientQuotaHash(env: DeliveryEnv, email: string): Promise<string | null> {
  const secret = env.OPERATIONAL_DATA_KEY?.trim();
  if (!secret) return null;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`neuroped-email-recipient-quota-v1:${normalizeRecipientForQuota(email)}`),
  );
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function ensureRecipientQuotaSchema(db: D1Database): Promise<void> {
  await db.batch([
    db.prepare(
      `CREATE TABLE IF NOT EXISTS notification_email_quota (
        recipient_hash TEXT NOT NULL,
        sent_at TEXT NOT NULL
      )`,
    ),
    db.prepare(
      `CREATE INDEX IF NOT EXISTS idx_notification_email_quota_recipient
         ON notification_email_quota(recipient_hash, sent_at)`,
    ),
    db.prepare(
      `CREATE INDEX IF NOT EXISTS idx_notification_email_quota_sent
         ON notification_email_quota(sent_at)`,
    ),
  ]);
}

type RecipientQuota = "ok" | "limited" | "error";

/**
 * Reserva UM envio para o destinatário, de forma atômica: o INSERT só acontece se
 * as duas janelas (hora e dia) ainda têm folga, então pedidos concorrentes não
 * furam o teto. Conta tentativas de envio, não entregas: o provedor pode ter
 * entregado mesmo quando respondeu com erro.
 */
async function claimRecipientQuota(db: D1Database, env: DeliveryEnv, email: string, now: Date): Promise<RecipientQuota> {
  try {
    const hash = await recipientQuotaHash(env, email);
    if (!hash) return "error";
    await ensureRecipientQuotaSchema(db);
    const at = now.toISOString();
    const hourEdge = new Date(now.getTime() - QUOTA_HOUR_MS).toISOString();
    const dayEdge = new Date(now.getTime() - QUOTA_DAY_MS).toISOString();
    const claim = await db
      .prepare(
        `INSERT INTO notification_email_quota (recipient_hash, sent_at)
         SELECT ?, ?
          WHERE (SELECT COUNT(*) FROM notification_email_quota WHERE recipient_hash = ? AND sent_at > ?) < ?
            AND (SELECT COUNT(*) FROM notification_email_quota WHERE recipient_hash = ? AND sent_at > ?) < ?`,
      )
      .bind(
        hash, at,
        hash, hourEdge, EMAIL_RECIPIENT_MAX_PER_HOUR,
        hash, dayEdge, EMAIL_RECIPIENT_MAX_PER_DAY,
      )
      .run();
    if ((claim.meta?.changes ?? 0) !== 1) return "limited";
    // Retenção: nada além da janela de um dia fica guardado.
    await db.prepare(`DELETE FROM notification_email_quota WHERE sent_at < ?`).bind(dayEdge).run();
    return "ok";
  } catch (error) {
    console.error("[operations.notification-email.quota]", error instanceof Error ? error.name : "unknown");
    return "error";
  }
}

// ── Data e hora para a família ────────────────────────────────────────────

function wallClockParts(instant: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return { y: +map.year, mo: +map.month, d: +map.day, h: +map.hour, mi: +map.minute };
}

/**
 * Converte "YYYY-MM-DDTHH:MM" no fuso da agenda para o instante UTC. O horário
 * de parede é tratado como UTC, medido no fuso e corrigido pelo desvio (duas
 * passadas cobrem mudança de horário de verão).
 */
function localToInstant(local: string, timeZone: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local);
  if (!match) return null;
  const wall = Date.UTC(+match[1], +match[2] - 1, +match[3], +match[4], +match[5]);
  let guess = wall;
  try {
    for (let pass = 0; pass < 2; pass += 1) {
      const seen = wallClockParts(new Date(guess), timeZone);
      const seenMs = Date.UTC(seen.y, seen.mo - 1, seen.d, seen.h, seen.mi);
      guess += wall - seenMs;
    }
  } catch {
    return new Date(wall);
  }
  return new Date(guess);
}

/**
 * "sexta-feira, 03/10 às 14h00" em America/Sao_Paulo. Entrada inválida volta
 * como veio: melhor texto cru do que mensagem perdida.
 */
export function formatPatientDateTime(local: string, sourceTimeZone = PATIENT_TIMEZONE): string {
  const instant = localToInstant(local, sourceTimeZone || PATIENT_TIMEZONE);
  if (!instant) return local;
  const weekday = new Intl.DateTimeFormat("pt-BR", { timeZone: PATIENT_TIMEZONE, weekday: "long" }).format(instant);
  const p = wallClockParts(instant, PATIENT_TIMEZONE);
  const two = (value: number) => String(value).padStart(2, "0");
  return `${weekday}, ${two(p.d)}/${two(p.mo)} às ${two(p.h)}h${two(p.mi)}`;
}

// ── Texto da mensagem ─────────────────────────────────────────────────────

export interface NotificationContext {
  professionalName: string | null;
  clinicName: string | null;
  providerSlug: string | null;
  clinicSlug: string | null;
}

export async function loadNotificationContext(
  db: D1Database,
  providerUserId: string,
  clinicId: string | null,
): Promise<NotificationContext> {
  const context: NotificationContext = { professionalName: null, clinicName: null, providerSlug: null, clinicSlug: null };
  try {
    const profile = await db
      .prepare(`SELECT display_name, slug FROM booking_provider_profiles WHERE user_id = ? LIMIT 1`)
      .bind(providerUserId)
      .first<{ display_name: string | null; slug: string | null }>();
    context.professionalName = profile?.display_name?.trim() || null;
    context.providerSlug = profile?.slug ?? null;
    if (clinicId) {
      const clinic = await db
        .prepare(`SELECT name, slug FROM clinics WHERE id = ? LIMIT 1`)
        .bind(clinicId)
        .first<{ name: string | null; slug: string | null }>();
      context.clinicName = clinic?.name?.trim() || null;
      context.clinicSlug = clinic?.slug ?? null;
    }
  } catch (error) {
    console.error("[operations.notification-context]", error instanceof Error ? error.name : "unknown");
  }
  return context;
}

function withWhom(context: NotificationContext): string {
  const professional = context.professionalName;
  const clinic = context.clinicName;
  if (professional && clinic && clinic !== professional) return ` com ${professional} (${clinic})`;
  if (professional || clinic) return ` com ${professional ?? clinic}`;
  return "";
}

function clinicLabel(context: NotificationContext): string {
  return context.clinicName ?? context.professionalName ?? "A clínica";
}

/**
 * Link da página pública de agendamento, onde a família consulta, remarca ou
 * cancela com o código da reserva. O código NUNCA entra no link: o fluxo
 * público não tem link com token, e colocar o código num e-mail criaria um.
 */
export function publicManageUrl(env: MailTransportEnv, context: NotificationContext): string | null {
  const base = publicAppBaseUrl(env);
  if (!base || !context.providerSlug) return null;
  const clinic = context.clinicSlug ? `&clinic=${encodeURIComponent(context.clinicSlug)}` : "";
  return `${base}/#/agendar?provider=${encodeURIComponent(context.providerSlug)}${clinic}`;
}

export function buildPatientMessage(
  template: string,
  input: {
    startsAtLocal: string;
    previousStartsAtLocal?: string | null;
    timezone?: string | null;
    status?: string | null;
    context: NotificationContext;
    manageUrl?: string | null;
  },
): string {
  const when = formatPatientDateTime(input.startsAtLocal, input.timezone ?? PATIENT_TIMEZONE);
  const previous = input.previousStartsAtLocal
    ? formatPatientDateTime(input.previousStartsAtLocal, input.timezone ?? PATIENT_TIMEZONE)
    : null;
  const whom = withWhom(input.context);
  const clinic = clinicLabel(input.context);
  const manage = input.manageUrl
    ? `\n\nPara consultar, remarcar ou cancelar, acesse ${input.manageUrl} e informe o código da reserva.`
    : "";
  switch (template) {
    case "booking_requested":
      return `Recebemos sua solicitação de consulta${whom} para ${when}. A clínica ainda precisa confirmar o horário.${manage}`;
    case "booking_cancelled":
      return `Sua reserva${whom} de ${when} foi cancelada.${manage}`;
    case "booking_rescheduled":
      return `Sua remarcação${whom} para ${when} foi registrada. A clínica precisa reconfirmar o novo horário.${manage}`;
    case "appointment_created":
      return `${clinic} agendou uma consulta${input.context.professionalName ? ` com ${input.context.professionalName}` : ""} para ${when}.`;
    case "appointment_confirmed":
      return `Sua consulta${whom} de ${when} está confirmada.`;
    case "appointment_rescheduled":
      return `${clinic} remarcou a consulta${input.context.professionalName ? ` com ${input.context.professionalName}` : ""} de ${previous ?? "horário anterior"} para ${when}.`;
    case "appointment_cancelled":
      return `${clinic} cancelou a consulta${input.context.professionalName ? ` com ${input.context.professionalName}` : ""} de ${when}.`;
    default:
      return `Atualização da consulta${whom} de ${when}: status ${input.status ?? template}.`;
  }
}

export function patientEmailSubject(template: string, context: NotificationContext): string {
  const base = SUBJECTS[template] ?? "Atualização da consulta";
  const clinic = context.clinicName ?? context.professionalName;
  return clinic ? `${base} — ${clinic}` : base;
}

function emailBody(message: string, context: NotificationContext): string {
  const clinic = context.clinicName ?? context.professionalName ?? "sua clínica";
  return `${message}\n\n—\nMensagem automática enviada pela NeuroPed em nome de ${clinic}. Em caso de dúvida, fale diretamente com a clínica.`;
}

// ── Envio ─────────────────────────────────────────────────────────────────

export type EmailDispatchResult =
  | "sent"
  | "retry_pending"
  | "failed"
  | "not_configured"
  | "not_eligible"
  | "no_email"
  | "rate_limited"
  | "error";

interface OutboxDeliveryRow {
  status: string;
  template: string;
  attempts: number | null;
  last_attempt_at: string | null;
  last_error: string | null;
}

/**
 * Tenta entregar UMA linha da caixa de saída por e-mail. Nunca lança.
 * `email` é o endereço em claro já decifrado pelo chamador; nunca é logado.
 */
export async function dispatchNotificationEmail(
  db: D1Database,
  env: DeliveryEnv,
  input: { id: string; email: string | null | undefined; message: string; context: NotificationContext },
): Promise<EmailDispatchResult> {
  if (!mailTransportConfigured(env)) return "not_configured";
  try {
    const row = await db
      .prepare(`SELECT status, template, attempts, last_attempt_at, last_error FROM notification_outbox WHERE id = ? LIMIT 1`)
      .bind(input.id)
      .first<OutboxDeliveryRow>();
    if (!row || row.status !== "pending_provider" || !EMAIL_NOTIFICATION_TEMPLATES.has(row.template)) {
      return "not_eligible";
    }
    const attempts = Number(row.attempts ?? 0);
    if (attempts >= MAX_EMAIL_ATTEMPTS) return "not_eligible";
    if (!looksLikeEmail(input.email)) return "no_email";

    const now = new Date();
    const cooldownEdge = new Date(now.getTime() - RETRY_COOLDOWN_MS).toISOString();
    // Reserva a tentativa de forma otimista: só um chamador vence por rodada.
    const claim = await db
      .prepare(
        `UPDATE notification_outbox
            SET attempts = ?, last_attempt_at = ?, updated_at = ?
          WHERE id = ? AND status = 'pending_provider' AND COALESCE(attempts, 0) = ?
            AND (last_attempt_at IS NULL OR last_attempt_at < ?)`,
      )
      .bind(attempts + 1, now.toISOString(), now.toISOString(), input.id, attempts, cooldownEdge)
      .run();
    if ((claim.meta?.changes ?? 0) !== 1) return "not_eligible";

    // Teto por destinatário. Se não há folga, devolve a tentativa reservada acima
    // (o e-mail não saiu, então não conta contra MAX_EMAIL_ATTEMPTS nem ativa o
    // intervalo de 1 minuto) e deixa a mensagem na caixa de saída para envio manual.
    const quota = await claimRecipientQuota(db, env, input.email, now);
    if (quota !== "ok") {
      await db
        .prepare(
          `UPDATE notification_outbox
              SET attempts = ?, last_attempt_at = ?, last_error = ?, updated_at = ?
            WHERE id = ? AND status = 'pending_provider' AND COALESCE(attempts, 0) = ?`,
        )
        .bind(
          attempts,
          row.last_attempt_at,
          quota === "limited" ? "rate_limited" : row.last_error,
          new Date().toISOString(),
          input.id,
          attempts + 1,
        )
        .run();
      return quota === "limited" ? "rate_limited" : "error";
    }

    const delivered = await sendTransactionalEmail(env, {
      to: input.email.trim(),
      subject: patientEmailSubject(row.template, input.context),
      text: emailBody(input.message, input.context),
    });
    const finishedAt = new Date().toISOString();
    if (delivered) {
      await db
        .prepare(
          `UPDATE notification_outbox
              SET status = 'delivered', channel = 'email', last_error = NULL, updated_at = ?
            WHERE id = ? AND status = 'pending_provider'`,
        )
        .bind(finishedAt, input.id)
        .run();
      return "sent";
    }
    const exhausted = attempts + 1 >= MAX_EMAIL_ATTEMPTS;
    await db
      .prepare(
        `UPDATE notification_outbox
            SET status = ?, last_error = 'provider_error', updated_at = ?
          WHERE id = ? AND status = 'pending_provider'`,
      )
      .bind(exhausted ? "failed" : "pending_provider", finishedAt, input.id)
      .run();
    return exhausted ? "failed" : "retry_pending";
  } catch (error) {
    // Ex.: migração 0031 ainda não aplicada. A linha permanece manual/pendente.
    console.error("[operations.notification-email]", error instanceof Error ? error.name : "unknown");
    return "error";
  }
}
