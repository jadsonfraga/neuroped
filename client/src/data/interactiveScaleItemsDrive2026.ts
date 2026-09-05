import type { InteractiveScaleDef } from "./interactiveScaleItems";
import { driveImport2026Items as driveImport2026ItemsBase } from "./interactiveScaleItemsDrive2026Base";
import { authorialDrive2026OperationalItems } from "./interactiveScaleItemsDrive2026Autorais";
import { authorialMonitoringItems } from "./authorialMonitoring";

/** Historical imports plus authorial monitoring; provenance stays per record. */
export const driveImport2026Items: Record<string, InteractiveScaleDef> = {
  ...driveImport2026ItemsBase,
  ...authorialDrive2026OperationalItems,
  ...authorialMonitoringItems,
};
