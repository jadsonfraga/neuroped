from pathlib import Path


def rep(path: str, old: str, new: str) -> None:
    p = Path(path)
    text = p.read_text()
    if old not in text:
        raise SystemExit(f"anchor ausente em {path}: {old[:120]!r}")
    p.write_text(text.replace(old, new, 1))


# -----------------------------------------------------------------------------
# 1) Lock canônico por bucket temporal: impede corrida com horários sobrepostos.
# -----------------------------------------------------------------------------
shared = Path("shared/operations.ts")
text = shared.read_text()
anchor = """export function overlapsLocal(
  aStart: string,
"""
insert = """function localMinuteEpoch(value: string): number {
  const [datePart, timePart] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  return Math.floor(Date.UTC(year, month - 1, day, hour, minute) / 60000);
}

function epochMinuteToLocal(value: number): string {
  const date = new Date(value * 60000);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}T${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")}`;
}

export function appointmentSlotKeys(
  startsAtLocal: string,
  endsAtLocal: string,
  stepMinutes = 5,
): string[] {
  if (!isValidLocalDateTime(startsAtLocal) || !isValidLocalDateTime(endsAtLocal)) {
    throw new Error("INVALID_APPOINTMENT_INTERVAL");
  }
  if (!Number.isInteger(stepMinutes) || stepMinutes < 1 || stepMinutes > 60) {
    throw new Error("INVALID_SLOT_LOCK_STEP");
  }
  const start = localMinuteEpoch(startsAtLocal);
  const end = localMinuteEpoch(endsAtLocal);
  if (end <= start || end - start > 1440) throw new Error("INVALID_APPOINTMENT_INTERVAL");
  const firstBucket = Math.floor(start / stepMinutes) * stepMinutes;
  const keys: string[] = [];
  for (let bucket = firstBucket, guard = 0; bucket < end && guard < 1441; bucket += stepMinutes, guard += 1) {
    if (bucket + stepMinutes <= start) continue;
    keys.push(epochMinuteToLocal(bucket));
  }
  if (!keys.length) throw new Error("INVALID_APPOINTMENT_INTERVAL");
  return keys;
}

export function overlapsLocal(
  aStart: string,
"""
if anchor not in text:
    raise SystemExit("anchor shared operations ausente")
shared.write_text(text.replace(anchor, insert, 1))

migration = Path("db/migrations/0007_operational_suite.sql")
text = migration.read_text()
anchor = """CREATE UNIQUE INDEX IF NOT EXISTS ux_appointments_occupied_slot
  ON appointments(provider_user_id, starts_at_local)
  WHERE status IN ('requested','confirmed','checked_in','in_care');

CREATE TABLE IF NOT EXISTS waitlist_entries ("""
insert = """CREATE UNIQUE INDEX IF NOT EXISTS ux_appointments_occupied_slot
  ON appointments(provider_user_id, starts_at_local)
  WHERE status IN ('requested','confirmed','checked_in','in_care');

CREATE TABLE IF NOT EXISTS appointment_slot_locks (
  provider_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slot_key TEXT NOT NULL,
  appointment_id TEXT NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  PRIMARY KEY (provider_user_id, slot_key)
);
CREATE INDEX IF NOT EXISTS idx_appointment_slot_locks_appointment
  ON appointment_slot_locks(appointment_id);

CREATE TABLE IF NOT EXISTS waitlist_entries ("""
if anchor not in text:
    raise SystemExit("anchor migration locks ausente")
migration.write_text(text.replace(anchor, insert, 1))

core = Path("functions/api/operations/_core.ts")
text = core.read_text()
text = text.replace(
    """  addMinutesLocal,
  appointmentStatuses,
""",
    """  addMinutesLocal,
  appointmentSlotKeys,
  appointmentStatuses,
""",
    1,
)
anchor = """  `CREATE UNIQUE INDEX IF NOT EXISTS ux_appointments_occupied_slot ON appointments(provider_user_id, starts_at_local) WHERE status IN ('requested','confirmed','checked_in','in_care')`,
  `CREATE TABLE IF NOT EXISTS waitlist_entries ("""
