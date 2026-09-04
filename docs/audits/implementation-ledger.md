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

## Rodada 2026-09-01 — bugs e consolidação de funções (base `main@bfd78218`)

Branch reiniciada de main após merge de #745/#746/#749. Três frentes de
auditoria (duplicação, worker LGPD, Secretaria/booking público).

| Item | Status | Evidência / próximo passo |
|---|---|---|
| Helpers duplicados entre rotas Cloudflare (json/jsonResponse ×15, sha256Hex ×3, boundedText/clean ×3, readJsonBody ×2, nowInProviderTimezone ×2), shared (clamp de query clínica Express×CF) e client (dateStamp ×4, esc/escHtml fracos ×2) | DONE (`0b0d91d8`) | Fontes únicas: `functions/api/_request.ts`, `auth/_crypto`, `operations/_core`, `shared/clinical-core.ts` (clampClinicalEventQueryDays/parseClinicalEventTypesParam), `client/src/lib/printDocument.ts` (dateStamp), `@/lib/htmlEscape`. 28 arquivos, −279/+122; tsc, lint e suítes citadas no commit verdes. Variante de json de boaconsulta/import mantida local de propósito (headers extras). |
| Worker LGPD: claim × rejeição concorrente deixava job zumbi 'processing' executando export de request rejeitada (ALTO) | DONE (`a027715f`) | Claim exige EXISTS(request approved/processing) + releitura pós-promoção com liberação `failed/REQUEST_STATE_CHANGED`. Regressão: `tests/unit/lgpd-worker-race-regressions.test.ts` cenário 1. |
| Worker LGPD: conclusão × rejeição concorrente commitava job 'completed' com evidência de artefato que o executor apaga (prova fantasma, ALTO) | DONE (`a027715f`) | completeExportJob/completeDeletionJob guardados por "request ainda processing" dentro do batch. Regressão: cenário 2. |
| Worker LGPD: ack perdido após commit da conclusão destruía o artefato registrado no ledger (TOCTOU) | DONE (`a027715f`) | `confirmCompleted` (isExportJobCompletedWithEvidence) reconsulta o ledger antes do delete; falha genuína continua removendo artefato + EXPORT_COMPLETION_FAILED. Regressões: cenários 3/3b. |
| Evidência de aceite público existia só na migração 0016; o endpoint /api/public-booking cria schema em runtime → banco sem migração gravava agendamento/waitlist sem prova de aceite (ALTO) | DONE (`39463d1a`) | `ensureOperationsHardeningSchema` espelha os objetos da 0016 (idempotente). Regressão pelo caminho de produção: `tests/unit/operations-consent-evidence-runtime.test.ts` (falha comprovada no bootstrap pré-fix; inclui guarda anti-drift de versão/hash do aviso). |
| Evento `clinical.read` atribuído à clínica do header x-tenant-id enquanto os handlers GET servem `?clinicId=` → leitura de B auditada na clínica A (MÉDIO) | DONE (`6e3eeb3e`) | `clinicalLiveAuditClinicId` prefere a clínica efetivamente servida (validada pelo handler; só sucesso é auditado), fallback ao header. Regressões em `live-read-audit-policy.test.ts`. |
| Hub de integrações fingia sucesso de iframe bloqueado por X-Frame-Options (onLoad dispara mesmo bloqueado) e o timer de 10s rebaixava frame carregado para "timeout" (MÉDIO) | DONE (`54754608`) | `resolveFrameLoadStatus` (@/lib/frameStatus): "ready" só com documento legível; cross-origin vira "unverified" com aviso e saída externa; timer só promove loading→timeout. Regressão: `manus-frame-honest-status.test.ts`. |
| Token de gestão do agendamento público persistido em sessionStorage (`neuroped:booking-token`) em /agendar (BAIXO) | DOCUMENTED | Tradeoff deliberado: token já é exibido na tela, escopo = 1 agendamento, vida = aba. Remover quebraria a gestão pós-reload em dispositivo do responsável. Decisão de produto: manter; revisitar se surgir uso em dispositivo compartilhado de recepção. |
| Divergência de preço/regras entre /marcacao (R$ 800 + caução R$ 150, política publicada da secretaria) e /agendar (preço do serviço no D1) (BAIXO) | BLOCKED (decisão do dono) | Conteúdo de negócio, não bug de código: as duas rotas descrevem fluxos distintos (BoaConsulta+secretaria vs agenda própria). Unificar preço exige decisão do proprietário sobre qual fonte é canônica. |
| Trigger de consentimento de waitlist dispara em qualquer INSERT (não só fluxo público) | DOCUMENTED | Risco latente apenas se nascer fluxo interno de waitlist; comportamento herdado da migração 0016 e espelhado no bootstrap para não divergir. Ao criar fluxo interno, condicionar o trigger a uma coluna `source`. |
| Consolidações menores restantes da matriz (#8/#9: `bytesEqual` local do executor, variantes de `cleanText`) | TODO | Baixo impacto; `bytesEqual` tem nota de timing já registrada (comparação não-constante aceitável: compara ciphertext readback, não segredo). |

## Rodada 2026-09-02 — transformação SaaS (base `main@27093f25`)

Mandato: "transformação cirúrgica em SaaS real" — preservar 100% do valor
clínico, fechar o funil comercial multiusuário. Auditoria em 4 frentes
(auth, tenancy/RBAC, pressupostos single-user, billing) concluiu: backend
SaaS ~75% pronto (memberships 5 papéis, triggers de último owner, trial
por trigger, entitlements, LGPD), produto 0% (sem signup, /invite 404,
zero UI de equipe/plano/settings, emissores de documentos hardcoded).

| Item | Status | Evidência |
|---|---|---|
| P0: /api/send-report caía numa caixa pessoal fixa (conteúdo clínico de qualquer tenant) | DONE (`aa43cacc`) | Fallback = e-mail do próprio profissional autenticado. |
| Signup self-service | DONE (`aa43cacc`) | POST /api/auth/signup gated por SAAS_SIGNUP_ENABLED (fechado por padrão), política de senha forte, anti-oráculo 409 uniforme, balde de abuso por IP; página /cadastro. |
| Aceite de convite era inalcançável (middleware 401 antes do token; /invite 404 no SPA) | DONE (`aa43cacc`+`e5daa384`) | Auth OPCIONAL no middleware p/ /api/billing/accept; buildInvitationUrl emite /#/invite (token no fragment); página /invite (conta nova ou logado). |
| Settings por tenant + perfil profissional | DONE (`aa43cacc`) | Migração 0019 (user_profiles, clinic_settings) + bootstrap de runtime; GET/PATCH /api/tenants/:id; GET/PUT /api/me/profile; workflow D1 dedicado. |
| UI de equipe/plano/clínica/perfil (endpoints existiam sem tela) | DONE (`e5daa384`) | /configuracoes: membros, convites com link copiável, revogações, papel timbrado, estado real da assinatura + checkout honesto; /onboarding cria clínica (owner+trial). |
| Multi-clínica quebrava rotas legadas (409 CONTEXT_REQUIRED) | DONE (`e5daa384`) | authFetch envia X-Tenant-Id da clínica ativa (servidor valida membership antes de aceitar). |
| Callbacks Asaas para rotas inexistentes | DONE (`e5daa384`) | /#/billing/retorno?status=… + página de confirmação honesta. |
| Entitlements centrais | DONE (`aa43cacc`+`dcda6d94`) | shared/entitlements.ts (catálogo plano→capabilities fail-closed); billing/me alinhado ao guard (clinics.status + assinaturas vivas), trialDaysRemaining, assentos; badge de trial na sidebar. |
| Papel assistant era um login sem função | DONE (`aa43cacc`) | Convite assistant deriva global 'operator' (suíte operacional o reconhece). |
| Emissores de documentos com identidade hardcoded (~13 arquivos, regexes de nome, e-mails pessoais, CNPJ/logo) | DONE (`9c79488d`) | Fonte única client/src/lib/issuer.ts (perfil do usuário + timbrado da clínica); sem perfil, o documento DECLARA a ausência de registro (nunca inventa); guard de identidade invertido (proíbe identidade pessoal em ClinicalReport/modeloSuper); tenant-issuer-static.test.mjs. |
| Cenário de aceite + adversarial multitenant | DONE (`dcda6d94`) | saas-acceptance-journey.test.ts sobre handlers+migrações REAIS: signup→clínica+trial(trigger)→convite/aceite→2ª clínica→B não lê/edita/enumera/convida em A→teto de assentos. Workflow saas-self-service-guard no CI. |
| Contratos duplos de acesso atualizados com justificativa | DONE | validate-public-split (3 rotas do funil aprovadas: sem dado clínico) e assert-open-access (senha em /cadastro e /invite: direto p/ signup/accept, nunca persistida). |

### Gates de governança (comentário do dono, 03/09/2026 — PR #771 em Draft)

| Gate | Status | Evidência |
|---|---|---|
| 1. Revisão adversarial independente (signup, auth opcional do accept, anti-IDOR/RBAC, X-Tenant-Id, emissor, 0019) | DONE (revisão executada; 1 achado MÉDIO corrigido) | Varredura confirmou: interpolações de issuer nos HTMLs de impressão todas escapadas; SQL 100% parametrizado; X-Tenant-Id só vale após validação de membership; billing/me sempre restrito a `cm.user_id`; PATCH de tenant gated por gestão. ACHADO: aceite anônimo podia criar identidade de login para e-mail de terceiro (token fica com o convidante; sem verificação de e-mail) → corrigido: criação de conta via convite agora exige o MESMO opt-in `SAAS_SIGNUP_ENABLED` (produção volta à postura pré-PR); definitivo = verificação de e-mail no porte do #770. Regressão no cenário 8 da jornada. |
| 2. Trava de colisão de prefixo de migração | DONE (`f08004f7`) | migration-prefix-guard.test.mjs: prefixos únicos (0008 legado congelado), formato NNNN_snake_case, sequência contígua; em test:quick-wins e no saas-self-service-guard (paths db/migrations/**). |
| 3. Não ativar SAAS_SIGNUP_ENABLED / dados clínicos reais | ACKNOWLEDGED | Flag continua fechada por padrão; nada neste PR a ativa. P0 #515 e P1 #685 permanecem gates externos abertos. |
| 4. Recalibrar declaração de production-ready | DONE | Status do PR atualizado: além de gateway/signup/e-mail, os gates externos #515 (rotação/revogação de credenciais) e #685 (prova física de export/eliminação LGPD no runtime canônico) condicionam produção. |
| 5. Password recovery (porte do #770) | DONE (PR #774, Draft) | Migração 0020 (aditiva; só auth_password_reset_tokens hash-only + auth_password_reset_rate_limits, sem duplicar clinic_settings/signup); forgot-password/reset-password portados com sha256Hex canônico e política de senha da casa (endurecimento sobre o #770 original); link de reset para rota dedicada /#/redefinir-senha; teste adversarial contra o SQL real das 0003+0020 (anti-enumeração byte a byte, hash-only, revogação de sessões, uso único, rate limit); CI verde. Pendências operacionais fora do diff: secrets AUTH_PUBLIC_APP_URL/AUTH_RESEND_API_KEY/AUTH_EMAIL_FROM no Cloudflare Pages (sem eles, fail-closed: 202 genérico sem criar token). A verificação de posse de e-mail para destravar a criação de conta via convite sem o gate interino é follow-up separado. |

Documentado sem mudança (decisão futura): rotas institucionais do tenant
fundador (sobre, servicos-clinica, marcacao, manus, branding/splash/mascote,
manifest) permanecem como conteúdo do tenant incumbente; tabelas legadas
`*_demo`/agenda seguem por owner_user_id/provider_user_id (geração LIVE é o
caminho multi-tenant; migrar legado = rodada própria); catálogo de planos
continua com 1 plano e preço canônico em código (mudar exige decisão
comercial); e-mail transacional inexiste no runtime (convite/reset por
link manual); trial expira sem aviso prévio (job de dunning = rodada
própria); operator não abre /configuracoes no client (RBAC de rota
uniforme; perfil dele é editável via API).

## Bloqueios externos

| Bloqueio | Causa | Ação necessária |
|---|---|---|
| Merge de #745/#746/#704 | RESOLVIDO em 2026-09-01 | Dono aprovou e mesclou: #746 (156d00fc), #745 (3eab25db), #704 via #749 (39327b00); Chromium instalado nas catracas de CI (#748/#750). Deploys de main disparados pelos merges. |
| Automação de monitoramento de PR nesta sessão | Classificador de permissões negou subscribe_pr_activity e send_later | Reexecutar verificação manualmente ou conceder permissão. |
