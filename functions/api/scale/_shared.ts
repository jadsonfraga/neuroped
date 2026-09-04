import { isRemoteScaleId, type RemoteScaleId } from "../../../shared/remoteScaleCatalog";
import { clinicalLiveEnabled, tenantError, type TenantEnv } from "../tenant/_core";
import { clinicalBlindIndex, clinicalCryptoReady } from "../tenant/_crypto";

const INVITATION_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,119}$/;
const TOKEN_SECRET = /^[A-Za-z0-9_-]{40,80}$/;
export const MAX_SCALE_ANSWERS_BYTES = 50_000;

export function cleanScaleText(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function isPlainScaleObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function scaleAnswersBytes(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).byteLength;
}

export function requireRemoteScaleConfiguration(env: TenantEnv): Response | null {
  if (!clinicalLiveEnabled(env)) {
    return tenantError("Clinical Core LIVE permanece bloqueado.", "CLINICAL_LIVE_DISABLED", 503);
  }
  if (!clinicalCryptoReady(env)) {
    return tenantError("Keyring clínico dedicado não configurado.", "CLINICAL_CRYPTO_NOT_CONFIGURED", 503);
  }
  return null;
}

function base64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export async function createRemoteScaleToken(
  env: TenantEnv,
  clinicId: string,
  invitationId: string,
): Promise<{ token: string; tokenHash: string }> {
  const secretBytes = new Uint8Array(32);
  crypto.getRandomValues(secretBytes);
  const secret = base64Url(secretBytes);
  const tokenHash = await clinicalBlindIndex(env, clinicId, "remote-scale-token", secret);
  return { token: `${invitationId}.${secret}`, tokenHash };
}

export function parseRemoteScaleToken(token: string): { invitationId: string; secret: string } | null {
  const separator = token.indexOf(".");
  if (separator <= 0 || separator !== token.lastIndexOf(".")) return null;
  const invitationId = token.slice(0, separator);
  const secret = token.slice(separator + 1);
  if (!INVITATION_ID.test(invitationId) || !TOKEN_SECRET.test(secret)) return null;
  return { invitationId, secret };
}

function constantTimeTextEqual(left: string, right: string): boolean {
  const length = Math.max(left.length, right.length);
  let mismatch = left.length ^ right.length;
  for (let index = 0; index < length; index += 1) {
    mismatch |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  }
  return mismatch === 0;
}

export async function verifyRemoteScaleSecret(
  env: TenantEnv,
  clinicId: string,
  secret: string,
  expectedHash: string,
): Promise<boolean> {
  const actualHash = await clinicalBlindIndex(env, clinicId, "remote-scale-token", secret);
  return constantTimeTextEqual(actualHash, expectedHash);
}

export function readRemoteScaleToken(request: Request): string {
  const authorization = request.headers.get("Authorization") ?? "";
  return authorization.startsWith("Scale ") ? authorization.slice(6).trim() : "";
}

export type RemoteScaleAnswersValidation =
  | { ok: true; answers: number[] }
  | { ok: false; message: string };

/**
 * Cada resposta é o índice (0-based) da opção escolhida NAQUELE item — nunca
 * o rótulo em texto livre, nunca o valor/peso da pontuação. O tamanho e o
 * intervalo válido de cada índice vêm do MESMO catálogo canônico usado para
 * montar a tela pública (shared/remoteScaleCatalog), nunca duplicados aqui.
 */
export function validateRemoteScaleAnswers(
  scaleId: unknown,
  rawAnswers: unknown,
  itemOptionCounts: readonly number[],
): RemoteScaleAnswersValidation {
  if (!isRemoteScaleId(scaleId)) {
    return { ok: false, message: "Escala inválida." };
  }
  if (!Array.isArray(rawAnswers) || rawAnswers.length !== itemOptionCounts.length) {
    return { ok: false, message: "É necessário responder a todos os itens." };
  }
  if (scaleAnswersBytes(rawAnswers) > MAX_SCALE_ANSWERS_BYTES) {
    return { ok: false, message: "Respostas excedem o limite permitido." };
  }

  const answers: number[] = [];
  for (let index = 0; index < itemOptionCounts.length; index += 1) {
    const value = rawAnswers[index];
    const optionCount = itemOptionCounts[index];
    if (!Number.isInteger(value) || value < 0 || value >= optionCount) {
      return { ok: false, message: `Resposta inválida no item ${index + 1}.` };
    }
    answers.push(value);
  }
  return { ok: true, answers };
}

export type { RemoteScaleId };
