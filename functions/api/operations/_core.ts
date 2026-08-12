import {
  addMinutesLocal,
  appointmentSlotKeys,
  appointmentStatuses,
  bookingModalities,
  isValidLocalDate,
  isValidLocalDateTime,
  minutesToClock,
  overlapsLocal,
  paymentStatuses,
  type AppointmentStatus,
  type BookingService,
  type PublicSlot,
} from "../../../shared/operations";

export interface OperationsEnv {
  DB?: D1Database;
  NEUROPED_JWT_SECRET?: string;
  OPERATIONAL_DATA_KEY?: string;
}

interface ProviderIdentity {
  id: string;
  name: string;
}

export interface ProviderRow {
  user_id: string;
  slug: string;
  display_name: string;
  specialty: string;
  location_label: string | null;
  timezone: string;
  booking_enabled: number;
  created_at: string;
  updated_at: string;
}

export interface ServiceRow {
  id: string;
  provider_user_id: string;
  name: string;
  duration_minutes: number;
  price_cents: number | null;
  modality: "in_person" | "remote";
  active: number;
  public_visible: number;
  created_at: string;
  updated_at: string;
}

export interface AppointmentRow {
  id: string;
  provider_user_id: string;
  service_id: string;
  patient_id: string | null;
  starts_at_local: string;
  ends_at_local: string;
  timezone: string;
  status: AppointmentStatus;
  source: "public" | "professional" | "waitlist";
  booking_token_hash: string;
  guardian_name_encrypted: string | null;
  guardian_email_encrypted: string | null;
  guardian_phone_encrypted: string | null;
  patient_name_encrypted: string | null;
  amount_cents: number | null;
  payment_status: "pending" | "paid" | "waived" | "refunded";
  payment_method: string | null;
  checked_in_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  created_at: string;
  updated_at: string;
  service_name?: string;
  service_modality?: "in_person" | "remote";
}

