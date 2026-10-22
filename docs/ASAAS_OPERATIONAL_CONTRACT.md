# Contrato operacional Asaas

Checkout, webhook autenticado, idempotência e entitlement já existem no código
e são exercitados por teste local. Este runbook é o contrato para operar isso
num ambiente real. Sem as variáveis abaixo, o produto responde
`BLOCKED_EXTERNAL` e **não cria cobrança**.

Presença de configuração não é pagamento, fatura, MRR nem cliente pagante.
O redirect `/#/billing/retorno` não concede entitlement.

## O que o código exige antes de chamar o Asaas

| Variável | Regra |
| --- | --- |
| `ASAAS_API_KEY` | 16+ caracteres, não vazia |
| `ASAAS_WEBHOOK_TOKEN` | 32+ caracteres, o mesmo do painel Asaas |
| `ASAAS_ENVIRONMENT` | `sandbox` ou `production`, explícito. Ausente não cai em sandbox |
| `AUTH_PUBLIC_APP_URL` | HTTPS. `APP_BASE_URL` HTTPS é aceito no lugar |

Checkout sem esse conjunto devolve `503` com `code: BILLING_BLOCKED_EXTERNAL`
e `blockedExternal: BLOCKED_EXTERNAL_ASAAS`. Webhook sem token devolve `503`
`WEBHOOK_NOT_CONFIGURED`. Token diferente devolve `401`
`WEBHOOK_UNAUTHENTICATED`.

## Comando

Na raiz do repositório, com as variáveis do ambiente alvo exportadas
(não as imprima):

```bash
node --import tsx scripts/ops/asaas-operational-contract.ts
```

| Saída | Exit | Significado |
| --- | --- | --- |
| `code: BLOCKED_EXTERNAL_ASAAS` | 2 | Falta variável. `missing` lista só nomes |
| `proves: ["CONFIGURACAO_PRESENTE"]` | 0 | Variáveis presentes. Nenhuma chamada ao provedor |
| com `--probe` e `ASAAS_ACCOUNT_READ_OK` | 0 | `GET /myAccount` aceitou a chave. Não é cobrança |
| com `--probe` e `BLOCKED_EXTERNAL_ASAAS_*` | 3 | Chave recusada ou provedor inacessível |

```bash
node --import tsx scripts/ops/asaas-operational-contract.ts --probe
```

O probe é somente leitura. Não use este script para criar checkout, pagamento
ou linha em `billing_invoice_events`.

## Depois que o probe da conta passar

1. No painel Asaas do mesmo ambiente (`sandbox` primeiro), aponte o webhook
   para `https://<dominio>/api/billing/webhook` com o header
   `asaas-access-token` igual a `ASAAS_WEBHOOK_TOKEN`.
2. Eventos mínimos: `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`, `CHECKOUT_PAID`,
   `PAYMENT_OVERDUE`, `PAYMENT_REFUNDED`, `SUBSCRIPTION_DELETED`,
   `SUBSCRIPTION_INACTIVATED`.
3. Um gestor da clínica inicia o checkout na aplicação (1 assento). O preço
   cobrado é `CANONICAL_PRICE_CENTS` (R$ 99) vezes os assentos.
4. Pague no sandbox do provedor. Voltar ao app mostra processamento. Isso
   **não** ativa a assinatura.
5. Confirme o efeito persistido, no D1 da instalação, sem copiar PHI para o
   repositório:

```sql
SELECT kind, status, idempotency_key
  FROM billing_invoice_events
 WHERE kind = 'charge_paid' AND status = 'done';
```

Entitlement ativo exige a assinatura correspondente em `active` e o customer
em `active`, gravados pelo webhook — não por este SELECT e não pelo redirect.
Reenviar o mesmo `id` de evento deve responder `{ "ok": true, "duplicate": true }`
sem segunda transição.

6. `GET /api/tenants/:id/onboarding` só marca billing configurado quando esse
   `charge_paid` existe. Sem ele o marco fica `AWAITING_PROVIDER_EVENT` ou
   `BLOCKED_EXTERNAL`.

## O que continua bloqueado sem essa evidência

Enquanto o comando sair 2 ou 3, ou enquanto não houver `charge_paid` originado
pelo provedor, a venda não está comprovada. Registre o exit e o `code` em
`docs/audits/BLOCKED_EXTERNAL_ASAAS_*`. Não preencha receita em `METRICS.md`.
