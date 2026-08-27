# Implementação do Hub SaaS

## Visão geral

As três opções do plano foram implementadas no repositório: o hardening dos módulos existentes, a rede de parceiros e a central de comunicação. A implementação preserva a fronteira explícita por clínica, usa a autorização baseada em `clinic_memberships` e mantém dados de contato, comentários e referências de pacientes cifrados na aplicação.

| Frente | Entrega principal | Entrada operacional |
|---|---|---|
| Hardening | Checklist persistente, templates de disponibilidade, NPS pós-consulta, reativação e webhooks | `/api/onboarding`, `/api/operations`, `/api/feedback/summary`, `/api/tenants/:id/lifecycle` |
| Rede de parceiros | Diretório de parceiros, encaminhamentos, status e métricas | `/api/partners` |
| Central de comunicação | Templates, campanhas, entregas, canais e métricas | `/api/communication` |

## Hardening dos módulos existentes

O onboarding agora tem etapas persistidas em `onboarding_steps`. O GET reconcilia automaticamente etapas observáveis, como perfil da clínica, equipe, serviços, disponibilidade e primeiro agendamento. A conclusão manual continua disponível para os administradores, com registro de auditoria em `saas_audit_log`.

O módulo operacional passou a expor modelos de disponibilidade em `availability_templates`, com validação de fuso horário, limites de intervalo e tamanho de payload. Os modelos são restritos ao profissional autenticado e as mutações seguem o RBAC operacional já existente. A migration `0017_appointment_clinic_context.sql` adiciona `appointments.clinic_id`, reconcilia automaticamente somente appointments legados não ambíguos e exige contexto explícito para profissionais com múltiplas clínicas. O cliente autenticado transporta a clínica ativa no cabeçalho `X-Clinic-Id`, e o dashboard é filtrado por esse contexto.

Quando uma consulta chega a `completed`, o sistema cria no máximo uma pesquisa NPS por agendamento. O token é opaco e apenas seu hash é persistido em `feedback_surveys`. O convite enviado à família contém uma URL completa em `/feedback?token=...`, derivada de `APP_BASE_URL` ou da origem canônica da requisição. A página pública não exige login, aceita a resposta uma única vez, aplica expiração e grava o comentário cifrado. A visão autenticada em `/api/feedback/summary` calcula taxa de resposta, promotores, passivos, detratores, distribuição e NPS. A auditoria da resposta registra `actorType: anonymous_token` no evento da pesquisa, sem atribuir a ação ao profissional.

O lifecycle recebeu o estado `reactivation_requested`. O fluxo é idempotente e mantém `closed` como estado terminal. A solicitação, aprovação, rejeição e conclusão da reativação geram auditoria e eventos na fila `tenant_webhook_events`. A migration 0016 reconstrói a tabela de lifecycle preservando os dados e pode ser reexecutada com segurança.

## Rede de parceiros

`partner_directory` armazena o diretório da clínica com tipos controlados, status ativo/pausado/arquivado e campos de contato cifrados. `partner_referrals` registra encaminhamentos de entrada e saída, referência do paciente, contato do responsável, observações e transições de status.

As transições são controladas no backend. Um encaminhamento em rascunho pode ser enviado ou cancelado; encaminhamentos enviados podem ser recebidos, aceitos, recusados ou cancelados; encaminhamentos aceitos podem ser concluídos ou cancelados. Triggers impedem fisicamente que um encaminhamento associe um parceiro de outra clínica.

## Central de comunicação

A central inclui templates de sistema e templates personalizados, com canais `email`, `whatsapp`, `sms` e `manual`. Templates de sistema são imutáveis. Campanhas são tenant-scoped, possuem filtro de público em JSON limitado e podem ser colocadas em fila com até 500 destinatários por operação.

As entregas são persistidas em `communication_deliveries`, com destinatário, assunto e corpo cifrados. O backend verifica se o canal escolhido está autorizado pelo template, valida `appointmentId` e `surveyId` contra a clínica ativa e permite atualizar o status para envio, entrega, falha ou cancelamento. Triggers físicos repetem as validações de tenant. A resposta da API também apresenta métricas agregadas de pendências, envios e falhas.

## Frontend

Foi adicionada a rota protegida `/hub-saas`, integrada ao contexto de clínica ativa. A página reúne quatro abas: ativação, parceiros, comunicação e NPS. As chamadas enviam `X-Clinic-Id`, mas a autorização efetiva permanece no backend, que resolve e valida a membership.

## Migração e deploy

As migrations `db/migrations/0016_saas_hub.sql` e `db/migrations/0017_appointment_clinic_context.sql` criam as novas tabelas, índices e triggers, atualizam o check de lifecycle para aceitar `reactivation_requested` e associam appointments à clínica correta. Os workflows operacional e de billing aplicam e verificam as migrations 0016 e 0017, enquanto o deploy principal e a provisão inicial também foram atualizados. O runtime faz bootstrap idempotente para reduzir risco de ambientes que ainda não receberam a migration remota.

## Validação executada

A implementação foi verificada com TypeScript, ESLint, build do frontend, testes de contrato do Hub, testes operacionais e testes existentes de billing e lifecycle.

| Verificação | Resultado |
|---|---|
| `npm run check` | Aprovado |
| `npm run lint` | Aprovado |
| `npm run build:client` | Aprovado |
| `npm run test:saas-hub` | Aprovado |
| `npm run test:operations` | Aprovado |
| Contratos de billing e lifecycle existentes | Aprovados |
