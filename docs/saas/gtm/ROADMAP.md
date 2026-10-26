# ROADMAP comercial (camada GTM)

Camada de negócio. A engenharia SaaS vive em `docs/saas/spiral/` (STATE, BACKLOG,
EVIDENCE) e `docs/audits/`; este arquivo NÃO a duplica, só a referencia.
Fonte da verdade de código: `AGENTS.md`. Sem dado real de paciente em nada aqui.

Legenda: ✅ feito · 🔒 bloqueio externo (ação do proprietário) · ⏳ em andamento

## Now
- ✅ Ciclo 1 / Fase 0: auditoria de prontidão (ver METRICS.md e DECISIONS.md D-001).
- ✅ ICP Solo decidido (D-011): neuropediatra que opera o próprio consultório; proposta de valor alinhada (`VALUE_PROPOSITION.md`).
- ✅ Ciclo 3: kit de convites + roteiro de demo fictícia (`INVITE_AND_DEMO_KIT.md`).
- ⏳ Realizar 10 entrevistas Solo com neuropediatras independentes e registrar em `INTERVIEW_LOG.md`.
- ✅ `CLINICAL_CRYPTO_NOT_READY` fechado (G1, 17/10/2026).
- 🔒 Fechar P0 LGPD em produção: `LGPD_BUCKET_NOT_CONFIGURED` (token sem `Workers R2 Storage: Edit`;
  `docs/audits/BLOCKED_EXTERNAL_CLINICAL_LGPD_PROVISIONING_2026-09-26.md`).
- ⏳ G4 (ensaio de backup/restore com cifra real) está desbloqueado por G1 e ainda não foi executado.
- 🔒 S9 (P0): associação legítima de dados clínicos legados a clínica
  (`docs/saas/spiral/BACKLOG.md`, `BLOCKED_EXTERNAL_LEGACY_TENANT_CENSUS_2026-09-26.md`).
- 🔒 Validar Asaas, Resend, R2/LGPD, revisão jurídica e smoke publicado antes de piloto real.

- ✅ Ciclo 4 / Fase 3: gate de confiabilidade G1–G7 (`PHASE3_GATE.md`).

- ✅ Ciclo 5: memo de decisão do S9 com inferência dos 4 legados (`S9_DECISION_MEMO.md`).

- ✅ Ciclo 6: rascunho D-004 de `/planos` sem promessa não cumprida (`PLANOS_COPY_D004.md`), aguardando aprovação.

- ✅ Ciclo 7: briefing jurídico G6 pronto para o advogado (`LEGAL_BRIEFING.md`).

- ✅ Ciclo 8: roteiro do Cliente Zero em 14 dias (`CLIENTE_ZERO_14D.md`).

## Next
- Cliente Zero em LIVE: a própria clínica do proprietário rodando 14 dias no fluxo
  multi-tenant real, com o checklist de onboarding (`shared/onboarding.ts`).
- 🔒 S4: integração sandbox Asaas exercitada (credencial sandbox do proprietário).
- Roteiro de 10 entrevistas Solo + 3 pilotos pagos + 2 segundas faturas (Fase 4 em paralelo).
- Página pública de planos/valor Solo implementada; validar linguagem nas entrevistas.

## Later
- Tiers além de `saas-professional` (catálogo em `shared/entitlements.ts`).
- Oferta Clínica com 2+ profissionais, papéis e múltiplos assentos.
- Chave por clínica / crypto-shredding por tenant (achado SAAS_TENANCY_AUDIT).
- GTM com sociedades de neuropediatria, conteúdo ético, indicação.
