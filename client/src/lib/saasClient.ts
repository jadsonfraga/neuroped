import { authFetch } from "@/lib/authClient";
import type { ClinicMembershipRole } from "@shared/tenant";

export interface BillingSnapshot {
  user: { id: string; email: string; name: string };
  membership: { clinicId: string; role: ClinicMembershipRole } | null;
  entitlement: {
    planId: string | null;
    subscriptionStatus: string | null;
    trialActive: boolean;
    trialEndsAt: string | null;
    isActive: boolean;
    isPastDue: boolean;
    isSuspended: boolean;
    deniedReason: string | null;
  };
}

export interface TenantRecord {
  id: string;
  slug: string;
  name: string;
  legalName: string | null;
  timezone: string;
  status: "active" | "suspended" | "closed";
  role: ClinicMembershipRole;
  membershipCreatedAt?: string;
}

export interface ClinicMember {
  userId: string;
  name: string;
  email: string | null;
  role: ClinicMembershipRole;
  active: boolean;
  globalRole: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClinicInvitation {
  id: string;
  email: string;
  role: ClinicMembershipRole;
  status: "pending" | "accepted" | "revoked" | "expired";
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
  last_sent_at: string | null;
  resend_count: number;
}

export interface CheckoutResponse {
  checkoutId: string;
  provider: string;
  providerCheckoutId: string;
  url: string;
  seats: number;
  monthlyPriceCents: number;
  currency: "BRL";
}

export class SaasApiError extends Error {
  code: string | null;
  status: number;

  constructor(message: string, status: number, code: string | null = null) {
    super(message);
    this.name = "SaasApiError";
    this.code = code;
    this.status = status;
  }
}

async function readResponse<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => null) as Record<string, unknown> | null;
  if (!response.ok) {
    const message = typeof body?.error === "string" ? body.error : `Operação indisponível (${response.status})`;
    const code = typeof body?.code === "string" ? body.code : null;
    throw new SaasApiError(message, response.status, code);
  }
  return body as T;
}

export async function getBillingSnapshot(clinicId: string): Promise<BillingSnapshot> {
  const query = new URLSearchParams({ clinicId, scope: "admin" });
  return readResponse<BillingSnapshot>(await authFetch(`/api/billing/me?${query.toString()}`));
}

export async function listTenants(): Promise<TenantRecord[]> {
  const body = await readResponse<{ data?: TenantRecord[] }>(await authFetch("/api/tenants"));
  return body.data ?? [];
}

export async function createTenant(input: {
  name: string;
  legalName?: string;
  slug?: string;
  timezone?: string;
}): Promise<TenantRecord> {
  return readResponse<TenantRecord>(await authFetch("/api/tenants", {
    method: "POST",
    body: JSON.stringify(input),
  }));
}

export async function listClinicMembers(clinicId: string): Promise<ClinicMember[]> {
  const body = await readResponse<{ data?: ClinicMember[] }>(await authFetch(`/api/tenants/${encodeURIComponent(clinicId)}/members`));
  return body.data ?? [];
}

export async function listInvitations(clinicId: string): Promise<ClinicInvitation[]> {
  const query = new URLSearchParams({ clinicId });
  const body = await readResponse<{ data?: ClinicInvitation[] }>(await authFetch(`/api/billing/invitations?${query.toString()}`));
  return body.data ?? [];
}

export async function createInvitation(input: {
  clinicId: string;
  email: string;
  role: ClinicMembershipRole;
}): Promise<{ id: string; email: string; role: ClinicMembershipRole; expiresAt: string; invitationUrl: string }> {
  return readResponse(await authFetch("/api/billing/invitations", {
    method: "POST",
    body: JSON.stringify(input),
  }));
}

export async function resendInvitation(clinicId: string, invitationId: string): Promise<{ invitationUrl: string; expiresAt: string }> {
  return readResponse(await authFetch("/api/billing/invitations", {
    method: "POST",
    body: JSON.stringify({ clinicId, action: "resend", invitationId }),
  }));
}

export async function revokeInvitation(clinicId: string, invitationId: string): Promise<void> {
  await readResponse(await authFetch(`/api/billing/invitations?clinicId=${encodeURIComponent(clinicId)}&invitationId=${encodeURIComponent(invitationId)}`, {
    method: "DELETE",
  }));
}

export async function startCheckout(clinicId: string, seats: number): Promise<CheckoutResponse> {
  return readResponse<CheckoutResponse>(await authFetch("/api/billing/checkout", {
    method: "POST",
    body: JSON.stringify({ clinicId, seats }),
  }));
}

export async function acceptInvitation(token: string, name: string, password: string): Promise<{ ok: true; clinicId: string; accountCreated: boolean }> {
  return readResponse(await authFetch("/api/billing/accept", {
    method: "POST",
    body: JSON.stringify({ token, name, password }),
  }));
}
