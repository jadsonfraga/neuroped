# Backlog da espiral SaaS

Prioridade: P0 segurança/perda/risco clínico · P1 jornada contratada,
cobrança, isolamento, recuperação · P2 usabilidade/confiabilidade ·
P3 refinamento/expansão.

## S1 · P1 · FECHADO (ciclo 1)
go-live declara nível atestado e o que não comprova. Evidência em
EVIDENCE.md#S1.

## S2 · P2 · FECHADO (ciclo 2)
Recusa EMAIL_VERIFICATION_REQUIRED no onboarding exibe "Reenviar link de
verificação" levando a `#/verificar-email`. Contrato:
tests/unit/onboarding-verification-link.test.mjs (em test:quick-wins).

## S3 · P1 · FECHADO (ciclo 3)
Acesso (12) e Comercial (8) inventariados com evidência por import direto;
lacuna auth/me fechada com contrato próprio no mesmo ciclo. Próximo domínio
a inventariar: Núcleo clínico.

## S4 · P1 · bloqueado externamente
Integração sandbox Asaas real (degrau INTEGRACAO_SANDBOX_EXERCITADA).
Bloqueio: exige credencial sandbox autorizada pelo proprietário; testes
atuais interceptam o provedor. Comprovação esperada: webhook sandbox
autenticado processado num ambiente publicado.

## S5 · P2 · aberto
Restauração demonstrada (§12): diferenciar backup configurado/executado/
restauração exercitada, com prova em ambiente isolado.

## Ciclo 4 (2026-09-26) — auditoria completa de tenancy
Auditoria de 79 lacunas em 4 domínios (auth/authz, clínico legado, agenda,
LIVE/tenants/billing). Relatório completo com evidência arquivo:linha em
`docs/audits/SAAS_TENANCY_AUDIT_2026-09-26.md`. Os itens abaixo (S6+) vêm
dessa auditoria; os IDs entre parênteses referenciam os achados originais.

## S6 · P1 · FECHADO (ciclo 4)
Webhook do Asaas (`POST /api/billing/webhook`) nunca era alcançado: o
middleware global exige `Authorization: Bearer` antes do handler validar o
token próprio (`asaas-access-token`, comparação em tempo constante,
32+ caracteres). Toda reconciliação automática de cobrança (ativação,
past_due, reativação) estava morta; dependia de UPDATE manual no D1.
(AUTHZ-P1-03 / achado independente confirmado por leitura direta.)
Evidência: EVIDENCE.md#S6.

## S7 · P0 · FECHADO (ciclo 4)
`CHECKOUT_EXPIRED`/`CHECKOUT_CANCELED`/`PAYMENT_DELETED` cancelavam de forma
TERMINAL o customer e a assinatura da clínica, mesmo com trial válido ou
assinatura ativa paga — sem rota de reativação (o trigger de banco impede
sair de `canceled`). Um clique em "Gerenciar assentos" que gerasse um
checkout novo e o cliente não concluísse bastava para derrubar
permanentemente uma clínica pagante. (LTB-01)
Evidência: EVIDENCE.md#S7.

## S8 · P0 · FECHADO (ciclo 4) — OPS-01; OPS-02 parcialmente mitigado
Agenda/operações (`booking_*`, `appointments`, `waitlist_entries`,
`appointment_reviews`, `notification_outbox`, `operations_audit_log`) não
tinham `clinic_id`: o escopo era só `provider_user_id`. Um profissional
membro de duas clínicas via, no contexto B, a agenda inteira (com PHI
decifrada) da clínica A — inclusive a secretária vinculada a ele em B.
(OPS-01 — FECHADO.)

Migração aditiva `0026_operations_clinic_scope.sql`: `clinic_id` (nullable)
em 8 tabelas, backfill determinístico pela única membership ativa do
provider (0/2+ memberships fica NULL, nunca adivinhado). Todo filtro
autenticado em `functions/api/operations/{index,_core,_access}.ts` passou a
exigir `clinic_id` no predicado; regras/bloqueios de agenda também
(configuração é por clínica). Ocupação de horário (`appointments` no
cálculo de vagas) e triggers de conflito físico continuam SEM filtro de
clínica de propósito — o profissional é uma pessoa só, não pode ser
escalado em duas clínicas ao mesmo tempo.

