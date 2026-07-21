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
const storageListeners = new Set<(event: StorageEvent) => void>();
Object.defineProperty(globalThis, "window", {
  configurable: true,
  value: {
    get localStorage() {
      return activeStorage;
    },
    location: { origin: "https://neuroped.pages.dev" },
    addEventListener(type: string, listener: (event: StorageEvent) => void) {
      if (type === "storage") storageListeners.add(listener);
    },
    removeEventListener(type: string, listener: (event: StorageEvent) => void) {
      if (type === "storage") storageListeners.delete(listener);
    },
  },
});

const {
  clearOpenAccessWorkspace,
  openAccessFetch,
  subscribeToOpenAccessWorkspaceClear,
} = await import(
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

let peerClearCount = 0;
const unsubscribe = subscribeToOpenAccessWorkspaceClear(() => {
  peerClearCount += 1;
});
for (const listener of storageListeners) {
  listener({
    storageArea: activeStorage,
    key: "neuroped:theme",
    oldValue: "dark",
    newValue: null,
  } as StorageEvent);
  listener({
    storageArea: activeStorage,
    key: "neuroped:open-workspace:v1",
    oldValue: "anterior",
    newValue: "atualizado",
  } as StorageEvent);
  listener({
    storageArea: activeStorage,
    key: "neuroped:open-workspace-clear-generation:v1",
    oldValue: "geracao-a",
    newValue: "geracao-b",
  } as StorageEvent);
  listener({
    storageArea: activeStorage,
    key: "neuroped:open-workspace:v1",
    oldValue: "anterior",
    newValue: null,
  } as StorageEvent);
}
assert.equal(peerClearCount, 1, "a remoção deve limpar também as outras abas");
unsubscribe();
assert.equal(storageListeners.size, 0);

const staleWrite = await openAccessFetch("/api/patients", {
  method: "POST",
  body: JSON.stringify({ name: "case_ref-stale" }),
});
assert.equal(staleWrite?.status, 507, "uma aba antiga não pode recriar o workspace apagado");
assert.equal(activeStorage.getItem("neuroped:open-workspace:v1"), null);

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
assert.match(layoutSource, /subscribeToOpenAccessWorkspaceClear/);
assert.match(layoutSource, /document\.body\.style\.visibility = "hidden"/);
assert.doesNotMatch(authSource, /button-local-lock.*display:\s*none/s);

console.log("✓ workspace aberto limpa dados clínicos em todas as abas e preserva preferências");