insert = """  `CREATE UNIQUE INDEX IF NOT EXISTS ux_appointments_occupied_slot ON appointments(provider_user_id, starts_at_local) WHERE status IN ('requested','confirmed','checked_in','in_care')`,
  `CREATE TABLE IF NOT EXISTS appointment_slot_locks (
    provider_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    slot_key TEXT NOT NULL,
    appointment_id TEXT NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    PRIMARY KEY (provider_user_id, slot_key)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_appointment_slot_locks_appointment ON appointment_slot_locks(appointment_id)`,
  `CREATE TABLE IF NOT EXISTS waitlist_entries ("""
if anchor not in text:
    raise SystemExit("anchor core schema locks ausente")
text = text.replace(anchor, insert, 1)
anchor = """export function parseStatus(value: unknown): AppointmentStatus | null {
"""
insert = """export function slotLockStatements(
  db: D1Database,
  providerUserId: string,
  appointmentId: string,
  startsAtLocal: string,
  endsAtLocal: string,
): D1PreparedStatement[] {
  return appointmentSlotKeys(startsAtLocal, endsAtLocal).map((slotKey) =>
    db.prepare(
      `INSERT INTO appointment_slot_locks (provider_user_id, slot_key, appointment_id)
       VALUES (?, ?, ?)`,
    ).bind(providerUserId, slotKey, appointmentId),
  );
}

export function releaseSlotLocksStatement(
  db: D1Database,
  appointmentId: string,
): D1PreparedStatement {
  return db.prepare(`DELETE FROM appointment_slot_locks WHERE appointment_id = ?`).bind(appointmentId);
}

export function parseStatus(value: unknown): AppointmentStatus | null {
"""
if anchor not in text:
    raise SystemExit("anchor core lock helpers ausente")
text = text.replace(anchor, insert, 1)
# Falha da caixa de saída não pode transformar operação já salva em falso erro.
old = """export async function enqueueNotification(
  db: D1Database,
  env: OperationsEnv,
  options: {
    appointmentId?: string | null;
    providerUserId: string;
    template: string;
    recipient?: string | null;
    message: string;
  },
): Promise<void> {
  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO notification_outbox
        (id, appointment_id, provider_user_id, channel, template,
         recipient_encrypted, payload_encrypted, status, created_at, updated_at)
       VALUES (?, ?, ?, 'manual', ?, ?, ?, 'pending_provider', ?, ?)`,
    )
    .bind(
      `ntf-${crypto.randomUUID()}`,
      options.appointmentId ?? null,
      options.providerUserId,
      options.template,
      await encryptText(env, options.recipient ?? null),
      await encryptText(env, options.message),
      now,
      now,
    )
    .run();
}
"""
new = """export async function enqueueNotification(
  db: D1Database,
  env: OperationsEnv,
  options: {
    appointmentId?: string | null;
    providerUserId: string;
    template: string;
    recipient?: string | null;
    message: string;
  },
): Promise<boolean> {
  const now = new Date().toISOString();
  try {
    await db
      .prepare(
        `INSERT INTO notification_outbox
          (id, appointment_id, provider_user_id, channel, template,
           recipient_encrypted, payload_encrypted, status, created_at, updated_at)
         VALUES (?, ?, ?, 'manual', ?, ?, ?, 'pending_provider', ?, ?)`,
      )
      .bind(
        `ntf-${crypto.randomUUID()}`,
        options.appointmentId ?? null,
        options.providerUserId,
        options.template,
        await encryptText(env, options.recipient ?? null),
        await encryptText(env, options.message),
        now,
        now,
      )
      .run();
    return true;
  } catch (error) {
    console.error("[operations.notification-outbox]", error);
    return false;
  }
}
"""
if old not in text:
    raise SystemExit("anchor enqueueNotification ausente")
core.write_text(text.replace(old, new, 1))

# -----------------------------------------------------------------------------
# 2) Agenda não pode pertencer a operador sem relação staff→provider explícita.
# -----------------------------------------------------------------------------
rep(
    "client/src/App.tsx",
    '<RouteGuard roles={["admin", "professional", "operator"]}>\n                <AgendaPage />',
    '<RouteGuard roles={["admin", "professional"]}>\n                <AgendaPage />',
)

middleware = Path("functions/api/_middleware.ts")
text = middleware.read_text()
old = """  // Operadores podem executar somente ações operacionais; /api/operations
  // revalida a permissão ação a ação e não concede escrita clínica.
  const isOperationalOperatorWrite =
    path === "/api/operations" && method === "POST" && user.role === "operator";
  if (
    ["POST", "PATCH", "PUT", "DELETE"].includes(method) &&
    !isOwnConsentWrite &&
    !isOperationalOperatorWrite &&
    !canWriteClinicalData(user)
  ) {"""
