import { getContextUser } from "../auth/_authorization";
import { decryptText, encryptText, type OperationsEnv } from "../operations/_core";
import {
  cleanHubText,
  cleanOptionalHubText,
  ensureSaasHubSchema,
  hubError,
  hubJson,
  parseChannels,
  parseJsonBody,
  readJsonObject,
  renderCommunicationTemplate,
  resolveHubClinic,
  seedClinicDefaults,
  writeHubAudit,
  type HubEnv,
} from "../saas/_core";
import { membershipCanManage, membershipCanWriteClinical } from "../tenant/_core";

type Env = HubEnv & OperationsEnv;

const CAMPAIGN_STATUSES = new Set(["draft", "queued", "sending", "completed", "cancelled"]);
const DELIVERY_STATUSES = new Set(["queued", "sending", "sent", "delivered", "failed", "cancelled"]);

interface TemplateRow {
  id: string;
  template_key: string;
  name: string;
  description: string | null;
  channels_json: string;
  subject_template: string | null;
  body_template: string;
  is_system: number;
  active: number;
  created_at: string;
  updated_at: string;
}

interface CampaignRow {
  id: string;
  template_id: string;
  template_name: string;
  name: string;
  audience_filter_json: string;
  status: string;
  scheduled_for: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

interface DeliveryRow {
  id: string;
  campaign_id: string | null;
  template_id: string | null;
  channel: string;
  recipient_encrypted: string;
  subject_encrypted: string | null;
  body_encrypted: string;
  status: string;
  provider_message_id: string | null;
  last_error: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
}

function templateApi(row: TemplateRow) {
  return {
    id: row.id,
    key: row.template_key,
    name: row.name,
    description: row.description,
    channels: readJsonObject(row.channels_json) ? [] : (() => { try { return JSON.parse(row.channels_json); } catch { return []; } })(),
    subject: row.subject_template,
    body: row.body_template,
    system: Boolean(row.is_system),
    active: Boolean(row.active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function deliveryApi(env: Env, row: DeliveryRow) {
  const [recipient, subject, body] = await Promise.all([
    decryptText(env, row.recipient_encrypted),
    decryptText(env, row.subject_encrypted),
    decryptText(env, row.body_encrypted),
  ]);
  return {
    id: row.id,
    campaignId: row.campaign_id,
    templateId: row.template_id,
    channel: row.channel,
    recipient,
    subject,
    body,
    status: row.status,
    providerMessageId: row.provider_message_id,
    lastError: row.last_error,
    sentAt: row.sent_at,
    deliveredAt: row.delivered_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function loadPayload(db: D1Database, env: Env, clinicId: string) {
  await seedClinicDefaults(db, clinicId);
  const [templates, campaigns, deliveries, metrics] = await Promise.all([
    db.prepare(
      `SELECT * FROM communication_templates WHERE clinic_id = ? AND active = 1 ORDER BY is_system DESC, name LIMIT 200`,
    ).bind(clinicId).all<TemplateRow>(),
    db.prepare(
      `SELECT c.*, t.name AS template_name FROM communication_campaigns c
        JOIN communication_templates t ON t.id = c.template_id
       WHERE c.clinic_id = ? ORDER BY c.created_at DESC LIMIT 200`,
    ).bind(clinicId).all<CampaignRow>(),
    db.prepare(
      `SELECT * FROM communication_deliveries WHERE clinic_id = ? ORDER BY created_at DESC LIMIT 250`,
    ).bind(clinicId).all<DeliveryRow>(),
    db.prepare(
      `SELECT COUNT(*) AS total,
          SUM(CASE WHEN status IN ('queued','sending') THEN 1 ELSE 0 END) AS pending,
          SUM(CASE WHEN status IN ('sent','delivered') THEN 1 ELSE 0 END) AS sent,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed
       FROM communication_deliveries WHERE clinic_id = ?`,
    ).bind(clinicId).first<{ total: number; pending: number; sent: number; failed: number }>(),
  ]);
  return {
    templates: (templates.results ?? []).map(templateApi),
    campaigns: (campaigns.results ?? []).map((row) => ({
      id: row.id,
      templateId: row.template_id,
      templateName: row.template_name,
      name: row.name,
      audienceFilter: (() => { try { return JSON.parse(row.audience_filter_json); } catch { return {}; } })(),
      status: row.status,
      scheduledFor: row.scheduled_for,
      sentAt: row.sent_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
    deliveries: await Promise.all((deliveries.results ?? []).map((row) => deliveryApi(env, row))),
    metrics: {
      total: metrics?.total ?? 0,
      pending: metrics?.pending ?? 0,
      sent: metrics?.sent ?? 0,
      failed: metrics?.failed ?? 0,
    },
  };
}

async function contextFor(context: Parameters<PagesFunction<Env>>[0]) {
  const db = context.env.DB;
  const user = getContextUser(context);
  if (!db) return { error: hubError("Banco SaaS não configurado.", "SAAS_DB_NOT_CONFIGURED", 503) } as const;
  if (!user) return { error: hubError("Não autenticado.", "UNAUTHENTICATED", 401) } as const;
  await ensureSaasHubSchema(db);
  const resolved = await resolveHubClinic(db, context.request, user);
  if (!resolved) return { error: hubError("Informe uma clínica ativa no cabeçalho X-Clinic-Id.", "HUB_CLINIC_REQUIRED", 400) } as const;
  return { db, user, resolved } as const;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const auth = await contextFor(context);
    if ("error" in auth) return auth.error;
    if (!membershipCanWriteClinical(auth.resolved.membership)) return hubError("Acesso à central de comunicação negado.", "HUB_FORBIDDEN", 403);
    return hubJson({ clinic: auth.resolved.membership, ...(await loadPayload(auth.db, context.env, auth.resolved.clinicId)) });
  } catch (error) {
    console.error("[communication.GET]", error);
    return hubError("Não foi possível carregar a central de comunicação.", "COMMUNICATION_LOAD_FAILED", 500);
  }
};

async function loadTemplate(db: D1Database, clinicId: string, templateId: string): Promise<TemplateRow | null> {
  return db.prepare(
    `SELECT * FROM communication_templates WHERE id = ? AND clinic_id = ? AND active = 1 LIMIT 1`,
  ).bind(templateId, clinicId).first<TemplateRow>();
}

async function queueDelivery(
  db: D1Database,
  env: Env,
  options: {
    clinicId: string;
    template: TemplateRow;
    campaignId?: string | null;
    appointmentId?: string | null;
    surveyId?: string | null;
    channel: string;
    recipient: string;
    variables?: Record<string, string>;
  },
): Promise<string> {
  const allowedChannels = parseChannels(JSON.parse(options.template.channels_json));
  if (!allowedChannels.includes(options.channel)) throw new Error("COMMUNICATION_CHANNEL_NOT_ALLOWED");
  const variables = options.variables ?? {};
  const deliveryId = `dlv-${crypto.randomUUID()}`;
  await db.prepare(
    `INSERT INTO communication_deliveries
      (id, clinic_id, campaign_id, template_id, appointment_id, survey_id, channel,
       recipient_encrypted, subject_encrypted, body_encrypted, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'queued')`,
  ).bind(
    deliveryId,
    options.clinicId,
    options.campaignId ?? null,
    options.template.id,
    options.appointmentId ?? null,
    options.surveyId ?? null,
    options.channel,
    await encryptText(env, options.recipient),
    await encryptText(env, renderCommunicationTemplate(options.template.subject_template, variables)),
    await encryptText(env, renderCommunicationTemplate(options.template.body_template, variables)),
  ).run();
  return deliveryId;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const body = await parseJsonBody(context.request);
  if (!body) return hubError("Corpo JSON inválido.", "INVALID_JSON", 400);
  try {
    const auth = await contextFor(context);
    if ("error" in auth) return auth.error;
    const { db, user, resolved } = auth;
    const clinicId = resolved.clinicId;
    const action = cleanHubText(body.action, 40);
    const managerRequired = ["create_template", "update_template", "create_campaign", "queue_campaign", "delivery_status"].includes(action);
    if (managerRequired && !membershipCanManage(resolved.membership)) return hubError("Somente administradores podem configurar comunicações.", "HUB_MANAGER_REQUIRED", 403);
    if (!managerRequired && !membershipCanWriteClinical(resolved.membership)) return hubError("Perfil sem permissão para comunicação.", "HUB_CLINICAL_WRITE_REQUIRED", 403);
    const now = new Date().toISOString();
    let targetType = "communication";
    let targetId: string | null = null;

    if (action === "create_template") {
      const name = cleanHubText(body.name, 120);
      const templateKey = cleanHubText(body.templateKey, 80).toLowerCase();
      const channels = parseChannels(body.channels);
      const subject = cleanOptionalHubText(body.subject, 300);
      const bodyTemplate = cleanHubText(body.body, 20_000);
      if (name.length < 2 || !/^[a-z0-9][a-z0-9_-]{1,79}$/.test(templateKey) || channels.length === 0 || bodyTemplate.length < 3) {
        return hubError("Template de comunicação inválido.", "TEMPLATE_VALIDATION_ERROR", 400);
      }
      targetId = `tpl-${crypto.randomUUID()}`;
      await db.prepare(
        `INSERT INTO communication_templates
          (id, clinic_id, template_key, name, description, channels_json, subject_template, body_template, created_by_user_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(targetId, clinicId, templateKey, name, cleanOptionalHubText(body.description, 500), JSON.stringify(channels), subject, bodyTemplate, user.id).run();
      targetType = "communication_template";
    } else if (action === "update_template") {
      targetId = cleanHubText(body.templateId, 80);
      const current = targetId ? await loadTemplate(db, clinicId, targetId) : null;
      if (!current) return hubError("Template não encontrado.", "TEMPLATE_NOT_FOUND", 404);
      if (current.is_system === 1) return hubError("Templates do sistema não podem ser alterados.", "SYSTEM_TEMPLATE_IMMUTABLE", 409);
      const channels = body.channels === undefined ? (() => { try { return JSON.parse(current.channels_json); } catch { return []; } })() : parseChannels(body.channels);
      const bodyTemplate = body.body === undefined ? current.body_template : cleanHubText(body.body, 20_000);
      if (channels.length === 0 || bodyTemplate.length < 3) return hubError("Template de comunicação inválido.", "TEMPLATE_VALIDATION_ERROR", 400);
      await db.prepare(
        `UPDATE communication_templates SET name = ?, description = ?, channels_json = ?, subject_template = ?, body_template = ?, updated_at = ?
         WHERE id = ? AND clinic_id = ? AND is_system = 0`,
      ).bind(
        cleanHubText(body.name, 120) || current.name,
        body.description === undefined ? current.description : cleanOptionalHubText(body.description, 500),
        JSON.stringify(channels),
        body.subject === undefined ? current.subject_template : cleanOptionalHubText(body.subject, 300),
        bodyTemplate, now, targetId, clinicId,
      ).run();
      targetType = "communication_template";
    } else if (action === "create_campaign") {
      const templateId = cleanHubText(body.templateId, 80);
      const template = await loadTemplate(db, clinicId, templateId);
      const name = cleanHubText(body.name, 160);
      if (!template || name.length < 2) return hubError("Campanha ou template inválido.", "CAMPAIGN_VALIDATION_ERROR", 400);
      let filters: Record<string, unknown> = {};
      if (body.audienceFilter !== undefined) {
        if (!body.audienceFilter || typeof body.audienceFilter !== "object" || Array.isArray(body.audienceFilter)) return hubError("Filtro de público inválido.", "CAMPAIGN_FILTER_INVALID", 400);
        filters = body.audienceFilter as Record<string, unknown>;
      }
      if (JSON.stringify(filters).length > 4_000) return hubError("Filtro de público muito grande.", "CAMPAIGN_FILTER_INVALID", 400);
      targetId = `cmp-${crypto.randomUUID()}`;
      await db.prepare(
        `INSERT INTO communication_campaigns
          (id, clinic_id, template_id, name, audience_filter_json, scheduled_for, created_by_user_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(targetId, clinicId, template.id, name, JSON.stringify(filters), cleanOptionalHubText(body.scheduledFor, 40), user.id, now, now).run();
      targetType = "communication_campaign";
    } else if (action === "queue_delivery") {
      const templateId = cleanHubText(body.templateId, 80);
      const template = await loadTemplate(db, clinicId, templateId);
      const recipient = cleanHubText(body.recipient, 320);
      const channel = cleanHubText(body.channel, 20);
      if (!template || !recipient || !parseChannels(JSON.parse(template.channels_json)).includes(channel)) return hubError("Entrega ou canal inválido.", "DELIVERY_VALIDATION_ERROR", 400);
      const variables = body.variables && typeof body.variables === "object" && !Array.isArray(body.variables)
        ? Object.fromEntries(Object.entries(body.variables as Record<string, unknown>).filter(([, value]) => typeof value === "string").map(([key, value]) => [key, String(value).slice(0, 500)]))
        : {};
      targetId = await queueDelivery(db, context.env, {
        clinicId, template, channel, recipient,
        appointmentId: cleanOptionalHubText(body.appointmentId, 100),
        surveyId: cleanOptionalHubText(body.surveyId, 100),
        variables,
      });
      targetType = "communication_delivery";
    } else if (action === "queue_campaign") {
      targetId = cleanHubText(body.campaignId, 80);
      const campaign = targetId ? await db.prepare(
        `SELECT c.id AS campaign_id, c.template_id AS template_id, c.name AS campaign_name,
                c.status AS campaign_status, t.template_key, t.name AS template_name,
                t.channels_json, t.subject_template, t.body_template
           FROM communication_campaigns c
           JOIN communication_templates t ON t.id = c.template_id
          WHERE c.id = ? AND c.clinic_id = ? AND t.clinic_id = ? LIMIT 1`,
      ).bind(targetId, clinicId, clinicId).first<{
        campaign_id: string;
        template_id: string;
        campaign_name: string;
        campaign_status: string;
        template_key: string;
        template_name: string;
        channels_json: string;
        subject_template: string | null;
        body_template: string;
      }>() : null;
      if (!campaign) return hubError("Campanha não encontrada.", "CAMPAIGN_NOT_FOUND", 404);
      if (!CAMPAIGN_STATUSES.has(campaign.campaign_status) || ["completed", "cancelled"].includes(campaign.campaign_status)) return hubError("Campanha não pode ser enfileirada.", "CAMPAIGN_INVALID_STATUS", 409);
      const recipients = Array.isArray(body.recipients) ? body.recipients.slice(0, 500) : [];
      const statements: D1PreparedStatement[] = [];
      for (const item of recipients) {
        if (!item || typeof item !== "object" || Array.isArray(item)) continue;
        const entry = item as Record<string, unknown>;
        const recipient = cleanHubText(entry.recipient, 320);
        const channel = cleanHubText(entry.channel, 20);
        if (!recipient || !parseChannels(JSON.parse(campaign.channels_json)).includes(channel)) continue;
        const variables = entry.variables && typeof entry.variables === "object" && !Array.isArray(entry.variables)
          ? Object.fromEntries(Object.entries(entry.variables as Record<string, unknown>).filter(([, value]) => typeof value === "string").map(([key, value]) => [key, String(value).slice(0, 500)]))
          : {};
        const deliveryId = `dlv-${crypto.randomUUID()}`;
        statements.push(db.prepare(
          `INSERT INTO communication_deliveries
            (id, clinic_id, campaign_id, template_id, channel, recipient_encrypted, subject_encrypted, body_encrypted, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'queued')`,
        ).bind(
          deliveryId, clinicId, campaign.campaign_id, campaign.template_id, channel,
          await encryptText(context.env, recipient),
          await encryptText(context.env, renderCommunicationTemplate(campaign.subject_template, variables)),
          await encryptText(context.env, renderCommunicationTemplate(campaign.body_template, variables)),
        ));
      }
      statements.push(db.prepare(
        `UPDATE communication_campaigns SET status = 'queued', updated_at = ? WHERE id = ? AND clinic_id = ? AND status = ?`,
        ).bind(now, campaign.campaign_id, clinicId, campaign.campaign_status));
      await db.batch(statements);
    } else if (action === "delivery_status") {
      targetId = cleanHubText(body.deliveryId, 80);
      const status = cleanHubText(body.status, 20);
      if (!targetId || !DELIVERY_STATUSES.has(status) || status === "queued" || status === "sending") return hubError("Status de entrega inválido.", "DELIVERY_STATUS_INVALID", 400);
      const result = await db.prepare(
        `UPDATE communication_deliveries SET status = ?, provider_message_id = COALESCE(?, provider_message_id), last_error = ?,
          sent_at = CASE WHEN ? IN ('sent','delivered') THEN COALESCE(sent_at, ?) ELSE sent_at END,
          delivered_at = CASE WHEN ? = 'delivered' THEN ? ELSE delivered_at END, updated_at = ?
         WHERE id = ? AND clinic_id = ?`,
      ).bind(status, cleanOptionalHubText(body.providerMessageId, 200), cleanOptionalHubText(body.error, 500), status, now, status, now, now, targetId, clinicId).run();
      if ((result.meta?.changes ?? 0) !== 1) return hubError("Entrega não encontrada.", "DELIVERY_NOT_FOUND", 404);
    } else if (action === "cancel_campaign") {
      targetId = cleanHubText(body.campaignId, 80);
      const result = await db.prepare(
        `UPDATE communication_campaigns SET status = 'cancelled', updated_at = ? WHERE id = ? AND clinic_id = ? AND status IN ('draft','queued')`,
      ).bind(now, targetId, clinicId).run();
      if ((result.meta?.changes ?? 0) !== 1) return hubError("Campanha não encontrada ou já processada.", "CAMPAIGN_NOT_FOUND", 404);
      await db.prepare(
        `UPDATE communication_deliveries SET status = 'cancelled', updated_at = ? WHERE campaign_id = ? AND clinic_id = ? AND status = 'queued'`,
      ).bind(now, targetId, clinicId).run();
    } else {
      return hubError("Ação de comunicação desconhecida.", "COMMUNICATION_ACTION_INVALID", 400);
    }

    await writeHubAudit(db, { clinicId, actorUserId: user.id, action, targetType, targetId, metadata: { source: "communication_hub" } });
    return hubJson({ ok: true, ...(await loadPayload(db, context.env, clinicId)) });
  } catch (error) {
    console.error("[communication.POST]", error);
    const message = String(error);
    if (message.includes("COMMUNICATION_TEMPLATE_TENANT_MISMATCH") || message.includes("COMMUNICATION_CAMPAIGN_TENANT_MISMATCH")) return hubError("Recurso de comunicação fora da clínica.", "COMMUNICATION_TENANT_MISMATCH", 409);
    if (message.includes("COMMUNICATION_CHANNEL_NOT_ALLOWED")) return hubError("O canal não está habilitado neste template.", "COMMUNICATION_CHANNEL_NOT_ALLOWED", 400);
    if (message.includes("OPERATIONAL_CRYPTO_NOT_CONFIGURED")) return hubError("Criptografia operacional não configurada.", "CRYPTO_NOT_CONFIGURED", 503);
    if (message.toLowerCase().includes("unique")) return hubError("Já existe um recurso com este identificador.", "COMMUNICATION_CONFLICT", 409);
    return hubError("Não foi possível concluir a operação de comunicação.", "COMMUNICATION_WRITE_FAILED", 500);
  }
};
