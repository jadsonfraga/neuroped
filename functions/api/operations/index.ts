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
  slugify,
  validSlug,
  type AppointmentRow,
  type OperationsEnv,
  type ServiceRow,
} from "./_core";
import {
  ensureOperationsHardeningSchema,
  linkOperationsOperator,
  listOperationsAudit,
  listOperationsStaff,
  logOperationsAudit,
  resolveOperationsPrincipal,
  setOperationsStaffActive,
  type OperationsPrincipal,
} from "./_access";
import { isValidTimeZone, type AppointmentStatus } from "../../../shared/operations";
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

async function patientBelongsToProvider(
  db: D1Database,
  patientId: string,
  providerUserId: string,
): Promise<boolean> {
  const tables = ["patients", "patients_demo"];
  for (const table of tables) {
    try {
      const row = await db
        .prepare(`SELECT id FROM ${table} WHERE id = ? AND owner_user_id = ? LIMIT 1`)
        .bind(patientId, providerUserId)
        .first<{ id: string }>();
      if (row?.id) return true;
    } catch {
      // A tabela pode não existir no ambiente Cloudflare correspondente; a
      // próxima tabela compatível será tentada sem alterar o contrato da API.
    }
  }
  return false;
}

async function getDashboard(
  db: D1Database,
  env: OperationsEnv,
  provider: { id: string; name: string },
  principal: OperationsPrincipal,
) {
  const profile = await ensureProviderProfile(db, provider);
  const nowMinute = localNow(profile.timezone);
  const today = nowMinute.slice(0, 10);
  const next30 = addDaysLocalMinute(nowMinute, 30);
  const prior30 = addDaysLocalMinute(nowMinute, -30);

  const servicesResult = await db
    .prepare(`SELECT * FROM booking_services WHERE provider_user_id = ? ORDER BY active DESC, name`)
    .bind(provider.id)
    .all<ServiceRow>();
  const rulesResult = await db
    .prepare(`SELECT * FROM booking_availability_rules WHERE provider_user_id = ? ORDER BY weekday, start_minute`)
    .bind(provider.id)
    .all<any>();
  const blocksResult = await db
    .prepare(`SELECT * FROM booking_blocks WHERE provider_user_id = ? ORDER BY starts_at_local DESC LIMIT 100`)
    .bind(provider.id)
    .all<any>();
  const appointmentsResult = await db
    .prepare(
      `SELECT a.*, s.name AS service_name, s.modality AS service_modality
         FROM appointments a
         JOIN booking_services s ON s.id = a.service_id
        WHERE a.provider_user_id = ?
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
    .bind(provider.id, nowMinute, nowMinute)
    .all<AppointmentRow>();
  const waitlistResult = await db
    .prepare(
      `SELECT w.*, s.name AS service_name
         FROM waitlist_entries w
         JOIN booking_services s ON s.id = w.service_id
        WHERE w.provider_user_id = ?
        ORDER BY CASE w.status WHEN 'waiting' THEN 0 WHEN 'offered' THEN 1 ELSE 2 END, w.created_at DESC
        LIMIT 150`,
    )
    .bind(provider.id)
    .all<any>();
  const reviewsResult = await db
    .prepare(`SELECT * FROM appointment_reviews WHERE provider_user_id = ? ORDER BY created_at DESC LIMIT 100`)
    .bind(provider.id)
    .all<any>();
  const notificationsResult = await db
    .prepare(`SELECT * FROM notification_outbox WHERE provider_user_id = ? ORDER BY created_at DESC LIMIT 120`)
    .bind(provider.id)
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
      WHERE provider_user_id = ?`,
    ).bind(today, nowMinute, prior30, nowMinute, nowMinute, next30, provider.id).first<{
      today_count: number; upcoming_count: number; requested_count: number; no_show_30d: number;
      expected_cents: number; paid_cents: number;
    }>(),
    db.prepare(
      `SELECT COUNT(*) AS count FROM waitlist_entries WHERE provider_user_id = ? AND status = 'waiting'`,
    ).bind(provider.id).first<{ count: number }>(),
    db.prepare(
      `SELECT COUNT(*) AS count FROM appointment_reviews WHERE provider_user_id = ? AND approved = 0`,
    ).bind(provider.id).first<{ count: number }>(),
    db.prepare(
      `SELECT COUNT(*) AS count FROM notification_outbox WHERE provider_user_id = ? AND status = 'pending_provider'`,
    ).bind(provider.id).first<{ count: number }>(),
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
    metrics,
    access: principal,
    staff: principal.canConfigure ? await listOperationsStaff(db, provider.id) : [],
    audit: await listOperationsAudit(db, provider.id, 40),
  };
}