new = """  if (
    ["POST", "PATCH", "PUT", "DELETE"].includes(method) &&
    !isOwnConsentWrite &&
    !canWriteClinicalData(user)
  ) {"""
if old not in text:
    raise SystemExit("anchor middleware operator ausente")
text = text.replace(old, new, 1).replace('  "/api/cert",\n  "/api/cert",\n', '  "/api/cert",\n', 1)
middleware.write_text(text)

ops = Path("functions/api/operations/index.ts")
text = ops.read_text()
text = text.replace(
    """function canOperate(role: string): boolean {
  return canConfigure(role) || role === "operator";
}
""",
    """function canOperate(role: string): boolean {
  return canConfigure(role);
}
""",
    1,
)
text = text.replace(
    """  randomAccessToken,
  serviceToApi,
  sha256,
""",
    """  randomAccessToken,
  releaseSlotLocksStatement,
  serviceToApi,
  sha256,
  slotLockStatements,
""",
    1,
)
old = """      await env.DB.prepare(
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
      ).run();"""
new = """      const appointmentId = `apt-${crypto.randomUUID()}`;
      const insertAppointment = env.DB.prepare(
        `INSERT INTO appointments
          (id, provider_user_id, service_id, patient_id, starts_at_local, ends_at_local, timezone,
           status, source, booking_token_hash, guardian_name_encrypted, guardian_email_encrypted,
           guardian_phone_encrypted, patient_name_encrypted, amount_cents, payment_status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed', 'professional', ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
      ).bind(
        appointmentId, user.id, service.id, cleanOptionalText(body.patientId, 100), starts, endsAtLocal,
        profile.timezone, await sha256(token), await encryptText(env, cleanOptionalText(body.guardianName, 120)),
        await encryptText(env, cleanOptionalText(body.guardianEmail, 180)), await encryptText(env, cleanOptionalText(body.guardianPhone, 40)),
        await encryptText(env, cleanOptionalText(body.patientName, 120)), service.price_cents, now, now,
      );
      await env.DB.batch([
        insertAppointment,
        ...slotLockStatements(env.DB, user.id, appointmentId, starts, endsAtLocal),
      ]);"""
if old not in text:
    raise SystemExit("anchor manual appointment ausente")
text = text.replace(old, new, 1)
old = """      await env.DB.prepare(
        `UPDATE appointments SET status = ?, checked_in_at = ?, completed_at = ?, cancelled_at = ?, updated_at = ?
          WHERE id = ? AND provider_user_id = ?`,
      ).bind(status, checkedInAt, completedAt, cancelledAt, now, id, user.id).run();"""
new = """      const updateStatus = env.DB.prepare(
        `UPDATE appointments SET status = ?, checked_in_at = ?, completed_at = ?, cancelled_at = ?, updated_at = ?
          WHERE id = ? AND provider_user_id = ?`,
      ).bind(status, checkedInAt, completedAt, cancelledAt, now, id, user.id);
      const releasesSchedule = ["cancelled", "no_show", "completed"].includes(status);
      await env.DB.batch(
        releasesSchedule
          ? [updateStatus, releaseSlotLocksStatement(env.DB, id)]
          : [updateStatus],
      );"""
if old not in text:
    raise SystemExit("anchor status appointment ausente")
ops.write_text(text.replace(old, new, 1))

# -----------------------------------------------------------------------------
# 3) Capability token nunca vai em query string. Booking/reschedule usam locks.
# -----------------------------------------------------------------------------
public = Path("functions/api/public-booking.ts")
text = public.read_text()
text = text.replace(
    """  randomAccessToken,
  serviceToApi,
  sha256,
""",
    """  randomAccessToken,
  releaseSlotLocksStatement,
  serviceToApi,
  sha256,
  slotLockStatements,
""",
    1,
)
old = """    if (action === "manage") {
      const token = cleanText(url.searchParams.get("token"), 200);
      const appointment = token ? await findAppointmentByToken(env.DB, token) : null;
      if (!appointment) return errorResponse("Reserva não encontrada.", "NOT_FOUND", 404);
      return jsonResponse({ appointment: await appointmentToApi(env, appointment) });
    }

"""
if old not in text:
    raise SystemExit("anchor GET manage ausente")
