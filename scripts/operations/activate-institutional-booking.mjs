/** Ativação auditada do agendamento online do proprietário institucional (#963 A, #1039).
 *
 * Grava, numa única transação D1, o que o proprietário faria em /agenda
 * (Disponibilidade + Página pública): perfil público com booking_enabled=1,
 * um serviço, as regras semanais e os feriados futuros, na clínica
 * institucional criada por provision-institutional-agenda.mjs.
 *
 * Trava de consentimento: sem `confirmedByOwner: true` no arquivo de
 * configuração, o script só LÊ e registra um recibo (contagens, sem PHI).
 * Nunca sobrescreve configuração feita à mão: se já houver serviço, regra ou
 * agendamento ativo, para e pede revisão.
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const fail = (code) => { throw new Error(`BOOKING_ACTIVATION_${code}`); };
const MARKER = 'institutional-booking-v1';
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,48}[a-z0-9])?$/;
const HHMM_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const text = (value, max, min = 1) => {
  const out = typeof value === 'string' ? value.trim() : '';
  return out.length >= min && out.length <= max ? out : null;
};
const intIn = (value, min, max) => (Number.isInteger(value) && value >= min && value <= max ? value : null);
const minuteOf = (hhmm) => { const m = HHMM_RE.exec(hhmm ?? ''); return m ? Number(m[1]) * 60 + Number(m[2]) : null; };

export function slugifyName(value) {
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50).replace(/-+$/g, '');
}

/** Valida e normaliza o arquivo de configuração; qualquer desvio falha fechado. */
export function normalizeBookingConfig(config) {
  if (!config || config.version !== 1 || typeof config.confirmedByOwner !== 'boolean') fail('CONFIG_INVALID');
  const p = config.profile ?? {};
  const displayName = text(p.displayName, 120, 2);
  const specialty = text(p.specialty, 120, 2);
  const locationLabel = p.locationLabel === null ? null : text(p.locationLabel, 180);
  const timezone = text(p.timezone, 80);
  const slug = p.slug === null ? null : text(p.slug, 50);
  if (!displayName || !specialty || (p.locationLabel !== null && !locationLabel) || timezone !== 'America/Recife') fail('CONFIG_INVALID');
  if (slug !== null && !SLUG_RE.test(slug)) fail('CONFIG_INVALID');
  const s = config.service ?? {};
  const service = {
    name: text(s.name, 100),
    durationMinutes: intIn(s.durationMinutes, 10, 480),
    priceCents: s.priceCents === null ? null : intIn(s.priceCents, 0, 100000000),
    modality: s.modality === 'remote' ? 'remote' : s.modality === 'in_person' ? 'in_person' : null,
  };
  if (!service.name || service.durationMinutes === null || (s.priceCents !== null && service.priceCents === null) || !service.modality) fail('CONFIG_INVALID');
  if (!Array.isArray(config.rules) || config.rules.length < 1 || config.rules.length > 14) fail('CONFIG_INVALID');
  const rules = config.rules.map((r) => {
    const weekday = intIn(r?.weekday, 0, 6);
    const startMinute = minuteOf(r?.start);
    const endMinute = minuteOf(r?.end);
    const slotMinutes = intIn(r?.slotMinutes, 5, 240);
    if (weekday === null || startMinute === null || endMinute === null || slotMinutes === null
      || endMinute <= startMinute || endMinute - startMinute < service.durationMinutes) fail('CONFIG_INVALID');
    return { weekday, startMinute, endMinute, slotMinutes };
  });
  const holidays = Array.isArray(config.holidays) ? config.holidays : fail('CONFIG_INVALID');
  if (holidays.length > 30) fail('CONFIG_INVALID');
  const blocks = holidays.map((h) => {
    const date = DATE_RE.test(h?.date ?? '') && !Number.isNaN(Date.parse(`${h.date}T00:00:00Z`)) ? h.date : null;
    const reason = text(h?.reason, 160);
    if (!date || !reason) fail('CONFIG_INVALID');
    return { date, reason };
  });
  return { confirmedByOwner: config.confirmedByOwner, profile: { displayName, specialty, locationLabel, timezone, slug }, service, rules, blocks };
}

