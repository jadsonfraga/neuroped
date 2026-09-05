/**
 * A consulta de reconciliação roda de verdade contra o schema real.
 *
 * A trava de privacidade (`reconciliation-query-safety.test.mjs`) inspeciona o
 * texto do SQL. Este teste faz a outra metade: EXECUTA a consulta exata do
 * workflow contra o DDL real das quatro tabelas, e prova que ela detecta cada
 * divergência que promete detectar.
 *
 * Sem isto, um monitor pode ficar verde por dois motivos indistinguíveis:
 * "não há divergência" e "a consulta parou de enxergar divergência" — depois
 * de um `ALTER TABLE`, de uma coluna renomeada, ou de um status novo no CHECK.
 * O segundo caso é pior que não ter monitor, porque produz confiança.
 *
 * Rodar: node --import tsx tests/unit/reconciliation-query-executes.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import Database from "better-sqlite3";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (relative) => readFileSync(join(repoRoot, relative), "utf8");

const workflow = read(join(".github", "workflows", "billing-lgpd-reconciliation.yml"));
const ABERTURA = '--json --command "';
const FECHAMENTO = '" > /tmp/reconciliation.json';
const inicio = workflow.indexOf(ABERTURA);
assert.ok(inicio >= 0, "o comando da consulta sumiu do workflow");
const CONSULTA = workflow.slice(
  inicio + ABERTURA.length,
  workflow.indexOf(FECHAMENTO, inicio),
);

/**
 * DDL real, lida das migrações — não uma cópia. Se a tabela mudar em
 * produção, ela muda aqui junto, e a consulta é reavaliada contra a mudança.
 */
function tabela(arquivo, nome) {
  const sql = read(join("db", "migrations", arquivo));
  const match = new RegExp(
    `CREATE TABLE IF NOT EXISTS ${nome} \\([\\s\\S]*?\\n\\);`,
    "m",
  ).exec(sql);
  assert.ok(match, `DDL de ${nome} não encontrada em ${arquivo}`);
  return match[0];
}

function bancoLimpo() {
  const db = new Database(":memory:");
  // FKs desligadas explicitamente (better-sqlite3 as liga por padrão): só as
  // quatro tabelas da consulta são materializadas, e as REFERENCES apontam
  // para tabelas fora deste recorte. A consulta não depende de FK alguma.
  db.pragma("foreign_keys = OFF");
  db.exec(tabela("0012_saas_billing_onboarding.sql", "billing_customers"));
  db.exec(tabela("0012_saas_billing_onboarding.sql", "billing_subscriptions"));
  db.exec(tabela("0013_saas_billing_provider.sql", "billing_provider_checkouts"));
  db.exec(tabela("0017_lgpd_operational_worker_foundation.sql", "live_lgpd_worker_jobs"));
  return db;
}

const CAMPOS = [
  "checkout_pago_sem_assinatura",
  "customer_ativo_sem_assinatura",
  "job_lgpd_com_lease_expirado",
  "job_lgpd_falhado_recente",
];

function reconciliar(db) {
  const row = db.prepare(CONSULTA).get();
  for (const campo of CAMPOS) {
    assert.equal(typeof row[campo], "number", `${campo} precisa ser numérico`);
  }
  return row;
}

// 1) Banco sadio: a consulta é válida e não inventa divergência.
{
  const db = bancoLimpo();
  const row = reconciliar(db);
  assert.deepEqual(
    CAMPOS.map((campo) => row[campo]),
    [0, 0, 0, 0],
    "banco vazio não pode acusar divergência",
  );
  db.close();
}

const cliente = (db, id, status) =>
  db
    .prepare(
      `INSERT INTO billing_customers (id, clinic_id, provider, status)
       VALUES (?, ?, 'asaas', ?)`,
    )
    .run(id, `clinic-${id}`, status);

const assinaturaViva = (db, customerId) =>
  db
    .prepare(
      `INSERT INTO billing_subscriptions (id, customer_id, plan_id, status)
       VALUES (?, ?, 'saas-professional', 'active')`,
    )
    .run(`sub-${customerId}`, customerId);

