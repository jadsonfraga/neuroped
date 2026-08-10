import { isPlainObject } from "./_request";
import {
  appointmentToApi,
  cleanOptionalText,
  cleanText,
  decryptText,
  encryptText,
  enqueueNotification,
  ensureOperationsSchema,
  errorResponse,
  findAppointmentByToken,
  getProviderBySlug,
  getService,
  jsonResponse,
  listAvailableSlots,
  profileToApi,
  randomAccessToken,
  releaseSlotLocksStatement,
  serviceToApi,
  sha256,
  slotLockStatements,
  type OperationsEnv,
  type ServiceRow,
} from "./operations/_core";

function emailValid(value: string): boolean {
  return !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function phoneValid(value: string): boolean {
  if (!value) return false;
  const digits = value.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 13;
}

async function readBody(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const parsed = await request.json();
    return isPlainObject(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function nowInTimezone(timezone: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date());
    const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${map.year}-${map.month}-${map.day}T${map.hour}:${map.minute}`;
  } catch {
    return new Date().toISOString().slice(0, 16);
  }
}

async function publicProfile(db: D1Database, env: OperationsEnv, slug: string) {
  const provider = await getProviderBySlug(db, slug);
  if (!provider) return null;
  const services = await db
    .prepare(
      `SELECT * FROM booking_services
        WHERE provider_user_id = ? AND active = 1 AND public_visible = 1
        ORDER BY name`,
    )
    .bind(provider.user_id)
    .all<ServiceRow>();
  const reviews = await db
    .prepare(
      `SELECT rating, comment_encrypted, created_at
         FROM appointment_reviews
        WHERE provider_user_id = ? AND approved = 1
        ORDER BY created_at DESC
        LIMIT 20`,
    )
    .bind(provider.user_id)
    .all<any>();
  return {
    ...profileToApi(provider),
    services: (services.results ?? []).map(serviceToApi),
    reviews: await Promise.all(
      (reviews.results ?? []).map(async (row) => ({
        rating: row.rating,
        comment: await decryptText(env, row.comment_encrypted),
        createdAt: row.created_at,
      })),
    ),
  };
}

export const onRequestGet: PagesFunction<OperationsEnv> = async ({ env, request }) => {
  if (!env.DB) return errorResponse("Agendamento online indisponível.", "DB_REQUIRED", 503);
  const url = new URL(request.url);
  const action = cleanText(url.searchParams.get("action"), 30) || "profile";
  const slug = cleanText(url.searchParams.get("provider"), 60);

  try {
    await ensureOperationsSchema(env.DB);

    if (!slug) return errorResponse("Profissional não informado.", "VALIDATION_ERROR", 400);
    const provider = await getProviderBySlug(env.DB, slug);
    if (!provider) return errorResponse("Perfil não encontrado.", "NOT_FOUND", 404);

    if (action === "slots") {
      if (!provider.booking_enabled) {
        return jsonResponse({ slots: [], bookingEnabled: false });
      }
      const serviceId = cleanText(url.searchParams.get("service"), 80);
      const date = cleanText(url.searchParams.get("date"), 10);
      const service = await getService(env.DB, provider.user_id, serviceId, true);
      if (!service || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return errorResponse("Serviço ou data inválidos.", "VALIDATION_ERROR", 400);
      }
      const currentLocal = nowInTimezone(provider.timezone);
      const slots = (await listAvailableSlots(env.DB, provider.user_id, service, date)).filter(
        (slot) => slot.startsAtLocal > currentLocal,
      );
      return jsonResponse({ slots, bookingEnabled: true, timezone: provider.timezone });
    }

    return jsonResponse(await publicProfile(env.DB, env, slug));
  } catch (error) {
    console.error("[public-booking.GET]", error);
    return errorResponse("Não foi possível carregar o agendamento.", "BOOKING_LOAD_FAILED", 500);
  }
};

export const onRequestPost: PagesFunction<OperationsEnv> = async ({ env, request }) => {
  if (!env.DB) return errorResponse("Agendamento online indisponível.", "DB_REQUIRED", 503);
  const body = await readBody(request);
  if (!body) return errorResponse("JSON inválido.", "INVALID_JSON", 400);
  const action = cleanText(body.action, 30);

  try {
    await ensureOperationsSchema(env.DB);
    const now = new Date().toISOString();

    if (action === "manage") {
      const token = cleanText(body.token, 200);
      const appointment = token ? await findAppointmentByToken(env.DB, token) : null;
      if (!appointment) return errorResponse("Reserva não encontrada.", "NOT_FOUND", 404);
      return jsonResponse({ appointment: await appointmentToApi(env, appointment) });
    }

    if (action === "book") {
      if (body.privacyAccepted !== true) {
        return errorResponse("É necessário aceitar o aviso de privacidade do agendamento.", "CONSENT_REQUIRED", 400);
      }
      const slug = cleanText(body.provider, 60);
      const provider = await getProviderBySlug(env.DB, slug);
      if (!provider || !provider.booking_enabled) {
        return errorResponse("Agendamento online não está ativo.", "BOOKING_DISABLED", 409);
      }
      const serviceId = cleanText(body.serviceId, 80);
      const service = await getService(env.DB, provider.user_id, serviceId, true);
      const startsAtLocal = cleanText(body.startsAtLocal, 16);
      const date = startsAtLocal.slice(0, 10);
      const slots = service ? await listAvailableSlots(env.DB, provider.user_id, service, date) : [];
      const chosen = slots.find((slot) => slot.startsAtLocal === startsAtLocal);
      if (!service || !chosen || startsAtLocal <= nowInTimezone(provider.timezone)) {
        return errorResponse("Horário não está mais disponível.", "SLOT_UNAVAILABLE", 409);
      }

      const guardianName = cleanText(body.guardianName, 120);
      const guardianEmail = cleanText(body.guardianEmail, 180).toLocaleLowerCase("pt-BR");
      const guardianPhone = cleanText(body.guardianPhone, 40);
      const patientName = cleanText(body.patientName, 120);
      if (guardianName.length < 2 || patientName.length < 1 || (!guardianPhone && !guardianEmail)) {
        return errorResponse("Dados de contato incompletos.", "VALIDATION_ERROR", 400);
      }
      if (guardianPhone && !phoneValid(guardianPhone)) {
        return errorResponse("Telefone inválido.", "VALIDATION_ERROR", 400);
      }
      if (guardianEmail && !emailValid(guardianEmail)) {
        return errorResponse("E-mail inválido.", "VALIDATION_ERROR", 400);
      }

      const token = randomAccessToken();
      const appointmentId = `apt-${crypto.randomUUID()}`;
      try {
        const insertAppointment = env.DB.prepare(
          `INSERT INTO appointments
            (id, provider_user_id, service_id, starts_at_local, ends_at_local, timezone,
             status, source, booking_token_hash, guardian_name_encrypted, guardian_email_encrypted,
             guardian_phone_encrypted, patient_name_encrypted, amount_cents, payment_status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, 'requested', 'public', ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
        ).bind(
          appointmentId,
          provider.user_id,
          service.id,
          chosen.startsAtLocal,
          chosen.endsAtLocal,
          provider.timezone,
          await sha256(token),
          await encryptText(env, guardianName),
          await encryptText(env, guardianEmail || null),
          await encryptText(env, guardianPhone || null),
          await encryptText(env, patientName),
          service.price_cents,
          now,
          now,
        );
        await env.DB.batch([
          insertAppointment,
          ...slotLockStatements(env.DB, provider.user_id, appointmentId, chosen.startsAtLocal, chosen.endsAtLocal),
        ]);
      } catch (error) {
        if (String(error).toLowerCase().includes("unique")) {
          return errorResponse("Este horário acabou de ser reservado.", "SLOT_CONFLICT", 409);
        }
        throw error;
      }

      const recipient = guardianPhone || guardianEmail || null;
      await enqueueNotification(env.DB, env, {
        appointmentId,
        providerUserId: provider.user_id,
        template: "booking_requested",
        recipient,
        message: `Solicitação de consulta recebida para ${chosen.startsAtLocal}. A clínica ainda precisa confirmar o horário.`,
      });

      return jsonResponse(
        {
          appointmentId,
          bookingToken: token,
          status: "requested",
          startsAtLocal: chosen.startsAtLocal,
          endsAtLocal: chosen.endsAtLocal,
          timezone: provider.timezone,
          message: "Solicitação registrada. Guarde o código para consultar ou cancelar a reserva.",
        },
        201,
      );
    }

    if (action === "cancel") {
      const token = cleanText(body.token, 200);
      const appointment = await findAppointmentByToken(env.DB, token);
      if (!appointment) return errorResponse("Reserva não encontrada.", "NOT_FOUND", 404);
      if (!["requested", "confirmed"].includes(appointment.status)) {
        return errorResponse("Esta reserva não pode mais ser cancelada por autoatendimento.", "INVALID_TRANSITION", 409);
      }
      const reason = cleanOptionalText(body.reason, 160);
      await env.DB.batch([
        env.DB.prepare(
          `UPDATE appointments SET status = 'cancelled', cancelled_at = ?, cancel_reason = ?, updated_at = ? WHERE id = ?`,
        ).bind(now, reason, now, appointment.id),
        releaseSlotLocksStatement(env.DB, appointment.id),
      ]);
      await enqueueNotification(env.DB, env, {
        appointmentId: appointment.id,
        providerUserId: appointment.provider_user_id,
        template: "booking_cancelled",
        recipient: await decryptText(env, appointment.guardian_phone_encrypted) || await decryptText(env, appointment.guardian_email_encrypted),
        message: `Reserva cancelada para ${appointment.starts_at_local}.`,
      });
      return jsonResponse({ ok: true, status: "cancelled" });
    }

    if (action === "reschedule") {
      const token = cleanText(body.token, 200);
      const appointment = await findAppointmentByToken(env.DB, token);
      if (!appointment) return errorResponse("Reserva não encontrada.", "NOT_FOUND", 404);
      if (!["requested", "confirmed"].includes(appointment.status)) {
        return errorResponse("Esta reserva não pode mais ser remarcada por autoatendimento.", "INVALID_TRANSITION", 409);
      }
      const service = await getService(env.DB, appointment.provider_user_id, appointment.service_id, true);
      const startsAtLocal = cleanText(body.startsAtLocal, 16);
      const provider = await env.DB.prepare(`SELECT * FROM booking_provider_profiles WHERE user_id = ? LIMIT 1`)
        .bind(appointment.provider_user_id).first<any>();
      if (!service || !provider) return errorResponse("Configuração do agendamento indisponível.", "NOT_FOUND", 404);
      const slots = await listAvailableSlots(env.DB, appointment.provider_user_id, service, startsAtLocal.slice(0, 10));
      const chosen = slots.find((slot) => slot.startsAtLocal === startsAtLocal);
      if (!chosen || startsAtLocal <= nowInTimezone(provider.timezone)) {
        return errorResponse("Novo horário indisponível.", "SLOT_UNAVAILABLE", 409);
      }
      try {
        const updateAppointment = env.DB.prepare(
          `UPDATE appointments SET starts_at_local = ?, ends_at_local = ?, status = 'requested', updated_at = ? WHERE id = ?`,
        ).bind(chosen.startsAtLocal, chosen.endsAtLocal, now, appointment.id);
        await env.DB.batch([
          releaseSlotLocksStatement(env.DB, appointment.id),
          updateAppointment,
          ...slotLockStatements(env.DB, appointment.provider_user_id, appointment.id, chosen.startsAtLocal, chosen.endsAtLocal),
        ]);
      } catch (error) {
        if (String(error).toLowerCase().includes("unique")) {
          return errorResponse("Novo horário acabou de ser ocupado.", "SLOT_CONFLICT", 409);
        }
        throw error;
      }
      await enqueueNotification(env.DB, env, {
        appointmentId: appointment.id,
        providerUserId: appointment.provider_user_id,
        template: "booking_rescheduled",
        recipient: await decryptText(env, appointment.guardian_phone_encrypted) || await decryptText(env, appointment.guardian_email_encrypted),
        message: `Remarcação solicitada para ${chosen.startsAtLocal}. A clínica precisa reconfirmar.`,
      });
      return jsonResponse({ ok: true, status: "requested", startsAtLocal: chosen.startsAtLocal, endsAtLocal: chosen.endsAtLocal });
    }

    if (action === "waitlist") {
      if (body.privacyAccepted !== true) {
        return errorResponse("Consentimento de privacidade obrigatório.", "CONSENT_REQUIRED", 400);
      }
      const provider = await getProviderBySlug(env.DB, cleanText(body.provider, 60));
      if (!provider || !provider.booking_enabled) {
        return errorResponse("Lista de espera indisponível.", "BOOKING_DISABLED", 409);
      }
      const service = await getService(env.DB, provider.user_id, cleanText(body.serviceId, 80), true);
      if (!service) return errorResponse("Serviço inválido.", "VALIDATION_ERROR", 400);
      const guardianName = cleanText(body.guardianName, 120);
      const guardianEmail = cleanText(body.guardianEmail, 180).toLocaleLowerCase("pt-BR");
      const guardianPhone = cleanText(body.guardianPhone, 40);
      const patientName = cleanText(body.patientName, 120);
      if (guardianName.length < 2 || patientName.length < 1 || (!guardianPhone && !guardianEmail)) {
        return errorResponse("Dados de contato incompletos.", "VALIDATION_ERROR", 400);
      }
      if (guardianPhone && !phoneValid(guardianPhone)) {
        return errorResponse("Telefone inválido.", "VALIDATION_ERROR", 400);
      }
      if (guardianEmail && !emailValid(guardianEmail)) {
        return errorResponse("E-mail inválido.", "VALIDATION_ERROR", 400);
      }
      const token = randomAccessToken();
      const id = `wait-${crypto.randomUUID()}`;
      await env.DB.prepare(
        `INSERT INTO waitlist_entries
          (id, provider_user_id, service_id, preferred_date, status, access_token_hash,
           guardian_name_encrypted, guardian_email_encrypted, guardian_phone_encrypted, patient_name_encrypted, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'waiting', ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        id,
        provider.user_id,
        service.id,
        cleanOptionalText(body.preferredDate, 10),
        await sha256(token),
        await encryptText(env, guardianName),
        await encryptText(env, guardianEmail || null),
        await encryptText(env, guardianPhone || null),
        await encryptText(env, patientName),
        now,
        now,
      ).run();
      return jsonResponse({ ok: true, waitlistId: id, accessToken: token, status: "waiting" }, 201);
    }

    if (action === "review") {
      const token = cleanText(body.token, 200);
      const appointment = await findAppointmentByToken(env.DB, token);
      if (!appointment) return errorResponse("Reserva não encontrada.", "NOT_FOUND", 404);
      if (appointment.status !== "completed") {
        return errorResponse("Avaliação disponível somente após consulta concluída.", "NOT_COMPLETED", 409);
      }
      const rating = Number(body.rating);
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return errorResponse("Nota inválida.", "VALIDATION_ERROR", 400);
      }
      const comment = cleanOptionalText(body.comment, 600);
      try {
        await env.DB.prepare(
          `INSERT INTO appointment_reviews
            (id, appointment_id, provider_user_id, rating, comment_encrypted, approved, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
        ).bind(
          `rev-${crypto.randomUUID()}`,
          appointment.id,
          appointment.provider_user_id,
          rating,
          await encryptText(env, comment),
          now,
          now,
        ).run();
      } catch (error) {
        if (String(error).toLowerCase().includes("unique")) {
          return errorResponse("Esta consulta já recebeu uma avaliação.", "ALREADY_REVIEWED", 409);
        }
        throw error;
      }
      return jsonResponse({ ok: true, moderation: "pending" }, 201);
    }

    return errorResponse("Ação desconhecida.", "UNKNOWN_ACTION", 400);
  } catch (error) {
    console.error(`[public-booking.POST:${action}]`, error);
    if (String(error).includes("OPERATIONAL_CRYPTO_NOT_CONFIGURED")) {
      return errorResponse("Agendamento temporariamente indisponível.", "CRYPTO_NOT_CONFIGURED", 503);
    }
    return errorResponse("Não foi possível concluir a solicitação.", "BOOKING_WRITE_FAILED", 500);
  }
};