function nextLocalDay(date) {
  const d = new Date(`${date}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + 1);
  return `${d.toISOString().slice(0, 10)}T00:00`;
}

/** Mesmo filtro do diretório público (functions/api/public-booking.ts, publicProviders sem ?clinic). */
const PUBLIC_DIRECTORY_SQL = `SELECT p.slug FROM booking_provider_profiles p
  WHERE p.user_id = ? AND p.booking_enabled = 1
    AND EXISTS (SELECT 1 FROM booking_services s
      JOIN clinic_memberships cm ON cm.clinic_id = s.clinic_id AND cm.user_id = s.provider_user_id AND cm.active = 1
      JOIN clinics c ON c.id = cm.clinic_id AND c.status = 'active'
      WHERE s.provider_user_id = p.user_id AND s.active = 1 AND s.public_visible = 1
        AND (SELECT COUNT(*) FROM clinic_memberships sole WHERE sole.user_id = p.user_id AND sole.active = 1) = 1)`;

export async function activateInstitutionalBooking({ query, batch }, { ownerEmail, e2eEmail, config, apply = false, runId = 'local-test', today }) {
  const cfg = normalizeBookingConfig(config);
  const email = String(ownerEmail ?? '').trim().toLowerCase();
  const reserved = String(e2eEmail ?? '').trim().toLowerCase();
  if (!email || !reserved || email === reserved) fail('OWNER_IDENTITY_REQUIRED');
  if (!DATE_RE.test(today ?? '')) fail('TODAY_REQUIRED');
  const users = await query('SELECT id, name, role, is_active FROM users WHERE lower(email) = ?', [email]);
  if (users.length !== 1 || users[0].role !== 'admin' || users[0].is_active !== 1) fail('OWNER_NOT_UNIQUE_ACTIVE_ADMIN');
  const userId = users[0].id;
  // Mesmo id determinístico de provision-institutional-agenda.mjs.
  const suffix = createHash('sha256').update(`neuroped:institutional:${userId}`).digest('hex').slice(0, 24);
  const clinicId = `institutional-${suffix}`;
  const auditId = `${MARKER}-${suffix}`;

  const [ctx] = await query(`SELECT
      (SELECT COUNT(*) FROM clinics WHERE id = ? AND status = 'active') AS clinic_active,
      (SELECT COUNT(*) FROM clinic_memberships WHERE clinic_id = ? AND user_id = ? AND role = 'owner' AND active = 1) AS owner_membership,
      (SELECT COUNT(*) FROM clinic_memberships WHERE user_id = ? AND active = 1) AS active_memberships,
      (SELECT COUNT(*) FROM billing_customers WHERE clinic_id = ? AND status = 'active') AS customer_active`,
    [clinicId, clinicId, userId, userId, clinicId]);
  const contextReady = ctx?.clinic_active === 1 && ctx.owner_membership === 1 && ctx.active_memberships === 1 && ctx.customer_active === 1;

  const [state] = await query(`SELECT
      (SELECT COUNT(*) FROM booking_provider_profiles WHERE user_id = ?) AS profile_exists,
      (SELECT COALESCE(MAX(booking_enabled), 0) FROM booking_provider_profiles WHERE user_id = ?) AS booking_enabled,
      (SELECT slug FROM booking_provider_profiles WHERE user_id = ?) AS current_slug,
      (SELECT COUNT(*) FROM booking_services WHERE provider_user_id = ?) AS services,
      (SELECT COUNT(*) FROM booking_availability_rules WHERE provider_user_id = ?) AS rules,
      (SELECT COUNT(*) FROM booking_blocks WHERE provider_user_id = ?) AS blocks,
      (SELECT COUNT(*) FROM appointments WHERE provider_user_id = ? AND status NOT IN ('cancelled','no_show','completed')) AS open_appointments,
      (SELECT COUNT(*) FROM saas_audit_log WHERE id = ?) AS activation_audit`,
    [userId, userId, userId, userId, userId, userId, userId, auditId]);
  const listed = (await query(PUBLIC_DIRECTORY_SQL, [userId])).length === 1;
  const snapshot = {
    institutionalContextReady: contextReady,
    profileExists: state.profile_exists === 1,
    bookingEnabled: state.booking_enabled === 1,
    services: state.services,
    rules: state.rules,
    blocks: state.blocks,
    openAppointments: state.open_appointments,
    publicDirectoryListed: listed,
  };

  if (state.activation_audit === 1) {
    if (!listed) fail('EXISTING_ACTIVATION_CHANGED_REVIEW_REQUIRED');
    return { status: 'already_activated', slug: state.current_slug, writes: 0, snapshot };
  }
  if (!contextReady) fail('INSTITUTIONAL_CONTEXT_MISSING');
  if (!cfg.confirmedByOwner) return { status: 'awaiting_owner_confirmation', writes: 0, snapshot };
  if (!apply) return { status: 'ready_to_apply', writes: 0, snapshot };
  // Configuração feita à mão em /agenda nunca é sobrescrita.
  if (state.services !== 0 || state.rules !== 0 || state.blocks !== 0 || state.booking_enabled !== 0 || state.open_appointments !== 0) {
    fail('EXISTING_CONFIGURATION_REVIEW_REQUIRED');
  }
  const slug = cfg.profile.slug ?? state.current_slug ?? slugifyName(cfg.profile.displayName);
  if (!SLUG_RE.test(slug)) fail('CONFIG_INVALID');
  const taken = await query('SELECT user_id FROM booking_provider_profiles WHERE slug = ? AND user_id <> ?', [slug, userId]);
  if (taken.length) fail('SLUG_CONFLICT');

  const now = new Date().toISOString();
  const serviceId = `svc-${MARKER}-${suffix}`;
  const futureBlocks = cfg.blocks.filter((b) => b.date >= today);
  const metadata = JSON.stringify({ version: 1, issue: 963, source: MARKER, runId, rules: cfg.rules.length,
    holidayBlocks: futureBlocks.length, durationMinutes: cfg.service.durationMinutes, modality: cfg.service.modality });
  // Primeira instrução: revalida TODAS as pré-condições dentro da transação;
  // json(invalid) aborta o batch inteiro se algo mudou desde a leitura.
  const guard = `SELECT CASE WHEN
      (SELECT COUNT(*) FROM users WHERE id = ? AND lower(email) = ? AND role = 'admin' AND is_active = 1) = 1
      AND (SELECT COUNT(*) FROM clinics WHERE id = ? AND status = 'active') = 1
      AND (SELECT COUNT(*) FROM clinic_memberships WHERE clinic_id = ? AND user_id = ? AND role = 'owner' AND active = 1) = 1
      AND (SELECT COUNT(*) FROM clinic_memberships WHERE user_id = ? AND active = 1) = 1
      AND (SELECT COUNT(*) FROM booking_services WHERE provider_user_id = ?) = 0
      AND (SELECT COUNT(*) FROM booking_availability_rules WHERE provider_user_id = ?) = 0
      AND (SELECT COUNT(*) FROM booking_blocks WHERE provider_user_id = ?) = 0
      AND (SELECT COUNT(*) FROM booking_provider_profiles WHERE user_id = ? AND booking_enabled = 1) = 0
      AND (SELECT COUNT(*) FROM booking_provider_profiles WHERE slug = ? AND user_id <> ?) = 0
      AND (SELECT COUNT(*) FROM saas_audit_log WHERE id = ?) = 0
    THEN 1 ELSE json('BOOKING_ACTIVATION_PRECONDITION_FAILED') END AS ok`;
  await batch([
    { sql: guard, params: [userId, email, clinicId, clinicId, userId, userId, userId, userId, userId, userId, slug, userId, auditId] },
    { sql: `INSERT INTO booking_provider_profiles (user_id, slug, display_name, specialty, location_label, timezone, booking_enabled, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET slug = excluded.slug, display_name = excluded.display_name, specialty = excluded.specialty,
          location_label = excluded.location_label, timezone = excluded.timezone, booking_enabled = 1, updated_at = excluded.updated_at`,
      params: [userId, slug, cfg.profile.displayName, cfg.profile.specialty, cfg.profile.locationLabel, cfg.profile.timezone, now, now] },
    { sql: `INSERT INTO booking_services (id, provider_user_id, clinic_id, name, duration_minutes, price_cents, modality, active, public_visible, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, ?, ?)`,
      params: [serviceId, userId, clinicId, cfg.service.name, cfg.service.durationMinutes, cfg.service.priceCents, cfg.service.modality, now, now] },
    ...cfg.rules.map((r, i) => ({ sql: `INSERT INTO booking_availability_rules (id, provider_user_id, clinic_id, weekday, start_minute, end_minute, slot_minutes, active, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`, params: [`rule-${MARKER}-${suffix}-${i + 1}`, userId, clinicId, r.weekday, r.startMinute, r.endMinute, r.slotMinutes, now] })),
    ...futureBlocks.map((b) => ({ sql: `INSERT INTO booking_blocks (id, provider_user_id, clinic_id, starts_at_local, ends_at_local, reason, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)`, params: [`blk-${MARKER}-${suffix}-${b.date}`, userId, clinicId, `${b.date}T00:00`, nextLocalDay(b.date), b.reason, now] })),
    { sql: `INSERT INTO saas_audit_log (id, clinic_id, actor_user_id, action, target_type, target_id, metadata_json)
        VALUES (?, ?, ?, 'institutional_booking_activated', 'provider_profile', ?, ?)`, params: [auditId, clinicId, userId, userId, metadata] },
  ]);
  if ((await query(PUBLIC_DIRECTORY_SQL, [userId])).length !== 1) fail('POSTCONDITION_NOT_PROVEN');
  return { status: 'activated', slug, writes: 3 + cfg.rules.length + futureBlocks.length,
    rulesCreated: cfg.rules.length, holidayBlocksCreated: futureBlocks.length, publicDirectoryListed: true };
}

async function main() {
  const output = 'artifacts/booking-activation/result.json';
  mkdirSync('artifacts/booking-activation', { recursive: true });
  let mutationAttempted = false;
  let providerFailure;
  const save = (data) => writeFileSync(output, JSON.stringify({ checkedAt: new Date().toISOString(), commit: process.env.GITHUB_SHA, run: process.env.GITHUB_RUN_ID, ...data }, null, 2));
  try {
    if (process.env.GITHUB_REPOSITORY !== 'jadsonfraga/neuroped' || process.env.GITHUB_REF !== 'refs/heads/main') fail('TRUSTED_MAIN_REQUIRED');
    const account = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
    const token = process.env.CLOUDFLARE_API_TOKEN?.trim();
    if (!account || !token) fail('CREDENTIALS_UNAVAILABLE');
    const databaseId = /database_id\s*=\s*"([a-f0-9-]+)"/.exec(readFileSync('wrangler.toml', 'utf8'))?.[1];
    if (!databaseId) fail('DATABASE_ID_MISSING');
    async function cf(path, body) {
      const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}${path}`, {
        method: body ? 'POST' : 'GET', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(30000),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || data?.success !== true) {
        providerFailure = { httpStatus: response.status,
          codes: Array.isArray(data?.errors) ? data.errors.map((item) => item.code).filter(Number.isInteger).slice(0, 5) : [] };
        fail('PROVIDER_REQUEST_FAILED');
      }
      return data.result;
    }
    const project = await cf('/pages/projects/neuroped');
    if (project?.name !== 'neuroped' || project?.deployment_configs?.production?.d1_databases?.DB?.id !== databaseId) fail('CANONICAL_BINDING_MISMATCH');
    const path = `/d1/database/${databaseId}/query`;
    const adapter = {
      query: async (sql, params = []) => {
        if (!/^SELECT\s/i.test(sql) || sql.includes(';')) fail('READ_QUERY_REQUIRED');
        const result = await cf(path, { sql, params });
        if (result?.length !== 1 || result[0].success !== true) fail('QUERY_FAILED');
        return result[0].results;
      },
      batch: async (statements) => {
        mutationAttempted = true;
        const result = await cf(path, { batch: statements });
        if (result?.length !== statements.length || result.some((item) => item.success !== true)) fail('ATOMIC_BATCH_FAILED');
      },
    };
    const config = JSON.parse(readFileSync('scripts/operations/institutional-booking.config.json', 'utf8'));
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Recife' }).format(new Date());
    const result = await activateInstitutionalBooking(adapter, { ownerEmail: process.env.INSTITUTIONAL_OWNER_EMAIL,
      e2eEmail: process.env.NEUROPED_E2E_EMAIL, config, apply: process.argv.includes('--apply'), runId: process.env.GITHUB_RUN_ID, today });
    save(result); console.log(JSON.stringify(result));
  } catch (error) {
    const code = /^BOOKING_ACTIVATION_[A-Z_]+$/.test(error?.message || '') ? error.message : 'BOOKING_ACTIVATION_FAILED';
    save({ status: 'blocked', code, mutationAttempted, providerFailure }); console.error(code); process.exitCode = 1;
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await main();
