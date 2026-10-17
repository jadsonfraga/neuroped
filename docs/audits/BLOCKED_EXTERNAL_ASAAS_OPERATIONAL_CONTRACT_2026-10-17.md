# BLOCKED_EXTERNAL — contrato operacional Asaas (2026-10-17)

## Sistema
Credenciais Asaas desta sessão (`ASAAS_API_KEY`, `ASAAS_WEBHOOK_TOKEN`,
`ASAAS_ENVIRONMENT`, `AUTH_PUBLIC_APP_URL`). Não há conta sandbox nem
produção acessível daqui.

## Permissão exata necessária
Variáveis no Cloudflare Pages (Production), sem ecoar o valor:

- `ASAAS_API_KEY` — chave da conta Asaas (16+ caracteres)
- `ASAAS_WEBHOOK_TOKEN` — token de 32+ caracteres configurado no painel
- `ASAAS_ENVIRONMENT` — `sandbox` no primeiro ciclo
- `AUTH_PUBLIC_APP_URL` — URL pública HTTPS

Mais um webhook no painel Asaas apontando para
`https://<dominio>/api/billing/webhook` com o header `asaas-access-token`.

## Comando executado

```bash
env -u ASAAS_API_KEY -u ASAAS_WEBHOOK_TOKEN -u ASAAS_ENVIRONMENT \
  -u APP_BASE_URL -u AUTH_PUBLIC_APP_URL \
  node --import tsx scripts/ops/asaas-operational-contract.ts
```

Exit code: **2**.

```json
{
  "status": "BLOCKED_EXTERNAL",
  "code": "BLOCKED_EXTERNAL_ASAAS",
  "missing": [
    "ASAAS_API_KEY",
    "ASAAS_WEBHOOK_TOKEN",
    "ASAAS_ENVIRONMENT",
    "AUTH_PUBLIC_APP_URL"
  ],
  "probe": "not_attempted",
  "proves": []
}
```

Nenhuma cobrança foi criada. Não há `charge_paid`, receita, MRR nem cliente
pagante.

## Ação que falta
Provisionar as quatro variáveis, repetir o comando e depois
`node --import tsx scripts/ops/asaas-operational-contract.ts --probe`.
Exit 0 do probe só prova que `GET /myAccount` aceitou a chave. O fechamento
do bloqueio exige um pagamento real no sandbox e um `charge_paid` persistido
pelo webhook autenticado, conforme `docs/ASAAS_OPERATIONAL_CONTRACT.md`.

## Risco de não executar
O checkout de produção permanece recusado (`BILLING_BLOCKED_EXTERNAL`). Um
médico não consegue pagar. Inventar o evento no banco marcaria entitlement
sem dinheiro recebido.

## Como verificar a conclusão
1. O comando sem `--probe` sai 0 com `proves: ["CONFIGURACAO_PRESENTE"]`.
2. O comando com `--probe` sai 0 com `ASAAS_ACCOUNT_READ_OK`.
3. Depois de um pagamento sandbox, existe linha
   `billing_invoice_events.kind = 'charge_paid' AND status = 'done'`
   originada pelo webhook, e o onboarding da clínica mostra
   `SERVER_CONFIRMED`. Redirect de checkout não conta.
