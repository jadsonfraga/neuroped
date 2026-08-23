import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) =>
  readFileSync(new URL(`../../${path}`, import.meta.url), "utf8").replace(/\r\n?/g, "\n");

const policy = read("client/src/lib/clinicalStoragePolicy.ts");
const preConsultaCore = read("client/src/lib/preConsultaCore.ts");
const preConsulta = read("client/src/pages/pre-consulta.tsx");
const preRetorno = read("client/src/pages/pre-retorno.tsx");
const recepcao = read("client/src/pages/recepcao.tsx");

// Registro central: as duas superfícies P0 são prontuário operacional e negam
// persistência local em sessão remota autenticada.
for (const key of ["pre-consultas", "pre-retornos"]) {
  assert.match(policy, new RegExp(`"${key}"[\\s\\S]*classification: "clinical-record"[\\s\\S]*liveAuthenticatedLocalPersistence: "deny"`));
}
assert.match(policy, /isRemoteAuthenticatedClinicalSession/);
assert.match(policy, /accessMode === "remote" && context\.isAuthenticated/);
assert.match(policy, /Boolean\(getAccessToken\(\)\)/);

function assertFunctionGuardBefore(source, signature, guardText, forbiddenTexts, label) {
  const start = source.indexOf(signature);
  assert.ok(start >= 0, `${label}: função ausente`);
  const guard = source.indexOf(guardText, start);
  assert.ok(guard >= start, `${label}: guard LIVE ausente`);
  for (const forbidden of forbiddenTexts) {
    const at = source.indexOf(forbidden, start);
    assert.ok(at >= 0, `${label}: operação esperada ausente (${forbidden})`);
    assert.ok(guard < at, `${label}: guard LIVE precisa anteceder ${forbidden}`);
  }
}

assertFunctionGuardBefore(
  preConsultaCore,
  "export async function loadPreConsultas",
  "if (isClinicalLocalPersistenceBlocked(PRE_CONSULTA_SECURE_KEY)) return [];",
  ["secureGet<PreConsultaRecord[]>", "localStorage.getItem(PRE_CONSULTA_STORAGE_KEY)"],
  "pré-consulta load",
);
assertFunctionGuardBefore(
  preConsultaCore,
  "export async function savePreConsultas",
  "if (isClinicalLocalPersistenceBlocked(PRE_CONSULTA_SECURE_KEY)) return false;",
  ["secureSet(PRE_CONSULTA_SECURE_KEY", "localStorage.removeItem(PRE_CONSULTA_STORAGE_KEY)"],
  "pré-consulta save",
);
assertFunctionGuardBefore(
  preConsultaCore,
  "export async function clearPreConsultas",
  "if (isClinicalLocalPersistenceBlocked(PRE_CONSULTA_SECURE_KEY)) return;",
  ["localStorage.removeItem(PRE_CONSULTA_STORAGE_KEY)", "secureClear(PRE_CONSULTA_SECURE_KEY)"],
  "pré-consulta clear",
);

assertFunctionGuardBefore(
  preRetorno,
  "async function loadRecords",
  "if (isClinicalLocalPersistenceBlocked(SECURE_STORAGE_KEY)) return [];",
  ["secureGet<PreRetornoRecord[]>", "localStorage.getItem(STORAGE_KEY)"],
  "pré-retorno load",
);
assertFunctionGuardBefore(
  preRetorno,
  "async function saveRecords",
  "if (isClinicalLocalPersistenceBlocked(SECURE_STORAGE_KEY)) return false;",
  ["secureSet(SECURE_STORAGE_KEY", "localStorage.removeItem(STORAGE_KEY)"],
  "pré-retorno save",
);
assertFunctionGuardBefore(
  preRetorno,
  "async function clearRecords",
  "if (isClinicalLocalPersistenceBlocked(SECURE_STORAGE_KEY)) return;",
  ["localStorage.removeItem(STORAGE_KEY)", "secureClear(SECURE_STORAGE_KEY)"],
  "pré-retorno clear",
);

// UI: em LIVE os formulários continuam em memória, mas nenhuma ação de salvar
// pode cair no loader/saver local e os botões de limpeza local desaparecem.
for (const [name, source, testId] of [
  ["pré-consulta", preConsulta, "pre-consulta-live-memory-only"],
  ["pré-retorno", preRetorno, "pre-retorno-live-memory-only"],
]) {
  assert.match(source, /useAuth/);
  assert.match(source, /isClinicalLocalPersistenceBlocked/);
  assert.match(source, new RegExp(`data-testid="${testId}"`));
  assert.match(source, /LIVE · não armazenado neste dispositivo/);
  assert.match(source, /leitura, restauração, migração, gravação ou limpeza/);
  assert.match(source, /Manter nesta sessão/);
  assert.match(source, /!localPersistenceBlocked && \(/, `${name}: limpeza local deve ficar indisponível em LIVE`);
}

const preConsultaSaveStart = preConsulta.indexOf("async function salvar()");
const preConsultaMemoryGuard = preConsulta.indexOf("if (localPersistenceBlocked) {", preConsultaSaveStart);
const preConsultaRead = preConsulta.indexOf("loadPreConsultas()", preConsultaSaveStart);
assert.ok(preConsultaMemoryGuard >= 0 && preConsultaMemoryGuard < preConsultaRead, "pré-consulta: modo memória deve anteceder leitura local");

const preRetornoSaveStart = preRetorno.indexOf("async function salvar()");
const preRetornoMemoryGuard = preRetorno.indexOf("if (localPersistenceBlocked) {", preRetornoSaveStart);
const preRetornoRead = preRetorno.indexOf("loadRecords()", preRetornoSaveStart);
assert.ok(preRetornoMemoryGuard >= 0 && preRetornoMemoryGuard < preRetornoRead, "pré-retorno: modo memória deve anteceder leitura local");

// Recepção: em LIVE não reconstrói a fila a partir do browser nem permite
// refresh/status sobre cópia local.
assert.match(recepcao, /data-testid="recepcao-live-local-queue-disabled"/);
assert.match(recepcao, /LIVE · fila clínica local desativada/);
assert.match(recepcao, /fonte tenant-aware da clínica/);
const effectStart = recepcao.indexOf("useEffect(() => {");
const receptionGuard = recepcao.indexOf("if (localQueueBlocked) {", effectStart);
const receptionRead = recepcao.indexOf("loadPreConsultas().then", effectStart);
assert.ok(receptionGuard >= 0 && receptionGuard < receptionRead, "recepção: guard LIVE deve anteceder leitura da fila local");
const refreshStart = recepcao.indexOf("async function refresh()");
assert.ok(recepcao.indexOf("if (localQueueBlocked) return;", refreshStart) < recepcao.indexOf("loadPreConsultas()", refreshStart));
const updateStart = recepcao.indexOf("async function updateStatus");
assert.ok(recepcao.indexOf("if (localQueueBlocked) return;", updateStart) < recepcao.indexOf("savePreConsultas(updated)", updateStart));

console.log("✓ LIVE pre-visit guard: pré-consulta, pré-retorno e recepção falham fechado antes de tocar storage local");
