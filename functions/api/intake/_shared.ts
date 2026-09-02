import {
  getRemoteIntakeTemplate,
  isRemoteIntakeFormKind,
  type RemoteIntakeFormKind,
} from "../../../shared/remote-intake";
import {
  clinicalLiveEnabled,
  tenantError,
  type TenantEnv,
} from "../tenant/_core";
import {
  clinicalBlindIndex,
  clinicalCryptoReady,
} from "../tenant/_crypto";

const INVITATION_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,119}$/;
const TOKEN_SECRET = /^[A-Za-z0-9_-]{40,80}$/;
const MAX_RESPONSE_BYTES = 100_000;

export function cleanIntakeText(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function isPlainIntakeObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function intakePayloadBytes(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).byteLength;
}

export function requireRemoteIntakeConfiguration(env: TenantEnv): Response | null {
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

export async function createRemoteIntakeToken(
  env: TenantEnv,
  clinicId: string,
  invitationId: string,
): Promise<{ token: string; tokenHash: string }> {
  const secretBytes = new Uint8Array(32);
  crypto.getRandomValues(secretBytes);
  const secret = base64Url(secretBytes);
  const tokenHash = await clinicalBlindIndex(env, clinicId, "remote-intake-token", secret);
  return { token: `${invitationId}.${secret}`, tokenHash };
}

export function parseRemoteIntakeToken(token: string): { invitationId: string; secret: string } | null {
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

export async function verifyRemoteIntakeSecret(
  env: TenantEnv,
  clinicId: string,
  secret: string,
  expectedHash: string,
): Promise<boolean> {
  const actualHash = await clinicalBlindIndex(env, clinicId, "remote-intake-token", secret);
  return constantTimeTextEqual(actualHash, expectedHash);
}

export function readRemoteIntakeToken(request: Request): string {
  const authorization = request.headers.get("Authorization") ?? "";
  return authorization.startsWith("Intake ") ? authorization.slice(7).trim() : "";
}

export type RemoteIntakeResponseValidation =
  | { ok: true; responses: Record<string, string | boolean> }
  | { ok: false; message: string };

export function validateRemoteIntakeResponses(
  formKind: unknown,
  rawResponses: unknown,
): RemoteIntakeResponseValidation {
  if (!isRemoteIntakeFormKind(formKind)) {
    return { ok: false, message: "Tipo de formulário inválido." };
  }
  if (!isPlainIntakeObject(rawResponses)) {
    return { ok: false, message: "Respostas devem ser um objeto." };
  }
  if (intakePayloadBytes(rawResponses) > MAX_RESPONSE_BYTES) {
    return { ok: false, message: "Respostas excedem o limite permitido." };
  }

  const template = getRemoteIntakeTemplate(formKind);
  const questions = new Map(template.questions.map((question) => [question.id, question]));
  const normalized: Record<string, string | boolean> = {};

  for (const key of Object.keys(rawResponses)) {
    if (!questions.has(key)) {
      return { ok: false, message: "O formulário contém uma resposta não reconhecida." };
    }
  }

  for (const question of template.questions) {
    const value = rawResponses[question.id];
    if (question.type === "yes_no") {
      if (value == null || value === "") {
        if (question.required) return { ok: false, message: `Campo obrigatório: ${question.label}` };
        continue;
      }
      if (typeof value !== "boolean") {
        return { ok: false, message: `Resposta inválida: ${question.label}` };
      }
      normalized[question.id] = value;
      continue;
    }

    const maxLength = question.maxLength ?? (question.type === "short_text" ? 500 : 5_000);
    const text = cleanIntakeText(value, maxLength);
    if (question.required && !text) {
      return { ok: false, message: `Campo obrigatório: ${question.label}` };
    }
    if (text) normalized[question.id] = text;
  }

  return { ok: true, responses: normalized };
}

export function remoteIntakeFormId(kind: RemoteIntakeFormKind): string {
  return `remote-intake:${kind}:v1`;
}
