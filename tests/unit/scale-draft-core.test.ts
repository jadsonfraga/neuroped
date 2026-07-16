import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { normalizeScaleDraftAnswers } from "../../client/src/hooks/useSecureScaleDraft";
import {
  clearScaleDraft,
  createScaleDraftEnvelope,
  indexedAllowedValues,
  indexedKeys,
  persistScaleDraft,
  restoreScaleDraft,
  sanitizeBooleanRecord,
  sanitizeNumberRecord,
  type ScaleDraftEnvelope,
  type ScaleDraftStore,
} from "../../client/src/lib/scaleDraftCore";

const validOptions = { "0": 3, "1": 2, "2": 4 };

assert.deepEqual(
  normalizeScaleDraftAnswers(
    {
      "0": 2,
      "1": 1,
      "2": 4,
      orphan: 0,
      injected: "1",
    },
    validOptions,
  ),
  { "0": 2, "1": 1 },
  "deve manter apenas itens existentes e alternativas dentro da faixa",
);

assert.deepEqual(normalizeScaleDraftAnswers(null, validOptions), {});
assert.deepEqual(normalizeScaleDraftAnswers([], validOptions), {});
assert.deepEqual(
  normalizeScaleDraftAnswers({ "0": -1, "1": 1.5 }, validOptions),
  {},
);

const booleanKeys = indexedKeys(3);
assert.deepEqual(
  sanitizeBooleanRecord(
    { 0: true, 1: false, 2: "false", 3: true, injected: true },
    booleanKeys,
  ),
  { 0: true, 1: false },
  "booleanos não podem ser coagidos nem aceitar perguntas órfãs",
);

const numberValues = indexedAllowedValues(2, 3);
assert.deepEqual(
  sanitizeNumberRecord({ 0: 2, 1: 3, 2: 0, injected: 1 }, numberValues),
  { 0: 2 },
  "números devem pertencer às alternativas explícitas de cada item",
);

class MemoryDraftStore implements ScaleDraftStore {
  values = new Map<string, ScaleDraftEnvelope>();
  async get(key: string) {
    return this.values.get(key) ?? null;
  }
  async set(key: string, value: ScaleDraftEnvelope) {
    this.values.set(key, structuredClone(value));
    return true;
  }
  async clear(key: string) {
    this.values.delete(key);
  }
}

interface MixedDraft {
  accepted: boolean;
  severity: number;
  note: string;
  tags: string[];
  answers: Record<number, boolean>;
}

const emptyMixedDraft = (): MixedDraft => ({
  accepted: false,
  severity: 0,
  note: "",
  tags: [],
  answers: {},
});

function sanitizeMixedDraft(value: unknown): MixedDraft {
  const source =
    value !== null && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<MixedDraft>)
      : {};
  return {
    accepted: source.accepted === true,
    severity:
      typeof source.severity === "number" &&
      Number.isInteger(source.severity) &&
      source.severity >= 0 &&
      source.severity <= 5
        ? source.severity
        : 0,
    note: typeof source.note === "string" ? source.note.slice(0, 200) : "",
    tags: Array.isArray(source.tags)
      ? source.tags
          .filter((tag): tag is string => typeof tag === "string")
          .slice(0, 5)
      : [],
    answers: sanitizeBooleanRecord(source.answers, indexedKeys(2)),
  };
}

const hasMixedContent = (value: MixedDraft) =>
  value.accepted ||
  value.severity > 0 ||
  value.note.length > 0 ||
  value.tags.length > 0 ||
  Object.keys(value.answers).length > 0;

const store = new MemoryDraftStore();
const storageKey = "scale-draft:test:mixed";
await persistScaleDraft({
  store,
  storageKey,
  schemaVersion: 7,
  value: {
    accepted: true,
    severity: 4,
    note: "observação",
    tags: ["motor", "vocal", 42] as unknown as string[],
    answers: { 0: false, 99: true },
  },
  sanitize: sanitizeMixedDraft,
  hasContent: hasMixedContent,
});

const restored = await restoreScaleDraft({
  store,
  storageKey,
  schemaVersion: 7,
  sanitize: sanitizeMixedDraft,
  hasContent: hasMixedContent,
  createEmpty: emptyMixedDraft,
});
assert.equal(restored.restored, true);
assert.deepEqual(restored.value, {
  accepted: true,
  severity: 4,
  note: "observação",
  tags: ["motor", "vocal"],
  answers: { 0: false },
});

store.values.set(
  "wrong-version",
  createScaleDraftEnvelope(6, { accepted: true }),
);
assert.deepEqual(
  await restoreScaleDraft({
    store,
    storageKey: "wrong-version",
    schemaVersion: 7,
    sanitize: sanitizeMixedDraft,
    hasContent: hasMixedContent,
    createEmpty: emptyMixedDraft,
  }),
  { value: emptyMixedDraft(), restored: false },
  "versões incompatíveis não podem ser restauradas",
);

await clearScaleDraft(store, storageKey);
assert.equal(await store.get(storageKey), null, "clear remove o rascunho");

const requiredPages = [
  "pant",
  "mchat",
  "cars",
  "snap",
  "sdq",
  "scared",
  "conners",
  "cdi2",
  "phqa",
  "cssrs",
  "crafft",
  "ygtss",
];
const repoRoot = fileURLToPath(new URL("../../", import.meta.url));
for (const page of requiredPages) {
  const source = readFileSync(
    `${repoRoot}client/src/pages/${page}.tsx`,
    "utf8",
  );
  assert.match(source, /useSecureTypedScaleDraft/, `${page}: hook cifrado`);
  assert.match(source, /schemaVersion:\s*1/, `${page}: schema versionado`);
  assert.match(source, /sanitize:/, `${page}: sanitização explícita`);
  assert.match(source, /draftReady/, `${page}: bloqueio durante restore`);
  assert.match(source, /clearDraft/, `${page}: limpeza explícita`);
}

console.log(
  "✓ rascunhos tipados normalizam, restauram, apagam e cobrem 12 escalas dedicadas",
);
