# Contrato operacional Asaas — checkout, webhook, idempotência, entitlement

Runbook executável. Ele prova se **esta instalação** pode chamar o Asaas e
se o código recusa a chamada quando o contrato está incompleto. Ele **não
comprova cobrança**, pagamento, fatura, MRR, receita nem cliente pagante.
O único fato que transforma billing em comprovado continua sendo
`billing_invoice_events.kind = 'charge_paid' AND status = 'done'`, gravado
pelo webhook autenticado. Redirect de checkout não é fonte de verdade.

Preço canônico: R$ 99 por assento/mês (`shared/billing.ts`, `CANONICAL_PRICE_CENTS = 9900`).

## O que o código exige antes de qualquer POST ao provedor

`assertAsaasOutboundContract` em `functions/api/billing/_provider.ts` roda
antes de criar checkout e antes de cancelar recorrência. Se falhar, nenhuma
requisição sai.

| Condição | Código | Efeito |
| --- | --- | --- |
| `ASAAS_ENVIRONMENT` ausente | `ASAAS_ENVIRONMENT_NOT_CONFIGURED` | Não há default para sandbox |
| Valor diferente de `sandbox` ou `production` | `ASAAS_ENVIRONMENT_INVALID` | 503 no checkout |
| `ASAAS_API_KEY` com menos de 16 caracteres | `ASAAS_API_KEY_NOT_CONFIGURED` | 503 `BILLING_PROVIDER_NOT_CONFIGURED` |
| Produção sem prefixo `$aact_prod_` | `ASAAS_API_KEY_ENVIRONMENT_MISMATCH` | Chave de sandbox ou sem prefixo não cobra em produção |
| Sandbox com prefixo `$aact_prod_` | `ASAAS_API_KEY_ENVIRONMENT_MISMATCH` | Chave de produção não vai para o host sandbox |
| `ASAAS_WEBHOOK_TOKEN` ausente ou curto | `ASAAS_WEBHOOK_TOKEN_NOT_CONFIGURED` | Checkout não abre sem token de webhook |
| Token com espaço, >255 caracteres, ou prefixo `$aact_` | `ASAAS_WEBHOOK_TOKEN_INVALID` | O token não pode ser a API key |
| URL pública ausente | `APP_BASE_URL_NOT_CONFIGURED` | Vale `APP_BASE_URL` ou `AUTH_PUBLIC_APP_URL` |
| Produção com URL que não é `https:` | `APP_BASE_URL_INSECURE` | Sandbox ainda aceita outro esquema |

Checkout devolve `503 BILLING_PROVIDER_NOT_CONFIGURED` nesses casos. Falha
HTTP do provedor, com o contrato presente, continua
`503 BILLING_PROVIDER_UNAVAILABLE`. O gestor da clínica não recebe o código
interno; o admin vê a pendência em `GET /api/admin/go-live`
(`COBRANCA_NAO_CONFIGURADA`).

Webhook sem token configurado responde `503 WEBHOOK_NOT_CONFIGURED` e não
grava evento. Token presente e diferente responde `401` e também não grava.
Evento repetido com o mesmo `id` devolve `{ ok: true, duplicate: true }` pela
chave `asaas:<id>` em `billing_invoice_events.idempotency_key`.
`PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED` e `CHECKOUT_PAID` gravam
`charge_paid` e passam customer/subscription a `active`. Esse é o entitlement
persistido. A UI não promove o marco.

Sandbox ainda aceita chave **sem** prefixo `$aact_hmlg_`, porque a suíte local
usa chave sintética e chaves antigas do painel podem não ter o prefixo.
Produção não aceita esse caso.

## Comando

Na raiz do repositório, com as variáveis do ambiente que se quer classificar
(nunca cole a chave no comando):

```bash
node --import tsx scripts/asaas-operational-contract.mts
```

Saídas:

| Exit | Significado |
| --- | --- |
| 2 | Contrato ausente ou incoerente. `efeito` = `BLOCKED_EXTERNAL`. Nenhuma chamada ao provedor. |
| 0 sem `--probe` | Forma local da configuração está completa. `cobrancaComprovada` continua `false`. Não é venda. |
| 0 com `--probe` | `GET /v3/customers?limit=1` respondeu 2xx. A chave alcança a conta. Continua sem cobrança. |
| 3 | Contrato local ok, mas a leitura falhou ou a rede não alcançou o provedor. |

O JSON nunca inclui a chave, o token, e-mail ou corpo da resposta. Os campos
`cobrancaExterna`, `cobrancaComprovada` e `receitaCentavos` saem sempre como
`BLOCKED_EXTERNAL`, `false` e `0`.

Leitura opcional, só depois do exit 0 sem probe:

```bash
node --import tsx scripts/asaas-operational-contract.mts --probe
```

O probe é `GET`. O script não chama `/checkouts` nem `/payments`.

## Provisionar no Cloudflare (Production)

Ordem já fixada em `docs/GO_LIVE_M5.md`: e-mail antes de cadastro; cobrança
antes de tratar a assinatura como vendável.

1. Confirme `AUTH_PUBLIC_APP_URL` com `https://`.
2. Defina `ASAAS_ENVIRONMENT=sandbox` no primeiro ciclo.
3. Cole a chave **do mesmo ambiente**. Produção só com chave `$aact_prod_`.
4. Gere um `ASAAS_WEBHOOK_TOKEN` de 32 a 255 caracteres, sem espaço, diferente da API key.
5. Rode o comando acima. Exit 2 bloqueia o passo seguinte.

No painel Asaas do **mesmo** ambiente, cadastre o webhook:

- URL: `https://<dominio>/api/billing/webhook`
- Header esperado pelo código: `asaas-access-token` igual ao token da variável
- Eventos mínimos: `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`, `CHECKOUT_PAID`,
  `PAYMENT_OVERDUE`, `PAYMENT_REFUNDED`, `CHECKOUT_CANCELED`, `CHECKOUT_EXPIRED`,
  `SUBSCRIPTION_DELETED`, `SUBSCRIPTION_INACTIVATED`
- Envio sequencial, para a idempotência ver o evento antes do retry

Não dispare um pagamento de teste neste runbook. O smoke que paga no sandbox
está em `docs/SMOKE_CLIENTE_ZERO.md` e só vale com credencial autorizada.
Enquanto esse smoke não tiver `charge_paid` persistido, a linha Asaas do
`ROADMAP.md` permanece aberta.

## Como saber que a prova externa fechou

1. Este comando, no ambiente publicado, sai 0 com `--probe` e
   `efeito=CREDENCIAL_ALCANCE_LEITURA`.
2. Um webhook originado pelo Asaas (não por teste local) grava `charge_paid`.
3. `GET /api/tenants/:id/onboarding` marca billing como `SERVER_CONFIRMED`
   com essa linha como fonte.
4. `METRICS.md` só então pode deixar de mostrar Assinatura = 0, citando o
   fato persistido — nunca o redirect nem este probe.
