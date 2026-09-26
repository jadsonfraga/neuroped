# Evidências da espiral

## S1 (ciclo 1) — go-live nível atestado
- Escopo: `functions/api/admin/go-live.ts` + bloco 7 de
  `tests/unit/go-live-readiness.test.ts` (aditivo; contrato anterior mantido).
- Ambiente: container da sessão, Node do repo, SHA base `e77bbf7`.
- Comandos e resultados (exit 0): `npx tsx tests/unit/go-live-readiness.test.ts`
  (falhou antes da implementação pelo motivo certo; verde depois),
  `npm run check`, `npm run lint`, `npm run test:quick-wins`,
  `npm run test:saas-self-service`.
- Artefato: diff no commit desta PR. Sem segredos: o teste varre a resposta
  contra sentinelas aleatórias, inclusive prefixos.

## Baseline (ciclo 1)
- `test:saas-self-service` verde em `e77bbf7` (log com `[mail] delivery
  failed { status: 403 }` esperado: harness intercepta o provedor).
- Deploy run 1416 (`e77bbf7`) success com verificação de SHA público,
  health autenticado, CORS e login e2e executados.

## S3 (ciclo 3) — inventário Acesso+Comercial e contrato auth/me
- Evidência de cobertura: grep de import direto `functions/api/<handler>`
  em tests/unit, não coincidência de nome.
- auth/me: bloco novo em e2e-refresh-session-guard-regression.test.ts
  (roda em test:auth-bootstrap, dentro de test:quick-wins). Assertiva de
  família revogada vista FALHANDO com a checagem removida do handler.
- Comandos exit 0: suíte estendida isolada, npm run check, npm run lint,
  npm run test:quick-wins.

## S6 (ciclo 4, 2026-09-26) — webhook Asaas bloqueado pelo Bearer global
- Escopo: `functions/api/_middleware.ts` (uma linha em `PUBLIC_API_PATHS`,
  com comentário). O handler já se autentica sozinho
  (`validateAsaasWebhook`, tempo constante, ≥32 chars, fail-closed 503 sem
  segredo) — nada mudou em `functions/api/billing/webhook.ts` para este item.
- Ambiente: container da sessão, Node do repo, HEAD `e1a28ec`.
- Teste novo em `tests/unit/cloudflare-auth-middleware.test.ts` (roda em
  test:quick-wins via test:auth-bootstrap→cloudflare-auth-middleware):
  POST com `asaas-access-token` e sem `Authorization`. Visto FALHANDO antes
  (401 UNAUTHENTICATED) pelo motivo certo; verde depois (200, next() executado).
- Comandos exit 0: `node --import tsx tests/unit/cloudflare-auth-middleware.test.ts`,
  `node --import tsx tests/unit/saas-billing-contract.test.ts`,
  `node --import tsx tests/unit/saas-billing-adversarial.test.ts`,
  `node --import tsx tests/unit/cliente-zero-journey.test.ts`,
  `npm run check`, `npx eslint` nos arquivos tocados.

## S7 (ciclo 4, 2026-09-26) — checkout expirado cancelava assinatura ativa
- Escopo: `functions/api/billing/webhook.ts` (classify/invoiceKind/
  resolveContext/checkoutStatus) + `functions/api/billing/_provider.ts`
  (campo `subscription` no tipo do evento). `CHECKOUT_CANCELED`/
  `CHECKOUT_EXPIRED` passam a atualizar só `billing_provider_checkouts`;
  `PAYMENT_DELETED` vira `webhook_received` (auditado, sem efeito de
  estado); só `SUBSCRIPTION_DELETED`/`SUBSCRIPTION_INACTIVATED` (resolvidos
  por `subscription.id` → `billing_subscriptions.provider_subscription_id`)
  cancelam de forma terminal, até existir rota própria de cancelamento.
