/**
 * NeuroPed SaaS Onboarding — convites de criação/ingresso em clínica.
 *
 * Fluxo do funil (issue #594):
 *   criar clínica → owner → convite por e-mail → aceite com token →
 *   primeiro profissional/assistente — tudo sem intervenção manual.
 *
 * - token: bytes aleatórios gerados na rota e armazenados como SHA-256;
 * - expiração padrão: 7 dias; reenvio reseta `last_sent_at` (máx. 3 reenvios/dia
 *   é política da rota, não do domínio);
 * - aceite: cria `clinic_memberships` se o usuário já existe ou pendencia o
 *   cadastro (o registro normal consulta `clinic_invitations` pelo e-mail).
 */
import { randomBytes } from "crypto";
import {
  canManageClinic,
  isClinicMembershipRole,
  type ClinicMembershipRole,
} from "../../../shared/tenant";
import { isInvitationAcceptable } from "../../../shared/billing";

export const INVITATION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias
export const INVITATION_TOKEN_BYTES = 32;

export interface InvitationInput {
  clinicId: string;
  invitedByUserId: string;
  email: string;
  role: string;
  expiresAt?: Date;
}

export function generateInvitationToken(): { token: string; tokenHash: string } {
  const token = randomBytes(INVITATION_TOKEN_BYTES).toString("base64url");
  const { createHash } = require("crypto") as typeof import("crypto");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  return { token, tokenHash };
}

export function normalizeInvitationEmail(email: string): string | null {
  const value = String(email ?? "").trim().toLowerCase();
  if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)) return null;
  if (value.length > 320) return null;
  return value;
}

export function validateRoleForInvitation(role: string): role is ClinicMembershipRole {
  return isClinicMembershipRole(role);
}

/**
 * Valida o aceite de um convite (domínio + dados da linha).
 * Retorna erro quando revogado/expirado/aceito; nunca aceita um convite cujo
 * usuário não corresponde ao e-mail convidado (a comparação de e-mail é feita
 * na rota, após a leitura da linha).
 */
export function validateInvitationForAccept(row: {
  status: string;
  expires_at: string;
}): { ok: boolean; reason?: string } {
  return isInvitationAcceptable({ status: row.status as never, expiresAt: row.expires_at });
}

export function canManageClinicByRole(role: string): boolean {
  return canManageClinic(role as ClinicMembershipRole);
}

/** Datas formatadas para inserção D1 (UTC ISO). */
export function isoUtc(date: Date): string {
  return date.toISOString().slice(0, 19).replace("T", " ");
}
