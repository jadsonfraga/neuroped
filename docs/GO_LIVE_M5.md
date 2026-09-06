# Go-live M5 — procedimento de provisionamento

Ordem obrigatória. Cada passo tem uma forma de confirmar antes do seguinte.

Confira o estado a qualquer momento, autenticado como **admin**:

```
GET /api/admin/go-live
```

Ela devolve booleanos e pendências nomeadas — **nunca** valor de segredo.

---

## Passo 1 — Entrega de e-mail (ANTES de abrir o cadastro)

Cloudflare Pages → projeto NeuroPed → Settings → Environment variables
(**Production**):

| Variável | Valor |
| --- | --- |
| `AUTH_PUBLIC_APP_URL` | a URL pública, com `https://` obrigatório |
| `AUTH_RESEND_API_KEY` | chave de API da conta Resend |
| `AUTH_EMAIL_FROM` | remetente verificado no domínio da conta Resend |

**Por que primeiro:** com o cadastro aberto e estas ausentes, cada conta nova
nasce travada — a confirmação de posse não é emitida e `POST /api/tenants`
recusa para sempre com `EMAIL_VERIFICATION_REQUIRED`. Não há autoatendimento
que resolva. O verificador chama esse estado de `ordemInvertida: true`.

**Confirmação:** `pendencias` não contém `ENTREGA_EMAIL_NAO_CONFIGURADA`.
Depois, peça uma redefinição de senha para um endereço seu e verifique que o
e-mail chega.

## Passo 2 — Cobrança (sandbox antes de produção)

| Variável | Valor |
| --- | --- |
| `ASAAS_API_KEY` | chave da conta Asaas |
| `ASAAS_WEBHOOK_TOKEN` | token de 32+ caracteres, o mesmo configurado no painel do Asaas |
| `ASAAS_ENVIRONMENT` | `sandbox` para o primeiro ciclo; `production` depois |

O token do webhook é comparado em tempo constante em
`functions/api/billing/_provider.ts`. Um token curto não é aceito.

**Confirmação:** `pendencias` não contém `COBRANCA_NAO_CONFIGURADA`. Depois,
um checkout ponta a ponta em sandbox com o webhook chegando e o entitlement
virando `active` — é isso que transforma "billing testado" em "billing
comprovado".

## Passo 3 — Abrir o cadastro self-service

| Variável | Valor |
| --- | --- |
| `SAAS_SIGNUP_ENABLED` | `true` |

Só depois do Passo 1 confirmado.

**Confirmação:** `pronto: true` e `pendencias: []`.

## Passo 4 — Ensaio de restauração

Actions → **DR mechanism rehearsal (D1)** → Run workflow → digitar `ENSAIAR`.

Preencha o RTO medido em `docs/D1_DISASTER_RECOVERY_RUNBOOK.md`, que hoje
registra `DESCONHECIDO`. O ensaio cria e destrói um D1 isolado; produção não é
lida nem escrita.

---

## O que continua verdadeiro depois dos quatro passos

`pronto: true` significa que a configuração está completa — **não** que a
venda foi comprovada. M5 exige a jornada Cliente Zero executada de verdade:
um desconhecido descobrindo o preço, criando conta, confirmando e-mail,
criando clínica, pagando, convidando equipe, exportando dados e cancelando.

Enquanto nenhuma cobrança real tiver percorrido o provedor, a reconciliação de
billing devolve zero por ausência de tráfego, não por correção comprovada.