text = text.replace(old, "", 1)
anchor = """    if (action === "book") {
"""
insert = """    if (action === "manage") {
      const token = cleanText(body.token, 200);
      const appointment = token ? await findAppointmentByToken(env.DB, token) : null;
      if (!appointment) return errorResponse("Reserva não encontrada.", "NOT_FOUND", 404);
      return jsonResponse({ appointment: await appointmentToApi(env, appointment) });
    }

    if (action === "book") {
"""
if anchor not in text:
    raise SystemExit("anchor POST manage ausente")
text = text.replace(anchor, insert, 1)
old = """        await env.DB.prepare(
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
        ).run();"""
new = """        const insertAppointment = env.DB.prepare(
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
        ]);"""
if old not in text:
    raise SystemExit("anchor public book ausente")
text = text.replace(old, new, 1)
old = """      await env.DB.prepare(
        `UPDATE appointments SET status = 'cancelled', cancelled_at = ?, cancel_reason = ?, updated_at = ? WHERE id = ?`,
      ).bind(now, reason, now, appointment.id).run();"""
new = """      await env.DB.batch([
        env.DB.prepare(
          `UPDATE appointments SET status = 'cancelled', cancelled_at = ?, cancel_reason = ?, updated_at = ? WHERE id = ?`,
        ).bind(now, reason, now, appointment.id),
        releaseSlotLocksStatement(env.DB, appointment.id),
      ]);"""
if old not in text:
    raise SystemExit("anchor public cancel ausente")
text = text.replace(old, new, 1)
old = """        await env.DB.prepare(
          `UPDATE appointments SET starts_at_local = ?, ends_at_local = ?, status = 'requested', updated_at = ? WHERE id = ?`,
        ).bind(chosen.startsAtLocal, chosen.endsAtLocal, now, appointment.id).run();"""
new = """        const updateAppointment = env.DB.prepare(
          `UPDATE appointments SET starts_at_local = ?, ends_at_local = ?, status = 'requested', updated_at = ? WHERE id = ?`,
        ).bind(chosen.startsAtLocal, chosen.endsAtLocal, now, appointment.id);
        await env.DB.batch([
          releaseSlotLocksStatement(env.DB, appointment.id),
          updateAppointment,
          ...slotLockStatements(env.DB, appointment.provider_user_id, appointment.id, chosen.startsAtLocal, chosen.endsAtLocal),
        ]);"""
if old not in text:
    raise SystemExit("anchor public reschedule ausente")
public.write_text(text.replace(old, new, 1))

# Portal: consulta e remarcação via POST; nunca capability token na URL.
agendar = Path("client/src/pages/agendar.tsx")
text = agendar.read_text()
old = """      const response = await apiRequest("GET", `/api/public-booking?action=manage&token=${encodeURIComponent(token.trim())}`);
      const data = await response.json() as { appointment: Appointment };
      setManaged(data.appointment);
      setManageToken(token.trim());"""
new = """      const response = await apiRequest("POST", "/api/public-booking", { action: "manage", token: token.trim() });
      const data = await response.json() as { appointment: Appointment };
      setManaged(data.appointment);
      setServiceId(data.appointment.serviceId);
      setManageToken(token.trim());"""
if old not in text:
    raise SystemExit("anchor frontend manage ausente")
text = text.replace(old, new, 1)
anchor = """  async function cancelBooking() {
"""
insert = """  async function rescheduleBooking() {
    if (!manageToken || !managed || !slot) return;
    setBusy(true);
    try {
      await apiRequest("POST", "/api/public-booking", {
        action: "reschedule",
        token: manageToken,
        startsAtLocal: slot.startsAtLocal,
      });
      toast({ title: "Remarcação solicitada ✓", description: "A clínica precisa reconfirmar o novo horário." });
      setSlot(null);
      await manageBooking(manageToken);
    } catch (err) {
      toast({ title: "Não foi possível remarcar.", description: String(err), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  async function cancelBooking() {
"""
if anchor not in text:
    raise SystemExit("anchor frontend reschedule function ausente")
text = text.replace(anchor, insert, 1)
old = """{["requested", "confirmed"].includes(managed.status) && <Button className="mt-4" variant="outline" onClick={cancelBooking} disabled={busy}>Cancelar reserva</Button>}"""
new = """{["requested", "confirmed"].includes(managed.status) && <div className="mt-4 flex flex-wrap gap-2"><Button variant="outline" onClick={cancelBooking} disabled={busy}>Cancelar reserva</Button>{slot && slot.startsAtLocal !== managed.startsAtLocal && <Button onClick={rescheduleBooking} disabled={busy}>Remarcar para {slot.startsAtLocal.slice(11)}</Button>}</div>}"""
if old not in text:
    raise SystemExit("anchor frontend reschedule button ausente")
