/**
 * Contrato estático da aba Financeiro da Agenda (relatório por período + CSV).
 * Rodar: node tests/unit/agenda-financial-static.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const agenda = readFileSync("client/src/pages/agenda.tsx", "utf8");
const panel = readFileSync("client/src/components/AgendaFinancialReport.tsx", "utf8");
const period = readFileSync("client/src/lib/financialPeriod.ts", "utf8");

// A aba continua restrita a quem configura e passa a usar o relatório.
assert.match(agenda, /\{canConfigure && <TabsTrigger value="financeiro">Financeiro<\/TabsTrigger>\}/);
assert.match(agenda, /<TabsContent value="financeiro">\s*<AgendaFinancialReport /);
assert.ok(!agenda.includes('paymentMethod: "manual"'), "a tela não grava mais a forma fixa 'manual'");
assert.ok(!/function PaymentRow/.test(agenda), "registro de pagamento vive no painel do relatório");
assert.match(agenda, /financial_report_export: "relatório financeiro exportado \(CSV\)"/, "exportação rotulada na Atividade");

// Painel: período, CSV autenticado, forma de pagamento da lista compartilhada.
assert.match(panel, /financialReportUrl\(period, "csv"\)/, "CSV pelo mesmo endpoint, com format=csv");
assert.match(panel, /apiRequest\("GET"/, "download autenticado (mesmo cliente da API, com tenant)");
assert.match(panel, /paymentMethods\.map/, "formas de pagamento vêm de shared/operations");
assert.match(panel, /data da consulta/, "a tela diz a base do relatório");
assert.match(panel, /não é um extrato de caixa/, "a tela não promete fluxo de caixa");
assert.match(panel, /data-testid="financial-csv"/);
assert.match(period, /resource: "financial_report"/);

console.log("agenda-financial-static: aba restrita, relatório por período, CSV autenticado e formas de pagamento compartilhadas OK");
