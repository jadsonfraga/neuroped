# Smoke pós-deploy — jornada cliente-zero publicada

Runbook executável para validar, **na instalação publicada**, o fluxo que
separa "deploy existente" de "produto vendável". Cada passo tem comando ou
clique, resultado esperado e critério de falha. Zero dado real de paciente:
use o e-mail sintético `cliente.zero+<data>@exemplo.com` e dados fictícios.

Pré-requisitos: credenciais Asaas/Resend já provisionadas no Cloudflare
(`docs/GO_LIVE_M5.md`), admin conhecido.

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
| 8 | Convidar 1 membro (e-mail sintético) | Convite enviado por e-mail; aceite muda papel | Primeiro membro |
| 9 | Cadastrar paciente fictício (nome sintético) | Paciente criado, cifrado, isolado | Primeiro paciente |
| 10 | Registrar consulta/evento sintético | Evento `encounter` criado com provenance | Primeira consulta |
| 11 | Emitir documento clínico em rascunho | `draft`; nunca finalizado automaticamente | Primeiro documento |
| 12 | Abrir Dashboard/Onboarding | Card mostra **10/10** marcos server-computed | Ativação completa |

## Fase C — Critérios de aceite do smoke

O smoke só passa se **todos** forem verdadeiros:

1. `GET /api/admin/go-live` → `pronto: true` **sem** abrir cadastro antes de
   e-mail (se `ordemInvertida: true`, abortar: contas órfãs).
2. Marco 7 concluído com evento `charge_paid` persistido — este é o único
   marcador que transforma "billing testado" em "billing comprovado".
3. Onboarding 10/10 server-computed (a UI não pode promover por redirect).
4. Tempo total do cadastro (passo 1) ao primeiro documento (passo 11) < 30 min.
5. Isolamento: nenhuma resposta expõe recurso de outra clínica (403/404
   consistentes — teste com segunda conta se disponível).

## Fase D — Registro e resultado

- Preencha a linha do smoke em `METRICS.md` (time-to-first-value medido).
- Se algum passo falhar: NÃO abra o cadastro self-service
  (`SAAS_SIGNUP_ENABLED` permanece `false`); registre o passo exato, o erro
  observado e a pendência em `docs/audits/` com prefixo `BLOCKED_EXTERNAL_`.

## Rollover para produção

Após o smoke sandbox verde: trocar `ASAAS_ENVIRONMENT=production`, repetir a
Fase A, e só então `SAAS_SIGNUP_ENABLED=true` (Passo 3 do GO_LIVE_M5). O
primeiro checkout real em produção é a evidência que fecha a Prova de demanda
na METRICS (Assinatura ≠ 0).
