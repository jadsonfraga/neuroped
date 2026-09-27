# PR #1009 — prova de registros locais e detalhe recolhido

## Mandato e mudança concorrente

Correção restrita ao E2E do Super NeuroPad, sem enfraquecer a proteção de
registros não salvos. Não fazer merge; entregar para revisão.
A #1009 estava aberta na primeira leitura e foi mergeada por outra execução
em 27/09/2026 às 15:08:38 UTC (`8c24de888158c35d4e111a8352c6c2b9643fa24a`).
Esta correção segue em PR complementar, baseada nesse main, sem reverter a
proteção antitoque-duplo e sem escrever diretamente em main.

## Causa comprovada no código e no log

- Run `36281309331`, job `108513522044`, passo "Prove local mode keeps unsaved
  records guarded": o locator da linha 147 encontrou repetidamente o div,
  mas oculto, até expirar em 30 segundos.
- A página usa `<details open={entry.level !== "esperado" || !entry.applied}>`:
  fases completas com 3–4 acertos ficam recolhidas deliberadamente.
- As opções são embaralhadas com uma semente aleatória por montagem. Alternar
  índices de opções no E2E não alterna acertos/erros deterministicamente.
- A marca `comando repetido 1x` pode existir tanto na lista de erros como no
  detalhe da fase. O `.first()` global dependia da pontuação e não abria a fase.
- Portanto, a falha é de pré-condição de estado/seletor do teste, não evidência
  de lentidão nem de perda dos registros. O sucesso posterior do run
  `36327665311` em `c8e15478` não eliminou essa dependência: o mesmo locator
  permaneceu em main após o merge.

## Correção e garantias

O E2E identifica a fase 1 pelo summary e a repetição no segundo registro,
sem ambiguidade com a lista de erros. Toda execução passa pelo estado
recolhido usando o próprio summary, confirma que o registro existe mas está
oculto, abre a fase por clique real e exige visibilidade do mesmo registro.
Não há alteração de DOM para abrir o detalhe, aumento de timeout, nova espera
fixa, retry, skip, remoção de asserts ou mudança na UI/workflow.

Todas as asserções anteriores permanecem. Além da contagem de 20 registros,
o conteúdo integral e a ordem são comparados antes/depois de aprofundar em
nova aba e de cancelar navegação para filtro/login. A confirmação do login
voluntário também é validada como única e com mensagem sobre os registros.
Pausa, desfazer, PDF, partida parcial, ausência de persistência e expiração
remota continuam cobertos; nenhuma condição nova exclui o modo local.

## Validação e rastreabilidade

A cópia original foi conferida pelo blob Git
`447a88cf5014fae9fc82ffe5814ab7a6f100a315` e a sintaxe alterada passou em
`node --check`. A execução dinâmica é a do workflow dedicado, sem modificá-lo:
`test:super-neuropad`, `test:direct-track`, `test:cognitive`, build remoto,
E2E remoto, build local e E2E local. IDs, SHA e conclusões efetivamente
observados ficam registrados na PR complementar; sintaxe não é prova E2E.

O E2E emite um marco no log de cada modo somente após provar a fase aberta
pela UI e os 20 registros idênticos após aprofundar/cancelar filtro/login.
Os artefatos existentes preservam screenshots e auditorias axe das telas.

## Rollback

Reverter somente o commit desta correção de teste/documentação, mediante
revisão. Não reverter a #1009: sua guarda antitoque-duplo não é a causa deste
timeout. Sem migração, alteração clínica, backend, autenticação ou deploy.
