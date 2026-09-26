# Implementation Ledger — auditoria contínua

Retomável: em caso de interrupção, ler este arquivo + `git diff` + os PRs
abertos citados. Baseline desta sessão: `main@21b4803`. Branch de trabalho:
`claude/code-audit-improvements-q48pdz` (PR #745). Complementa a matriz de
reconciliação do Codex em `2026-08-29-pr-reconciliation.md` (PR #746).

Convenção de status: `DONE` (corrigido, testado, com evidência) ·
`IN_PROGRESS` · `BLOCKED` (com causa e ação externa) · `TODO` (priorizado).

## P0 — segurança, isolamento, risco clínico

| Item                                                                   | Status                   | Evidência / próximo passo                                                                                                              |
| ---------------------------------------------------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| billing/accept permitia anexar conta alheia à clínica do convidante    | DONE (PR #745)           | Fix + validação: `saas-billing-*` e `live-tenant-isolation-adversarial` verdes; check "Billing server-side attacks" verde no CI do PR. |
| Express requireAuth confiava em claims obsoletas do JWT (papel/ativo)  | DONE (PR #745)           | Releitura do banco por request; `test:quick-wins` verde local e "Build & Test" verde no CI.                                            |
| must_change_password não bloqueava rotas clínicas no Express           | DONE (PR #745)           | Middleware espelha PASSWORD_CHANGE_ALLOWED_PATHS do Cloudflare; regressões de auth verdes.                                             |
| Access tokens Express sem sid → logout/reuse não revogava access token | DONE (PR #745)           | Coluna refresh_tokens.session_id + checagem de família em requireAuth; `express-auth-race-regression` verde.                           |
| /api/send-report como relay de e-mail para qualquer profissional       | DONE (PR #745)           | Destinatário custom restrito a admin; `quick-wins-static` verde.                                                                       |
| Relatos de ideação suicida invisíveis ao Notes engine                  | DONE (PR #745)           | Tópico risco_autolesao_suicidio + seção não truncável; `test:notes` verde.                                                             |
| authFetch anexava Bearer a URL de terceiro                             | DONE (PR #745)           | Checagem de origem; `auth-client-races` verde.                                                                                         |
| Rate limit Cloudflare aceitava X-Forwarded-For                         | DONE (PR #745)           | Só CF-Connecting-IP; `cloudflare-auth-middleware` verde.                                                                               |
| E2E identity hardening (PR #704, autoria anterior)                     | DONE (mesclado via #749) | Suítes dedicadas validadas localmente nesta auditoria; conteúdo reconciliado na main como #749 em 2026-09-01.                          |

## P1 — pipeline, fluxos principais, persistência

| Item                                                                          | Status         | Evidência / próximo passo                                                                                                                                                                                                                                                                                                                                                                       |
| ----------------------------------------------------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CI do PR #745 vermelho: catraca de design (216 > 212)                         | DONE           | Causa: 4× `#000` nas máscaras de fade de sidebar-v13.css (o gate conta hex/rgb). Troca por keyword `black` (idêntico em máscara alpha); `audit:design` local = 212 ✓.                                                                                                                                                                                                                           |
| CI do PR #745 vermelho: Lighthouse actionableCls em /#/caa e /#/espasticidade | DONE           | Causa-raiz: matcher `isFixedNavigationShift` exigia `aside > nav#sidebar-nav` filho direto; o wrapper np-sidebar-scroll quebrou a exclusão deliberada (política pré-existente: crescimento interno da sidebar fixa não move conteúdo clínico). Matcher reparado preservando a intenção; `audit:lighthouse` completo reexecutado localmente com Chromium real — todas as rotas dentro do limite. |
| billing/webhook gravava amount_cents=0 em CHECKOUT_PAID                       | DONE (PR #745) | Fallback para amount_cents do checkout; suítes de billing verdes.                                                                                                                                                                                                                                                                                                                               |
| Determinismo do inventário diário (autoria Codex, PR #746)                    | VALIDATED      | Regressão de bytes+SHA-256 verde localmente; e2e Missão Saúde com Chromium real + axe verde (lacuna do ambiente Windows do Codex fechada).                                                                                                                                                                                                                                                      |
| Fidelidade tela→PDF GenericScale (autoria Codex, PR #746)                     | VALIDATED      | `test:scale-responses` + `test:interactive` (2.387 checks) verdes; `clean()` idempotente, sem mudança de comportamento.                                                                                                                                                                                                                                                                         |

## P2/P3 — parciais, UX, consolidação

| Item                                                              | Status                           | Evidência / próximo passo                                                                                                                                                                                                                                                                                                      |
| ----------------------------------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Sidebar desorganizada (3 camadas CSS com !important em guerra)    | DONE (PR #745)                   | Fonte única sidebar-v13.css; screenshots Playwright desktop claro/escuro + drawer mobile; e2e responsive-shell e scroll-continuity verdes no CI do PR.                                                                                                                                                                         |
| 25 PRs paralelos sem plano de integração                          | DONE (análise)                   | Matriz do Codex validada e publicada (PR #746) com adendo de supersessão (#745 cobre parte de #732 e o escopo de sidebar de #713).                                                                                                                                                                                             |
| Cadeia SaaS #721→#723→#724→#725 + #726 (schemas)                  | TODO                             | REIMPLEMENT por domínio conforme matriz; exige testes IDOR de duas clínicas antes de qualquer adoção. Não iniciado nesta sessão.                                                                                                                                                                                               |
| #710 (perf reflows) e #733 (ESLint)                               | DONE (análise — reclassificados) | Evidência 2026-09-01: ambos baseados em main antiga; diff real vs main atual reverteria trabalho integrado (#733 = 1.181 arquivos/−252.957 linhas; #710 = 218/−21.363). #733 obsoleto (lint da main já zera com --max-warnings=0); de #710, no máximo cherry-pick dos 2 commits de memoização do laudo após validação isolada. |
| #728 (monólito), #734 (artefatos manuais), #716/#717 (duplicatas) | TODO                             | Fechar somente após substitutas mescladas (regra 1.4 da matriz).                                                                                                                                                                                                                                                               |

## Rodada 2026-09-01 — bugs e consolidação de funções (base `main@bfd78218`)

Branch reiniciada de main após merge de #745/#746/#749. Três frentes de
auditoria (duplicação, worker LGPD, Secretaria/booking público).

| Item                                                                                                                                                                                                                                        | Status                    | Evidência / próximo passo                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Helpers duplicados entre rotas Cloudflare (json/jsonResponse ×15, sha256Hex ×3, boundedText/clean ×3, readJsonBody ×2, nowInProviderTimezone ×2), shared (clamp de query clínica Express×CF) e client (dateStamp ×4, esc/escHtml fracos ×2) | DONE (`0b0d91d8`)         | Fontes únicas: `functions/api/_request.ts`, `auth/_crypto`, `operations/_core`, `shared/clinical-core.ts` (clampClinicalEventQueryDays/parseClinicalEventTypesParam), `client/src/lib/printDocument.ts` (dateStamp), `@/lib/htmlEscape`. 28 arquivos, −279/+122; tsc, lint e suítes citadas no commit verdes. Variante de json de boaconsulta/import mantida local de propósito (headers extras). |
| Worker LGPD: claim × rejeição concorrente deixava job zumbi 'processing' executando export de request rejeitada (ALTO)                                                                                                                      | DONE (`a027715f`)         | Claim exige EXISTS(request approved/processing) + releitura pós-promoção com liberação `failed/REQUEST_STATE_CHANGED`. Regressão: `tests/unit/lgpd-worker-race-regressions.test.ts` cenário 1.                                                                                                                                                                                                    |
| Worker LGPD: conclusão × rejeição concorrente commitava job 'completed' com evidência de artefato que o executor apaga (prova fantasma, ALTO)                                                                                               | DONE (`a027715f`)         | completeExportJob/completeDeletionJob guardados por "request ainda processing" dentro do batch. Regressão: cenário 2.                                                                                                                                                                                                                                                                             |
| Worker LGPD: ack perdido após commit da conclusão destruía o artefato registrado no ledger (TOCTOU)                                                                                                                                         | DONE (`a027715f`)         | `confirmCompleted` (isExportJobCompletedWithEvidence) reconsulta o ledger antes do delete; falha genuína continua removendo artefato + EXPORT_COMPLETION_FAILED. Regressões: cenários 3/3b.                                                                                                                                                                                                       |
| Evidência de aceite público existia só na migração 0016; o endpoint /api/public-booking cria schema em runtime → banco sem migração gravava agendamento/waitlist sem prova de aceite (ALTO)                                                 | DONE (`39463d1a`)         | `ensureOperationsHardeningSchema` espelha os objetos da 0016 (idempotente). Regressão pelo caminho de produção: `tests/unit/operations-consent-evidence-runtime.test.ts` (falha comprovada no bootstrap pré-fix; inclui guarda anti-drift de versão/hash do aviso).                                                                                                                               |
| Evento `clinical.read` atribuído à clínica do header x-tenant-id enquanto os handlers GET servem `?clinicId=` → leitura de B auditada na clínica A (MÉDIO)                                                                                  | DONE (`6e3eeb3e`)         | `clinicalLiveAuditClinicId` prefere a clínica efetivamente servida (validada pelo handler; só sucesso é auditado), fallback ao header. Regressões em `live-read-audit-policy.test.ts`.                                                                                                                                                                                                            |
| Hub de integrações fingia sucesso de iframe bloqueado por X-Frame-Options (onLoad dispara mesmo bloqueado) e o timer de 10s rebaixava frame carregado para "timeout" (MÉDIO)                                                                | DONE (`54754608`)         | `resolveFrameLoadStatus` (@/lib/frameStatus): "ready" só com documento legível; cross-origin vira "unverified" com aviso e saída externa; timer só promove loading→timeout. Regressão: `manus-frame-honest-status.test.ts`.                                                                                                                                                                       |
| Token de gestão do agendamento público persistido em sessionStorage (`neuroped:booking-token`) em /agendar (BAIXO)                                                                                                                          | DOCUMENTED                | Tradeoff deliberado: token já é exibido na tela, escopo = 1 agendamento, vida = aba. Remover quebraria a gestão pós-reload em dispositivo do responsável. Decisão de produto: manter; revisitar se surgir uso em dispositivo compartilhado de recepção.                                                                                                                                           |
| Divergência de preço/regras entre /marcacao (R$ 800 + caução R$ 150, política publicada da secretaria) e /agendar (preço do serviço no D1) (BAIXO)                                                                                          | BLOCKED (decisão do dono) | Conteúdo de negócio, não bug de código: as duas rotas descrevem fluxos distintos (BoaConsulta+secretaria vs agenda própria). Unificar preço exige decisão do proprietário sobre qual fonte é canônica.                                                                                                                                                                                            |
| Trigger de consentimento de waitlist dispara em qualquer INSERT (não só fluxo público)                                                                                                                                                      | DOCUMENTED                | Risco latente apenas se nascer fluxo interno de waitlist; comportamento herdado da migração 0016 e espelhado no bootstrap para não divergir. Ao criar fluxo interno, condicionar o trigger a uma coluna `source`.                                                                                                                                                                                 |
| Consolidações menores restantes da matriz (#8/#9: `bytesEqual` local do executor, variantes de `cleanText`)                                                                                                                                 | TODO                      | Baixo impacto; `bytesEqual` tem nota de timing já registrada (comparação não-constante aceitável: compara ciphertext readback, não segredo).                                                                                                                                                                                                                                                      |

## Rodada 2026-09-02 — transformação SaaS (base `main@27093f25`)

Mandato: "transformação cirúrgica em SaaS real" — preservar 100% do valor
clínico, fechar o funil comercial multiusuário. Auditoria em 4 frentes
(auth, tenancy/RBAC, pressupostos single-user, billing) concluiu: backend
SaaS ~75% pronto (memberships 5 papéis, triggers de último owner, trial
por trigger, entitlements, LGPD), produto 0% (sem signup, /invite 404,
zero UI de equipe/plano/settings, emissores de documentos hardcoded).

| Item                                                                                                          | Status                       | Evidência                                                                                                                                                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0: /api/send-report caía numa caixa pessoal fixa (conteúdo clínico de qualquer tenant)                       | DONE (`aa43cacc`)            | Fallback = e-mail do próprio profissional autenticado.                                                                                                                                                                                                                          |
| Signup self-service                                                                                           | DONE (`aa43cacc`)            | POST /api/auth/signup gated por SAAS_SIGNUP_ENABLED (fechado por padrão), política de senha forte, anti-oráculo 409 uniforme, balde de abuso por IP; página /cadastro.                                                                                                          |
| Aceite de convite era inalcançável (middleware 401 antes do token; /invite 404 no SPA)                        | DONE (`aa43cacc`+`e5daa384`) | Auth OPCIONAL no middleware p/ /api/billing/accept; buildInvitationUrl emite /#/invite (token no fragment); página /invite (conta nova ou logado).                                                                                                                              |
| Settings por tenant + perfil profissional                                                                     | DONE (`aa43cacc`)            | Migração 0019 (user_profiles, clinic_settings) + bootstrap de runtime; GET/PATCH /api/tenants/:id; GET/PUT /api/me/profile; workflow D1 dedicado.                                                                                                                               |
| UI de equipe/plano/clínica/perfil (endpoints existiam sem tela)                                               | DONE (`e5daa384`)            | /configuracoes: membros, convites com link copiável, revogações, papel timbrado, estado real da assinatura + checkout honesto; /onboarding cria clínica (owner+trial).                                                                                                          |
| Multi-clínica quebrava rotas legadas (409 CONTEXT_REQUIRED)                                                   | DONE (`e5daa384`)            | authFetch envia X-Tenant-Id da clínica ativa (servidor valida membership antes de aceitar).                                                                                                                                                                                     |
| Callbacks Asaas para rotas inexistentes                                                                       | DONE (`e5daa384`)            | /#/billing/retorno?status=… + página de confirmação honesta.                                                                                                                                                                                                                    |
| Entitlements centrais                                                                                         | DONE (`aa43cacc`+`dcda6d94`) | shared/entitlements.ts (catálogo plano→capabilities fail-closed); billing/me alinhado ao guard (clinics.status + assinaturas vivas), trialDaysRemaining, assentos; badge de trial na sidebar.                                                                                   |
| Papel assistant era um login sem função                                                                       | DONE (`aa43cacc`)            | Convite assistant deriva global 'operator' (suíte operacional o reconhece).                                                                                                                                                                                                     |
| Emissores de documentos com identidade hardcoded (~13 arquivos, regexes de nome, e-mails pessoais, CNPJ/logo) | DONE (`9c79488d`)            | Fonte única client/src/lib/issuer.ts (perfil do usuário + timbrado da clínica); sem perfil, o documento DECLARA a ausência de registro (nunca inventa); guard de identidade invertido (proíbe identidade pessoal em ClinicalReport/modeloSuper); tenant-issuer-static.test.mjs. |
| Cenário de aceite + adversarial multitenant                                                                   | DONE (`dcda6d94`)            | saas-acceptance-journey.test.ts sobre handlers+migrações REAIS: signup→clínica+trial(trigger)→convite/aceite→2ª clínica→B não lê/edita/enumera/convida em A→teto de assentos. Workflow saas-self-service-guard no CI.                                                           |
| Contratos duplos de acesso atualizados com justificativa                                                      | DONE                         | validate-public-split (3 rotas do funil aprovadas: sem dado clínico) e assert-open-access (senha em /cadastro e /invite: direto p/ signup/accept, nunca persistida).                                                                                                            |

### Gates de governança (comentário do dono, 03/09/2026 — PR #771 em Draft)

| Gate                                                                                                              | Status                                             | Evidência                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Revisão adversarial independente (signup, auth opcional do accept, anti-IDOR/RBAC, X-Tenant-Id, emissor, 0019) | DONE (revisão executada; 1 achado MÉDIO corrigido) | Varredura confirmou: interpolações de issuer nos HTMLs de impressão todas escapadas; SQL 100% parametrizado; X-Tenant-Id só vale após validação de membership; billing/me sempre restrito a `cm.user_id`; PATCH de tenant gated por gestão. ACHADO: aceite anônimo podia criar identidade de login para e-mail de terceiro (token fica com o convidante; sem verificação de e-mail) → corrigido: criação de conta via convite agora exige o MESMO opt-in `SAAS_SIGNUP_ENABLED` (produção volta à postura pré-PR); definitivo = verificação de e-mail no porte do #770. Regressão no cenário 8 da jornada.                                                                                                                                                                                    |
| 2. Trava de colisão de prefixo de migração                                                                        | DONE (`f08004f7`)                                  | migration-prefix-guard.test.mjs: prefixos únicos (0008 legado congelado), formato NNNN_snake_case, sequência contígua; em test:quick-wins e no saas-self-service-guard (paths db/migrations/\*\*).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 3. Não ativar SAAS_SIGNUP_ENABLED / dados clínicos reais                                                          | ACKNOWLEDGED                                       | Flag continua fechada por padrão; nada neste PR a ativa. P0 #515 e P1 #685 permanecem gates externos abertos.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 4. Recalibrar declaração de production-ready                                                                      | DONE                                               | Status do PR atualizado: além de gateway/signup/e-mail, os gates externos #515 (rotação/revogação de credenciais) e #685 (prova física de export/eliminação LGPD no runtime canônico) condicionam produção.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 5. Password recovery (porte do #770)                                                                              | DONE (PR #774, Draft)                              | Migração 0020 (aditiva; só auth_password_reset_tokens hash-only + auth_password_reset_rate_limits, sem duplicar clinic_settings/signup); forgot-password/reset-password portados com sha256Hex canônico e política de senha da casa (endurecimento sobre o #770 original); link de reset para rota dedicada /#/redefinir-senha; teste adversarial contra o SQL real das 0003+0020 (anti-enumeração byte a byte, hash-only, revogação de sessões, uso único, rate limit); CI verde. Pendências operacionais fora do diff: secrets AUTH_PUBLIC_APP_URL/AUTH_RESEND_API_KEY/AUTH_EMAIL_FROM no Cloudflare Pages (sem eles, fail-closed: 202 genérico sem criar token). A verificação de posse de e-mail para destravar a criação de conta via convite sem o gate interino é follow-up separado. |

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

## Rodada 2026-09-26 — RBAC do tenant por permissão (base `main@9b3a300`)

Mandato: "transformação cirúrgica em SaaS comercializável". Auditoria de
partida confirmou que tenancy, memberships, convites, onboarding, billing,
entitlements, lifecycle e LGPD já existem (0009–0025); a lacuna estrutural
mais barata de fechar sem risco era a CAMADA 4: autorização do tenant era
comparação de nome de papel (`role === "owner"`, `["owner","clinic_admin"].includes`,
`m.role IN (...)` em SQL) espalhada por 6 rotas.

| Item | Status | Evidência |
| ---- | ------ | --------- |
| Catálogo central papel → permissão (`shared/permissions.ts`, 11 permissões, fail-closed) | DONE | `tests/unit/tenant-permissions.test.ts`: matriz literal 5×11, papéis globais/desconhecidos sem permissão, equivalência com a semântica anterior de cada porta |
| Rotas perguntam permissão (`membershipHas`/`roleHasPermission`), não papel: checkout, convites, membros, lifecycle, export, métricas | DONE | Trava estática no mesmo teste: comparação literal de papel do ator em `functions/api/{tenants,billing,live,tenant}` reprova |
| `GET /api/tenants/:id` devolve `permissions` efetivas (vazio com clínica inativa) | DONE | Asserção no teste; `canManage` preservado para o cliente atual |

Comportamento de acesso inalterado (provado pela equivalência). Rollback:
reverter o commit; nenhuma migração envolvida.

Decisão registrada, não tomada: `clinic_admin` mantém `billing.manage` (é o
comportamento atual). Tirar cobrança do admin é mudança comercial: uma linha
em `GRANTS` + a linha correspondente da matriz do teste.

Achado lateral, não corrigido (fora do escopo): `tests/unit/saas-membership-owner-regression.test.mjs`
falha já na base (`9b3a300`) e não é chamado por nenhum script nem workflow.

Próximas camadas por ordem de dependência (lacunas reais, não refeitas):
tabelas legadas `patients_demo`/agenda ainda por `owner_user_id` (tenantizar
o cliente zero exige migração própria com prova de preservação); cliente
consumir `permissions` em vez de `canManage`/papel; auditoria de tenant
(`audit.read`) sem rota tenant-scoped; feature flags por tenant inexistentes.

### Camadas 2, 3 e 4 — fechadas na mesma branch, um commit por frente

Base: os dois commits do catálogo (acima) reaplicados sobre `main@8ee31b2`.
Cada frente tem escopo único, teste próprio (em `test:quick-wins` e no
workflow `saas-phase1-foundation`) e rollback por reversão do commit.

| Camada | Entrega | Evidência | Rollback |
| ------ | ------- | --------- | -------- |
| 2. Tela por permissão | `configuracoes.tsx` lê `GET /api/tenants/:id` uma vez e a lista `permissions` decide as abas (Equipe = `team.manage`, Plano = `billing.manage`, Atividade = `organization.metrics.read`) e a edição da clínica (`organization.manage`). Resposta sem lista = sem permissão; link profundo para aba invisível cai em Perfil. | Trava estática em `tenant-permissions.test.ts`: sem `canManage`, sem comparação de papel, toda permissão declarada existe no catálogo | reverter; sem migração |
| 3. Auditoria da clínica | Permissão nova `audit.read` (owner, clinic_admin). `GET /api/tenants/:id/audit` lê `saas_audit_log` com `clinic_id = ?` na contagem e na página, nunca lista linha sem clínica, 403 uniforme para papel sem permissão, clínica alheia, inexistente ou inativa; filtros do parser da trilha de plataforma com curinga de LIKE escapado. Aba Auditoria na tela. | `tenant-audit-log.test.ts` com D1 sintético: isolamento, 403 uniforme, filtros, paginação, metadata malformado | reverter; sem migração (tabela e índice desde a 0009) |
| 4. Feature flags por clínica | Catálogo `shared/clinicFeatures.ts` (`remote_intake`, `remote_scales`; padrão LIGADO porque são recursos que já operavam; chave desconhecida = off). Migração 0026 `clinic_feature_flags` + bootstrap de runtime (política da 0019) + preservada no purge LGPD. `GET/PATCH /api/tenants/:id/features` (leitura por membro, escrita por `organization.manage`, tudo-ou-nada, auditoria `clinic_feature_update` no mesmo batch). Portas: criação de convite remoto → 403 `FEATURE_DISABLED`; superfície pública → 410, só depois do token válido. Aba Recursos na tela. Workflow `clinic-feature-flags-d1` aplica a 0026 em main com preflight idempotente. | `clinic-feature-flags.test.ts` ponta a ponta contra o SQL real das 0021/0023/0026: catálogo, rota, auditoria, porta na criação e na superfície pública, vizinha intacta, tabela ausente = padrões | reverter; `DROP TABLE clinic_feature_flags` devolve os padrões (tudo ligado) |

Decisões que não são óbvias:

- **Flag opt-out, padrão ligado, tabela ausente = padrões.** Cada flag existente representa um recurso que já operava; a única semântica que preserva produção entre o deploy do código e a aplicação da 0026 é "ninguém desligou nada ainda". Só o erro `no such table` cai nesse caminho; qualquer outro erro propaga. Flag nova que nasça desligada precisa de decisão explícita no catálogo e na matriz do teste.
- **Superfície pública consulta a flag depois do token válido.** Antes, um 410 por flag responderia diferente de um 404 por token inválido e viraria oráculo de existência de convite. O teste trava a ordem.
- **Recusa de PATCH é inteira.** Uma chave fora do catálogo ou um valor não booleano derruba o pedido todo; não se grava metade.
- **`audit.read` é metadado, não conteúdo.** A trilha devolve ator, ação, alvo e metadados já gravados; nunca lê tabela clínica. Nome do ator vem de `users.name` (equipe), não de titular.

### Camada 1 — migração do legado (NÃO executada; PR própria)

Inventário: `patients_demo` e dependentes (`*_demo`) por `owner_user_id`
(0002); suíte operacional inteira por `provider_user_id` (0007: providers,
serviços, disponibilidade, `appointments`, bloqueios; 0008 hardening; 0013
billing provider). Tudo isso serve o cliente zero hoje, fora do modelo de
clínicas, e o purge LGPD já declara `appointments` inalcançável (#783).

Plano registrado para a PR própria, na ordem em que precisa acontecer:

1. **Prova de preservação antes de qualquer escrita.** Script read-only que
   conta, por `owner_user_id`/`provider_user_id`, linhas e digest por tabela,
   e o mapeamento usuário → clínica (membership ativa única; ambiguidade
   bloqueia). Saída determinística, comparável antes/depois.
2. **Migração aditiva.** `clinic_id` NULL nas tabelas legadas + índice;
   backfill por `UPDATE ... SET clinic_id = (membership única) WHERE clinic_id
   IS NULL`, contando linhas afetadas e falhando fechado se sobrar NULL.
   Nenhum DROP, nenhuma renomeação.
3. **Predicado duplo por um ciclo.** Rotas legadas passam a exigir
   `owner_user_id = ? AND clinic_id = ?` (tenant no predicado final, como a
   regra do AGENTS.md); só depois de um ciclo verde o predicado de dono deixa
   de ser autoridade.
4. **Purge LGPD.** `appointments` sai de `UNREACHABLE_PATIENT_TABLES` quando
   passar a ter `clinic_id` e vínculo verificável com `live_patients`.
5. **Rollback declarado.** A coluna aditiva pode ficar; o predicado volta
   a ser só por dono revertendo o commit de rotas.

Bloqueio para executar: precisa de leitura do D1 de produção (contagens e
mapeamento usuário → clínica) e de janela com o dono — não é ação desta
sessão.

## Rodada 2026-09-14 — métricas de produto ausentes (base `main@efad2006`)

Gatilho: relatório estratégico externo (14/09/2026), produzido SEM acesso ao
código, marcando dezenas de itens como "não especificado" — DAU, MAU,
retenção, funil de ativação entre eles. Conferido item a item contra o
código antes de agir (skill de triagem de relatório de outro agente): a
maior parte do relatório estava desatualizada em relação a este repositório
(stack, billing, LGPD, testes e CI já existiam e estavam mal identificados
pelo relatório por falta de acesso ao código). Um ponto, porém, se confirmou
real.

| Achado                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Correção                                                                                                                                                                                                                                        | Estado                         |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| Não havia como responder "quantas contas/clínicas usam o produto, e com que frequência". Os primitivos já existiam espalhados — `users.last_login_at` (atualizado a cada login via `registerSuccessfulLogin`), `created_at`, `email_verified_at` (0024), `clinics.created_at`, `clinic_memberships` — mas nada os agregava. Cinco tabelas de auditoria distintas já existiam (`audit_logs`, `operations_audit_log`, `saas_audit_log`, `saas_audit_events`, `public_submission_audit_log`); nenhuma pensada para produto, nenhuma agregada em lugar algum | `GET /api/admin/analytics-summary`: DAU/WAU/MAU, novas contas/clínicas, funil de ativação (assinou → verificou e-mail → possui clínica) e proxy de retenção de 30 dias — tudo agregado das colunas já existentes, sem migração, sem tabela nova | 🟡 #879 pronto para revisão |

### Por que não um sexto ledger

Criar uma tabela de eventos paralela fragmentaria "onde eu olho para saber o
que aconteceu" em dois lugares — o oposto da doutrina de fonte única já
seguida no resto do produto (ex.: o coletor de exportação LGPD extraído para
um módulo único em #782, em vez de duplicado). Os primitivos que já existem
respondem a pergunta que o relatório levantou; faltava só agregá-los.

### Decisões que não são óbvias

- **`admin` e `reader` (sentinela E2E) excluídos por role, não por e-mail.** A
  sentinela E2E loga em todo smoke test; se contasse, infuncionaria como
  ativação sozinha. Excluir por `role` evita comparar e-mail contra variável
  de ambiente dentro da métrica.
- **Retenção é proxy declarado, não medição real.** `last_login_at` guarda só
  o login mais recente, não histórico. "Ainda ativo 30 dias depois" aqui
  significa "o último login registrado aconteceu 30+ dias após o cadastro" —
  a métrica honesta que a coluna permite, documentada como tal na própria
  resposta da rota (`retentionProxy.note`), não a métrica ideal que exigiria
  um ledger de eventos.
- **Coorte de retenção é fixa em 30–60 dias atrás.** Uma coorte mais recente
  ainda não teve os 30 dias completos decorrer (right-censoring); incluí-la
  subestimaria retenção por medir gente que ainda não teve chance de voltar.

### O que este ciclo NÃO entrega

Instrumentação de funil PRÉ-cadastro (landing → início do cadastro) exigiria
um endpoint público novo de ingestão de eventos, com seu próprio threat
model de rate limiting e anti-abuso — não emendado aqui. Também não cobre o
app família (Portal Família / "Vou Falar"), que é produto e possivelmente
repositório distinto do desta SaaS clínica; o relatório externo trata
predominantemente daquele produto.

## Rodada 2026-09-06 — rotação da chave de PII operacional (base `main@7cc8841f`)

Achado de auditoria da #575, encontrado lendo o código antes de alterar
qualquer coisa. A issue pedia duas coisas; uma estava feita sem registro e a
outra não existia.

| Achado                                                                                                                                                                                                                                                                                                                                  | Correção                                                                                                                                                                     | Estado                      |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| O fallback `OPERATIONAL_DATA_KEY \|\| NEUROPED_JWT_SECRET` já estava removido e guardado por teste estático, mas a #575 seguia aberta como se nada tivesse sido feito                                                                                                                                                                   | Reconciliada com evidência de código (`_core.ts`, `booking-adapter.ts:138`, `operations-integration-static.test.mjs:157,160`)                                                | ✅ documentado              |
| A rotação da chave era **possível, não executável**: registros `v1` só migram para `v2` ao serem reescritos, `v1` não registra qual chave o cifrou, e nada contava quantos sobraram — aposentar `OPERATIONAL_DATA_KEY_PREVIOUS` era aposta cujo erro só aparece como `OPERATIONAL_DECRYPT_FAILED` na agenda, depois da chave descartada | `GET /api/admin/operational-crypto`: inventário das 11 colunas de PII operacional por versão e chave citada, sem nunca decifrar, com `previousKeyRetirementSafe` fail-closed | 🟡 #809 pronto para revisão |

### Decisões que não são óbvias

- **Incerteza bloqueia.** v1 remanescente, v2 citando a anterior, envelope não classificável, tabela ausente do schema e keyring quebrado respondem `false` igualmente. A rota autoriza operação irreversível: "não sei dizer" não pode virar "pode aposentar".
- **Tabela ausente ≠ zero linhas.** Entra em `missingTables`. É a mesma doutrina do `decryptText`, que distingue campo vazio de campo ilegível — confundir os dois foi o defeito que o envelope v2 veio corrigir.
- **`keyId` fora do padrão é contado, nunca ecoado.** São bytes arbitrários do banco; ecoá-los faria de uma rota de status um canal de leitura do armazenado.
- **Allowlist congelada de tabela/coluna.** Identificador não pode ser bound parameter; é a allowlist, não sanitização, que torna a interpolação segura. Mantida à mão para que coluna nova de PII exija decisão explícita.

### O que este ciclo NÃO entregou

Migração ativa dos `v1` remanescentes. É mutação em massa sobre PII e merece PR
próprio com rollback próprio. A migração passiva continua acontecendo conforme
registros são reescritos, e agora há como medir o progresso. A #575 fecha com
#809 mesclado **e** `previousKeyRetirementSafe: true` observado contra o D1 de
produção — leitura de produção, não minha para executar.

## Rodada 2026-09-05 — hardening P0/P1 e LGPD operacional (base `main@4188833c`)

Ciclo dirigido pela missão "tornar o NeuroPed vendável". Todo achado abaixo foi
reproduzido antes de corrigido, e toda guarda foi verificada FALHANDO com o
defeito reintroduzido — não apenas passando.

| #   | Achado                                                                                                                                                                                                                                      | Correção                                                                                                                                                                                                                                                  | Estado                      |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| 1   | Descritor remoto se declarava `M-CHAT-R/F` coletando só os 20 itens de triagem, sem entrevista de seguimento — a família respondia sozinha uma tela rotulada como instrumento que o app não executa                                         | Renomeado para `Registro M-CHAT-R`; guarda `check-remote-scale-clinical-truth.mjs` trava a alegação, a ampliação silenciosa da allowlist, a coleta truncada e o vazamento de peso de pontuação                                                            | ✅ #778 mesclado            |
| 2   | `users.email` é `UNIQUE` binário: `Medico@X` e `medico@X` coexistiam. Login comparava `email = ?` (cego para a linha em caixa mista), reset comparava `lower(email) LIMIT 1` (sorteava a conta), signup permitia criar a segunda identidade | Índice único sobre `lower(email)` (0022) com preflight bloqueante; ambiguidade decidida em SQL (`match_count`), fail-closed mesmo sem migração aplicada                                                                                                   | ✅ #779 mesclado            |
| 3   | `POST /api/public-scale` e `/api/public-intake` persistiam dado clínico cifrado sem NENHUMA trilha — os únicos caminhos em que alguém sem conta grava dado clínico                                                                          | `public_submission_audit_log` (0023), tenant-scoped, metadata-only, no MESMO batch da submissão e condicionada a ela; tabela sem coluna capaz de guardar PHI                                                                                              | ✅ #780 mesclado            |
| 4   | `resetBucket` devolvia null sem `CF-Connecting-IP` e o chamador tratava "sem balde" como "pode passar" — alcançar a origem sem o header desligava o rate limiter                                                                            | Balde sentinela compartilhado, sujeito ao mesmo teto: sem bypass e sem derrubar a redefinição inteira                                                                                                                                                     | ✅ #780 mesclado            |
| 5   | Conta de cadastro aberto virava `professional` e criava clínica sem provar posse do e-mail: dava para registrar o endereço de terceiro, virar owner de tenant em nome dele e bloquear o cadastro legítimo                                   | Verificação de posse (0024) com token hash-only, TTL, uso único, vínculo ao endereço da emissão, reenvio anti-enumeração e gate em `POST /api/tenants`. Backfill rotulado `grandfathered_pre_0024` — nenhuma conta nasce marcada como tendo provado posse | ✅ #781 mesclado            |
| 6   | A eliminação LGPD não existia: ledger, política e claim/lease estavam prontos desde a 0017, mas nada apagava e nada chamava as peças                                                                                                        | `executeTenantScopedPurge` + `POST /api/live/governance/run-deletion` + adapter R2 fail-closed; prova RED/BLUE contra o schema real                                                                                                                       | 🟡 #782 pronto para revisão |
| 7   | A exportação LGPD tinha o executor cifrado (`executeEncryptedExport`) desde antes, mas nada o chamava: o único coletor de dados do tenant vivia inline em `tenants/[id]/export.ts`, preso ao teto síncrono de uma resposta HTTP             | Coletor extraído para `tenant/_exportPayload.ts` (com `enforceSyncLimits` opcional) e `POST /api/live/governance/run-export` amarrando claim → coletar → cifrar → concluir; recusa ANTES do claim quando não há bucket privado                            | 🟡 #782 pronto para revisão |

### Duas descobertas do ciclo que só apareceram por rodar contra o schema real

- `live_retention_policies` não tem `patient_id` — é configuração da clínica, não dado do titular; entrou na lista de preservadas.
- `live_export_requests` e `live_deletion_requests` apontam para o titular com `ON DELETE RESTRICT` e são preservadas como evidência: **a própria requisição de eliminação impedia a eliminação**. O ponteiro passou a ser solto no mesmo batch — a requisição sobrevive como prova, e o `patient_id` some, que é o que a eliminação deveria fazer.

### Decisão de autorização não óbvia

`membershipCanManage` exige clínica ativa, mas o purge de escopo de clínica só é elegível com o tenant fechado. Autorização só por membership deixaria o caso que a LGPD mais cobra sem executor possível. Ficou em dois níveis: gestor da clínica ativa faz o escopo de paciente; encerramento de tenant exige papel global admin.

### Pendências declaradas, não escondidas

| Pendência                         | Onde     | Por que não foi fechada                                                                                                                            |
| --------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Follow-Up oficial do M-CHAT-R/F   | #629     | Decisão clínica do responsável: exige definir edição, licença, fonte e normas antes de qualquer código                                             |
| `appointments` fora do purge LGPD | #783     | `patient_id` sem FK para `live_patients`; correlacionar por suposição arriscaria apagar agendamento de outra pessoa                                |
| Bucket R2 privado de exportação   | #685     | Gate de infraestrutura: o código está pronto e recusa com `EXPORT_STORE_NOT_CONFIGURED` sem o binding `LGPD_EXPORT_BUCKET`; não há fallback        |
| Secrets SMTP da entrega autoral   | #800     | Gate de credencial externa: `authorial_scale_delivery.py` falha alto sem `SMTP_*`; nenhum envio ocorreu, nenhum recibo ficou incerto               |
| Secrets de e-mail no Cloudflare   | operação | Sem `AUTH_PUBLIC_APP_URL`/`AUTH_RESEND_API_KEY`/`AUTH_EMAIL_FROM`, com a 0024 em produção, uma conta nova não confirma o e-mail e não cria clínica |
| Credenciais históricas            | #515     | Gate externo: depende de evidência do emissor                                                                                                      |

## Bloqueios externos

| Bloqueio                                      | Causa                                                                | Ação necessária                                                                                                                                                                 |
| --------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Merge de #745/#746/#704                       | RESOLVIDO em 2026-09-01                                              | Dono aprovou e mesclou: #746 (156d00fc), #745 (3eab25db), #704 via #749 (39327b00); Chromium instalado nas catracas de CI (#748/#750). Deploys de main disparados pelos merges. |
| Automação de monitoramento de PR nesta sessão | Classificador de permissões negou subscribe_pr_activity e send_later | Reexecutar verificação manualmente ou conceder permissão.                                                                                                                       |
