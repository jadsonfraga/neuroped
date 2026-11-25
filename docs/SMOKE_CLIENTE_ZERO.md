# Smoke pós-deploy — jornada cliente-zero publicada

Runbook executável para validar, **na instalação publicada**, o fluxo que
separa "deploy existente" de "produto vendável". Cada passo tem comando ou
clique, resultado esperado e critério de falha. Zero dado real de paciente:
use o e-mail sintético `cliente.zero+<data>@exemplo.com` e dados fictícios.

Pré-requisitos: credenciais Asaas/Resend já provisionadas no Cloudflare
(`docs/GO_LIVE_M5.md`), admin conhecido.

## Execução automatizada pela API

`scripts/ops/cliente-zero-published-smoke.ts` percorre esta jornada contra a
origem publicada e devolve um relatório JSON por marco: `VERIFIED`,
`BLOCKED_EXTERNAL`, `FAILED` ou `NOT_RUN`. Onboarding e cobrança vêm só de
`GET /api/tenants/:id/onboarding`; o redirect de checkout nunca é lido.

```bash
# Só sondas públicas (saúde, portão do cadastro, portão do webhook). Não cria nada.
node --import tsx scripts/ops/cliente-zero-published-smoke.ts

# Jornada do titular sintético. Na primeira passagem, deixe o consultório ativo para o checkout.
SMOKE_OWNER_EMAIL=... SMOKE_OWNER_PASSWORD=... \
  node --import tsx scripts/ops/cliente-zero-published-smoke.ts --write-synthetic

# Após confirmar o evento de pagamento, repita e solicite encerramento ao final.
SMOKE_OWNER_EMAIL=... SMOKE_OWNER_PASSWORD=... \
  node --import tsx scripts/ops/cliente-zero-published-smoke.ts --write-synthetic --close-clinic
```

| Exit | Significado |
| --- | --- |
| 0 | Todos os marcos do smoke Solo `VERIFIED`, inclusive `charge_paid` persistido |
| 2 | Algum `BLOCKED_EXTERNAL` ou `NOT_RUN`; nada falhou |
| 1 | Algum `FAILED` |

No GitHub: workflow **Cliente-zero published smoke** (manual), com os
segredos `NEUROPED_SMOKE_OWNER_EMAIL` e `NEUROPED_SMOKE_OWNER_PASSWORD`.

Limites do script:

- **Titular:** precisa ser uma conta sintética já verificada pelo link do
  e-mail (passos 1–2 abaixo, feitos uma vez à mão). A identidade técnica
  `NEUROPED_E2E_EMAIL` é recusada antes do login: o middleware revoga a sessão
  dela se ganhar clínica.
- **Fora do script:** a criação de conta, o recebimento da mensagem e o
  pagamento no Asaas sandbox são comprovados em separado. O smoke não faz
  cobrança nem confirma envio de e-mail.
- **Escrita:** `--write-synthetic` autoriza criar o consultório reservado
  (`Clínica Sintética Smoke Cliente-Zero`) e gravar paciente, consulta e
  documento em rascunho. `--close-clinic` só tem efeito junto desse opt-in.
- **Relatório:** sem senha, token, e-mail do titular nem conteúdo clínico. O
  corpo do export do consultório é descartado depois de conferir o digest.
  A execução da exportação LGPD pelo R2 tem evidência própria.

## Fase A — Diagnóstico de configuração (2 min)

1. Autenticado como admin:
   ```bash
   curl -s -H "Cookie: <sessão-admin>" https://<dominio>/api/admin/go-live | jq
   ```
   - Esperado: `pronto: true`, `pendencias: []`, `ordemInvertida: false`.
   - Falha: qualquer pendência listada bloqueia a Fase B — corrija no
     Cloudflare antes de prosseguir (ordem: e-mail → cobrança → cadastro).

## Fase B — Jornada cliente-zero ponta a ponta (15 min)

Cada item marca um marco do onboarding canônico (`GET /api/tenants/:id/onboarding`).
Registro: anote o horário de cada passo — isso mede o **time-to-first-value**
real, alvo < 30 min do critério macro.

| # | Passo (clique a clique) | Esperado | Marco onboarding |
|---|---|---|---|
| 1 | Abrir `/#/cadastro`, criar conta com e-mail sintético | Conta criada; aviso de verificação | Conta criada |
| 2 | Abrir o e-mail de verificação (Resend) e clicar no link | `email_verified_at` preenchido | E-mail verificado |
| 3 | Criar clínica (nome fictício, ex.: "Clínica Demo A") | Clínica criada e selecionada | Clínica criada |
| 4 | Seguir para Configurações → Plano; iniciar checkout (1 assento) | Redireciona ao link Asaas sandbox | Plano selecionado |
| 5 | Pagar no sandbox Asaas (Pix ou cartão de teste) | Checkout `paid` no provedor | — |
| 6 | Voltar ao app; conferir `/#/billing/retorno?status=success` | Página "Pagamento em processamento" | — |
| 7 | Aguardar webhook e conferir Configurações → Plano | Assinatura `active`; entitlement liberado | **Billing configurado** (`charge_paid` persistido) |
| 8 | Conferir o consultório Solo de um assento | O titular usa o próprio assento | Consultório criado |
| 9 | Cadastrar paciente fictício (nome sintético) | Paciente criado, cifrado, isolado | Primeiro paciente |
| 10 | Registrar consulta/evento sintético | Evento `encounter` criado com provenance | Primeira consulta |
| 11 | Emitir documento clínico em rascunho | `draft`; nunca finalizado automaticamente | Primeiro documento |
| 12 | Abrir Dashboard/Onboarding | Card Solo mostra **5/5** marcos calculados no servidor | Ativação Solo |

## Fase C — Critérios de aceite do smoke

O smoke só passa se **todos** forem verdadeiros:

1. `GET /api/admin/go-live` → `pronto: true` **sem** abrir cadastro antes de
   e-mail (se `ordemInvertida: true`, abortar: contas órfãs).
2. Marco 7 concluído com evento `charge_paid` persistido — este é o único
   marcador que transforma "billing testado" em "billing comprovado".
3. Os cinco marcos Solo constam como concluídos no servidor: conta, e-mail,
   consultório, primeiro paciente e primeiro documento. O relatório v2 mantém
   o snapshot completo, inclusive os marcos de equipe para ofertas futuras.
4. Tempo total do cadastro (passo 1) ao primeiro documento (passo 11) < 30 min.
5. Isolamento: nenhuma resposta expõe recurso de outra clínica (403/404
   consistentes — teste com segunda conta se disponível).

## Fase D — Registro e resultado

- Preencha a linha do smoke em `METRICS.md` (time-to-first-value medido).
- Se algum passo falhar: NÃO abra o cadastro self-service
  (`SAAS_SIGNUP_ENABLED` permanece `false`); registre o passo exato, o erro
  observado e a pendência em `docs/audits/` com prefixo `BLOCKED_EXTERNAL_`.

## Rollover para produção

Use preview isolada para as fases A–C do sandbox. Após a prévia verde e a decisão
do proprietário, configure Asaas em produção e repita as verificações operacionais.
O `saas-release-gate.ts` exige o smoke v2 de produção, health recente e a
evidência independente do pagamento no provedor e das revisões. O aceite comercial
e a abertura do cadastro seguem o plano de go-live.
