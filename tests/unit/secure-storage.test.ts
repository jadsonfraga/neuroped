import assert from "node:assert/strict";
import {
  secureClearAll,
  secureGet,
  secureSet,
} from "../../client/src/lib/secureStorage";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, String(value)); }
}

Object.defineProperty(globalThis, "localStorage", { value: new MemoryStorage(), configurable: true });
Object.defineProperty(globalThis, "sessionStorage", { value: new MemoryStorage(), configurable: true });

await secureSet("pre-consulta", { paciente: "Ana", queixa: "linguagem" });
const raw = localStorage.getItem("neuroped:secure:pre-consulta") ?? "";
assert.ok(raw.length > 0);
assert.equal(raw.includes("Ana"), false, "PII não pode aparecer em texto puro");
assert.deepEqual(await secureGet("pre-consulta"), { paciente: "Ana", queixa: "linguagem" });

localStorage.setItem("neuroped:secure:pre-retorno", raw);
assert.equal(await secureGet("pre-retorno"), null, "ciphertext não pode ser trocado entre chaves");

await secureSet("expirado", { paciente: "Bia" }, -1);
assert.equal(await secureGet("expirado"), null);

localStorage.setItem("neuroped:pre-consultas", JSON.stringify([{ paciente: "Legado" }]));
localStorage.setItem("neuroped:pre-retornos", JSON.stringify([{ paciente: "Legado" }]));
await secureClearAll();
assert.equal(localStorage.length, 0);
console.log("✓ rascunhos clínicos cifram, expiram e podem ser apagados");