OPS-02 (diretório público cross-clínica) permanece PARCIALMENTE aberto: o
perfil/horários/reserva pública já recusam (fail-closed, 409/404) um
profissional com clínica ambígua (0 ou 2+ memberships), e o diretório
(`action=providers`) já exclui esses casos — mas o link público ainda é por
slug global, não por clínica (`/agendar?clinic=<slug>`), redesenho de rota
que fica para uma camada própria (ver S13).

Teste de isolamento novo: `tests/unit/operations-tenant-isolation.test.ts`
(harness real: schema.d1.sql + todas as migrações + handlers reais),
incluído em `npm run test:operations`. Visto falhando pelo motivo certo
contra o código anterior (serviço da clínica A aparecia no dashboard de B).
Evidência em EVIDENCE.md#S8.

## S13 · P1 · aberto
Redesenho do link público de agendamento por clínica
(`/agendar?clinic=<slug>&provider=<slug>` ou `/c/:clinicSlug/agendar`),
substituindo o slug global de `booking_provider_profiles` (PK `user_id`,
`slug UNIQUE` global — OPS-05) e o diretório cross-clínica de
`action=providers`. Depende de mudança de rota no frontend
(`client/src/pages/agendar.tsx`, `marcacao.tsx`, `navigation.ts`), fora do
escopo de S8 (isolamento de dados no backend autenticado).

## S14 · P2 · FECHADO (ciclo 4)
Links públicos de intake (pré-consulta) e de escala remota ignoravam o
status da clínica: uma família continuava enviando PHI para uma clínica
suspensa ou encerrada, porque `resolveInvitation` em `public-intake.ts`/
`public-scale.ts` nunca olhava `clinics.status`. (LTB-14)
Corrigido: `invitationStateFailure` em ambos os handlers passa a recusar
(410, código `INTAKE_UNAVAILABLE`/`SCALE_INVITATION_UNAVAILABLE`) sempre
que `clinic.status <> 'active'` — cobre também `closure_requested`, que já
marca `clinics.status='suspended'`. Evidência em EVIDENCE.md#S14.

## S15 · P2 · FECHADO (ciclo 4)
Com trial vencido ou billing suspenso, o owner não conseguia sequer LISTAR
ou REMOVER membros e convites (escopo `admin` exigido em TODO método de
`/members` e `/invitations`, inclusive GET/DELETE) — a clínica era
obrigada a continuar pagando por assentos que nem conseguia enxergar para
reduzir. (LTB-15)
Corrigido: `functions/api/tenants/[id]/_middleware.ts` só aplica o gate de
billing a POST em `/members`; `functions/api/billing/invitations.ts` separa
`managerBase` (membership, sempre exigida) de `manager` (membership +
billing, só para criar/reenviar). GET e DELETE passam a exigir apenas
membership de gestor. Evidência em EVIDENCE.md#S15.

## S16 · P2 · FECHADO (ciclo 4)
As rotas clínicas legadas (patients/[id], patients/[id]/results, results,
results/[id], scales/results, consultations, clinical-core, conecta,
conecta/[id], memory) respondiam 404 para paciente inexistente e 403 para
paciente de outro owner — um oráculo de enumeração cross-tenant: o status
diferente revela que o id pertence a alguém, só não a quem perguntou.
(AUTHZ-P2-11, LEG-10)
Corrigido nos 10 arquivos: as duas checagens (`!access.exists`/
`!access.allowed`) viram uma condição combinada, sempre 404 com a mesma
mensagem/código. Guard estático novo
(`tests/unit/patient-access-anti-enumeration-static.test.mjs`) falha o CI
se a checagem separada voltar em qualquer um dos 10 arquivos. Prova
comportamental em `tests/unit/patient-access-anti-enumeration.test.ts`
contra o schema real. Evidência em EVIDENCE.md#S16.
Fora do escopo desta camada, de propósito: `memory/[id].ts` já unifica
implicitamente (só checa `.allowed`), mas tem um problema mais profundo
(mutação final sem repetir owner/tenant no predicado, sem verificar
`changes()`) — isso é LEG-09/AUTHZ-P2-12, candidato a próxima camada.

