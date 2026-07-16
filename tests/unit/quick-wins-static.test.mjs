import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) =>
  readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

const auth = read("client/src/contexts/AuthContext.tsx");
assert.doesNotMatch(auth, /VITE_APP_SECRET|FIXED_EMAIL/);
assert.match(auth, /getAuthCapability/);

const authClient = read("client/src/lib/authClient.ts");
assert.match(authClient, /CAPABILITY_KEY/);
assert.match(authClient, /cachedAuthCapability/);

const app = read("client/src/App.tsx");
for (const component of [
  "AppErrorBoundary",
  "PrivateGate",
  "RouteGuard",
  "ServiceWorkerManager",
]) {
  assert.match(app, new RegExp(component));
}

const report = read("client/src/components/ClinicalReport.tsx");
assert.match(report, /shareTextDocument/);
assert.doesNotMatch(
  report,
  /wa\.me\/\?text=\$\{encodeURIComponent\(reportText\)\}/,
);

const battery = read("client/src/components/BatteryReportCard.tsx");
assert.match(battery, /printPlainTextDocument/);
assert.doesNotMatch(battery, /document\.write\(`<pre>\$\{report\}/);

const layout = read("client/src/components/Layout.tsx");
assert.match(layout, /clearMasterPinUnlock\(\)/);
assert.match(layout, /secureClearAll\(\)/);

const filter = read("client/src/pages/filtro.tsx");
assert.match(filter, /type AvailabilityMode = "complete" \| "all"/);
assert.match(filter, /aria-pressed=\{availabilityMode === "all"\}/);

const worker = read("client/public/sw.js");
assert.match(worker, /__NEUROPED_BUILD_ID__/);
assert.match(worker, /GET_VERSION/);
assert.match(worker, /key\.startsWith\("neuroped-"\)/);
assert.doesNotMatch(worker, /neuroped-v7/);

const genericScale = read("client/src/components/GenericScale.tsx");
const interactiveScale = read(
  "client/src/components/InteractiveScaleRunner.tsx",
);
for (const scaleRunner of [genericScale, interactiveScale]) {
  assert.match(scaleRunner, /useSecureScaleDraft/);
}
assert.doesNotMatch(genericScale, /localStorage\.setItem\(\s*draftKey/);

const news = read("client/src/pages/portal-novidades.tsx");
const sanitizer = read("client/src/lib/sanitizeArticleHtml.ts");
assert.match(news, /sanitizeArticleHtml\(open\.content\)/);
assert.match(news, /__html: sanitizedContent/);
assert.match(sanitizer, /DOMPurify\.sanitize/);
assert.match(sanitizer, /FORBID_TAGS/);

const main = read("client/src/main.tsx");
assert.match(main, /installChunkRecovery\(\)/);

const routeGuard = read("client/src/components/RouteGuard.tsx");
assert.match(routeGuard, /decideRouteAccess/);
assert.match(routeGuard, /decision === "checking"/);
assert.match(routeGuard, /decision === "login"/);

console.log("✓ proteções das melhorias críticas permanecem conectadas ao app");
