import { z } from "zod";
const count = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const tenantMetricsSchema = z.object({
  source: z.literal("saas_audit_log"),
  window: z.object({ from: day, toExclusive: day, timezone: z.literal("UTC"), currentDayPartial: z.literal(true) }),
  auditedActorsToday: count, auditedActors7Days: count, auditedActors30Days: count, auditedEvents30Days: count,
  daily: z.array(z.object({ day, actors: count, events: count })).max(30),
  coverage: z.object({ auditedOperationsOnly: z.literal(true), anonymousVisitorsCollected: z.literal(false),
    fullProductDau: z.null(), fullProductMau: z.null(), retention: z.null() }),
  apiInstrumentationBindingPresent: z.boolean(),
});
export type TenantMetrics = z.infer<typeof tenantMetricsSchema>;
