import { canWriteClinicalData, getContextUser } from "../../auth/_authorization";
import { requireBillingEntitlement } from "../../billing/_guard";
import { clinicalLiveEnabled, getClinicMembership, isReservedTechnicalEmail, membershipCanWriteClinical, tenantJson, tenantError, type TenantEnv } from "../../tenant/_core";
import { clinicalCryptoReady } from "../../tenant/_crypto";
import { EscutaError, MAX_WAV_BYTES, SYSTEM_PROMPT, NOTE_SCHEMA, validateWav, validateNote, validateTranscript } from "../../../../shared/escuta/core";

interface Env extends TenantEnv { AI?: { run(model: string, input: Record<string, unknown>): Promise<unknown> }; ESCUTA_ENABLED?: string }
const STT = "@cf/openai/whisper-large-v3-turbo";
const LLM = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const BODY_LIMIT = Math.ceil(MAX_WAV_BYTES * 4 / 3) + 4096;
function runtimeError(env: Env): EscutaError | null {
  if (!clinicalLiveEnabled(env)) return new EscutaError("CLINICAL_LIVE_DISABLED", "A camada clínica não está habilitada neste ambiente.", 503);
  if (!clinicalCryptoReady(env)) return new EscutaError("CLINICAL_CRYPTO_NOT_CONFIGURED", "A proteção dos documentos clínicos não está configurada.", 503);
  if (env.ESCUTA_ENABLED !== "true" || !env.AI) return new EscutaError("ESCUTA_NOT_CONFIGURED", "Escuta Clínica ainda não habilitada neste ambiente. Nenhum áudio foi enviado ao provedor.", 503);
  return null;
}
function failureResponse(error: unknown, requestId: string): Response {
  const failure = error instanceof EscutaError ? error : new EscutaError("ESCUTA_UNAVAILABLE", "Processamento indisponível. Nenhum resultado foi simulado; o conteúdo permanece no navegador.", 503);
  return tenantJson({ error: failure.message, code: failure.code, requestId }, failure.status);
}
async function authorize(context: { env: Env; data?: unknown }, clinicId: string): Promise<Response | null> {
  const user = getContextUser(context);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);
  if (!context.env.DB) return tenantError("Banco clínico indisponível.", "DB_REQUIRED", 503);
  if (isReservedTechnicalEmail(context.env, user.email) || !canWriteClinicalData(user)) return tenantError("Acesso clínico não autorizado.", "TENANT_FORBIDDEN", 403);
  if (!/^[A-Za-z0-9_-]{1,80}$/.test(clinicId)) return tenantError("Selecione uma clínica válida.", "CLINIC_REQUIRED", 400);
  const membership = await getClinicMembership(context.env.DB, clinicId, user);
  if (!membership || !membershipCanWriteClinical(membership)) return tenantError("Acesso negado para esta clínica.", "TENANT_FORBIDDEN", 403);
  return requireBillingEntitlement(context.env.DB, user.id, clinicId, "clinical");
}
async function readBody(request: Request): Promise<Record<string, unknown>> {
  if (!request.headers.get("content-type")?.includes("application/json")) throw new EscutaError("INVALID_CONTENT_TYPE", "Envie JSON.", 415);
  if (Number(request.headers.get("content-length")) > BODY_LIMIT) throw new EscutaError("PAYLOAD_TOO_LARGE", "Requisição excede o limite.", 413);
  const reader = request.body?.getReader(); if (!reader) throw new EscutaError("INVALID_JSON", "Corpo ausente.", 400);
  const parts: Uint8Array[] = []; let size = 0;
  try { while (true) { const { done, value } = await reader.read(); if (done) break; size += value.length; if (size > BODY_LIMIT) { await reader.cancel(); throw new EscutaError("PAYLOAD_TOO_LARGE", "Requisição excede o limite.", 413); } parts.push(value); } } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size); let offset = 0; for (const part of parts) { bytes.set(part, offset); offset += part.length; }
  let value: unknown; try { value = JSON.parse(new TextDecoder().decode(bytes)); } catch { throw new EscutaError("INVALID_JSON", "JSON inválido.", 400); }
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new EscutaError("INVALID_JSON", "Objeto JSON obrigatório.", 400);
  return value as Record<string, unknown>;
}
/** Reserva atômica antes da inferência. Erro do banco bloqueia, não zera o consumo. Não guarda conteúdo. */
async function reserveUsage(db: D1Database, clinicId: string, userId: string): Promise<void> {
  const schema = await db.prepare(`CREATE TABLE IF NOT EXISTS escuta_usage (clinic_id TEXT NOT NULL, user_id TEXT NOT NULL, day TEXT NOT NULL, used INTEGER NOT NULL, PRIMARY KEY(clinic_id,user_id,day))`).run();
  if (!schema.success) throw new EscutaError("QUOTA_UNAVAILABLE", "Contagem de uso indisponível.", 503);
  const day = new Date().toISOString().slice(0,10);
  const result = await db.prepare(`INSERT INTO escuta_usage(clinic_id,user_id,day,used) VALUES(?,?,?,1) ON CONFLICT(clinic_id,user_id,day) DO UPDATE SET used=escuta_usage.used+1 WHERE escuta_usage.used<720`).bind(clinicId,userId,day).run();
  if (!result.success) throw new EscutaError("QUOTA_UNAVAILABLE", "Contagem de uso indisponível.", 503);
  if (!result.meta.changes) throw new EscutaError("QUOTA_EXCEEDED", "Limite diário de processamento atingido.", 429);
  const cleanup = await db.prepare(`DELETE FROM escuta_usage WHERE clinic_id=? AND user_id=? AND day<?`).bind(clinicId,userId,new Date(Date.now()-7*86400000).toISOString().slice(0,10)).run();
  if (!cleanup.success) throw new EscutaError("QUOTA_UNAVAILABLE", "Contagem de uso indisponível.", 503);
}
async function inference(ai: NonNullable<Env["AI"]>, model: string, input: Record<string, unknown>): Promise<unknown> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try { return await Promise.race([ai.run(model,input), new Promise((_,reject) => { timer = setTimeout(() => reject(new EscutaError("PROVIDER_TIMEOUT", "O provedor excedeu o tempo. O áudio continua disponível no navegador.", 504)),90000); })]); }
  finally { if (timer) clearTimeout(timer); }
}
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const requestId = crypto.randomUUID();
  try {
    const clinicId = new URL(context.request.url).searchParams.get("clinicId") || "";
    const denial = await authorize(context, clinicId); if (denial) return denial;
    const unavailable = runtimeError(context.env);
    return tenantJson({ configured: Boolean(context.env.AI) && clinicalCryptoReady(context.env), enabled: unavailable === null, code: unavailable?.code ?? null, message: unavailable?.message ?? null, models: { transcription: STT, note: LLM }, maxChunkSeconds: 60, maxRecordingSeconds: 3600, audioStored: false, clinicalValidation: "pending", requestId });
  } catch (error) { return failureResponse(error, requestId); }
};
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const requestId = crypto.randomUUID(); const started = Date.now();
  try {
    const user = getContextUser(context); const db = context.env.DB;
    if (!user) throw new EscutaError("UNAUTHENTICATED", "Não autenticado.", 401);
    if (!db) throw new EscutaError("DB_REQUIRED", "Banco clínico indisponível.", 503);
    const body = await readBody(context.request);
    const clinicId = typeof body.clinicId === "string" ? body.clinicId : "";
    const denial = await authorize(context, clinicId); if (denial) return denial;
    const unavailable = runtimeError(context.env); if (unavailable) throw unavailable;
    const ai = context.env.AI;
    if (!ai) throw new EscutaError("ESCUTA_NOT_CONFIGURED", "Provedor não configurado.", 503);
    if (body.recordingAcknowledged !== true) throw new EscutaError("RECORDING_ACK_REQUIRED", "Confirme a autorização da gravação e processamento.", 400);
    if (body.action === "transcribe") {
      if (typeof body.audio !== "string" || body.audio.length > Math.ceil(MAX_WAV_BYTES*4/3) || !/^[A-Za-z0-9+/]+={0,2}$/.test(body.audio)) throw new EscutaError("INVALID_AUDIO", "Codificação de áudio inválida.");
      let binary: string; try { binary = atob(body.audio); } catch { throw new EscutaError("INVALID_AUDIO", "Codificação inválida."); }
      const bytes = Uint8Array.from(binary,c=>c.charCodeAt(0)); validateWav(bytes);
      await reserveUsage(db,clinicId,user.id);
      const result = await inference(ai,STT,{ audio: body.audio, language: "pt", task: "transcribe", vad_filter: true, condition_on_previous_text: false }) as { text?: unknown };
      if (typeof result?.text !== "string" || !result.text.trim()) throw new EscutaError("NO_SPEECH", "Nenhuma fala reconhecida. O trecho deve ser revisado.");
      if (result.text.length > 12000) throw new EscutaError("INVALID_TRANSCRIPT", "Resposta de transcrição inválida.", 502);
      return tenantJson({ transcript: result.text.trim(), requestId, model: STT, processingMs: Date.now()-started });
    }
    if (body.action !== "generate") throw new EscutaError("INVALID_ACTION", "Ação inválida.", 400);
    const transcript = validateTranscript(body.transcript); await reserveUsage(db,clinicId,user.id);
    const result = await inference(ai,LLM,{ messages: [{ role: "system", content: SYSTEM_PROMPT },{ role: "user", content: JSON.stringify({ transcript }) }], temperature: 0, max_tokens: 6500, response_format: { type: "json_schema", json_schema: NOTE_SCHEMA } }) as { response?: unknown };
    return tenantJson({ note: validateNote(result?.response,transcript), requestId, model: LLM, processingMs: Date.now()-started });
  } catch (error) { return failureResponse(error, requestId); }
};
