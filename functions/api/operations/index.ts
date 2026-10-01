import { getContextUser } from "../auth/_authorization";
import {
  appointmentToApi,
  assertLocalDateTime,
  cleanOptionalText,
  cleanText,
  decryptText,
  encryptText,
  enqueueNotification,
  ensureOperationsSchema,
  ensureProviderProfile,
  errorResponse,
  getService,
  jsonResponse,
  parseModality,
  parsePaymentStatus,
  parseStatus,
  profileToApi,
  randomAccessToken,
  releaseSlotLocksAfterSuccessfulMutationStatement,
  serviceToApi,
  sha256,
  slotLockStatements,
  slotLockStatementsForAppointmentState,
  slugify,
  validSlug,
  type AppointmentRow,
  type OperationsEnv,
  type ServiceRow,
} from "./_core";
import {
  EMAIL_NOTIFICATION_TEMPLATES,
  MAX_EMAIL_ATTEMPTS,
  buildPatientMessage,
  dispatchNotificationEmail,
  emailDeliveryActive,
  loadNotificationContext,
} from "./_notificationDelivery";
import {
  ensureOperationsHardeningSchema,
  linkOperationsOperator,
  listOperationsAudit,
  listOperationsStaff,
  logOperationsAudit,
  setOperationsStaffActive,
  type OperationsPrincipal,
  type OperationsProviderChoice,
} from "./_access";
import { resolveOperationsContext, type OperationsContextFailure } from "./_context";
import {
  addMinutesLocal,
  isValidLocalDate,
  isValidTimeZone,
  type AppointmentStatus,
} from "../../../shared/operations";
import { readJsonBody as readBody, nowInProviderTimezone as localNow } from "./_core";

function canConfigure(role: string): boolean {
  return role === "admin" || role === "professional";
}

function canOperate(role: string): boolean {
  return canConfigure(role) || role === "operator";
}

function moneyCents(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100000000) return null;
  return Math.round(parsed);
}

function integerBetween(value: unknown, min: number, max: number): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) return null;
  return parsed;
}

function addDaysLocalMinute(value: string, days: number): string {
  const [datePart, timePart] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days, hour, minute));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}T${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")}`;
}

async function patientBelongsToClinic(
  db: D1Database,
  patientId: string,
  clinicId: string,
): Promise<boolean> {
  const row = await db
    .prepare(
      `SELECT id
         FROM live_patients
        WHERE id = ? AND clinic_id = ? AND status <> 'merged'
        LIMIT 1`,
    )
    .bind(patientId, clinicId)
    .first<{ id: string }>();
  return Boolean(row?.id);
}

