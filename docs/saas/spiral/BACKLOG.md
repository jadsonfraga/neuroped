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

## S8 · P0 · aberto
Agenda/operações (`booking_*`, `appointments`, `waitlist_entries`,
`appointment_reviews`, `notification_outbox`, `operations_audit_log`) não
têm `clinic_id`: o escopo é só `provider_user_id`. Um profissional membro de
duas clínicas vê, no contexto B, a agenda inteira (com PHI decifrada) da
clínica A — inclusive a secretária vinculada a ele em B. O diretório público
de agendamento (`action=providers`) lista profissionais de TODAS as
clínicas e autoescolhe globalmente. (OPS-01, OPS-02)
Este é o item mais representativo da missão "multi-tenant sem perda":
requer migração aditiva (`clinic_id` em 8 tabelas) + backfill determinístico
pela membership única do provider + reescrita dos filtros em
`functions/api/operations/**` e `public-booking.ts`. Maior escopo que S6/S7;
tratado como camada própria.

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
