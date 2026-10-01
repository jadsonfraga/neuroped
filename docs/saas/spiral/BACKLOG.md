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

## S5 · P2 · FECHADO (mecanismo; reconciliação de docs, ciclo 8, 2026-09-28)
Restauração demonstrada (§12): diferenciar backup configurado/executado/
restauração exercitada, com prova em ambiente isolado.

Fechamento não registrado quando entregue: a PR #1014
(`fix/s5-dr-restoration-evidence`, mesclada em `1a37947`, 2026-09-27 16:00
-03:00) já havia adicionado `.github/workflows/dr-mechanism-rehearsal.yml` e
executado com sucesso o run `36316874897` (`workflow_dispatch`, commit
`8b861da`, 2026-09-27T11:47:32Z–11:49:46Z, 15/15 etapas verdes) — mas
`STATE.md`/`BACKLOG.md`/`EVIDENCE.md` nunca foram atualizados para refletir
isso. `docs/audits/S13_DIRECTORY_SERVICE_CLINIC_2026-09-27.md` (escrito às
11h54, antes da mesclagem das 16h) ainda listava S5 como aberto — essa
observação precede a evidência e não a invalida. Reconciliado nesta sessão
depois de reler o workflow e confirmar o run diretamente pela API do GitHub
(`get_workflow_run`/`list_workflow_jobs`), não apenas pelo relato da PR.
Evidência em EVIDENCE.md#S5.

Escopo do que ficou provado, e o que não: backup real via `wrangler d1
export`/`d1 execute --file` contra dois D1 remotos temporários (nunca
produção), com schema+migrações reais e fixtures sintéticas, restauração em
alvo distinto, Time Travel e undo do próprio restore, tudo reconciliado por
fingerprint SHA-256 de contagens/tamanhos (nunca conteúdo). Os campos
`profile_encrypted`/`payload_encrypted` da fixture são strings literais
(`'enc:v1:synthetic-...'`), não ciphertext real do `_crypto.ts` — então isto
prova o mecanismo de backup/restore/Time Travel em infraestrutura real, não
que um payload clínico cifrado de verdade sobrevive e decifra depois de um
restore. Essa segunda prova continua bloqueada pelos mesmos dois itens P0 já
documentados (`CLINICAL_CRYPTO_NOT_READY`, keyring inexistente em produção) e
deveria ser um ensaio futuro que reusa este mesmo workflow com
`encryptClinicalJson` real assim que o keyring existir.

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

Migração aditiva `0029_operations_clinic_scope.sql` (renumerada de 0026 para
0029 na abertura da PR #988: os prefixos 0026-0028 já estavam reservados por
outras PRs abertas concorrentemente — #986 e #840 — segundo a governança de
migrations entre PRs abertos): `clinic_id` (nullable)
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

## S13 · P1 · FECHADO parcialmente (ciclo 5) — desambiguação por slug; redesenho de rota ainda aberto
Menor incremento seguro: o link público de agendamento pode declarar a
clínica via `?clinic=<slug da clínica>` (perfil, horários, reserva, lista de
espera e diretório em `functions/api/public-booking.ts`), resolvida por
`resolveProviderClinicBySlug` (`functions/api/operations/_core.ts`) — que
CONFIRMA a membership ativa do profissional exatamente naquela clínica
(`clinics.slug`, já única, sem migração nova), em vez de inferir pela
contagem total de memberships. Um profissional em duas clínicas deixa de
cair na ambiguidade de `resolveProviderSoleClinicId` quando o link já
declara qual das duas é a certa. Sem o parâmetro, o comportamento antigo
(exige exatamente uma clínica ativa) é preservado — links já
compartilhados/salvos continuam funcionando. O botão "copiar link público"
em `client/src/pages/agenda.tsx` já gera o link com `&clinic=<slug>` a
partir da clínica ativa da sessão (`useClinic().activeClinic.slug`).

Continua aberto, deliberadamente fora deste incremento: o redesenho de rota
(`/c/:clinicSlug/agendar`), a troca de PK de `booking_provider_profiles`
(hoje `user_id`, `slug UNIQUE` global — OPS-05) e de `booking_staff_links`
(OPS-03), e qualquer geração automática de link a partir de convite/
notificação. Isso exigiria migração, backfill e período de compatibilidade
para links antigos — não é um incremento seguro de escopo único. Evidência
em EVIDENCE.md#S13.

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

