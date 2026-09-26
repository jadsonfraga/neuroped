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
