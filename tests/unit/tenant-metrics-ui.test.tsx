import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { tenantMetricsSchema } from "../../shared/tenantMetrics";

test("response schema rejects fabricated or missing counts and unavailable-as-zero shortcuts", () => {
  for (const payload of [{}, { auditedActorsToday: -1 }, { auditedActorsToday: "10" }]) {
    assert.equal(tenantMetricsSchema.safeParse(payload).success, false);
  }
});
test("UI is actually reachable and queries are scoped, cancellable and nonpersistent", () => {
  const page = readFileSync("client/src/pages/configuracoes.tsx", "utf8");
  const component = readFileSync("client/src/components/TenantMetricsPanel.tsx", "utf8");
  assert.match(page, /id: "atividade"/);
  assert.match(page, /section === "atividade".*TenantMetricsPanel key=\{activeClinicId\}/);
  assert.match(component, /queryKey: \["tenant-activity-metrics", user\?\.id, activeClinicId\]/);
  assert.match(component, /gcTime: 0/); assert.match(component, /\{ signal \}/);
  assert.match(component, /tenantMetricsSchema\.parse/);
  assert.match(component, /query\.isError \?/);
  assert.doesNotMatch(component, /localStorage|sessionStorage|dangerouslySetInnerHTML|console\./);
});