## S22 · P3 · FECHADO (ciclo 4)
`POST /api/public-booking` `action=manage` (autoatendimento da família pelo
token da reserva) devolvia o DTO completo de `appointmentToApi` — o mesmo
usado no painel PRIVADO do profissional — incluindo `providerUserId`/
`patientId` (identificadores internos sem uso legítimo para a família) e
`amountCents`/`paymentMethod` (detalhe financeiro granular que nem a
recepção delegada enxerga: `operations/index.ts` já redige exatamente esses
dois campos, `amountCents: null` e `paymentMethod: null`, para quem não é
`principal.canConfigure`). Um token de reserva (não autenticado) dava mais
acesso a esses dados do que a própria secretária autenticada da clínica.
(OPS-19)

Corrigido em `functions/api/public-booking.ts`: a resposta de
`action=manage` passou a listar explicitamente os campos que a família
precisa (nome/telefone/e-mail do responsável, nome do paciente, horário,
status, status de pagamento — mantido, pois é o autoatendimento que precisa
saber se pagou —, serviço) e omite `providerUserId`, `patientId`,
`amountCents` e `paymentMethod`. Confirmado que o frontend (`agendar.tsx`)
nunca lia nenhum desses quatro campos — pura redução de superfície, sem
regressão de UX.

Teste novo `tests/unit/public-booking-manage-redaction.test.ts` (schema
real + handler real) cria uma reserva sintética com `patient_id`,
`amount_cents` e `payment_method` preenchidos e prova que a resposta de
`action=manage` não tem mais essas quatro chaves nem o valor do
`patient_id` em lugar nenhum do corpo, mantendo os campos de
autoatendimento (incluindo `paymentStatus`). Visto falhando pelo motivo
certo contra o código anterior via `git stash`. Evidência em
EVIDENCE.md#S22.

## S23 · P1 · FECHADO (ciclo 6, 2026-09-27)
A recepção delegada (papel global `operator`, vinculada a um profissional em
`booking_staff_links`) nunca alcançava a agenda: `functions/api/operations/
_middleware.ts` resolvia clínica e entitlement pelo ATOR, e a secretária não
tem membership clínica. Toda chamada morria em 409
`BILLING_CLINIC_CONTEXT_REQUIRED` antes do handler, embora o handler
(`preparePrincipal`) e o middleware global já tivessem sido desenhados para
a delegação. O papel "secretária" vendido não funcionava. (AUTHZ-P1-04,
metade `operator`)

Corrigido só no middleware: para `operator`, resolve o vínculo ativo
persistido (`resolveOperationsPrincipal`, o mesmo usado pelo handler) e
aplica clínica + billing + status da clínica do PROFISSIONAL responsável.
Sem vínculo ativo → 403 `STAFF_LINK_REQUIRED` no próprio gate (fail-closed).
O header `X-Tenant-Id` continua sendo alvo, nunca autoridade: só vale se o
profissional responsável for membro ativo daquela clínica. Nenhuma migração
e nenhuma mudança de handler. A redação da recepção (sem valores, forma de
pagamento, equipe ou configuração) já existia e agora é exercitada.

Teste novo: `tests/unit/operations-delegated-staff-gate.test.ts`, com schema
real, middleware real encadeado ao handler real e clínicas Alfa/Beta
sintéticas, incluído em `test:operations`. Evidência em EVIDENCE.md#S23.

Complemento no mesmo ciclo (S23b, AUTHZ-P1-06 residual): `staff_link`
aceitava QUALQUER conta `operator` da plataforma, de qualquer clínica, sem
aceite. Agora só é possível vincular quem é membro `assistant` ativo da
MESMA clínica, ou seja, quem aceitou convite dela. A condição é repetida no
predicado do INSERT/UPDATE (sem janela de corrida), e a recusa responde o
mesmo 404 `STAFF_NOT_AVAILABLE` dos demais casos (anti-enumeração). A tela
da agenda passou a orientar o fluxo: convidar como Assistente em
Configurações › Equipe e, após o aceite, vincular. Vínculos já existentes
não foram alterados (sem migração e sem corte do cliente zero). A exigência
de membership em tempo de uso para vínculos antigos depende de censo de
produção.

Continua aberto em S10: membership `assistant`/`financial` sem escopo próprio
(o escopo `clinical` exige owner/clinic_admin/professional), ou seja, a
secretária modelada como membro da clínica em vez de delegação por
profissional. É uma mudança de modelo de papéis e fica em PR separada.

## S9 · P0 · aberto — censo observado, associação legítima pendente
Atualização 26/09/2026, 21:07 UTC: o workflow 36271735655 executou o censo
de produção com sucesso após a PR #994. Três pacientes não têm owner; um
tem owner sem clínica ativa. Nenhum vínculo de tenant é inequívoco.
Estabelecer a destinação autorizada e comprovar a associação do cliente zero
antes do backfill; não atribuir registros ao admin por inferência.
Evidência em `docs/audits/LEGACY_TENANT_CENSUS_OBSERVED_2026-09-26.md`.

