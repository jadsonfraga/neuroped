import { VERSION, MAX_BYTES, MAX_SECONDS, SAMPLE_FPS, MODEL_SCHEMA, ageBand, analysisPrompt, validateAnalysis } from "../../../../shared/obs60.ts";

export interface VideoEnv {
  OBS60_VIDEO_AI_ENABLED?: string;
  OBS60_PRIVACY_APPROVED?: string;
  OBS60_GEMINI_API_KEY?: string;
  OBS60_GEMINI_MODEL?: string;
}
export class VideoError extends Error {
  status: number;
  code: string;
  constructor(message: string, code: string, status = 400) { super(message); this.status = status; this.code = code; }
}
export function json(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}
export function configuration(env: VideoEnv) {
  const ready = env.OBS60_VIDEO_AI_ENABLED === "true" && env.OBS60_PRIVACY_APPROVED === "true" && Boolean(env.OBS60_GEMINI_API_KEY?.trim()) && /^gemini-[a-z0-9.-]{3,70}$/.test(env.OBS60_GEMINI_MODEL ?? "");
  return { configured: ready, version: VERSION, provider: "Google Gemini", model: ready ? env.OBS60_GEMINI_MODEL : null, maxBytes: MAX_BYTES, maxSeconds: MAX_SECONDS, sampleFpsRequested: SAMPLE_FPS,
    message: ready ? "Configuração detectada. A conexão e o processamento só serão confirmados após uma análise bem-sucedida. Uso experimental." : "Análise automática indisponível: ativação, aprovação institucional de privacidade e provedor de vídeo devem estar configurados no servidor. O guia continua disponível; nenhum resultado será simulado." };
}
export async function readLimitedText(response: Request | Response, limit: number): Promise<string> {
  if (!response.body) throw new VideoError("Corpo da requisição ausente.", "BODY_REQUIRED");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0; let text = "";
  try {
    for (;;) {
      const next = await reader.read(); if (next.done) break;
      bytes += next.value.byteLength;
      if (bytes > limit) { await reader.cancel(); throw new VideoError("Arquivo ou resposta excede o limite permitido.", "PAYLOAD_TOO_LARGE", 413); }
      text += decoder.decode(next.value, { stream: true });
    }
    return text + decoder.decode();
  } finally { reader.releaseLock(); }
}
export interface VideoInput { ageMonths: number; windowSeconds: number; consent: true; mime: string; data: string }
export function parseInput(raw: unknown): VideoInput {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new VideoError("Dados de envio inválidos.", "INVALID_INPUT");
  const r = raw as Record<string, unknown>;
  const keys = ["ageMonths", "windowSeconds", "consent", "mime", "data"];
  if (Object.keys(r).length !== keys.length || keys.some(k => !Object.hasOwn(r, k))) throw new VideoError("Campos de envio divergentes.", "INVALID_INPUT");
  if (r.consent !== true) throw new VideoError("Autorização explícita de envio à IA obrigatória.", "CONSENT_REQUIRED", 403);
  if (typeof r.ageMonths !== "number" || !ageBand(r.ageMonths)) throw new VideoError("Idade fora da faixa de 24 a 59 meses.", "INVALID_AGE");
  if (typeof r.windowSeconds !== "number" || !Number.isFinite(r.windowSeconds) || r.windowSeconds <= 0 || r.windowSeconds > MAX_SECONDS) throw new VideoError("Duração da janela inválida.", "INVALID_DURATION");
  if (!["video/mp4", "video/webm"].includes(String(r.mime))) throw new VideoError("Use vídeo MP4 ou WebM.", "INVALID_MEDIA", 415);
  if (typeof r.data !== "string" || !r.data || r.data.length > Math.ceil(MAX_BYTES / 3) * 4 || r.data.length % 4 || !/^[A-Za-z0-9+/]+={0,2}$/.test(r.data)) throw new VideoError("Bytes de vídeo ausentes ou inválidos; limite de 12 MB.", "INVALID_MEDIA", 415);
  let prefix: string;
  try { prefix = atob(r.data.slice(0, 32)); } catch { throw new VideoError("Codificação de vídeo inválida.", "INVALID_MEDIA", 415); }
  const mp4 = prefix.slice(4, 8) === "ftyp";
  const webm = [...prefix.slice(0, 4)].map(c => c.charCodeAt(0)).join(",") === "26,69,223,163";
  if ((r.mime === "video/mp4" && !mp4) || (r.mime === "video/webm" && !webm)) throw new VideoError("Conteúdo não corresponde ao formato informado.", "INVALID_MEDIA", 415);
  return r as unknown as VideoInput;
}
export async function sourceHash(data: string) {
  const bytes = Uint8Array.from(atob(data), c => c.charCodeAt(0));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map(n => n.toString(16).padStart(2, "0")).join("");
}
/** Real inline video transport. No URL fetch, SDK, secret in browser, persistence or invented fallback. */
export async function analyseVideo(input: VideoInput, env: VideoEnv, fetcher: typeof fetch = fetch, clientSignal?: AbortSignal) {
  if (!configuration(env).configured) throw new VideoError("Provedor de vídeo não configurado ou não autorizado.", "VIDEO_AI_UNAVAILABLE", 503);
  // Validate here too: tests/callers cannot bypass consent or actual media bytes.
  const checked = parseInput(input);
  const sha256 = await sourceHash(checked.data);
  const controller = new AbortController();
  // Distinguish "the client left" from "the provider took too long": both abort the same
  // fetch, but only a real 90s timeout should be reported/audited as VIDEO_TIMEOUT.
  let timedOut = false;
  const onTimeout = () => { timedOut = true; controller.abort(); };
  const onClientAbort = () => controller.abort();
  if (clientSignal?.aborted) throw new VideoError("Envio cancelado.", "REQUEST_ABORTED", 499);
  clientSignal?.addEventListener("abort", onClientAbort, { once: true });
  const timer = setTimeout(onTimeout, 90_000);
  try {
    const response = await fetcher(`https://generativelanguage.googleapis.com/v1beta/models/${env.OBS60_GEMINI_MODEL}:generateContent`, {
      method: "POST", redirect: "error", signal: controller.signal,
      headers: { "Content-Type": "application/json", "x-goog-api-key": env.OBS60_GEMINI_API_KEY! },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: analysisPrompt(checked.ageMonths, checked.windowSeconds) }] },
        contents: [{ role: "user", parts: [
          { inlineData: { mimeType: checked.mime, data: checked.data }, videoMetadata: { startOffset: "0s", endOffset: `${checked.windowSeconds}s`, fps: SAMPLE_FPS } },
          { text: "Extraia os seis registros somente deste vídeo, seguindo o contrato. O roteiro não prova execução." },
        ] }],
        generationConfig: { temperature: 0, candidateCount: 1, maxOutputTokens: 8192, responseMimeType: "application/json", responseSchema: MODEL_SCHEMA },
      }),
    });
    if (!response.ok) { await response.body?.cancel(); throw new VideoError("O provedor não concluiu a análise. Nenhum resultado foi gerado.", "VIDEO_PROVIDER_FAILURE", 502); }
    const payload = JSON.parse(await readLimitedText(response, 128 * 1024));
    const candidate = payload?.candidates?.[0];
    if (candidate?.finishReason !== "STOP" || !Array.isArray(candidate?.content?.parts)) throw new VideoError("Resposta incompleta ou bloqueada pelo provedor.", "INCOMPLETE_MODEL_RESPONSE", 502);
    const text = candidate.content.parts.filter((p: { thought?: boolean; text?: unknown }) => !p.thought && typeof p.text === "string").map((p: { text: string }) => p.text).join("");
    const result = validateAnalysis(JSON.parse(text), checked.ageMonths, checked.windowSeconds);
    return { result, sourceSha256: sha256, provider: "Google Gemini", model: typeof payload.modelVersion === "string" ? payload.modelVersion.slice(0, 100) : env.OBS60_GEMINI_MODEL, sampleFpsRequested: SAMPLE_FPS, analysedAt: new Date().toISOString(), reviewRequired: true };
  } catch (error) {
    if (error instanceof VideoError) throw error;
    if (timedOut) throw new VideoError("Tempo de processamento excedido; não houve conclusão.", "VIDEO_TIMEOUT", 504);
    if (controller.signal.aborted) throw new VideoError("Envio cancelado.", "REQUEST_ABORTED", 499);
    throw new VideoError("A resposta da IA não passou pelo contrato de evidência. Não foi produzido resultado clínico.", "MODEL_CONTRACT_REJECTED", 502);
  } finally { clearTimeout(timer); clientSignal?.removeEventListener("abort", onClientAbort); }
}
