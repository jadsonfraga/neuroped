// Contrato do exportador de auditoria de escalas (`scripts/audit-scales-export.mts`).
// Regressões cobertas: escalas publicadas e de outros catálogos saíam como
// "(sem metadados) <id>" com faixa etária "?", e itens-objeto { text, emoji?, ... }
// saíam como "[object Object]". O export roda num diretório temporário: não toca
// em docs/audit.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { interactiveScaleItems } from "../../client/src/data/interactiveScaleItems.ts";

const SCRIPT = "scripts/audit-scales-export.mts";
const FILES = ["escalas-autorais-auditoria.md", "escalas-autorais-itens.csv", "escalas-autorais-faixas.csv"];

test("export: toda escala com itens tem metadados, faixa etária e texto de item; sai com código 0", () => {
  const out = mkdtempSync(join(tmpdir(), "audit-scales-export-"));
  try {
    const run = spawnSync(process.execPath, ["--import", "tsx", SCRIPT], {
      encoding: "utf8",
      env: { ...process.env, AUDIT_SCALES_OUT_DIR: out },
    });
    assert.equal(run.status, 0, `export falhou:\n${run.stdout}\n${run.stderr}`);
    assert.doesNotMatch(run.stdout, /SEM metadados/);
    const text = Object.fromEntries(FILES.map((name) => [name, readFileSync(join(out, name), "utf8")]));
    for (const [name, content] of Object.entries(text)) {
      assert.doesNotMatch(content, /\(sem metadados\)/, `${name}: escala sem metadados`);
      assert.doesNotMatch(content, /\[object Object\]/, `${name}: item exportado como objeto`);
    }
    const ids = Object.keys(interactiveScaleItems).sort();
    const mdIds = [...text["escalas-autorais-auditoria.md"].matchAll(/^## (\S+) — /gm)].map((m) => m[1]).sort();
    assert.deepEqual(mdIds, ids, "uma seção por escala com itens interativos, sem duplicar");
    // Terceira coluna (faixa_idade) "?" = metadado ausente; o nome pode vir entre aspas.
    assert.doesNotMatch(text["escalas-autorais-itens.csv"], /^[^;\n]*;(?:"(?:[^"]|"")*"|[^;\n]*);\?;/m, "faixa etária desconhecida no CSV de itens");
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});

test("export: metadado ausente faz o comando falhar, em vez de só avisar", () => {
  const source = readFileSync(SCRIPT, "utf8");
  assert.match(source, /if \(semMeta\) process\.exitCode = 1;/);
});
