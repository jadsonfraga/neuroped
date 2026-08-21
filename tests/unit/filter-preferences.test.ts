import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  FILTER_PREFERENCES_KEY,
  LEGACY_FILTER_STATE_KEY,
  loadFilterPreferences,
  saveFilterPreferences,
  type FilterPreferenceStorage,
} from "../../client/src/lib/filterPreferences";

class MemoryStorage implements FilterPreferenceStorage {
  readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

const storage = new MemoryStorage();
storage.setItem(
  LEGACY_FILTER_STATE_KEY,
  JSON.stringify({
    availability: "all",
    search: "ideação suicida",
    age: "6-12",
    queixas: ["humor"],
    signals: ["autoagressao"],
    respondente: "pais",
    communication: "verbal",
    literacy: "literate",
    assessment: "diagnostic",
  }),
);

assert.deepEqual(loadFilterPreferences(storage), { availability: "all" });
assert.equal(storage.getItem(LEGACY_FILTER_STATE_KEY), null);
assert.deepEqual(JSON.parse(storage.getItem(FILTER_PREFERENCES_KEY) ?? "{}"), {
  availability: "all",
});

storage.setItem(
  FILTER_PREFERENCES_KEY,
  JSON.stringify({
    availability: "all",
    search: "não deve sobreviver",
    age: "2-4",
    queixas: ["tea"],
  }),
);
assert.deepEqual(loadFilterPreferences(storage), { availability: "all" });
assert.deepEqual(JSON.parse(storage.getItem(FILTER_PREFERENCES_KEY) ?? "{}"), {
  availability: "all",
});

saveFilterPreferences("complete", storage);
assert.deepEqual(JSON.parse(storage.getItem(FILTER_PREFERENCES_KEY) ?? "{}"), {
  availability: "complete",
});

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const filtro = [
  readFileSync(resolve(root, "client/src/pages/filtro.tsx"), "utf8"),
  readFileSync(resolve(root, "client/src/pages/filtro-engine.tsx"), "utf8"),
].join("\n");
const fluxograma = readFileSync(
  resolve(root, "client/src/pages/fluxograma.tsx"),
  "utf8",
);
const main = readFileSync(resolve(root, "client/src/main.tsx"), "utf8");

assert.match(filtro, /saveFilterPreferences\(availabilityMode\)/);
assert.doesNotMatch(filtro, /localStorage\.setItem\(FILTER_STATE_KEY/);
assert.doesNotMatch(fluxograma, /localStorage\.(?:getItem|setItem)/);
assert.equal(
  (main.match(/localStorage\.removeItem\("np_filtro_state_v1"\)/g) ?? [])
    .length,
  1,
  "startup deve eliminar o payload legado uma única vez",
);
assert.doesNotMatch(
  main,
  /advancedFilterLogic|expandedScales|clinicalScales|scaleCatalog/i,
  "sanitização de startup não deve carregar catálogos clínicos",
);

console.log(
  "✓ filtro: somente disponibilidade não clínica persiste; contexto clínico é descartado",
);
