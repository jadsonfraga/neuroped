import { getContextUser } from "../auth/_authorization";
import { decryptText, encryptText, type OperationsEnv } from "../operations/_core";
import {
  cleanHubText,
  cleanOptionalHubText,
  ensureSaasHubSchema,
  hubError,
  hubJson,
  parseJsonBody,
  resolveHubClinic,
  validEmail,
  writeHubAudit,
  type HubEnv,
} from "../saas/_core";
import { membershipCanManage, membershipCanWriteClinical } from "../tenant/_core";

type Env = HubEnv & OperationsEnv;

const PARTNER_TYPES = new Set(["school", "therapist", "psychologist", "psychiatrist", "hospital", "laboratory", "social_service", "other"]);
const REFERRAL_STATUSES = new Set(["draft", "sent", "received", "accepted", "completed", "declined", "cancelled"]);
const ALLOWED_TRANSITIONS: Record<string, Set<string>> = {
  draft: new Set(["sent", "cancelled"]),
  sent: new Set(["received", "accepted", "declined", "cancelled"]),
  received: new Set(["accepted", "declined", "cancelled"]),
  accepted: new Set(["completed", "cancelled"]),
  completed: new Set(),
  declined: new Set(),
  cancelled: new Set(),
};

interface PartnerRow {
  id: string;
  name: string;
  partner_type: string;
  contact_name_encrypted: string | null;
  email_encrypted: string | null;
  phone_encrypted: string | null;
  specialty: string | null;
  notes_encrypted: string | null;
  status: string;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
}

interface ReferralRow {
  id: string;
  partner_id: string;
  partner_name: string;
  direction: string;
  patient_reference_encrypted: string | null;
  patient_name_encrypted: string | null;
  guardian_contact_encrypted: string | null;
  notes_encrypted: string | null;
  status: string;
  referred_at: string | null;
  completed_at: string | null;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
}

