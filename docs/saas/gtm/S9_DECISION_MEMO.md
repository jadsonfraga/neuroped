# S9: memo de decisão sobre os 4 registros legados (Ciclo 5)

Sem PHI. Base: `docs/audits/LEGACY_TENANT_CENSUS_OBSERVED_2026-09-26.md`, `db/seed_demo.sql`,
`docs/saas/spiral/BACKLOG.md` (S9). Este memo é INFERÊNCIA para orientar a decisão do
proprietário; NÃO autoriza backfill, exclusão nem remoção do bypass (regra do AGENTS.md e do censo).

## O que o repositório permite concluir
1. `db/seed_demo.sql` insere 3 pacientes fictícios (`demo-001..003`) **sem `owner_user_id`**,
   2 consultas e 1 documento. O censo observou: 4 pacientes, 3 sem owner, 2 consultas, 1 documento,
   e os 3 IDs do seed presentes.
2. Por contagem (3 seeds sem owner + 3 sem owner no total, 4 pacientes no total), a leitura
   mais provável é: **os 3 sem owner são os 3 fixtures**, e o 4º paciente é o do owner existente.
   Consistente: consultas (2) e documento (1) batem com o seed; o 4º paciente explicaria as demais
   escalas (4 observadas contra o que o seed insere).
3. Limite da inferência: o censo declara que a presença dos IDs não prova que o conteúdo atual
   continue fictício, nem correlaciona os IDs com os 3 sem owner. Por isso falta 1 confirmação.

## Confirmação mínima (2 números, só contagem, sem conteúdo)
Executada por você (ou pelo workflow de censo, se a engenharia o estender por PR separada):
```
npx wrangler@4 d1 execute neuroped-db --remote --command "SELECT (SELECT COUNT(*) FROM patients_demo WHERE id IN ('demo-001','demo-002','demo-003') AND owner_user_id IS NULL) AS seeds_sem_owner, (SELECT COUNT(*) FROM patients_demo WHERE id NOT IN ('demo-001','demo-002','demo-003')) AS nao_seed;"
```
Esperado se a inferência vale: `seeds_sem_owner = 3` e `nao_seed = 1`.
Se der outra coisa, pare e registre em DECISIONS.md; o plano abaixo não vale.

## Plano proposto (cada passo exige a sua autorização escrita)
1. Provar backup + restauração com cifra real (G4; depende de G1).
2. Fixtures (3 sem owner): arquivar ou eliminar, com contagens antes/depois preservadas.
3. 4º paciente (owner sem clínica ativa): você confirma se é caso real seu e em qual clínica fica;
   depois o backfill de `clinic_id` por migração aditiva, com IDs e contagens preservados.
4. Repetir o censo imediatamente antes da migração.
5. Remover o bypass de admin global das rotas legadas, com testes negativos Alfa/Beta e validação
   de acesso do Cliente Zero.

## O que NÃO fazer
Atribuir órfãos ao admin por inferência; apagar seeds sem backup restaurado e provado; migrar
sem repetir o censo.
