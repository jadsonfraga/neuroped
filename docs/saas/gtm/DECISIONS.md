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

## D-003 · 2026-10-04 · Ciclo 2 — alavanca: proposta de valor + roteiro de entrevistas
**Contexto.** Prova de demanda = 0. Sem ela, qualquer feature extra é aposta.
**Decisão.** Uma única entrega: `VALUE_PROPOSITION.md` (frase v1 + 4 hipóteses) e
`INTERVIEW_PLAYBOOK.md` (10 entrevistas, compromisso obrigatório ao final). Não foi feito:
landing nova, feature de WhatsApp, tiers, preço novo.
**Alerta registrado.** Não divulgar promessa de registro cifrado até o audit Clinical/LGPD passar
(`ready: true`); `/planos` já descreve cifra, hoje inativa em produção. Decisão de remover ou
qualificar o texto é do proprietário (D-004 pendente).
**Consequência.** O ciclo só fecha com ≥3 entrevistas registradas; entrevistas são ação humana.

## D-005 · 2026-10-04 · Ciclo 3 — convites primeiro; sem tenant de demonstração por ora
**Contexto.** O gargalo da prova de demanda são as conversas, não o software.
**Decisão.** Entregar convites e roteiro de demo com telas sem dado real. NÃO criar tenant de
demonstração semeado agora: o caminho LIVE está bloqueado (cripto clínica) e semear dados em
produção, mesmo fictícios, mistura demo com ambiente clínico.
**Consequência.** A demo no Ciclo 3 é limitada a telas públicas e escala em modo sem persistência.
Reavaliar um ambiente de demo isolado quando houver ≥1 entrevista pedindo demonstração.

## D-006 · 2026-10-04 · Ciclo 4 (Fase 3) — gate G1–G7 e ordem obrigatória
**Contexto.** O usuário pediu Fase 3 sem entrevistas feitas. O mapeamento mostra que o gargalo
de confiabilidade é um conjunto pequeno e ordenado de P0, quase todos dependentes de ação do
proprietário (chaves, token R2, destino de 4 registros legados, credencial Asaas sandbox,
revisão jurídica).
**Decisão.** Publicar o gate G1–G7 com ordem G1 → G4 → G3. A alavanca única do ciclo é a
autorização de destino dos registros legados (G3), por ser pequena (4 linhas) e destravar a
remoção do bypass de admin.
**Consequência.** Nenhum terceiro em LIVE antes do gate. Engenharia só executa G3 depois de G1/G4.
