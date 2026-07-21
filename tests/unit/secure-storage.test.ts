import assert from "node:assert/strict";
import {
  secureClearAll,
  secureGet,
  secureSet,
} from "../../client/src/lib/secureStorage";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length() {
    return this.values.size;
  }
  clear() {
    this.values.clear();
  }
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.values.delete(key);
  }
  setItem(key: string, value: string) {
    this.values.set(key, String(value));
  }
}

class RejectingStorage extends MemoryStorage {
  override setItem(): void {
    throw new DOMException("Quota excedida", "QuotaExceededError");
  }
}

const sharedLocalStorage = new MemoryStorage();
let activeSessionStorage = new MemoryStorage();
Object.defineProperty(globalThis, "localStorage", {
  get: () => sharedLocalStorage,
  configurable: true,
});
Object.defineProperty(globalThis, "sessionStorage", {
  get: () => activeSessionStorage,
  configurable: true,
});

await secureSet("pre-consulta", { paciente: "Ana", queixa: "linguagem" });
const raw = sessionStorage.getItem("neuroped:secure:pre-consulta") ?? "";
assert.ok(raw.length > 0);
assert.equal(raw.includes("Ana"), false, "PII não pode aparecer em texto puro");
assert.deepEqual(await secureGet("pre-consulta"), {
  paciente: "Ana",
  queixa: "linguagem",
});

// Regressão: a conversão Base64 não pode estourar a pilha com payloads grandes.
const largePayload = "x".repeat(1_500_000);
assert.equal(await secureSet("payload-grande", largePayload), true);
assert.equal(
  (await secureGet<string>("payload-grande"))?.length,
  largePayload.length,
);

sessionStorage.setItem("neuroped:secure:pre-retorno", raw);
assert.equal(
  await secureGet("pre-retorno"),
  null,
  "ciphertext não pode ser trocado entre chaves",
);

await secureSet("expirado", { paciente: "Bia" }, -1);
assert.equal(await secureGet("expirado"), null);

// Migração compatível: uma entrada do formato antigo só sai do localStorage
// depois que a aba proprietária consegue decriptá-la e copiá-la para seu escopo.
await secureSet("legado-migravel", { paciente: "Cris" });
const legacyRaw = sessionStorage.getItem("neuroped:secure:legado-migravel");
assert.ok(legacyRaw);
sessionStorage.removeItem("neuroped:secure:legado-migravel");
localStorage.setItem("neuroped:secure:legado-migravel", legacyRaw!);
assert.deepEqual(await secureGet("legado-migravel"), { paciente: "Cris" });
assert.equal(localStorage.getItem("neuroped:secure:legado-migravel"), null);
const migratedRaw = sessionStorage.getItem("neuroped:secure:legado-migravel");
assert.ok(migratedRaw);
assert.notEqual(migratedRaw, legacyRaw, "migração deve gerar IV/envelope novo");
assert.equal(JSON.parse(migratedRaw!).v, 2);

// Regressão multiaba: o ciphertext permanece no sessionStorage de cada aba,
// mas a chave efêmera de uma aba não abre nem apaga a entrada da outra.
const tabASession = new MemoryStorage();
activeSessionStorage = tabASession;
const tabA = await import("../../client/src/lib/secureStorage.ts?tab-a");
await tabA.secureSet("scale-draft:multiaba", { resposta: "preservar" });
const tabARaw = tabASession.getItem("neuroped:secure:scale-draft:multiaba");
assert.ok(tabARaw);

const tabBSession = new MemoryStorage();
activeSessionStorage = tabBSession;
const tabB = await import("../../client/src/lib/secureStorage.ts?tab-b");
assert.equal(await tabB.secureGet("scale-draft:multiaba"), null);
assert.equal(
  tabASession.getItem("neuroped:secure:scale-draft:multiaba"),
  tabARaw,
);

// Também cobre o legado compartilhado: chave errada retorna null, mas preserva
// o ciphertext para que a aba dona consiga migrá-lo depois.
tabASession.removeItem("neuroped:secure:scale-draft:multiaba");
sharedLocalStorage.setItem("neuroped:secure:scale-draft:multiaba", tabARaw!);
assert.equal(await tabB.secureGet("scale-draft:multiaba"), null);
assert.equal(
  sharedLocalStorage.getItem("neuroped:secure:scale-draft:multiaba"),
  tabARaw,
);
await tabB.secureClear("scale-draft:multiaba");
assert.equal(
  sharedLocalStorage.getItem("neuroped:secure:scale-draft:multiaba"),
  tabARaw,
  "limpeza de outra aba não pode apagar ciphertext legado indecifrável",
);
activeSessionStorage = tabASession;
assert.deepEqual(await tabA.secureGet("scale-draft:multiaba"), {
  resposta: "preservar",
});
assert.equal(
  sharedLocalStorage.getItem("neuroped:secure:scale-draft:multiaba"),
  null,
);
const remigratedTabARaw = tabASession.getItem(
  "neuroped:secure:scale-draft:multiaba",
);
assert.ok(remigratedTabARaw);
assert.notEqual(remigratedTabARaw, tabARaw);

// Quota/modo privado: a API retorna falha e o salvamento de pré-consulta não
// pode apagar a única cópia legada nem anunciar sucesso.
const rejectingSession = new RejectingStorage();
activeSessionStorage = rejectingSession;
sharedLocalStorage.setItem(
  "neuroped:pre-consultas",
  JSON.stringify([{ paciente: "Preservar legado" }]),
);
assert.equal(await secureSet("quota-falha", { paciente: "Dado" }), false);
const { savePreConsultas } =
  await import("../../client/src/lib/preConsultaCore.ts");
assert.equal(await savePreConsultas([]), false);
assert.ok(
  localStorage.getItem("neuroped:pre-consultas")?.includes("Preservar legado"),
);
activeSessionStorage = tabASession;

localStorage.setItem(
  "neuroped:pre-consultas",
  JSON.stringify([{ paciente: "Legado" }]),
);
localStorage.setItem(
  "neuroped:pre-retornos",
  JSON.stringify([{ paciente: "Legado" }]),
);
localStorage.setItem(
  "neuroped:scale-draft:asq-3",
  JSON.stringify({ answers: { 0: 1 }, updatedAt: new Date().toISOString() }),
);
localStorage.setItem(
  "np_filtro_state_v1",
  JSON.stringify({ idade: 7, queixa: "linguagem" }),
);
localStorage.setItem(
  "neuroped:filter-flash",
  JSON.stringify({ sintomas: ["sono"] }),
);
sessionStorage.setItem(
  "neuroped:filter-flash",
  JSON.stringify({ queixas: ["linguagem"] }),
);
localStorage.setItem("neuroped:theme", "dark");
await secureClearAll();
assert.equal(
  localStorage.getItem("neuroped:scale-draft:asq-3"),
  null,
  "limpeza global deve remover rascunho clínico legado em texto puro",
);
assert.equal(localStorage.getItem("np_filtro_state_v1"), null);
assert.equal(localStorage.getItem("neuroped:filter-flash"), null);
assert.equal(
  sessionStorage.getItem("neuroped:filter-flash"),
  null,
  "limpeza global deve remover contexto clínico efêmero desta aba",
);
assert.equal(localStorage.getItem("neuroped:theme"), "dark");
assert.equal(localStorage.length, 1);
assert.equal(sessionStorage.length, 0);
console.log(
  "✓ rascunhos clínicos cifram, isolam abas, migram, expiram e podem ser apagados",
);
