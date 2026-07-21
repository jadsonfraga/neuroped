import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

class MemoryStorage implements Storage {
  protected values = new Map<string, string>();

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

class RejectingRemovalStorage extends MemoryStorage {
  override removeItem(): void {
    throw new DOMException("Storage indisponível", "SecurityError");
  }
}

let activeStorage: Storage = new MemoryStorage();
Object.defineProperty(globalThis, "window", {
  configurable: true,
  value: {
    get localStorage() {
      return activeStorage;
    },
    location: { origin: "https://neuroped.pages.dev" },
  },
});

const { clearOpenAccessWorkspace, openAccessFetch } = await import(
  "../../client/src/lib/openAccessApi.ts"
);

activeStorage.setItem("neuroped:theme", "dark");

const patientResponse = await openAccessFetch("/api/patients", {
  method: "POST",
  body: JSON.stringify({ name: "case_ref-001" }),
});
assert.equal(patientResponse?.status, 201);
const patient = (await patientResponse?.json()) as { id: string };

const resultResponse = await openAccessFetch("/api/results", {
  method: "POST",
  body: JSON.stringify({
    patientId: patient.id,
    scaleName: "sentinela",
    responses: [{ question: "item", answer: "resposta" }],
  }),
});
assert.equal(resultResponse?.status, 201);

const beforeClear = await openAccessFetch("/api/patients");
assert.equal(((await beforeClear?.json()) as unknown[]).length, 1);
assert.equal(clearOpenAccessWorkspace(), true);
assert.equal(activeStorage.getItem("neuroped:theme"), "dark");

const patientsAfterClear = await openAccessFetch("/api/patients");
const resultsAfterClear = await openAccessFetch("/api/results");
assert.deepEqual(await patientsAfterClear?.json(), []);
assert.deepEqual(await resultsAfterClear?.json(), []);

activeStorage = new RejectingRemovalStorage();
activeStorage.setItem("neuroped:open-workspace:v1", "preservar");
assert.equal(
  clearOpenAccessWorkspace(),
  false,
  "falha de remoção não pode anunciar limpeza bem-sucedida",
);

const layoutSource = readFileSync(
  new URL("../../client/src/components/Layout.tsx", import.meta.url),
  "utf8",
);
const authSource = readFileSync(
  new URL("../../client/src/contexts/AuthContext.tsx", import.meta.url),
  "utf8",
);
assert.match(layoutSource, /button-clear-local-data/);
assert.match(layoutSource, /clearOpenAccessWorkspace/);
assert.doesNotMatch(authSource, /button-local-lock.*display:\s*none/s);

console.log("✓ workspace aberto persiste, limpa dados clínicos e preserva preferências");