- Ambiente: container da sessão, Node do repo, HEAD `e1a28ec` + S6.
- Teste em `tests/unit/saas-billing-adversarial.test.ts`: cenário antigo
  (CHECKOUT_CANCELED cancela um customer em past_due) SUBSTITUÍDO por dois
  cenários — (a) CHECKOUT_EXPIRED não move o customer/subscription para
  fora de past_due, só marca o checkout como `expired`; (b)
  SUBSCRIPTION_DELETED com `subscription.id` real cancela de verdade, e
  pagamento tardio não reabre. Visto FALHANDO contra o código anterior via
  `git stash` isolado (customer virava `canceled` em vez de `past_due`
  continuar); verde com o fix.
- Comandos exit 0: `node --import tsx tests/unit/saas-billing-adversarial.test.ts`,
  `node --import tsx tests/unit/saas-billing-contract.test.ts`,
  `node --import tsx tests/unit/saas-billing-provider.test.ts`,
  `node --import tsx tests/unit/saas-billing-production-wiring.test.mjs`,
  `node --import tsx tests/unit/billing-log-safety.test.mjs`,
  `node --import tsx tests/unit/saas-tenant-lifecycle.test.ts`,
  `node --import tsx tests/unit/cliente-zero-journey.test.ts`,
  `node --import tsx tests/unit/saas-acceptance-journey.test.ts`,
  `node --import tsx tests/unit/saas-self-service.test.ts`, `npm run check`.
- Rollback: reverter os dois arquivos de produção a `e1a28ec` restaura o
  comportamento antigo; nenhuma migração de schema envolvida (nenhum valor
  novo de `kind` foi introduzido em `billing_invoice_events`, justamente
  para não exigir migração — ver comentário no código).

## S8 (ciclo 4, 2026-09-26) — agenda/operações sem clinic_id (OPS-01/OPS-02)
- Escopo: `db/migrations/0026_operations_clinic_scope.sql` (aditiva,
  `clinic_id` nullable + backfill determinístico + índices em 8 tabelas);
  `functions/api/operations/_core.ts` (SCHEMA_STATEMENTS com clinic_id,
  `resolveProviderSoleClinicId`, `getService`/`listAvailableSlots`/
  `enqueueNotification` exigem clinicId explícito); `_access.ts`
  (`operations_audit_log.clinic_id`, `logOperationsAudit`/
  `listOperationsAudit` com clinicId); `index.ts` (todo SELECT/INSERT/UPDATE/
  DELETE do dashboard e das 16 ações do POST repete `clinic_id` no
  predicado); `public-booking.ts` (perfil, horários, reserva, lista de
  espera e avaliação pública resolvem/stampam clinic_id; diretório exclui
  profissional com clínica ambígua).
- Ambiente: container da sessão, Node do repo, HEAD `f8037bd` (S6+S7) + S8.
- Teste novo `tests/unit/operations-tenant-isolation.test.ts` (schema real +
  todas as migrações + handlers reais de operations/public-booking, duas
  clínicas sintéticas, um profissional membro de ambas): serviço, regra,
  bloqueio e consulta (com PHI decifrada) criados na clínica A ficam
  invisíveis e imutáveis a partir da clínica B; auditoria isolada por
  clínica; diretório e reserva pública recusam profissional com clínica
  ambígua. Visto FALHANDO pelo motivo certo contra o código anterior via
  `git stash` isolado dos 4 arquivos de produção (serviço de A aparecia no
  dashboard de B); verde com a correção.
- Comandos exit 0: `node --import tsx tests/unit/operations-tenant-isolation.test.ts`,
  `npm run test:operations` (inclui o teste novo),
  `node --import tsx tests/unit/operations-contract.test.ts`,
  `node tests/unit/operations-integration-static.test.mjs`,
  `node tests/unit/secretaria-marcacao-navigation.test.mjs`,
  `node --import tsx tests/unit/cliente-zero-journey.test.ts`,
  `node --import tsx tests/unit/saas-acceptance-journey.test.ts`,
  `node --import tsx tests/unit/saas-self-service.test.ts`,
  `node --import tsx tests/unit/saas-tenant-lifecycle.test.ts`,
  `node tests/unit/schema-bootstrap-contract.test.mjs`,
  `node tests/unit/migration-prefix-guard.test.mjs`,
  `node tests/unit/workflow-governance.test.mjs`, `npm run check`,
  `npm run lint`, `npm run test:quick-wins` (suíte completa).