agendar.write_text(text.replace(old, new, 1))

# -----------------------------------------------------------------------------
# 4) Testes e migração verificam todas as travas físicas e antifake.
# -----------------------------------------------------------------------------
test = Path("tests/unit/operations-contract.test.ts")
text = test.read_text().replace(
    """  addMinutesLocal,
  appointmentStatuses,
""",
    """  addMinutesLocal,
  appointmentSlotKeys,
  appointmentStatuses,
""",
    1,
)
text = text.replace(
    'assert.equal(occupiesSchedule("completed"), false);\nassert.match(formatMoneyBRL(50000), /500/);',
    '''assert.equal(occupiesSchedule("completed"), false);\nassert.deepEqual(appointmentSlotKeys("2026-08-10T08:00", "2026-08-10T08:20"), [\n  "2026-08-10T08:00",\n  "2026-08-10T08:05",\n  "2026-08-10T08:10",\n  "2026-08-10T08:15",\n]);\nassert.deepEqual(appointmentSlotKeys("2026-08-10T08:01", "2026-08-10T08:06"), [\n  "2026-08-10T08:00",\n  "2026-08-10T08:05",\n]);\nassert.match(formatMoneyBRL(50000), /500/);''',
    1,
)
test.write_text(text)

static = Path("tests/unit/operations-integration-static.test.mjs")
text = static.read_text()
text = text.replace('  "appointments",\n', '  "appointments",\n  "appointment_slot_locks",\n', 1)
text = text.replace(
    'assert.match(migration, /ux_appointments_occupied_slot/);\n',
    '''assert.match(migration, /ux_appointments_occupied_slot/);\nassert.match(migration, /PRIMARY KEY \\(provider_user_id, slot_key\\)/);\nassert.match(core, /slotLockStatements/);\nassert.match(core, /releaseSlotLocksStatement/);\nassert.match(core, /Promise<boolean>/);\nassert.match(core, /operations\\.notification-outbox/);\nassert.match(professional, /env\\.DB\\.batch/);\nassert.match(publicBooking, /env\\.DB\\.batch/);\nassert.doesNotMatch(professional, /role === "operator"/);\nassert.doesNotMatch(app, /roles=\\{\\["admin", "professional", "operator"\\]\\}[\\s\\S]{0,120}<AgendaPage/);\nassert.doesNotMatch(publicBooking, /searchParams\\.get\\("token"\\)/, "capability token não pode trafegar em query string");\nassert.match(publicBooking, /action === "manage"/);\nassert.match(booking, /apiRequest\\("POST", "\\/api\\/public-booking", \\{ action: "manage"/);\nassert.match(booking, /rescheduleBooking/);\n''',
    1,
)
static.write_text(text)

workflow = Path(".github/workflows/operations-d1-migration.yml")
text = workflow.read_text()
text = text.replace(
    "'booking_provider_profiles','booking_services','booking_availability_rules','booking_blocks','appointments','waitlist_entries','appointment_reviews','notification_outbox'",
    "'booking_provider_profiles','booking_services','booking_availability_rules','booking_blocks','appointments','appointment_slot_locks','waitlist_entries','appointment_reviews','notification_outbox'",
    1,
)
text = text.replace(
    """            appointments \\
            waitlist_entries \\
""",
    """            appointments \\
            appointment_slot_locks \\
            waitlist_entries \\
""",
    1,
)
text = text.replace(
    "'ux_appointments_occupied_slot','idx_appointments_provider_time','idx_waitlist_provider_status','idx_notification_outbox_provider_status'",
    "'ux_appointments_occupied_slot','idx_appointments_provider_time','idx_appointment_slot_locks_appointment','idx_waitlist_provider_status','idx_notification_outbox_provider_status'",
    1,
)
text = text.replace(
    """            idx_appointments_provider_time \\
            idx_waitlist_provider_status \\
""",
    """            idx_appointments_provider_time \\
            idx_appointment_slot_locks_appointment \\
            idx_waitlist_provider_status \\
""",
    1,
)
workflow.write_text(text)
