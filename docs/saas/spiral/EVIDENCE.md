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
- Escopo: `db/migrations/0029_operations_clinic_scope.sql` (renumerada de
  0026 para 0029 na abertura da PR #988 — colisão de prefixo com as PRs
  abertas #986 e #840, que já reservavam 0026-0028; nenhuma mudança de
  conteúdo, só o número do arquivo) (aditiva,
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
  `clinic_id` (migração 0029, renumerada de 0026) é aditiva e pode permanecer no banco sem
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

## S12B (ciclo 5, 2026-09-26) — export deixa de ser incompleto (LTB-02, fechamento)
- Escopo: `functions/api/tenant/_exportPayload.ts` apenas. As oito tabelas de
  `EXPORT_UNCOVERED_CLINIC_TABLES` (S12) agora saem no `data` do payload —
  `assessments`/`assessmentResponses` (contexto `assessment:<id>`/
  `assessment-response:<id>`), `documents` (metadata, sem cifrado) /
  `documentVersions` (contexto `document-version:<id>`), `intakeInvitations`
  (metadata, sem `token_hash`) / `intakeSubmissions` (contexto
  `remote-intake-submission:<id>`), `scaleInvitations` (metadata, sem
  `token_hash`) / `scaleResponses` (contexto `remote-scale-response:<id>`).
  Todos os contextos de decriptação conferidos contra o ponto de escrita real
  (`functions/api/live/{assessments,documents,intake}/index.ts`,
  `functions/api/public-{intake,scale}.ts`) — nenhum contexto inventado.
  `EXPORT_UNCOVERED_CLINIC_TABLES` fica `[]` (ponto de extensão para um
  futuro 9º domínio, comentário atualizado); `countExportUncoveredRows` ganha
  parâmetro opcional `tables` só para o teste continuar exercitando as duas
  ramificações de erro (tabela ausente vs. coluna ausente) sem depender da
  lista de produção ter membros. A pré-checagem de `encryptedBytes` (guarda
  do caminho síncrono) passou a somar os cinco novos campos cifrados, não só
  patients/events — sem isso um tenant com poucos pacientes mas documentos
  grandes passaria pela pré-checagem e só travaria depois, já com tudo
  carregado em memória. Nenhuma migração: os oito domínios já existiam desde
  0014/0018/0021.
- **Correção de escopo pedida em revisão** (PR #1004, revisor `jadsonfraga`,
  review `5328051311`): a entrega original desta seção deixava
  `clinic_settings` e `live_retention_policies` fora do payload e afirmava
  (em `BACKLOG.md` e na descrição da PR) que nunca fizeram parte do escopo
  de S12B — o revisor apontou que o texto original de S12B pedia
  explicitamente os dois. Correto sobre o mecanismo (nenhum dos dois bloqueia
  purge — estão em `PURGE_PRESERVED_TABLES`), incorreto sobre o escopo
  declarado. Corrigido em `functions/api/tenant/_exportPayload.ts`: duas
  consultas adicionais (`clinic_settings WHERE clinic_id = ? LIMIT 1`,
  `live_retention_policies WHERE clinic_id = ? LIMIT 1`; ambas 0-1 linha por
  clínica, sem campo cifrado) entram no batch e saem em `data.clinicSettings`/
  `data.retentionPolicy` (`null` quando a clínica nunca configurou). Não
  afeta `EXPORT_UNCOVERED_CLINIC_TABLES`, `complete` nem o purge — é
  completude de export, não desbloqueio de purge.
- **PR #1004 mesclou só o commit `c2f5aee`** (os oito domínios, sem a
  correção acima) enquanto esta correção ainda estava em desenvolvimento —
  `jadsonfraga` mesclou a PR entre a revisão e o push do commit seguinte.
  A correção segue em PR separada, rebaseada sobre o `main` pós-merge.
  Nesse rebase, `main` já trazia PR #1002 (`89c62c4`, "cercar purge com
  política e cobertura na mesma transação"), que adicionou
  `tests/unit/lgpd-purge-atomicity.test.ts` com uma corrida
  ("documento fora do export chega depois da contagem") que injeta uma
  linha tardia em `live_documents` para provar que a cerca atômica do purge
  (`_purge.ts`) recusa sem apagar nada — só que essa cerca é construída
  iterando `EXPORT_UNCOVERED_CLINIC_TABLES`, e com a lista vazia (S12B) o
  loop não gera predicado nenhum para `live_documents`, e o teste passou a
  falhar de verdade (o purge deletava tudo em vez de recusar): as duas PRs,
  corretas isoladamente, quebravam uma à outra depois de mescladas. Migrei
  a corrida para `appointments` (a única tabela que sobra em
  `UNREACHABLE_PATIENT_TABLES`, com a MESMA cerca atômica, e que S12B não
  toca) — mesmo mecanismo, tabela que continua genuinamente sujeita a ele
  hoje. Exigiu popular `booking_services` na fixture (FK obrigatória de
  `appointments`) e marcar `source = 'professional'` no INSERT sintético
  para não disparar `trg_public_appointment_billing_guard` (guard de billing
  de agendamento público, irrelevante para esta corrida). Visto FALHANDO
  pelo motivo certo (`injected` nunca chegava a `true`: a asserção interna
  do teste, não uma reformulação por fora) antes do ajuste da fixture; verde
  depois, junto com os outros 8 cenários do arquivo, inalterados.
