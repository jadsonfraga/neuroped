import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const workflow = readFileSync(new URL("../../.github/workflows/filter-spiral.yml", import.meta.url), "utf8");
for (const command of [
  "npm run test:filter",
  "npm run test:podium",
  "npm run test:ideal-choice",
  "npm run test:practical-filter",
]) {
  assert.match(workflow, new RegExp(command.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `${command} precisa executar no workflow do filtro`);
}

console.log("✓ workflow do filtro executa toda a suíte crítica do pódio");
