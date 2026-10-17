# BLOCKED_EXTERNAL — smoke cliente-zero publicado (2026-10-17)

## Sistema
Ambiente publicado `https://neuroped.pages.dev` (Cloudflare Pages + D1) e a
conta sintética de titular que o smoke usa.

## Permissão exata necessária
1. Rede de saída até `neuroped.pages.dev`. O contêiner desta sessão não tem:
   o proxy recusa o túnel (mesma causa de `BLOCKED_EXTERNAL_smoke-producao.md`).
   O workflow manual **Cliente-zero published smoke** roda do GitHub, que alcança.
2. Segredos do repositório `NEUROPED_SMOKE_OWNER_EMAIL` e
   `NEUROPED_SMOKE_OWNER_PASSWORD`. Conta sintética, papel `professional`,
   **diferente** de `NEUROPED_E2E_EMAIL`, verificada pelo link do e-mail.
   Isso exige o Resend operando (`docs/RESEND_OPERATIONAL_CONTRACT.md`).
3. Para o marco de cobrança: Asaas configurado e um pagamento sandbox feito
   por uma pessoa (`docs/ASAAS_OPERATIONAL_CONTRACT.md`).

## Comando executado

```bash
node --import tsx scripts/ops/cliente-zero-published-smoke.ts
```

Exit code: **1**. `api_health`, `signup_gate` e `billing_webhook_gate` saíram
`FAILED` com `NETWORK_ERROR` (HTTP 0): a requisição não saiu do contêiner. Os
passos do titular saíram `NOT_RUN` com `OWNER_CREDENTIALS_ABSENT`. Isso não diz
nada sobre a produção.

## Ação que falta
1. Rodar o workflow manual sem segredos de titular: registra saúde, portão do
   cadastro e portão do webhook publicados, sem criar nada.
2. Criar a conta sintética de titular pelo cadastro, abrir o link do e-mail e
   salvar os dois segredos.
3. Rodar de novo com `write_synthetic` e `close_clinic` marcados.

## Risco de não executar
A jornada só tem prova local (`tests/unit/cliente-zero-journey.test.ts` e
`tests/unit/cliente-zero-published-smoke.test.ts`, com provedores
interceptados). Sem a execução publicada, não há evidência de que:
- o deploy aplica as migrações;
- o keyring clínico e o binding LGPD estão presentes;
- o onboarding de produção calcula os marcos.

## Como verificar a conclusão
Artefato `cliente-zero-smoke-<run_id>` do workflow, com `verdict` e os passos.
O veredito `VERIFIED` (exit 0) só existe com `charge_paid` persistido pelo
webhook. Enquanto o pagamento sandbox não acontecer, o esperado é
`BLOCKED_EXTERNAL` (exit 2), com os marcos não financeiros em `VERIFIED`.