// 2) Checkout pago sem assinatura viva — dinheiro entrou, entitlement não.
{
  const db = bancoLimpo();
  cliente(db, "c1", "active");
  db.prepare(
    `INSERT INTO billing_provider_checkouts
       (id, billing_customer_id, provider, provider_checkout_id,
        external_reference, seats, amount_cents, status)
     VALUES ('chk1','c1','asaas','prov-1','ref-1',1,9900,'paid')`,
  ).run();

  let row = reconciliar(db);
  assert.equal(row.checkout_pago_sem_assinatura, 1, "checkout pago órfão precisa ser detectado");
  assert.equal(row.customer_ativo_sem_assinatura, 1, "customer ativo sem assinatura precisa ser detectado");

  // Criada a assinatura, as duas divergências somem — o alarme desarma sozinho
  // quando o estado é reconciliado, em vez de exigir intervenção no monitor.
  assinaturaViva(db, "c1");
  row = reconciliar(db);
  assert.equal(row.checkout_pago_sem_assinatura, 0);
  assert.equal(row.customer_ativo_sem_assinatura, 0);
  db.close();
}

// 3) Um checkout ainda 'active' (cliente abandonou o carrinho) NÃO é
//    divergência: ninguém pagou. Um monitor que acusasse isto viraria ruído.
{
  const db = bancoLimpo();
  cliente(db, "c2", "pending");
  db.prepare(
    `INSERT INTO billing_provider_checkouts
       (id, billing_customer_id, provider, provider_checkout_id,
        external_reference, seats, amount_cents, status)
     VALUES ('chk2','c2','asaas','prov-2','ref-2',1,9900,'active')`,
  ).run();
  const row = reconciliar(db);
  assert.equal(row.checkout_pago_sem_assinatura, 0, "carrinho abandonado não é divergência");
  assert.equal(row.customer_ativo_sem_assinatura, 0, "customer 'pending' não é divergência");
  db.close();
}

// 4) Job LGPD com lease expirado — direito do titular parado, prazo correndo.
{
  const db = bancoLimpo();
  db.prepare(
    `INSERT INTO live_lgpd_worker_jobs
       (id, request_type, request_id, clinic_id, status, lease_until)
     VALUES ('j1','export','req-1','clin-1','processing', datetime('now','-2 hours'))`,
  ).run();
  let row = reconciliar(db);
  assert.equal(row.job_lgpd_com_lease_expirado, 1, "lease expirado precisa ser detectado");

  // Lease ainda válido não é divergência: o worker está trabalhando.
  db.prepare(
    `UPDATE live_lgpd_worker_jobs SET lease_until = datetime('now','+30 minutes') WHERE id='j1'`,
  ).run();
  row = reconciliar(db);
  assert.equal(row.job_lgpd_com_lease_expirado, 0, "lease válido não é divergência");
  db.close();
}

// 5) Falha recente alarma; falha antiga já triada não pina o alarme vermelho
//    para sempre — a janela de 24h é decisão de desenho, não descuido.
{
  const db = bancoLimpo();
  db.prepare(
    `INSERT INTO live_lgpd_worker_jobs
       (id, request_type, request_id, clinic_id, status, updated_at)
     VALUES ('j2','delete','req-2','clin-1','failed', datetime('now','-1 hour'))`,
  ).run();
  assert.equal(reconciliar(db).job_lgpd_falhado_recente, 1, "falha recente precisa alarmar");

  db.prepare(
    `UPDATE live_lgpd_worker_jobs SET updated_at = datetime('now','-10 days') WHERE id='j2'`,
  ).run();
  assert.equal(
    reconciliar(db).job_lgpd_falhado_recente,
    0,
    "falha antiga não pode manter o alarme vermelho para sempre",
  );
  db.close();
}

console.log(
  "✅ consulta de reconciliação: válida contra o DDL real, detecta checkout pago órfão, customer ativo sem assinatura, lease expirado e falha recente — e não acusa carrinho abandonado, lease válido nem falha antiga.",
);
