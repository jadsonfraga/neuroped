import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useClinic } from "@/contexts/ClinicContext";
import type { PatientDataSource } from "@/lib/patientPrefillSource";

/**
 * Fonte dos dados do paciente para a sessão atual: LIVE por clínica em sessão
 * remota autenticada; legado apenas no modo local. Em LIVE sem clínica ativa,
 * `ready` é falso e nenhuma rota é consultada.
 */
export function usePatientDataSource(): { source: PatientDataSource; ready: boolean } {
  const { accessMode, isAuthenticated } = useAuth();
  const { activeClinicId } = useClinic();
  const live = accessMode === "remote" && isAuthenticated;
  const clinicId = live ? activeClinicId ?? null : null;
  return useMemo(
    () => ({ source: { live, clinicId }, ready: !live || Boolean(clinicId) }),
    [live, clinicId],
  );
}
