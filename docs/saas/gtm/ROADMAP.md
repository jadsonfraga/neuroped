# ROADMAP comercial (camada GTM)

Camada de negócio. A engenharia SaaS vive em `docs/saas/spiral/` (STATE, BACKLOG,
EVIDENCE) e `docs/audits/`; este arquivo NÃO a duplica, só a referencia.
Fonte da verdade de código: `AGENTS.md`. Sem dado real de paciente em nada aqui.

Legenda: ✅ feito · 🔒 bloqueio externo (ação do proprietário) · ⏳ em andamento

## Now
- ✅ Ciclo 1 / Fase 0: auditoria de prontidão (ver METRICS.md e DECISIONS.md D-001).
- ✅ ICP provisório A decidido (D-002) e proposta de valor v1 escrita (`VALUE_PROPOSITION.md`).
- ✅ Ciclo 3: kit de convites + roteiro de demo fictícia (`INVITE_AND_DEMO_KIT.md`).
- ⏳ Ciclo 2/3 (ação do proprietário): realizar as 3 primeiras entrevistas com o roteiro (`INTERVIEW_PLAYBOOK.md`) e registrar em `INTERVIEW_LOG.md`.
- 🔒 Fechar P0 clínico/LGPD em produção: `CLINICAL_CRYPTO_NOT_READY` e
  `LGPD_BUCKET_NOT_CONFIGURED` (`docs/audits/BLOCKED_EXTERNAL_CLINICAL_LGPD_PROVISIONING_2026-09-26.md`).
- 🔒 S9 (P0): associação legítima de dados clínicos legados a clínica
  (`docs/saas/spiral/BACKLOG.md`, `BLOCKED_EXTERNAL_LEGACY_TENANT_CENSUS_2026-09-26.md`).

- ✅ Ciclo 4 / Fase 3: gate de confiabilidade G1–G7 (`PHASE3_GATE.md`).

- ✅ Ciclo 5: memo de decisão do S9 com inferência dos 4 legados (`S9_DECISION_MEMO.md`).

## Next
- Cliente Zero em LIVE: a própria clínica do proprietário rodando 14 dias no fluxo
  multi-tenant real, com o checklist de onboarding (`shared/onboarding.ts`).
- 🔒 S4: integração sandbox Asaas exercitada (credencial sandbox do proprietário).
- Roteiro de 10 entrevistas com o ICP + 3 pilotos pagos (Fase 4 antecipada em paralelo).
- Página pública de planos/valor revisada para o ICP (existem `planos.tsx`, `sobre.tsx`).

## Later
- Tiers além de `saas-professional` (catálogo em `shared/entitlements.ts`).
- Chave por clínica / crypto-shredding por tenant (achado SAAS_TENANCY_AUDIT).
- GTM com sociedades de neuropediatria, conteúdo ético, indicação.
