import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(
  new URL("../../functions/api/memory/search.ts", import.meta.url),
  "utf8",
);

assert.match(
  source,
  /const MEMORY_TABLE = "clinical_memory_notes_demo";/,
  "a busca deve ler da mesma tabela em que a API grava as notas",
);
assert.match(source, /FROM \$\{MEMORY_TABLE\} n/);
assert.doesNotMatch(
  source,
  /FROM memory_notes n\b/,
  "a busca não pode voltar para a tabela legada memory_notes",
);

console.log("✓ memory search usa a tabela clínica canônica");