## S17 · P1 · FECHADO (ciclo 4)
Três mutações clínicas legadas (`conecta/[id].ts` DELETE, `memory/[id].ts`
PATCH e DELETE, `results/[id].ts` DELETE) autorizavam via `getPatientAccess`
antes da escrita, mas a escrita final não repetia o owner no predicado SQL
— só `WHERE id = ?` (`memory/[id].ts` DELETE também não verificava
`changes()`, e `results/[id].ts` DELETE reportava `deleted:false` com
status 200 em vez de 404 quando nada era afetado). Uma corrida entre a
checagem de acesso e a mutação (o paciente muda de dono nesse intervalo)
bastava para uma escrita/remoção cross-owner silenciosa. (LEG-09/AUTHZ-P2-12,
identificado ao fechar S16)

Corrigido nos três arquivos: a mutação final passou a incluir
`AND patient_id IN (SELECT id FROM patients_demo WHERE owner_user_id = ?)`
quando o usuário não é admin (mesma exceção de admin já existente antes),
e `changes()` é verificado sempre — 404 "não encontrado" quando o efeito
não for exatamente 1 linha, nunca sucesso presumido.

Teste novo `tests/unit/legacy-mutation-owner-predicate.test.ts` (schema real
+ todas as migrações + handlers reais), incluído em `test:quick-wins`: um
wrapper de D1 injeta a reatribuição de dono exatamente na janela entre a
checagem de acesso e a mutação final (simulando a corrida), provando que as
quatro mutações agora recusam com 404 e não afetam nenhuma linha — mais um
controle por handler provando que o caminho normal do dono legítimo não
regrediu. As quatro falhas foram vistas isoladamente (um `git stash` por
arquivo) pelo motivo certo contra o código anterior: `conecta` e
`results/[id].ts` DELETE respondiam 200; `memory/[id].ts` PATCH respondia
200; `memory/[id].ts` DELETE respondia 204 mesmo sem afetar linha alguma.
Evidência em EVIDENCE.md#S17.

## S18 · P1 · FECHADO (ciclo 4)
O bridge de importação do BoaConsulta (`functions/api/integrations/
boaconsulta/import.ts`, GET e POST) autorizava só por
`canWriteClinicalData(user)` — verdadeiro para qualquer conta com papel
GLOBAL "professional", que é o papel com que TODO signup nasce (sem
clínica, sem billing, sem e-mail verificado). Diferente de `patients/**` e
`operations/**`, a pasta `functions/api/integrations` não tinha nenhum
`_middleware.ts` de clínica/billing. Provado em runtime: uma conta
recém-criada, zero `clinic_memberships`, conseguia hoje enviar um CSV com
PHI de terceiros e receber 201, com a linha persistida em
`external_import_batches`. (AUTHZ-P1-09, achado duas vezes na auditoria
também como OPS-09)

Corrigido: novo `functions/api/integrations/_middleware.ts`, cópia do
padrão já em produção duas vezes (`patients/_middleware.ts` e
`operations/_middleware.ts`, byte a byte idênticos) — resolve a clínica via
`resolveBillingClinicId` e exige `requireBillingEntitlement(...,
"clinical")`; sem clínica ou billing suspenso, 409/402/423 antes do handler
rodar, sem mudar nenhuma linha de `import.ts`. Sem migração (o backfill de
`clinic_id` em `external_import_*` fica como melhoria de rastreabilidade
separada, não é pré-requisito para fechar o buraco de autorização).

