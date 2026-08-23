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
import {
  FILTER_SESSION_STATE_KEY,
  applyFilterSessionNavigationPrefill,
  clearFilterSessionState,
  loadFilterSessionState,
  parseFilterSessionState,
  saveFilterSessionState,
  type FilterSessionStorage,
} from "../../client/src/lib/filterSessionState";

class MemoryStorage implements FilterPreferenceStorage, FilterSessionStorage {
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

const sessionStorage = new MemoryStorage();
const sessionState = {
  search: "TDAH 7 anos",
  selectedAge: "6-12a",
  selectedQueixas: ["tdah", "sono"],
  selectedRespondente: "pais" as const,
  selectedCommunication: "verbal" as const,
  selectedLiteracy: "literate" as const,
  selectedAssessmentType: "diagnostic" as const,
  selectedSignalIds: ["desatencao", "impulsividade"],
};
saveFilterSessionState(sessionState, sessionStorage);
assert.deepEqual(loadFilterSessionState(sessionStorage), sessionState);
assert.ok(sessionStorage.getItem(FILTER_SESSION_STATE_KEY));

const navigationMerged = applyFilterSessionNavigationPrefill(
  {
    selectedAge: "2-4a",
    selectedQueixas: ["tea"],
  },
  sessionStorage,
);
assert.deepEqual(navigationMerged, {
  search: "TDAH 7 anos",
  selectedAge: "2-4a",
  selectedQueixas: ["tea"],
  selectedRespondente: "pais",
  selectedCommunication: "verbal",
  selectedLiteracy: "literate",
  selectedAssessmentType: "diagnostic",
  selectedSignalIds: [],
});
assert.deepEqual(loadFilterSessionState(sessionStorage), navigationMerged);

clearFilterSessionState(sessionStorage);
assert.equal(sessionStorage.getItem(FILTER_SESSION_STATE_KEY), null);

assert.deepEqual(
  parseFilterSessionState(
    JSON.stringify({
      search: "x".repeat(400),
      selectedAge: "6-12a",
      selectedQueixas: ["tdah", "tdah", 123, "sono"],
      selectedRespondente: "invalido",
      selectedCommunication: "verbal",
      selectedLiteracy: "invalido",
      selectedAssessmentType: "monitoring",
      selectedSignalIds: ["s1", "s1", null, "s2"],
    }),
  ),
  {
    search: "x".repeat(300),
    selectedAge: "6-12a",
    selectedQueixas: ["tdah", "sono"],
    selectedRespondente: null,
    selectedCommunication: "verbal",
    selectedLiteracy: null,
    selectedAssessmentType: "monitoring",
    selectedSignalIds: ["s1", "s2"],
  },
);

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
assert.match(filtro, /loadFilterSessionState/);
assert.match(filtro, /saveFilterSessionState\(\{/);
assert.match(filtro, /clearFilterSessionState\(\)/);
assert.doesNotMatch(filtro, /localStorage\.setItem\(FILTER_STATE_KEY/);
assert.match(fluxograma, /applyFilterSessionNavigationPrefill\(\{/);
assert.doesNotMatch(fluxograma, /filterPrefill/);
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
  "✓ filtro: disponibilidade persiste localmente; filtros clínicos sobrevivem apenas na sessão da aba e prefill preserva contexto",
);
