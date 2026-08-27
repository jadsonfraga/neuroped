import { sha256Hex } from "../auth/_crypto";
import {
  getClinicMembership,
  tenantError,
  tenantJson,
  type ClinicMembership,
  type TenantEnv,
} from "../tenant/_core";
import type { PublicUser } from "../auth/_shared";

export type HubEnv = TenantEnv & {
  OPERATIONAL_DATA_KEY?: string;
};

export const ONBOARDING_STEP_DEFINITIONS = [
  { key: "clinic_profile", label: "Completar perfil da clínica", position: 10, required: 1 },
  { key: "invite_team", label: "Convidar a equipe", position: 20, required: 1 },
  { key: "configure_services", label: "Configurar serviços e duração", position: 30, required: 1 },
  { key: "configure_availability", label: "Definir disponibilidade", position: 40, required: 1 },
  { key: "first_appointment", label: "Registrar o primeiro agendamento", position: 50, required: 0 },
] as const;

export const DEFAULT_COMMUNICATION_TEMPLATES = [
  {
    templateKey: "appointment_confirmed",
    name: "Consulta confirmada",
    description: "Confirmação transacional de um agendamento.",
    channels: ["email", "whatsapp"],
    subject: "Consulta confirmada na {{clinic_name}}",
    body: "Olá, {{recipient_name}}. Sua consulta foi confirmada para {{appointment_time}}. Em caso de dúvida, responda esta mensagem.",
  },
  {
    templateKey: "appointment_reminder",
    name: "Lembrete de consulta",
    description: "Lembrete antes do horário agendado.",
    channels: ["email", "whatsapp", "sms"],
    subject: "Lembrete de consulta — {{appointment_time}}",
    body: "Olá, {{recipient_name}}. Este é um lembrete da sua consulta em {{appointment_time}} na {{clinic_name}}.",
  },
  {
    templateKey: "nps_request",
    name: "Pesquisa de satisfação",
    description: "Convite para responder ao NPS após a consulta.",
    channels: ["email", "whatsapp"],
    subject: "Como foi sua experiência na {{clinic_name}}?",
    body: "Olá, {{recipient_name}}. Sua opinião ajuda a melhorar o cuidado. Responda à pesquisa de satisfação pelo link enviado.",
  },
] as const;

