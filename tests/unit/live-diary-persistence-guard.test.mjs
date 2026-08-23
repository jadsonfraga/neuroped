import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) =>
  readFileSync(new URL(`../../${path}`, import.meta.url), "utf8").replace(/\r\n?/g, "\n");

const diary = read("client/src/components/DiarioClinico.tsx");
const acompanhamento = read("client/src/pages/neuroped-acompanhamento.tsx");
const epilepsy = read("client/src/pages/epilepsy-diary.tsx");
const headache = read("client/src/pages/headache-calendar.tsx");
const persistentStorage = read("client/src/lib/persistentSecureStorage.ts");

// Defesa 1: os componentes clínicos devem falhar fechado antes de tocar o cofre.
assert.match(diary, /useAuth/);
assert.match(
  diary,
  /const localDraftEnabled = !\(accessMode === "remote" && isAuthenticated\)/,
  "diários devem falhar fechado em sessão clínica remota autenticada",
);

const readGuard = diary.indexOf("if (!localDraftEnabled) {");
const secureRead = diary.indexOf("secureGet<DiarioEntry[]>(secureKey)");
const legacyRead = diary.indexOf("localStorage.getItem(config.storageKey)");
assert.ok(readGuard >= 0 && readGuard < secureRead, "guard remoto deve anteceder leitura do cofre local");
assert.ok(readGuard < legacyRead, "guard remoto deve anteceder migração de localStorage legado");

const writeGuard = diary.indexOf("if (!entriesReady || !localDraftEnabled) return;");
const persistedWrite = diary.indexOf("secureSet(secureKey, snapshot)");
assert.ok(writeGuard >= 0 && writeGuard < persistedWrite, "guard remoto deve anteceder escrita persistente");

assert.match(diary, /data-testid="diario-local-persistence-disabled"/);
assert.match(diary, /não lê, migra nem grava dados clínicos no dispositivo/);
assert.match(diary, /Dados locais preexistentes não foram apagados nem enviados automaticamente/);
assert.doesNotMatch(
  diary,
  /Registro adicionado à sessão/,
  "UI não pode chamar persistência longitudinal local de mero registro de sessão",
);

assert.match(acompanhamento, /const isRemoteClinical = accessMode === "remote" && isAuthenticated/);
assert.match(
  acompanhamento,
  /<ClinicalSchoolCorrelation localDraftsEnabled=\{!isRemoteClinical\} \/>/,
  "correlação clínica-escola deve receber a trava do modo remoto",
);

const correlationGuard = acompanhamento.indexOf("if (!localDraftsEnabled) {");
const correlationRead = acompanhamento.indexOf("secureGet<DiarioEntry[]>(\"diario:diario-escola\")");
assert.ok(
  correlationGuard >= 0 && correlationGuard < correlationRead,
  "painel de correlação não pode ler rascunhos locais antes de validar o modo LIVE",
);
assert.match(acompanhamento, /data-testid="clinical-school-correlation-live-blocked"/);
assert.match(acompanhamento, /LIVE · sem prontuário local paralelo/);
assert.match(acompanhamento, /Nenhum dado local é lido, apagado ou migrado automaticamente/);

function assertStandaloneDiaryGuard(source, { name, entryType, disabledTestId }) {
  assert.match(source, /useAuth/);
  assert.match(
    source,
    /const localDraftEnabled = !\(accessMode === "remote" && isAuthenticated\)/,
    `${name}: modo remoto autenticado deve bloquear rascunho local`,
  );

  const guard = source.indexOf("if (!localDraftEnabled) {");
  const readAt = source.indexOf(`secureGet<${entryType}[]>(STORAGE_KEY)`);
  assert.ok(guard >= 0 && readAt >= 0 && guard < readAt, `${name}: guard deve anteceder secureGet`);

  const saveGuard = source.indexOf("if (!entriesReady || !localDraftEnabled) return;");
  const writeAt = source.indexOf("secureSet(STORAGE_KEY, snapshot)");
  assert.ok(saveGuard >= 0 && writeAt >= 0 && saveGuard < writeAt, `${name}: guard deve anteceder secureSet`);

  assert.match(source, new RegExp(`data-testid="${disabledTestId}"`));
  assert.match(source, /não lê nem grava o histórico deste dispositivo/);
  assert.match(source, /não são migrados automaticamente para o prontuário tenant-aware/);
}

assertStandaloneDiaryGuard(epilepsy, {
  name: "epilepsia",
  entryType: "EpilepsyEntry",
  disabledTestId: "epilepsy-diary-local-persistence-disabled",
});
assertStandaloneDiaryGuard(headache, {
  name: "cefaleia",
  entryType: "HeadacheEntry",
  disabledTestId: "headache-diary-local-persistence-disabled",
});

// Defesa 2: o próprio cofre persistente deve recusar qualquer diario:* em build
// remoto com token, mesmo que uma tela futura esqueça completamente o guard de UI.
assert.match(persistentStorage, /import \{ getAccessToken \} from "@\/lib\/authClient"/);
assert.match(persistentStorage, /const DIARY_PREFIX = "diario:"/);
assert.match(
  persistentStorage,
  /key\.startsWith\(DIARY_PREFIX\)[\s\S]*import\.meta\.env\?\.VITE_AUTH_MODE === "remote"[\s\S]*Boolean\(getAccessToken\(\)\)/,
  "cofre deve identificar diário + build remoto + credencial antes de bloquear",
);

for (const [name, signature, deniedReturn] of [
  ["set", "export async function persistentSecureSet", "return false;"],
  ["get", "export async function persistentSecureGet", "return null;"],
  ["clear", "export async function persistentSecureClear", "return;"],
]) {
  const start = persistentStorage.indexOf(signature);
  assert.ok(start >= 0, `cofre: função ${name} ausente`);
  const openDb = persistentStorage.indexOf("openDatabase()", start);
  const guardAt = persistentStorage.indexOf("isRemoteClinicalDiaryPersistenceBlocked(key)", start);
  const deniedAt = persistentStorage.indexOf(deniedReturn, guardAt);
  assert.ok(guardAt >= start && deniedAt >= guardAt, `cofre: ${name} deve falhar fechado`);
  if (openDb >= 0) {
    assert.ok(guardAt < openDb, `cofre: ${name} deve bloquear antes de abrir IndexedDB`);
  }
}

const clearAllStart = persistentStorage.indexOf("export async function persistentSecureClearAll");
assert.ok(clearAllStart >= 0, "cofre: limpeza global precisa continuar disponível");
const clearAllBody = persistentStorage.slice(clearAllStart);
assert.doesNotMatch(
  clearAllBody,
  /isRemoteClinicalDiaryPersistenceBlocked/,
  "logout/troca de conta não pode ser impedido de destruir o cofre",
);
assert.match(clearAllBody, /indexedDB\.deleteDatabase\(DB_NAME\)/);

console.log("✓ LIVE diary guard: UI + cofre persistente bloqueiam prontuário local paralelo no remoto");