function serializePartner(env: Env, row: PartnerRow) {
  return Promise.all([
    decryptText(env, row.contact_name_encrypted),
    decryptText(env, row.email_encrypted),
    decryptText(env, row.phone_encrypted),
    decryptText(env, row.notes_encrypted),
  ]).then(([contactName, email, phone, notes]) => ({
    id: row.id,
    name: row.name,
    type: row.partner_type,
    contactName,
    email,
    phone,
    specialty: row.specialty,
    notes,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

function serializeReferral(env: Env, row: ReferralRow) {
  return Promise.all([
    decryptText(env, row.patient_reference_encrypted),
    decryptText(env, row.patient_name_encrypted),
    decryptText(env, row.guardian_contact_encrypted),
    decryptText(env, row.notes_encrypted),
  ]).then(([patientReference, patientName, guardianContact, notes]) => ({
    id: row.id,
    partnerId: row.partner_id,
    partnerName: row.partner_name,
    direction: row.direction,
    patientReference,
    patientName,
    guardianContact,
    notes,
    status: row.status,
    referredAt: row.referred_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

async function loadPayload(db: D1Database, env: Env, clinicId: string) {
  const [partners, referrals, metrics] = await Promise.all([
    db.prepare(
      `SELECT * FROM partner_directory WHERE clinic_id = ? AND status <> 'archived' ORDER BY status, name LIMIT 500`,
    ).bind(clinicId).all<PartnerRow>(),
    db.prepare(
      `SELECT r.*, p.name AS partner_name
         FROM partner_referrals r JOIN partner_directory p ON p.id = r.partner_id
        WHERE r.clinic_id = ? ORDER BY r.created_at DESC LIMIT 500`,
    ).bind(clinicId).all<ReferralRow>(),
    db.prepare(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN status IN ('draft','sent','received','accepted') THEN 1 ELSE 0 END) AS open,
              SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
              SUM(CASE WHEN direction = 'inbound' THEN 1 ELSE 0 END) AS inbound,
              SUM(CASE WHEN direction = 'outbound' THEN 1 ELSE 0 END) AS outbound
         FROM partner_referrals WHERE clinic_id = ?`,
    ).bind(clinicId).first<{ total: number; open: number; completed: number; inbound: number; outbound: number }>(),
  ]);
  return {
    partners: await Promise.all((partners.results ?? []).map((row) => serializePartner(env, row))),
    referrals: await Promise.all((referrals.results ?? []).map((row) => serializeReferral(env, row))),
    metrics: {
      total: metrics?.total ?? 0,
      open: metrics?.open ?? 0,
      completed: metrics?.completed ?? 0,
      inbound: metrics?.inbound ?? 0,
      outbound: metrics?.outbound ?? 0,
    },
  };
}

async function managerContext(context: Parameters<PagesFunction<Env>>[0]) {
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
    const auth = await managerContext(context);
    if ("error" in auth) return auth.error;
    if (!membershipCanWriteClinical(auth.resolved.membership)) return hubError("Acesso à rede de parceiros negado.", "HUB_FORBIDDEN", 403);
    return hubJson({ clinic: auth.resolved.membership, ...(await loadPayload(auth.db, context.env, auth.resolved.clinicId)) });
  } catch (error) {
    console.error("[partners.GET]", error);
    return hubError("Não foi possível carregar a rede de parceiros.", "PARTNERS_LOAD_FAILED", 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const body = await parseJsonBody(context.request);
  if (!body) return hubError("Corpo JSON inválido.", "INVALID_JSON", 400);
  try {
    const auth = await managerContext(context);
    if ("error" in auth) return auth.error;
    const { db, user, resolved } = auth;
    const clinicId = resolved.clinicId;
    const action = cleanHubText(body.action, 40);

    if (["create_partner", "update_partner", "archive_partner"].includes(action) && !membershipCanManage(resolved.membership)) {
      return hubError("Somente administradores da clínica podem alterar o diretório.", "HUB_MANAGER_REQUIRED", 403);
    }
    if (["create_referral", "update_referral_status"].includes(action) && !membershipCanWriteClinical(resolved.membership)) {
      return hubError("Perfil sem permissão para registrar encaminhamentos.", "HUB_CLINICAL_WRITE_REQUIRED", 403);
    }

    const now = new Date().toISOString();
    let targetType = "partner_network";
    let targetId: string | null = null;

    if (action === "create_partner") {
      const name = cleanHubText(body.name, 160);
      const partnerType = cleanHubText(body.type, 30) || "other";
      const email = cleanOptionalHubText(body.email, 320);
      if (name.length < 2 || !PARTNER_TYPES.has(partnerType) || !validEmail(email ?? "")) {
        return hubError("Dados do parceiro inválidos.", "PARTNER_VALIDATION_ERROR", 400);
      }
      targetId = `ptr-${crypto.randomUUID()}`;
      await db.prepare(
        `INSERT INTO partner_directory
          (id, clinic_id, name, partner_type, contact_name_encrypted, email_encrypted,
           phone_encrypted, specialty, notes_encrypted, created_by_user_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        targetId, clinicId, name, partnerType,
        await encryptText(context.env, cleanOptionalHubText(body.contactName, 160)),
        await encryptText(context.env, email),
        await encryptText(context.env, cleanOptionalHubText(body.phone, 40)),
        cleanOptionalHubText(body.specialty, 160),
        await encryptText(context.env, cleanOptionalHubText(body.notes, 4_000)),
        user.id, now, now,
      ).run();
      targetType = "partner";
    } else if (action === "update_partner") {
      targetId = cleanHubText(body.partnerId, 80);
      if (!targetId) return hubError("Parceiro inválido.", "PARTNER_VALIDATION_ERROR", 400);
      const existing = await db.prepare(
        `SELECT * FROM partner_directory WHERE id = ? AND clinic_id = ? LIMIT 1`,
      ).bind(targetId, clinicId).first<PartnerRow>();
      if (!existing) return hubError("Parceiro não encontrado.", "PARTNER_NOT_FOUND", 404);
      const name = cleanHubText(body.name, 160) || existing.name;
      const partnerType = cleanHubText(body.type, 30) || existing.partner_type;
      const email = body.email === undefined ? null : cleanOptionalHubText(body.email, 320);
      if (name.length < 2 || !PARTNER_TYPES.has(partnerType) || (body.email !== undefined && !validEmail(email ?? ""))) {
        return hubError("Dados do parceiro inválidos.", "PARTNER_VALIDATION_ERROR", 400);
      }
      const contactName = body.contactName === undefined ? existing.contact_name_encrypted : await encryptText(context.env, cleanOptionalHubText(body.contactName, 160));
      const emailValue = body.email === undefined ? existing.email_encrypted : await encryptText(context.env, email);
      const phone = body.phone === undefined ? existing.phone_encrypted : await encryptText(context.env, cleanOptionalHubText(body.phone, 40));
      const notes = body.notes === undefined ? existing.notes_encrypted : await encryptText(context.env, cleanOptionalHubText(body.notes, 4_000));
      const result = await db.prepare(
        `UPDATE partner_directory SET name = ?, partner_type = ?, contact_name_encrypted = ?, email_encrypted = ?,
          phone_encrypted = ?, specialty = ?, notes_encrypted = ?, status = ?, updated_at = ?
         WHERE id = ? AND clinic_id = ?`,
      ).bind(name, partnerType, contactName, emailValue, phone, body.specialty === undefined ? existing.specialty : cleanOptionalHubText(body.specialty, 160), notes, existing.status, now, targetId, clinicId).run();
      if ((result.meta?.changes ?? 0) !== 1) return hubError("Parceiro não encontrado.", "PARTNER_NOT_FOUND", 404);
      targetType = "partner";
    } else if (action === "archive_partner") {
      targetId = cleanHubText(body.partnerId, 80);
      const result = await db.prepare(
        `UPDATE partner_directory SET status = 'archived', updated_at = ? WHERE id = ? AND clinic_id = ? AND status <> 'archived'`,
      ).bind(now, targetId, clinicId).run();
      if ((result.meta?.changes ?? 0) !== 1) return hubError("Parceiro não encontrado.", "PARTNER_NOT_FOUND", 404);
      targetType = "partner";
    } else if (action === "create_referral") {
      const partnerId = cleanHubText(body.partnerId, 80);
      const partner = await db.prepare(
        `SELECT id FROM partner_directory WHERE id = ? AND clinic_id = ? AND status = 'active' LIMIT 1`,
      ).bind(partnerId, clinicId).first<{ id: string }>();
      if (!partner) return hubError("Parceiro ativo não encontrado.", "PARTNER_NOT_FOUND", 404);
      const direction = cleanHubText(body.direction, 20);
      const status = cleanHubText(body.status, 20) || "draft";
      if (!partnerId || !["inbound", "outbound"].includes(direction) || !REFERRAL_STATUSES.has(status) || !["draft", "sent"].includes(status)) {
        return hubError("Encaminhamento inválido.", "REFERRAL_VALIDATION_ERROR", 400);
      }
      targetId = `ref-${crypto.randomUUID()}`;
      await db.prepare(
        `INSERT INTO partner_referrals
          (id, clinic_id, partner_id, created_by_user_id, direction, patient_reference_encrypted,
           patient_name_encrypted, guardian_contact_encrypted, notes_encrypted, status, referred_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        targetId, clinicId, partnerId, user.id, direction,
        await encryptText(context.env, cleanOptionalHubText(body.patientReference, 160)),
        await encryptText(context.env, cleanOptionalHubText(body.patientName, 160)),
        await encryptText(context.env, cleanOptionalHubText(body.guardianContact, 320)),
        await encryptText(context.env, cleanOptionalHubText(body.notes, 4_000)),
        status, status === "sent" ? now : null, now, now,
      ).run();
      targetType = "partner_referral";
    } else if (action === "update_referral_status") {
      targetId = cleanHubText(body.referralId, 80);
      const nextStatus = cleanHubText(body.status, 20);
      const current = await db.prepare(
        `SELECT status FROM partner_referrals WHERE id = ? AND clinic_id = ? LIMIT 1`,
      ).bind(targetId, clinicId).first<{ status: string }>();
      if (!current) return hubError("Encaminhamento não encontrado.", "REFERRAL_NOT_FOUND", 404);
      if (!REFERRAL_STATUSES.has(nextStatus) || !ALLOWED_TRANSITIONS[current.status]?.has(nextStatus)) {
        return hubError("Transição de encaminhamento não permitida.", "REFERRAL_INVALID_TRANSITION", 409);
      }
      const result = await db.prepare(
        `UPDATE partner_referrals SET status = ?, referred_at = CASE WHEN ? = 'sent' AND referred_at IS NULL THEN ? ELSE referred_at END,
          completed_at = CASE WHEN ? = 'completed' THEN ? ELSE completed_at END, updated_at = ?
         WHERE id = ? AND clinic_id = ? AND status = ?`,
      ).bind(nextStatus, nextStatus, now, nextStatus, now, now, targetId, clinicId, current.status).run();
      if ((result.meta?.changes ?? 0) !== 1) return hubError("Encaminhamento mudou durante a atualização.", "REFERRAL_STALE", 409);
      targetType = "partner_referral";
    } else {
      return hubError("Ação de parceiros desconhecida.", "PARTNER_ACTION_INVALID", 400);
    }

    await writeHubAudit(db, {
      clinicId,
      actorUserId: user.id,
      action,
      targetType,
      targetId,
      metadata: { source: "partner_network" },
    });
    return hubJson({ ok: true, ...(await loadPayload(db, context.env, clinicId)) });
  } catch (error) {
    console.error("[partners.POST]", error);
    if (String(error).includes("PARTNER_REFERRAL_TENANT_MISMATCH")) return hubError("Encaminhamento fora da clínica.", "PARTNER_REFERRAL_TENANT_MISMATCH", 409);
    if (String(error).includes("OPERATIONAL_CRYPTO_NOT_CONFIGURED")) return hubError("Criptografia operacional não configurada.", "CRYPTO_NOT_CONFIGURED", 503);
    return hubError("Não foi possível concluir a operação de parceiros.", "PARTNERS_WRITE_FAILED", 500);
  }
};
