# Contrato operacional Resend

Verificação de conta e convite de membro já existem no código. Este runbook
é o contrato para operar isso num ambiente real. Sem as variáveis abaixo, o
cadastro responde `EMAIL_VERIFICATION_NOT_CONFIGURED` com
`blockedExternal: BLOCKED_EXTERNAL_RESEND` e **não cria conta**. O convite
responde `INVITATION_DELIVERY_NOT_CONFIGURED` com o mesmo
`blockedExternal` e **não emite token**.

Nenhum desses caminhos grava `email_verified_at`. E-mail verificado continua
sendo só o consumo do token em `POST /api/auth/verify-email`
(`email_verified_source = self_service_token`).

## O que o código exige antes de enviar

| Variável | Regra |
| --- | --- |
| `AUTH_RESEND_API_KEY` | não vazia |
| `AUTH_EMAIL_FROM` | remetente verificado na conta Resend |
| `AUTH_PUBLIC_APP_URL` | HTTPS. Link de token em HTTP é recusado |
| `AUTH_EMAIL_TRANSPORT` | omitida ou `resend`. Outro nome recusa o transporte |

## Comando

```bash
node --import tsx scripts/ops/resend-operational-contract.ts
```

| Saída | Exit | Significado |
| --- | --- | --- |
| `code: BLOCKED_EXTERNAL_RESEND` | 2 | Falta variável. `missing` lista só nomes |
| `proves: ["CONFIGURACAO_PRESENTE"]` | 0 | Variáveis presentes. Nenhuma chamada ao provedor |
| com `--probe` e `RESEND_ACCOUNT_READ_OK` | 0 | `GET /domains` aceitou a chave. Não é entrega |
| com `--probe` e `BLOCKED_EXTERNAL_RESEND_*` | 3 | Chave recusada ou provedor inacessível |

```bash
node --import tsx scripts/ops/resend-operational-contract.ts --probe
```

O probe não chama `POST /emails`. Não use este script para marcar
`users.email_verified_at`.

## Depois que o probe dos domínios passar

1. Confirme que `AUTH_EMAIL_FROM` usa um domínio que o Resend já verificou.
2. Crie uma conta com e-mail sintético. O produto só pode avançar para clínica
   depois que o link de verificação for aberto e `email_verified_at` estiver
   preenchido com origem `self_service_token`.
3. Convide um segundo endereço sintético. O aceite só existe depois que o
   destinatário abre o link. A URL não volta para quem convidou.
4. `GET /api/tenants/:id/onboarding` marca e-mail verificado só com
   `users.email_verified_at`. Redirect e resposta de cadastro não contam.

## O que continua bloqueado sem essa evidência

Enquanto o comando sair 2 ou 3, ou enquanto nenhuma mensagem real tiver sido
recebida, a entrega não está comprovada. Registre o exit e o `code` em
`docs/audits/BLOCKED_EXTERNAL_RESEND_*`. Não trate conta de teste local como
e-mail verificado em produção.
