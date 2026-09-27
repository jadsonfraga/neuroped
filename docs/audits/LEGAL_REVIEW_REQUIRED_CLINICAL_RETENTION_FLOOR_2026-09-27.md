# Piso legal de retenção do prontuário na eliminação LGPD de paciente — revisão jurídica pendente

Verificação em 27/09/2026, sobre o HEAD `96d254a`, no âmbito da auditoria de
prontidão comercial (SaaS vendável). Achado original mais amplo em
`docs/audits/SAAS_TENANCY_AUDIT_2026-09-26.md#LTB-10`; a metade técnica
(quatro olhos na aprovação) foi corrigida nesta sessão — ver
`docs/saas/spiral/BACKLOG.md#LTB-10` e `EVIDENCE.md#LTB-10`. Este documento
cobre exclusivamente a metade que não foi alterada: o piso de retenção.

## O que o código faz hoje, comprovado por leitura direta

`functions/api/live/governance/_worker-executor.ts:102-124`
(`evaluateDeletionEligibility`):

- `legalHold = true` sempre bloqueia (`LEGAL_HOLD`) — não alterado, correto.
- Para `scope === "clinic"`, exige clínica não-ativa e `retentionUntil`
  materializado (`RETENTION_NOT_MATERIALIZED` caso contrário).
- Para `scope === "patient"`: se `retentionUntil` for `null`, **não há
  nenhuma checagem de retenção**. `allowed: true` imediatamente após passar
  no `legalHold`.

`functions/api/live/governance/_purge.ts` (`readFreshPolicySnapshot`) só lê
`clinics.status` e `tenant_lifecycle.*`. `tenant_lifecycle.retention_until`
só é preenchido no fluxo de ENCERRAMENTO DE CLÍNICA
(`db/migrations/0014_saas_tenant_lifecycle.sql`,
`shared/billing.ts:70` `POST_CANCEL_RETENTION_DAYS = 30`). Uma clínica ATIVA
nunca tem `tenant_lifecycle.retention_until` preenchido.

Consequência verificada: hoje, numa clínica **ativa**, um gestor
(`owner`/`clinic_admin`) cria um pedido `delete` de escopo `patient`, uma
segunda gestora aprova (após a correção desta sessão — antes, a mesma pessoa
bastava) e `POST /api/live/governance/run-deletion` executa
`executeTenantScopedPurge`, que apaga fisicamente e sem prazo mínimo:
`live_assessment_responses`, `live_assessments`, `live_scale_responses`,
`live_scale_invitations`, `live_intake_submissions`, `live_intake_invitations`,
`live_document_versions`, `live_documents`, `live_clinical_events` e
`live_patients` inteiros do titular (`functions/api/live/governance/_purge.ts:36-47`).
`live_retention_policies` (dias configuráveis por clínica) é lida e gravada
mas **nunca consultada** por `evaluateDeletionEligibility` — é decorativa,
exatamente como o achado original descreveu.

## Por que isto não foi alterado nesta sessão

`tests/unit/cliente-zero-journey.test.ts:759-789` exercita, deliberadamente,
um pedido de eliminação de paciente como exercício do direito do titular
(comentário do próprio teste: "Pedido sintético de titular") numa clínica
**ativa**, sem qualquer retenção. Este é o comportamento hoje testado,
intencional e verde. Adicionar um piso de retenção sem entender a intenção
de produto por trás desse teste teria alterado, sem decisão de negócio, o
equilíbrio entre dois direitos que a lei brasileira não resolve por conta
própria:

- **LGPD art. 18, VI** — direito do titular à eliminação de dados pessoais,
  salvo as hipóteses do art. 16.
- **LGPD art. 16, II** — o controlador PODE conservar dados pessoais após o
  término do tratamento para "cumprimento de obrigação legal ou regulatória
  pelo controlador".
- **Lei 13.787/2018** (prontuário eletrônico) e as resoluções do CFM sobre
  guarda de prontuário — geralmente citadas como piso de 20 anos a partir do
  último registro, mas o texto exato, as exceções e a aplicabilidade a
  registros de outros conselhos profissionais (psicologia, por exemplo, seg
  seu próprio código de ética) não foram confirmados por revisão jurídica
  nesta sessão.

Ou seja: é plausível que a resposta correta ao pedido de eliminação de um
titular NÃO seja "apagar", e sim "recusar a eliminação do prontuário citando
a obrigação legal de guarda, e informar o titular disso" — mas essa é uma
decisão de política que precisa de confirmação jurídica antes de virar
código, não uma dedução de engenharia.

## O que falta decidir (para quem tiver competência jurídica)

1. Qual é o piso de retenção aplicável a cada tipo de registro do Clinical
   LIVE (evento clínico, documento emitido, avaliação/escala respondida),
   por profissão do emissor (médico vs. outros profissionais de saúde) e por
   forma de guarda (o prontuário é eletrônico desde a origem em 100% dos
   casos aqui).
2. Se o pedido de eliminação de um titular deve ser recusado (com base no
   art. 16, II) enquanto o piso não vencer, ou se deve gerar uma
   anonimização/arquivamento em vez de exclusão física.
3. Se `live_retention_policies.retention_days`, hoje configurável livremente
   pela própria clínica (`POST` em `functions/api/live/governance/index.ts`,
   sem limite mínimo — só um teto de 36.500 dias), pode legalmente ficar
   abaixo do piso legal, ou se o sistema deve impedir configurar um valor
   menor que o piso.
4. Se o piso deve ser contado a partir do último registro do paciente (mais
   correto clinicamente) ou de outra data de referência.

## O que fazer depois da decisão (engenharia, não bloqueado por isto)

Uma vez definida a política: estender `DeletionPolicySnapshot`
(`_worker-executor.ts:23-31`) para carregar um piso computado por paciente
(a maior data entre os registros do titular, mais o piso decidido), calculado
em `_purge.ts` `readFreshPolicySnapshot` a partir de
`MAX(occurred_at)`/`MAX(issued_at)` das tabelas clínicas do paciente, e
aplicar essa checagem também para `scope === "patient"` — hoje o código só
aplica lógica equivalente para `scope === "clinic"`. Escrever o teste RED
citado no achado original antes de alterar o executor
(`docs/audits/SAAS_TENANCY_AUDIT_2026-09-26.md#LTB-10`, campo `test:`).

## Risco de não decidir

Enquanto isto não for resolvido, qualquer clínica cliente pode, hoje, apagar
fisicamente e sem prazo mínimo o prontuário completo de um paciente vivo
numa clínica ativa, a pedido do próprio titular ou de terceiro que se
apresente como tal — sem que o sistema ofereça qualquer resistência técnica
além do `legal_hold` manual (que precisa ser apostado clínica por clínica,
proativamente, por alguém que se lembre de fazê-lo). Isto é responsabilidade
de guarda do prestador de serviço de saúde, não apenas da plataforma.

## Estado e reversão

Nenhum dado, segredo ou chave alterado por este documento. Nenhum código
alterado além do referido em BACKLOG.md#LTB-10/EVIDENCE.md#LTB-10 (só o
quatro-olhos). Rollback: nenhum, é apenas registro.