async function getDashboard(
  db: D1Database,
  env: OperationsEnv,
  provider: { id: string; name: string },
  principal: OperationsPrincipal,
  clinicId: string,
  availableProviders: OperationsProviderChoice[] = [],
) {
  const profile = await ensureProviderProfile(db, provider);
  const nowMinute = localNow(profile.timezone);
  const today = nowMinute.slice(0, 10);
  const next30 = addDaysLocalMinute(nowMinute, 30);
  const prior30 = addDaysLocalMinute(nowMinute, -30);

  const servicesResult = await db
    .prepare(`SELECT * FROM booking_services WHERE provider_user_id = ? AND clinic_id = ? ORDER BY active DESC, name`)
    .bind(provider.id, clinicId)
    .all<ServiceRow>();
  const rulesResult = await db
    .prepare(`SELECT * FROM booking_availability_rules WHERE provider_user_id = ? AND clinic_id = ? ORDER BY weekday, start_minute`)
    .bind(provider.id, clinicId)
    .all<any>();
  const blocksResult = await db
    .prepare(`SELECT * FROM booking_blocks WHERE provider_user_id = ? AND clinic_id = ? ORDER BY starts_at_local DESC LIMIT 100`)
    .bind(provider.id, clinicId)
    .all<any>();
  const appointmentsResult = await db
    .prepare(
      `SELECT a.*, s.name AS service_name, s.modality AS service_modality
         FROM appointments a
         JOIN booking_services s ON s.id = a.service_id
        WHERE a.provider_user_id = ? AND a.clinic_id = ?
        ORDER BY
          CASE
            WHEN a.starts_at_local >= ?
             AND a.status IN ('requested','confirmed','checked_in','in_care')
            THEN 0 ELSE 1
          END ASC,
          CASE
            WHEN a.starts_at_local >= ?
             AND a.status IN ('requested','confirmed','checked_in','in_care')
            THEN a.starts_at_local
          END ASC,
          a.starts_at_local DESC
        LIMIT 250`,
    )
    .bind(provider.id, clinicId, nowMinute, nowMinute)
    .all<AppointmentRow>();
  const waitlistResult = await db
    .prepare(
      `SELECT w.*, s.name AS service_name
         FROM waitlist_entries w
         JOIN booking_services s ON s.id = w.service_id
        WHERE w.provider_user_id = ? AND w.clinic_id = ?
        ORDER BY CASE w.status WHEN 'waiting' THEN 0 WHEN 'offered' THEN 1 ELSE 2 END, w.created_at DESC
        LIMIT 150`,
    )
    .bind(provider.id, clinicId)
    .all<any>();
  const reviewsResult = await db
    .prepare(`SELECT * FROM appointment_reviews WHERE provider_user_id = ? AND clinic_id = ? ORDER BY created_at DESC LIMIT 100`)
    .bind(provider.id, clinicId)
    .all<any>();
  const notificationsResult = await db
    .prepare(
      `SELECT n.*, (a.guardian_email_encrypted IS NOT NULL) AS has_guardian_email
         FROM notification_outbox n
         LEFT JOIN appointments a ON a.id = n.appointment_id
        WHERE n.provider_user_id = ? AND n.clinic_id = ?
        ORDER BY n.created_at DESC
        LIMIT 120`,
    )
    .bind(provider.id, clinicId)
    .all<any>();

  const fullServices = (servicesResult.results ?? []).map(serviceToApi);
  const services = principal.canConfigure
    ? fullServices
    : fullServices.map((item) => ({ ...item, priceCents: null }));
  const fullAppointments = await Promise.all(
    (appointmentsResult.results ?? []).map((row) => appointmentToApi(env, row)),
  );
  const appointments = principal.canConfigure
    ? fullAppointments
    : fullAppointments.map((item) => ({
        ...item,
        amountCents: null,
        paymentStatus: "pending" as const,
        paymentMethod: null,
      }));
  const waitlist = await Promise.all(
    (waitlistResult.results ?? []).map(async (row) => ({
      id: row.id,
      providerUserId: row.provider_user_id,
      serviceId: row.service_id,
      preferredDate: row.preferred_date,
      status: row.status,
      guardianName: await decryptText(env, row.guardian_name_encrypted, "guardian_name"),
      guardianEmail: await decryptText(env, row.guardian_email_encrypted, "guardian_email"),
      guardianPhone: await decryptText(env, row.guardian_phone_encrypted, "guardian_phone"),
      patientName: await decryptText(env, row.patient_name_encrypted, "patient_name"),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      serviceName: row.service_name,
    })),
  );
  const fullReviews = await Promise.all(
    (reviewsResult.results ?? []).map(async (row) => ({
      id: row.id,
      appointmentId: row.appointment_id,
      providerUserId: row.provider_user_id,
      rating: row.rating,
      comment: await decryptText(env, row.comment_encrypted, "comment"),
      approved: Boolean(row.approved),
      createdAt: row.created_at,
    })),
  );
  const notifications = await Promise.all(
    (notificationsResult.results ?? []).map(async (row) => ({
      id: row.id,
      appointmentId: row.appointment_id,
      providerUserId: row.provider_user_id,
      channel: row.channel,
      template: row.template,
      recipient: await decryptText(env, row.recipient_encrypted, "recipient"),
      message: (await decryptText(env, row.payload_encrypted, "payload")) ?? "",
      status: row.status,
      // Colunas da 0031; ausentes (migração pendente) viram 0/null.
      attempts: Number(row.attempts ?? 0),
      lastError: row.last_error ?? null,
      lastAttemptAt: row.last_attempt_at ?? null,
      emailEligible: EMAIL_NOTIFICATION_TEMPLATES.has(String(row.template)) && Boolean(row.has_guardian_email),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
  );

  const [appointmentMetrics, waitlistMetrics, reviewMetrics, notificationMetrics] = await Promise.all([
    db.prepare(
      `SELECT
         COALESCE(SUM(CASE WHEN substr(starts_at_local, 1, 10) = ? AND status NOT IN ('cancelled','no_show') THEN 1 ELSE 0 END), 0) AS today_count,
         COALESCE(SUM(CASE WHEN starts_at_local >= ? AND status IN ('requested','confirmed','checked_in','in_care') THEN 1 ELSE 0 END), 0) AS upcoming_count,
         COALESCE(SUM(CASE WHEN status = 'requested' THEN 1 ELSE 0 END), 0) AS requested_count,
         COALESCE(SUM(CASE WHEN status = 'no_show' AND starts_at_local >= ? AND starts_at_local <= ? THEN 1 ELSE 0 END), 0) AS no_show_30d,
         COALESCE(SUM(CASE WHEN starts_at_local >= ? AND starts_at_local <= ? AND status NOT IN ('cancelled','no_show') THEN COALESCE(amount_cents, 0) ELSE 0 END), 0) AS expected_cents,
         COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN COALESCE(amount_cents, 0) ELSE 0 END), 0) AS paid_cents
       FROM appointments
      WHERE provider_user_id = ? AND clinic_id = ?`,
    ).bind(today, nowMinute, prior30, nowMinute, nowMinute, next30, provider.id, clinicId).first<{
      today_count: number; upcoming_count: number; requested_count: number; no_show_30d: number;
      expected_cents: number; paid_cents: number;
    }>(),
    db.prepare(
      `SELECT COUNT(*) AS count FROM waitlist_entries WHERE provider_user_id = ? AND clinic_id = ? AND status = 'waiting'`,
    ).bind(provider.id, clinicId).first<{ count: number }>(),
    db.prepare(
      `SELECT COUNT(*) AS count FROM appointment_reviews WHERE provider_user_id = ? AND clinic_id = ? AND approved = 0`,
    ).bind(provider.id, clinicId).first<{ count: number }>(),
    db.prepare(
      `SELECT COUNT(*) AS count FROM notification_outbox WHERE provider_user_id = ? AND clinic_id = ? AND status = 'pending_provider'`,
    ).bind(provider.id, clinicId).first<{ count: number }>(),
  ]);

  const metrics = {
    today: appointmentMetrics?.today_count ?? 0,
    upcoming: appointmentMetrics?.upcoming_count ?? 0,
    requested: appointmentMetrics?.requested_count ?? 0,
    waitlist: waitlistMetrics?.count ?? 0,
    pendingReviews: principal.canConfigure ? (reviewMetrics?.count ?? 0) : 0,
    pendingNotifications: notificationMetrics?.count ?? 0,
    expectedCents: principal.canConfigure ? (appointmentMetrics?.expected_cents ?? 0) : 0,
    paidCents: principal.canConfigure ? (appointmentMetrics?.paid_cents ?? 0) : 0,
    noShow30d: appointmentMetrics?.no_show_30d ?? 0,
  };

  return {
    profile: profileToApi(profile),
    services,
    rules: (rulesResult.results ?? []).map((row) => ({
      id: row.id,
      providerUserId: row.provider_user_id,
      weekday: row.weekday,
      startMinute: row.start_minute,
      endMinute: row.end_minute,
      slotMinutes: row.slot_minutes,
      active: Boolean(row.active),
      createdAt: row.created_at,
    })),
    blocks: (blocksResult.results ?? []).map((row) => ({
      id: row.id,
      providerUserId: row.provider_user_id,
      startsAtLocal: row.starts_at_local,
      endsAtLocal: row.ends_at_local,
      reason: row.reason,
      createdAt: row.created_at,
    })),
    appointments,
    waitlist,
    reviews: principal.canConfigure ? fullReviews : [],
    notifications,
    emailDelivery: { active: emailDeliveryActive(env), maxAttempts: MAX_EMAIL_ATTEMPTS },
    metrics,
    // `availableProviders`: só a recepção escolhe de qual profissional opera; o
    // profissional não recebe a chave (payload inalterado).
    access: { ...principal, clinicId, ...(principal.delegated ? { availableProviders } : {}) },
    staff: principal.canConfigure ? await listOperationsStaff(db, provider.id) : [],
    audit: await listOperationsAudit(db, provider.id, clinicId, 40),
  };
}

async function preparePrincipal(context: Parameters<PagesFunction<OperationsEnv>>[0]) {
  const user = getContextUser(context);
  if (!user || !canOperate(user.role) || !context.env.DB) return null;
  await ensureOperationsSchema(context.env.DB);
  await ensureOperationsHardeningSchema(context.env.DB);
  // A recepção/operator é delegada ao profissional e não ganha escopo clínico só
  // para operar a agenda. A fronteira tenant da agenda, portanto, é a clínica do
  // provider responsável — nunca uma elevação clínica da secretária. Ela precisa,
  // porém, ser membro `assistant` ATIVO dessa clínica a cada requisição.
  // Com mais de um profissional, o escolhido (`?provider=`) é só um alvo
  // solicitado, validado em `resolveOperationsContext` (mesma fonte do middleware).
  const resolved = await resolveOperationsContext(context.env.DB, user, context.request);
  if (!resolved.ok) return { ok: false as const, failure: resolved as OperationsContextFailure };
  return {
    ok: true as const,
    authUser: user,
    principal: resolved.principal,
    clinicId: resolved.clinicId,
    availableProviders: resolved.availableProviders,
    provider: { id: resolved.principal.providerUserId, name: resolved.principal.providerName },
  };
}

/** 409 com a lista, 403 indisponível; o resto mantém as respostas históricas. */
function deniedResponse(
  user: { role: string } | null | undefined,
  failure?: OperationsContextFailure,
): Response {
  if (failure?.code === "PROVIDER_SELECTION_REQUIRED") {
    return jsonResponse({ error: failure.error, code: failure.code, providers: failure.providers }, 409);
  }
  if (failure?.code === "PROVIDER_NOT_AVAILABLE") {
    return errorResponse(failure.error, failure.code, 403);
  }
  return errorResponse(
    user?.role === "operator"
      ? "Recepção ainda não vinculada a um profissional."
      : "Acesso não autorizado.",
    user?.role === "operator" ? "STAFF_LINK_REQUIRED" : "FORBIDDEN",
    403,
  );
}

export const onRequestGet: PagesFunction<OperationsEnv> = async (context) => {
  const { env } = context;
  if (!env.DB) return errorResponse("Agenda exige banco persistente.", "DB_REQUIRED", 503);

  try {
    const prepared = await preparePrincipal(context);
    if (!prepared || !prepared.ok) {
      return deniedResponse(getContextUser(context), prepared?.failure);
    }
    return jsonResponse(
      await getDashboard(env.DB, env, prepared.provider, prepared.principal, prepared.clinicId, prepared.availableProviders),
    );
  } catch (error) {
    console.error("[operations.GET]", error);
    return errorResponse("Não foi possível carregar a gestão operacional.", "OPERATIONS_LOAD_FAILED", 500);
  }
};

export const onRequestPost: PagesFunction<OperationsEnv> = async (context) => {
  const { env, request } = context;
  if (!env.DB) return errorResponse("Agenda exige banco persistente.", "DB_REQUIRED", 503);
  const body = await readBody(request);
  if (!body) return errorResponse("JSON inválido.", "INVALID_JSON", 400);
  const action = cleanText(body.action, 60);

  try {
    const prepared = await preparePrincipal(context);
    if (!prepared || !prepared.ok) {
      return deniedResponse(getContextUser(context), prepared?.failure);
    }
    const { authUser, principal, provider, clinicId, availableProviders } = prepared;
    const user = { ...authUser, id: provider.id, name: provider.name };
    const profile = await ensureProviderProfile(env.DB, provider);
    const now = new Date().toISOString();
    let auditTargetType = "operations";
    let auditTargetId: string | null = null;
    let auditMetadata: Record<string, unknown> | undefined;

    const configureActions = [
      "upsert_profile",
      "create_service",
      "update_service",
      "create_rule",
      "delete_rule",
      "create_block",
      "delete_block",
      "create_day_block",
      "review_moderate",
      "staff_link",
      "staff_active",
      "appointment_link_patient",
    ];
    if (configureActions.includes(action) && !principal.canConfigure) {
      return errorResponse("Ação restrita ao profissional responsável.", "FORBIDDEN", 403);
    }

    if (action === "staff_link") {
      const email = cleanText(body.email, 180).toLowerCase();
      if (!email.includes("@")) return errorResponse("E-mail da recepção inválido.", "VALIDATION_ERROR", 400);
      const result = await linkOperationsOperator(env.DB, principal, email, clinicId);
      if (!result.ok) {
        if (result.code === "SELF_LINK_INVALID") {
          return errorResponse(
            "O profissional não pode vincular a si próprio como recepção.",
            "SELF_LINK_INVALID",
            409,
          );
        }
        if (result.code === "FORBIDDEN") {
          return errorResponse("Ação não autorizada.", "FORBIDDEN", 403);
        }
        // AUTHZ-P1-06 (ciclo 4, 2026-09-26 —
        // docs/audits/SAAS_TENANCY_AUDIT_2026-09-26.md): e-mail inexistente,
        // conta sem papel operator ativo e conta já vinculada a outro
        // profissional respondiam com código/status distintos — um oráculo
        // de enumeração de contas alheias na plataforma. Responderam todas
        // exatamente igual — e conta sem membership `assistant` ativa
        // nesta clínica (STAFF_NOT_CLINIC_MEMBER) também. Desde a 0032 (issue
        // #1064) uma recepção pode atender vários profissionais, então "já
        // vinculada a outro" deixou de ser erro: o vínculo é criado sem revelar
        // nada sobre os demais. Os três erros restantes seguem indistinguíveis.
        return errorResponse(
          "Este e-mail não corresponde a um usuário de recepção disponível para vínculo.",
          "STAFF_NOT_AVAILABLE",
          404,
        );
      }
      auditTargetType = "staff_link";
      auditTargetId = result.staffUserId;
      auditMetadata = { staffUserId: result.staffUserId };
    } else if (action === "staff_active") {
      const staffUserId = cleanText(body.staffUserId, 100);
      const active = body.active === true;
      if (!staffUserId) return errorResponse("Usuário da recepção inválido.", "VALIDATION_ERROR", 400);
      if (!(await setOperationsStaffActive(env.DB, principal, staffUserId, active))) {
        return errorResponse("Vínculo da recepção não encontrado.", "NOT_FOUND", 404);
      }
      auditTargetType = "staff_link";
      auditTargetId = staffUserId;
      auditMetadata = { staffUserId, status: active ? "active" : "inactive" };
    } else if (action === "upsert_profile") {
      const displayName = cleanText(body.displayName, 120);
      const specialty = cleanText(body.specialty, 120);
      const locationLabel = cleanOptionalText(body.locationLabel, 180);
      const timezone = cleanText(body.timezone, 80) || "America/Recife";
      const requestedSlug = cleanText(body.slug, 50) || slugify(displayName || user.name);
      if (!isValidTimeZone(timezone)) return errorResponse("Fuso horário inválido.", "VALIDATION_ERROR", 400);
      if (!displayName || !specialty || !validSlug(requestedSlug)) return errorResponse("Perfil público inválido.", "VALIDATION_ERROR", 400);
      const bookingEnabled = body.bookingEnabled === true ? 1 : 0;
      try {
        const update = await env.DB.prepare(
          `UPDATE booking_provider_profiles
              SET slug = ?, display_name = ?, specialty = ?, location_label = ?, timezone = ?, booking_enabled = ?, updated_at = ?
            WHERE user_id = ?`,
        ).bind(requestedSlug, displayName, specialty, locationLabel, timezone, bookingEnabled, now, user.id).run();
        if ((update.meta?.changes ?? 0) !== 1) {
          return errorResponse("Perfil público não encontrado.", "NOT_FOUND", 404);
        }
      } catch (error) {
        if (String(error).toLowerCase().includes("unique")) return errorResponse("Este endereço público já está em uso.", "SLUG_CONFLICT", 409);
        throw error;
      }
      auditTargetType = "provider_profile";
      auditTargetId = user.id;
      auditMetadata = { bookingEnabled: Boolean(bookingEnabled) };
    } else if (action === "create_service") {
      const name = cleanText(body.name, 100);
      const duration = integerBetween(body.durationMinutes, 10, 480);
      const modality = parseModality(body.modality) ?? "in_person";
      if (!name || duration === null) return errorResponse("Serviço inválido.", "VALIDATION_ERROR", 400);
      const id = `svc-${crypto.randomUUID()}`;
      await env.DB.prepare(
        `INSERT INTO booking_services
          (id, provider_user_id, clinic_id, name, duration_minutes, price_cents, modality, active, public_visible, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, ?, ?)`,
      ).bind(id, user.id, clinicId, name, duration, moneyCents(body.priceCents), modality, now, now).run();
      auditTargetType = "service";
      auditTargetId = id;
      auditMetadata = { modality };
    } else if (action === "update_service") {
      const id = cleanText(body.id, 80);
      const existing = await getService(env.DB, user.id, id, false, clinicId);
      if (!existing) return errorResponse("Serviço não encontrado.", "NOT_FOUND", 404);
      const name = cleanText(body.name, 100) || existing.name;
      const duration = integerBetween(body.durationMinutes, 10, 480) ?? existing.duration_minutes;
      const modality = parseModality(body.modality) ?? existing.modality;
      const priceCents = body.priceCents === undefined ? existing.price_cents : moneyCents(body.priceCents);
      const active = body.active === undefined ? existing.active : body.active === true ? 1 : 0;
      const publicVisible = body.publicVisible === undefined ? existing.public_visible : body.publicVisible === true ? 1 : 0;
      const update = await env.DB.prepare(
        `UPDATE booking_services
            SET name = ?, duration_minutes = ?, price_cents = ?, modality = ?, active = ?, public_visible = ?, updated_at = ?
          WHERE id = ? AND provider_user_id = ? AND clinic_id = ?`,
      ).bind(name, duration, priceCents, modality, active, publicVisible, now, id, user.id, clinicId).run();
      if ((update.meta?.changes ?? 0) !== 1) return errorResponse("Serviço não encontrado.", "NOT_FOUND", 404);
      auditTargetType = "service";
      auditTargetId = id;
      auditMetadata = { modality, status: active ? "active" : "inactive" };
    } else if (action === "create_rule") {
      const weekday = integerBetween(body.weekday, 0, 6);
      const startMinute = integerBetween(body.startMinute, 0, 1439);
      const endMinute = integerBetween(body.endMinute, 1, 1440);
      const slotMinutes = integerBetween(body.slotMinutes, 5, 240);
      if (weekday === null || startMinute === null || endMinute === null || slotMinutes === null || endMinute <= startMinute) return errorResponse("Regra de disponibilidade inválida.", "VALIDATION_ERROR", 400);
      const id = `rule-${crypto.randomUUID()}`;
      await env.DB.prepare(
        `INSERT INTO booking_availability_rules
          (id, provider_user_id, clinic_id, weekday, start_minute, end_minute, slot_minutes, active, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      ).bind(id, user.id, clinicId, weekday, startMinute, endMinute, slotMinutes, now).run();
      auditTargetType = "availability_rule";
      auditTargetId = id;
    } else if (action === "delete_rule") {
      const id = cleanText(body.id, 80);
      if (!id) return errorResponse("Regra inválida.", "VALIDATION_ERROR", 400);
      const result = await env.DB.prepare(`DELETE FROM booking_availability_rules WHERE id = ? AND provider_user_id = ? AND clinic_id = ?`).bind(id, user.id, clinicId).run();
      if ((result.meta?.changes ?? 0) !== 1) return errorResponse("Regra não encontrada.", "NOT_FOUND", 404);
      auditTargetType = "availability_rule";
      auditTargetId = id;
      auditMetadata = { status: "deleted" };
    } else if (action === "create_block") {
      const starts = assertLocalDateTime(body.startsAtLocal);
      const ends = assertLocalDateTime(body.endsAtLocal);
      if (!starts || !ends || ends <= starts) return errorResponse("Bloqueio inválido.", "VALIDATION_ERROR", 400);
      const id = `blk-${crypto.randomUUID()}`;
      await env.DB.prepare(
        `INSERT INTO booking_blocks (id, provider_user_id, clinic_id, starts_at_local, ends_at_local, reason, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ).bind(id, user.id, clinicId, starts, ends, cleanOptionalText(body.reason, 160), now).run();
      auditTargetType = "availability_block";
      auditTargetId = id;
    } else if (action === "create_day_block") {
      // Bloqueio de dia inteiro (ex.: feriado) reaproveita booking_blocks: a
      // mesma tabela, os mesmos triggers de conflito com consultas ativas e o
      // mesmo cálculo de vagas públicas. Só muda a forma de entrada: uma data
      // e um rótulo obrigatório, cobrindo 00:00 até 00:00 do dia seguinte.
      const date = cleanText(body.date, 10);
      const reason = cleanText(body.reason, 160);
      if (!isValidLocalDate(date)) return errorResponse("Data do bloqueio inválida.", "VALIDATION_ERROR", 400);
      if (!reason) return errorResponse("Informe um rótulo para o bloqueio (ex.: Feriado).", "VALIDATION_ERROR", 400);
      const starts = `${date}T00:00`;
      const ends = addMinutesLocal(starts, 24 * 60);
      const id = `blk-${crypto.randomUUID()}`;
      await env.DB.prepare(
        `INSERT INTO booking_blocks (id, provider_user_id, clinic_id, starts_at_local, ends_at_local, reason, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ).bind(id, user.id, clinicId, starts, ends, reason, now).run();
      auditTargetType = "availability_block";
      auditTargetId = id;
      auditMetadata = { status: "full_day" };
    } else if (action === "delete_block") {
      const id = cleanText(body.id, 80);
      if (!id) return errorResponse("Bloqueio inválido.", "VALIDATION_ERROR", 400);
      const result = await env.DB.prepare(`DELETE FROM booking_blocks WHERE id = ? AND provider_user_id = ? AND clinic_id = ?`).bind(id, user.id, clinicId).run();
      if ((result.meta?.changes ?? 0) !== 1) return errorResponse("Bloqueio não encontrado.", "NOT_FOUND", 404);
      auditTargetType = "availability_block";
      auditTargetId = id;
      auditMetadata = { status: "deleted" };
    } else if (action === "create_appointment") {
      const serviceId = cleanText(body.serviceId, 80);
      const service = await getService(env.DB, user.id, serviceId, false, clinicId);
      const starts = assertLocalDateTime(body.startsAtLocal);
      if (!service || !starts) return errorResponse("Agendamento inválido.", "VALIDATION_ERROR", 400);
      const token = randomAccessToken();
      const ends = new Date(`${starts}:00Z`);
      ends.setUTCMinutes(ends.getUTCMinutes() + service.duration_minutes);
      const endsAtLocal = ends.toISOString().slice(0, 16);
      const appointmentId = `apt-${crypto.randomUUID()}`;
      const patientId = principal.delegated ? null : cleanOptionalText(body.patientId, 100);
      if (patientId && !(await patientBelongsToClinic(env.DB, patientId, clinicId))) {
        return errorResponse("Paciente não encontrado ou sem vínculo com este profissional.", "PATIENT_NOT_FOUND", 404);
      }
      const insertAppointment = env.DB.prepare(
        `INSERT INTO appointments
          (id, provider_user_id, clinic_id, service_id, patient_id, starts_at_local, ends_at_local, timezone,
           status, source, booking_token_hash, guardian_name_encrypted, guardian_email_encrypted,
           guardian_phone_encrypted, patient_name_encrypted, amount_cents, payment_status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', 'professional', ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
      ).bind(
        appointmentId, user.id, clinicId, service.id, patientId, starts, endsAtLocal,
        profile.timezone, await sha256(token), await encryptText(env, cleanOptionalText(body.guardianName, 120), "guardian_name"),
        await encryptText(env, cleanOptionalText(body.guardianEmail, 180), "guardian_email"), await encryptText(env, cleanOptionalText(body.guardianPhone, 40), "guardian_phone"),
        await encryptText(env, cleanOptionalText(body.patientName, 120), "patient_name"), service.price_cents, now, now,
      );
      await env.DB.batch([insertAppointment, ...slotLockStatements(env.DB, user.id, appointmentId, starts, endsAtLocal)]);
      // Mesma fila dos fluxos públicos: sem provedor externo a mensagem fica
      // `pending_provider` na caixa de saída para envio manual.
      const createdContext = await loadNotificationContext(env.DB, user.id, clinicId);
      await enqueueNotification(env.DB, env, {
        appointmentId,
        providerUserId: user.id,
        clinicId,
        template: "appointment_created",
        recipient: cleanOptionalText(body.guardianPhone, 40) || cleanOptionalText(body.guardianEmail, 180),
        email: cleanOptionalText(body.guardianEmail, 180),
        context: createdContext,
        message: buildPatientMessage("appointment_created", {
          startsAtLocal: starts,
          timezone: profile.timezone,
          context: createdContext,
        }),
      });
      auditTargetType = "appointment";
      auditTargetId = appointmentId;
      auditMetadata = { source: principal.delegated ? "operator" : "professional", serviceId };
    } else if (action === "appointment_reschedule") {
      // Remarcação pela equipe (profissional ou recepção vinculada). Mesma
      // disciplina do `reschedule` público: UPDATE condicional ao estado lido
      // (controle otimista), liberação dos locks só se o UPDATE venceu e novos
      // locks só para o estado resultante — tudo no mesmo batch atômico, com
      // os triggers de bloqueio/conflito como última barreira. Como em
      // `create_appointment`, a equipe não fica restrita às regras públicas de
      // disponibilidade; só a conflitos reais (consulta ou bloqueio).
      const id = cleanText(body.id, 80);
      const starts = assertLocalDateTime(body.startsAtLocal);
      if (!id || !starts) return errorResponse("Remarcação inválida.", "VALIDATION_ERROR", 400);
      const current = await env.DB.prepare(
        `SELECT * FROM appointments WHERE id = ? AND provider_user_id = ? AND clinic_id = ? LIMIT 1`,
      ).bind(id, user.id, clinicId).first<AppointmentRow>();
      if (!current) return errorResponse("Consulta não encontrada.", "NOT_FOUND", 404);
      if (!["requested", "confirmed"].includes(current.status)) {
        return errorResponse("Somente consultas solicitadas ou confirmadas podem ser remarcadas.", "INVALID_TRANSITION", 409);
      }
      if (starts <= localNow(profile.timezone)) {
        return errorResponse("O novo horário precisa estar no futuro.", "VALIDATION_ERROR", 400);
      }
      if (starts === current.starts_at_local) {
        return errorResponse("O novo horário é igual ao atual.", "VALIDATION_ERROR", 400);
      }
      const service = await getService(env.DB, user.id, current.service_id, false, clinicId);
      if (!service) return errorResponse("Serviço da consulta não encontrado.", "NOT_FOUND", 404);
      const endsAtLocal = addMinutesLocal(starts, service.duration_minutes);
      const rescheduleResults = await env.DB.batch([
        env.DB.prepare(
          `UPDATE appointments
              SET starts_at_local = ?, ends_at_local = ?, updated_at = ?
            WHERE id = ? AND provider_user_id = ? AND clinic_id = ? AND status = ?
              AND starts_at_local = ? AND ends_at_local = ?`,
        ).bind(
          starts,
          endsAtLocal,
          now,
          id,
          user.id,
          clinicId,
          current.status,
          current.starts_at_local,
          current.ends_at_local,
        ),
        releaseSlotLocksAfterSuccessfulMutationStatement(env.DB, id),
        ...slotLockStatementsForAppointmentState(env.DB, user.id, id, starts, endsAtLocal, current.status),
      ]);
      if ((rescheduleResults[0]?.meta?.changes ?? 0) !== 1) {
        return errorResponse("A consulta mudou durante a remarcação. Recarregue a agenda.", "STALE_APPOINTMENT", 409);
      }
      const movedEmail = await decryptText(env, current.guardian_email_encrypted, "guardian_email");
      const movedContext = await loadNotificationContext(env.DB, user.id, clinicId);
      await enqueueNotification(env.DB, env, {
        appointmentId: id,
        providerUserId: user.id,
        clinicId,
        template: "appointment_rescheduled",
        recipient: await decryptText(env, current.guardian_phone_encrypted, "guardian_phone") || movedEmail,
        email: movedEmail,
        context: movedContext,
        message: buildPatientMessage("appointment_rescheduled", {
          startsAtLocal: starts,
          previousStartsAtLocal: current.starts_at_local,
          timezone: current.timezone,
          context: movedContext,
        }),
      });
      auditTargetType = "appointment";
      auditTargetId = id;
      // safeAuditMetadata (_access.ts) só aceita chaves da allowlist.
      auditMetadata = { status: "rescheduled", source: principal.delegated ? "operator" : "professional" };
    } else if (action === "appointment_link_patient") {
      const id = cleanText(body.id, 80);
      const patientId = cleanText(body.patientId, 120);
      if (!id || !patientId) {
        return errorResponse("Consulta e paciente são obrigatórios.", "VALIDATION_ERROR", 400);
      }
      if (!(await patientBelongsToClinic(env.DB, patientId, clinicId))) {
        return errorResponse("Paciente LIVE não encontrado nesta clínica.", "PATIENT_NOT_FOUND", 404);
      }
      const result = await env.DB.prepare(
        `UPDATE appointments
            SET patient_id = ?, updated_at = ?
          WHERE id = ? AND provider_user_id = ? AND clinic_id = ?`,
      ).bind(patientId, now, id, user.id, clinicId).run();
      if ((result.meta?.changes ?? 0) !== 1) {
        return errorResponse("Consulta não encontrada.", "NOT_FOUND", 404);
      }
      auditTargetType = "appointment";
      auditTargetId = id;
      auditMetadata = { status: "patient_linked" };
    } else if (action === "appointment_status") {
      const id = cleanText(body.id, 80);
      const status = parseStatus(body.status);
      if (!id || !status) return errorResponse("Status inválido.", "VALIDATION_ERROR", 400);
      const current = await env.DB.prepare(`SELECT * FROM appointments WHERE id = ? AND provider_user_id = ? AND clinic_id = ? LIMIT 1`).bind(id, user.id, clinicId).first<AppointmentRow>();
      if (!current) return errorResponse("Consulta não encontrada.", "NOT_FOUND", 404);
      const allowed: Record<AppointmentStatus, AppointmentStatus[]> = {
        requested: ["confirmed", "cancelled", "no_show"],
        confirmed: ["checked_in", "cancelled", "no_show"],
        checked_in: ["in_care", "cancelled"],
        in_care: ["completed"],
        completed: [], cancelled: [], no_show: [],
      };
      if (!allowed[current.status].includes(status)) return errorResponse("Transição de status não permitida.", "INVALID_TRANSITION", 409);
      const checkedInAt = status === "checked_in" ? now : current.checked_in_at;
      const completedAt = status === "completed" ? now : current.completed_at;
      const cancelledAt = status === "cancelled" ? now : current.cancelled_at;
      const updateStatus = env.DB.prepare(
        `UPDATE appointments
            SET status = ?, checked_in_at = ?, completed_at = ?, cancelled_at = ?, updated_at = ?
          WHERE id = ? AND provider_user_id = ? AND clinic_id = ? AND status = ?
            AND starts_at_local = ? AND ends_at_local = ?`,
      ).bind(
        status,
        checkedInAt,
        completedAt,
        cancelledAt,
        now,
        id,
        user.id,
        clinicId,
        current.status,
        current.starts_at_local,
        current.ends_at_local,
      );
      const releasesSchedule = ["cancelled", "no_show", "completed"].includes(status);
      const transitionResults = await env.DB.batch(
        releasesSchedule
          ? [updateStatus, releaseSlotLocksAfterSuccessfulMutationStatement(env.DB, id)]
          : [updateStatus],
      );
      if ((transitionResults[0]?.meta?.changes ?? 0) !== 1) {
        return errorResponse("A consulta mudou durante a atualização. Recarregue a agenda.", "STALE_APPOINTMENT", 409);
      }
      const statusEmail = await decryptText(env, current.guardian_email_encrypted, "guardian_email");
      const statusContext = await loadNotificationContext(env.DB, user.id, clinicId);
      const statusTemplate = `appointment_${status}`;
      await enqueueNotification(env.DB, env, {
        appointmentId: id,
        providerUserId: user.id,
        clinicId,
        template: statusTemplate,
        recipient: await decryptText(env, current.guardian_phone_encrypted, "guardian_phone") || statusEmail,
        // Só confirmação e cancelamento vão por e-mail; os demais seguem manuais.
        email: EMAIL_NOTIFICATION_TEMPLATES.has(statusTemplate) ? statusEmail : null,
        context: statusContext,
        message: buildPatientMessage(statusTemplate, {
          startsAtLocal: current.starts_at_local,
          timezone: current.timezone,
          status,
          context: statusContext,
        }),
      });
      auditTargetType = "appointment";
      auditTargetId = id;
      auditMetadata = { previousStatus: current.status, status };
    } else if (action === "appointment_payment") {
      if (!principal.canConfigure) return errorResponse("Pagamento restrito ao profissional.", "FORBIDDEN", 403);
      const id = cleanText(body.id, 80);
      const status = parsePaymentStatus(body.paymentStatus);
      if (!id || !status) return errorResponse("Pagamento inválido.", "VALIDATION_ERROR", 400);
      const result = await env.DB.prepare(
        `UPDATE appointments SET amount_cents = COALESCE(?, amount_cents), payment_status = ?, payment_method = ?, updated_at = ?
          WHERE id = ? AND provider_user_id = ? AND clinic_id = ?`,
      ).bind(moneyCents(body.amountCents), status, cleanOptionalText(body.paymentMethod, 60), now, id, user.id, clinicId).run();
      if ((result.meta?.changes ?? 0) !== 1) return errorResponse("Consulta não encontrada.", "NOT_FOUND", 404);
      auditTargetType = "appointment_payment";
      auditTargetId = id;
      auditMetadata = { paymentStatus: status };
    } else if (action === "waitlist_status") {
      const id = cleanText(body.id, 80);
      const status = cleanText(body.status, 20);
      if (!id || !["waiting", "offered", "booked", "closed"].includes(status)) return errorResponse("Status da lista de espera inválido.", "VALIDATION_ERROR", 400);
      const result = await env.DB.prepare(`UPDATE waitlist_entries SET status = ?, updated_at = ? WHERE id = ? AND provider_user_id = ? AND clinic_id = ?`).bind(status, now, id, user.id, clinicId).run();
      if ((result.meta?.changes ?? 0) !== 1) return errorResponse("Entrada da lista de espera não encontrada.", "NOT_FOUND", 404);
      auditTargetType = "waitlist";
      auditTargetId = id;
      auditMetadata = { status };
    } else if (action === "review_moderate") {
      const id = cleanText(body.id, 80);
      if (!id) return errorResponse("Avaliação inválida.", "VALIDATION_ERROR", 400);
      const approved = body.approved === true ? 1 : 0;
      const result = await env.DB.prepare(`UPDATE appointment_reviews SET approved = ?, updated_at = ? WHERE id = ? AND provider_user_id = ? AND clinic_id = ?`).bind(approved, now, id, user.id, clinicId).run();
      if ((result.meta?.changes ?? 0) !== 1) return errorResponse("Avaliação não encontrada.", "NOT_FOUND", 404);
      auditTargetType = "review";
      auditTargetId = id;
      auditMetadata = { status: approved ? "approved" : "hidden" };
    } else if (action === "notification_retry_email") {
      // Reenvio explícito pela equipe. Limitado a MAX_EMAIL_ATTEMPTS e a uma
      // tentativa por minuto por mensagem; sem laço automático.
      const id = cleanText(body.id, 80);
      if (!id) return errorResponse("Notificação inválida.", "VALIDATION_ERROR", 400);
      if (!emailDeliveryActive(env)) {
        return errorResponse("Envio por e-mail não configurado. Use o envio manual.", "EMAIL_NOT_CONFIGURED", 409);
      }
      const row = await env.DB.prepare(
        `SELECT n.id, n.template, n.payload_encrypted, a.guardian_email_encrypted
           FROM notification_outbox n
           LEFT JOIN appointments a ON a.id = n.appointment_id
          WHERE n.id = ? AND n.provider_user_id = ? AND n.clinic_id = ?
          LIMIT 1`,
      ).bind(id, user.id, clinicId).first<{
        id: string; template: string; payload_encrypted: string; guardian_email_encrypted: string | null;
      }>();
      if (!row) return errorResponse("Notificação não encontrada.", "NOT_FOUND", 404);
      const delivery = await dispatchNotificationEmail(env.DB, env, {
        id,
        email: await decryptText(env, row.guardian_email_encrypted, "guardian_email"),
        message: (await decryptText(env, row.payload_encrypted, "payload")) ?? "",
        context: await loadNotificationContext(env.DB, user.id, clinicId),
      });
      if (delivery === "no_email") {
        return errorResponse("O responsável não tem e-mail cadastrado. Use o envio manual.", "NO_EMAIL", 409);
      }
      if (delivery === "not_eligible") {
        return errorResponse("Esta mensagem não pode ser reenviada agora (já enviada, fora do escopo de e-mail, limite de tentativas ou tentativa há menos de 1 minuto).", "NOT_ELIGIBLE", 409);
      }
      if (delivery === "error") {
        return errorResponse("Não foi possível tentar o envio agora.", "EMAIL_DISPATCH_ERROR", 503);
      }
      auditTargetType = "notification";
      auditTargetId = id;
      auditMetadata = { status: delivery };
    } else if (action === "notification_status") {
      const id = cleanText(body.id, 80);
      const status = cleanText(body.status, 30);
      if (!id || !["manual_sent", "failed"].includes(status)) return errorResponse("Status de notificação inválido.", "VALIDATION_ERROR", 400);
      // `delivered` (já enviada por e-mail) e `manual_sent` são terminais. Sem a
      // guarda de estado, aba desatualizada ou clique duplo regredia `delivered`
      // para `manual_sent` e o histórico deixava de refletir o que aconteceu.
      const result = await env.DB.prepare(
        `UPDATE notification_outbox SET status = ?, updated_at = ?
          WHERE id = ? AND provider_user_id = ? AND clinic_id = ?
            AND status IN ('pending_provider', 'failed')`,
      ).bind(status, now, id, user.id, clinicId).run();
      if ((result.meta?.changes ?? 0) !== 1) {
        const existing = await env.DB.prepare(
          `SELECT 1 AS found FROM notification_outbox WHERE id = ? AND provider_user_id = ? AND clinic_id = ? LIMIT 1`,
        ).bind(id, user.id, clinicId).first();
        if (existing) return errorResponse("Esta mensagem já foi concluída e não pode mudar de status.", "INVALID_TRANSITION", 409);
        return errorResponse("Notificação não encontrada.", "NOT_FOUND", 404);
      }
      auditTargetType = "notification";
      auditTargetId = id;
      auditMetadata = { status };
    } else {
      return errorResponse("Ação operacional desconhecida.", "UNKNOWN_ACTION", 400);
    }

    await logOperationsAudit(env.DB, principal, clinicId, {
      action,
      targetType: auditTargetType,
      targetId: auditTargetId,
      metadata: auditMetadata,
    });
    return jsonResponse(await getDashboard(env.DB, env, provider, principal, clinicId, availableProviders));
  } catch (error) {
    console.error(`[operations.POST:${action}]`, error);
    if (String(error).includes("SCHEDULE_CONFLICT")) {
      return errorResponse("O horário conflita com consulta ou bloqueio existente.", "SCHEDULE_CONFLICT", 409);
    }
    if (String(error).toLowerCase().includes("unique")) return errorResponse("Este horário acabou de ser ocupado. Atualize a agenda.", "SLOT_CONFLICT", 409);
    if (String(error).includes("OPERATIONAL_CRYPTO_NOT_CONFIGURED")) return errorResponse("Criptografia operacional não configurada.", "CRYPTO_NOT_CONFIGURED", 503);
    return errorResponse("Não foi possível concluir a operação.", "OPERATIONS_WRITE_FAILED", 500);
  }
};