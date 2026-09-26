# Evidências da espiral

## S1 (ciclo 1) — go-live nível atestado
- Escopo: `functions/api/admin/go-live.ts` + bloco 7 de
  `tests/unit/go-live-readiness.test.ts` (aditivo; contrato anterior mantido).
- Ambiente: container da sessão, Node do repo, SHA base `e77bbf7`.
- Comandos e resultados (exit 0): `npx tsx tests/unit/go-live-readiness.test.ts`
  (falhou antes da implementação pelo motivo certo; verde depois),
  `npm run check`, `npm run lint`, `npm run test:quick-wins`,
  `npm run test:saas-self-service`.
- Artefato: diff no commit desta PR. Sem segredos: o teste varre a resposta
  contra sentinelas aleatórias, inclusive prefixos.

## Baseline (ciclo 1)
- `test:saas-self-service` verde em `e77bbf7` (log com `[mail] delivery
  failed { status: 403 }` esperado: harness intercepta o provedor).
- Deploy run 1416 (`e77bbf7`) success com verificação de SHA público,
  health autenticado, CORS e login e2e executados.

## S3 (ciclo 3) — inventário Acesso+Comercial e contrato auth/me
- Evidência de cobertura: grep de import direto `functions/api/<handler>`
  em tests/unit, não coincidência de nome.
- auth/me: bloco novo em e2e-refresh-session-guard-regression.test.ts
  (roda em test:auth-bootstrap, dentro de test:quick-wins). Assertiva de
  família revogada vista FALHANDO com a checagem removida do handler.
- Comandos exit 0: suíte estendida isolada, npm run check, npm run lint,
  npm run test:quick-wins.

## S6 (ciclo 4, 2026-09-26) — webhook Asaas bloqueado pelo Bearer global
- Escopo: `functions/api/_middleware.ts` (uma linha em `PUBLIC_API_PATHS`,
  com comentário). O handler já se autentica sozinho
  (`validateAsaasWebhook`, tempo constante, ≥32 chars, fail-closed 503 sem
  segredo) — nada mudou em `functions/api/billing/webhook.ts` para este item.
- Ambiente: container da sessão, Node do repo, HEAD `e1a28ec`.
- Teste novo em `tests/unit/cloudflare-auth-middleware.test.ts` (roda em
  test:quick-wins via test:auth-bootstrap→cloudflare-auth-middleware):
  POST com `asaas-access-token` e sem `Authorization`. Visto FALHANDO antes
  (401 UNAUTHENTICATED) pelo motivo certo; verde depois (200, next() executado).
- Comandos exit 0: `node --import tsx tests/unit/cloudflare-auth-middleware.test.ts`,
  `node --import tsx tests/unit/saas-billing-contract.test.ts`,
  `node --import tsx tests/unit/saas-billing-adversarial.test.ts`,
  `node --import tsx tests/unit/cliente-zero-journey.test.ts`,
  `npm run check`, `npx eslint` nos arquivos tocados.

## S7 (ciclo 4, 2026-09-26) — checkout expirado cancelava assinatura ativa
- Escopo: `functions/api/billing/webhook.ts` (classify/invoiceKind/
  resolveContext/checkoutStatus) + `functions/api/billing/_provider.ts`
  (campo `subscription` no tipo do evento). `CHECKOUT_CANCELED`/
  `CHECKOUT_EXPIRED` passam a atualizar só `billing_provider_checkouts`;
  `PAYMENT_DELETED` vira `webhook_received` (auditado, sem efeito de
  estado); só `SUBSCRIPTION_DELETED`/`SUBSCRIPTION_INACTIVATED` (resolvidos
  por `subscription.id` → `billing_subscriptions.provider_subscription_id`)
  cancelam de forma terminal, até existir rota própria de cancelamento.
- Ambiente: container da sessão, Node do repo, HEAD `e1a28ec` + S6.
- Teste em `tests/unit/saas-billing-adversarial.test.ts`: cenário antigo
  (CHECKOUT_CANCELED cancela um customer em past_due) SUBSTITUÍDO por dois
  cenários — (a) CHECKOUT_EXPIRED não move o customer/subscription para
  fora de past_due, só marca o checkout como `expired`; (b)
  SUBSCRIPTION_DELETED com `subscription.id` real cancela de verdade, e
  pagamento tardio não reabre. Visto FALHANDO contra o código anterior via
  `git stash` isolado (customer virava `canceled` em vez de `past_due`
  continuar); verde com o fix.
- Comandos exit 0: `node --import tsx tests/unit/saas-billing-adversarial.test.ts`,
  `node --import tsx tests/unit/saas-billing-contract.test.ts`,
  `node --import tsx tests/unit/saas-billing-provider.test.ts`,
  `node --import tsx tests/unit/saas-billing-production-wiring.test.mjs`,
  `node --import tsx tests/unit/billing-log-safety.test.mjs`,
  `node --import tsx tests/unit/saas-tenant-lifecycle.test.ts`,
  `node --import tsx tests/unit/cliente-zero-journey.test.ts`,
  `node --import tsx tests/unit/saas-acceptance-journey.test.ts`,
  `node --import tsx tests/unit/saas-self-service.test.ts`, `npm run check`.
- Rollback: reverter os dois arquivos de produção a `e1a28ec` restaura o
  comportamento antigo; nenhuma migração de schema envolvida (nenhum valor
  novo de `kind` foi introduzido em `billing_invoice_events`, justamente
  para não exigir migração — ver comentário no código).
