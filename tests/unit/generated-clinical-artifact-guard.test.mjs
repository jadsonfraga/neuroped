import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const guardPath = resolve(
  process.cwd(),
  "scripts/guards/check-generated-clinical-artifacts.mjs",
);
const source = readFileSync(guardPath, "utf8");

assert.match(
  source,
  /finally\s*\{[\s\S]*?readFileSync\(caminho, "utf8"\)[\s\S]*?writeFileSync\(caminho, antes, "utf8"\)/,
  "o guard deve restaurar o artefato em finally, inclusive quando o gerador falha",
);

assert.match(
  source,
  /if \(geradorFalhou \|\| depois === undefined\) continue;/,
  "o guard deve abortar a comparação normal após falha do gerador sem mascarar a falha",
);

const execIndex = source.indexOf("execFileSync(cmd, args");
const finallyIndex = source.indexOf("finally {");
const restoreIndex = source.indexOf('writeFileSync(caminho, antes, "utf8")');
assert.ok(execIndex >= 0 && finallyIndex > execIndex && restoreIndex > finallyIndex);

console.log("✓ guard de artefatos clínicos restaura o arquivo também no caminho de erro");
