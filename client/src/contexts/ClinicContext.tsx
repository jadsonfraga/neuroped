import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { authFetch, getAuthSessionEpoch } from "@/lib/authClient";
import { invalidateIssuerCache } from "@/lib/issuer";
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
    const previous = readStoredClinicId();
    if (clinicId) sessionStorage.setItem(ACTIVE_CLINIC_KEY, clinicId);
    else sessionStorage.removeItem(ACTIVE_CLINIC_KEY);
    if (previous !== clinicId) invalidateIssuerCache();
  } catch {
    // O identificador de contexto não é requisito de segurança; o servidor é a autoridade.
  }
}

async function clearClinicalClientCaches(): Promise<void> {
  invalidateIssuerCache();
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
  const { accessMode, isAuthenticated, isLoading: isAuthLoading, user } = useAuth();
  const [clinics, setClinics] = useState<ClinicMembership[]>([]);
  const [activeClinicId, setActiveClinicIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const switchGeneration = useRef(0);
  const requestGeneration = useRef(0);
  const requestController = useRef<AbortController | null>(null);
  const authScope = JSON.stringify([accessMode, isAuthenticated, isAuthLoading, user?.id, user?.mustChangePassword]);
  const currentAuthScope = useRef(authScope);
  currentAuthScope.current = authScope;
  const [loadedScope, setLoadedScope] = useState<string | null>(null);

  const reloadClinics = useCallback(async () => {
    // Durante o bootstrap remoto, AuthProvider ainda está descobrindo capacidade
    // e revalidando a sessão. Apagar ACTIVE_CLINIC_KEY nesse intervalo faria um
    // hard reload de troca de tenant esquecer a seleção recém-persistida e voltar
    // silenciosamente para a primeira clínica da lista. Estado transitório de auth
    // nunca pode mutar a fronteira tenant persistida.
    if (accessMode === "checking" || isAuthLoading) return;

    const generation = ++requestGeneration.current;
    requestController.current?.abort();
    if (accessMode !== "remote" || !isAuthenticated || user?.mustChangePassword) {
      setIsLoading(false);
      setLoadedScope(authScope);
      setError(null);
      setClinics([]);
      setActiveClinicIdState(null);
      persistClinicId(null);
      return;
    }

    const epoch = getAuthSessionEpoch();
    const controller = new AbortController();
    requestController.current = controller;
    const isCurrent = () => generation === requestGeneration.current
      && currentAuthScope.current === authScope && getAuthSessionEpoch() === epoch;
    const timeout = window.setTimeout(() => controller.abort(), 15_000);
    setIsLoading(true);
    setError(null);
    try {
      const response = await authFetch("/api/tenants", { signal: controller.signal, cache: "no-store" });
      if (!isCurrent()) return;
      if (!response.ok) {
        throw new Error(response.status === 401
          ? "Sua sessão expirou. Entre novamente."
          : "Não foi possível carregar as clínicas. Tente atualizar o vínculo.");
      }
      const body = await response.json() as { data?: ClinicMembership[] };
      if (!isCurrent()) return;
      if (!Array.isArray(body?.data) || !body.data.every((clinic) => clinic
        && typeof clinic.id === "string" && typeof clinic.name === "string"
        && typeof clinic.slug === "string" && typeof clinic.status === "string")) {
        throw new Error("Resposta inválida ao carregar as clínicas. Tente novamente.");
      }
      const nextClinics = body.data.filter((clinic) => clinic.status === "active");
      const stored = readStoredClinicId();
      const nextActive = nextClinics.some((clinic) => clinic.id === stored)
        ? stored
        : (nextClinics[0]?.id ?? null);
      // Uma associação revogada não pode reciclar o cache de outra clínica.
      if (stored && stored !== nextActive) {
        await clearClinicalClientCaches();
        if (!isCurrent()) return;
      }
      setClinics(nextClinics);
      setActiveClinicIdState(nextActive);
      persistClinicId(nextActive);
      if (stored && nextActive && stored !== nextActive) window.location.reload();
    } catch (cause) {
      if (!isCurrent()) return;
      setClinics([]);
      setActiveClinicIdState(null);
      setError(cause instanceof Error ? cause.message : "Não foi possível carregar as clínicas.");
    } finally {
      window.clearTimeout(timeout);
      if (isCurrent()) {
        setLoadedScope(authScope);
        setIsLoading(false);
      }
    }
  }, [accessMode, isAuthenticated, isAuthLoading, user?.mustChangePassword, authScope]);

  useEffect(() => {
    void reloadClinics();
    return () => {
      ++requestGeneration.current;
      requestController.current?.abort();
    };
  }, [reloadClinics]);

  const setActiveClinicId = useCallback((clinicId: string) => {
    if (loadedScope !== authScope || isLoading) return;
    const epoch = getAuthSessionEpoch();
    if (!clinics.some((clinic) => clinic.id === clinicId && clinic.status === "active")) return;
    if (clinicId === activeClinicId) return;

    // Troca de clínica é uma fronteira de segurança, não apenas uma preferência
    // de UI. Primeiro removemos o contexto antigo para que nenhuma nova query
    // possa sair com o tenant anterior enquanto os caches são descartados.
    const generation = ++switchGeneration.current;
    ++requestGeneration.current;
    requestController.current?.abort();
    setActiveClinicIdState(null);
    persistClinicId(null);

    void (async () => {
      await clearClinicalClientCaches();
      if (generation !== switchGeneration.current) return;
      if (currentAuthScope.current !== authScope || getAuthSessionEpoch() !== epoch) return;

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
  }, [activeClinicId, clinics, loadedScope, authScope, isLoading]);

  // Nenhum consumidor recebe contexto da identidade anterior nem um falso
  // "sem clínica" no primeiro render, antes de o efeito de bootstrap começar.
  const contextCurrent = loadedScope === authScope;
  const contextLoading = accessMode === "checking" || isAuthLoading || (
    accessMode === "remote" && isAuthenticated && !user?.mustChangePassword
    && (!contextCurrent || isLoading)
  );
  const activeClinic = contextCurrent && !contextLoading
    ? clinics.find((clinic) => clinic.id === activeClinicId) ?? null
    : null;
  const value = useMemo(
    () => ({
      clinics: contextCurrent ? clinics : [],
      activeClinicId: activeClinic?.id ?? null,
      activeClinic,
      isLoading: contextLoading,
      error: contextCurrent ? error : null,
      setActiveClinicId,
      reloadClinics,
    }),
    [clinics, activeClinic, contextCurrent, contextLoading, error, setActiveClinicId, reloadClinics],
  );

  return <ClinicContext.Provider value={value}>{children}</ClinicContext.Provider>;
}

export function useClinic(): ClinicContextValue {
  const context = useContext(ClinicContext);
  if (!context) throw new Error("useClinic must be used within <ClinicProvider>");
  return context;
}