Teste novo `tests/unit/integrations-tenant-gate.test.ts` (schema real +
todas as migrações, handlers reais, FormData/File real de multipart)
encadeia o middleware novo com o handler real: prova 409 + zero lotes
criados para conta sem clínica (GET e POST), 402 para billing suspenso
(mesma paridade de patients/operations), e um controle de não-regressão
(clínica ativa com billing em dia continua importando e listando
normalmente). Visto falhando pelo motivo certo contra o código anterior via
`git stash push -u` do arquivo novo (module not found — o gate simplesmente
não existia) e, adicionalmente, confirmado que o handler `import.ts`
sozinho, sem o middleware na frente, aceita e persiste o upload de uma
conta sem clínica (201, 1 lote criado) — a prova concreta do buraco.
Evidência em EVIDENCE.md#S18.

## S19 · P1 · FECHADO (ciclo 4)
`run-deletion.ts` e `run-export.ts` (execução de eliminação/exportação LGPD)
pulavam INTEIRAMENTE membership e billing quando `isAdmin(user)` era
verdadeiro, para o `clinicId` vindo do BODY da requisição — sem exigir
nenhuma razão declarada. A trilha de sucesso só era gravada DEPOIS da
eliminação/exportação física, em `try/catch` que só fazia `console.error`
na falha: a ação já tinha acontecido independente de a trilha existir.
`audit-log.ts` (leitura global de `audit_logs` por qualquer admin) também
não gerava trilha nenhuma da própria leitura. Viola diretamente o AGENTS.md:
"Admin global não é fallback de rota clínica comum; ações de plataforma
exigem escopo, razão e auditoria." Comprovado comportamentalmente pelo próprio
teste existente: `PLATFORM_ADMIN` sem nenhuma membership em RED executava a
eliminação de escopo `clinic` com sucesso, sem `reason` e sem trilha
prévia. (AUTHZ-P1-08, LTB-19 — mesmo par de arquivos achado por dois
agentes de varredura independentes desta sessão)

Corrigido nos três arquivos: quando `platformAdmin` é verdadeiro, uma
`reason` (10-500 caracteres) passa a ser obrigatória — 400
`REASON_REQUIRED` ANTES de sequer olhar o ledger da requisição, sem tocar
`live_deletion_requests`/`live_export_requests`/`live_lgpd_worker_jobs`. Com
`reason` válida, uma trilha em `saas_audit_log`
(`platform_admin_run_deletion_initiated`/`platform_admin_run_export_initiated`,
metadata com a razão e o escopo) é gravada de forma SÍNCRONA e FAIL-CLOSED
logo depois dos guards de escopo/status e ANTES de `claimLgpdRequest` — se a
gravação falhar, a ação não é sequer reivindicada (500
`AUDIT_WRITE_FAILED`). Em `audit-log.ts`, cada leitura bem-sucedida agora
grava (best-effort, via `context.waitUntil`, para não transformar uma
leitura autorizada em falha) uma trilha `platform_audit_log_read` com
`clinic_id: null` (cross-tenant por natureza) e metadata só com os filtros
usados (sem PID/IP de terceiros).

Testes: `tests/unit/lgpd-run-deletion-endpoint.test.ts` e
`tests/unit/lgpd-run-export-endpoint.test.ts` (schema real + handler real)
ganham cenários provando (a) 400 sem `reason`, ledger intocado; (b) 200 com
`reason`, com a trilha prévia gravada com a razão exata; (c) em
run-deletion, um caso extra de corrida de claim (lease de outro worker já
válido) provando que a trilha prévia SOBREVIVE mesmo quando a execução
falha depois — o ponto central do achado. `tests/unit/audit-log-contract.test.ts`
ganha um cenário (schema real) provando que uma leitura de admin gera a
trilha própria, cross-tenant, sem PHI. Todas as quatro asserções novas
vistas falhando pelo motivo certo contra o código anterior via `git stash`
isolado por arquivo. Evidência em EVIDENCE.md#S19.

