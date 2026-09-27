# S9 — censo agregado das dependências do legado

Parte de #594. Incremento preparatório de S9; **S9/P0 permanece aberto**.
Nenhuma associação autorizada de paciente, migração, remoção de bypass,
backup/restauração, cobrança ou habilitação de Clinical LIVE é realizada.

## Reconciliação

Base: `47ad00be22bb7fb0d48bcdea9618320f03ce3d86`, já contendo #1007,
#1008, #1010 e #1011. AGENTS.md foi lido integralmente. Foram relidos o
backlog, as evidências relevantes, a issue #594 e o censo observado.
As PRs #1003/#1005 permanecem separadas; seus arquivos alterados não incluem
o coletor ou o teste deste incremento. Não se reaplica a correção LGPD,
não se reescreve a agenda e não se modifica o modelo de autorização.

O deploy anteriormente pendente da #1007 (run `36290415467`) retornou todos
os jobs concluídos com sucesso, incluindo verificação da publicação,
health, CORS e login/logout. Isso não comprova exportação LGPD na produção,
configuração de criptografia clínica ou prontidão comercial.

## Problema reproduzido

O censo existente classificava owners dos pacientes e contava tabelas
filhas, mas não correlacionava essas contagens aos pacientes. Uma fixture
com todos os pacientes ligados a um owner com uma única clínica ativa e
um documento apontando para paciente inexistente retornava
`unambiguousOwnerMapping=true`, sem indicador específico da dependência
órfã. A flag anterior só descreve pacientes; não é licença de migração.
Nenhum caso de exploração ou órfão novo em produção é alegado.

## Menor incremento

O mesmo `scripts/audits/legacy-tenant-census.mjs` passa a incluir
`patientDependencies`, com contagens por `patient_id` e classe de owner
para seis tabelas já inventariadas: consultas, resultados, memória clínica,
Conecta, eventos clínicos e documentos legados.

Cada tabela diferencia referência de paciente nula, paciente inexistente,
owner ausente/inexistente/inativo, nenhuma clínica ativa, uma clínica ativa
e múltiplas clínicas ativas. `requiresMappingReview` conta somente as
linhas observadas que não recaem na classe de clínica única. Ausência de
tabela mantém valores `null`, não zero; schema incompatível, contagem
inválida, classe inesperada/repetida ou divergência de volume interrompem
a coleta. Nenhuma identidade ou conteúdo clínico é projetado no resultado.

A API Cloudflare, o binding canônico, os segredos, a verificação de trusted
main, o workflow existente e todos os campos anteriores foram preservados.
`migrationAuthorized` continua sempre `false`. Não há novo endpoint, nova
arquitetura, migração, comando npm, credencial ou workflow.

## Evidência local efetivamente executada

Ambiente: Node `v22.16.0`, `node:sqlite`, banco sintético em memória.
Reconstrução local de arquivos recuperados pelo conector; não é clone
completo. Os blobs originais foram conferidos por SHA Git:

- coletor: `a60d27ab09799d0c337a40f815d1786ba8e19e65`;
- testes: `b6a8296dfbd06bf7532a1067bef5f0d4c3367e60`;
- schema base: `4be814fc2b6ed179fd946d4a90fc92bcdb87f7ce`;
- migration 0009: `1c952f47a58feede611650f84268769393157b56`;
- workflow: `0948ca435c27e2aad6727dfdee4634f39c545d4e`.

Comando existente: `node --test tests/unit/legacy-tenant-census.test.mjs`.

| Etapa | Exit | Resultado |
| --- | ---: | --- |
| Baseline exato | 0 | 5/5 testes existentes |
| Novas provas contra coletor anterior | 1 | 5 passaram, 9 falharam |
| Coletor corrigido | 0 | 14/14, zero falhas/pulos |

As novas provas cobrem as três tabelas presentes no schema base, documento
órfão apesar de pacientes unívocos, ausência versus vazio, buckets
malformados, chegada tardia de dependência, referência nula histórica e
schema incompatível. Projeções históricas mínimas estão explicitamente
rotuladas nos dois testes correspondentes. `PRAGMA query_only=ON` protege
a execução do coletor; escritas da fixture são sintéticas e anteriores à
coleta, exceto a corrida controlada que confirma recusa sem apagar dados.

Não foram executados localmente `npm ci`, typecheck, lint, build nem
`npm run verify`: DNS impediu clone; Desktop Commander recusou execução
por quota mensal. CI precisa ser conferida no SHA candidato; o resultado
local não a substitui. A suíte não representa todas as migrations, D1
remoto, navegador, isolamento integral nem recuperação operacional.

## Limites que continuam bloqueando S9

`coverageComplete` significa apenas que essas seis tabelas tiveram consulta
bem-sucedida; não significa integridade universal. `snapshotAtomic=false`
explicita SELECTs independentes. A checagem de volume detecta a corrida
ensaiada, mas não mudanças concorrentes que preservem contagens. Repetir a
observação antes de um ensaio não substitui transação/cerca do backfill.
`external_import_batches`, `memory_notes`, agenda e armazenamento externo
não são certificados por este incremento.

O censo documentado de 26/09 continua sem destinação autorizada dos registros
legados. Ainda são necessários associação legítima, backup restaurável,
ensaio aditivo, preservação de IDs/contagens, testes adversariais nas rotas
legadas e prova do acesso legítimo antes de remover o bypass global.

## Gates e rollback

Antes de merge: CI vigente, revisão e proteções de main sem override.
Após merge: conferir o run do workflow existente e seu artefato agregado;
`success` do deploy não equivale à execução deste coletor em D1.
Reversão por PR do incremento no coletor/testes/documento; nenhuma reversão
de banco ou rotação de chave é necessária, pois não há escrita clínica.