- Ambiente: container da sessão, Node do repo, HEAD `0b4f74f` (main no início
  do ciclo) → `574236b` (main pós-merge de #1004, já com #1002) + a correção
  de escopo e o ajuste de integração acima.
- Efeito: `EXPORT_UNCOVERED_CLINIC_TABLES` vazia ⇒ `complete` computado passa
  a ser sempre `true` (nada mais fica de fora) ⇒ o purge de encerramento por
  clínica (`_purge.ts`) para de recusar com `EXPORT_MANIFEST_INCOMPLETE` só
  por essas oito tabelas terem linha — o efeito colateral deliberado do S12
  original está revertido para as clínicas que só têm dado nesses domínios.
- Testes: `tests/unit/lgpd-run-export-endpoint.test.ts` ganha um cenário
  RED/BLUE que semeia os oito domínios MAIS `clinic_settings`/
  `live_retention_policies` nas duas clínicas sintéticas e prova, num único
  export de RED: `complete === true`, `uncoveredCounts` vazio, cada domínio
  decifrado corretamente (`assert.deepEqual` contra o plaintext original),
  o timbre e a política de retenção de RED presentes com os valores exatos
  configurados, nenhum dado de BLUE em `JSON.stringify(collected.data)`
  (inclusive o timbre de BLUE), e `token_hash`/os hashes de convite nunca
  aparecem no payload. O cenário anterior ("um documento novo bloqueia o
  export com 409") foi substituído — não é mais o comportamento correto,
  então deixou de ser testado como tal.
  `tests/unit/lgpd-purge-executor.test.ts`: o cenário 8a antigo (purge por
  clínica recusa com dado nos oito domínios) foi substituído por uma prova de
  que uma FALHA REAL de leitura (não uma lacuna de export) continua
  bloqueando o preflight (`PURGE_PREFLIGHT_FAILED:appointments`); o cenário
  8b passou a ser o único caminho de sucesso e agora zera as oito tabelas
  junto com o resto, sem a limpeza manual que antes simulava "S12B pronto".
  Ambos os ajustes vistos FALHANDO pelo motivo certo contra o código anterior
  (200 em vez de 409 no primeiro; a asserção `EXPORT_MANIFEST_INCOMPLETE`
  nunca dispara no segundo porque a lista ficou vazia) antes de eu reescrever
  as asserções — não apenas "corrigidos para passar".
- Comandos exit 0 (rodados após o rebase sobre `main` pós-#1004/#1002):
  `npm run check`, `npx eslint functions/api/tenant/_exportPayload.ts
  tests/unit/lgpd-run-export-endpoint.test.ts tests/unit/lgpd-purge-executor.test.ts
  tests/unit/lgpd-purge-atomicity.test.ts`,
  `node --import tsx --test tests/unit/lgpd-run-export-endpoint.test.ts`,
  `node --import tsx --test tests/unit/lgpd-purge-executor.test.ts`,
  `node --import tsx --test tests/unit/lgpd-purge-atomicity.test.ts`,
  `node --import tsx --test tests/unit/saas-tenant-lifecycle.test.ts`,
  `node --import tsx --test tests/unit/lgpd-worker-executor-core.test.ts`,
  `node --import tsx --test tests/unit/lgpd-worker-foundation.test.ts`,
  `node --import tsx --test tests/unit/lgpd-run-deletion-endpoint.test.ts`,
  `node --import tsx --test tests/unit/lgpd-worker-race-regressions.test.ts`,
  `node --import tsx --test tests/unit/operations-consent-evidence-runtime.test.ts`,
  `node --import tsx --test tests/unit/runtime-readiness.test.ts`,
  `node --import tsx --test tests/unit/cliente-zero-journey.test.ts`,
  `node --import tsx --test tests/unit/saas-acceptance-journey.test.ts`,
  `npm run test:quick-wins` (suíte completa, 0 `not ok`).
- Limitação conhecida: o worker assíncrono (`run-export.ts`) ainda materializa
  o payload inteiro em memória antes de gravar no storage privado — para um
  tenant com muitos documentos grandes isso pode ser lento/custoso mesmo sem
  o teto síncrono. Não é uma regressão desta mudança (o caminho já fazia isso
  para patients/events) e não bloqueia o fechamento de S12B; fica registrado
  para uma futura camada de streaming/paginação se o volume real justificar.
- Rollback: reverter `functions/api/tenant/_exportPayload.ts` e os dois
  arquivos de teste a `0b4f74f` restaura o comportamento do S12 original
  (export incompleto, purge recusando nos oito domínios); nenhuma migração
  de banco envolvida.

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

## S16 (ciclo 4, 2026-09-26) — anti-enumeração no acesso legado a paciente
- Escopo: 10 arquivos (`functions/api/{patients/[id],patients/[id]/results,
  results,results/[id],scales/results,consultations/index,clinical-core/
  index,conecta/index,conecta/[id],memory/index}.ts`), ~17 pares de
  checagem `!access.exists`/`!access.allowed` fundidos em uma condição só
  (`!access.exists || !access.allowed`), sempre 404 com a mesma mensagem/
  código ("Paciente não encontrado."/"NOT_FOUND"). Nenhuma mudança de
  autorização (quem pode acessar continua igual); só a FORMA da recusa.
  `memory/[id].ts` deliberadamente fora do escopo (já não distingue
  exists/allowed, mas tem um problema mais profundo — LEG-09, próxima
  camada).
- Ambiente: container da sessão, Node do repo, HEAD `9e1a5f4` (S15) + S16.
- Testes: novo guard estático
  `tests/unit/patient-access-anti-enumeration-static.test.mjs` varre os 10
  arquivos e falha se a checagem separada reaparecer em qualquer um —
  cobertura ampla e barata. Novo `tests/unit/patient-access-anti-enumeration.test.ts`
  prova em runtime, contra `db/schema.d1.sql` real e o handler real de
  `GET /api/patients/:id`, que paciente inexistente e paciente de outro
  owner devolvem status E CORPO idênticos. Ambos vistos FALHANDO pelo
  motivo certo contra o código anterior via `git stash` isolado (o
  estático detecta a regex do padrão antigo; o dinâmico via 403 em vez de
  404); verdes com a correção. Ajuste de contrato em
  `tests/unit/cloudflare-patients-contract.test.ts`: a asserção de DELETE
  cross-owner que esperava 403 passa a esperar 404.
- Comandos exit 0: `node tests/unit/patient-access-anti-enumeration-static.test.mjs`,
  `node --import tsx tests/unit/patient-access-anti-enumeration.test.ts`,
  `node --import tsx tests/unit/cloudflare-patients-contract.test.ts`,
  `node --import tsx tests/unit/cloudflare-auth-middleware.test.ts`,
  `node --import tsx tests/unit/cloudflare-input-limits.test.ts`,
  `node --import tsx tests/unit/cloudflare-request-validation.test.ts`,
  `node --import tsx tests/unit/no-fake-clinical-write.test.ts`,
  `node --import tsx tests/unit/{notes-engine,conecta-engine,
  clinical-core-contract}.test.ts`,
  `node tests/unit/{conecta-integration-static,
  clinical-core-integration-static,clinical-core-supersession-regression,
  memory-search-ownership,patient-ui-safety-static}.test.*`,
  `node --import tsx tests/unit/patient-results-pagination.test.ts`,
  `npm run check`, `npx eslint` nos 10 arquivos tocados, `npm run
  test:quick-wins` (suíte completa, com os dois testes novos já
  cadastrados nela).
- Rollback: reverter os 10 arquivos de produção a `9e1a5f4` restaura o
  comportamento anterior (403 volta a distinguir paciente de outro owner);
  nenhuma migração envolvida.

## S17 (ciclo 4, 2026-09-26) — mutação legada sem owner repetido no predicado final (LEG-09/AUTHZ-P2-12)
- Escopo: 3 arquivos — `functions/api/conecta/[id].ts` (DELETE),
  `functions/api/memory/[id].ts` (PATCH e DELETE), `functions/api/results/[id].ts`
  (DELETE). Em todos, a mutação final passa a incluir, quando o usuário não é
  admin, `AND patient_id IN (SELECT id FROM patients_demo WHERE
  owner_user_id = ?)` no `UPDATE`/`DELETE`, e a checar `changes()` antes de
  responder sucesso: `memory/[id].ts` DELETE não checava `changes()` nenhuma
  (sempre 204); `results/[id].ts` DELETE reportava
  `{deleted:Boolean(changes), id}` com status 200 mesmo quando `changes=0`,
  em vez de 404. Nenhuma mudança de schema; nenhuma mudança em quem já podia
  acessar o quê no caminho autorizado normal — só a mutação final deixa de
  confiar cegamente em `WHERE id = ?` sozinho.
- Ambiente: container da sessão, Node do repo, HEAD `ee9ac06` (S16) + S17.
- Testes: novo `tests/unit/legacy-mutation-owner-predicate.test.ts`, schema
  real (`db/schema.d1.sql` + todas as migrações) e os 4 handlers reais (sem
  mock de SQL, só um wrapper de D1 de teste). O wrapper intercepta a
  N-ésima vez que a consulta de acesso do paciente
  (`getPatientAccess`/`SELECT owner_user_id FROM patients_demo`) lê o dono
  de um paciente-alvo e, nesse exato instante — depois que a autorização já
  leu e aprovou, antes de a mutação final rodar —, reatribui o paciente a
  outro owner via SQL direto no banco de teste. Isso simula uma escrita
  concorrente na janela entre "autorizar" e "mutar" que a regra do
  AGENTS.md exige que o predicado final também cubra. 4 cenários de corrida
  (uma por mutação) provam 404, zero linhas afetadas e nenhuma alteração de
  dado; 4 controles (mesmos handlers, sem corrida) provam que o dono
  legítimo continua conseguindo apagar/editar normalmente — nenhum desses
  4 caminhos de sucesso tinha cobertura comportamental antes (só checagens
  estáticas de texto ou testes do caminho "sem D1"). As 4 falhas foram
  vistas isoladamente, uma por arquivo, via `git stash push -- <arquivo>` +
  rodar + `git stash pop`, contra o código anterior: `conecta/[id].ts`
  DELETE e `results/[id].ts` DELETE respondiam 200 (e o segundo declarava
  `deleted:false`, mas com status 200 em vez de 404); `memory/[id].ts` PATCH
  respondia 200 e de fato alterava o título; `memory/[id].ts` DELETE
  respondia 204 e de fato apagava a nota, mesmo com o paciente já
  pertencendo a outro owner no momento do DELETE. Verdes com a correção.
- Comandos exit 0: `node --import tsx tests/unit/legacy-mutation-owner-predicate.test.ts`,
  `npm run check`, `npx eslint "functions/api/conecta/[id].ts"
  "functions/api/memory/[id].ts" "functions/api/results/[id].ts"
  tests/unit/legacy-mutation-owner-predicate.test.ts --max-warnings=0`,
  `node --import tsx tests/unit/no-fake-clinical-write.test.ts`,
  `node tests/unit/conecta-integration-static.test.mjs`,
  `node --import tsx tests/unit/memory-search-ownership.test.ts`,
  `node --import tsx tests/unit/cloudflare-input-limits.test.ts`,
  `node --import tsx tests/unit/cloudflare-patients-contract.test.ts`,
  `node tests/unit/patient-access-anti-enumeration-static.test.mjs`,
  `node --import tsx tests/unit/patient-access-anti-enumeration.test.ts`,
  `npm run test:quick-wins` (suíte completa, com o teste novo já cadastrado
  nela), `node tests/unit/workflow-governance.test.mjs`.
- CI: nenhum workflow dedicado por path — os três arquivos e o teste novo
  são cobertos pelo job genérico `Test, Lint & Build`
  (`.github/workflows/test-and-build.yml`, sem filtro de `paths:`, roda em
  todo push/PR para `main`/`develop` e executa `npm run test:quick-wins`).
- Rollback: reverter os 3 arquivos de produção a `ee9ac06` restaura o
  comportamento anterior (mutação final volta a confiar só em
  `WHERE id = ?`); nenhuma migração envolvida.

## S18 (ciclo 4, 2026-09-26) — gate de tenant/billing ausente em /api/integrations (AUTHZ-P1-09)
- Escopo: 1 arquivo novo (`functions/api/integrations/_middleware.ts`),
  cópia adaptada byte a byte do padrão já em produção em
  `functions/api/patients/_middleware.ts` e
  `functions/api/operations/_middleware.ts` (os dois são idênticos hoje).
  Nenhuma linha de `functions/api/integrations/boaconsulta/import.ts` muda —
  o roteamento de diretório do Cloudflare Pages Functions aplica o novo
  `_middleware.ts` automaticamente a GET e POST por estar em
  `functions/api/integrations/**`. Nenhuma mudança de schema.
- Ambiente: container da sessão, Node do repo, HEAD `8695c7b` (S17) + S18.
- Achado (produzido por um workflow paralelo desta sessão: 4 varreduras por
  domínio da auditoria + síntese + verificação adversarial, e confirmado de
  forma independente por um segundo agente de varredura só do audit —
  ambos convergiram no mesmo achado como topo do ranking): qualquer conta
  recém-criada (todo signup nasce `role: "professional"` global, sem
  clínica) passa por `canWriteClinicalData(user)` — que é verdadeiro para
  QUALQUER "professional" — e consegue enviar arquivos com PHI de terceiros
  pelo bridge do BoaConsulta sem nunca ter pago nem provado clínica.
- Prova concreta do buraco (antes da correção): script isolado chamando
  `onRequestPost` de `import.ts` diretamente, sem middleware nenhum na
  frente, com um usuário `role: "professional"` e ZERO linhas em
  `clinic_memberships` — resultado: `status 201`, 1 linha nova em
  `external_import_batches`. É exatamente o comportamento que o handler
  ainda tem hoje; a proteção vem inteiramente do middleware novo, que o
  Cloudflare aplica na frente dele.
- Testes: novo `tests/unit/integrations-tenant-gate.test.ts` (schema real +
  todas as migrações, incluindo `0008_boaconsulta_import_bridge.sql` e
  `0015_saas_billing_trial_seats_hardening.sql`, cujo trigger
  `trg_clinic_create_billing_trial` já cria `billing_customers`/
  `billing_subscriptions` em trial válido ao inserir uma clínica — usado
  como fixture em vez de inserir à mão, que colidiria com o `UNIQUE` de
  `billing_customers.clinic_id`). Encadeia o `onRequest` do middleware novo
  com os handlers reais de GET/POST via `context.next = () => handler(...)`,
  com FormData/File reais (multipart de verdade, não mock). 4 cenários: (1)
  POST de conta sem clínica → 409 `BILLING_CLINIC_CONTEXT_REQUIRED`, zero
  lotes criados; (2) GET da mesma conta → mesmo 409; (3) controle —
  clínica ativa com billing em dia → POST 201 com lote criado e GET lista
  normalmente (nenhuma regressão); (4) billing suspenso (`past_due` sem
  carência) → 402 `ENTITLEMENT_SUSPENDED`, mesma paridade de
  patients/operations, zero lotes criados. Visto falhando pelo motivo certo
  contra o código anterior via `git stash push -u -- functions/api/
  integrations/_middleware.ts` (module not found — o arquivo simplesmente
  não existia); verde com a correção.
- Comandos exit 0: `node --import tsx tests/unit/integrations-tenant-gate.test.ts`,
  `npm run check`, `npx eslint functions/api/integrations/_middleware.ts
  tests/unit/integrations-tenant-gate.test.ts --max-warnings=0`,
  `node --import tsx tests/unit/boaconsulta-import-contract.test.ts`,
  `node --import tsx tests/unit/cloudflare-auth-middleware.test.ts`,
  `npm run test:quick-wins` (suíte completa, com o teste novo já cadastrado
  nela), `node tests/unit/workflow-governance.test.mjs`, validação de
  sintaxe YAML dos dois workflows editados.
- CI: `tests/unit/integrations-tenant-gate.test.ts` e
  `functions/api/integrations/_middleware.ts` cadastrados como path
  triggers e como passo de execução em `boaconsulta-import-pr.yml`
  (validação de PR) e `boaconsulta-import-release.yml` (release em main),
  ao lado do teste de contrato já existente.
- Rollback: apagar `functions/api/integrations/_middleware.ts` restaura o
  comportamento anterior (bridge volta a aceitar qualquer conta
  "professional" sem clínica/billing); nenhuma migração envolvida, nenhum
  outro arquivo de produção tocado.

## S19 (ciclo 4, 2026-09-26) — razão + auditoria prévia no bypass de admin de plataforma (AUTHZ-P1-08/LTB-19)
- Escopo: 3 arquivos existentes (`functions/api/live/governance/
  run-deletion.ts`, `functions/api/live/governance/run-export.ts`,
  `functions/api/audit-log.ts`). Nenhuma mudança de schema — `saas_audit_log`
  (migração 0009) já aceita `clinic_id NULL` e `action` livre.
- Ambiente: container da sessão, Node do repo, HEAD `1e983cf` (S18) + S19.
- Achado: `run-deletion.ts`/`run-export.ts` tinham o padrão `const
  platformAdmin = isAdmin(user); if (!platformAdmin) { membership +
  billing } ` — quando `platformAdmin` era true, o bloco inteiro era
  pulado para o `clinicId` do BODY, sem nenhum campo `reason`. A trilha de
  sucesso (`prepareSaasAudit(...).run()`) só rodava DEPOIS da execução
  física, num `try/catch` que só logava a falha — a ação já tinha
  acontecido. `audit-log.ts` não auditava a própria leitura global.
  Confirmado por leitura direta do código atual (não só do texto da
  auditoria) e pelo teste já existente `lgpd-run-deletion-endpoint.test.ts`
  cenário 10, que ANTES da correção provava exatamente o oposto do que
  deveria: `PLATFORM_ADMIN` sem membership em RED executando a eliminação
  do tenant encerrado com sucesso (200), sem `reason`.
- Testes: `tests/unit/lgpd-run-deletion-endpoint.test.ts` cenário 10
  dividido em 10a (sem `reason` → 400 `REASON_REQUIRED`, `ledger()` continua
  `undefined`) e 10b (com `reason` → 200 como antes, mais leitura direta de
  `saas_audit_log` confirmando `action='platform_admin_run_deletion_initiated'`,
  `clinic_id=RED`, `actor_user_id=PLATFORM_ADMIN.id` e a razão exata na
  metadata). Novo cenário 12: uma `live_lgpd_worker_jobs` pré-existente com
  `status='processing'` e `lease_until` no futuro simula outro worker
  segurando o lease — `run-deletion` responde 409, RED permanece intocado,
  mas a trilha PRÉVIA (`platform_admin_run_deletion_initiated`) já existe
  para esse `requestId`, provando que a gravação acontece ANTES da tentativa
  de claim, não depois do sucesso. `tests/unit/lgpd-run-export-endpoint.test.ts`
  ganha um `PLATFORM_ADMIN` novo (não existia neste arquivo) e um cenário 11
  simétrico (400 sem razão / 200 com razão + trilha prévia com a razão
  exata). `tests/unit/audit-log-contract.test.ts` ganha um cenário com
  schema real provando que uma leitura de admin bem-sucedida grava
  `platform_audit_log_read` com `clinic_id NULL` e metadata só com os
  filtros (`resource`, `action`) usados na consulta, sem PID/IP. Todas as
  quatro peças vistas falhando pelo motivo certo contra o código anterior
  via `git stash push -- <arquivo>` isolado (200 em vez de 400 nos dois
  orquestradores; `assert.ok(trilha)` falhando com `undefined` no
  audit-log).
- Comandos exit 0: `node --import tsx tests/unit/lgpd-run-deletion-endpoint.test.ts`,
  `node --import tsx tests/unit/lgpd-run-export-endpoint.test.ts`,
  `node --import tsx tests/unit/audit-log-contract.test.ts`,
  `npm run check`, `npx eslint functions/api/audit-log.ts
  functions/api/live/governance/run-deletion.ts
  functions/api/live/governance/run-export.ts
  tests/unit/audit-log-contract.test.ts
  tests/unit/lgpd-run-deletion-endpoint.test.ts
  tests/unit/lgpd-run-export-endpoint.test.ts --max-warnings=0`,
  `node --import tsx tests/unit/lgpd-purge-executor.test.ts`,
  `node --import tsx tests/unit/saas-tenant-lifecycle.test.ts`,
  `npm run test:quick-wins` (suíte completa),
  `node tests/unit/workflow-governance.test.mjs`.
- CI: `run-deletion.ts`/`run-export.ts` e seus dois testes já eram cobertos
  por `lgpd-worker-executor-core.yml` (path triggers já existentes) e por
  `runtime-readiness.yml`; `audit-log.ts`/`audit-log-contract.test.ts` são
  cobertos pelo job genérico `test-and-build.yml` (sem filtro de `paths`,
  roda `npm run test:quick-wins` em todo push/PR). Nenhum arquivo de
  workflow precisou de edição — só os testes já existentes foram
  estendidos, não criados.
- Rollback: reverter os 3 arquivos de produção a `1e983cf` restaura o
  comportamento anterior (bypass de admin sem razão nem trilha prévia);
  nenhuma migração envolvida.

## S20 (ciclo 4, 2026-09-26) — oráculo de enumeração no vínculo de recepção (AUTHZ-P1-06 residual)
- Escopo: 1 arquivo de produção (`functions/api/operations/index.ts`, só o
  branch de falha de `action=staff_link`); `functions/api/operations/_access.ts`
  NÃO foi tocado — os códigos internos `STAFF_NOT_FOUND`/`STAFF_ROLE_INVALID`/
  `STAFF_ALREADY_LINKED` continuam existindo ali como razões internas de
  `linkOperationsOperator`, só deixam de virar respostas HTTP distinguíveis.
  Nenhuma mudança de schema.
- Ambiente: container da sessão, Node do repo, HEAD `63016a6` (S19) + S20.
- Achado: confirmado por leitura direta do código atual (`functions/api/
  operations/index.ts:379-389` antes da correção) — `messages[result.code]`
  mapeava os três códigos para mensagens distintas e o status variava
  (`result.code === "STAFF_NOT_FOUND" ? 404 : 409`), então qualquer
  profissional/admin com `canConfigure` podia POSTar `action=staff_link`
  com um e-mail arbitrário e aprender, pela resposta, se aquele e-mail tem
  conta na plataforma, se o papel é `operator` ativo, e se já está vinculado
  a outro profissional — sem nenhuma relação de clínica com o alvo.
- Testes: novo `tests/unit/operations-staff-link-anti-enumeration.test.ts`
  (schema real + todas as migrações + handler real de `POST /api/operations`)
  prova três chamadas — e-mail sem conta, conta `professional` (papel
  errado), e uma conta `operator` já vinculada a OUTRO profissional —
  respondendo `status` E corpo (`response.clone().json()`) IDÊNTICOS
  (404, `STAFF_NOT_AVAILABLE`). Um controle de não regressão prova que
  vincular um operador genuinamente disponível continua respondendo 200 e
  criando a linha em `booking_staff_links`. Visto falhando pelo motivo
  certo contra o código anterior via `git stash push -- functions/api/
  operations/index.ts` (409 em vez de 404 para "papel inválido"). Guard
  estático `tests/unit/operations-integration-static.test.mjs` atualizado:
  a asserção antiga (`assert.match(professional, /STAFF_ALREADY_LINKED/,
  "API deve expor erro explícito...")`, que exigia literalmente o
  comportamento vulnerável) foi substituída por uma que exige o código
  único `STAFF_NOT_AVAILABLE` e uma nova `assert.doesNotMatch` que reprova
  se `STAFF_ALREADY_LINKED` reaparecer como mensagem/código exposto ao
  cliente em `index.ts`.
- Comandos exit 0: `node --import tsx tests/unit/operations-staff-link-anti-enumeration.test.ts`,
  `node tests/unit/operations-integration-static.test.mjs`,
  `npm run check`, `npx eslint functions/api/operations/index.ts
  tests/unit/operations-staff-link-anti-enumeration.test.ts
  tests/unit/operations-integration-static.test.mjs --max-warnings=0`,
  `node --import tsx tests/unit/operations-tenant-isolation.test.ts`,
  `npm run test:operations` (suíte completa, com o teste novo já
  cadastrado nela), `npm run test:quick-wins` (suíte completa),
  `node tests/unit/workflow-governance.test.mjs`.
- CI: `tests/unit/operations-staff-link-anti-enumeration.test.ts` cadastrado
  em `test:operations`, já executado sem filtro de `paths` por
  `.github/workflows/pr-check.yml` em todo PR para `main`.
- Rollback: reverter `functions/api/operations/index.ts` ao commit anterior
  restaura o comportamento anterior (os três códigos voltam a ser
  distinguíveis); nenhuma migração envolvida.

## S21 (ciclo 4, 2026-09-26) — clínica sem rota para ler a própria auditoria (AUTHZ-P1-10)
- Escopo: 1 arquivo novo (`functions/api/tenants/[id]/audit.ts`, GET
  somente-leitura). Nenhuma mudança de schema — `saas_audit_log` (migração
  0009) já tem tudo que o endpoint precisa. Nenhum outro arquivo de
  produção tocado.
- Ambiente: container da sessão, Node do repo, HEAD `36df237` (S20) + S21.
- Achado: confirmado por leitura direta — `functions/api/tenants/[id]/
  metrics.ts` só agrega contagens (DAU/WAU/MAU) via `saas_audit_log`, nunca
  devolve os eventos; `functions/api/audit-log.ts` (a única leitura
  detalhada) exige `canReadAuditLog` (role global `admin`) e não filtra por
  clínica. Uma clínica não tinha NENHUMA forma de ver "quem fez o quê" na
  própria operação — diferente dos outros achados desta sessão, aqui não
  havia vazamento cross-tenant nenhum (nada existia para vazar); é uma
  lacuna de funcionalidade da "plataforma autogerenciável", não uma falha
  de isolamento.
- Implementação: `GET /api/tenants/:id/audit?page=&limit=` usa o MESMO
  guard já em produção em `metrics.ts`/`export.ts` — `clinic_memberships`
  ativa com `role IN ('owner','clinic_admin')` numa `clinics.status =
  'active'` — com 404 genérico (`NOT_FOUND`, "Recurso indisponível") para
  QUALQUER falha (clínica inexistente, sem membership, papel insuficiente,
  clínica suspensa/encerrada), sem distinguir qual caso é. Resposta
  paginada com `actorName` (join em `users`) e `metadata` (já era
  metadata-only, sem PHI, por disciplina de todas as camadas anteriores
  desta sessão que escrevem em `saas_audit_log`).
- Testes: novo `tests/unit/tenant-audit-trail.test.ts` (schema real + todas
  as migrações + handler real): duas clínicas sintéticas com eventos
  próprios provam isolamento (owner de uma nunca vê os eventos da outra,
  nem o ator de outra clínica aparece na resposta); um `professional` comum
  (sem papel de gestor) recebe 404; clínica inexistente e papel
  insuficiente respondem status E corpo IDÊNTICOS
  (`assert.deepEqual(body, body)`); clínica `suspended` recusa com o mesmo
  guard; paginação (`page`/`limit`) respeitada. Visto falhando pelo motivo
  certo contra o código anterior via `git stash push -u -- functions/api/
  tenants/\[id\]/audit.ts` (module not found — o endpoint simplesmente não
  existia).
- Comandos exit 0: `node --import tsx tests/unit/tenant-audit-trail.test.ts`,
  `npm run check`, `npx eslint "functions/api/tenants/[id]/audit.ts"
  tests/unit/tenant-audit-trail.test.ts --max-warnings=0`,
  `node --import tsx tests/unit/cliente-zero-journey.test.ts`,
  `node --import tsx tests/unit/saas-self-service.test.ts`,
  `npm run test:quick-wins` (suíte completa),
  `node tests/unit/workflow-governance.test.mjs`, validação de sintaxe
  YAML do workflow editado.
- CI: `tests/unit/tenant-audit-trail.test.ts` cadastrado em
  `saas-self-service-guard.yml`, que já observa `functions/api/tenants/**`
  (cobre o endpoint novo automaticamente) e já roda `cliente-zero-journey.test.ts`
  e `tenant-members-billing-gate.test.ts`.
- Rollback: apagar `functions/api/tenants/[id]/audit.ts` restaura o
  comportamento anterior (nenhuma rota expõe a auditoria da clínica);
  nenhuma migração envolvida, nenhum outro arquivo de produção tocado.

## S22 (ciclo 4, 2026-09-26) — DTO público sobre-exposto em action=manage (OPS-19)
- Escopo: 1 arquivo de produção (`functions/api/public-booking.ts`, só o
  branch `action === "manage"`). Nenhuma mudança de schema, nenhuma mudança
  em `appointmentToApi` (função compartilhada com o painel privado —
  continua devolvendo o DTO completo lá, onde é apropriado).
- Ambiente: container da sessão, Node do repo, HEAD `f7788d8` (S21) + S22.
- Achado: confirmado por leitura direta — `public-booking.ts:181` (antes da
  correção) devolvia `{ appointment: await appointmentToApi(env, appointment) }`
  sem nenhuma redução, o MESMO objeto usado em `operations/index.ts:163`
  para o painel do profissional. Comparação direta com o próprio código:
  `operations/index.ts:165-172` já redige `amountCents`/`paymentMethod`
  para a recepção delegada (`!principal.canConfigure`) — um empregado
  AUTENTICADO da clínica. A rota pública, sem autenticação nenhuma, dava
  MAIS acesso financeiro a quem só tem o token do que a própria recepção.
  `providerUserId`/`patientId` são identificadores internos sem nenhum uso
  no frontend (`client/src/pages/agendar.tsx` só lê `data.appointment.serviceId`).
- Testes: novo `tests/unit/public-booking-manage-redaction.test.ts` (schema
  real + todas as migrações + handler real de `POST /api/public-booking`).
  Cria uma reserva sintética com `patient_id='live-patient-opaco-123'`,
  `amount_cents=30000`, `payment_method='pix'` e chama `action=manage` com
  o token correspondente; prova que a resposta NÃO tem as chaves
  `providerUserId`/`patientId`/`amountCents`/`paymentMethod`
  (`Object.prototype.hasOwnProperty`) nem o valor do `patient_id` em lugar
  nenhum do JSON serializado, e que os campos de autoatendimento
  (`guardianName`, `guardianPhone`, `patientName`, `status`,
  `paymentStatus`, `serviceName`, `startsAtLocal`) continuam corretos.
  Visto falhando pelo motivo certo contra o código anterior via `git stash
  push -- functions/api/public-booking.ts` (`providerUserId` presente na
  resposta).
- Comandos exit 0: `node --import tsx tests/unit/public-booking-manage-redaction.test.ts`,
  `npm run check`, `npx eslint functions/api/public-booking.ts
  tests/unit/public-booking-manage-redaction.test.ts --max-warnings=0`,
  `npm run test:operations` (suíte completa, com o teste novo já cadastrado
  nela), `npm run test:quick-wins` (suíte completa),
  `node tests/unit/workflow-governance.test.mjs`.
- CI: `tests/unit/public-booking-manage-redaction.test.ts` cadastrado em
  `test:operations`, já executado sem filtro de `paths` por
  `.github/workflows/pr-check.yml` em todo PR para `main`.
- Rollback: reverter `functions/api/public-booking.ts` ao commit anterior
  restaura o comportamento anterior (DTO completo volta a ser exposto);
  nenhuma migração envolvida.


## S1-R1 — revisão adversarial executada em 2026-09-24
- Escopo: handler real e autorização real; nove requisitos removidos um a um,
  configuração vazia, sete ambientes de cobrança, seis negativas de acesso,
  no-store, ausência de segredos/prefixos e ausência de chamadas a DB/provedor.
- Base exata: `6d38d98f70c22ef1571a01423bc028c681f052bd`.
- Fontes recebidas pelo conector GitHub e conferidas pelo SHA Git do blob:
  handler original `8f93c165fc341f5f58cb11c55f524ea20301b44b`;
  teste original `f62ed64a33cb5d9ce5d40233ab4daafdc01b0000`;
  autorização inalterada `9a1336205906f2a94911a6f702accf7a08cb2101`.
- Ambiente: Linux da sessão, Node 22.16.0, transpilador TypeScript 5.8.3
  já instalado. O package.json fixa TypeScript 5.6.3; esta execução auxiliar
  não substitui instalação pelo lockfile, typecheck ou a CI canônica.
- Comando realmente executado: `node --loader ./local-ts-loader.mjs
  tests/unit/go-live-readiness.test.ts`. O loader só transpila os arquivos
  originais; nenhuma regra de negócio foi copiada para um mock.
- Baseline PR sem novos testes: exit 0.
- Novo bloco 8 contra handler original: exit 1, mensagem
  `DB ausente não pode atestar configuração presente`.
- Handler corrigido + blocos 1 a 11: exit 0.
- Três mutações, cada uma exit 1: nível sempre presente; retirada da ressalva
  PRODUCAO_VERIFICADA ao escolher production; eco de ambiente arbitrário.
- Restaurado o candidato depois das mutações: exit 0.
- Uma colisão inicial na fixture (prefixo literal ambiente, igual ao nome do
  campo) foi corrigida usando cfg + bytes aleatórios. A assertiva permaneceu.

### Bytes efetivamente testados
- Handler Git blob: `3b3343d77a05253cdf26006c9e1e4f198c915dd3`.
- Handler SHA-256: `7711214b7e32f778dec54c8c8722375b5dc1c60a414b4c133ff2c262e98411fb`.
- Teste Git blob: `8413729829981a1fa347923f8cc87c36ed9f6288`.
- Teste SHA-256: `3eaba4e74a64c427b5dd57939478c6b2a5c599c8da77a4273e8a9ec8de100f62`.
- Artefatos locais: manifesto, fontes originais/candidatas, loader, runner
  de mutações e logs RED/GREEN. Anexo da sessão: neuroped-pr949-review.zip.
  A PR identifica o commit completo que contém esses blobs.

### Limites e gate de integração
- Sem checkout integral: clone bloqueado por DNS e terminal remoto por cota.
  Não foram executados npm ci, npm check/lint, verify/build completos nesta
  revisão local. Não confundir transpilação com verificação de tipos.
- Sem banco D1, envio de e-mail, cobrança, sessão real ou navegador autenticado.
  O teste injeta authUser no contrato interno; o middleware não foi contornado
  em produção. As sentinelas de fronteira demonstram ausência de efeitos.
- O package.json já inclui go-live-readiness em test:quick-wins e este em
  verify:release. Nenhum pipeline ou dependência foi adicionado.
- Exigir CI do novo HEAD e a revisão aplicável antes de merge/publicação.
  Resultados de ancestral não substituem os do candidato atual.


### Reconciliação em 26/09/2026
O histórico acima descreve a execução original em 24/09. A revisão atual
reaplica código e teste sobre main, preserva S2–S22 e requer nova CI.

## S13 (ciclo 5, 2026-09-26) — link público de agendamento desambiguado por clínica
- Escopo: `functions/api/operations/_core.ts` (nova `resolveProviderClinicBySlug`,
  ao lado de `resolveProviderSoleClinicId`); `functions/api/public-booking.ts`
  (novo `resolveClinicId` que escolhe entre as duas conforme `?clinic=`/`body.clinic`
  estar presente; `publicProfile`, `publicProviders`, GET `slots` e POST
  `book`/`waitlist` passam a aceitar o parâmetro); `client/src/pages/agendar.tsx`
  (lê `clinic` da querystring e repassa nas quatro chamadas); `client/src/pages/agenda.tsx`
  (o link público copiável pela clínica já sai com `&clinic=<slug da clínica
  ativa>`, via `useClinic().activeClinic.slug`). Nenhuma migração: `clinics.slug`
  já existe e é única desde `0009_saas_phase1_foundation.sql`.
- Ambiente: container da sessão, Node do repo, base `main` em
  `574236b350181651664313f72afcf26297940003` (pós #1002 e #1004).
- Teste: bloco 6 (novo) de `tests/unit/operations-tenant-isolation.test.ts`,
  reaproveitando o cenário já existente do bloco 5 (prof-p com DUAS
  memberships ativas, cenário que antes só provava fail-closed). Prova que
  `?clinic=clinica-a`/`clinica-b` resolve exatamente a clínica pedida sem
  misturar serviços (`profileA.services` só tem "Consulta A", `profileB.services`
  só tem "Consulta B"), que o diretório com `?clinic=` lista o profissional
  mesmo com membership ambígua no total, e que a recusa fail-closed se
  mantém para: clínica existente onde o profissional não é membro
  (`clinic-c`), slug inexistente (`nao-existe`), clínica suspensa com
  membership ativa (`clinic-d`) e ausência do parâmetro (compatibilidade com
  links antigos, cenário do bloco 5 preservado).
- RED confirmado antes do fix: `git stash push -- functions/api/operations/_core.ts
  functions/api/public-booking.ts && node --import tsx
  tests/unit/operations-tenant-isolation.test.ts` — `TypeError: Cannot read
  properties of null (reading 'services')`, porque o código antigo ignora
  `clinic` e usa só `resolveProviderSoleClinicId` (retorna `null` com
  membership ambígua, exatamente como antes). `git stash pop` restaura o fix;
  mesmo comando fica verde.
- Comandos exit 0 depois do fix: `npm run check`, `npm run lint`
  (`--max-warnings=0`), `npm run test:operations` (inclui o teste acima,
  `operations-contract`, `operations-integration-static`,
  `secretaria-marcacao-navigation`, `operations-staff-link-anti-enumeration`,
  `public-booking-manage-redaction`, `clinical-lgpd-provisioning-static`),
  `npm run test:quick-wins` (suíte completa, zero `not ok`).
- Limites documentados no BACKLOG.md#S13: isto NÃO é o redesenho de rota
  (`/c/:clinicSlug/agendar`) nem a troca de PK de `booking_provider_profiles`/
  `booking_staff_links` (OPS-05/OPS-03) — permanecem abertos, exigem
  migração e período de compatibilidade, fora do escopo de um incremento
  único e seguro.
- Rollback: reverter os cinco arquivos de código/teste ao SHA base acima
  restaura o comportamento anterior (só `resolveProviderSoleClinicId`,
  ignorando `clinic`); nenhuma migração de schema envolvida.
## S23 (ciclo 6, 2026-09-27) — recepção delegada barrada no gate da agenda (AUTHZ-P1-04)
- Escopo: 1 arquivo de produção (`functions/api/operations/_middleware.ts`),
  1 teste novo, 1 linha em `package.json` (`test:operations`).
- Base: `574236b` (main após #1004).
- RED contra o middleware anterior:
  `node --import tsx tests/unit/operations-delegated-staff-gate.test.ts` →
  exit 1, `secretária vinculada deve ler a agenda: 409
  {"code":"BILLING_CLINIC_CONTEXT_REQUIRED"}`.
- GREEN com a correção: o mesmo comando → exit 0. Cobre: leitura redigida
  (`amountCents`/`paymentMethod` nulos, `staff` vazio, `canConfigure=false`),
  check-in operacional 200, configuração recusada 403, sem vínculo 403
  `STAFF_LINK_REQUIRED` sem rodar o handler, header para clínica alheia 409,
  trial vencido 402, clínica suspensa 423, vínculo revogado 403. Também há
  controle do profissional.
- Regressão: `npm run test:operations` exit 0; `npm run test:quick-wins`
  exit 0; `npm run check` exit 0; `npm run lint` exit 0.
- Fixtures 100% sintéticas (`example.test`), sem PHI.
- Rollback: reverter o commit; o comportamento volta a ser o 409 anterior
  para `operator`, sem efeito em dados, porque não houve migração.

### S23b — vínculo de recepção amarrado à membership da clínica
- Escopo: `functions/api/operations/_access.ts` (`linkOperationsOperator`
  recebe `clinicId` e exige membership `assistant` ativa na checagem e no
  predicado da escrita), `functions/api/operations/index.ts` (passa
  `clinicId`) e o texto de orientação em `client/src/pages/agenda.tsx`.
- Teste reforçado: `tests/unit/operations-staff-link-anti-enumeration.test.ts`
  ganhou dois casos: `operator` sem membership na clínica e membro
  `financial`. Os dois respondem corpo idêntico aos outros três e nenhum
  vínculo é criado. O controle passou a usar o caminho legítimo (membro
  `assistant`). Nenhuma assertiva removida.
- RED contra o código anterior (`git stash` de `_access.ts`/`index.ts`):
  `operator sem membership nesta clínica: precisa responder 404`.
- GREEN: `npm run test:operations`, `npm run test:quick-wins`,
  `npm run check`, `npm run lint` e `npm run build:client`, todos com exit 0.
- Rollback: reverter o commit; sem migração.

## S10 (ciclo 7, 2026-09-27) — escrita LIVE barrada por papel global desatualizado (AUTHZ-P1-07)
- Escopo: 1 arquivo de produção (`functions/api/_middleware.ts`), 1 teste
  novo (`tests/unit/live-clinical-write-membership-authorization.test.ts`),
  1 linha em `package.json` (`test:quick-wins`). Sem migração.
- Base: `d3e3b98` (main após #1007).
- Defeito provado: uma conta com membership `professional` numa clínica
  (nascida por `functions/api/billing/accept.ts`, que só define o papel
  GLOBAL na primeira conta criada por convite — convites seguintes para
  outra clínica com papel de clínica mais alto nunca revisitam o papel
  global) tinha `clinical.write` concedido pela própria membership
  (`shared/permissions.ts`) e entitlement de clínica ativo, mas era barrada
  por `roleFailure` (`_middleware.ts`) antes de a requisição alcançar o
  Clinical Core LIVE, cujas checagens (`requireBillingEntitlement` escopo
  "clinical", `membershipCanWriteClinical`) já a autorizariam.
- RED contra o código anterior:
  `node --import tsx --test tests/unit/live-clinical-write-membership-authorization.test.ts`
  → 1 falha: `esperado 200 ... recebido 403
  {"error":"Perfil sem permissão para alterar dados clínicos.","code":"FORBIDDEN"}`.
- Fix: nova `liveClinicalWriteAuthorization` em `_middleware.ts` reautoriza
  escrita em `/api/live/**` pela mesma fonte de verdade que o Clinical Core
  já usa (`getClinicMembership` + `membershipCanWriteClinical` de
  `functions/api/tenant/_core.ts`, resolvendo a clínica via a mesma
  `resolveBillingClinicId` de `functions/api/billing/_guard.ts`). Quando a
  clínica não é resolvível ou a membership não concede `clinical.write`,
  cai no `roleFailure` de sempre — `/api/patients` e demais rotas legadas
  (fora de `/api/live/`) nunca passam por esta função e ficam com o
  comportamento anterior, intocado.
- GREEN: o mesmo teste → exit 0 (2/2, incluindo o controle: membership
  `financial` com papel global `professional` continua barrada).
- Regressão completa, todas exit 0: `npm run check`, `npm run lint`,
  `npm run test:quick-wins` (0 `not ok` na cadeia inteira, inclusive
  `tenant-management-authorization.test.ts`, 14/14, que já cobre
  `reader-owner`/`operator-manager` em `/api/patients` continuando 403),
  `npm run test:operations`, `npm run test:saas-self-service`,
  `npm run build:client`.
- Fixtures 100% sintéticas (`example.test`), sem PHI.
- Rollback: reverter o commit; sem migração, sem efeito em dado persistido.
- Risco remanescente (deliberadamente fora deste incremento, registrado em
  BACKLOG.md#S10): escopo operacional próprio de `assistant`/`financial`
  fora do clínico, e o bypass do papel global `professional` sobre paciente
  LEGADO (`patients_demo`, sem `clinic_id` — depende da decisão de negócio
  de S9).


### LTB-10 — quatro olhos na aprovação de eliminação física (ciclo 8, 2026-09-27)
- Achado original: `docs/audits/SAAS_TENANCY_AUDIT_2026-09-26.md#LTB-10`
  (`functions/api/live/governance/_worker-executor.ts:102-124`,
  `functions/api/live/governance/index.ts:148-206,222-234`,
  `functions/api/live/governance/run-deletion.ts:107-121`).
- Escopo desta correção: só `functions/api/live/governance/index.ts`
  (`onRequestPatch`) e o teste novo
  `tests/unit/lgpd-deletion-four-eyes.test.ts`. Sem migração.
- Defeito provado (RED, `git stash` do arquivo de produção): gestora A cria
  um pedido `delete` de escopo `patient`; a MESMA gestora A aprova o próprio
  pedido (`PATCH .../governance` com `status: "approved"`) → `200`, pedido
  avança para `approved` sozinho.
- Fix: o `SELECT` que lê o pedido antes da transição passou a trazer
  `requested_by_user_id`; quando `requestType === 'delete'` e o próximo
  status é `approved`, se `requested_by_user_id === user.id` a resposta é
  `409 FOUR_EYES_REQUIRED`, antes mesmo de checar `ALLOWED_TRANSITIONS`.
  `export`/`policy` inalterados.
- GREEN: mesmo teste → autoaprovação `409 FOUR_EYES_REQUIRED`, status
  permanece `requested`; gestora B (segunda membership `clinic_admin` da
  mesma clínica) aprova o mesmo pedido → `200` → `approved`; um pedido de
  `export` criado e aprovado pela própria gestora A continua `200` (a trava
  é exclusiva de `delete`).
- Regressão completa (todas exit 0): `npm run check`; `npx eslint
  functions/api/live/governance/index.ts
  tests/unit/lgpd-deletion-four-eyes.test.ts --max-warnings=0`;
  `tests/unit/cliente-zero-journey.test.ts`;
  `tests/unit/lgpd-purge-executor.test.ts`;
  `tests/unit/lgpd-purge-atomicity.test.ts`;
  `tests/unit/lgpd-run-deletion-endpoint.test.ts`;
  `tests/unit/lgpd-worker-executor-core.test.ts`;
  `tests/unit/lgpd-worker-foundation.test.ts`;
  `tests/unit/lgpd-worker-race-regressions.test.ts`;
  `tests/unit/saas-live-clinical-domains.test.ts`;
  `tests/unit/live-governance-failclosed.test.ts`;
  `tests/unit/live-tenant-isolation-adversarial.test.ts`;
  `tests/unit/live-read-audit-policy.test.ts`;
  `tests/unit/tenant-management-authorization.test.ts`;
  `npm run test:quick-wins` (cadeia completa, 0 `not ok`).
- Fixtures 100% sintéticas (`example.test`), sem PHI.
- Rollback: reverter o commit; sem migração, sem efeito em dado persistido.
- Risco remanescente, deliberadamente fora deste incremento: piso legal de
  retenção do prontuário para eliminação de escopo `patient` numa clínica
  ativa — ver
  `docs/audits/LEGAL_REVIEW_REQUIRED_CLINICAL_RETENTION_FLOOR_2026-09-27.md`.

### S5 — mecanismo de backup/restore D1 provado (reconciliação de docs, ciclo 8, 2026-09-28)
- O código e a prova já existiam desde 2026-09-27; esta entrada só registra o
  que faltava escrever. Nenhum arquivo de produção alterado.
- PR: #1014, branch `fix/s5-dr-restoration-evidence`, mesclada em `1a37947`
  (2026-09-27 16:00:02 -03:00). Arquivos: `.github/workflows/dr-mechanism-rehearsal.yml`,
  `scripts/dr/fingerprint-d1-json.mjs`, `scripts/dr/metadata-fingerprint.sql`,
  `scripts/dr/synthetic-fixture.sql`, `tests/unit/dr-rehearsal-safety.test.mjs`.
- Execução real, verificada nesta sessão diretamente pela API do GitHub (não
  apenas pelo texto da PR): `actions_get get_workflow_run` para o run
  `36316874897` retorna `event: workflow_dispatch`, `head_sha: 8b861dad...`,
  `status: completed`, `conclusion: success`,
  `created_at/updated_at: 2026-09-27T11:47:32Z`–`11:49:46Z`.
  `actions_list list_workflow_jobs` para o mesmo run mostra as 15 etapas
  (confirmação digitada → checkout → criar 2 D1 remotos → schema real +
  todas as migrações → fixture sintética → fingerprint + `d1 export` →
  `d1 execute --file` num D1 distinto → mutação destrutiva sintética →
  `d1 time-travel restore` → undo do próprio restore → destruir os dois D1
  temporários) todas com `conclusion: success`.
- `tests/unit/dr-rehearsal-safety.test.mjs` (já existente, roda em
  `test:quick-wins`) trava, por leitura estática do workflow, que: só
  `workflow_dispatch` com confirmação digitada aciona o ensaio; nenhum
  comando `wrangler d1` nomeia `neuroped-db`; o passo de destruição reconfere
  a marca `dr-rehearsal` e roda mesmo se uma etapa anterior falhar; o backup
  fica em `/tmp` com `chmod 600` e nunca vira artifact; o relatório final
  declara explicitamente que não mede RTO de produção.
- Limite explícito, não coberto por este item: os campos cifrados da fixture
  (`profile_encrypted`/`payload_encrypted`) são strings literais no formato
  `enc:v1:synthetic-...`, não ciphertext real de `encryptClinicalJson`
  (`functions/api/tenant/_crypto.ts`) — o ensaio prova o mecanismo de
  backup/export/import/Time Travel/undo contra D1 remoto real, não que um
  payload clínico cifrado de verdade sobrevive e decifra após restore. Essa
  prova adicional depende do keyring clínico existir em produção
  (`CLINICAL_CRYPTO_NOT_READY`, ainda `BLOCKED_EXTERNAL`).
- Rollback: nenhum — reconciliação de documentação apenas.

### LEG-17 — busca de memória clínica escapa % e _ (ciclo 8, 2026-09-28)
- Achado original: `docs/audits/SAAS_TENANCY_AUDIT_2026-09-26.md`
  (referenciado como "aquecimento" não avaliado em `STATE.md`).
- Escopo: `functions/api/memory/index.ts` (`onRequestGet`), teste novo
  `tests/unit/memory-search-like-escape.test.mjs`, uma linha em
  `package.json` (`test:quick-wins`). Sem migração.
- Defeito provado (RED, `git stash` do arquivo de produção): duas notas
  sintéticas, `"underscore_test"` e `"underscoreXtest"`, da mesma paciente;
  buscar por `q=underscore_test` devolvia as DUAS — o `_` não escapado em
  `%${query}%` era lido como curinga de um caractere pelo SQLite, então
  `underscoreXtest` também casava. Sem impacto de isolamento: o predicado
  `patient_id = ?` já restringe a busca à paciente autorizada
  (`getPatientAccess`, anti-enumeração inalterada); o defeito só distorcia
  precisão dentro desse escopo.
- Fix: reuso do helper já existente e usado em produção em outro lugar do
  mesmo domínio (`escapeLike`, `functions/api/patients/_contract.ts:214`,
  já usado por `functions/api/patients/index.ts` e
  `functions/api/tenants/[id]/audit.ts`) — `%${escapeLike(query)}%` com
  `LIKE ? ESCAPE '\'` nas três colunas buscadas (`title`, `content`, `tags`).
- GREEN: mesmo teste → busca por `"underscore_test"` casa só a nota literal;
  controle sem `_` no termo (`q=underscore`) continua casando as duas notas
  (substring normal preservado).
- Regressão completa, todas exit 0: `npm run check`; `npx eslint
  functions/api/memory/index.ts tests/unit/memory-search-like-escape.test.mjs
  --max-warnings=0`; `tests/unit/no-fake-clinical-write.test.ts`;
  `tests/unit/memory-search-ownership.test.ts`;
  `tests/unit/patient-access-anti-enumeration.test.ts`;
  `tests/unit/patient-access-anti-enumeration-static.test.mjs`;
  `tests/unit/quick-wins-static.test.mjs`; `npm run test:quick-wins`
  completo (0 `not ok`).
- Fixtures 100% sintéticas (nomes de teste, sem PHI).
- Rollback: reverter o commit; sem migração, sem efeito em dado persistido.
