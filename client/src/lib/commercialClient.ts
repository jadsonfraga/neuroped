import { authFetch } from "@/lib/authClient";
import type { CommercialFeatureCode } from "@shared/commercial";

/**
 * Cliente da camada comercial.
 *
 * O servidor é a única autoridade de entitlement: nada aqui calcula permissão a
 * partir de papel, preço, query string ou estado local. Estas funções apenas
 * transportam o veredito e falham fechado quando a resposta não é conclusiva.
 */

export interface CommercialLicenseView {
  id: string;
  offerCode: string;
  offerName: string;
  contractVersion?: string;
  status: "pending" | "active" | "suspended" | "expired" | "canceled";
  unitLabel: string;
  activatedAt: string | null;
  expiresAt: string | null;
  authorizedUsers: number;
  maxAuthorizedUsers: number;
  currentUserAuthorized: boolean;
  supportMinutes: number;
  supportMinutesUsed: number;
}

export interface CommercialSnapshot {
  clinic: { id: string; name: string; role: string; status: string };
  license: CommercialLicenseView | null;
  capabilities: Record<CommercialFeatureCode, boolean>;
}

export interface CommercialMaterialView {
  code: CommercialFeatureCode;
  title: string;
  summary: string;
  routes: string[];
  surface: "institutional" | "public-intake";
  deliveryChannel: "app_screen";
  licensed: boolean;
  deniedReason: string | null;
}

export interface CommercialMaterialsResponse {
  clinic: { id: string; name: string; role: string };
  licenseStatus: string | null;
  currentUserAuthorized: boolean;
  materials: CommercialMaterialView[];
}

export interface CommercialSeat {
  userId: string;
  name: string | null;
  email: string | null;
  role: string;
  authorized: boolean;
}

export interface CommercialSeatsResponse {
  licenseId: string;
  licenseStatus: string;
  maxAuthorizedUsers: number;
  authorizedUsers: number;
  members: CommercialSeat[];
}

export class CommercialRequestError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = "CommercialRequestError";
    this.code = code;
    this.status = status;
  }
}

async function commercialRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await authFetch(path, init);
  const body = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  if (!response.ok) {
    throw new CommercialRequestError(
      typeof body?.error === "string" ? body.error : "Camada comercial indisponível.",
      typeof body?.code === "string" ? body.code : "COMMERCIAL_REQUEST_FAILED",
      response.status,
    );
  }
  if (!body) {
    throw new CommercialRequestError(
      "Resposta comercial inválida.",
      "COMMERCIAL_RESPONSE_INVALID",
      response.status,
    );
  }
  return body as T;
}

export function fetchCommercialSnapshot(clinicId: string): Promise<CommercialSnapshot> {
  return commercialRequest<CommercialSnapshot>(
    `/api/commercial/me?clinicId=${encodeURIComponent(clinicId)}`,
  );
}

export function fetchCommercialMaterials(clinicId: string): Promise<CommercialMaterialsResponse> {
  return commercialRequest<CommercialMaterialsResponse>(
    `/api/commercial/materials?clinicId=${encodeURIComponent(clinicId)}`,
  );
}

/** Confirma no servidor que esta abertura é legítima e a registra no ledger. */
export function openCommercialMaterial(
  clinicId: string,
  code: CommercialFeatureCode,
): Promise<{ material: { code: string; title: string } }> {
  return commercialRequest(
    `/api/commercial/materials/${encodeURIComponent(code)}?clinicId=${encodeURIComponent(clinicId)}`,
  );
}

export function recordCommercialMaterialExport(
  clinicId: string,
  code: CommercialFeatureCode,
  channel: "print" | "email" | "copy" | "download",
): Promise<{ recorded: boolean }> {
  return commercialRequest(
    `/api/commercial/materials/${encodeURIComponent(code)}?clinicId=${encodeURIComponent(clinicId)}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ channel }) },
  );
}

export function fetchCommercialSeats(clinicId: string): Promise<CommercialSeatsResponse> {
  return commercialRequest<CommercialSeatsResponse>(
    `/api/commercial/users?clinicId=${encodeURIComponent(clinicId)}`,
  );
}

export function grantCommercialSeat(clinicId: string, userId: string): Promise<unknown> {
  return commercialRequest(`/api/commercial/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clinicId, userId }),
  });
}

export function revokeCommercialSeat(clinicId: string, userId: string): Promise<unknown> {
  return commercialRequest(
    `/api/commercial/users?clinicId=${encodeURIComponent(clinicId)}&userId=${encodeURIComponent(userId)}`,
    { method: "DELETE" },
  );
}

/**
 * As três fronteiras contratuais viajam exatamente como o gestor as marcou na
 * tela. O cliente nunca as preenche por conveniência: um aceite que o gestor
 * não deu conscientemente não é aceite.
 */
export function acceptCommercialLicense(input: {
  clinicId: string;
  licenseId: string;
  termsVersion: string;
  authorizedUserIds: string[];
  acceptsNoPatientData: boolean;
  acceptsNoMedicalService: boolean;
  acceptsNoRedistribution: boolean;
}): Promise<unknown> {
  return commercialRequest(`/api/commercial/accept`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}
