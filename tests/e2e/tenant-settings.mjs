import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "playwright";
import { ACCEPTED_FIRST_VISIT_STORAGE, auditBrowserLaunchOptions, ensureClientBuild, startStaticServer } from "../../scripts/lib/browser-audit-runtime.mjs";
import { createSyntheticClinicalApi, SYNTHETIC_CREDENTIALS } from "../../scripts/lib/synthetic-clinical-api.mjs";

// UI contract only. Authorization, transaction rollback and tenant isolation are
// exercised separately by real handlers against SQLite in the unit suites.
const output = resolve("artifacts/tenant-settings");
mkdirSync(output, { recursive: true });
const api = createSyntheticClinicalApi();
const clinicId = "clinic-sintetica-alfa";
let failPatch = false;
let failAudit = false;
let patchRequests = 0;
let enabled = true;
const auditQueries = [];
const features = () => ({ clinicId, features: [
  { key: "remote_intake", label: "Pré-consulta remota", description: "Envio de pré-consultas à família.", enabled: true, source: "default" },
  { key: "remote_scales", label: "Questionários remotos", description: "Envio de questionários à família.", enabled, source: "clinic" },
] });
const server = await startStaticServer(ensureClientBuild(process.cwd(), "authenticated"), {
  port: 4380,
  apiHandler: async (request, response, pathname, searchParams) => {
    const send = (status, body) => {
      response.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" });
      response.end(JSON.stringify(body));
      return true;
    };
    if (pathname === `/api/tenants/${clinicId}/features`) {
      if (request.method === "PATCH") {
        patchRequests += 1;
        let raw = "";
        for await (const chunk of request) raw += chunk;
        if (failPatch) return send(500, { error: "Falha sintética ao salvar recurso." });
        const body = JSON.parse(raw);
        assert.equal(typeof body.features.remote_scales, "boolean");
        enabled = body.features.remote_scales;
      }
      return send(200, features());
    }
    if (pathname === `/api/tenants/${clinicId}/audit`) {
      auditQueries.push(searchParams.get("action"));
      if (failAudit) return send(503, { error: "Auditoria sinteticamente indisponível." });
      const data = searchParams.get("action") === "sem-resultados" ? [] : [{
        id: "synthetic-audit", action: "clinic_feature_update", targetType: "clinic_feature",
        targetId: "remote_scales", actorName: "Gestor Sintético", actorUserId: "synthetic-owner",
        metadata: { key: "remote_scales", enabled }, createdAt: "2026-09-26T10:00:00.000Z",
      }];
      return send(200, { data, total: data.length, page: 1, limit: 25 });
    }
    return api(request, response, pathname, searchParams);
  },
});
let browser;
const results = [];
try {
  const login = await fetch(`${server.origin}/api/auth/login`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(SYNTHETIC_CREDENTIALS),
  });
  assert.equal(login.status, 200);
  const session = await login.json();
  browser = await chromium.launch(auditBrowserLaunchOptions());
  for (const width of [390, 1440]) {
    for (const role of ["owner", "professional"]) {
      enabled = true;
      failAudit = true;
      failPatch = true;
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
      await context.addInitScript(({ storage, auth }) => {
        for (const [key, value] of Object.entries(storage)) localStorage.setItem(key, value);
        sessionStorage.setItem("neuroped:access", auth.accessToken);
        sessionStorage.setItem("neuroped:refresh", auth.refreshToken);
        sessionStorage.setItem("neuroped:user", JSON.stringify(auth.user));
      }, { storage: ACCEPTED_FIRST_VISIT_STORAGE, auth: session });
      await context.route("**/*", (route) => new URL(route.request().url()).origin === server.origin ? route.continue() : route.abort());
      if (role === "professional") {
        await context.route(`**/api/tenants/${clinicId}`, async (route) => {
          const response = await route.fetch();
          const body = await response.json();
          await route.fulfill({ response, json: { ...body, role, permissions: ["clinical.read", "clinical.write"] } });
        });
      }
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(`${server.origin}/#/configuracoes`, { waitUntil: "domcontentloaded" });
      await page.getByRole("tab", { name: "Recursos", exact: true }).click();
      const toggle = page.getByRole("switch", { name: "Questionários remotos: ligado", exact: true });
      await toggle.waitFor();
      if (role === "professional") {
        assert.equal(await toggle.isEnabled(), false, "profissional lê mas não altera recursos");
        assert.equal(await page.getByRole("tab", { name: "Auditoria", exact: true }).count(), 0);
        assert.equal(await page.getByRole("tab", { name: "Equipe", exact: true }).count(), 0);
      } else {
        await toggle.click();
        await page.getByRole("alert").filter({ hasText: "Falha sintética ao salvar recurso" }).waitFor();
        assert.equal(await toggle.getAttribute("aria-checked"), "true", "falha não finge alteração salva");
        failPatch = false;
        await toggle.click();
        await page.getByRole("switch", { name: "Questionários remotos: desligado", exact: true }).waitFor();
        assert.equal(enabled, false);
        await page.getByRole("tab", { name: "Auditoria", exact: true }).click();
        await page.getByRole("alert").filter({ hasText: "Auditoria sinteticamente indisponível" }).waitFor();
        failAudit = false;
        await page.getByRole("button", { name: "Tentar novamente", exact: true }).click();
        await page.getByText("Recurso da clínica alterado", { exact: true }).waitFor();
        await page.getByLabel("Filtrar por ação", { exact: true }).fill("sem-resultados");
        await page.getByRole("button", { name: "Filtrar", exact: true }).click();
        await page.getByText("Nenhum registro para este filtro.", { exact: true }).waitFor();
        assert.ok(auditQueries.includes("sem-resultados"));
      }
      assert.equal(await page.getByTestId("login-form").count(), 0);
      assert.deepEqual(errors, []);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
      await page.screenshot({ path: resolve(output, `${role}-${width}.png`), fullPage: true });
      results.push({ role, width, passed: true });
      await context.close();
    }
  }
  assert.equal(patchRequests, 4, "somente o gestor em cada viewport envia as duas tentativas");
  writeFileSync(resolve(output, "result.json"), JSON.stringify({ syntheticOnly: true, results }, null, 2));
  console.log(`Tenant settings browser: ${results.length} permission, recovery and persistence states passed.`);
} finally {
  await browser?.close();
  await server.close();
}
