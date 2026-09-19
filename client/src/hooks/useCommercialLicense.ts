import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useClinic } from "@/contexts/ClinicContext";
import {
  CommercialRequestError,
  fetchCommercialSnapshot,
  type CommercialSnapshot,
} from "@/lib/commercialClient";
import type { CommercialFeatureCode } from "@shared/commercial";

/**
 * Estado de um material para a tela atual.
 *
 * `outside-scope` é a instalação individual, sem backend remoto ou sem unidade
 * selecionada: ali não existe licença institucional a exercer e o material
 * segue como sempre foi. `licensed` e `blocked` só existem dentro de uma
 * unidade, e ambos vêm do servidor — nunca de papel, preço ou estado local.
 */
export type CommercialMaterialAccess = "outside-scope" | "loading" | "licensed" | "blocked";

export interface CommercialLicenseState {
  /** Há uma unidade institucional selecionada sobre a qual a licença incide. */
  isInstitutional: boolean;
  isLoading: boolean;
  snapshot: CommercialSnapshot | null;
  error: string | null;
  errorCode: string | null;
  access: (feature: CommercialFeatureCode) => CommercialMaterialAccess;
  reload: () => Promise<void>;
}

export function useCommercialLicense(): CommercialLicenseState {
  const { accessMode, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { activeClinicId } = useClinic();
  const [snapshot, setSnapshot] = useState<CommercialSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const isInstitutional =
    accessMode === "remote" && isAuthenticated && !isAuthLoading && Boolean(activeClinicId);

  const load = useCallback(async () => {
    if (!isInstitutional || !activeClinicId) {
      setSnapshot(null);
      setError(null);
      setErrorCode(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    setErrorCode(null);
    try {
      setSnapshot(await fetchCommercialSnapshot(activeClinicId));
    } catch (cause) {
      // Falha de carga nunca vira permissão: o snapshot fica nulo e `access`
      // devolve `blocked` enquanto a unidade estiver selecionada.
      setSnapshot(null);
      setError(cause instanceof Error ? cause.message : "Camada comercial indisponível.");
      setErrorCode(cause instanceof CommercialRequestError ? cause.code : "COMMERCIAL_REQUEST_FAILED");
    } finally {
      setIsLoading(false);
    }
  }, [activeClinicId, isInstitutional]);

  useEffect(() => {
    void load();
  }, [load]);

  const access = useCallback(
    (feature: CommercialFeatureCode): CommercialMaterialAccess => {
      if (!isInstitutional) return "outside-scope";
      if (isLoading) return "loading";
      return snapshot?.capabilities?.[feature] === true ? "licensed" : "blocked";
    },
    [isInstitutional, isLoading, snapshot],
  );

  return useMemo(
    () => ({ isInstitutional, isLoading, snapshot, error, errorCode, access, reload: load }),
    [isInstitutional, isLoading, snapshot, error, errorCode, access, load],
  );
}