## S20 · P2 · FECHADO (ciclo 4)
`POST /api/operations` `action=staff_link` (vínculo de recepção por e-mail)
respondia com status/código DISTINTOS para três situações: e-mail sem conta
na plataforma (404 `STAFF_NOT_FOUND`), conta existente sem papel `operator`
ativo (409 `STAFF_ROLE_INVALID`) e conta `operator` válida mas já vinculada
a outro profissional (409 `STAFF_ALREADY_LINKED`) — um oráculo que deixava
qualquer profissional/admin da plataforma sondar e-mails alheios e aprender
se existem, qual o papel e se já estão comprometidos com outro profissional.
(AUTHZ-P1-06 residual, achado ao reler a auditoria depois de S8 já ter
fechado o isolamento de dados do domínio — o vínculo em si continuava sem
escopo de clínica)

Corrigido em `functions/api/operations/index.ts`: as três situações passam
a responder exatamente igual — 404 `STAFF_NOT_AVAILABLE`, mesma mensagem.
`SELF_LINK_INVALID` (409, informação só sobre o próprio e-mail do chamador)
e `FORBIDDEN` (403, sobre a permissão do próprio chamador) continuam
distintos — nenhum dos dois revela nada sobre a conta de terceiros. Nenhuma
mudança em `functions/api/operations/_access.ts` (os códigos internos
continuam existindo ali; o que mudou é só o que `index.ts` expõe ao
cliente).

Teste novo `tests/unit/operations-staff-link-anti-enumeration.test.ts`
(schema real + handler real de `POST /api/operations`) prova que as três
situações respondem status E corpo idênticos, e um controle prova que o
vínculo de um operador genuinamente disponível continua funcionando
normalmente. Visto falhando pelo motivo certo contra o código anterior via
`git stash` (409 em vez de 404 para "papel inválido"). Guard estático em
`tests/unit/operations-integration-static.test.mjs` atualizado: a asserção
que exigia `STAFF_ALREADY_LINKED` como mensagem explícita do cliente foi
substituída por uma que exige o código único `STAFF_NOT_AVAILABLE` e proíbe
`STAFF_ALREADY_LINKED` reaparecer como branch de resposta separado.
Evidência em EVIDENCE.md#S20.

## S21 · P2 · FECHADO (ciclo 4)
Nenhuma rota expunha a trilha de auditoria SaaS (`saas_audit_log`) para o
owner/clinic_admin da própria clínica: só o admin global lia `audit_logs`
(tabela legada, sem `clinic_id`), e `tenants/[id]/metrics.ts` só expõe
contagens agregadas (DAU/WAU/MAU), nunca os eventos em si. Uma clínica não
tinha como responder "quem fez o quê" sobre a própria operação — nenhuma
lacuna de isolamento (o que já existia era seguro), mas uma lacuna de
funcionalidade que a auditoria apontou como parte do pacote "plataforma
autogerenciável". (AUTHZ-P1-10)

Fechado com um endpoint novo, só leitura: `GET /api/tenants/:id/audit`
(`functions/api/tenants/[id]/audit.ts`), paginado, reaproveitando
`saas_audit_log` (já existente, `clinic_id`/`actor_user_id`/`action`/
`target_type`/`metadata_json`, sempre metadata-only) e o MESMO guard já
usado em `metrics.ts`/`export.ts`: membership ativa com papel de gestor
(`owner`/`clinic_admin`) numa clínica `active`, com 404 genérico e
IDÊNTICO para clínica inexistente, sem membership, papel insuficiente ou
clínica suspensa/encerrada (anti-enumeração). Nenhuma migração, nenhum
middleware global tocado, nenhuma mudança de rota de frontend.

Teste novo `tests/unit/tenant-audit-trail.test.ts` (schema real + handler
real) prova isolamento entre duas clínicas sintéticas, o guard de papel
(professional comum não lê), a resposta idêntica para clínica alheia vs.
inexistente vs. papel insuficiente, a recusa de clínica suspensa, e
paginação básica. Visto falhando pelo motivo certo contra o código anterior
(o arquivo simplesmente não existia — `git stash push -u`, module not
found). Evidência em EVIDENCE.md#S21.