Contexto e bloqueio original, preservados para rastreabilidade:
Papel global `admin` é bypass clínico em todas as rotas legadas
(`patients_demo` e filhas): lê, altera e apaga pacientes/consultas/escalas/
memória de QUALQUER usuário/clínica. Remover o bypass sem antes fazer
backfill de `clinic_id` a partir da membership do owner pode cortar o
próprio acesso do cliente zero a linhas hoje só visíveis via admin (owner
NULL, seeds, dados pré-0002). (AUTHZ-P0-01, LEG-01, LEG-02, LEG-03, LEG-04)
Bloqueio: exige um censo read-only de produção (contagem por tabela e por
status de owner) que este ambiente não pode fazer sem acesso ao D1 real.
Ver `docs/audits/BLOCKED_EXTERNAL_LEGACY_TENANT_CENSUS_2026-09-26.md`.

## S10 · P1 · FECHADO parcialmente (ciclo 7, 2026-09-27)
Modelo de papel duplo e incoerente: o middleware global decidia TODA escrita
pelo papel GLOBAL do usuário (admin/professional escrevem; reader/operator
não), enquanto os handlers SaaS decidem pela membership da clínica.
(AUTHZ-P1-07, LTB-05, LEG-13, OPS-04)

Fechada nesta sessão a fatia concretamente provável e sem redesenho: uma
conta com membership `owner`/`clinic_admin`/`professional` numa clínica
(portanto com `clinical.write` concedido e entitlement de clínica ativo) era
barrada com 403 pelo gate global sempre que o papel GLOBAL da conta ficasse
desatualizado — caso real de `functions/api/billing/accept.ts`: o papel
global só é definido na PRIMEIRA conta criada por convite; convites
seguintes para OUTRA clínica com papel mais alto nunca revisitam o papel
global. `liveClinicalWriteAuthorization` (`functions/api/_middleware.ts`)
agora reautoriza escrita em `/api/live/**` pela MESMA fonte de verdade que o
próprio Clinical Core já usa (`getClinicMembership` +
`membershipCanWriteClinical`); sem isso, cai no gate global de sempre —
`/api/patients` e demais rotas legadas continuam com o comportamento
anterior, intocadas. Evidência em EVIDENCE.md#S10.

Continua aberto, deliberadamente fora deste incremento (exige mudança de
modelo de papéis, não uma reautorização pontual): `assistant`/`financial`
sem escopo operacional próprio fora do clínico (ex.: `/api/operations`
delegado depende hoje do papel global `operator`, não da membership); e um
`professional` GLOBAL com paciente LEGADO próprio (`patients_demo`,
`owner_user_id`, sem conceito de clínica) escreve nele independentemente do
papel que tenha em qualquer clínica — sem migração de S9, papel de clínica
não tem como se aplicar a um registro que nunca teve `clinic_id`.

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

## S12B · P1 · FECHADO (ciclo 5, 2026-09-26, correção de escopo na revisão)
`collectTenantExportPayload` passou a incluir de fato os oito domínios que
bloqueavam o purge — avaliações e respostas, documentos e versões (conteúdo
decifrado), convites/submissões de intake e de escala remota (token_hash
nunca sai) — fechando `complete` para `true` sempre que só esses domínios
restavam fora, e liberando o purge de encerramento sem depender de o admin
de plataforma esvaziar as tabelas manualmente. `exportWithinSyncLimits`
passou a somar os cinco novos campos cifrados na pré-checagem síncrona,
então um tenant com documentos grandes cai no caminho assíncrono (worker)
em vez de travar no caminho síncrono.

