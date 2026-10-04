import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

/**
 * Trava anti-regressão do loop SaaS (Fase 0, ciclo 1).
 *
 * Os artefatos vivos ROADMAP.md, DECISIONS.md e METRICS.md orientam o loop
 * iterativo "NeuroPed → SaaS vendável". Este teste falha se:
 *  - algum artefato for apagado ou esvaziado;
 *  - o backlog perder o item marcado como concluído no ciclo corrente;
 *  - o contrato canônico de pricing mudar sem atualização consciente
 *    (o preço é declarado em shared/billing.ts e exibido em
 *    client/src/pages/planos.tsx; mudança não intencional aqui é regressão
 *    de vendabilidade, não refatoração).
 */

const root = new URL("../../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

test("artefatos vivos do loop SaaS existem e não estão vazios", () => {
  for (const artifact of ["ROADMAP.md", "DECISIONS.md", "METRICS.md"]) {
    const content = read(artifact);
    assert.ok(content.trim().length > 200, `${artifact} deve existir com conteúdo real`);
  }
});

test("ROADMAP registra o ciclo 0 concluído e os bloqueios externos de billing/e-mail", () => {
  const roadmap = read("ROADMAP.md");
  assert.match(roadmap, /✅.*Ciclo 0.*[Aa]uditoria/);
  assert.match(roadmap, /Asaas/i);
  assert.match(roadmap, /Resend/i);
  assert.match(roadmap, /\[ \]/, "backlog precisa de itens abertos priorizados");
});

test("DECISIONS registra o ciclo 0 no formato contexto → decisão → consequência", () => {
  const decisions = read("DECISIONS.md");
  assert.match(decisions, /## Ciclo 0/);
  for (const field of ["Contexto", "Decisão", "Consequência"]) {
    assert.match(decisions, new RegExp(`\\*\\*${field}:`), `falta o campo ${field}`);
  }
});

test("METRICS declara o funil mínimo com alvos e fontes canônicas", () => {
  const metrics = read("METRICS.md");
  for (const stage of ["Visitante", "Cadastro", "Ativação", "Assinatura", "Retenção"]) {
    assert.match(metrics, new RegExp(`\\| ${stage} \\|`), `etapa ${stage} ausente do funil`);
  }
  assert.match(metrics, /charge_paid/);
  assert.match(metrics, /saas_audit_log/);
});

test("contrato canônico de pricing permanece R$ 99/assento/mês com trial de 14 dias", () => {
  const billing = read("shared/billing.ts");
  assert.match(billing, /CANONICAL_PRICE_CENTS = 9900/);
  assert.match(billing, /CANONICAL_TRIAL_DAYS = 14/);
  assert.match(billing, /CANONICAL_PLAN_ID = "saas-professional"/);
});
