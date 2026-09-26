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

## S11 · P1 · aberto
`POST /api/tenants/:id/members` insere direto qualquer conta existente da
plataforma como membro, pelo e-mail, sem convite nem aceite — e é oráculo de
enumeração (404 e-mail inexistente vs 409 papel incompatível vs 201 com
nome). (LTB-03, AUTHZ-P1-05)

## S12 · P1 · aberto
Export/purge de tenant se declaram completos mas cobrem só `clinics`,
`clinic_memberships`, `live_patients`, `live_clinical_events`,
`billing_customers/subscriptions`. Documentos (PDFs arquivados),
avaliações, intake, respostas de escala, `clinic_settings` e auditoria
ficam fora — e o purge de encerramento apaga o que o export nunca levou.
(LTB-02)
