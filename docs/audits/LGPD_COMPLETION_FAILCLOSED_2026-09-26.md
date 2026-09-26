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

- Apenas `no such table` para a própria tabela consultada representa schema antigo.
  Outros erros e contagens inválidas interrompem a operação.
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
