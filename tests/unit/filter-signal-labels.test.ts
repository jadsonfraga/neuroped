import { test } from "node:test";
import assert from "node:assert/strict";
import { getFilterSignalLabels, getOrphanFilterSignalIds } from "../../client/src/data/filterSignalState.ts";
import { getAllSignalsForQueixa } from "../../client/src/data/signalsAndSymptoms.ts";
import { getPopularSymptoms } from "../../client/src/data/popularSymptoms.ts";

test("popular symptoms are labeled by the same source used for validation", () => {
  const popular = getPopularSymptoms("tea");
  assert.ok(popular.length > 0);
  assert.deepEqual(getFilterSignalLabels(["tea"], [popular[0].id]), [popular[0].label]);
  assert.deepEqual(getOrphanFilterSignalIds(["tea"], [popular[0].id]), []);
});

test("detailed signals and popular symptoms do not leak orphan selections", () => {
  const detail = getAllSignalsForQueixa("tea")[0];
  const popular = getPopularSymptoms("tea")[0];
  assert.ok(detail && popular);
  assert.deepEqual(getFilterSignalLabels(["tea"], [popular.id, detail.id, "tdah-nao-para-quieto"]), [detail.label, popular.label]);
  assert.deepEqual(getOrphanFilterSignalIds(["tea"], ["tdah-nao-para-quieto"]), ["tdah-nao-para-quieto"]);
});

test("repeated signal identifiers receive only one label", () => {
  const symptom = getPopularSymptoms("tdah")[0];
  assert.ok(symptom);
  assert.deepEqual(getFilterSignalLabels(["tdah"], [symptom.id, symptom.id]), [symptom.label]);
});
