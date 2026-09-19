import { getContextUser } from "./auth/_authorization";

export interface ApiMetricsEnv {
  API_METRICS?: AnalyticsEngineDataset;
}
const GROUPS: Readonly<Record<string, string>> = Object.freeze({
  live: "clinical_live", tenants: "tenant", billing: "billing", operations: "operations",
  patients: "clinical_records", documents: "clinical_records", consultations: "clinical_records",
  results: "clinical_records", scales: "scales", scale: "scales", integrations: "integrations",
});
const METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"]);

/** Only fixed categories leave the API. Never send paths, queries, bodies or identities. */
export function apiMetricGroup(request: Request): string | null {
  const url = new URL(request.url);
  // Preview, local development and rehosted copies never pollute production metrics.
  if (url.protocol !== "https:" || url.host !== "neuroped.pages.dev") return null;
  const parts = url.pathname.split("/");
  if (parts[1] !== "api" || !Object.hasOwn(GROUPS, parts[2] ?? "")) return null;
  return GROUPS[parts[2]];
}

export function writeApiMetric(
  context: { request: Request; env: ApiMetricsEnv; data?: unknown },
  startedAt: number,
  status: number,
  outcome: "response" | "exception",
): void {
  try {
    const group = apiMetricGroup(context.request);
    if (!group || !getContextUser(context) || !context.env.API_METRICS) return;
    const elapsed = performance.now() - startedAt;
    const duration = Number.isFinite(elapsed) ? Math.min(600_000, Math.max(0, Math.round(elapsed))) : 0;
    const safeStatus = Number.isInteger(status) && status >= 100 && status <= 599 ? status : 500;
    const method = METHODS.has(context.request.method) ? context.request.method : "OTHER";
    context.env.API_METRICS.writeDataPoint({
      indexes: [group],
      blobs: ["api-v1", group, method, outcome === "exception" ? "exception" : "response"],
      doubles: [duration, safeStatus, 1],
    });
  } catch {
    // Metrics are not the legal audit ledger. Failure must not change clinical effects/responses.
    // No raw exception is logged: it can contain URLs, SQL binds or sensitive input.
  }
}
