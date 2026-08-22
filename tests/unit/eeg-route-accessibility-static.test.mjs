import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../..", import.meta.url);
const source = await readFile(new URL("client/src/pages/eletroencefalograma.tsx", root), "utf8");
const app = await readFile(new URL("client/src/App.tsx", root), "utf8");

test("EEG stays in an accessible internal handoff instead of auto-redirecting", () => {
  assert.doesNotMatch(source, /window\.location\.assign\(VIDEO_EEG_URL\)/);
  assert.match(source, /<main /);
  assert.match(source, /<h1 /);
  assert.match(source, /href="#\/agendar"/);
  assert.match(source, /href="#\/marcacao"/);
  assert.match(source, /sem redirecionamento/);
  assert.ok(app.includes('if (location === "/eletroencefalograma")'));
  assert.match(app, /<RouteGuard>[\s\S]*?<Route path="\/eletroencefalograma" component=\{EletroencefalogramaPage\}/);
});
