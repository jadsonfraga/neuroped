/**
 * Trava de privacidade e de utilidade da reconciliação.
 *
 * O workflow `billing-lgpd-reconciliation.yml` consulta o D1 de PRODUÇÃO em
 * agenda. Dois modos de falha que este teste impede:
 *
 * 1. **Vazamento.** Alguém acrescenta `email`, `clinic_id` ou o id do
 *    provedor à consulta "só para facilitar o diagnóstico" — e a partir daí o
 *    log público do Actions carrega identificação de cliente a cada 6 horas.
 *    A consulta só pode devolver COUNT.
 *
 * 2. **Monitor que não reprova.** Um alarme sob `continue-on-error`, ou sem
 *    agenda, não avisa ninguém — é decoração com nome de observabilidade.
 *
 * Também trava a leitura-apenas: um monitor não muta produção. Corrigir
 * divergência de cobrança é decisão humana com contexto.
 *
 * Rodar: node tests/unit/reconciliation-query-safety.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const workflow = readFileSync(
  join(repoRoot, ".github", "workflows", "billing-lgpd-reconciliation.yml"),
  "utf8",
);

const ABERTURA = '--json --command "';
const FECHAMENTO = '" > /tmp/reconciliation.json';

/**
 * A consulta é extraída do comando real do workflow, não de um `indexOf`
 * ingênuo: a palavra SELECT também aparece nos comentários do cabeçalho, e um
 * recorte que começasse ali validaria texto de comentário em vez do SQL que
 * roda contra produção.
 */
export function extrairConsulta(source) {
  const inicio = source.indexOf(ABERTURA);
  assert.ok(inicio >= 0, "o comando da consulta sumiu do workflow");
  const fim = source.indexOf(FECHAMENTO, inicio);
  assert.ok(fim > inicio, "não encontrei o fim do comando da consulta");
  return source.slice(inicio + ABERTURA.length, fim);
}

const select = extrairConsulta(workflow);
const aliases = [...select.matchAll(/\bAS\s+([a-z_]+)/g)].map((m) => m[1]);
assert.deepEqual(
  aliases,
  [
    "checkout_pago_sem_assinatura",
    "customer_ativo_sem_assinatura",
    "job_lgpd_com_lease_expirado",
    "job_lgpd_falhado_recente",
  ],
  "as colunas projetadas mudaram — cada uma precisa continuar sendo uma contagem revisada",
);
assert.equal(
  (select.match(/COUNT\(\*\)/g) ?? []).length,
  aliases.length,
  "toda coluna projetada precisa ser COUNT(*) — identificador não sai daqui",
);

// 2) Nenhum identificador é projetado. (Aparecer em WHERE/JOIN é legítimo;
//    o que não pode é virar coluna de saída, e o COUNT acima já garante isso.
//    Aqui reforçamos contra o caso óbvio de alguém colar um SELECT novo.)
for (const proibido of [/SELECT\s+[^()]*\bemail\b/i, /SELECT\s+[^()]*\bbilling_email\b/i]) {
  assert.doesNotMatch(
    workflow,
    proibido,
    "a reconciliação nunca pode projetar e-mail — o log do Actions é legível por quem tem acesso ao repositório",
  );
}

// 3) Somente leitura.
for (const mutacao of [/\bINSERT\s+INTO\b/i, /\bUPDATE\s+\w+\s+SET\b/i, /\bDELETE\s+FROM\b/i, /\bDROP\b/i, /d1 delete/i]) {
  assert.doesNotMatch(
    workflow,
    mutacao,
    "a reconciliação é somente leitura — corrigir divergência é decisão humana",
  );
}

// 4) Tem agenda e reprova de verdade.
const triggerBlock = workflow.split(/^jobs:/m)[0] ?? "";
assert.match(triggerBlock, /^\s*schedule:\s*$/m, "a reconciliação precisa rodar em agenda");
assert.match(triggerBlock, /^\s*-\s*cron:/m, "a agenda precisa de um cron");
assert.doesNotMatch(
  workflow,
  /continue-on-error:\s*true/,
  "monitor sob continue-on-error nunca reprova, logo nunca avisa",
);
assert.match(
  workflow,
  /FALHOU=1/,
  "cada divergência precisa marcar reprovação",
);

// 5) Falha de leitura das contagens é falha do monitor, não silêncio.
assert.match(
  workflow,
  /falha do monitor, não ausência de divergência/,
  "consulta ilegível precisa reprovar em vez de ser lida como 'sem divergência'",
);

console.log(
  `✅ reconciliação: ${aliases.length} contagens, nenhum identificador projetado, somente leitura, com agenda e reprovando de verdade.`,
);
