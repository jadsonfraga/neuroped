import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const repo = process.cwd();
const kidsStyles = readFileSync(
  resolve(repo, "client/src/styles/brincando.css"),
  "utf8",
);

assert.doesNotMatch(
  kidsStyles,
  /@import\s+url\s*\(\s*["']https?:\/\//i,
  "a rota infantil não pode depender de @import CSS remoto para montar offline",
);

console.log("✓ CSS da experiência infantil não depende de import remoto");