- Escopo intencionalmente FORA desta camada (documentado, não escondido):
  `appointment_slot_locks` e os triggers de conflito físico continuam sem
  `clinic_id` (o profissional é o recurso físico, não a clínica); diretório
  público ainda por slug global, não por clínica (S13); `booking_staff_links`
  segue por profissional (OPS-03, não tocado).
- Rollback: reverter os 4 arquivos de `functions/api/{operations/**,
  public-booking.ts}` a `f8037bd` restaura o código anterior; a coluna
  `clinic_id` (migração 0026) é aditiva e pode permanecer no banco sem
  quebrar o código antigo (ele simplesmente a ignora).

## S11 (ciclo 4, 2026-09-26) — conscrição direta de membro sem convite
- Escopo: `functions/api/tenants/[id]/members.ts` (POST): a busca de
  `currentMembership` passa a acontecer antes de qualquer decisão, e um
  único gate (`!target || currentMembership?.active !== 1`) devolve 404
  `MEMBER_NOT_FOUND` — mesmo status e código para e-mail sem conta, conta
  sem membership nesta clínica ou membership desativada. Nenhuma mudança de
  schema; a query de upsert (INSERT...ON CONFLICT DO UPDATE) é a mesma,
  agora só alcançável quando o alvo já é membro ativo.
- Ambiente: container da sessão, Node do repo, HEAD `18799d7` (S8) + S11.
- Teste em `tests/unit/cliente-zero-journey.test.ts`: o owner da CLINICA_AZUL
  (gestor legítimo) tenta inscrever a dona real da CLINICA_VERMELHA
  (`rui@vermelha.test`, conta de verdade, nunca membro de AZUL) via POST
  members com assento disponível (ampliado por SQL só para isolar esta
  prova do teto de assentos, que é contrato à parte). Visto FALHANDO contra
  o código anterior via `git stash` isolado (201 — a conscrição funcionava
  de verdade, sem convite); verde com a correção (404, nenhuma linha criada
  em `clinic_memberships`). Segunda asserção no mesmo bloco: e-mail sem
  conta alguma recebe status e código idênticos ao de conta real não
  membro — fecha o oráculo de enumeração. O cenário pré-existente "owner
  promove a convidada" (papel de quem já é membro) continua verde,
  provando que a mudança de papel de membro ativo não foi afetada.
- Comandos exit 0: `node --import tsx tests/unit/cliente-zero-journey.test.ts`,
  `node --import tsx tests/unit/saas-acceptance-journey.test.ts`,
  `node --import tsx tests/unit/saas-self-service.test.ts`,
  `node --import tsx tests/unit/saas-tenant-lifecycle.test.ts`,
  `node --import tsx tests/unit/saas-phase1-foundation.test.ts`,
  `node --import tsx tests/unit/saas-phase1-hardening.test.ts`,
  `node --import tsx tests/unit/admin-bootstrap-regression.test.ts`,
  `npm run check`, `npx eslint` nos arquivos tocados, `npm run test:quick-wins`
  (suíte completa).
- Rollback: reverter `functions/api/tenants/[id]/members.ts` a `18799d7`
  restaura o comportamento anterior; nenhuma migração envolvida.

## S12 (ciclo 4, 2026-09-26) — export incompleto e purge inseguro (LTB-02)
- Escopo: `functions/api/tenant/_exportPayload.ts` (nova
  `EXPORT_UNCOVERED_CLINIC_TABLES` — as 8 tabelas com `clinic_id` que o
  payload ainda não leva — e `countExportUncoveredRows`; o resultado `ok`
  ganha `complete`/`uncoveredCounts` computados, não mais implícitos);
  `functions/api/tenants/[id]/export.ts` (`complete: collected.complete` no
  manifesto síncrono, com `uncoveredNotExported` nomeando o que falta);
  `functions/api/live/governance/run-export.ts` (auditoria do worker ganha
  `exportComplete`/`uncoveredDomainCount`, metadata-only); `functions/api/
  live/governance/_purge.ts` (purge de escopo `clinic` recusa com
  `EXPORT_MANIFEST_INCOMPLETE:<tabela>` — mesma disciplina fail-closed já
  usada para `UNREACHABLE_PATIENT_TABLES` — enquanto sobrar linha da clínica
  nas 8 tabelas). Nenhuma migração: tudo calculado por COUNT fresco no
  momento do export/purge, nunca de um flag armazenado que pudesse ficar
  velho.
