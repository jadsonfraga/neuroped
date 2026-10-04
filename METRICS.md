# METRICS — funil mínimo

Valores atuais são zero por ausência de fatos persistidos (regra de honestidade do próprio repositório: "qualquer painel correto deve mostrar zero na ausência de fatos persistidos").

| Etapa | Definição | Alvo (90 dias) | Atual |
|---|---|---|---|
| Visitante | Acesso qualificado à página/landing | 300 | 0 |
| Cadastro | Conta criada + e-mail verificado (`users.email_verified_at`) | 30 | 0 |
| Ativação | Primeiro documento clínico emitido (`saas_audit_log.live_document_create`) | 15 | 0 |
| Assinatura | Evento `charge_paid` persistido (`billing_invoice_events`) | 5 | 0 |
| Retenção | Assinantes ativos no mês seguinte | ≥80% | n/d |

## Medição de time-to-first-value
- Roteiro: `docs/SMOKE_CLIENTE_ZERO.md` (Fase B, passos 1–11, alvo < 30 min).
- Última medição: pendente (exige smoke na instalação publicada).

## Instrumentação existente (fontes canônicas)
- Onboarding: `GET /api/tenants/:id/onboarding` (10 marcos, projeção server-side).
- Billing: `billing_invoice_events.kind = 'charge_paid' AND status = 'done'`.
- Eventos clínicos: `saas_audit_log` (metadata-only, sem PHI).

## Trava anti-regressão
- `tests/unit/saas-loop-artifacts-static.test.mjs` (na CI via `saas-self-service-guard.yml`) garante que este funil, os alvos e as fontes canônicas permanecem declarados.

## Lacunas de instrumentação
- Visitante → cadastro: nenhum evento de aquisição/origem; definir na Fase 4.
- Time-to-first-value: ainda não medido ponta a ponta; alvo <30 min do critério macro.
