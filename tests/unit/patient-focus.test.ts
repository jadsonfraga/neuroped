/**
 * Fronteiras do "paciente em foco".
 *
 * O foco é contexto de trabalho, não dado clínico: só o identificador opaco
 * pode existir no navegador, ele vive em sessionStorage (morre com a aba) e
 * precisa ser destruído junto com a sessão. Um id herdado entre sessões ou
 * entre clínicas na mesma aba abriria a próxima sessão apontando para o
 * paciente da anterior.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

class MemoryStorage {
  private map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.has(key) ? (this.map.get(key) as string) : null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, String(value));
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
  get size(): number {
    return this.map.size;
  }
  keys(): string[] {
    return [...this.map.keys()];
  }
}

const storage = new MemoryStorage();
const listeners = new Map<string, Set<(event: unknown) => void>>();

(globalThis as Record<string, unknown>).sessionStorage = storage;
(globalThis as Record<string, unknown>).window = {
  addEventListener(type: string, listener: (event: unknown) => void) {
    if (!listeners.has(type)) listeners.set(type, new Set());
    listeners.get(type)?.add(listener);
  },
  removeEventListener(type: string, listener: (event: unknown) => void) {
    listeners.get(type)?.delete(listener);
  },
  dispatchEvent(event: { type: string }) {
    for (const listener of listeners.get(event.type) ?? []) listener(event);
    return true;
  },
};
(globalThis as Record<string, unknown>).CustomEvent = class {
  type: string;
  detail: unknown;
  constructor(type: string, init?: { detail?: unknown }) {
    this.type = type;
    this.detail = init?.detail;
  }
};

const {
  clearFocusPatient,
  getFocusPatientId,
  setFocusPatientId,
  subscribeFocusPatient,
} = await import("../../client/src/lib/patientFocus.ts");

assert.equal(getFocusPatientId(), null, "sem foco no início da aba");

setFocusPatientId("pac-abc");
assert.equal(getFocusPatientId(), "pac-abc");
assert.deepEqual(
  storage.keys(),
  ["neuroped:focus-patient-id"],
  "apenas o identificador é persistido — nenhum nome, data ou CID",
);

let notified = 0;
const unsubscribe = subscribeFocusPatient(() => {
  notified += 1;
});
setFocusPatientId("pac-def");
assert.equal(notified, 1, "assinantes são avisados na troca de paciente");
assert.equal(getFocusPatientId(), "pac-def");

clearFocusPatient();
assert.equal(notified, 2, "limpar o foco também notifica");
assert.equal(getFocusPatientId(), null, "limpar remove o identificador");
assert.equal(storage.size, 0, "nada residual fica no sessionStorage");
unsubscribe();

setFocusPatientId("pac-ghi");
clearFocusPatient();
assert.equal(notified, 2, "após unsubscribe não há mais notificação");

// Contrato de código: quem encerra ou troca a sessão precisa limpar o foco.
const repoRoot = resolve(import.meta.dirname, "../..");
const authContext = readFileSync(resolve(repoRoot, "client/src/contexts/AuthContext.tsx"), "utf8");
const clinicContext = readFileSync(resolve(repoRoot, "client/src/contexts/ClinicContext.tsx"), "utf8");
assert.match(
  authContext,
  /clearFocusPatient\(\)/,
  "AuthContext precisa limpar o paciente em foco ao encerrar/trocar sessão",
);
assert.match(
  clinicContext,
  /clearFocusPatient\(\)/,
  "trocar de clínica precisa limpar o paciente em foco do tenant anterior",
);

console.log("[patient-focus] ✓ foco guarda só o id, notifica e morre com a sessão.");
