import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const about = readFileSync("client/src/pages/sobre.tsx", "utf8");
for (const literal of [
  "CRM-PE", "25227", "17756", "33.158.207/0001-48",
  "(87) 9 9109-7371", "(87) 9 9105-5790",
  "drjadsonfraga@proton.me", "@drjadsonfraganeuroped",
  "tel:+5587991097371", "https://wa.me/5587991055790",
]) assert.ok(about.includes(literal), "dados públicos devem ser visíveis: " + literal);
console.log("✓ Identificação e contatos institucionais explícitos na página Sobre");