const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS onboarding_steps (
    id TEXT PRIMARY KEY,
    clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    step_key TEXT NOT NULL,
    label TEXT NOT NULL,
    position INTEGER NOT NULL CHECK (position > 0),
    required INTEGER NOT NULL DEFAULT 1 CHECK (required IN (0,1)),
    completed INTEGER NOT NULL DEFAULT 0 CHECK (completed IN (0,1)),
    completed_at DATETIME,
    completed_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (clinic_id, step_key)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_onboarding_steps_clinic_position
    ON onboarding_steps(clinic_id, position)`,
  `CREATE TABLE IF NOT EXISTS tenant_webhook_events (
    id TEXT PRIMARY KEY,
    clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    delivery_status TEXT NOT NULL DEFAULT 'queued'
      CHECK (delivery_status IN ('queued','processing','delivered','failed')),
    attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
    next_attempt_at DATETIME,
    delivered_at DATETIME,
    last_error TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_tenant_webhook_events_delivery
    ON tenant_webhook_events(delivery_status, next_attempt_at, created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_tenant_webhook_events_clinic
    ON tenant_webhook_events(clinic_id, created_at DESC)`,
  `CREATE TABLE IF NOT EXISTS tenant_reactivation_requests (
    id TEXT PRIMARY KEY,
    clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    requested_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'pending'
      CHECK (status IN ('pending','approved','rejected','completed')),
    resolved_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    resolved_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_tenant_reactivation_clinic_status
    ON tenant_reactivation_requests(clinic_id, status, created_at DESC)`,
  `CREATE TABLE IF NOT EXISTS availability_templates (
    id TEXT PRIMARY KEY,
    provider_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    timezone TEXT NOT NULL DEFAULT 'America/Recife',
    rules_json TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_availability_templates_provider_active
    ON availability_templates(provider_user_id, active, updated_at DESC)`,
  `CREATE TABLE IF NOT EXISTS partner_directory (
    id TEXT PRIMARY KEY,
    clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    partner_type TEXT NOT NULL DEFAULT 'other'
      CHECK (partner_type IN ('school','therapist','psychologist','psychiatrist','hospital','laboratory','social_service','other')),
    contact_name_encrypted TEXT,
    email_encrypted TEXT,
    phone_encrypted TEXT,
    specialty TEXT,
    notes_encrypted TEXT,
    status TEXT NOT NULL DEFAULT 'active'
      CHECK (status IN ('active','paused','archived')),
    created_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_partner_directory_clinic_status
    ON partner_directory(clinic_id, status, name)`,
  `CREATE TABLE IF NOT EXISTS partner_referrals (
    id TEXT PRIMARY KEY,
    clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    partner_id TEXT NOT NULL REFERENCES partner_directory(id) ON DELETE RESTRICT,
    created_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    direction TEXT NOT NULL CHECK (direction IN ('inbound','outbound')),
    patient_reference_encrypted TEXT,
    patient_name_encrypted TEXT,
    guardian_contact_encrypted TEXT,
    notes_encrypted TEXT,
    status TEXT NOT NULL DEFAULT 'draft'
      CHECK (status IN ('draft','sent','received','accepted','completed','declined','cancelled')),
    referred_at DATETIME,
    completed_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_partner_referrals_clinic_status
    ON partner_referrals(clinic_id, status, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_partner_referrals_partner_time
    ON partner_referrals(partner_id, created_at DESC)`,
  `CREATE TRIGGER IF NOT EXISTS trg_partner_referral_same_clinic_insert
    BEFORE INSERT ON partner_referrals
    WHEN NOT EXISTS (
      SELECT 1 FROM partner_directory p
       WHERE p.id = NEW.partner_id AND p.clinic_id = NEW.clinic_id
    )
    BEGIN SELECT RAISE(ABORT, 'PARTNER_REFERRAL_TENANT_MISMATCH'); END`,
  `CREATE TRIGGER IF NOT EXISTS trg_partner_referral_same_clinic_update
    BEFORE UPDATE OF clinic_id, partner_id ON partner_referrals
    WHEN NOT EXISTS (
      SELECT 1 FROM partner_directory p
       WHERE p.id = NEW.partner_id AND p.clinic_id = NEW.clinic_id
    )
    BEGIN SELECT RAISE(ABORT, 'PARTNER_REFERRAL_TENANT_MISMATCH'); END`,
  `CREATE TABLE IF NOT EXISTS communication_templates (
    id TEXT PRIMARY KEY,
    clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    template_key TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    channels_json TEXT NOT NULL,
    subject_template TEXT,
    body_template TEXT NOT NULL,
    is_system INTEGER NOT NULL DEFAULT 0 CHECK (is_system IN (0,1)),
    active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
    created_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (clinic_id, template_key)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_communication_templates_clinic_active
    ON communication_templates(clinic_id, active, updated_at DESC)`,
  `CREATE TABLE IF NOT EXISTS communication_campaigns (
    id TEXT PRIMARY KEY,
    clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    template_id TEXT NOT NULL REFERENCES communication_templates(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    audience_filter_json TEXT NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'draft'
      CHECK (status IN ('draft','queued','sending','completed','cancelled')),
    scheduled_for DATETIME,
    sent_at DATETIME,
    created_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_communication_campaigns_clinic_status
    ON communication_campaigns(clinic_id, status, created_at DESC)`,
  `CREATE TRIGGER IF NOT EXISTS trg_communication_campaign_same_clinic_insert
    BEFORE INSERT ON communication_campaigns
    WHEN NOT EXISTS (
      SELECT 1 FROM communication_templates t
       WHERE t.id = NEW.template_id AND t.clinic_id = NEW.clinic_id
    )
    BEGIN SELECT RAISE(ABORT, 'COMMUNICATION_TEMPLATE_TENANT_MISMATCH'); END`,
  `CREATE TABLE IF NOT EXISTS communication_deliveries (
    id TEXT PRIMARY KEY,
    clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    campaign_id TEXT REFERENCES communication_campaigns(id) ON DELETE CASCADE,
    template_id TEXT REFERENCES communication_templates(id) ON DELETE SET NULL,
    appointment_id TEXT REFERENCES appointments(id) ON DELETE SET NULL,
    survey_id TEXT REFERENCES feedback_surveys(id) ON DELETE SET NULL,
    channel TEXT NOT NULL CHECK (channel IN ('email','whatsapp','sms','manual')),
    recipient_encrypted TEXT NOT NULL,
    subject_encrypted TEXT,
    body_encrypted TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued'
      CHECK (status IN ('queued','sending','sent','delivered','failed','cancelled')),
    provider_message_id TEXT,
    last_error TEXT,
    sent_at DATETIME,
    delivered_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_communication_deliveries_clinic_status
    ON communication_deliveries(clinic_id, status, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_communication_deliveries_campaign
    ON communication_deliveries(campaign_id, created_at DESC)`,
  `CREATE TRIGGER IF NOT EXISTS trg_communication_delivery_campaign_same_clinic
    BEFORE INSERT ON communication_deliveries
    WHEN NEW.campaign_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM communication_campaigns c
       WHERE c.id = NEW.campaign_id AND c.clinic_id = NEW.clinic_id
    )
    BEGIN SELECT RAISE(ABORT, 'COMMUNICATION_CAMPAIGN_TENANT_MISMATCH'); END`,
  `CREATE TABLE IF NOT EXISTS feedback_surveys (
    id TEXT PRIMARY KEY,
    clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    appointment_id TEXT UNIQUE REFERENCES appointments(id) ON DELETE SET NULL,
    provider_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    survey_type TEXT NOT NULL DEFAULT 'nps' CHECK (survey_type = 'nps'),
    token_hash TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending'
      CHECK (status IN ('pending','answered','expired','revoked')),
    score INTEGER CHECK (score BETWEEN 0 AND 10),
    comment_encrypted TEXT,
    expires_at DATETIME NOT NULL,
    answered_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_feedback_surveys_clinic_status
    ON feedback_surveys(clinic_id, status, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_feedback_surveys_provider_time
    ON feedback_surveys(provider_user_id, created_at DESC)`,
  `CREATE TABLE IF NOT EXISTS feedback_survey_events (
    id TEXT PRIMARY KEY,
    survey_id TEXT NOT NULL REFERENCES feedback_surveys(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('created','answered','expired','revoked')),
    metadata_json TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_feedback_survey_events_survey_time
    ON feedback_survey_events(survey_id, created_at DESC)`,
] as const;

export async function ensureSaasHubSchema(db: D1Database): Promise<void> {
  await db.batch(SCHEMA_STATEMENTS.map((sql) => db.prepare(sql)));
}

export async function seedClinicDefaults(db: D1Database, clinicId: string): Promise<void> {
  const statements: D1PreparedStatement[] = [];
  for (const step of ONBOARDING_STEP_DEFINITIONS) {
    statements.push(
      db.prepare(
        `INSERT OR IGNORE INTO onboarding_steps
          (id, clinic_id, step_key, label, position, required)
         VALUES (?, ?, ?, ?, ?, ?)`,
      ).bind(`onb-${crypto.randomUUID()}`, clinicId, step.key, step.label, step.position, step.required),
    );
  }
  for (const template of DEFAULT_COMMUNICATION_TEMPLATES) {
    statements.push(
      db.prepare(
        `INSERT OR IGNORE INTO communication_templates
          (id, clinic_id, template_key, name, description, channels_json,
           subject_template, body_template, is_system, created_by_user_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NULL)`,
      ).bind(
        `tpl-${crypto.randomUUID()}`,
        clinicId,
        template.templateKey,
        template.name,
        template.description,
        JSON.stringify(template.channels),
        template.subject,
        template.body,
      ),
    );
  }
  if (statements.length) await db.batch(statements);
}

export function hubJson(data: unknown, status = 200): Response {
  return tenantJson(data, status);
}

export function hubError(message: string, code: string, status: number): Response {
  return tenantError(message, code, status);
}

export function cleanHubText(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function cleanOptionalHubText(value: unknown, max: number): string | null {
  const valueText = cleanHubText(value, max);
  return valueText || null;
}

export function validEmail(value: string): boolean {
  return !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function clinicIdFromRequest(request: Request): string {
  const url = new URL(request.url);
  return (
    request.headers.get("x-clinic-id")
    ?? request.headers.get("x-tenant-id")
    ?? url.searchParams.get("clinicId")
    ?? ""
  ).trim().slice(0, 80);
}

export async function resolveHubClinic(
  db: D1Database,
  request: Request,
  user: PublicUser,
): Promise<{ clinicId: string; membership: ClinicMembership } | null> {
  const explicitClinicId = clinicIdFromRequest(request);
  if (explicitClinicId) {
    const membership = await getClinicMembership(db, explicitClinicId, user);
    return membership ? { clinicId: explicitClinicId, membership } : null;
  }
  const rows = await db.prepare(
    `SELECT clinic_id FROM clinic_memberships
      WHERE user_id = ? AND active = 1
      ORDER BY created_at ASC LIMIT 2`,
  ).bind(user.id).all<{ clinic_id: string }>();
  const memberships = rows.results ?? [];
  if (memberships.length !== 1) return null;
  const clinicId = memberships[0].clinic_id;
  const membership = await getClinicMembership(db, clinicId, user);
  return membership ? { clinicId, membership } : null;
}

export function readJsonObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "string") return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function parseJsonBody(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const parsed = await request.json();
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}

export async function writeHubAudit(
  db: D1Database,
  params: {
    clinicId: string;
    actorUserId: string;
    action: string;
    targetType: string;
    targetId?: string | null;
    metadata?: Record<string, string | number | boolean | null>;
  },
): Promise<void> {
  await db.prepare(
    `INSERT INTO saas_audit_log
      (id, clinic_id, actor_user_id, action, target_type, target_id, metadata_json)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    crypto.randomUUID(),
    params.clinicId,
    params.actorUserId,
    params.action,
    params.targetType,
    params.targetId ?? null,
    params.metadata ? JSON.stringify(params.metadata) : null,
  ).run();
}

export async function queueTenantWebhook(
  db: D1Database,
  clinicId: string,
  eventType: string,
  payload: Record<string, string | number | boolean | null>,
): Promise<void> {
  await db.prepare(
    `INSERT INTO tenant_webhook_events
      (id, clinic_id, event_type, payload_json, next_attempt_at)
     VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
  ).bind(`wh-${crypto.randomUUID()}`, clinicId, eventType, JSON.stringify(payload)).run();
}

export function base64UrlToken(byteLength = 32): string {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function hashOpaqueToken(token: string): Promise<string> {
  return sha256Hex(token);
}

export function renderCommunicationTemplate(
  value: string | null | undefined,
  variables: Record<string, string>,
): string {
  return (value ?? "").replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi, (_, key: string) => variables[key] ?? "");
}

export function parseChannels(value: unknown): string[] {
  const allowed = new Set(["email", "whatsapp", "sms", "manual"]);
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.filter((item): item is string => typeof item === "string" && allowed.has(item))));
}

export async function createNpsSurvey(
  db: D1Database,
  options: { clinicId: string; appointmentId: string; providerUserId: string; expiresInDays?: number },
): Promise<{ surveyId: string; token: string } | null> {
  const token = base64UrlToken(32);
  const tokenHash = await hashOpaqueToken(token);
  const surveyId = `svy-${crypto.randomUUID()}`;
  const expiresInDays = Number.isInteger(options.expiresInDays) && (options.expiresInDays ?? 0) > 0
    ? Math.min(options.expiresInDays as number, 30)
    : 14;
  const expiresAt = new Date(Date.now() + expiresInDays * 86_400_000).toISOString();
  try {
    await db.prepare(
      `INSERT INTO feedback_surveys
        (id, clinic_id, appointment_id, provider_user_id, token_hash, expires_at)
       SELECT ?, ?, ?, ?, ?, ?
        WHERE NOT EXISTS (
          SELECT 1 FROM feedback_surveys WHERE appointment_id = ?
        )`,
    ).bind(surveyId, options.clinicId, options.appointmentId, options.providerUserId, tokenHash, expiresAt, options.appointmentId).run();
    const row = await db.prepare(
      `SELECT id FROM feedback_surveys WHERE appointment_id = ? LIMIT 1`,
    ).bind(options.appointmentId).first<{ id: string }>();
    if (!row) return null;
    await db.prepare(
      `INSERT INTO feedback_survey_events (id, survey_id, event_type, metadata_json)
       SELECT ?, ?, 'created', ? WHERE NOT EXISTS (
         SELECT 1 FROM feedback_survey_events WHERE survey_id = ? AND event_type = 'created'
       )`,
    ).bind(`sve-${crypto.randomUUID()}`, row.id, JSON.stringify({ source: "appointment_completed" }), row.id).run();
    return row.id === surveyId ? { surveyId: row.id, token } : null;
  } catch (error) {
    console.error("[saas.feedback.create]", error);
    return null;
  }
}
