import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) =>
  readFileSync(new URL(`../../${path}`, import.meta.url), "utf8").replace(/\r\n?/g, "\n");

const policy = read("client/src/lib/clinicalStoragePolicy.ts");
const sessionStorageHelper = read("client/src/lib/clinicalSessionStorage.ts");
const preConsultaCore = read("client/src/lib/preConsultaCore.ts");
const preConsulta = read("client/src/pages/pre-consulta.tsx");
const preRetorno = read("client/src/pages/pre-retorno.tsx");
const recepcao = read("client/src/pages/recepcao.tsx");

// 1) Registro arquitetural: chaves clínicas precisam de classificação explícita.
for (const key of ["pre-consultas", "pre-retornos"]) {
  assert.match(
    policy,
    new RegExp(`id: "${key}"[\\s\\S]*storageClass: "clinical-record"[\\s\\S]*remoteAuthenticatedLocal: "deny"`),
    `${key} deve ser clinical-record e negar persistência local no LIVE autenticado`,
  );
}
assert.match(policy, /if \(!rule\) return false;/, "chave não classificada deve falhar fechado");
assert.match(policy, /VITE_AUTH_MODE === "remote"/);
assert.match(policy, /Boolean\(getAccessToken\(\)\)/);

// 2) Helper central: o bloqueio precisa acontecer ANTES de secureStorage/localStorage.
function assertGuardBefore(source, signature, deniedGuard, sensitiveCalls, label) {
  const start = source.indexOf(signature);
  assert.ok(start >= 0, `${label}: função ausente`);
  const guardAt = source.indexOf(deniedGuard, start);
  assert.ok(guardAt >= start, `${label}: guard de política ausente`);
  for (const call of sensitiveCalls) {
    const callAt = source.indexOf(call, start);
    assert.ok(callAt >= 0, `${label}: chamada esperada ausente: ${call}`);
    assert.ok(guardAt < callAt, `${label}: política deve bloquear antes de ${call}`);
  }
}

assertGuardBefore(
  sessionStorageHelper,
  "export async function loadClinicalSessionRecords",
  "if (!canUseLocalClinicalPersistence(config.secureKey)) return [];",
  ["secureGet<T[]>(config.secureKey)", "localStorage.getItem(config.legacyLocalStorageKey)"],
  "load",
);
assertGuardBefore(
  sessionStorageHelper,
  "export async function saveClinicalSessionRecords",
  "if (!canUseLocalClinicalPersistence(config.secureKey)) return false;",
  ["secureSet(config.secureKey, items)", "localStorage.removeItem(config.legacyLocalStorageKey)"],
  "save",
);
assertGuardBefore(
  sessionStorageHelper,
  "export async function clearClinicalSessionRecords",
  "if (!canUseLocalClinicalPersistence(config.secureKey)) return;",
  ["localStorage.removeItem(config.legacyLocalStorageKey)", "secureClear(config.secureKey)"],
  "clear",
);

// 3) Pré-consulta e Pré-retorno não podem contornar o helper central.
assert.match(preConsultaCore, /loadClinicalSessionRecords<PreConsultaRecord>/);
assert.match(preConsultaCore, /saveClinicalSessionRecords\(preConsultaStorageConfig, items\)/);
assert.match(preConsultaCore, /clearClinicalSessionRecords\(preConsultaStorageConfig\)/);
assert.doesNotMatch(preConsultaCore, /secureGet|secureSet|secureClear|localStorage\.getItem/);

assert.match(preRetorno, /loadClinicalSessionRecords<PreRetornoRecord>/);
assert.match(preRetorno, /saveClinicalSessionRecords\(preRetornoStorageConfig, items\)/);
assert.match(preRetorno, /clearClinicalSessionRecords\(preRetornoStorageConfig\)/);
assert.doesNotMatch(preRetorno, /secureGet|secureSet|secureClear|localStorage\.getItem/);

// 4) UI LIVE: formulário permanece útil, mas somente em memória.
function assertMemoryOnlyPage(source, {
  label,
  testId,
  loadCall,
  saveCall,
  localDeleteText,
}) {
  assert.match(source, /useAuth/);
  assert.match(source, /const liveMemoryOnly = accessMode === "remote" && isAuthenticated/);
  assert.match(source, new RegExp(`data-testid="${testId}"`));
  assert.match(source, /LIVE · não armazenado neste dispositivo/);
  assert.match(source, /somente em memória nesta tela/);

  const saveFn = source.indexOf("async function salvar()");
  const memoryGuard = source.indexOf("if (liveMemoryOnly) {", saveFn);
  const readAt = source.indexOf(loadCall, saveFn);
  const writeAt = source.indexOf(saveCall, saveFn);
  assert.ok(saveFn >= 0 && memoryGuard > saveFn, `${label}: guard de memória ausente`);
  assert.ok(readAt > memoryGuard, `${label}: não pode ler storage antes do guard LIVE`);
  assert.ok(writeAt > memoryGuard, `${label}: não pode gravar storage antes do guard LIVE`);

  assert.match(source, /liveMemoryOnly \? "Preparar resumo"/);
  assert.match(source, new RegExp(`!liveMemoryOnly && \\([\\s\\S]*${localDeleteText}`));
}

assertMemoryOnlyPage(preConsulta, {
  label: "pré-consulta",
  testId: "pre-consulta-live-memory-only",
  loadCall: "loadPreConsultas()",
  saveCall: "savePreConsultas(",
  localDeleteText: "Apagar deste dispositivo",
});
assertMemoryOnlyPage(preRetorno, {
  label: "pré-retorno",
  testId: "pre-retorno-live-memory-only",
  loadCall: "loadRecords()",
  saveCall: "saveRecords(",
  localDeleteText: "Apagar deste dispositivo",
});

// 5) Recepção: navegador jamais vira fila clínica oficial em LIVE.
assert.match(recepcao, /useAuth/);
assert.match(recepcao, /const liveLocalQueueBlocked = accessMode === "remote" && isAuthenticated/);
assert.match(recepcao, /data-testid="recepcao-live-local-queue-disabled"/);
assert.match(recepcao, /LIVE · fila clínica local desativada/);
assert.match(recepcao, /não são lidas, restauradas, migradas nem apresentadas como fila oficial/);
assert.match(recepcao, /data-testid="recepcao-live-local-queue-empty"/);

const effectStart = recepcao.indexOf("useEffect(() => {");
const effectGuard = recepcao.indexOf("if (liveLocalQueueBlocked) {", effectStart);
const effectLoad = recepcao.indexOf("loadPreConsultas()", effectStart);
assert.ok(effectGuard >= 0 && effectGuard < effectLoad, "recepção: guard deve anteceder load local no mount");

const refreshStart = recepcao.indexOf("async function refresh()");
const refreshGuard = recepcao.indexOf("if (liveLocalQueueBlocked) {", refreshStart);
const refreshLoad = recepcao.indexOf("loadPreConsultas()", refreshStart);
assert.ok(refreshGuard >= 0 && refreshGuard < refreshLoad, "recepção: refresh LIVE não pode ler fila local");

const statusStart = recepcao.indexOf("async function updateStatus");
const statusGuard = recepcao.indexOf("if (liveLocalQueueBlocked) return;", statusStart);
const statusWrite = recepcao.indexOf("savePreConsultas(updated)", statusStart);
assert.ok(statusGuard >= 0 && statusGuard < statusWrite, "recepção: status LIVE não pode gravar fila local");

console.log("✓ LIVE previsit guard: Pré-Consulta, Pré-Retorno e Recepção falham fechado sem tocar storage local");
