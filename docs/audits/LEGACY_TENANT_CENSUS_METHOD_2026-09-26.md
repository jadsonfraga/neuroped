# Censo agregado de ownership legado

Parte de #594 e do bloqueio
`BLOCKED_EXTERNAL_LEGACY_TENANT_CENSUS_2026-09-26.md`.

O runner local não possui credenciais D1. O GitHub já dispõe de um pipeline
autorizado de produção com essas credenciais. Esta entrega cria uma leitura
reproduzível nesse pipeline, sem ampliar permissões nem emitir valores de
segredos. A execução remota ocorre somente em `main` do repositório canônico,
depois do contrato sintético. PRs executam apenas o contrato sem secrets.

## Dados produzidos

- Disponibilidade e contagem das oito tabelas legadas do bloqueio.
- Quantidade de pacientes sem owner, owner inexistente/inativo, sem clínica
  ativa, com uma clínica ativa ou múltiplas clínicas ativas.
- Contagem da presença dos três IDs fixos do seed legado, sem ler conteúdo.
- Contagens de contas admin ativas, memberships owner ativas e pacientes
  legados pertencentes ao e-mail bootstrap configurado no secret do GitHub.
  Esse e-mail não é emitido. Ausência da configuração permanece explícita;
  não se presume que ela corresponde à identidade clínica do cliente zero.

Consultas são SELECT fixos e parametrizados. Nenhuma coluna de nome,
prontuário, conteúdo, telefone ou endereço é lida. Identificadores de
ownership são usados apenas internamente pelo banco em joins; a resposta
exportada contém classes fixas e números. A identidade do binding D1 de
produção é conferida contra `wrangler.toml` antes da primeira consulta.

Tabela ausente é `available:false, rows:null`, nunca zero presumido. Erro de
consulta, contagem inválida, binding divergente ou falta de credencial faz a
execução falhar com código sanitizado. Nenhum corpo arbitrário de erro é
emitido. A soma das classes deve coincidir com a contagem de pacientes;
alteração concorrente detectável invalida o relatório. Não é um snapshot
transacional e deve ser reexecutado imediatamente antes de uma migração.

## Provas locais

`node --test tests/unit/legacy-tenant-census.test.mjs`: quatro testes,
exit 0, SQLite real com `PRAGMA query_only=ON` durante todas as consultas;
órfão, ambiguidade, owner inativo, clínica suspensa, falha de consulta,
contagem negativa e sentinelas de conteúdo que não podem sair no relatório.
`node tests/unit/workflow-governance.test.mjs` e `git diff --check`: exit 0.

O artefato `legacy-tenant-census-<run_id>` dura sete dias. A existência do
workflow não é evidência de execução remota bem-sucedida. O bloqueio só pode
ser reavaliado após ler o relatório do run de produção. Mesmo um resultado
sem ambiguidade mantém `migrationAuthorized:false`: censo não substitui
backup, decisão de mapeamento, testes de migração e revisão do cliente zero.

## Rollback

Reverter por PR ou desativar o workflow. Nenhuma migração ou mutação de banco
é feita; nenhum procedimento de restauração de dados é necessário.

## Unidade das contagens

`patientOwnership` conta registros de pacientes por situação do owner; não conta
pessoas. `patientOwnerPresence` informa linhas com/sem owner. `distinctOwners`
conta IDs de owner distintos, incluindo referências a contas ausentes/inativas,
separados por 0, 1 ou 2+ vínculos ativos com clínicas ativas. Nenhum ID sai do D1.
Essa separação atende ao pré-requisito de dimensionar quantos casos de ownership
precisam de resolução, sem multiplicá-los pelo número de pacientes. Conta
inativa/ausente continua sendo bloqueio na classificação dos pacientes, mesmo
que existam memberships. Teste específico acrescenta pacientes repetindo owners
e prova que o número de casos distintos não muda.
