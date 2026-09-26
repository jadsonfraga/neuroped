# Censo agregado do legado — resultado observado

Parte de #594 / S9. Observado em 2026-09-26 às 21:07:50 UTC (18:07:50
America/Recife), após merge da PR #994. Não certifica isolamento, migração,
backup/restauração nem prontidão comercial.

## Evidência

- Commit: `08a6708034dce1d00caa82bfb7831208545e86bf`.
- [Workflow 36271735655](https://github.com/jadsonfraga/neuroped/actions/runs/36271735655):
  contrato e consulta de produção concluídos com `success`.
- Artefato: `legacy-tenant-census-36271735655`, ID `10916151213`.
- SHA-256 do ZIP: `6d041258658767ef5be0968dd47f11b1eb7ae51f3bcec62af90d15f665eb6a9d`.
- JSON baixado e inspecionado; `status=observed`, `scope=aggregate-only`,
  `mutations=false`, `clinicalContentRead=false`, `migrationAuthorized=false`.
- Binding `DB` do projeto canônico `neuroped` validado contra `wrangler.toml`
  antes das consultas. O artefato expira em sete dias; este registro preserva
  somente suas contagens e metadados, sem conteúdo ou identificadores clínicos.

## Contagens observadas

| Tabela disponível | Linhas |
| --- | ---: |
| patients_demo | 4 |
| consultations_demo | 2 |
| scale_results_demo | 4 |
| clinical_memory_notes_demo | 0 |
| conecta_events_demo | 0 |
| clinical_events_demo | 0 |
| documents_demo | 1 |
| external_import_batches | 0 |

Dos quatro pacientes, três não têm owner e um tem owner ativo sem clínica
ativa. Há um owner distinto referenciado e ele tem zero clínicas ativas.
Nenhum paciente tem vínculo inequívoco com uma única clínica ativa.
Não foram observados owners ausentes/inativos nem múltiplas clínicas ativas.

Os três IDs fixos do seed estão presentes. Isso é evidência da presença
desses IDs, não prova do histórico de execução do workflow de provisionamento
nem de que seu conteúdo atual permaneça fictício. O censo também não
correlaciona esses três IDs com a classe dos três pacientes sem owner.

A configuração bootstrap corresponde a uma conta admin ativa, com zero
memberships ativas de owner e um paciente legado próprio. Isso não comprova
que seja a identidade profissional do cliente zero: pode ser uma conta técnica.
Nenhum e-mail ou ID dessa conta foi retornado.

## Decisão e próximo requisito

O bloqueio de acesso ao censo foi removido. S9 continua aberto:
`unambiguousOwnerMapping=false`. Não executar backfill por inferência,
atribuir órfãos ao admin bootstrap, apagar seeds ou remover o acesso legado
às cegas. Nenhum dado ou ID foi alterado por esta entrega.

Antes do backfill, uma operação autorizada deve estabelecer e registrar o
tenant legítimo do owner existente e a destinação dos registros sem owner,
incluindo dependências. A associação do cliente zero precisa ser comprovada
sem publicar PHI no repositório. Exige ainda backup com restauração provada,
ensaio da migração aditiva, preservação de IDs/contagens, testes negativos
Alfa/Beta nas rotas legadas e validação de acesso do cliente zero.

As contagens são uma observação pontual. Repetir o censo imediatamente antes
de uma futura migração; não tratar este relatório como lock ou autorização.
O bypass de admin global documentado em S9 permanece um risco conhecido e
impede declarar isolamento comercial completo.

## Validação desta entrega

Registro documental do artefato real; nenhuma mudança de runtime, schema,
credencial ou política de acesso. Conferência de contagens contra o JSON e
`git diff --check`. Reversão documental por PR, preservando a evidência original.
