import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) =>
  readFileSync(new URL(`../../${path}`, import.meta.url), "utf8").replace(/\r\n?/g, "\n");

const policy = read("client/src/lib/clinicalStoragePolicy.ts");
const core = read("client/src/lib/preConsultaCore.ts");
const preConsulta = read("client/src/pages/pre-consulta.tsx");
const preRetorno = read("client/src/pages/pre-retorno.tsx");
const recepcao = read("client/src/pages/recepcao.tsx");

// Registro central: as duas filas são dado clínico e devem negar persistência local em LIVE.
for (const key of ["pre-consultas", "pre-retornos"]) {
  const at = policy.indexOf(`"${key}":`);
  assert.ok(at >= 0, `policy: ${key} precisa estar classificada`);
  const rule = policy.slice(at, at + 500);
  assert.match(rule, /classification:\s*"clinical-record"/);
  assert.match(rule, /liveLocalPersistence:\s*"deny"/);
}
assert.match(policy, /export function isLiveLocalPersistenceDenied/);
assert.match(policy, /VITE_AUTH_MODE === "remote"/);
assert.match(policy, /Boolean\(getAccessToken\(\)\)/);

// Pré-consulta: guard deve ocorrer antes de cofre e antes do legado plaintext.
const loadStart = core.indexOf("export async function loadPreConsultas");
const loadGuard = core.indexOf("if (isLiveLocalPersistenceDenied(PRE_CONSULTA_SECURE_KEY)) return [];", loadStart);
const secureRead = core.indexOf("secureGet<PreConsultaRecord[]>(PRE_CONSULTA_SECURE_KEY)", loadStart);
const legacyRead = core.indexOf("localStorage.getItem(PRE_CONSULTA_STORAGE_KEY)", loadStart);
assert.ok(loadGuard >= loadStart && loadGuard < secureRead, "pré-consulta: LIVE deve bloquear antes do secureGet");
assert.ok(loadGuard < legacyRead, "pré-consulta: LIVE deve bloquear antes da migração legada");

const saveStart = core.indexOf("export async function savePreConsultas");
const saveGuard = core.indexOf("if (isLiveLocalPersistenceDenied(PRE_CONSULTA_SECURE_KEY)) return false;", saveStart);
const secureWrite = core.indexOf("secureSet(PRE_CONSULTA_SECURE_KEY, items)", saveStart);
assert.ok(saveGuard >= saveStart && saveGuard < secureWrite, "pré-consulta: LIVE deve bloquear antes do secureSet");

const clearStart = core.indexOf("export async function clearPreConsultas");
const clearGuard = core.indexOf("if (isLiveLocalPersistenceDenied(PRE_CONSULTA_SECURE_KEY)) return;", clearStart);
const clearLegacy = core.indexOf("localStorage.removeItem(PRE_CONSULTA_STORAGE_KEY)", clearStart);
assert.ok(clearGuard >= clearStart && clearGuard < clearLegacy, "pré-consulta: LIVE não pode apagar legado local");

// UI pré-consulta: formulário em memória, sem botão de persistência local no LIVE.
assert.match(preConsulta, /useAuth/);
assert.match(preConsulta, /const localPersistenceEnabled = !\(accessMode === "remote" && isAuthenticated\)/);
assert.match(preConsulta, /data-testid="pre-consulta-local-persistence-disabled"/);
assert.match(preConsulta, /LIVE · não armazenado neste dispositivo/);
assert.match(preConsulta, /Dados locais preexistentes não são lidos, apagados nem migrados automaticamente/);
assert.match(preConsulta, /if \(!localPersistenceEnabled\) \{[\s\S]*setSaved\(null\);[\s\S]*return;/);

// Pré-retorno: mesma defesa antes de qualquer leitura, migração, gravação ou limpeza.
const retornoLoad = preRetorno.indexOf("async function loadRecords");
const retornoLoadGuard = preRetorno.indexOf("if (isLiveLocalPersistenceDenied(SECURE_STORAGE_KEY)) return [];", retornoLoad);
const retornoSecureRead = preRetorno.indexOf("secureGet<PreRetornoRecord[]>(SECURE_STORAGE_KEY)", retornoLoad);
const retornoLegacyRead = preRetorno.indexOf("localStorage.getItem(STORAGE_KEY)", retornoLoad);
assert.ok(retornoLoadGuard >= retornoLoad && retornoLoadGuard < retornoSecureRead, "pré-retorno: guard deve anteceder secureGet");
assert.ok(retornoLoadGuard < retornoLegacyRead, "pré-retorno: guard deve anteceder migração legada");

const retornoSave = preRetorno.indexOf("async function saveRecords");
const retornoSaveGuard = preRetorno.indexOf("if (isLiveLocalPersistenceDenied(SECURE_STORAGE_KEY)) return false;", retornoSave);
const retornoWrite = preRetorno.indexOf("secureSet(SECURE_STORAGE_KEY, items)", retornoSave);
assert.ok(retornoSaveGuard >= retornoSave && retornoSaveGuard < retornoWrite, "pré-retorno: guard deve anteceder escrita local");

const retornoClear = preRetorno.indexOf("async function clearRecords");
const retornoClearGuard = preRetorno.indexOf("if (isLiveLocalPersistenceDenied(SECURE_STORAGE_KEY)) return;", retornoClear);
const retornoClearLegacy = preRetorno.indexOf("localStorage.removeItem(STORAGE_KEY)", retornoClear);
assert.ok(retornoClearGuard >= retornoClear && retornoClearGuard < retornoClearLegacy, "pré-retorno: LIVE não pode apagar legado local");

assert.match(preRetorno, /useAuth/);
assert.match(preRetorno, /const localPersistenceEnabled = !\(accessMode === "remote" && isAuthenticated\)/);
assert.match(preRetorno, /data-testid="pre-retorno-local-persistence-disabled"/);
assert.match(preRetorno, /LIVE · não armazenado neste dispositivo/);

// Recepção: não pode sequer chamar a fila local quando estiver em sessão remota autenticada.
assert.match(recepcao, /useAuth/);
assert.match(recepcao, /const isRemoteClinical = accessMode === "remote" && isAuthenticated/);
const receptionEffect = recepcao.indexOf("useEffect(() => {");
const receptionGuard = recepcao.indexOf("if (isRemoteClinical) {", receptionEffect);
const receptionLoad = recepcao.indexOf("loadPreConsultas()", receptionEffect);
assert.ok(receptionGuard >= receptionEffect && receptionGuard < receptionLoad, "recepção: guard LIVE deve anteceder loadPreConsultas");
assert.match(recepcao, /data-testid="recepcao-local-queue-disabled"/);
assert.match(recepcao, /LIVE · fila clínica local desativada/);
assert.match(recepcao, /não lê, restaura, migra nem altera pré-consultas armazenadas neste navegador/);

console.log("✓ LIVE intake guard: Pré-Consulta, Pré-Retorno e Recepção falham fechado antes do storage local");
