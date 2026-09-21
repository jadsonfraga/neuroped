import { useState } from "react";
import { createRoot } from "react-dom/client";
import { CommercialMaterialView } from "../../../client/src/components/CommercialMaterialView";
import { executeCommercialExport, type CommercialExportChannel } from "../../../client/src/lib/commercialExport";
import { recordCommercialMaterialExport } from "../../../client/src/lib/commercialClient";
import { resolveCommercialScope } from "../../../client/src/lib/commercialScope";
import type { CommercialFeatureCode } from "../../../shared/commercial";

const input = { accessMode: "remote" as const, isAuthLoading: false, isAuthenticated: true, userId: "synthetic", clinicId: "a", isClinicLoading: false, clinicError: null };
let scope = resolveCommercialScope(input);
(window as unknown as { commercialTest: { switchClinic: () => void } }).commercialTest = {
  switchClinic: () => { scope = resolveCommercialScope({ ...input, clinicId: "b" }); },
};
const feature = (new URL(location.href).searchParams.get("feature") ?? "form.approved_plan") as CommercialFeatureCode;
function Fixture() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function runExport(channel: CommercialExportChannel, action: () => void | Promise<void>) {
    const captured = scope;
    setBusy(true); setError("");
    try {
      await executeCommercialExport({ scope: captured, feature, channel, isCurrent: () => scope === captured, record: recordCommercialMaterialExport, action });
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "denied");
      return false;
    } finally { setBusy(false); }
  }
  return <><CommercialMaterialView feature={feature} busy={busy} runExport={runExport} />{error && <p role="alert">{error}</p>}</>;
}
createRoot(document.getElementById("root")!).render(<Fixture />);
