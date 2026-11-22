// Guarda dos exportadores de documentação de escalas (só leitura do código).
// Roda cada exportador num diretório temporário — o repositório não é tocado —
// e falha se a saída voltar a ter "[object Object]" (item em formato objeto
// impresso sem .text) ou "(sem metadados)" (escala fora do mapa de metadados).
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { interactiveScaleItems } from "../../client/src/data/interactiveScaleItems.ts";
import { interactiveScales } from "../../client/src/data/interactiveScales.ts";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const tsxLoader = pathToFileURL(
  createRequire(import.meta.url).resolve("tsx"),
).href;

// Contagens declaradas nos dados: o export de auditoria tem de mostrá-las, não omiti-las.
const allItems = Object.values(interactiveScaleItems).flatMap((def) => def.domains.flatMap((d) => d.items));
const declared = {
  invertido: allItems.filter((i) => typeof i !== "string" && i.responseType !== "text" && i.reversed).length,
  livre: allItems.filter((i) => typeof i !== "string" && i.responseType === "text").length,
  sentinela: allItems.filter((i) => typeof i !== "string" && i.responseType !== "text" && i.sentinel).length,
};

const exporters = [
  {
    script: "scripts/audit-scales-export.mts",
    outDir: "docs/audit",
    minFiles: 3,
    // Uma seção "## <id> — " por escala com itens interativos: nenhuma omitida nem duplicada.
    sections: {
      file: "escalas-autorais-auditoria.md",
      // Inclui as escalas do motor runner (interactiveScales) sem definição em interactiveScaleItems.
      ids: [
        ...new Set([
          ...Object.keys(interactiveScaleItems),
          ...Object.keys(interactiveScales),
        ]),
      ].sort(),
    },
    // Fidelidade: marcadores de item e direção do escore vêm da definição, nunca de um texto fixo.
    fidelity: true,
  },
  {
    script: "scripts/extract-escalas-completas.mts",
    outDir: "docs/escalas",
    minFiles: 2,
  },
];

for (const { script, outDir, minFiles, sections, fidelity } of exporters) {
  const work = mkdtempSync(join(tmpdir(), "np-scale-export-"));
  try {
    const run = spawnSync(
      process.execPath,
      ["--import", tsxLoader, resolve(repoRoot, script)],
      {
        cwd: work,
        encoding: "utf8",
        // O alias "@/..." vem do tsconfig da raiz; fora dela o tsx precisa ser apontado para ele.
        env: {
          ...process.env,
          TSX_TSCONFIG_PATH: resolve(repoRoot, "tsconfig.json"),
        },
      },
    );
    assert.equal(
      run.status,
      0,
      `${script} terminou com ${run.status}:\n${run.stderr}`,
    );
    const files = readdirSync(join(work, outDir));
    assert.ok(
      files.length >= minFiles,
      `${script}: esperava ${minFiles}+ arquivos, gerou ${files.length}`,
    );
    for (const f of files) {
      const text = readFileSync(join(work, outDir, f), "utf8");
      assert.ok(
        !text.includes("[object Object]"),
        `${script} → ${f}: contém "[object Object]"`,
      );
      assert.ok(
        !text.includes("(sem metadados)"),
        `${script} → ${f}: contém "(sem metadados)"`,
      );
    }
    if (sections) {
      const got = [
        ...readFileSync(join(work, outDir, sections.file), "utf8").matchAll(
          /^## (\S+) — /gm,
        ),
      ]
        .map((m) => m[1])
        .sort();
      assert.deepEqual(
        got,
        sections.ids,
        `${script} → ${sections.file}: seções diferentes das ${sections.ids.length} escalas com itens interativos`,
      );
    }
    if (fidelity) {
      // Só as linhas de item ("N. texto — marcadores"); a legenda do cabeçalho não conta.
      const itemLines = readFileSync(join(work, outDir, "escalas-autorais-auditoria.md"), "utf8")
        .split("\n")
        .filter((line) => /^\d+\. /.test(line));
      const count = (needle) => itemLines.filter((line) => line.includes(needle)).length;
      assert.equal(count("_invertido_"), declared.invertido, `${script}: itens invertidos no export ≠ declarados`);
      assert.equal(count("_resposta livre_"), declared.livre, `${script}: itens de resposta livre no export ≠ declarados`);
      assert.equal(count("_sentinela: "), declared.sentinela, `${script}: itens sentinela no export ≠ declarados`);
      const faixas = readFileSync(join(work, outDir, "escalas-autorais-faixas.csv"), "utf8");
      assert.ok(!faixas.includes("maior=melhor/intenso"), `${script}: direção do escore fixa em vez da declarada`);
      assert.match(faixas.split("\n")[0], /direcao_escore;interpretacao;minPct/, `${script}: cabeçalho das faixas sem direção/interpretação`);
    }
    console.log(
      `✓ ${script}: ${files.length} arquivo(s) sem "[object Object]" nem "(sem metadados)"`,
    );
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}
