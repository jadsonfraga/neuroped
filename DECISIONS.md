# DECISIONS — log de decisões

Formato: contexto → decisão → consequência. Uma entrada por ciclo.

## Ciclo 0 — Auditoria de prontidão (Fase 0)
- **Contexto:** o app é descrito como "ferramenta interna sem billing/onboarding", mas o código real (`functions/api/billing/**`, `functions/api/tenants/**`, testes `cliente-zero-journey`, `saas-*`) já implementa multi-tenant com isolamento verificável, onboarding de 10 marcos server-side, checkout Asaas com webhook idempotente e export LGPD. A lacuna real não é engenharia de produto: é validação externa (Asaas/Resend/deploy) e decisão de ICP/posicionamento.
- **Decisão:** tratar o loop a partir da evidência do repositório (não da descrição), priorizar desbloqueio externo de billing/e-mail/deploy sobre novas features clínicas, e registrar os artefatos vivos na raiz (ROADMAP/DECISIONS/METRICS).
- **Consequência:** ciclos seguintes atacam `BLOCKED_EXTERNAL` e GTM; nenhuma feature clínica nova entra até existir primeiro real faturado. Preço único canônico (R$ 99/assento/mês) permanece até decisão de packaging na Fase 2.

## Ciclo 1 — Trava anti-regressão do loop (Fase 0/1)
- **Contexto:** o desbloqueio de billing/e-mail é operacional (variáveis no Cloudflare + webhook no painel Asaas, já documentado em `docs/GO_LIVE_M5.md`), não de código. Sem trava, mudanças futuras podem apagar os artefatos vivos ou alterar o preço canônico sem que a CI perceba.
- **Decisão:** executar `test:saas-self-service` localmente (verde, exit 0, jornada cliente-zero ponta a ponta) e adicionar `tests/unit/saas-loop-artifacts-static.test.mjs` à suíte e ao workflow `saas-self-service-guard.yml`, cobrindo existência/conteúdo de ROADMAP/DECISIONS/METRICS e o contrato `CANONICAL_PRICE_CENTS = 9900` / trial 14 dias.
- **Consequência:** qualquer PR que remova os artefatos, esvazie o backlog ou mude o pricing sem atualizar o teste falha na CI. Mudança de preço exige agora edição consciente em `shared/billing.ts` + no teste.
