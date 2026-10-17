# BLOCKED_EXTERNAL — contrato operacional Asaas sem credencial

Data: 2026-10-17. Branch: `cursor/asaas-operational-contract-1082`.

## Sistema

Asaas (API sandbox `https://api-sandbox.asaas.com/v3` e produção
`https://api.asaas.com/v3`), mais as variáveis do Cloudflare Pages do projeto
NeuroPed.

## Permissão exata necessária

Variáveis na instalação que se quer provar, sem ecoar o valor:

- `ASAAS_API_KEY` — chave do mesmo ambiente (`$aact_hmlg_` em sandbox, `$aact_prod_` em produção)
- `ASAAS_WEBHOOK_TOKEN` — 32 a 255 caracteres, sem espaço, diferente da API key
- `ASAAS_ENVIRONMENT` — `sandbox` ou `production`, explícito
- `AUTH_PUBLIC_APP_URL` ou `APP_BASE_URL` — `https://` obrigatório em produção

Webhook no painel Asaas do mesmo ambiente, header `asaas-access-token`, URL
`https://<dominio>/api/billing/webhook`.

## O que foi executado aqui

```bash
node --import tsx scripts/asaas-operational-contract.mts --probe
```

Exit **2**. Stdout:

```json
{"pronto":false,"code":"ASAAS_ENVIRONMENT_NOT_CONFIGURED","blockedExternal":true,"ambiente":null,"host":null,"cobrancaExterna":"BLOCKED_EXTERNAL","cobrancaComprovada":false,"receitaCentavos":0,"probe":"nao_executado","efeito":"BLOCKED_EXTERNAL"}
```

Nenhuma chamada ao Asaas. Nenhuma cobrança, fatura, MRR ou cliente pagante.

O que ficou verde neste worktree, sem credencial de provedor, em Node 24
(o mesmo major da CI):

```bash
npm run test:saas-self-service
```

Exit 0. Inclui `cliente-zero-journey` (webhook ainda `MOCKED_EXTERNAL`),
onboarding server-side e `tests/unit/asaas-operational-contract.test.ts`.
O teste novo cobre contrato fail-closed, probe `GET` só com mock e script
sem vazar segredo. Webhook autenticado, idempotência e entitlement
persistido continuam nos testes de billing com HTTP interceptado.

```bash
npm run verify:release
```

Exit 0 em Node 24, neste worktree. Isso é o gate local de release. Não é
deploy, não é cobrança e não abre o cadastro self-service.

## Ação que falta

No ambiente Cloudflare autorizado, preencher as variáveis, rodar o comando
sem `--probe` (exit 0 = forma local pronta, ainda sem cobrança) e depois com
`--probe` (exit 0 e `efeito=CREDENCIAL_ALCANCE_LEITURA` = a chave alcança a
conta). Em seguida, o smoke de `docs/SMOKE_CLIENTE_ZERO.md` até existir
`billing_invoice_events.kind = 'charge_paid' AND status = 'done'`.

## Risco de não executar

Sem a credencial, checkout em produção responde
`503 BILLING_PROVIDER_NOT_CONFIGURED` e não abre link. Entitlement pago não
nasce. Tratar exit 0 do probe, ou redirect de checkout, como assinatura
inventaria receita.

## Como verificar a conclusão

1. O comando com `--probe` sai 0 e o JSON traz `efeito` igual a
   `CREDENCIAL_ALCANCE_LEITURA`, com `cobrancaComprovada` ainda `false`.
2. Um evento originado pelo Asaas grava `charge_paid` com `status=done`.
3. `GET /api/tenants/:id/onboarding` marca billing `SERVER_CONFIRMED` com
   fonte `billing_invoice_events.charge_paid`.
4. Só então a coluna Assinatura de `METRICS.md` pode sair de zero, citando
   esse fato.
