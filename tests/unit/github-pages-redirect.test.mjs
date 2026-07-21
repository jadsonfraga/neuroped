import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

class MemoryStorage {
  constructor(entries) {
    this.values = new Map(entries);
  }

  get length() {
    return this.values.size;
  }

  key(index) {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key) {
    this.values.delete(key);
  }
}

const localStorage = new MemoryStorage([
  ["neuroped:pre-consultas", "legado"],
  ["np_filtro_state_v1", "legado"],
  ["outro-app", "preservar"],
]);
const sessionStorage = new MemoryStorage([
  ["neuroped:access", "token"],
  ["outro-app", "preservar"],
]);
const deletedCaches = [];
const deletedDatabases = [];
const redirects = [];
let neuropedWorkerRemoved = false;
let unrelatedWorkerRemoved = false;

const window = {
  localStorage,
  sessionStorage,
  location: {
    hash: "#/filtro",
    replace(destination) {
      redirects.push(destination);
    },
  },
  caches: {
    async keys() {
      return ["neuroped-old", "outro-cache"];
    },
    async delete(key) {
      deletedCaches.push(key);
      return true;
    },
  },
  indexedDB: {
    deleteDatabase(name) {
      deletedDatabases.push(name);
      const request = {};
      queueMicrotask(() => request.onsuccess?.());
      return request;
    },
  },
  setTimeout() {
    return 1;
  },
};

const navigator = {
  serviceWorker: {
    async getRegistrations() {
      return [
        {
          scope: "https://jadsonfraga.github.io/neuroped/",
          async unregister() {
            neuropedWorkerRemoved = true;
            return true;
          },
        },
        {
          scope: "https://jadsonfraga.github.io/outro/",
          async unregister() {
            unrelatedWorkerRemoved = true;
            return true;
          },
        },
      ];
    },
  },
};

const source = readFileSync(
  new URL("../../github-pages-redirect/redirect.js", import.meta.url),
  "utf8",
);
vm.runInNewContext(source, {
  Promise,
  URL,
  navigator,
  queueMicrotask,
  window,
});
await new Promise((resolve) => setImmediate(resolve));

assert.equal(localStorage.values.has("neuroped:pre-consultas"), false);
assert.equal(localStorage.values.has("np_filtro_state_v1"), false);
assert.equal(localStorage.values.get("outro-app"), "preservar");
assert.equal(sessionStorage.values.has("neuroped:access"), false);
assert.equal(sessionStorage.values.get("outro-app"), "preservar");
assert.deepEqual(deletedCaches, ["neuroped-old"]);
assert.deepEqual(deletedDatabases, ["neuroped-icp"]);
assert.equal(neuropedWorkerRemoved, true);
assert.equal(unrelatedWorkerRemoved, false);
assert.equal(redirects.at(-1), "https://neuroped.pages.dev#/filtro");

console.log("✓ GitHub Pages limpa somente estado NeuroPed e redireciona ao canônico");
