import type { TenantEnv } from "../tenant/_core";

export const INVITABLE_ROLES = [
  "clinic_admin",
  "professional",
  "assistant",
  "financial",
] as const;

export type InvitableRole = (typeof INVITABLE_ROLES)[number];

export function normalizeInviteEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLocaleLowerCase("en-US").slice(0, 320) : "";
}

export function isInvitableRole(value: unknown): value is InvitableRole {
  return typeof value === "string" && (INVITABLE_ROLES as readonly string[]).includes(value);
}

export function randomInviteToken(): string {
  return `${crypto.randomUUID().replaceAll("-", "")}${crypto.randomUUID().replaceAll("-", "")}`;
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function operationalBlindHash(
  env: TenantEnv,
  clinicId: string,
  purpose: string,
  value: string,
): Promise<string> {
  const secret = env.OPERATIONAL_DATA_KEY?.trim() ?? "";
  if (secret.length < 32) throw new Error("OPERATIONAL_CRYPTO_NOT_CONFIGURED");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${clinicId}|${purpose}|${value}`),
  );
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function inviteEmailHash(
  env: TenantEnv,
  clinicId: string,
  email: string,
): Promise<string> {
  return operationalBlindHash(env, clinicId, "invite-email", email);
}
