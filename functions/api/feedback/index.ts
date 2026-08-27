import { encryptText } from "../operations/_core";
import {
  cleanHubText,
  ensureSaasHubSchema,
  hashOpaqueToken,
  hubError,
  hubJson,
  parseJsonBody,
  type HubEnv,
} from "../saas/_core";

type Env = HubEnv;

function tokenFrom(request: Request, body?: Record<string, unknown>): string {
  const url = new URL(request.url);
  return cleanHubText(body?.token ?? url.searchParams.get("token"), 240);
}

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  if (!env.DB) return hubError("Banco SaaS não configurado.", "SAAS_DB_NOT_CONFIGURED", 503);
  const token = tokenFrom(request);
  if (token.length < 30) return hubError("Link de pesquisa inválido.", "FEEDBACK_TOKEN_INVALID", 400);
  try {
    await ensureSaasHubSchema(env.DB);
    const row = await env.DB.prepare(
      `SELECT s.id, s.status, s.expires_at, c.name AS clinic_name
         FROM feedback_surveys s JOIN clinics c ON c.id = s.clinic_id
        WHERE s.token_hash = ? LIMIT 1`,
    ).bind(await hashOpaqueToken(token)).first<{ id: string; status: string; expires_at: string; clinic_name: string }>();
    if (!row) return hubError("Pesquisa não encontrada.", "FEEDBACK_NOT_FOUND", 404);
    if (row.status !== "pending") return hubJson({ available: false, status: row.status, clinicName: row.clinic_name });
    if (Date.parse(row.expires_at) <= Date.now()) {
      await env.DB.batch([
        env.DB.prepare(`UPDATE feedback_surveys SET status = 'expired', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'pending'`).bind(row.id),
        env.DB.prepare(`INSERT INTO feedback_survey_events (id, survey_id, event_type) SELECT ?, ?, 'expired' WHERE NOT EXISTS (SELECT 1 FROM feedback_survey_events WHERE survey_id = ? AND event_type = 'expired')`).bind(`sve-${crypto.randomUUID()}`, row.id, row.id),
      ]);
      return hubJson({ available: false, status: "expired", clinicName: row.clinic_name });
    }
    return hubJson({ available: true, surveyType: "nps", clinicName: row.clinic_name, expiresAt: row.expires_at });
  } catch (error) {
    console.error("[feedback.GET]", error);
    return hubError("Não foi possível carregar a pesquisa.", "FEEDBACK_LOAD_FAILED", 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  if (!env.DB) return hubError("Banco SaaS não configurado.", "SAAS_DB_NOT_CONFIGURED", 503);
  const body = await parseJsonBody(request);
  if (!body) return hubError("Corpo JSON inválido.", "INVALID_JSON", 400);
  const token = tokenFrom(request, body);
  const score = Number(body.score);
  const comment = cleanHubText(body.comment, 4_000);
  if (token.length < 30 || !Number.isInteger(score) || score < 0 || score > 10) {
    return hubError("Resposta de NPS inválida.", "FEEDBACK_VALIDATION_ERROR", 400);
  }
  try {
    await ensureSaasHubSchema(env.DB);
    const tokenHash = await hashOpaqueToken(token);
    const row = await env.DB.prepare(
      `SELECT id, clinic_id, status, expires_at FROM feedback_surveys WHERE token_hash = ? LIMIT 1`,
    ).bind(tokenHash).first<{ id: string; clinic_id: string; status: string; expires_at: string }>();
    if (!row) return hubError("Pesquisa não encontrada.", "FEEDBACK_NOT_FOUND", 404);
    if (row.status !== "pending") return hubError("Esta pesquisa já foi respondida ou encerrada.", "FEEDBACK_ALREADY_CLOSED", 409);
    if (Date.parse(row.expires_at) <= Date.now()) {
      await env.DB.prepare(`UPDATE feedback_surveys SET status = 'expired', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'pending'`).bind(row.id).run();
      return hubError("Esta pesquisa expirou.", "FEEDBACK_EXPIRED", 410);
    }
    const now = new Date().toISOString();
    const result = await env.DB.prepare(
      `UPDATE feedback_surveys SET status = 'answered', score = ?, comment_encrypted = ?, answered_at = ?, updated_at = ?
        WHERE id = ? AND token_hash = ? AND status = 'pending' AND julianday(expires_at) > julianday(?)`,
    ).bind(score, await encryptText(env, comment || null), now, now, row.id, tokenHash, now).run();
    if ((result.meta?.changes ?? 0) !== 1) return hubError("Pesquisa já respondida ou expirada.", "FEEDBACK_STALE", 409);
    await env.DB.batch([
      env.DB.prepare(`INSERT INTO feedback_survey_events (id, survey_id, event_type, metadata_json) VALUES (?, ?, 'answered', ?)`).bind(`sve-${crypto.randomUUID()}`, row.id, JSON.stringify({ scoreBand: score <= 6 ? "detractor" : score <= 8 ? "passive" : "promoter" })),
      env.DB.prepare(`INSERT INTO saas_audit_log (id, clinic_id, actor_user_id, action, target_type, target_id, metadata_json) SELECT ?, ?, u.id, 'feedback_answered', 'feedback_survey', ?, ? FROM users u WHERE u.id = (SELECT provider_user_id FROM feedback_surveys WHERE id = ?) LIMIT 1`).bind(`sal-${crypto.randomUUID()}`, row.clinic_id, row.id, JSON.stringify({ score }), row.id),
    ]);
    return hubJson({ ok: true, status: "answered" });
  } catch (error) {
    console.error("[feedback.POST]", error);
    if (String(error).includes("OPERATIONAL_CRYPTO_NOT_CONFIGURED")) return hubError("Criptografia operacional não configurada.", "CRYPTO_NOT_CONFIGURED", 503);
    return hubError("Não foi possível registrar a resposta.", "FEEDBACK_WRITE_FAILED", 500);
  }
};
