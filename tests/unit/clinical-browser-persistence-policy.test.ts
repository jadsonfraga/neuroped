import assert from "node:assert/strict";
import {
  classifyClinicalBrowserNamespace,
  clinicalBrowserPersistencePolicy,
  isLiveBrowserLocalClinicalRouteDenied,
  LIVE_BROWSER_LOCAL_CLINICAL_ROUTES,
} from "../../client/src/lib/clinicalBrowserPersistencePolicy";

const base = {
  environment: "production" as const,
  authMode: "remote" as const,
  authenticated: true,
  namespace: "cognitive-lab:sessions:v2",
  purpose: "read" as const,
};

for (const dataType of ["CLINICAL_EPHEMERAL", "CLINICAL_LONGITUDINAL"] as const) {
  assert.equal(
    clinicalBrowserPersistencePolicy({ ...base, dataType }),
    "DENY",
    `${dataType} deve falhar fechado em LIVE remoto autenticado`,
  );
}

assert.equal(
  clinicalBrowserPersistencePolicy({ ...base, authenticated: false, dataType: "CLINICAL_EPHEMERAL" }),
  "EPHEMERAL_ONLY",
  "modo remoto sem sessão não deve converter rascunho efêmero em persistência longitudinal",
);
assert.equal(
  clinicalBrowserPersistencePolicy({ ...base, authMode: "local", dataType: "CLINICAL_LONGITUDINAL" }),
  "ALLOW",
  "modo local explícito preserva funcionalidades locais intencionais",
);
assert.equal(
  clinicalBrowserPersistencePolicy({ ...base, dataType: "UI_PREFERENCE" }),
  "ALLOW",
  "preferências de UI não são PHI",
);
assert.equal(
  clinicalBrowserPersistencePolicy({ ...base, authenticated: false, dataType: "LIVE_FORBIDDEN" }),
  "DENY",
  "namespace proibido em LIVE permanece bloqueado antes do login",
);

const expectedClinical = [
  "pre-consultas",
  "pre-retornos",
  "neuroped:pre-consultas",
  "neuroped:secure:pre-retornos",
  "cognitive-lab:sessions:v2",
  "neuroped:secure:cognitive-lab:sessions:v2",
  "neuroped:cognitive-lab:sessions",
  "caa:workspace:v3",
  "neuroped:caa:board:v1",
  "assinatura:registros:v2",
  "neuroped:assinatura:registros:v1",
  "agenda:workspace:v1",
  "conecta:events:synthetic-patient:v1",
  "diario:diario-sono",
  "neuroped:diario:sono:v1",
  "scale-draft:synthetic",
  "neuroped:scale-draft:synthetic",
  "np_filtro_state_v1",
];
for (const namespace of expectedClinical) {
  assert.notEqual(
    classifyClinicalBrowserNamespace(namespace),
    null,
    `namespace clínico precisa estar classificado: ${namespace}`,
  );
}

for (const namespace of [
  "neuroped:theme",
  "neuroped:access",
  "neuroped:refresh",
  "neuroped:user",
  "neuroped:active-clinic-id",
  "neuroped:auth-capability",
]) {
  assert.equal(
    classifyClinicalBrowserNamespace(namespace),
    null,
    `namespace não clínico não deve ser bloqueado pela política: ${namespace}`,
  );
}

assert.deepEqual(
  [...LIVE_BROWSER_LOCAL_CLINICAL_ROUTES],
  ["/caa", "/assinatura-digital", "/cognitive-lab"],
  "a lista fail-closed deve ser explícita e revisável",
);
for (const route of [
  "/caa",
  "/assinatura-digital",
  "/cognitive-lab",
  "/cognitive-lab/go-no-go",
]) {
  assert.equal(
    isLiveBrowserLocalClinicalRouteDenied(route, "remote", true),
    true,
    `${route} não pode montar prontuário browser-local em LIVE autenticado`,
  );
  assert.equal(
    isLiveBrowserLocalClinicalRouteDenied(route, "local", true),
    false,
    `${route} deve permanecer disponível em modo local explícito`,
  );
  assert.equal(
    isLiveBrowserLocalClinicalRouteDenied(route, "remote", false),
    false,
    `${route} não deve interferir no fluxo de autenticação antes da sessão`,
  );
}
for (const route of ["/agenda", "/conecta", "/pre-consulta", "/diario-sono"] ) {
  assert.equal(
    isLiveBrowserLocalClinicalRouteDenied(route, "remote", true),
    false,
    `${route} não é uma superfície browser-local inteira e deve manter seu contrato próprio`,
  );
}

console.log("✓ clinical browser persistence policy: LIVE remoto nega PHI, bloqueia superfícies locais antes do mount e preserva UI/auth/local explícito");