## S9 · P0 · bloqueado externamente (censo de produção necessário)
Papel global `admin` é bypass clínico em todas as rotas legadas
(`patients_demo` e filhas): lê, altera e apaga pacientes/consultas/escalas/
memória de QUALQUER usuário/clínica. Remover o bypass sem antes fazer
backfill de `clinic_id` a partir da membership do owner pode cortar o
próprio acesso do cliente zero a linhas hoje só visíveis via admin (owner
NULL, seeds, dados pré-0002). (AUTHZ-P0-01, LEG-01, LEG-02, LEG-03, LEG-04)
Bloqueio: exige um censo read-only de produção (contagem por tabela e por
status de owner) que este ambiente não pode fazer sem acesso ao D1 real.
Ver `docs/audits/BLOCKED_EXTERNAL_LEGACY_TENANT_CENSUS_2026-09-26.md`.

## S10 · P1 · aberto
Modelo de papel duplo e incoerente: o middleware global decide TODA escrita
pelo papel GLOBAL do usuário (admin/professional escrevem; reader/operator
não), enquanto os handlers SaaS decidem pela membership da clínica. Um
`assistant`/`financial` legítimo de uma clínica não consegue operar; um
`professional` global com paciente legado próprio escreve mesmo sendo só
`financial` na clínica. (AUTHZ-P1-07, LTB-05, LEG-13, OPS-04)

## S11 · P1 · FECHADO (ciclo 4)
`POST /api/tenants/:id/members` inseria direto qualquer conta existente da
plataforma como membro, pelo e-mail, sem convite nem aceite — e era oráculo
de enumeração (404 e-mail inexistente vs 409 papel incompatível vs 201 com
nome). (LTB-03, AUTHZ-P1-05)
Corrigido: a rota exige agora que o alvo já seja membro ATIVO da clínica; a
resposta é idêntica (404 `MEMBER_NOT_FOUND`) para e-mail sem conta, conta
sem membership aqui, ou membership desativada. Entrada de gente nova
continua exclusiva de `POST /api/billing/invitations` + `accept`. Evidência
em EVIDENCE.md#S11.

## S12 · P0 · FECHADO parcialmente (ciclo 4) — purge seguro; export ainda incompleto
Export do tenant se declarava `complete: true` sempre, cobrindo só `clinics`,
`clinic_memberships`, `live_patients`, `live_clinical_events`,
`billing_customers/subscriptions`. Documentos (PDFs arquivados),
avaliações, intake e respostas de escala remota ficavam fora — e o purge de
encerramento (`_purge.ts`, escopo `clinic`) apagava exatamente o que o
export nunca tinha levado, sem checagem nenhuma. (LTB-02)

Fechado nesta sessão o lado que evita PERDA IRREVERSÍVEL: `_purge.ts` agora
recusa (`EXPORT_MANIFEST_INCOMPLETE:<tabela>`) qualquer purge de escopo
`clinic` enquanto sobrar linha da clínica em `live_documents`,
`live_document_versions`, `live_assessments`, `live_assessment_responses`,
`live_intake_invitations`, `live_intake_submissions`,
`live_scale_invitations` ou `live_scale_responses` — a mesma lista
(`EXPORT_UNCOVERED_CLINIC_TABLES`, em `_exportPayload.ts`) usada para
calcular `complete` honestamente no manifesto de export. Isso significa que
HOJE nenhuma clínica com PDFs, avaliações, intake ou escala respondida
consegue completar o encerramento com purge físico — comportamento
deliberado (fail-closed) até o export cobrir esses domínios.

## S12B · P1 · aberto
Expandir `collectTenantExportPayload` para incluir de fato documentos
(com conteúdo decifrado ou referência ao artefato), avaliações e respostas,
intake e respostas de escala, `clinic_settings` e `live_retention_policies`
no payload exportado — o que fecha `complete` para `true` nessas clínicas e
libera o purge de encerramento sem depender de o admin de plataforma
esvaziar as tabelas manualmente. Cuidado: volume (documentos podem ter até
~250 KB em base64 cada) pode exigir ajustar `exportWithinSyncLimits` e
priorizar o caminho assíncrono (worker) para tenants médios/grandes.