const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS booking_provider_profiles (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    slug TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    specialty TEXT NOT NULL,
    location_label TEXT,
    timezone TEXT NOT NULL DEFAULT 'America/Recife',
    booking_enabled INTEGER NOT NULL DEFAULT 0 CHECK (booking_enabled IN (0,1)),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS booking_services (
    id TEXT PRIMARY KEY,
    provider_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes BETWEEN 10 AND 480),
    price_cents INTEGER CHECK (price_cents IS NULL OR price_cents BETWEEN 0 AND 100000000),
    modality TEXT NOT NULL DEFAULT 'in_person' CHECK (modality IN ('in_person','remote')),
    active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
    public_visible INTEGER NOT NULL DEFAULT 1 CHECK (public_visible IN (0,1)),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_booking_services_provider ON booking_services(provider_user_id, active, public_visible)`,
  `CREATE TABLE IF NOT EXISTS booking_availability_rules (
    id TEXT PRIMARY KEY,
    provider_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    weekday INTEGER NOT NULL CHECK (weekday BETWEEN 0 AND 6),
    start_minute INTEGER NOT NULL CHECK (start_minute BETWEEN 0 AND 1439),
    end_minute INTEGER NOT NULL CHECK (end_minute BETWEEN 1 AND 1440),
    slot_minutes INTEGER NOT NULL DEFAULT 30 CHECK (slot_minutes BETWEEN 5 AND 240),
    active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (end_minute > start_minute)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_booking_rules_provider_weekday ON booking_availability_rules(provider_user_id, weekday, active)`,
  `CREATE TABLE IF NOT EXISTS booking_blocks (
    id TEXT PRIMARY KEY,
    provider_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    starts_at_local TEXT NOT NULL,
    ends_at_local TEXT NOT NULL,
    reason TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (ends_at_local > starts_at_local)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_booking_blocks_provider_time ON booking_blocks(provider_user_id, starts_at_local, ends_at_local)`,
  `CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY,
    provider_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_id TEXT NOT NULL REFERENCES booking_services(id) ON DELETE RESTRICT,
    patient_id TEXT,
    starts_at_local TEXT NOT NULL,
    ends_at_local TEXT NOT NULL,
    timezone TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','confirmed','checked_in','in_care','completed','cancelled','no_show')),
    source TEXT NOT NULL DEFAULT 'public' CHECK (source IN ('public','professional','waitlist')),
    booking_token_hash TEXT NOT NULL UNIQUE,
    guardian_name_encrypted TEXT,
    guardian_email_encrypted TEXT,
    guardian_phone_encrypted TEXT,
    patient_name_encrypted TEXT,
    amount_cents INTEGER CHECK (amount_cents IS NULL OR amount_cents BETWEEN 0 AND 100000000),
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','waived','refunded')),
    payment_method TEXT,
    checked_in_at DATETIME,
    completed_at DATETIME,
    cancelled_at DATETIME,
    cancel_reason TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (ends_at_local > starts_at_local)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_appointments_provider_time ON appointments(provider_user_id, starts_at_local)`,
  `CREATE INDEX IF NOT EXISTS idx_appointments_provider_status ON appointments(provider_user_id, status, starts_at_local)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS ux_appointments_occupied_slot ON appointments(provider_user_id, starts_at_local) WHERE status IN ('requested','confirmed','checked_in','in_care')`,
  `CREATE TABLE IF NOT EXISTS appointment_slot_locks (
    provider_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    slot_key TEXT NOT NULL,
    appointment_id TEXT NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    PRIMARY KEY (provider_user_id, slot_key)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_appointment_slot_locks_appointment ON appointment_slot_locks(appointment_id)`,
  `CREATE TABLE IF NOT EXISTS waitlist_entries (
    id TEXT PRIMARY KEY,
    provider_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_id TEXT NOT NULL REFERENCES booking_services(id) ON DELETE CASCADE,
    preferred_date TEXT,
    status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting','offered','booked','closed')),
    access_token_hash TEXT NOT NULL UNIQUE,
    guardian_name_encrypted TEXT,
    guardian_email_encrypted TEXT,
    guardian_phone_encrypted TEXT,
    patient_name_encrypted TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_waitlist_provider_status ON waitlist_entries(provider_user_id, status, created_at)`,
  `CREATE TABLE IF NOT EXISTS appointment_reviews (
    id TEXT PRIMARY KEY,
    appointment_id TEXT NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
    provider_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment_encrypted TEXT,
    approved INTEGER NOT NULL DEFAULT 0 CHECK (approved IN (0,1)),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_reviews_provider_approved ON appointment_reviews(provider_user_id, approved, created_at DESC)`,
  `CREATE TABLE IF NOT EXISTS notification_outbox (
    id TEXT PRIMARY KEY,
    appointment_id TEXT REFERENCES appointments(id) ON DELETE CASCADE,
    provider_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    channel TEXT NOT NULL DEFAULT 'manual' CHECK (channel IN ('manual','email','whatsapp','sms')),
    template TEXT NOT NULL,
    recipient_encrypted TEXT,
    payload_encrypted TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending_provider' CHECK (status IN ('pending_provider','manual_sent','delivered','failed')),
    provider_message_id TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_notification_outbox_provider_status ON notification_outbox(provider_user_id, status, created_at DESC)`,
] as const;

export async function ensureOperationsSchema(db: D1Database): Promise<void> {
  await db.batch(SCHEMA_STATEMENTS.map((sql) => db.prepare(sql)));
}

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

export function errorResponse(message: string, code: string, status: number): Response {
  return jsonResponse({ error: message, code }, status);
}

export function cleanText(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function cleanOptionalText(value: unknown, max: number): string | null {
  const text = cleanText(value, max);
  return text || null;
}

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50) || "neuroped";
}

export function validSlug(value: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]{0,48}[a-z0-9])?$/.test(value);
}

export async function ensureProviderProfile(
  db: D1Database,
  user: ProviderIdentity,
): Promise<ProviderRow> {
  const existing = await db
    .prepare(`SELECT * FROM booking_provider_profiles WHERE user_id = ? LIMIT 1`)
    .bind(user.id)
    .first<ProviderRow>();
  if (existing) return existing;

  const base = slugify(user.name || "neuroped");
  let slug = base;
  const conflict = await db
    .prepare(`SELECT user_id FROM booking_provider_profiles WHERE slug = ? LIMIT 1`)
    .bind(slug)
    .first<{ user_id: string }>();
  if (conflict) slug = `${base.slice(0, 38)}-${user.id.slice(0, 8)}`;

  await db
    .prepare(
      `INSERT INTO booking_provider_profiles
        (user_id, slug, display_name, specialty, timezone, booking_enabled)
       VALUES (?, ?, ?, 'Neuropediatria', 'America/Recife', 0)`,
    )
    .bind(user.id, slug, user.name || "NeuroPed")
    .run();

  return (await db
    .prepare(`SELECT * FROM booking_provider_profiles WHERE user_id = ? LIMIT 1`)
    .bind(user.id)
    .first<ProviderRow>())!;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
  return out;
}

async function operationalKey(env: OperationsEnv): Promise<CryptoKey> {
  const source = env.OPERATIONAL_DATA_KEY?.trim() || env.NEUROPED_JWT_SECRET?.trim();
  if (!source || source.length < 32) throw new Error("OPERATIONAL_CRYPTO_NOT_CONFIGURED");
  const material = new TextEncoder().encode(`neuroped-operational-v1:${source}`);
  const digest = await crypto.subtle.digest("SHA-256", material);
  return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

export async function encryptText(env: OperationsEnv, value: string | null): Promise<string | null> {
  if (!value) return null;
  const key = await operationalKey(env);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(value),
  );
  return `v1.${bytesToBase64(iv)}.${bytesToBase64(new Uint8Array(ciphertext))}`;
}

export async function decryptText(env: OperationsEnv, value: string | null): Promise<string | null> {
  if (!value) return null;
  const [version, ivB64, cipherB64] = value.split(".");
  if (version !== "v1" || !ivB64 || !cipherB64) return null;
  try {
    const key = await operationalKey(env);
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: base64ToBytes(ivB64) },
      key,
      base64ToBytes(cipherB64),
    );
    return new TextDecoder().decode(plain);
  } catch {
    return null;
  }
}

export async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function randomAccessToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return bytesToBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function serviceToApi(row: ServiceRow): BookingService {
  return {
    id: row.id,
    providerUserId: row.provider_user_id,
    name: row.name,
    durationMinutes: row.duration_minutes,
    priceCents: row.price_cents,
    modality: row.modality,
    active: Boolean(row.active),
    publicVisible: Boolean(row.public_visible),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function profileToApi(row: ProviderRow) {
  return {
    userId: row.user_id,
    slug: row.slug,
    displayName: row.display_name,
    specialty: row.specialty,
    locationLabel: row.location_label,
    timezone: row.timezone,
    bookingEnabled: Boolean(row.booking_enabled),
    updatedAt: row.updated_at,
  };
}

export async function appointmentToApi(env: OperationsEnv, row: AppointmentRow) {
  return {
    id: row.id,
    providerUserId: row.provider_user_id,
    serviceId: row.service_id,
    patientId: row.patient_id,
    startsAtLocal: row.starts_at_local,
    endsAtLocal: row.ends_at_local,
    timezone: row.timezone,
    status: row.status,
    source: row.source,
    guardianName: await decryptText(env, row.guardian_name_encrypted),
    guardianEmail: await decryptText(env, row.guardian_email_encrypted),
    guardianPhone: await decryptText(env, row.guardian_phone_encrypted),
    patientName: await decryptText(env, row.patient_name_encrypted),
    amountCents: row.amount_cents,
    paymentStatus: row.payment_status,
    paymentMethod: row.payment_method,
    checkedInAt: row.checked_in_at,
    completedAt: row.completed_at,
    cancelledAt: row.cancelled_at,
    cancelReason: row.cancel_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    serviceName: row.service_name,
    serviceModality: row.service_modality,
  };
}

export function slotLockStatements(
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

/**
 * Use somente imediatamente após um UPDATE/DELETE condicional no mesmo D1.batch.
 * `changes()` é 1 apenas quando a mutação anterior venceu o controle otimista;
 * assim uma requisição obsoleta não libera os locks de uma transição concorrente.
 */
export function releaseSlotLocksAfterSuccessfulMutationStatement(
  db: D1Database,
  appointmentId: string,
): D1PreparedStatement {
  return db
    .prepare(`DELETE FROM appointment_slot_locks WHERE appointment_id = ? AND changes() = 1`)
    .bind(appointmentId);
}

export function slotLockStatementsForAppointmentState(
  db: D1Database,
  providerUserId: string,
  appointmentId: string,
  startsAtLocal: string,
  endsAtLocal: string,
  status: AppointmentStatus,
): D1PreparedStatement[] {
  return appointmentSlotKeys(startsAtLocal, endsAtLocal).map((slotKey) =>
    db.prepare(
      `INSERT INTO appointment_slot_locks (provider_user_id, slot_key, appointment_id)
       SELECT ?, ?, ?
        WHERE EXISTS (
          SELECT 1 FROM appointments
           WHERE id = ? AND provider_user_id = ? AND status = ?
             AND starts_at_local = ? AND ends_at_local = ?
        )`,
    ).bind(
      providerUserId,
      slotKey,
      appointmentId,
      appointmentId,
      providerUserId,
      status,
      startsAtLocal,
      endsAtLocal,
    ),
  );
}

export function parseStatus(value: unknown): AppointmentStatus | null {
  return typeof value === "string" && appointmentStatuses.includes(value as AppointmentStatus)
    ? (value as AppointmentStatus)
    : null;
}

export function parsePaymentStatus(value: unknown) {
  return typeof value === "string" && paymentStatuses.includes(value as (typeof paymentStatuses)[number])
    ? (value as (typeof paymentStatuses)[number])
    : null;
}

export function parseModality(value: unknown): "in_person" | "remote" | null {
  return typeof value === "string" && bookingModalities.includes(value as "in_person" | "remote")
    ? (value as "in_person" | "remote")
    : null;
}

function weekdayForLocalDate(date: string): number {
  return new Date(`${date}T12:00:00Z`).getUTCDay();
}

function localDateTime(date: string, minuteOfDay: number): string {
  return `${date}T${minutesToClock(minuteOfDay)}`;
}

export async function listAvailableSlots(
  db: D1Database,
  providerUserId: string,
  service: ServiceRow,
  date: string,
): Promise<PublicSlot[]> {
  if (!isValidLocalDate(date)) return [];
  const weekday = weekdayForLocalDate(date);
  const rules = await db
    .prepare(
      `SELECT start_minute, end_minute, slot_minutes
         FROM booking_availability_rules
        WHERE provider_user_id = ? AND weekday = ? AND active = 1
        ORDER BY start_minute`,
    )
    .bind(providerUserId, weekday)
    .all<{ start_minute: number; end_minute: number; slot_minutes: number }>();

  const dayStart = `${date}T00:00`;
  const dayEnd = `${date}T23:59`;
  const blocks = await db
    .prepare(
      `SELECT starts_at_local, ends_at_local
         FROM booking_blocks
        WHERE provider_user_id = ?
          AND starts_at_local < ? AND ends_at_local > ?`,
    )
    .bind(providerUserId, dayEnd, dayStart)
    .all<{ starts_at_local: string; ends_at_local: string }>();

  const appointments = await db
    .prepare(
      `SELECT starts_at_local, ends_at_local
         FROM appointments
        WHERE provider_user_id = ?
          AND status IN ('requested','confirmed','checked_in','in_care')
          AND starts_at_local < ? AND ends_at_local > ?`,
    )
    .bind(providerUserId, dayEnd, dayStart)
    .all<{ starts_at_local: string; ends_at_local: string }>();

  const slots: PublicSlot[] = [];
  for (const rule of rules.results ?? []) {
    const step = Math.max(5, rule.slot_minutes);
    for (
      let minute = rule.start_minute;
      minute + service.duration_minutes <= rule.end_minute;
      minute += step
    ) {
      const startsAtLocal = localDateTime(date, minute);
      const endsAtLocal = addMinutesLocal(startsAtLocal, service.duration_minutes);
      const blocked = (blocks.results ?? []).some((block) =>
        overlapsLocal(startsAtLocal, endsAtLocal, block.starts_at_local, block.ends_at_local),
      );
      if (blocked) continue;
      const occupied = (appointments.results ?? []).some((appointment) =>
        overlapsLocal(startsAtLocal, endsAtLocal, appointment.starts_at_local, appointment.ends_at_local),
      );
      if (!occupied) slots.push({ startsAtLocal, endsAtLocal });
    }
  }
  return slots;
}

export async function getProviderBySlug(db: D1Database, slug: string): Promise<ProviderRow | null> {
  return (
    (await db
      .prepare(`SELECT * FROM booking_provider_profiles WHERE slug = ? LIMIT 1`)
      .bind(slug)
      .first<ProviderRow>()) ?? null
  );
}

export async function getService(
  db: D1Database,
  providerUserId: string,
  serviceId: string,
  publicOnly = false,
): Promise<ServiceRow | null> {
  const row = await db
    .prepare(
      `SELECT * FROM booking_services
        WHERE id = ? AND provider_user_id = ? ${publicOnly ? "AND active = 1 AND public_visible = 1" : ""}
        LIMIT 1`,
    )
    .bind(serviceId, providerUserId)
    .first<ServiceRow>();
  return row ?? null;
}

export async function findAppointmentByToken(
  db: D1Database,
  token: string,
): Promise<AppointmentRow | null> {
  if (token.length < 20 || token.length > 200) return null;
  const hash = await sha256(token);
  const row = await db
    .prepare(
      `SELECT a.*, s.name AS service_name, s.modality AS service_modality
         FROM appointments a
         JOIN booking_services s ON s.id = a.service_id
        WHERE a.booking_token_hash = ?
        LIMIT 1`,
    )
    .bind(hash)
    .first<AppointmentRow>();
  return row ?? null;
}

export async function enqueueNotification(
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

export function assertLocalDateTime(value: unknown): string | null {
  const text = cleanText(value, 16);
  return isValidLocalDateTime(text) ? text : null;
}
