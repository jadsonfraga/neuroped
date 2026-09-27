import { getContextUser, canWriteClinicalData } from "../../auth/_authorization";
import { resolveBillingClinicId, requireBillingEntitlement } from "../../billing/_guard";
import { getClinicMembership, membershipCanWriteClinical, prepareSaasAudit } from "../../tenant/_core";
import { MAX_BYTES, VERSION } from "../../../../shared/obs60";
import { analyseVideo, configuration, json, parseInput, readLimitedText, VideoError, type VideoEnv } from "./_video";
interface Env extends VideoEnv { DB?: D1Database }
/** Global auth/session middleware and integration billing still apply. These guards also fail closed in isolation. */
export const onRequest: PagesFunction<Env> = async (context) => {
  try {
    if (!["GET", "POST"].includes(context.request.method)) return json({ error: "Método não permitido.", code: "METHOD_NOT_ALLOWED" }, 405);
    const db = context.env.DB;
    if (!db) return json({ error: "Backend autenticado indisponível.", code: "DB_REQUIRED" }, 503);
    const user = getContextUser(context);
    if (!user) return json({ error: "Sessão autenticada obrigatória.", code: "UNAUTHENTICATED" }, 401);
    if (!canWriteClinicalData(user)) return json({ error: "Perfil sem permissão clínica.", code: "FORBIDDEN" }, 403);
    const clinicId = await resolveBillingClinicId(db, user.id, context.request);
    if (!clinicId) return json({ error: "Selecione uma clínica autorizada.", code: "CLINIC_REQUIRED" }, 409);
    const membership = await getClinicMembership(db, clinicId, user);
    if (!membership || !membershipCanWriteClinical(membership)) return json({ error: "Vínculo clínico ativo obrigatório.", code: "FORBIDDEN" }, 403);
    const denial = await requireBillingEntitlement(db, user.id, clinicId, "clinical");
    if (denial) return denial;
    if (context.request.method === "GET") return json(configuration(context.env));
    if (!configuration(context.env).configured) return json({ error: configuration(context.env).message, code: "VIDEO_AI_UNAVAILABLE" }, 503);
    if (!(context.request.headers.get("Content-Type") ?? "").toLowerCase().includes("application/json")) return json({ error: "Envio JSON obrigatório.", code: "INVALID_CONTENT_TYPE" }, 415);
    let raw: unknown;
    try { raw = JSON.parse(await readLimitedText(context.request, Math.ceil(MAX_BYTES / 3) * 4 + 1024)); }
    catch (error) { if (error instanceof VideoError) throw error; throw new VideoError("JSON inválido.", "INVALID_INPUT"); }
    const input = parseInput(raw);
    const requestId = crypto.randomUUID();
    // No age, name, filename, transcript, video/hash or provider payload in the audit log.
    const audit = (action: string, extra: Record<string, string | number | boolean | null> = {}) =>
      prepareSaasAudit(db, { clinicId, actorUserId: user.id, action, targetType: "obs60", targetId: requestId, metadata: { protocol: VERSION, consent: true, ...extra } }).run();
    await audit("obs60.video_ai.requested");
    let output: Awaited<ReturnType<typeof analyseVideo>>;
    try {
      output = await analyseVideo(input, context.env, fetch, context.request.signal);
    } catch (error) {
      // A "requested" event without a paired "completed"/"failed" event would read as
      // stuck-in-progress; record the outcome so the audit trail always closes.
      await audit("obs60.video_ai.failed", { code: error instanceof VideoError ? error.code : "OBS60_FAILED" });
      throw error;
    }
    await audit("obs60.video_ai.completed");
    return json({ ...output, requestId });
  } catch (error) {
    if (error instanceof VideoError) return json({ error: error.message, code: error.code }, error.status);
    // Never expose database errors, credentials, raw media or upstream response text.
    return json({ error: "Não foi possível concluir a análise com segurança. Nenhum resultado foi disponibilizado.", code: "OBS60_FAILED" }, 503);
  }
};
