# Exportação e eliminação: falhas de cobertura não significam ausência de dados

Base: `5117f443`. Escopo: executor LGPD e verificação da cobertura da exportação.
Sem migração e sem acesso a dados reais.

## Achados reproduzidos

1. `countExportUncoveredRows` convertia qualquer falha de consulta em zero. Um
   erro transitório ou schema inválido podia produzir `complete: true` sem prova.
2. As duas verificações antes do purge também ignoravam qualquer erro. A prova
   com falhas apenas nos SELECTs de contagem deixou a exclusão prosseguir contra
   SQLite real, sem registrar falha. A camada de escrita não era substituída.
3. `run-export` aceitava `collected.complete: false`, escrevia o artefato e marcava
   o ledger como `completed`. A prova com documento não coberto respondeu 200,
   quando deveria impedir a conclusão de uma exportação incompleta.

## Correção e evidência

- Na pré-verificação do purge, apenas `no such table` para a própria tabela representa
  schema antigo. O coletor exige todas as tabelas atuais: qualquer falha no snapshot
  interrompe a exportação. Outros erros e contagens inválidas nunca viram zero.
- Erro de cobertura retorna `TENANT_EXPORT_COVERAGE_FAILED` (503) e registra o job
  como falho. Purge retorna `PURGE_PREFLIGHT_FAILED:<tabela>` antes de qualquer DELETE.
- Exportação incompleta retorna `TENANT_EXPORT_INCOMPLETE` (409), com ledger falho,
  chave de artefato nula e nenhuma escrita no bucket.
- Testes do handler e executor reais usam schema/migrações reais e tenants sintéticos.
  Cobrem clínica, paciente, falha transitória, schema sem coluna, tabela ausente,
  isolamento RED/BLUE e o caminho completo que continua exportando normalmente.
- Comandos locais: `lgpd-purge-executor.test.ts`, `lgpd-run-export-endpoint.test.ts`,
  `lgpd-run-deletion-endpoint.test.ts` e `saas-tenant-lifecycle.test.ts` via
  `node --import tsx`: exit 0. Os dois primeiros falharam contra a versão anterior.
  A CI executa essas suítes; nenhum gate foi removido.

## Limites e rollback

S12B continua aberto: o coletor ainda precisa incluir documentos, avaliações, intake
e respostas remotas. Esta correção impede que essa lacuna seja certificada como
exportação completa ou ignorada numa exclusão. O export síncrono continua expondo
seu manifesto honesto de cobertura; o executor que conclui um pedido LGPD exige
cobertura integral.

Rollback por PR de revert, passando pelos mesmos gates. Não apagar artefatos,
alterar ledgers ou liberar purge manualmente para contornar a recusa. Reverter
reintroduz os três riscos acima e requer decisão explícita do responsável.

## Revisão: snapshot consistente da clínica ativa

A leitura independente permitia inserir um paciente entre contagem e payload:
regressão reproduzida com manifesto de 1 paciente e payload com 2 (assertiva falha).
O coletor agora usa um único `D1Database.batch` para lifecycle, dados, contagens,
billing e cobertura. O arquivo informa `snapshotAt`, obtido na mesma transação.
Contagens são conferidas contra as linhas efetivamente retornadas. A pré-checagem
síncrona de tamanho continua como proteção, mas a autoridade é a contagem relida
na transação; ambos os modos (síncrono e executor) têm prova concorrente.
Uma escrita posterior pertence ao próximo snapshot, sem misturar versões.

Contrato oficial: https://developers.cloudflare.com/d1/worker-api/d1-database/#batch
A prova usa SQLite real dentro de uma transação, retorna linhas SELECT no batch e
mantém as verificações de isolamento, cifra real e ledger. A jornada cliente-zero
foi executada novamente com o mesmo comportamento D1. Falha em preparar/executar
qualquer consulta do snapshot retorna 503, sem storage e sem completed.
