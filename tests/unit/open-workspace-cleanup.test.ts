import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

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

const localStorage = new MemoryStorage();
const storageListeners = new Set<(event: StorageEvent) => void>();
Object.defineProperty(globalThis, "window", {
  configurable: true,
  value: {
    localStorage,
    addEventListener(type: string, listener: (event: StorageEvent) => void) {
      if (type === "storage") storageListeners.add(listener);
    },
    removeEventListener(type: string, listener: (event: StorageEvent) => void) {
      if (type === "storage") storageListeners.delete(listener);
    },
  },
});

const {
  clearLegacyOpenWorkspace,
  subscribeToLegacyOpenWorkspaceClear,
} = await import("../../client/src/lib/openWorkspaceCleanup.ts");

localStorage.setItem("neuroped:open-workspace:v1", "conteudo-clinico-legado");
localStorage.setItem("neuroped:theme", "dark");
assert.equal(clearLegacyOpenWorkspace(), true);
assert.equal(localStorage.getItem("neuroped:open-workspace:v1"), null);
assert.equal(localStorage.getItem("neuroped:theme"), "dark");

let peerClearCount = 0;
const unsubscribe = subscribeToLegacyOpenWorkspaceClear(() => {
  peerClearCount += 1;
});
for (const listener of storageListeners) {
  listener({
    storageArea: localStorage,
    key: "neuroped:open-workspace-clear-generation:v1",
    oldValue: "geracao-a",
    newValue: "geracao-b",
  } as StorageEvent);
}
assert.equal(peerClearCount, 1);
unsubscribe();

const queryClient = readFileSync(
  new URL("../../client/src/lib/queryClient.ts", import.meta.url),
  "utf8",
);
assert.doesNotMatch(queryClient, /openAccessFetch|local-open/);

console.log(
  "✓ workspace aberto legado é removido sem preservar API clínica anônima",
);
