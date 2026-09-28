import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CLINIC_CONTEXT_ROUTES, requiresClinicContext } from "../../client/src/lib/clinicRoutePolicy.ts";

assert.deepEqual([...CLINIC_CONTEXT_ROUTES], ["/agenda", "/conecta", "/pacientes", "/paciente", "/prontuario"]);
for (const path of CLINIC_CONTEXT_ROUTES) {
  for (const suffix of ["", "/", "?q=x", "/synthetic"]) assert.equal(requiresClinicContext(path + suffix), true);
  assert.equal(requiresClinicContext(path + "-publico"), false);
}
for (const path of ["/", "/caa", "/familia", "/agendar", "/login", "/onboarding", "/configuracoes", "/recepcao", "/escuta-clinica", "/generic-scale/synthetic"]) {
  assert.equal(requiresClinicContext(path), false, `${path} mantém seu contrato próprio, sem bloquear ferramentas em memória ou recuperação`);
}
const provider = readFileSync("client/src/contexts/ClinicContext.tsx", "utf8");
assert.match(provider, /useState\(true\)/);
assert.match(provider, /JSON\.stringify\(\[accessMode, isAuthenticated, isAuthLoading, user\?\.id, user\?\.mustChangePassword\]\)/);
assert.match(provider, /getAuthSessionEpoch\(\) === epoch/);
assert.match(provider, /generation === requestGeneration\.current/);
assert.match(provider, /currentAuthScope\.current === authScope/);
assert.match(provider, /loadedScope === authScope/);
assert.match(provider, /if \(!isCurrent\(\)\) return;/);
assert.match(provider, /signal: controller\.signal, cache: "no-store"/);
assert.match(provider, /return \(\) => \{\s*\+\+requestGeneration\.current;\s*requestController\.current\?\.abort\(\);/);
assert.match(provider, /Array\.isArray\(body\?\.data\)/);
assert.match(provider, /activeClinicId: activeClinic\?\.id \?\? null/);
const boundary = readFileSync("client/src/components/ClinicRouteBoundary.tsx", "utf8");
assert.match(boundary, /accessMode !== "remote" \|\| !isAuthenticated \|\| !requiresClinicContext\(path\)/);
assert.match(boundary, /if \(isLoading\)/);
assert.match(boundary, /if \(error \|\| !activeClinic\)/);
assert.match(boundary, /void reloadClinics\(\)/);
assert.doesNotMatch(boundary, /apiRequest|authFetch|method:.*POST|provider.*none|secureGet|localStorage/);
const guard = readFileSync("client/src/components/RouteGuard.tsx", "utf8");
assert.ok(guard.indexOf('decision === "forbidden"') < guard.indexOf("return <ClinicRouteBoundary"), "a dependência de clínica não substitui a autorização");
assert.ok(guard.indexOf("isLiveBrowserLocalClinicalRouteDenied(location") < guard.indexOf("return <ClinicRouteBoundary"));
const switcher = readFileSync("client/src/components/ClinicSwitcher.tsx", "utf8");
assert.match(switcher, /Atualizar vínculo da clínica/);
assert.doesNotMatch(switcher, /clinics\.length === 0 && !error\)\) return null/);
console.log("[clinic-context] ✓ cinco famílias de rotas; bootstrap, identidade, cancelamento, erro recuperável e fronteiras preservadas");
