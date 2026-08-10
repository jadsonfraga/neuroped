import { getContextUser } from "../auth/_authorization";
import { isPlainObject } from "../_request";
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
  serviceToApi,
  sha256,
  slugify,
  validSlug,
  type AppointmentRow,
  type OperationsEnv,
  type ProviderRow,
  type ServiceRow,
} from "./_core";
import type { AppointmentStatus } from "../../../shared/operations";

function canConfigure(role: string): boolean {
  return role === "admin" || role === "professional";
}

function canOperate(role: string): boolean {
  return canConfigure(role) || role === "operator";
}

async function readBody(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await request.json();
    return isPlainObject(body) ? body : null;
  } catch {
    return null;
  }
}

function moneyCents(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100000000) return null;
  return Math.round(parsed);
}

function integerBetween(value: unknown, min: number, max: number): number | null {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) return null;
  return parsed;
}

async function getDashboard(db: D1Database, env: OperationsEnv, user: { id: string; name: string }) {
  const profile = await ensureProviderProfile(db, user);
  const servicesResult = await db
    .prepare(`SELECT * FROM booking_services WHERE provider_user_id = ? ORDER BY active DESC, name`)
    .bind(user.id)
    .all<ServiceRow>();
  const rulesResult = await db
    .prepare(`SELECT * FROM booking_availability_rules WHERE provider_user_id = ? ORDER BY weekday, start_minute`)
    .bind(user.id)
    .all<any>();
  const blocksResult = await db
    .prepare(`SELECT * FROM booking_blocks WHERE provider_user_id = ? ORDER BY starts_at_local DESC LIMIT 100`)
    .bind(user.id)
    .all<any>();
  const appointmentsResult = await db
    .prepare(
      `SELECT a.*, s.name AS service_name, s.modality AS service_modality
         FROM appointments a
         JOIN booking_services s ON s.id = a.service_id
        WHERE a.provider_user_id = ?
        ORDER BY a.starts_at_local DESC
        LIMIT 250`,
    )
    .bind(user.id)
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
    .bind(user.id)
    .all<any>();
  const reviewsResult = await db
    .prepare(`SELECT * FROM appointment_reviews WHERE provider_user_id = ? ORDER BY created_at DESC LIMIT 100`)
    .bind(user.id)
    .all<any>();
  const notificationsResult = await db
    .prepare(`SELECT * FROM notification_outbox WHERE provider_user_id = ? ORDER BY created_at DESC LIMIT 120`)
    .bind(user.id)
    .all<any>();

  const appointments = await Promise.all(
    (appointmentsResult.results ?? []).map((row) => appointmentToApi(env, row)),
  );
  const waitlist = await Promise.all(
    (waitlistResult.results ?? []).map(async (row) => ({
      id: row.id,
      providerUserId: row.provider_user_id,
      serviceId: row.service_id,
      preferredDate: row.preferred_date,
      status: row.status,
      guardianName: await decryptText(env, row.guardian_name_encrypted),
      guardianEmail: await decryptText(env, row.guardian_email_encrypted),
      guardianPhone: await decryptText(env, row.guardian_phone_encrypted),
      patientName: await decryptText(env, row.patient_name_encrypted),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      serviceName: row.service_name,
    })),
  );
  const reviews = await Promise.all(
    (reviewsResult.results ?? []).map(async (row) => ({
      id: row.id,
      appointmentId: row.appointment_id,
      providerUserId: row.provider_user_id,
      rating: row.rating,
      comment: await decryptText(env, row.comment_encrypted),
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
      recipient: await decryptText(env, row.recipient_encrypted),
      message: (await decryptText(env, row.payload_encrypted)) ?? "",
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
  );

  const today = new Date().toISOString().slice(0, 10);
  const nowMinute = new Date().toISOString().slice(0, 16);
  const next30 = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 16);
  const metrics = {
    today: appointments.filter((item) => item.startsAtLocal.startsWith(today) && !["cancelled", "no_show"].includes(item.status)).length,
    upcoming: appointments.filter((item) => item.startsAtLocal >= nowMinute && !["cancelled", "completed", "no_show"].includes(item.status)).length,
    requested: appointments.filter((item) => item.status === "requested").length,
    waitlist: waitlist.filter((item) => item.status === "waiting").length,
    pendingReviews: reviews.filter((item) => !item.approved).length,
    pendingNotifications: notifications.filter((item) => item.status === "pending_provider").length,
    expectedCents: appointments
      .filter((item) => item.startsAtLocal <= next30 && !["cancelled", "no_show"].includes(item.status))
      .reduce((sum, item) => sum + (item.amountCents ?? 0), 0),
    paidCents: appointments
      .filter((item) => item.paymentStatus === "paid")
      .reduce((sum, item) => sum + (item.amountCents ?? 0), 0),
    noShow30d: appointments.filter((item) => item.status === "no_show" && item.startsAtLocal >= new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 16)).length,
  };

  return {
    profile: profileToApi(profile),
    services: (servicesResult.results ?? []).map(serviceToApi),
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
    reviews,
    notifications,
    metrics,
  };
}

export const onRequestGet: PagesFunction<OperationsEnv> = async (context) => {
  const { env } = context;
  if (!env.DB) return errorResponse("Agenda exige banco persistente.", "DB_REQUIRED", 503);
  const user = getContextUser(context);
  if (!user || !canOperate(user.role)) return errorResponse("Acesso não autorizado.", "FORBIDDEN", 403);

  try {
    await ensureOperationsSchema(env.DB);
    return jsonResponse(await getDashboard(env.DB, env, { id: user.id, name: user.name }));
  } catch (error) {
    console.error("[operations.GET]", error);
    return errorResponse("Não foi possível carregar a gestão operacional.", "OPERATIONS_LOAD_FAILED", 500);
  }
};

export const onRequestPost: PagesFunction<OperationsEnv> = async (context) => {
  const { env, request } = context;
  if (!env.DB) return errorResponse("Agenda exige banco persistente.", "DB_REQUIRED", 503);
  const user = getContextUser(context);
  if (!user || !canOperate(user.role)) return errorResponse("Acesso não autorizado.", "FORBIDDEN", 403);
  const body = await readBody(request);
  if (!body) return errorResponse("JSON inválido.", "INVALID_JSON", 400);
  const action = cleanText(body.action, 60);

  try {
    await ensureOperationsSchema(env.DB);
    const profile = await ensureProviderProfile(env.DB, { id: user.id, name: user.name });
    const now = new Date().toISOString();

    if (["upsert_profile", "create_service", "update_service", "create_rule", "delete_rule", "create_block", "delete_block", "review_moderate"].includes(action) && !canConfigure(user.role)) {
      return errorResponse("Ação restrita ao profissional responsável.", "FORBIDDEN", 403);
    }

    if (action === "upsert_profile") {
      const displayName = cleanText(body.displayName, 120);
      const specialty = cleanText(body.specialty, 120);
      const locationLabel = cleanOptionalText(body.locationLabel, 180);
      const timezone = cleanText(body.timezone, 80) || "America/Recife";
      const requestedSlug = cleanText(body.slug, 50) || slugify(displayName || user.name);
      if (!displayName || !specialty || !validSlug(requestedSlug)) {
        return errorResponse("Perfil público inválido.", "VALIDATION_ERROR", 400);
      }
      const bookingEnabled = body.bookingEnabled === true ? 1 : 0;
      try {
        await env.DB.prepare(
          `UPDATE booking_provider_profiles
              SET slug = ?, display_name = ?, specialty = ?, location_label = ?, timezone = ?, booking_enabled = ?, updated_at = ?
            WHERE user_id = ?`,
        ).bind(requestedSlug, displayName, specialty, locationLabel, timezone, bookingEnabled, now, user.id).run();
      } catch (error) {
        if (String(error).toLowerCase().includes("unique")) {
          return errorResponse("Este endereço público já está em uso.", "SLUG_CONFLICT", 409);
        }
        throw error;
      }
    } else if (action === "create_service") {
      const name = cleanText(body.name, 100);
      const duration = integerBetween(body.durationMinutes, 10, 480);
      const modality = parseModality(body.modality) ?? "in_person";
      if (!name || duration === null) return errorResponse("Serviço inválido.", "VALIDATION_ERROR", 400);
      await env.DB.prepare(
        `INSERT INTO booking_services
          (id, provider_user_id, name, duration_minutes, price_cents, modality, active, public_visible, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 1, 1, ?, ?)`,
      ).bind(`svc-${crypto.randomUUID()}`, user.id, name, duration, moneyCents(body.priceCents), modality, now, now).run();
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
      await env.DB.prepare(
        `UPDATE booking_services
            SET name = ?, duration_minutes = ?, price_cents = ?, modality = ?, active = ?, public_visible = ?, updated_at = ?
          WHERE id = ? AND provider_user_id = ?`,
      ).bind(name, duration, priceCents, modality, active, publicVisible, now, id, user.id).run();
    } else if (action === "create_rule") {
      const weekday = integerBetween(body.weekday, 0, 6);
      const startMinute = integerBetween(body.startMinute, 0, 1439);
      const endMinute = integerBetween(body.endMinute, 1, 1440);
      const slotMinutes = integerBetween(body.slotMinutes, 5, 240);
      if (weekday === null || startMinute === null || endMinute === null || slotMinutes === null || endMinute <= startMinute) {
        return errorResponse("Regra de disponibilidade inválida.", "VALIDATION_ERROR", 400);
      }
      await env.DB.prepare(
        `INSERT INTO booking_availability_rules
          (id, provider_user_id, weekday, start_minute, end_minute, slot_minutes, active, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
      ).bind(`rule-${crypto.randomUUID()}`, user.id, weekday, startMinute, endMinute, slotMinutes, now).run();
    } else if (action === "delete_rule") {
      await env.DB.prepare(`DELETE FROM booking_availability_rules WHERE id = ? AND provider_user_id = ?`)
        .bind(cleanText(body.id, 80), user.id).run();
    } else if (action === "create_block") {
      const starts = assertLocalDateTime(body.startsAtLocal);
      const ends = assertLocalDateTime(body.endsAtLocal);
      if (!starts || !ends || ends <= starts) return errorResponse("Bloqueio inválido.", "VALIDATION_ERROR", 400);
      await env.DB.prepare(
        `INSERT INTO booking_blocks (id, provider_user_id, starts_at_local, ends_at_local, reason, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      ).bind(`blk-${crypto.randomUUID()}`, user.id, starts, ends, cleanOptionalText(body.reason, 160), now).run();
    } else if (action === "delete_block") {
      await env.DB.prepare(`DELETE FROM booking_blocks WHERE id = ? AND provider_user_id = ?`)
        .bind(cleanText(body.id, 80), user.id).run();
    } else if (action === "create_appointment") {
      const serviceId = cleanText(body.serviceId, 80);
      const service = await getService(env.DB, user.id, serviceId, false);
      const starts = assertLocalDateTime(body.startsAtLocal);
      if (!service || !starts) return errorResponse("Agendamento inválido.", "VALIDATION_ERROR", 400);
      const token = randomAccessToken();
      const ends = new Date(`${starts}:00Z`);
      ends.setUTCMinutes(ends.getUTCMinutes() + service.duration_minutes);
      const endsAtLocal = ends.toISOString().slice(0, 16);
      await env.DB.prepare(
        `INSERT INTO appointments
          (id, provider_user_id, service_id, patient_id, starts_at_local, ends_at_local, timezone,
           status, source, booking_token_hash, guardian_name_encrypted, guardian_email_encrypted,
           guardian_phone_encrypted, patient_name_encrypted, amount_cents, payment_status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed', 'professional', ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
      ).bind(
        `apt-${crypto.randomUUID()}`, user.id, service.id, cleanOptionalText(body.patientId, 100), starts, endsAtLocal,
        profile.timezone, await sha256(token), await encryptText(env, cleanOptionalText(body.guardianName, 120)),
        await encryptText(env, cleanOptionalText(body.guardianEmail, 180)), await encryptText(env, cleanOptionalText(body.guardianPhone, 40)),
        await encryptText(env, cleanOptionalText(body.patientName, 120)), service.price_cents, now, now,
      ).run();
    } else if (action === "appointment_status") {
      const id = cleanText(body.id, 80);
      const status = parseStatus(body.status);
      if (!id || !status) return errorResponse("Status inválido.", "VALIDATION_ERROR", 400);
      const current = await env.DB.prepare(
        `SELECT * FROM appointments WHERE id = ? AND provider_user_id = ? LIMIT 1`,
      ).bind(id, user.id).first<AppointmentRow>();
      if (!current) return errorResponse("Consulta não encontrada.", "NOT_FOUND", 404);
      const allowed: Record<AppointmentStatus, AppointmentStatus[]> = {
        requested: ["confirmed", "cancelled", "no_show"],
        confirmed: ["checked_in", "cancelled", "no_show"],
        checked_in: ["in_care", "cancelled"],
        in_care: ["completed"],
        completed: [],
        cancelled: [],
        no_show: [],
      };
      if (!allowed[current.status].includes(status)) {
        return errorResponse("Transição de status não permitida.", "INVALID_TRANSITION", 409);
      }
      const checkedInAt = status === "checked_in" ? now : current.checked_in_at;
      const completedAt = status === "completed" ? now : current.completed_at;
      const cancelledAt = status === "cancelled" ? now : current.cancelled_at;
      await env.DB.prepare(
        `UPDATE appointments SET status = ?, checked_in_at = ?, completed_at = ?, cancelled_at = ?, updated_at = ?
          WHERE id = ? AND provider_user_id = ?`,
      ).bind(status, checkedInAt, completedAt, cancelledAt, now, id, user.id).run();
      await enqueueNotification(env.DB, env, {
        appointmentId: id,
        providerUserId: user.id,
        template: `appointment_${status}`,
        recipient: await decryptText(env, current.guardian_phone_encrypted) || await decryptText(env, current.guardian_email_encrypted),
        message: `Atualização da consulta: status ${status}. Horário ${current.starts_at_local}.`,
      });
    } else if (action === "appointment_payment") {
      if (!canConfigure(user.role)) return errorResponse("Pagamento restrito ao profissional.", "FORBIDDEN", 403);
      const id = cleanText(body.id, 80);
      const status = parsePaymentStatus(body.paymentStatus);
      if (!id || !status) return errorResponse("Pagamento inválido.", "VALIDATION_ERROR", 400);
      await env.DB.prepare(
        `UPDATE appointments SET amount_cents = COALESCE(?, amount_cents), payment_status = ?, payment_method = ?, updated_at = ?
          WHERE id = ? AND provider_user_id = ?`,
      ).bind(moneyCents(body.amountCents), status, cleanOptionalText(body.paymentMethod, 60), now, id, user.id).run();
    } else if (action === "waitlist_status") {
      const id = cleanText(body.id, 80);
      const status = cleanText(body.status, 20);
      if (!id || !["waiting", "offered", "booked", "closed"].includes(status)) {
        return errorResponse("Status da lista de espera inválido.", "VALIDATION_ERROR", 400);
      }
      await env.DB.prepare(`UPDATE waitlist_entries SET status = ?, updated_at = ? WHERE id = ? AND provider_user_id = ?`)
        .bind(status, now, id, user.id).run();
    } else if (action === "review_moderate") {
      const id = cleanText(body.id, 80);
      const approved = body.approved === true ? 1 : 0;
      await env.DB.prepare(`UPDATE appointment_reviews SET approved = ?, updated_at = ? WHERE id = ? AND provider_user_id = ?`)
        .bind(approved, now, id, user.id).run();
    } else if (action === "notification_status") {
      const id = cleanText(body.id, 80);
      const status = cleanText(body.status, 30);
      if (!["manual_sent", "failed"].includes(status)) return errorResponse("Status de notificação inválido.", "VALIDATION_ERROR", 400);
      await env.DB.prepare(`UPDATE notification_outbox SET status = ?, updated_at = ? WHERE id = ? AND provider_user_id = ?`)
        .bind(status, now, id, user.id).run();
    } else {
      return errorResponse("Ação operacional desconhecida.", "UNKNOWN_ACTION", 400);
    }

    return jsonResponse(await getDashboard(env.DB, env, { id: user.id, name: user.name }));
  } catch (error) {
    console.error(`[operations.POST:${action}]`, error);
    if (String(error).toLowerCase().includes("unique")) {
      return errorResponse("Este horário acabou de ser ocupado. Atualize a agenda.", "SLOT_CONFLICT", 409);
    }
    if (String(error).includes("OPERATIONAL_CRYPTO_NOT_CONFIGURED")) {
      return errorResponse("Criptografia operacional não configurada.", "CRYPTO_NOT_CONFIGURED", 503);
    }
    return errorResponse("Não foi possível concluir a operação.", "OPERATIONS_WRITE_FAILED", 500);
  }
};
