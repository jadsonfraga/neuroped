import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync("client/src/components/ui/radio-group.tsx", "utf8");

assert.match(
  source,
  /const value = props\.value \?\? \(props\.defaultValue === undefined \? "" : undefined\);/,
  "RadioGroup deve transformar ausência de resposta em valor controlado vazio",
);
assert.match(
  source,
  /\{\.\.\.props\}[\s\S]*value=\{value\}/,
  "RadioGroup deve repassar o valor normalizado ao Radix",
);

console.log("✓ RadioGroup permanece controlado desde a primeira renderização");
