import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) =>
  readFileSync(new URL(`../../${path}`, import.meta.url), "utf8").replace(/\r\n?/g, "\n");

const diary = read("client/src/components/DiarioClinico.tsx");
const acompanhamento = read("client/src/pages/neuroped-acompanhamento.tsx");
const epilepsy = read("client/src/pages/epilepsy-diary.tsx");
const headache = read("client/src/pages/headache-calendar.tsx");

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

console.log("✓ LIVE diary guard: diários genéricos, epilepsia, cefaleia e correlação local permanecem fail-closed no remoto");
