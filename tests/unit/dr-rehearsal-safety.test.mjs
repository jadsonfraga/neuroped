/**
 * Trava de segurança do ensaio de DR.
 *
 * O workflow `dr-mechanism-rehearsal.yml` cria e DESTRÓI um banco D1. O modo
 * de falha que este teste impede não é o workflow quebrar — é ele funcionar
 * apontando para o lugar errado. Um `d1 delete` no alvo errado não tem undo.
 *
 * Invariantes travadas aqui:
 *   1. nunca dispara sozinho (sem `schedule`, sem `push`) — só por acionamento
 *      humano com confirmação digitada;
 *   2. todo comando de mutação usa o alvo derivado, nunca o nome de produção
 *      literal;
 *   3. o destroy reconfere a marca `dr-rehearsal` antes de executar;
 *   4. produção não aparece em nenhum comando wrangler.
 *
 * Rodar: node tests/unit/dr-rehearsal-safety.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { execFileSync } from "node:child_process";
import { writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const workflow = readFileSync(
  join(repoRoot, ".github", "workflows", "dr-mechanism-rehearsal.yml"),
  "utf8",
);

const triggerBlock = workflow.split(/^jobs:/m)[0] ?? "";

// 1) Só acionamento humano.
assert.match(triggerBlock, /workflow_dispatch:/, "o ensaio precisa ser acionável manualmente");
assert.doesNotMatch(
  triggerBlock,
  /^\s*schedule:/m,
  "o ensaio NUNCA pode rodar em agenda — cria e destrói banco",
);
assert.doesNotMatch(
  triggerBlock,
  /^\s*push:/m,
  "o ensaio NUNCA pode rodar em push",
);
assert.match(
  workflow,
  /inputs\.confirmar \}\}" != "ENSAIAR"/,
  "o ensaio precisa exigir confirmação digitada antes de qualquer passo",
);

// 2) e 4) Nenhum comando wrangler pode nomear produção.
const producao = /neuroped-db/;
for (const line of workflow.split("\n")) {
  if (!/wrangler@4 d1/.test(line)) continue;
  assert.doesNotMatch(
    line,
    producao,
    `comando wrangler nomeando produção: ${line.trim()}`,
  );
}

// 3) O destroy reconfere a marca antes de rodar.
const destroyIndex = workflow.indexOf("d1 delete");
assert.ok(destroyIndex > 0, "o ensaio precisa destruir o alvo temporário");
const destroyStep = workflow.slice(
  workflow.lastIndexOf("      - name:", destroyIndex),
  destroyIndex,
);
assert.match(
  destroyStep,
  /\*dr-rehearsal\*\)/,
  "o destroy precisa reconferir a marca dr-rehearsal antes de executar",
);
assert.match(
  destroyStep,
  /Recusando destruir produção/,
  "o destroy precisa recusar explicitamente o banco de produção",
);
assert.match(
  destroyStep,
  /if: always\(\)/,
  "o destroy precisa rodar mesmo quando um passo anterior falha — alvo órfão custa dinheiro",
);

// 4.5) A extração do bookmark roda contra a saída REAL do wrangler.
//
// O ensaio de 05/09 falhou aqui, e falhou silencioso do ponto de vista do
// autor: a regex `[0-9a-f]{16,}-[0-9a-f-]+` parecia certa, mas exigia 16+ hex
// no PRIMEIRO grupo, e o formato real começa com 8. Um ensaio de DR que não
// consegue ler o próprio ponto de restauração não ensaia nada — e a única
// forma de provar que a leitura funciona é exercitá-la sobre o texto que o
// wrangler de fato imprime, extraído do próprio workflow para que teste e
// workflow não possam divergir.
{
  const linhaExtracao = workflow
    .split("\n")
    .find((linha) => linha.includes("BOOKMARK=$("));
  assert.ok(linhaExtracao, "o workflow precisa extrair o bookmark em uma linha própria");

  // Saída real do `wrangler d1 time-travel info`, copiada do run 33999372591.
  const saidaReal = [
    " ⛅️ wrangler 4.129.0",
    "────────────────────",
    "Resource location: remote ",
    "",
    "🚧 Time Traveling...",
    "⚠️ The current bookmark is '00000002-000000a0-000050dd-bd03473216fd82dca4e0ded3b39c4c5a'",
    "⚡️ To restore to this specific bookmark, run:",
    " `wrangler d1 time-travel restore alvo --bookmark=00000002-000000a0-000050dd-bd03473216fd82dca4e0ded3b39c4c5a`",
  ].join("\n");

  const extrair = (texto) => {
    const arquivo = join(tmpdir(), `dr-bookmark-${randomUUID()}.txt`);
    writeFileSync(arquivo, `${texto}\n`);
    try {
      return execFileSync(
        "bash",
        ["-c", `${linhaExtracao.trim().replace("/tmp/b1.txt", arquivo)}\nprintf '%s' "$BOOKMARK"`],
        { encoding: "utf8" },
      );
    } finally {
      rmSync(arquivo, { force: true });
    }
  };

  assert.equal(
    extrair(saidaReal),
    "00000002-000000a0-000050dd-bd03473216fd82dca4e0ded3b39c4c5a",
    "a extração precisa ler o bookmark exato da saída real do wrangler",
  );

  // E precisa devolver vazio quando o bookmark NÃO está lá, para que o
  // `[ -n "$BOOKMARK" ]` do workflow falhe fechado em vez de restaurar para
  // um ponto inventado.
  assert.equal(
    extrair("🚧 Time Traveling...\nerro: database not found"),
    "",
    "sem bookmark na saída a extração precisa devolver vazio, nunca um palpite",
  );
}

// 5) O relatório não pode prometer mais do que o ensaio prova.
assert.match(
  workflow,
  /NÃO mede o RTO de um restore de produção/,
  "o relatório precisa declarar que é mechanism rehearsal, não restore integral",
);

console.log(
  "✅ ensaio de DR: só por acionamento humano confirmado, nenhum comando nomeia produção, destroy reconfere a marca, o bookmark é lido da saída real do wrangler e o relatório não superdeclara.",
);
