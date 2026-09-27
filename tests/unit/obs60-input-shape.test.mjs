import test from "node:test";
import assert from "node:assert/strict";
import { analyseVideo, parseInput } from "../../functions/api/integrations/obs60/_video.ts";
import { ITEM_IDS, validateAnalysis } from "../../shared/obs60.ts";

// Header-only and categorical fixtures. No real media, person or AI inference.
const data = Buffer.from([0,0,0,24,102,116,121,112,109,112,52,50,0,0,0,0,109,112,52,50,105,115,111,109]).toString("base64");
const input = mime => ({ ageMonths: 39, windowSeconds: 60, consent: true, mime, data });
function fixture(help) {
  return { observations: ITEM_IDS.map(id => ({
    id, event: id === "walk" ? "walked_no_visible_support" : "unassessable",
    start: id === "walk" ? 40 : null, end: id === "walk" ? 50 : null,
    opportunity: "clear", audioClear: true, viewClear: true, sequenceClear: true,
    childSpeakerClear: true, initiallyFacingAdult: false,
    help: id === "walk" ? help : "initial", transcript: "", reason: id === "walk" ? "none" : "uncertain",
  })) };
}

test("video MIME is a primitive string, never a coerced JSON array", () => {
  for (const mime of [["video/mp4"], [["video/mp4"]], ["video/webm"], null, 7, { type: "video/mp4" }]) {
    assert.throws(() => parseInput(input(mime)), error => error.code === "INVALID_MEDIA" && error.status === 415);
  }
  assert.equal(parseInput(input("video/mp4")).mime, "video/mp4");
});

test("coercible MIME cannot reach the video provider", async () => {
  const env = { OBS60_VIDEO_AI_ENABLED: "true", OBS60_PRIVACY_APPROVED: "true", OBS60_GEMINI_MODEL: "gemini-test-fixture", OBS60_GEMINI_API_KEY: "synthetic-test-key" };
  let calls = 0;
  await assert.rejects(() => analyseVideo(input(["video/mp4"]), env, async () => { calls++; throw new Error("must not send"); }), error => error.code === "INVALID_MEDIA");
  assert.equal(calls, 0);
});

test("assistance categories reject arrays instead of bypassing physical-help contradiction", () => {
  for (const help of [["physical"], [["physical"]], ["initial"], null, 7, { value: "physical" }]) {
    assert.throws(() => validateAnalysis(fixture(help), 39, 60), /Categoria da IA fora do contrato/);
  }
});

test("canonical physical help still blocks unsupported independence", () => {
  const walk = validateAnalysis(fixture("physical"), 39, 60).observations.find(row => row.id === "walk");
  assert.equal(walk.status, "not_assessable");
  assert.equal(walk.reason, "uncertain");
});

test("canonical initial proposal retains the valid bounded observation", () => {
  const walk = validateAnalysis(fixture("initial"), 39, 60).observations.find(row => row.id === "walk");
  assert.equal(walk.status, "demonstrated");
  assert.equal(walk.event, "walked_no_visible_support");
});
