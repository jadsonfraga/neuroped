import { useEffect, useState } from "react";
import { authFetch, getAccessToken } from "@/lib/authClient";

/**
 * Emissor de documentos clínicos — fonte única de identidade.
 *
 * A identidade que assina laudos/receitas é a do USUÁRIO autenticado
 * (user_profiles); o papel timbrado (endereço/contato/razão social) é da
 * CLÍNICA ativa (clinic_settings). Nenhum template pode mais carregar
 * identidade hardcoded: sem perfil configurado, o documento declara a
 * ausência de registro — credencial profissional nunca é inventada.
 */
export interface DocumentIssuer {
  doctorName: string;
  credentialsLine: string;
  specialty: string;
  documentEmail: string;
  clinicName: string;
  addressLine1: string;
  addressLine2: string;
  phone: string;
  publicEmail: string;
  companyLine: string;
  motto: string;
  /** true quando o perfil profissional foi salvo em Configurações → Perfil. */
  profileConfigured: boolean;
}

export const UNCONFIGURED_CREDENTIALS_NOTICE =
  "Registro profissional não configurado — Configurações › Perfil";

export function issuerCredentials(issuer: DocumentIssuer): string {
  return issuer.credentialsLine || UNCONFIGURED_CREDENTIALS_NOTICE;
}

/** Linha de contato do rodapé institucional (só o que existir). */
export function issuerContactLine(issuer: DocumentIssuer): string {
  return [issuer.addressLine1, issuer.addressLine2, issuer.phone, issuer.publicEmail]
    .filter(Boolean)
    .join(" · ");
}

/**
 * Melhor esforço para "Cidade/UF" do papel timbrado a partir da segunda linha
 * de endereço configurada (ex.: "Petrolina/PE — CEP 56302-470" → "Petrolina/PE").
 * Vazio quando a clínica não configurou endereço — nunca inventado.
 */
export function issuerCityLine(issuer: DocumentIssuer): string {
  return (issuer.addressLine2 || "")
    .split(/CEP/i)[0]
    .replace(/[\s—·,-]+$/, "")
    .trim();
}

const EMPTY_ISSUER: DocumentIssuer = {
  doctorName: "",
  credentialsLine: "",
  specialty: "",
  documentEmail: "",
  clinicName: "",
  addressLine1: "",
  addressLine2: "",
  phone: "",
  publicEmail: "",
  companyLine: "",
  motto: "",
  profileConfigured: false,
};

interface ProfileResponse {
  displayName: string;
  credentialsLine: string;
  specialty: string;
  documentEmail: string;
  configured: boolean;
  fallbackDisplayName: string;
  accountEmail: string;
}

interface TenantResponse {
  name: string;
  settings?: {
    displayName: string;
    addressLine1: string;
    addressLine2: string;
    phone: string;
    publicEmail: string;
    companyLine: string;
    motto: string;
  };
}

let cachedIssuer: DocumentIssuer | null = null;
let cacheKey = "";
let inflight: Promise<DocumentIssuer> | null = null;

function activeClinicId(): string {
  try {
    return sessionStorage.getItem("neuroped:active-clinic-id") ?? "";
  } catch {
    return "";
  }
}

export async function loadIssuer(): Promise<DocumentIssuer> {
  // Sem sessão (mirror estático, preview, auditoria de performance) não há
  // identidade a buscar: devolve o emissor vazio sem tocar a rede — um 401
  // esperado ainda apareceria como erro no console do navegador.
  if (!getAccessToken()) return { ...EMPTY_ISSUER };

  const key = activeClinicId();
  if (cachedIssuer && cacheKey === key) return cachedIssuer;
  if (inflight) return inflight;

  inflight = (async () => {
    let issuer = { ...EMPTY_ISSUER };
    try {
      const profileResponse = await authFetch("/api/me/profile");
      if (profileResponse.ok) {
        const profile = (await profileResponse.json()) as ProfileResponse;
        issuer = {
          ...issuer,
          doctorName: profile.displayName || profile.fallbackDisplayName,
          credentialsLine: profile.credentialsLine,
          specialty: profile.specialty,
          documentEmail: profile.documentEmail || profile.accountEmail,
          profileConfigured: profile.configured,
        };
      }
    } catch {
      // Sem backend (mirror local): o emissor fica vazio e o template declara.
    }
    if (key) {
      try {
        const tenantResponse = await authFetch(`/api/tenants/${key}`);
        if (tenantResponse.ok) {
          const tenant = (await tenantResponse.json()) as TenantResponse;
          issuer = {
            ...issuer,
            clinicName: tenant.settings?.displayName || tenant.name || "",
            addressLine1: tenant.settings?.addressLine1 ?? "",
            addressLine2: tenant.settings?.addressLine2 ?? "",
            phone: tenant.settings?.phone ?? "",
            publicEmail: tenant.settings?.publicEmail ?? "",
            companyLine: tenant.settings?.companyLine ?? "",
            motto: tenant.settings?.motto ?? "",
          };
        }
      } catch {
        // Papel timbrado ausente não impede a emissão: segue só a identidade.
      }
    }
    cachedIssuer = issuer;
    cacheKey = key;
    return issuer;
  })().finally(() => {
    inflight = null;
  });
  return inflight;
}

/** Invalida o cache (após salvar Perfil/Clínica em Configurações). */
export function invalidateIssuerCache(): void {
  cachedIssuer = null;
  cacheKey = "";
}

export function useIssuer(): { issuer: DocumentIssuer; loading: boolean } {
  const [issuer, setIssuer] = useState<DocumentIssuer>(cachedIssuer ?? EMPTY_ISSUER);
  const [loading, setLoading] = useState(!cachedIssuer || cacheKey !== activeClinicId());

  useEffect(() => {
    let cancelled = false;
    void loadIssuer().then((loaded) => {
      if (!cancelled) {
        setIssuer(loaded);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { issuer, loading };
}
