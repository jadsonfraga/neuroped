import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { chromium } from "playwright";
import { auditBrowserLaunchOptions } from "../../scripts/lib/browser-audit-runtime.mjs";

// Integration against production-built UI + explicitly synthetic localhost API.
// This does not certify a real production account or mutate production data.
const DIST = "dist/public";
const clinic = { id: "context-synthetic", slug: "context-synthetic", name: "Clínica sintética", legalName: null, timezone: "America/Recife", status: "active", role: "owner" };
const user = { id: "context-owner-synthetic", email: "context@example.test", name: "Context Synthetic", role: "professional" };
let mode = "ready";
let tenantResponseSent = false;
let requests = [];
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".webp": "image/webp" };
const json = (res, status, body) => { res.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" }); res.end(JSON.stringify(body)); };
const dependent = path => path === "/api/operations" || path === "/api/patients" || path.startsWith("/api/live/") || path.startsWith("/api/conecta/");
const server = createServer((req, res) => {
  const path = new URL(req.url, "http://127.0.0.1").pathname;
  if (dependent(path)) requests.push({ path, method: req.method, tenant: req.headers["x-tenant-id"], afterContext: tenantResponseSent });
  if (req.method !== "GET") return json(res, 405, { error: "NO_WRITES_ALLOWED_IN_CONTEXT_TEST" });
  if (path === "/__seed__") { res.writeHead(200, { "Content-Type": "text/html" }); res.end("<!doctype html><title>synthetic seed</title>"); return; }
  if (path === "/api/health") return json(res, 200, { database: "ok", authentication: { required: true, configured: true } });
  if (path === "/api/auth/me") return json(res, 200, user);
  if (path === "/api/tenants") {
    const requestedMode = mode;
    setTimeout(() => {
      tenantResponseSent = true;
      if (requestedMode === "error") return json(res, 503, { error: "SYNTHETIC_TEMPORARY_FAILURE" });
      if (requestedMode === "malformed") return json(res, 200, { unexpected: true });
      return json(res, 200, { data: requestedMode === "empty" ? [] : [clinic] });
    }, 450);
    return;
  }
  if (path === "/api/operations") return json(res, 200, {
    profile: { slug: "synthetic", displayName: "Profissional sintético", specialty: "Neuropediatria", timezone: "America/Recife", bookingEnabled: false },
    access: { clinicId: clinic.id, actorUserId: user.id, actorRole: "professional", providerUserId: user.id, providerName: user.name, delegated: false, canConfigure: true },
    services: [], rules: [], blocks: [], appointments: [], waitlist: [], reviews: [], notifications: [], staff: [], audit: [],
    metrics: { today: 0, upcoming: 0, requested: 0, waitlist: 0, pendingReviews: 0, pendingNotifications: 0, expectedCents: 0, paidCents: 0, noShow30d: 0 },
  });
  if (path === "/api/live/patients" || path === "/api/patients") return json(res, 200, { data: [], total: 0 });
  if (path.startsWith("/api/")) return json(res, 404, { error: "SYNTHETIC_ENDPOINT_NOT_STUBBED" });
  let file = join(DIST, path);
  if (!existsSync(file) || statSync(file).isDirectory()) file = join(DIST, "index.html");
  res.writeHead(200, { "Content-Type": types[extname(file)] || "application/octet-stream" });
  res.end(readFileSync(file));
});
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch(auditBrowserLaunchOptions());
async function open(route, scenario) {
  mode = scenario; tenantResponseSent = false; requests = [];
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${base}/__seed__`);
  await page.evaluate((account) => {
    for (const [key, value] of Object.entries({ "neuroped:aviso-educativo-aceito-v1": "synthetic", "neuroped:onboarding-seen": "1", "np_tour_intro_v2": "done", "np_tour_v2_done": "1" })) localStorage.setItem(key, value);
    sessionStorage.setItem("neuroped:access", "context-synthetic-access");
    sessionStorage.setItem("neuroped:user", JSON.stringify(account));
  }, user);
  await page.goto(`${base}/#${route}`, { waitUntil: "domcontentloaded" });
  return { context, page };
}
try {
  // No membership must not look like an empty clinical dataset or trigger a
  // privileged fallback; recovery stays reachable in every affected family.
  for (const route of ["/agenda", "/conecta", "/pacientes", "/paciente/synthetic", "/prontuario"]) {
    const { context, page } = await open(route, "empty");
    await page.getByTestId("clinic-context-unavailable").waitFor();
    await page.getByRole("heading", { name: "Nenhuma clínica vinculada", exact: true }).waitFor();
    assert.deepEqual(requests, [], `${route}: no data calls without membership`);
    assert.equal(await page.getByRole("button", { name: "Atualizar vínculo", exact: true }).count(), 1);
    await context.close();
  }
  for (const scenario of ["empty", "error", "malformed"]) {
    const { context, page } = await open("/agenda", scenario);
    await page.getByTestId("clinic-context-unavailable").waitFor();
    assert.deepEqual(requests, [], "failed or malformed context never mounts the operational workspace");
    mode = "ready"; tenantResponseSent = false;
    await page.getByRole("button", { name: "Atualizar vínculo", exact: true }).click();
    await page.getByTestId("clinic-context-loading").waitFor();
    await page.getByTestId("agenda-shell").waitFor();
    assert.ok(requests.some(r => r.path === "/api/operations"));
    assert.ok(requests.every(r => r.afterContext && r.tenant === clinic.id && r.method === "GET"));
    assert.equal(await page.getByText("Agenda temporariamente indisponível", { exact: true }).count(), 0);
    await context.close();
  }
  const { context, page } = await open("/agenda", "ready");
  await page.getByTestId("clinic-context-loading").waitFor();
  assert.deepEqual(requests, [], "initial delayed context must precede every dependent query");
  await page.getByTestId("agenda-shell").waitFor();
  assert.ok(requests.length > 0 && requests.every(r => r.afterContext && r.tenant === clinic.id));
  await context.close();
  const free = await open("/caa", "error");
  await free.page.getByRole("heading", { name: "Vou Falar!", exact: true }).waitFor();
  await free.page.getByTestId("caa-session-only").waitFor();
  assert.equal(await free.page.getByTestId("clinic-context-unavailable").count(), 0, "CAA cannot be blocked by institutional context failure");
  await free.context.close();
  console.log("[clinic-context-e2e] ✓ five route families, delayed bootstrap, absent/failed/malformed context, real retry and independent CAA");
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
