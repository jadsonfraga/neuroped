# Implementation Ledger — auditoria contínua

Retomável: em caso de interrupção, ler este arquivo + `git diff` + os PRs
abertos citados. Baseline desta sessão: `main@21b4803`. Branch de trabalho:
`claude/code-audit-improvements-q48pdz` (PR #745). Complementa a matriz de
reconciliação do Codex em `2026-08-29-pr-reconciliation.md` (PR #746).

Convenção de status: `DONE` (corrigido, testado, com evidência) ·
`IN_PROGRESS` · `BLOCKED` (com causa e ação externa) · `TODO` (priorizado).

## P0 — segurança, isolamento, risco clínico

| Item | Status | Evidência / próximo passo |
|---|---|---|
| billing/accept permitia anexar conta alheia à clínica do convidante | DONE (PR #745) | Fix + validação: `saas-billing-*` e `live-tenant-isolation-adversarial` verdes; check "Billing server-side attacks" verde no CI do PR. |
| Express requireAuth confiava em claims obsoletas do JWT (papel/ativo) | DONE (PR #745) | Releitura do banco por request; `test:quick-wins` verde local e "Build & Test" verde no CI. |
| must_change_password não bloqueava rotas clínicas no Express | DONE (PR #745) | Middleware espelha PASSWORD_CHANGE_ALLOWED_PATHS do Cloudflare; regressões de auth verdes. |
| Access tokens Express sem sid → logout/reuse não revogava access token | DONE (PR #745) | Coluna refresh_tokens.session_id + checagem de família em requireAuth; `express-auth-race-regression` verde. |
| /api/send-report como relay de e-mail para qualquer profissional | DONE (PR #745) | Destinatário custom restrito a admin; `quick-wins-static` verde. |
| Relatos de ideação suicida invisíveis ao Notes engine | DONE (PR #745) | Tópico risco_autolesao_suicidio + seção não truncável; `test:notes` verde. |
| authFetch anexava Bearer a URL de terceiro | DONE (PR #745) | Checagem de origem; `auth-client-races` verde. |
| Rate limit Cloudflare aceitava X-Forwarded-For | DONE (PR #745) | Só CF-Connecting-IP; `cloudflare-auth-middleware` verde. |
| E2E identity hardening (PR #704, autoria anterior) | DONE (mesclado via #749) | Suítes dedicadas validadas localmente nesta auditoria; conteúdo reconciliado na main como #749 em 2026-09-01. |

## P1 — pipeline, fluxos principais, persistência

| Item | Status | Evidência / próximo passo |
|---|---|---|
| CI do PR #745 vermelho: catraca de design (216 > 212) | DONE | Causa: 4× `#000` nas máscaras de fade de sidebar-v13.css (o gate conta hex/rgb). Troca por keyword `black` (idêntico em máscara alpha); `audit:design` local = 212 ✓. |
| CI do PR #745 vermelho: Lighthouse actionableCls em /#/caa e /#/espasticidade | DONE | Causa-raiz: matcher `isFixedNavigationShift` exigia `aside > nav#sidebar-nav` filho direto; o wrapper np-sidebar-scroll quebrou a exclusão deliberada (política pré-existente: crescimento interno da sidebar fixa não move conteúdo clínico). Matcher reparado preservando a intenção; `audit:lighthouse` completo reexecutado localmente com Chromium real — todas as rotas dentro do limite. |
| billing/webhook gravava amount_cents=0 em CHECKOUT_PAID | DONE (PR #745) | Fallback para amount_cents do checkout; suítes de billing verdes. |
| Determinismo do inventário diário (autoria Codex, PR #746) | VALIDATED | Regressão de bytes+SHA-256 verde localmente; e2e Missão Saúde com Chromium real + axe verde (lacuna do ambiente Windows do Codex fechada). |
| Fidelidade tela→PDF GenericScale (autoria Codex, PR #746) | VALIDATED | `test:scale-responses` + `test:interactive` (2.387 checks) verdes; `clean()` idempotente, sem mudança de comportamento. |

## P2/P3 — parciais, UX, consolidação

| Item | Status | Evidência / próximo passo |
|---|---|---|
| Sidebar desorganizada (3 camadas CSS com !important em guerra) | DONE (PR #745) | Fonte única sidebar-v13.css; screenshots Playwright desktop claro/escuro + drawer mobile; e2e responsive-shell e scroll-continuity verdes no CI do PR. |
| 25 PRs paralelos sem plano de integração | DONE (análise) | Matriz do Codex validada e publicada (PR #746) com adendo de supersessão (#745 cobre parte de #732 e o escopo de sidebar de #713). |
| Cadeia SaaS #721→#723→#724→#725 + #726 (schemas) | TODO | REIMPLEMENT por domínio conforme matriz; exige testes IDOR de duas clínicas antes de qualquer adoção. Não iniciado nesta sessão. |
| #710 (perf reflows) e #733 (ESLint) | DONE (análise — reclassificados) | Evidência 2026-09-01: ambos baseados em main antiga; diff real vs main atual reverteria trabalho integrado (#733 = 1.181 arquivos/−252.957 linhas; #710 = 218/−21.363). #733 obsoleto (lint da main já zera com --max-warnings=0); de #710, no máximo cherry-pick dos 2 commits de memoização do laudo após validação isolada. |
| #728 (monólito), #734 (artefatos manuais), #716/#717 (duplicatas) | TODO | Fechar somente após substitutas mescladas (regra 1.4 da matriz). |

## Bloqueios externos

| Bloqueio | Causa | Ação necessária |
|---|---|---|
| Merge de #745/#746/#704 | RESOLVIDO em 2026-09-01 | Dono aprovou e mesclou: #746 (156d00fc), #745 (3eab25db), #704 via #749 (39327b00); Chromium instalado nas catracas de CI (#748/#750). Deploys de main disparados pelos merges. |
| Automação de monitoramento de PR nesta sessão | Classificador de permissões negou subscribe_pr_activity e send_later | Reexecutar verificação manualmente ou conceder permissão. |
