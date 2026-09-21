import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useClinic } from "@/contexts/ClinicContext";
import { useToast } from "@/hooks/use-toast";
import { recordCommercialMaterialExport } from "@/lib/commercialClient";
import { executeCommercialExport, type CommercialExportChannel } from "@/lib/commercialExport";
import { resolveCommercialScope } from "@/lib/commercialScope";
import type { CommercialFeatureCode } from "@shared/commercial";

export function useCommercialExport(feature: CommercialFeatureCode) {
  const { accessMode, isAuthenticated, isLoading: isAuthLoading, user } = useAuth();
  const { activeClinicId, isLoading: isClinicLoading, error: clinicError } = useClinic();
  const { toast } = useToast();
  const scope = useMemo(() => resolveCommercialScope({
    accessMode, isAuthenticated, isAuthLoading, userId: user?.id ?? null,
    clinicId: activeClinicId, isClinicLoading, clinicError,
  }), [accessMode, isAuthenticated, isAuthLoading, user?.id, activeClinicId, isClinicLoading, clinicError]);
  const current = useRef(scope);
  current.current = scope;
  const mounted = useRef(true);
  const locked = useRef(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const lifecycle = mounted;
    lifecycle.current = true;
    return () => { lifecycle.current = false; };
  }, []);

  const runExport = useCallback(async (channel: CommercialExportChannel, action: () => void | Promise<void>): Promise<boolean> => {
    if (locked.current) return false;
    locked.current = true;
    setBusy(true);
    try {
      await executeCommercialExport({
        scope, feature, channel,
        isCurrent: () => mounted.current && current.current === scope,
        record: recordCommercialMaterialExport,
        action,
      });
      return true;
    } catch (error) {
      if (mounted.current) toast({
        title: "Exportação não concluída",
        description: error instanceof Error ? error.message : "Confirme a licença e tente novamente.",
        variant: "destructive",
      });
      return false;
    } finally {
      locked.current = false;
      if (mounted.current) setBusy(false);
    }
  }, [scope, feature, toast]);
  return { runExport, busy };
}
