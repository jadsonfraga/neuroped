/** Consolidador fail-closed de evidências operacionais, sem PHI e sem escrita. */
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
type Dict = Record<string, unknown>;
const obj = (x: unknown): Dict => x !== null && typeof x === "object" && !Array.isArray(x) ? x as Dict : {};
const arr = (x: unknown): unknown[] => Array.isArray(x) ? x : [];
const fresh = (x: unknown, now: number, max: number) => {
  if (typeof x !== "string") return false;
  const t = Date.parse(x);
  return Number.isFinite(t) && t <= now && now - t <= max;
};
export const REQUIRED_REVIEWS = [
  "legal_terms_and_privacy", "provider_data_contracts", "children_data_governance",
  "regulatory_clinical_classification", "pant_medical_acceptance",
  "tested_backup_restore", "real_email_delivery", "asaas_live_payment",
  "incident_response", "final_commercial_approval",
] as const;
export function evaluateReleaseGate(input: {
  health: unknown; smoke: unknown; reviews: unknown; origin: string; now?: Date;
}) {
  const now = input.now ?? new Date();
  const blockers: string[] = [];
  let target: string;
  try {
    const url = new URL(input.origin);
    if (url.protocol !== "https:" || url.username || url.password ||
        url.pathname !== "/" || url.search || url.hash) throw new Error("ORIGIN");
    target = url.origin;
  } catch {
    return { verdict: "NO_GO" as const, blockers: ["INVALID_ORIGIN"],
      checkedAt: now.toISOString(), permitsAutomaticLaunch: false as const };
  }
  const health = obj(input.health);
  const readiness = obj(health.readiness);
  const exportState = obj(readiness.lgpdExport);
  if (health.status !== "ok" ||
      !fresh(health.timestamp, now.getTime(), 3600000) ||
      readiness.coreReady !== true || readiness.clinicalCryptoConfigured !== true ||
      readiness.lgpdSchemaReady !== true || exportState.configured !== true ||
      exportState.storageBindingPresent !== true ||
      !Array.isArray(readiness.blockers) || readiness.blockers.length > 0) {
    blockers.push("PUBLISHED_CLINICAL_HEALTH_NOT_READY");
  }
  const smoke = obj(input.smoke);
  const billing = obj(smoke.billingEvidence);
  const onboard = obj(smoke.onboarding);
  const requiredSteps = [
    "api_health", "signup_gate", "billing_webhook_gate",
    "owner_login", "clinic", "email_verified", "plan", "billing", "membership", "first_member",
    "patient", "consultation", "document", "audit", "export",
    "onboarding_server", "closure",
  ];
  const steps = arr(smoke.steps).map(obj);
  const verified = new Set(steps.filter(s => s.status === "VERIFIED").map(s => s.id));
  if (smoke.kind !== "cliente-zero-published-smoke" || smoke.schemaVersion !== 1 ||
      smoke.target !== target || smoke.verdict !== "VERIFIED" || smoke.exitCode !== 0 ||
      !fresh(smoke.finishedAt, now.getTime(), 72 * 3600000) ||
      !requiredSteps.every(k => verified.has(k)) ||
      steps.some(s => s.status !== "VERIFIED") ||
      billing.status !== "SERVER_CONFIRMED" || billing.environment !== "production" ||
      onboard.completed !== 10 || onboard.total !== 10 ||
      typeof smoke.clinicToFirstDocumentMs !== "number" ||
      smoke.clinicToFirstDocumentMs < 0 || smoke.clinicToFirstDocumentMs > 1800000) {
    blockers.push("PUBLISHED_CLIENT_ZERO_UNPROVEN");
  }
  const reviews = obj(input.reviews);
  const checkpoints = obj(reviews.checkpoints);
  const validManifest = reviews.schemaVersion === 1 && reviews.target === target;
  if (!validManifest) blockers.push("PRIVATE_REVIEWS_MANIFEST_MISSING");
  for (const key of REQUIRED_REVIEWS) {
    const item = obj(checkpoints[key]);
    if (!validManifest || typeof item.reviewer !== "string" ||
        item.reviewer.trim().length < 3 ||
        typeof item.artifactSha256 !== "string" ||
        !/^[a-f0-9]{64}$/i.test(item.artifactSha256) ||
        !fresh(item.reviewedAt, now.getTime(), 180 * 86400000)) {
      blockers.push("REVIEW_MISSING_" + key.toUpperCase());
    }
  }
  return { verdict: (blockers.length === 0 ? "READY_FOR_HUMAN_DECISION" : "NO_GO") as "NO_GO" | "READY_FOR_HUMAN_DECISION",
    blockers, checkedAt: now.toISOString(), permitsAutomaticLaunch: false as const };
}
function parseArgs(args: string[]): Record<string, string> {
  const flags: Record<string, string> = {};
  for (let i = 0; i < args.length; i += 2) {
    if (!["--origin", "--health", "--smoke", "--reviews"].includes(args[i]) ||
        !args[i + 1] || flags[args[i]]) throw new Error("INVALID_ARGS");
    flags[args[i]] = args[i + 1];
  }
  if (Object.keys(flags).length !== 4) throw new Error("MISSING_ARGS");
  return flags;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const args = parseArgs(process.argv.slice(2));
    const file = (key: string): unknown => JSON.parse(readFileSync(args[key], "utf8"));
    const result = evaluateReleaseGate({ origin: args["--origin"],
      health: file("--health"), smoke: file("--smoke"), reviews: file("--reviews") });
    process.stdout.write(JSON.stringify(result, null, 2) + "\n");
    process.exitCode = result.verdict === "NO_GO" ? 2 : 0;
  } catch {
    process.stderr.write("NO_GO: argumentos ou JSON inválidos; nenhum dado clínico foi processado.\n");
    process.exitCode = 1;
  }
}
