# NeuroPed Autonomous SaaS — readiness verificável

Data da validação local: 2026-09-26  
Branch de trabalho: `value/autonomous-saas`  
Base observada antes das alterações: `0b4f74fb49214d00944fc2a366d3b4454363601a`

## Escopo da evidência

Este documento separa explicitamente código, teste local, integração externa e
operação publicada. Os testes abaixo executam handlers reais contra o schema D1
e todas as migrations em SQLite isolado. Resend e Asaas são interceptados no
boundary HTTP do teste `cliente-zero`; portanto eles comprovam o contrato local,
autorização, persistência, idempotência e reação ao webhook, mas **não** comprovam
envio externo, cobrança, receita, deploy ou operação em produção.

Classificações:

- `VERIFIED`: comportamento exercitado localmente por teste automatizado com
  handler e persistência reais do repositório;
- `PARTIAL`: existe prova automatizada de parte do fluxo, mas há uma limitação
  funcional material;
- `BLOCKED_EXTERNAL`: falta evidência que depende de provedor, credencial ou
  ambiente externo;
- `FAILED`: uma prova executada falhou;
- `MISSING`: não existe implementação suficiente para executar a prova.

## Cliente-zero — matriz de aceite

| # | Requisito | Estado | Evidência local | Limitação explícita |
|---|---|---|---|---|
| 1 | Cadastro | `VERIFIED` | `functions/api/auth/signup.ts`; `tests/unit/cliente-zero-journey.test.ts` cria duas contas novas | Não comprova disponibilidade do endpoint publicado |
| 2 | Verificação de e-mail | `PARTIAL` | `functions/api/auth/verify-email.ts`; token emitido e consumido no cliente-zero | Entrega pelo Resend é `BLOCKED_EXTERNAL`; o teste intercepta HTTP |
| 3 | Criação de clínica | `VERIFIED` | `functions/api/tenants/index.ts`; criação de Azul e Vermelha sobre schema+migrations reais | Validação local, não produção |
| 4 | Onboarding | `VERIFIED` | `GET /api/tenants/:id/onboarding`; `tests/unit/saas-onboarding-progress.test.ts`; projeção server-side de 10 marcos | O marco externo de billing só conclui após evento persistido; sem configuração aparece `BLOCKED_EXTERNAL` |
| 5 | Plano | `VERIFIED` | subscription/trial criados pelas regras canônicas; checkout usa `CANONICAL_PRICE_CENTS` e seats persistidos | Nenhuma venda externa comprovada |
| 6 | Membership | `VERIFIED` | convite, aceite, mudança de papel e isolamento no cliente-zero; teste comportamental injeta a corrida entre precheck e batch e o predicado SQL final preserva o último owner sem auditoria falsa | E-mail externo do convite é interceptado |
| 7 | Paciente | `VERIFIED` | paciente sintético criado por handler LIVE, cifrado e isolado de Vermelha | Nenhum paciente real e nenhum resultado clínico alegado |
| 8 | Consulta | `VERIFIED` | evento `encounter` sintético criado por `functions/api/live/events/index.ts` com provenance | Teste funcional local, não atendimento clínico real |
| 9 | Documento | `VERIFIED` | documento clínico sintético criado como `draft`; teste confirma que não é finalizado automaticamente | Não comprova emissão de documento em produção |
| 10 | Billing | `BLOCKED_EXTERNAL` | checkout, webhook autenticado, idempotência, entitlement e `billing_invoice_events.charge_paid` são exercitados | Asaas é `MOCKED_EXTERNAL`; nenhuma cobrança, pagamento, fatura, MRR ou receita foi comprovada |
| 11 | Auditoria | `VERIFIED` | endpoint self-service `/audit` lê somente Azul; Vermelha recebe 404; conteúdo clínico não aparece nos metadados | Validação local, sem observação de logs publicados |
| 12 | Cancelamento / exportação | `PARTIAL` | encerramento com confirmação, retenção, cancelamento no boundary e export JSON com digest são exercitados | Cancelamento Asaas é mockado; export marca `complete: false` porque documentos/avaliações ainda não entram no payload |