async function preparePrincipal(context: Parameters<PagesFunction<OperationsEnv>>[0]) {
  const user = getContextUser(context);
  if (!user || !canOperate(user.role) || !context.env.DB) return null;
  await ensureOperationsSchema(context.env.DB);
  await ensureOperationsHardeningSchema(context.env.DB);
  const principal = await resolveOperationsPrincipal(context.env.DB, user);
  if (!principal) return null;
  return {
    authUser: user,
    principal,
    provider: { id: principal.providerUserId, name: principal.providerName },
  };
}

export const onRequestGet: PagesFunction<OperationsEnv> = async (context) => {
  const { env } = context;
  if (!env.DB) return errorResponse("Agenda exige banco persistente.", "DB_REQUIRED", 503);

  try {
    const prepared = await preparePrincipal(context);
    if (!prepared) {
      const user = getContextUser(context);
      return errorResponse(
        user?.role === "operator"
          ? "Recepção ainda não vinculada a um profissional."
          : "Acesso não autorizado.",
        user?.role === "operator" ? "STAFF_LINK_REQUIRED" : "FORBIDDEN",
        403,
      );
    }
    return jsonResponse(await getDashboard(env.DB, env, prepared.provider, prepared.principal));
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
    if (!prepared) {
      const user = getContextUser(context);
      return errorResponse(
        user?.role === "operator"
          ? "Recepção ainda não vinculada a um profissional."
          : "Acesso não autorizado.",
        user?.role === "operator" ? "STAFF_LINK_REQUIRED" : "FORBIDDEN",
        403,
      );
    }
    const { authUser, principal, provider } = prepared;
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
      "review_moderate",
      "staff_link",
      "staff_active",
    ];
    if (configureActions.includes(action) && !principal.canConfigure) {
      return errorResponse("Ação restrita ao profissional responsável.", "FORBIDDEN", 403);
    }

    if (action === "staff_link") {
      const email = cleanText(body.email, 180).toLowerCase();
      if (!email.includes("@")) return errorResponse("E-mail da recepção inválido.", "VALIDATION_ERROR", 400);
      const result = await linkOperationsOperator(env.DB, principal, email);
      if (!result.ok) {
        const messages: Record<string, string> = {
          STAFF_NOT_FOUND: "Usuário da recepção não encontrado.",
          STAFF_ROLE_INVALID: "O usuário precisa ter perfil operator ativo.",
          SELF_LINK_INVALID: "O profissional não pode vincular a si próprio como recepção.",
          STAFF_ALREADY_LINKED: "Este usuário da recepção já está vinculado a outro profissional.",
          FORBIDDEN: "Ação não autorizada.",
        };
        return errorResponse(messages[result.code] ?? "Não foi possível vincular a recepção.", result.code, result.code === "STAFF_NOT_FOUND" ? 404 : 409);
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
          (id, provider_user_id, name, duration_minutes, price_cents, modality, active, public_visible, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 1, 1, ?, ?)`,
      ).bind(id, user.id, name, duration, moneyCents(body.priceCents), modality, now, now).run();
      auditTargetType = "service";
      auditTargetId = id;
      auditMetadata = { modality };
    } else if (action === "update_service") {
      const id = cleanText(body.id, 80);
      const existing = await getService(env.DB, user.id, id, false);
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
          WHERE id = ? AND provider_user_id = ?`,
      ).bind(name, duration, priceCents, modality, active, publicVisible, now, id, user.id).run();
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
          (id, provider_user_id, weekday, start_minute, end_minute, slot_minutes, active, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
      ).bind(id, user.id, weekday, startMinute, endMinute, slotMinutes, now).run();
      auditTargetType = "availability_rule";
      auditTargetId = id;
    } else if (action === "delete_rule") {
      const id = cleanText(body.id, 80);
      if (!id) return errorResponse("Regra inválida.", "VALIDATION_ERROR", 400);
      const result = await env.DB.prepare(`DELETE FROM booking_availability_rules WHERE id = ? AND provider_user_id = ?`).bind(id, user.id).run();
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
        `INSERT INTO booking_blocks (id, provider_user_id, starts_at_local, ends_at_local, reason, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      ).bind(id, user.id, starts, ends, cleanOptionalText(body.reason, 160), now).run();
      auditTargetType = "availability_block";
      auditTargetId = id;
    } else if (action === "delete_block") {
      const id = cleanText(body.id, 80);
      if (!id) return errorResponse("Bloqueio inválido.", "VALIDATION_ERROR", 400);
      const result = await env.DB.prepare(`DELETE FROM booking_blocks WHERE id = ? AND provider_user_id = ?`).bind(id, user.id).run();
      if ((result.meta?.changes ?? 0) !== 1) return errorResponse("Bloqueio não encontrado.", "NOT_FOUND", 404);
      auditTargetType = "availability_block";
      auditTargetId = id;
      auditMetadata = { status: "deleted" };
    } else if (action === "create_appointment") {
      const serviceId = cleanText(body.serviceId, 80);
      const service = await getService(env.DB, user.id, serviceId, false);
      const starts = assertLocalDateTime(body.startsAtLocal);
      if (!service || !starts) return errorResponse("Agendamento inválido.", "VALIDATION_ERROR", 400);
      const token = randomAccessToken();
      const ends = new Date(`${starts}:00Z`);
      ends.setUTCMinutes(ends.getUTCMinutes() + service.duration_minutes);
      const endsAtLocal = ends.toISOString().slice(0, 16);
      const appointmentId = `apt-${crypto.randomUUID()}`;
      const patientId = principal.delegated ? null : cleanOptionalText(body.patientId, 100);
      if (patientId && !(await patientBelongsToProvider(env.DB, patientId, user.id))) {
        return errorResponse("Paciente não encontrado ou sem vínculo com este profissional.", "PATIENT_NOT_FOUND", 404);
      }
      const insertAppointment = env.DB.prepare(
        `INSERT INTO appointments
          (id, provider_user_id, service_id, patient_id, starts_at_local, ends_at_local, timezone,
           status, source, booking_token_hash, guardian_name_encrypted, guardian_email_encrypted,
           guardian_phone_encrypted, patient_name_encrypted, amount_cents, payment_status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed', 'professional', ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
      ).bind(
        appointmentId, user.id, service.id, patientId, starts, endsAtLocal,
        profile.timezone, await sha256(token), await encryptText(env, cleanOptionalText(body.guardianName, 120), "guardian_name"),
        await encryptText(env, cleanOptionalText(body.guardianEmail, 180), "guardian_email"), await encryptText(env, cleanOptionalText(body.guardianPhone, 40), "guardian_phone"),
        await encryptText(env, cleanOptionalText(body.patientName, 120), "patient_name"), service.price_cents, now, now,
      );
      await env.DB.batch([insertAppointment, ...slotLockStatements(env.DB, user.id, appointmentId, starts, endsAtLocal)]);
      auditTargetType = "appointment";
      auditTargetId = appointmentId;
      auditMetadata = { source: principal.delegated ? "operator" : "professional", serviceId };
    } else if (action === "appointment_status") {
      const id = cleanText(body.id, 80);
      const status = parseStatus(body.status);
      if (!id || !status) return errorResponse("Status inválido.", "VALIDATION_ERROR", 400);
      const current = await env.DB.prepare(`SELECT * FROM appointments WHERE id = ? AND provider_user_id = ? LIMIT 1`).bind(id, user.id).first<AppointmentRow>();
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
          WHERE id = ? AND provider_user_id = ? AND status = ?
            AND starts_at_local = ? AND ends_at_local = ?`,
      ).bind(
        status,
        checkedInAt,
        completedAt,
        cancelledAt,
        now,
        id,
        user.id,
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
      await enqueueNotification(env.DB, env, {
        appointmentId: id,
        providerUserId: user.id,
        template: `appointment_${status}`,
        recipient: await decryptText(env, current.guardian_phone_encrypted, "guardian_phone") || await decryptText(env, current.guardian_email_encrypted, "guardian_email"),
        message: `Atualização da consulta: status ${status}. Horário ${current.starts_at_local}.`,
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
          WHERE id = ? AND provider_user_id = ?`,
      ).bind(moneyCents(body.amountCents), status, cleanOptionalText(body.paymentMethod, 60), now, id, user.id).run();
      if ((result.meta?.changes ?? 0) !== 1) return errorResponse("Consulta não encontrada.", "NOT_FOUND", 404);
      auditTargetType = "appointment_payment";
      auditTargetId = id;
      auditMetadata = { paymentStatus: status };
    } else if (action === "waitlist_status") {
      const id = cleanText(body.id, 80);
      const status = cleanText(body.status, 20);
      if (!id || !["waiting", "offered", "booked", "closed"].includes(status)) return errorResponse("Status da lista de espera inválido.", "VALIDATION_ERROR", 400);
      const result = await env.DB.prepare(`UPDATE waitlist_entries SET status = ?, updated_at = ? WHERE id = ? AND provider_user_id = ?`).bind(status, now, id, user.id).run();
      if ((result.meta?.changes ?? 0) !== 1) return errorResponse("Entrada da lista de espera não encontrada.", "NOT_FOUND", 404);
      auditTargetType = "waitlist";
      auditTargetId = id;
      auditMetadata = { status };
    } else if (action === "review_moderate") {
      const id = cleanText(body.id, 80);
      if (!id) return errorResponse("Avaliação inválida.", "VALIDATION_ERROR", 400);
      const approved = body.approved === true ? 1 : 0;
      const result = await env.DB.prepare(`UPDATE appointment_reviews SET approved = ?, updated_at = ? WHERE id = ? AND provider_user_id = ?`).bind(approved, now, id, user.id).run();
      if ((result.meta?.changes ?? 0) !== 1) return errorResponse("Avaliação não encontrada.", "NOT_FOUND", 404);
      auditTargetType = "review";
      auditTargetId = id;
      auditMetadata = { status: approved ? "approved" : "hidden" };
    } else if (action === "notification_status") {
      const id = cleanText(body.id, 80);
      const status = cleanText(body.status, 30);
      if (!id || !["manual_sent", "failed"].includes(status)) return errorResponse("Status de notificação inválido.", "VALIDATION_ERROR", 400);
      const result = await env.DB.prepare(`UPDATE notification_outbox SET status = ?, updated_at = ? WHERE id = ? AND provider_user_id = ?`).bind(status, now, id, user.id).run();
      if ((result.meta?.changes ?? 0) !== 1) return errorResponse("Notificação não encontrada.", "NOT_FOUND", 404);
      auditTargetType = "notification";
      auditTargetId = id;
      auditMetadata = { status };
    } else {
      return errorResponse("Ação operacional desconhecida.", "UNKNOWN_ACTION", 400);
    }

    await logOperationsAudit(env.DB, principal, {
      action,
      targetType: auditTargetType,
      targetId: auditTargetId,
      metadata: auditMetadata,
    });
    return jsonResponse(await getDashboard(env.DB, env, provider, principal));
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