- Ambiente: container da sessão, Node do repo, HEAD `9d4c67d` (S11) + S12.
- Teste em `tests/unit/lgpd-purge-executor.test.ts` (schema real + todas as
  migrações, RED/BLUE sintéticos): novo paciente RED_PATIENT_3 com a cadeia
  clínica inteira (documento, avaliação, intake, escala) prova que o purge
  por CLÍNICA recusa (`EXPORT_MANIFEST_INCOMPLETE:`) sem apagar nada
  enquanto esses dados existirem; só depois de removidos (simulando a
  cobertura futura do export, S12B) o purge por clínica volta a limpar RED
  por completo, com BLUE intocado — cenário 8 original preservado como 8b.
  Visto FALHANDO pelo motivo certo contra o código anterior via `git stash`
  isolado (`corrida.falhas.length` 0 em vez de 1: o purge apagava tudo sem
  checar); verde com a correção. Ajuste de contrato em
  `tests/unit/saas-tenant-lifecycle.test.ts`: a asserção estática
  `complete: true` (fixo) vira `complete: collected.complete` (computado),
  com `doesNotMatch` explícito contra o valor fixo antigo.
- Comandos exit 0: `node --import tsx tests/unit/lgpd-purge-executor.test.ts`,
  `node --import tsx tests/unit/lgpd-run-export-endpoint.test.ts`,
  `node --import tsx tests/unit/lgpd-worker-executor-core.test.ts`,
  `node --import tsx tests/unit/lgpd-worker-foundation.test.ts`,
  `node --import tsx tests/unit/lgpd-run-deletion-endpoint.test.ts`,
  `node --import tsx tests/unit/lgpd-worker-race-regressions.test.ts`,
  `node --import tsx tests/unit/operations-consent-evidence-runtime.test.ts`,
  `node --import tsx tests/unit/saas-tenant-lifecycle.test.ts`,
  `node --import tsx tests/unit/cliente-zero-journey.test.ts`,
  `node --import tsx tests/unit/saas-acceptance-journey.test.ts`,
  `npm run check`, `npx eslint` nos arquivos tocados, `npm run test:quick-wins`
  (suíte completa).
- Efeito colateral deliberado, documentado no backlog (S12B): nenhuma
  clínica com documentos, avaliações, intake ou escala respondida hoje
  consegue concluir purge físico de encerramento — fail-closed até o export
  cobrir esses domínios. Nenhum teste existente exercitava essa combinação
  como sucesso esperado antes desta sessão (o cenário 8 original só provava
  limpeza com os pacientes já purgados individualmente, ou seja, com essas
  tabelas já vazias).
- Rollback: reverter os quatro arquivos de produção a `9d4c67d` restaura o
  comportamento anterior; nenhuma migração de banco envolvida.

## S14 (ciclo 4, 2026-09-26) — links públicos ignoravam status da clínica
- Escopo: `functions/api/public-intake.ts` e `functions/api/public-scale.ts`
  (`PublicInvitationRow`/`PublicScaleInvitationRow` ganham `clinic_status`
  via `clinic.status AS clinic_status` no JOIN já existente;
  `invitationStateFailure` recusa com 410 quando `clinic_status !== "active"`,
  antes de checar revogado/enviado/expirado). Nenhuma mudança de schema.
- Ambiente: container da sessão, Node do repo, HEAD `f254ffe` (S12) + S14.
- Testes: `tests/unit/remote-scale-response.test.ts` ganha o cenário 15
  (convite pendente e válido some assim que a clínica vira `suspended`; GET
  e POST recusam com 410, nenhuma linha em `live_scale_responses`). Novo
  arquivo `tests/unit/remote-intake-clinic-status.test.ts` (schema mínimo +
  migração real 0018, handlers reais de `live/intake` e `public-intake`)
  prova o mesmo para pré-consulta, incluindo `closed`. Ambos vistos
  FALHANDO pelo motivo certo contra o código anterior via `git stash`
  isolado (200 em vez de 410); verdes com a correção.
