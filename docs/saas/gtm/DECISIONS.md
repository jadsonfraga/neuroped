# DECISIONS (log comercial: contexto → decisão → consequência)

## D-001 · 2026-10-04 · Ciclo 1 (Fase 0)
**Contexto.** O master prompt afirma "sem billing, sem onboarding de terceiros, sem
segmentação de permissões". O código mostra o contrário: billing provider-agnostic com
Asaas (`shared/billing.ts`, `functions/api/billing/*`), plano canônico R$ 99/assento/mês
com trial de 14 dias, onboarding por marcos persistidos (`shared/onboarding.ts`),
papéis (`shared/permissions.ts`), multi-tenant (`functions/api/tenant*`), go-live
(`functions/api/admin/go-live.ts`) e 24 itens da espiral SaaS fechados. O prompt também
cita Supabase; a arquitetura canônica é Cloudflare Pages Functions + D1 (`AGENTS.md`).
**Decisão.** Tratar o repositório como fonte da verdade. O gargalo para vender não é
construir billing/onboarding (já existem), e sim: (1) ativar em produção o que está
gated (cripto clínica, R2/LGPD, cadastro self-service), (2) fechar P0 de tenancy
legado (S9), (3) provar demanda com ICP definido. Nenhum médico externo entra em LIVE
antes de (1) e (2).
**Consequência.** Fase 1 vira "Cliente Zero em LIVE" (a própria clínica) antes de
qualquer terceiro. Fases 2 e 3 são majoritariamente ativação/verificação, não build.

## D-002 · 2026-10-04 · Ciclo 1 (fechamento) — ICP provisório
**Contexto.** O proprietário não soube responder (ICP, estado de `SAAS_SIGNUP_ENABLED`,
clínica própria em LIVE). Regra do loop: seguir com a melhor suposição declarada.
**Decisão (PROVISÓRIA, revogável por evidência).**
- ICP = clínica pequena de neurodesenvolvimento infantil (1–5 profissionais:
  neuropediatra + fono/psicólogo/TO). Motivo: agenda multiprofissional, pré-consulta,
  avaliação multiprofissional e preço por assento já existem no código.
- Clínica do proprietário NÃO está em LIVE: com `CLINICAL_CRYPTO_NOT_CONFIGURED` em produção
  (audit Clinical/LGPD), as rotas LIVE falham fechadas (`docs/saas-live-clinical-rollout.md`).
- `SAAS_SIGNUP_ENABLED`: assumido DESLIGADO (não consta em `wrangler.toml`); verificar em
  `GET /api/admin/go-live` (gate `CADASTRO_SELF_SERVICE_FECHADO`) logado como admin.
**Consequência.** Ciclo 2 trabalha a proposta de valor e o roteiro de entrevistas para este
ICP; a Fase 1 (Cliente Zero) continua bloqueada até a cripto clínica existir.
**Como invalidar.** Qualquer entrevista que mostre outro pagador primário (ex.: neuropediatra
individual) reabre este item.
