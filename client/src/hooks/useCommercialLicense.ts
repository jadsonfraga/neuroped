import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useClinic } from "@/contexts/ClinicContext";
import { CommercialRequestError, fetchCommercialSnapshot, type CommercialSnapshot } from "@/lib/commercialClient";
import { resolveCommercialScope, type CommercialScope } from "@/lib/commercialScope";
import type { CommercialFeatureCode } from "@shared/commercial";

/** Somente o modo local explicitamente resolvido está fora do SKU institucional. */
export type CommercialMaterialAccess = "outside-scope" | "loading" | "licensed" | "blocked";

export interface CommercialLicenseState {
  /** Inclui sessão remota cujo contexto ainda está incompleto: nunca é bypass. */
  isInstitutional: boolean;
  isLoading: boolean;
  snapshot: CommercialSnapshot | null;
  error: string | null;
  errorCode: string | null;
  access: (feature: CommercialFeatureCode) => CommercialMaterialAccess;
  reload: () => Promise<void>;
}

interface RequestState {
  scope: CommercialScope | null;
  loading: boolean;
  error: string | null;
  code: string | null;
}

export function useCommercialLicense(): CommercialLicenseState {
  const { accessMode, isAuthenticated, isLoading: isAuthLoading, user } = useAuth();
  const { activeClinicId, isLoading: isClinicLoading, error: clinicError } = useClinic();
  const scope = useMemo(() => resolveCommercialScope({
    accessMode, isAuthenticated, isAuthLoading, userId: user?.id ?? null,
    clinicId: activeClinicId, isClinicLoading, clinicError,
  }), [accessMode, isAuthenticated, isAuthLoading, user?.id, activeClinicId, isClinicLoading, clinicError]);
  const [loadedSnapshot, setSnapshot] = useState<CommercialSnapshot | null>(null);
  const [requestState, setRequestState] = useState<RequestState>({ scope: null, loading: false, error: null, code: null });
  const generation = useRef(0);

  const load = useCallback(async () => {
    const requestGeneration = ++generation.current;
    setSnapshot(null);
    if (scope.kind !== "institutional") {
      setRequestState({ scope, loading: false, error: null, code: null });
      return;
    }
    setRequestState({ scope, loading: true, error: null, code: null });
    try {
      const next = await fetchCommercialSnapshot(scope.clinicId);
      if (requestGeneration !== generation.current) return;
      if (next?.clinic?.id !== scope.clinicId) {
        throw new CommercialRequestError("Resposta de outra unidade recusada.", "COMMERCIAL_RESPONSE_INVALID", 502);
      }
      setSnapshot(next);
      setRequestState({ scope, loading: false, error: null, code: null });
    } catch (cause) {
      if (requestGeneration !== generation.current) return;
      setSnapshot(null);
      setRequestState({
        scope,
        loading: false,
        error: cause instanceof Error ? cause.message : "Camada comercial indisponível.",
        code: cause instanceof CommercialRequestError ? cause.code : "COMMERCIAL_REQUEST_FAILED",
      });
    }
  }, [scope]);

  useEffect(() => {
    // Captura o contador, não o seu valor: cleanup invalida inclusive um reload.
    const requestCounter = generation;
    void load();
    return () => { requestCounter.current++; };
  }, [load]);

  // Comparação por identidade também invalida A -> contexto ausente -> A.
  // A invalidação acontece no render, antes de qualquer efeito assíncrono.
  const current = requestState.scope === scope;
  const isLoading = scope.kind === "loading" ||
    (scope.kind === "institutional" && (!current || requestState.loading));
  const snapshot = scope.kind === "institutional" && current && !isLoading ? loadedSnapshot : null;
  const error = scope.kind === "unavailable" ? scope.error : current ? requestState.error : null;
  const errorCode = scope.kind === "unavailable" ? scope.code : current ? requestState.code : null;
  const isInstitutional = scope.kind !== "individual";

  const access = useCallback((feature: CommercialFeatureCode): CommercialMaterialAccess => {
    if (scope.kind === "individual") return "outside-scope";
    if (isLoading) return "loading";
    if (scope.kind !== "institutional") return "blocked";
    return snapshot?.capabilities?.[feature] === true ? "licensed" : "blocked";
  }, [scope, isLoading, snapshot]);

  return useMemo(
    () => ({ isInstitutional, isLoading, snapshot, error, errorCode, access, reload: load }),
    [isInstitutional, isLoading, snapshot, error, errorCode, access, load],
  );
}