- Comandos exit 0: `node --import tsx tests/unit/remote-scale-response.test.ts`,
  `node --import tsx tests/unit/remote-intake-clinic-status.test.ts`,
  `node tests/unit/saas-remote-intake-static.test.mjs`,
  `node tests/unit/saas-remote-scale-static.test.mjs`,
  `node --import tsx tests/unit/metadata-observability.test.ts`,
  `npm run check`, `npx eslint` nos arquivos tocados, `npm run test:quick-wins`
  (suíte completa), `node tests/unit/workflow-governance.test.mjs`.
- CI: o novo teste de intake foi cadastrado nos workflows que já observam
  `functions/api/public-intake.ts` (`saas-remote-intake-d1.yml` e
  `public-submission-audit-d1.yml`); `remote-scale-response.test.ts` já
  estava cadastrado em `remote-scale-response-d1.yml` e
  `public-submission-audit-d1.yml`, então o cenário novo entra sem mudança
  de workflow para escala.
- Rollback: reverter `functions/api/public-intake.ts` e
  `functions/api/public-scale.ts` a `f254ffe` restaura o comportamento
  anterior; nenhuma migração envolvida.

## S15 (ciclo 4, 2026-09-26) — gate de billing bloqueava GET/DELETE de equipe
- Escopo: `functions/api/tenants/[id]/_middleware.ts` (o gate de
  `/members` só roda para `context.request.method === "POST"`);
  `functions/api/billing/invitations.ts` (`managerBase` extraído de
  `manager`; GET e DELETE usam `managerBase` — só membership; POST continua
  em `manager` — membership + `requireBillingEntitlement`). Nenhuma
  mudança de schema.
- Ambiente: container da sessão, Node do repo, HEAD `1f7597b` (S14) + S15.
- Testes: `tests/unit/cliente-zero-journey.test.ts` ganha um bloco que põe
  a clínica AZUL (já com assinatura ativa real, de mais cedo no arquivo) em
  `past_due` sem carência e prova que criar convite continua 402, mas
  listar e revogar convite pendente respondem 200 — restaura o billing
  ativo ao final para não afetar o resto da jornada. Novo arquivo
  `tests/unit/tenant-members-billing-gate.test.ts` exercita o `onRequest`
  do middleware diretamente (com `next()` sintético, já que ele só roda de
  verdade atrás do roteamento do Pages): GET e DELETE de `/members`
  alcançam `next()` com billing suspenso; POST continua bloqueado (402).
  Ambos vistos FALHANDO pelo motivo certo contra o código anterior via
  `git stash` isolado (402 em vez de 200 nos dois); verdes com a correção.
- Comandos exit 0: `node --import tsx tests/unit/cliente-zero-journey.test.ts`,
  `node --import tsx tests/unit/tenant-members-billing-gate.test.ts`,
  `node --import tsx tests/unit/saas-billing-adversarial.test.ts`,
  `node --import tsx tests/unit/saas-billing-contract.test.ts`,
  `node --import tsx tests/unit/saas-acceptance-journey.test.ts`,
  `node --import tsx tests/unit/saas-self-service.test.ts`,
  `node --import tsx tests/unit/saas-tenant-lifecycle.test.ts`,
  `npm run check`, `npx eslint` nos arquivos tocados, `npm run test:quick-wins`
  (suíte completa), `node tests/unit/workflow-governance.test.mjs`.
- CI: `tests/unit/tenant-members-billing-gate.test.ts` cadastrado em
  `saas-self-service-guard.yml`, que já observa `functions/api/tenants/**`
  e `functions/api/billing/**` e já roda `cliente-zero-journey.test.ts`.
- Rollback: reverter `functions/api/tenants/[id]/_middleware.ts` e
  `functions/api/billing/invitations.ts` a `1f7597b` restaura o
  comportamento anterior; nenhuma migração envolvida.
