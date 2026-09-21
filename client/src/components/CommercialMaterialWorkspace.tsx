import { CommercialMaterialView } from "./CommercialMaterialView";
import { useCommercialExport } from "@/hooks/useCommercialExport";
import type { CommercialFeatureCode } from "@shared/commercial";

export function CommercialMaterialWorkspace({ feature }: { feature: CommercialFeatureCode }) {
  const { runExport, busy } = useCommercialExport(feature);
  return <CommercialMaterialView feature={feature} runExport={runExport} busy={busy} />;
}
