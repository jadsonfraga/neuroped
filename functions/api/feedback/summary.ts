import { getContextUser } from "../auth/_authorization";
import { decryptText } from "../operations/_core";
import {
  ensureSaasHubSchema,
  hubError,
  hubJson,
  resolveHubClinic,
  type HubEnv,
} from "../saas/_core";
import { membershipCanReadClinical } from "../tenant/_core";

type Env = HubEnv & { OPERATIONAL_DATA_KEY?: string };

interface SurveyRow {
  id: string;
  appointment_id: string | null;
  status: string;
  score: number | null;
  comment_encrypted: string | null;
  expires_at: string;
  answered_at: string | null;
  created_at: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;
  const user = getContextUser(context);
  if (!db) return hubError("Banco SaaS não configurado.", "SAAS_DB_NOT_CONFIGURED", 503);
  if (!user) return hubError("Não autenticado.", "UNAUTHENTICATED", 401);
  try {
    await ensureSaasHubSchema(db);
    const resolved = await resolveHubClinic(db, context.request, user);
    if (!resolved) return hubError("Informe uma clínica ativa no cabeçalho X-Clinic-Id.", "HUB_CLINIC_REQUIRED", 400);
    if (!membershipCanReadClinical(resolved.membership)) return hubError("Acesso ao NPS negado.", "HUB_FORBIDDEN", 403);
    const result = await db.prepare(
      `SELECT id, appointment_id, status, score, comment_encrypted, expires_at, answered_at, created_at
         FROM feedback_surveys WHERE clinic_id = ? ORDER BY created_at DESC LIMIT 500`,
    ).bind(resolved.clinicId).all<SurveyRow>();
    const surveys = await Promise.all((result.results ?? []).map(async (row) => ({
      id: row.id,
      appointmentId: row.appointment_id,
      status: row.status,
      score: row.score,
      comment: await decryptText(context.env, row.comment_encrypted),
      expiresAt: row.expires_at,
      answeredAt: row.answered_at,
      createdAt: row.created_at,
    })));
    const answered = surveys.filter((survey) => survey.status === "answered" && survey.score !== null);
    const promoters = answered.filter((survey) => (survey.score ?? 0) >= 9).length;
    const detractors = answered.filter((survey) => (survey.score ?? 0) <= 6).length;
    const distribution = Array.from({ length: 11 }, (_, score) => ({ score, count: answered.filter((survey) => survey.score === score).length }));
    return hubJson({
      clinic: resolved.membership,
      surveys,
      metrics: {
        invited: surveys.length,
        answered: answered.length,
        responseRate: surveys.length ? Math.round((answered.length / surveys.length) * 100) : 0,
        nps: answered.length ? Math.round(((promoters - detractors) / answered.length) * 100) : null,
        promoters,
        passives: answered.filter((survey) => (survey.score ?? 0) >= 7 && (survey.score ?? 0) <= 8).length,
        detractors,
      },
      distribution,
    });
  } catch (error) {
    console.error("[feedback.summary.GET]", error);
    return hubError("Não foi possível carregar o NPS.", "FEEDBACK_SUMMARY_FAILED", 500);
  }
};
