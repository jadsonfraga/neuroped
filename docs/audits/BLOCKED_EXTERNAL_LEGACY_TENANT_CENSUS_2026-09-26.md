# BLOCKED_EXTERNAL — censo de produção do domínio clínico legado

Data: 2026-09-26 · Ciclo 4 da espiral SaaS · Achados de origem: AUTHZ-P0-01,
AUTHZ-P0-02, LEG-01, LEG-02, LEG-03, LEG-04 (`docs/audits/SAAS_TENANCY_AUDIT_2026-09-26.md`).

## Sistema

D1 de produção do NeuroPed (binding `DB` do Cloudflare Pages, banco
`neuroped-db` conforme `wrangler.toml`/`provision-d1.yml`). Tabelas
`patients_demo`, `consultations_demo`, `scale_results_demo`,
`clinical_memory_notes_demo`, `conecta_events_demo`, `clinical_events_demo`,
`documents_demo`, `external_import_batches`.

## Ação que falta

Um censo somente-leitura, sem PHI, que devolva:

1. Contagem de linhas por tabela acima.
2. Para `patients_demo`: contagem por `owner_user_id IS NULL` vs
   `IS NOT NULL`, e quantos `owner_user_id` distintos têm 0, 1, ou 2+
   `clinic_memberships` ativas (join com `users`/`clinic_memberships`).
3. Se a conta `ADMIN_EMAIL` (bootstrap de plataforma) é a mesma que detém a
   clínica ativa do cliente zero, ou uma conta técnica separada.
4. Se o workflow `provision-d1.yml` (seed de fixtures) já rodou contra o
   banco de nome `neuroped-db` de produção (haveria linhas com os ids fixos
   `demo-001..003` fora de um ambiente de teste).

Este ambiente de execução (container da sessão) não tem acesso de rede ao
D1 de produção nem a credenciais do Cloudflare/Wrangler — só lê o
repositório e roda testes contra bancos sintéticos (`:memory:`).

## Por que isso bloqueia o achado

Remover o bypass do papel global `admin` nas rotas clínicas legadas
(AUTHZ-P0-01/LEG-01) é o item de maior severidade da auditoria, mas fazer
isso ANTES de saber quantas linhas ficariam órfãs teria um efeito colateral
que a missão "sem perda" proíbe explicitamente: se o cliente zero (ou
qualquer conta) tiver dados legados com `owner_user_id NULL` ou espalhados
por múltiplas memberships, remover o bypass sem backfill prévio cortaria o
próprio acesso a esses dados — trocando um vazamento entre tenants por uma
perda de acesso do dono legítimo. A migração de backfill (`clinic_id` a
partir da membership única do owner) só pode ser desenhada com segurança
sabendo, com números reais, quantos casos ambíguos existem.

## Risco de não executar

Enquanto o censo não roda: o papel `admin` global continua sendo bypass
clínico cross-tenant nas rotas legadas (`/api/patients`, `/api/consultations`,
`/api/scales/results`, `/api/memory`, `/api/memory/search`) — qualquer conta
com esse papel lê, altera e apaga PHI de qualquer usuário/clínica. Isso é
uma violação ativa da regra do AGENTS.md ("admin global não é fallback de
rota clínica comum") e do princípio de isolamento por tenant. O risco é
conhecido e já documentado (ver auditoria); este arquivo registra apenas
por que a correção não foi executada às cegas nesta sessão.

## Como verificar a conclusão

1. Rodar o censo acima contra o D1 de produção (via `wrangler d1 execute
   neuroped-db --remote --command "..."` com as quatro consultas da seção
   anterior) e colar o resultado (só contagens, sem PHI) neste arquivo ou em
   um novo registro de evidência.
2. Com os números em mãos, desenhar a migração forward-only de backfill
   (`clinic_id` + `legacy_origin` + `legacy_tenant_backfill_status`,
   conforme a correção proposta em LEG-03/LEG-04 no relatório de auditoria),
   escrever o teste de isolamento (`tests/unit/legacy-tenant-isolation.test.ts`,
   sugerido em LEG-01) e só então remover o bypass de `isAdmin` nos
   predicados legados.
3. Fechar este bloqueio atualizando `docs/saas/spiral/STATE.md` e
   `BACKLOG.md` (item S9) com o resultado e o link do commit que remove o
   bypass.
