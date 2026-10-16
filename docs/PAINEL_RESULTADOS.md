# Painel de resultados (item 8)

Seção **Configurações → Resultados**. Só agregados da própria clínica; nenhum nome, id de paciente ou de usuário na tela ou na resposta da API (`containsPatientIdentifiers: false`, coberto por teste que procura ids/e-mails/ciphertext no JSON).

## Quem vê
| Papel | Resultados | Edita premissa de tempo |
|---|---|---|
| owner, clinic_admin | sim | sim (`organization.manage`) |
| professional | sim | não |
| assistant (secretaria), financial | **não** (403 e aba oculta) | não |

Nova permissão `outcomes.read` em `shared/permissions.ts` (matriz travada em `tenant-permissions.test.ts`). Isolamento: toda consulta filtra `clinic_id` da membership; `X-Tenant-Id` forjado dá 403.

## Métricas e fonte real
| Métrica | Fonte | Observação |
|---|---|---|
| Pacientes atendidos | `live_clinical_events` (`encounter`, ativo) — pacientes distintos no período | só consultas registradas no prontuário LIVE |
| Retornos | atendidos no período que já tinham `encounter` anterior ao início | |
| Documentos emitidos | `live_documents` publicados/substituídos, por tipo | rascunho e anulado não contam |
| Avaliações aplicadas | `live_assessments` (contagem) | **nunca** resultado, corte, nível ou classificação |
| Portal da família | `family_portal_shares` + `family_portal_audit_log` | links criados, abertos (adesão), consentimento LGPD, acessos negados |
| Anamnese/escala remotas | `live_intake_invitations`, `live_scale_invitations` | enviados × respondidos |
| Uso de funcionalidades | `saas_audit_log`, allowlist em `shared/outcomes.ts` | só contagens por ação |
| Uso de IA | `ai_use_records` (item 7) | total, % revisão humana, % família informada |

Comparação com o período anterior de mesma duração (7/30/90 dias). Cada bloco tolera tabela ausente (migration não aplicada) e mostra "indisponível".

## Tempo economizado = ESTIMATIVA
`documentos emitidos (laudo, nota/resumo) × minutos de premissa`. A premissa é da clínica (tabela `clinic_metrics_assumptions`, migration 0037, 0–240 min). **Sem premissa não há número** — o NeuroPad não assume valor. A tela rotula "estimativa", mostra a conta e diz que não é medição. Edições vão para `saas_audit_log` (`metrics_assumption_upsert`).

## O que NÃO é medido (declarado na tela)
- Laudo em um clique, resumo pré-consulta, evolução de escalas e checagem de dose rodam no navegador e não deixam registro no servidor.
- Testes próprios do NeuroPad: sem resultado, corte, nível ou classificação.
- Agenda (`appointments`/`booking_services`) não tem `clinic_id`; usá-la misturaria clínicas. Fora do painel até existir a coluna.

## Sem envio/IA externa
Só leitura de SQL local; nenhuma chamada de rede, e o e2e falha se houver requisição externa.

## Migration
`db/migrations/0037_clinic_metrics_assumptions.sql` — versionada, **não aplicada**. Sem ela o painel funciona; só a premissa (PUT → 503 `METRICS_MIGRATION_PENDING`) e a estimativa ficam indisponíveis.

## Testes
`npm run test:painel` (unitário + integração SQLite, Node ≥ 22) e `npm run test:e2e:painel` (Playwright, exige `npm run build`).