Correção pedida em revisão (PR #1004, revisor `jadsonfraga`): a primeira
entrega desta PR deixou `clinic_settings` e `live_retention_policies` fora
do payload e descreveu isso como "nunca fez parte do escopo de S12B" — o
que contradizia o texto original deste item, que pedia explicitamente os
dois. Nenhum dos dois é dado do titular (são configuração da clínica) nem
bloqueia purge (`PURGE_PRESERVED_TABLES` em `_purge.ts`), mas uma clínica
pedindo "todos os meus dados" espera ver a própria configuração/timbre
institucional também. Corrigido em PR separada (a #1004 mesclou antes do
push da correção): os dois agora saem no payload (`clinicSettings`/
`retentionPolicy`, `null` quando a clínica nunca configurou). A mesma PR
migra um cenário de `tests/unit/lgpd-purge-atomicity.test.ts` (PR #1002,
mesclada em paralelo) que dependia de `EXPORT_UNCOVERED_CLINIC_TABLES` ter
`live_documents` — S12B esvaziou a lista, então a corrida migrou para
`appointments` (mesma cerca atômica, tabela que segue genuinamente fora do
export). Evidência em EVIDENCE.md#S12B.


## S1-R1 · P1 · corrigido, integração em validação (#951)
O diagnóstico não atesta configuração presente quando incompleta. Regressão
cobre nove requisitos, env vazio, sete ambientes, acesso, no-store e segredo.
Preservados S2–S22; a revisão antiga não reabre funcionalidades já entregues.

## LTB-10 · P1 · FECHADO parcialmente (ciclo 8, 2026-09-27) — quatro olhos na eliminação
`docs/audits/SAAS_TENANCY_AUDIT_2026-09-26.md#LTB-10` registrou dois defeitos
na eliminação física de prontuário: (a) `evaluateDeletionEligibility` ignora
o piso legal de retenção para escopo `patient`; (b) um único gestor cria E
aprova sozinho o próprio pedido — sem segundo par de olhos.

Fechada nesta sessão só a fatia (b), sem tocar em (a). `POST` (criar) e
`PATCH` (aprovar) de `/api/live/governance` exigiam apenas
`membershipCanManage`, sem comparar `requested_by_user_id` com quem aprova.
`functions/api/live/governance/index.ts` (`onRequestPatch`) agora recusa
`409 FOUR_EYES_REQUIRED` quando `requestType === 'delete'`, o próximo status
é `approved` e o aprovador é a mesma pessoa que criou o pedido — antes de
checar a transição de workflow. `export`/`policy` não são afetados: export
não apaga nada e não pode exigir segundo gestor para a titular exportar os
próprios dados.

RED contra o código anterior (`git stash` de `governance/index.ts`):
autoaprovação de um pedido `delete` respondia `200`. GREEN com a trava:
`409 FOUR_EYES_REQUIRED`, status permanece `requested`; uma segunda gestora
aprova normalmente (`200` → `approved`). Teste novo:
`tests/unit/lgpd-deletion-four-eyes.test.ts`. Evidência em EVIDENCE.md#LTB-10.

Regressão completa, todas exit 0: `npm run check`, `npx eslint` nos dois
arquivos tocados, `tests/unit/cliente-zero-journey.test.ts`,
`tests/unit/lgpd-purge-executor.test.ts`,
`tests/unit/lgpd-purge-atomicity.test.ts`,
`tests/unit/lgpd-run-deletion-endpoint.test.ts`,
`tests/unit/lgpd-worker-executor-core.test.ts`,
`tests/unit/lgpd-worker-foundation.test.ts`,
`tests/unit/lgpd-worker-race-regressions.test.ts`,
`tests/unit/saas-live-clinical-domains.test.ts`,
`tests/unit/live-governance-failclosed.test.ts`,
`tests/unit/live-tenant-isolation-adversarial.test.ts`,
`tests/unit/live-read-audit-policy.test.ts`,
`tests/unit/tenant-management-authorization.test.ts` e
`npm run test:quick-wins` completo (0 `not ok`).

Continua aberto (a): o piso legal de retenção do prontuário para eliminação
de escopo `patient` numa clínica ATIVA. Não implementado nesta sessão porque
`tests/unit/cliente-zero-journey.test.ts` exercita deliberadamente um pedido
de eliminação como exercício do direito do titular (LGPD art. 18) numa
clínica ativa, sem retenção — mudar essa semântica é decisão jurídico-
regulatória (Lei 13.787/2018 e a retenção obrigatória de prontuário vs. LGPD
art. 16, que autoriza reter dado por cumprimento de obrigação legal mesmo
contra pedido de eliminação), não uma correção puramente técnica. Registrado
como `LEGAL_REVIEW_REQUIRED` em
`docs/audits/LEGAL_REVIEW_REQUIRED_CLINICAL_RETENTION_FLOOR_2026-09-27.md`.

## OPS-03 · agenda multiprofissional · EM ANDAMENTO (issue #1064)
Uma recepção atender mais de um profissional (hoje `booking_staff_links.staff_user_id`
é `UNIQUE`). Em PRs empilhadas: A (migração 0032, #1065), B (escolha validada no
servidor, #1066) e C (UI). Desenho, ordem de publicação, rollback, o risco aberto da
membership a cada requisição e o censo a rodar no D1 de produção estão em
`docs/saas/MULTI_PROVIDER_AGENDA.md`. Continua aberto: a visão unificada do dia (D) e
o endurecimento da membership para o vínculo único legado.