Resultado: a jornada local está automatizada de ponta a ponta, mas a
transformação **não pode ser classificada como operacionalmente concluída** até
que billing/e-mail externos e o ambiente publicado sejam validados e a lacuna de
exportação seja fechada.

## Contrato de onboarding zero-to-value

O backend calcula o checklist; a UI não pode promovê-lo por redirect,
`localStorage` ou estado otimista.

| Marco | Fonte persistida canônica |
|---|---|
| Conta criada | `users.created_at` |
| E-mail verificado | `users.email_verified_at` |
| Clínica criada | `clinics.created_at` |
| Plano selecionado | `billing_subscriptions.created_at` |
| Billing configurado | somente `billing_invoice_events.kind = 'charge_paid' AND status = 'done'` |
| Primeiro membro | `clinic_memberships.created_at` |
| Primeiro paciente | `saas_audit_log.live_patient_create` |
| Primeira consulta | `saas_audit_log.live_clinical_event_create` com `eventType=encounter` |
| Primeiro documento | `saas_audit_log.live_document_create` |
| Primeira avaliação | `saas_audit_log.live_assessment_create` |

Estados de billing retornados pelo servidor:

- `SERVER_CONFIRMED`: há evento `charge_paid` persistido pelo backend;
- `AWAITING_PROVIDER_EVENT`: configuração existe, mas o evento confirmado ainda
  não existe;
- `BLOCKED_EXTERNAL`: configuração externa necessária está ausente.

O redirect de checkout não é fonte de verdade.

## Testes e gates

Comandos executados localmente neste worktree:

```text
node tests/unit/saas-membership-owner-regression.test.mjs
node --import tsx tests/unit/saas-onboarding-progress.test.ts
node --import tsx --test tests/unit/onboarding-progress-ui.test.tsx
node --import tsx --test tests/unit/tenant-management-authorization.test.ts
node --import tsx tests/unit/cliente-zero-journey.test.ts
npm run test:saas-self-service
npm run check
npm run lint
npm run build
```

Os dois primeiros testes foram incorporados ao script
`test:saas-self-service` e ao workflow
`.github/workflows/saas-self-service-guard.yml`. O teste cliente-zero declara a
evidência externa como `MOCKED_EXTERNAL` em seu próprio output.

## Bloqueios externos

1. **Asaas:** falta executar checkout e cobrança em ambiente autorizado,
   receber webhook originado pelo provedor e reconciliar a transação.
2. **Resend:** falta confirmar entrega real de verificação e convite em ambiente
   autorizado.
3. **Deploy:** nenhuma alteração deste worktree foi publicada; não há SHA de
   deploy nem smoke pós-deploy destas mudanças.
4. **Receita:** não há evidência de cliente pagante, MRR, ARPA, churn ou receita;
   qualquer painel correto deve mostrar zero na ausência de fatos persistidos.

## Riscos e trabalho remanescente

- O export do tenant inclui pacientes e eventos, mas ainda exclui documentos,
  versões, avaliações/respostas, intake e escala remota. O manifesto é
  fail-honest (`complete: false`) e o purge permanece bloqueado; fechar a
  cobertura é necessário para exportação LGPD integral.
- O cliente-zero é um teste funcional de handlers, não um browser E2E em
  aplicação publicada. Um smoke autenticado no ambiente alvo continua
  necessário.
- A corrida de último owner é reproduzida localmente entre autorização e batch,
  com recusa `409`, owner preservado e nenhuma auditoria de sucesso. Carga
  concorrente sobre D1 remoto continua sem evidência neste worktree.
- Métricas comerciais não foram semeadas nem inventadas. A instrumentação e os
  agregados existentes devem continuar derivados exclusivamente de fatos
  persistidos; nenhuma receita é inferida de checkout iniciado.

## Evidência negativa

Não houve commit, PR, merge, push ou deploy durante esta implementação. Não há
alegação de cobrança real, receita, cliente, uso clínico, conformidade LGPD ou
operação em produção.
