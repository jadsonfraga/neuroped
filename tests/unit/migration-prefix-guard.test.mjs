// @ts-check
/**
 * TRAVA DE COLISÃO DE PREFIXO DE MIGRAÇÃO (gate de governança, 03/09/2026).
 *
 * PRs concorrentes já reutilizaram o mesmo prefixo NNNN para migrações
 * diferentes (caso #770 × #771 com "0019"). Como as migrações são aplicadas
 * por workflows independentes com `--file=`, dois arquivos com o mesmo
 * prefixo não falham em runtime — divergem silenciosamente entre ambientes.
 *
 * Este guard falha o CI quando:
 *  - um prefixo NNNN aparece em mais de um arquivo (exceto o legado congelado);
 *  - um arquivo foge do formato NNNN_snake_case.sql;
 *  - um prefixo novo não é o sucessor do maior existente (força rebase da
 *    numeração em PRs concorrentes em vez de colidir na main).
 */
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";

// Exceção histórica já presente na main antes deste guard; congelada — nunca
// adicionar novos itens aqui para "passar" o CI.
const FROZEN_LEGACY_DUPLICATE_PREFIXES = new Set(["0008"]);

const files = readdirSync("db/migrations").filter((name) => name.endsWith(".sql")).sort();
assert.ok(files.length > 0, "db/migrations não pode estar vazio");

const byPrefix = new Map();
for (const file of files) {
  const match = /^(\d{4})_[a-z0-9_]+\.sql$/.exec(file);
  assert.ok(match, `Migração fora do formato NNNN_snake_case.sql: ${file}`);
  const prefix = match[1];
  const bucket = byPrefix.get(prefix) ?? [];
  bucket.push(file);
  byPrefix.set(prefix, bucket);
}

for (const [prefix, bucket] of byPrefix) {
  if (bucket.length > 1 && !FROZEN_LEGACY_DUPLICATE_PREFIXES.has(prefix)) {
    assert.fail(
      `Prefixo de migração ${prefix} colidiu entre: ${bucket.join(", ")}. ` +
        "Renumere a migração mais nova para o sucessor do maior prefixo da main.",
    );
  }
}

// Sem buracos acima do último prefixo conhecido: um PR que pula números
// esconde exatamente o tipo de colisão futura que este guard existe para
// impedir (dois PRs 'reservando' números diferentes à frente).
const prefixes = [...byPrefix.keys()].map(Number).sort((a, b) => a - b);
const highest = prefixes[prefixes.length - 1];
for (let expected = prefixes[0]; expected <= highest; expected += 1) {
  assert.ok(
    byPrefix.has(String(expected).padStart(4, "0")),
    `Sequência de migrações tem buraco no prefixo ${String(expected).padStart(4, "0")} (maior = ${highest}).`,
  );
}

console.log(
  `[migration-prefix] ✓ ${files.length} migrações com prefixos únicos e sequência contígua até ${String(highest).padStart(4, "0")} (legado congelado: ${[...FROZEN_LEGACY_DUPLICATE_PREFIXES].join(", ")}).`,
);
