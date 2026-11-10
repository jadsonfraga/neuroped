import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const css = readFileSync("client/src/styles/renderizador.css", "utf8");

test("Renderizador usa tipografia incorporada e não depende de fontes externas", () => {
  assert.doesNotMatch(css, /@import\\s+url\\([^)]*fonts\\.(?:googleapis|gstatic)\\.com/i);
  assert.match(css, /@font-face[\\s\\S]*?font-family:\\s*PantCormorant[\\s\\S]*?src:\\s*url\\(data:font\\//i);
});
