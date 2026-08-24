import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function source(path) {
  return readFileSync(path, "utf8");
}

function before(text, first, second, label) {
  const a = text.indexOf(first);
  const b = text.indexOf(second);
  assert.notEqual(a, -1, `${label}: não encontrou ${first}`);
  assert.notEqual(b, -1, `${label}: não encontrou ${second}`);
  assert.ok(a < b, `${label}: ${first} deve ocorrer antes de ${second}`);
}

const policy = source("client/src/lib/previsitLocalPersistence.ts");
const centralPolicy = source("client/src/lib/clinicalBrowserPersistencePolicy.ts");
const preConsultaCore = source("client/src/lib/preConsultaCore.ts");
const preConsultaPage = source("client/src/pages/pre-consulta.tsx");
const preRetornoPage = source("client/src/pages/pre-retorno.tsx");
const recepcaoPage = source("client/src/pages/recepcao.tsx");

assert.match(policy, /isClinicalBrowserPersistenceDenied/);
assert.match(centralPolicy, /input\.authMode === "remote" && input\.authenticated && clinical/);
assert.match(centralPolicy, /"pre-consultas": "CLINICAL_EPHEMERAL"/);
assert.match(centralPolicy, /"pre-retornos": "CLINICAL_EPHEMERAL"/);
assert.match(policy, /preConsulta:\s*["']pre-consultas["']/);
assert.match(policy, /preRetorno:\s*["']pre-retornos["']/);

for (const fn of ["previsitSecureGet", "previsitSecureSet", "previsitSecureClear", "previsitLegacyGet", "previsitLegacyRemove"]) {
  assert.match(policy, new RegExp(`function ${fn}|async function ${fn}|export async function ${fn}|export function ${fn}`));
}

before(policy, 'if (isClinicalBrowserPersistenceDenied(key, "read")) return null;', "return secureGet<T>(key);", "policy secureGet fail-closed");
before(policy, 'if (isClinicalBrowserPersistenceDenied(key, "write")) return false;', "return secureSet(key, value);", "policy secureSet fail-closed");
before(policy, 'if (isClinicalBrowserPersistenceDenied(key, "remove")) return;', "await secureClear(key);", "policy secureClear fail-closed");
before(policy, 'if (isClinicalBrowserPersistenceDenied(key, "read")) return null;', "localStorage.getItem(key)", "policy legacy read fail-closed");
before(policy, 'if (isClinicalBrowserPersistenceDenied(key, "remove")) return;', "localStorage.removeItem(key)", "policy legacy delete fail-closed");

assert.doesNotMatch(preConsultaCore, /from\s+["']@\/lib\/secureStorage["']/);
assert.doesNotMatch(preConsultaCore, /\blocalStorage\b/);
assert.match(preConsultaCore, /previsitSecureGet/);
assert.match(preConsultaCore, /previsitLegacyGet/);
assert.match(preConsultaCore, /previsitSecureSet/);
assert.match(preConsultaCore, /previsitSecureClear/);

assert.doesNotMatch(preRetornoPage, /from\s+["']@\/lib\/secureStorage["']/);
assert.doesNotMatch(preRetornoPage, /\blocalStorage\b/);
assert.match(preRetornoPage, /PREVISIT_SECURE_KEYS\.preRetorno/);
assert.match(preRetornoPage, /previsitSecureGet/);
assert.match(preRetornoPage, /previsitLegacyGet/);

for (const [name, text, testId] of [
  ["pré-consulta", preConsultaPage, "pre-consulta-local-persistence-disabled"],
  ["pré-retorno", preRetornoPage, "pre-retorno-local-persistence-disabled"],
  ["recepção", recepcaoPage, "recepcao-local-preconsulta-disabled"],
]) {
  assert.match(text, /useAuth/);
  assert.match(text, /accessMode\s*===\s*["']remote["]\s*&&\s*isAuthenticated/);
  assert.match(text, new RegExp(testId));
  assert.match(text, /Dados locais preexistentes permanecem intocados|não lê, migra, altera nem apaga/i);
}

before(preConsultaPage, "if (!localPersistenceEnabled)", "const current = await loadPreConsultas();", "pré-consulta salvar");
before(preConsultaPage, "if (!localPersistenceEnabled) return;", "await clearPreConsultas();", "pré-consulta apagar");
before(preRetornoPage, "if (!localPersistenceEnabled)", "const current = await loadRecords();", "pré-retorno salvar");
before(preRetornoPage, "if (!localPersistenceEnabled) return;", "await clearRecords();", "pré-retorno apagar");
before(recepcaoPage, "if (!localPersistenceEnabled)", "void loadPreConsultas()", "recepção carregamento");
before(recepcaoPage, "if (!localPersistenceEnabled) return;", "const loaded = await loadPreConsultas();", "recepção refresh");
before(recepcaoPage, "if (!localPersistenceEnabled) return;", "const updated = items.map", "recepção update status");

assert.match(preConsultaPage, /localPersistenceEnabled\s*&&\s*\([\s\S]*Salvar pré-consulta/);
assert.match(preRetornoPage, /localPersistenceEnabled\s*&&\s*\([\s\S]*Salvar pré-retorno/);
assert.match(recepcaoPage, /recepcao-live-tenant-source-required/);

console.log("[live-previsit-guard] ✓ política central + UI fail-closed + recepção sem fila local em LIVE");
