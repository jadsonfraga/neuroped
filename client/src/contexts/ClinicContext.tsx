import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { authFetch } from "@/lib/authClient";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";

export interface ClinicMembership {
  id: string;
  slug: string;
  name: string;
  legalName: string | null;
  timezone: string;
  status: "active" | "suspended" | "closed";
  role: "owner" | "clinic_admin" | "professional" | "assistant" | "financial";
  membershipCreatedAt?: string;
}

interface ClinicContextValue {
  clinics: ClinicMembership[];
  activeClinicId: string | null;
  activeClinic: ClinicMembership | null;
  isLoading: boolean;
  error: string | null;
  setActiveClinicId: (clinicId: string) => void;
  reloadClinics: () => Promise<void>;
}

const ACTIVE_CLINIC_KEY = "neuroped:active-clinic-id";
const ClinicContext = createContext<ClinicContextValue | undefined>(undefined);

function readStoredClinicId(): string | null {
  try {
    return sessionStorage.getItem(ACTIVE_CLINIC_KEY);
  } catch {
    return null;
  }
}

function persistClinicId(clinicId: string | null): void {
  try {
    if (clinicId) sessionStorage.setItem(ACTIVE_CLINIC_KEY, clinicId);
    else sessionStorage.removeItem(ACTIVE_CLINIC_KEY);
  } catch {
    // O identificador de contexto não é requisito de segurança; o servidor é a autoridade.
  }
}

async function clearClinicalClientCaches(): Promise<void> {
  try {
    await queryClient.cancelQueries();
  } finally {
    // A troca de tenant não pode deixar dados da clínica anterior em cache ou na
    // árvore de observers. O reload posterior recria todos os observers já sob o
    // novo clinic_id e evita qualquer reaproveitamento de memória React anterior.
    queryClient.clear();
  }
}

export function ClinicProvider({ children }: { children: ReactNode }) {
  const { accessMode, isAuthenticated, user } = useAuth();
  const [clinics, setClinics] = useState<ClinicMembership[]>([]);
  const [activeClinicId, setActiveClinicIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const switchGeneration = useRef(0);

  const reloadClinics = useCallback(async () => {
    if (accessMode !== "remote" || !isAuthenticated || user?.mustChangePassword) {
      setClinics([]);
      setActiveClinicIdState(null);
      persistClinicId(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await authFetch("/api/tenants");
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(typeof body?.error === "string" ? body.error : "Não foi possível carregar as clínicas.");
      }
      const body = await response.json() as { data?: ClinicMembership[] };
      const nextClinics = (body.data ?? []).filter((clinic) => clinic.status === "active");
      setClinics(nextClinics);
      const stored = readStoredClinicId();
      const nextActive = nextClinics.some((clinic) => clinic.id === stored)
        ? stored
        : (nextClinics[0]?.id ?? null);
      setActiveClinicIdState(nextActive);
      persistClinicId(nextActive);
    } catch (cause) {
      setClinics([]);
      setActiveClinicIdState(null);
      setError(cause instanceof Error ? cause.message : "Não foi possível carregar as clínicas.");
    } finally {
      setIsLoading(false);
    }
  }, [accessMode, isAuthenticated, user?.mustChangePassword]);

  useEffect(() => {
    void reloadClinics();
  }, [reloadClinics]);

  const setActiveClinicId = useCallback((clinicId: string) => {
    if (!clinics.some((clinic) => clinic.id === clinicId && clinic.status === "active")) return;
    if (clinicId === activeClinicId) return;

    // Troca de clínica é uma fronteira de segurança, não apenas uma preferência
    // de UI. Primeiro removemos o contexto antigo para que nenhuma nova query
    // possa sair com o tenant anterior enquanto os caches são descartados.
    const generation = ++switchGeneration.current;
    setActiveClinicIdState(null);
    persistClinicId(null);

    void (async () => {
      await clearClinicalClientCaches();
      if (generation !== switchGeneration.current) return;

      // O clinic_id não contém PHI e serve somente para reidratar o contexto.
      // Recarregar o shell descarta memória React, observers e closures do tenant
      // anterior por construção. O backend continua sendo a autoridade de acesso.
      persistClinicId(clinicId);
      if (typeof window !== "undefined") {
        window.location.reload();
        return;
      }
      setActiveClinicIdState(clinicId);
    })();
  }, [activeClinicId, clinics]);

  const activeClinic = clinics.find((clinic) => clinic.id === activeClinicId) ?? null;
  const value = useMemo(
    () => ({
      clinics,
      activeClinicId,
      activeClinic,
      isLoading,
      error,
      setActiveClinicId,
      reloadClinics,
    }),
    [clinics, activeClinicId, activeClinic, isLoading, error, setActiveClinicId, reloadClinics],
  );

  return <ClinicContext.Provider value={value}>{children}</ClinicContext.Provider>;
}

export function useClinic(): ClinicContextValue {
  const context = useContext(ClinicContext);
  if (!context) throw new Error("useClinic must be used within <ClinicProvider>");
  return context;
}
