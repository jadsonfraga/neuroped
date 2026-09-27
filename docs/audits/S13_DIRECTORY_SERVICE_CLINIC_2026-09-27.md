# S13-R1 — serviço público correlacionado à clínica no diretório

Rastreia #594 / S13 / OPS-02. Um domínio: diretório público de agendamento.
Base lida: `9f0930fdfe6d03913935c03a6fe49d8cd9f044e3`. AGENTS.md canônico.

## Reconciliação e prioridade

#1007/#1008/#1010/#1011/#1012 já estão integradas e são preservadas.
#1003/#1005 não alteram os dois arquivos deste incremento; suas sobreposições
próprias continuam separadas. #1000, #1006 e #1009 não entram neste escopo.
#1014 já trabalha a recuperação D1 sintética: não criar ensaio paralelo nem
transformar execução parcial em restauração verificada.

S9 permanece P0 aberto: a destinação dos quatro cadastros e sete registros
dependentes observados no ciclo anterior não é inferida. Nenhuma associação,
migração, remoção de bypass ou ativação de Clinical LIVE ocorre aqui.
Enquanto esse corte depende de mapeamento autorizado e recuperação, este
incremento fecha a falha P1 executável de isolamento do diretório, não S9.

## Problema

`publicProviders` checava separadamente a membership na clínica solicitada e
EXISTS de serviço público do profissional em qualquer clínica. Profissional
em A e B, com serviço público apenas em B, aparecia no diretório de A. Isso
não demonstra vazamento de PHI; é uma associação pública comercial incorreta.

Sem slug, um serviço residual de membership revogada ou sem clinic_id podia
habilitar o profissional por existir uma membership ativa em outro lugar.
Uma clínica única suspensa/encerrada também não era excluída nesse ramo.

## Alteração mínima

O mesmo SELECT passa a correlacionar serviço -> clinic_memberships -> clinics.
Exige `s.clinic_id = cm.clinic_id`, o mesmo profissional, membership ativa,
clínica ativa e serviço ativo/público. Slug continua parametrizado. Sem slug,
permanece a exigência anterior de exatamente uma membership ativa (inclusive
	a contagem de memberships em clínicas suspensas), sem inferência alternativa.
EXISTS preserva uma única linha por profissional mesmo com vários serviços.

Não altera schema, preços, payload público, UI, reservas, locks de horário,
criptação, recepção ou predicados de escrita. Nenhuma query de mutação nova.

## Evidência local efetivamente executada

Node v22.16.0; fontes basais reconstruídas via conector e verificadas por blob:
- public-booking.ts: `a3c75c18cbc47abe48d098cb1543a0303c03d7c7`;
- operations-tenant-isolation.test.ts: `afab5e4f10538d8fece95f9de8e65f0d2d01dd1d`.

`node --test evidence/reproduce-directory.mjs` no pacote da sessão executa a
função publicProviders EXTRAÍDA da fonte real, removendo apenas tipos, sobre
SQLite em memória. Usa schema base + migration 0009 e projeção explicitamente
limitada das duas tabelas de booking. Não reescreve a query para fingir teste.
Não é teste HTTP, D1 remoto, middleware, browser nem bootstrap completo.
- RED na fonte basal: 15 cenários; 7 aprovados, 8 falhas; exit 1.
- GREEN na fonte corrigida: 15 aprovados, 0 falhas/pulos; exit 0.
- Parsing TypeScript dos dois arquivos por stripTypeScriptTypes: exit 0;
  parsing não equivale a typecheck.

## Teste de integração cadastrado no release existente

Bloco 7 aditivo em operations-tenant-isolation.test.ts: os seis blocos antigos
permanecem intactos. Usa os handlers reais, schema.d1.sql, todas as migrations
e o wrapper SQLite/D1 existente. Já integra `npm run test:operations`, chamado
por `npm run verify`; não há novo script, gate enfraquecido ou pipeline paralelo.

Quinze cenários: controles A/B; serviço exclusivo de A/B; privado/inativo;
membership revogada; link antigo com serviço residual; serviço sem clínica;
clínica única suspensa/encerrada; slug desconhecido/SQL-shaped; múltiplos
serviços sem duplicação; ausência de membership; booking desabilitado;
revogação injetada após entrada no handler e antes do SELECT final.
Cada leitura comum também verifica ausência de alterações via total_changes().

A execução desse teste integral, lint, typecheck, build e verify depende da
CI do candidato. Não foi feita localmente: clone bloqueado por DNS e terminal
remoto pausado por quota. Não atribuir resultados futuros à execução local.

## Limites e conclusão exigida

Este registro é pré-CI/pré-merge. Conferir resultados e parent de main do
candidato antes de integrar, sem override de proteção. Depois conferir deploy,
SHA e smoke da rota. Teste A/B sintético não equivale a ensaio A/B produtivo.
Não criar clínicas/pacientes fictícios em produção para obter uma prova.
S13 não está integralmente fechado: rota/PK/links gerados e demais achados
mantêm o escopo declarado no backlog. S9, S5, Asaas e Cliente Zero completo
não recebem promoção de estado por esta mudança.

## Rollback

PR de reversão deste incremento. Nenhuma migration ou dado a desfazer.
Reverter a query reintroduz o falso vínculo público; reavaliar esse risco.
Nunca remover a regressão para obter CI verde. Preservar evidências do ciclo.

## Reconciliação posterior — main avançou durante a CI

O candidato `a65efc566db7c201cee288907274250303ec4a8f` concluiu os onze
workflows com sucesso, inclusive Verify NeuroPed `36327976823`, Test, Lint
& Build `36327976857` e PR Check `36327976820`. A referência testada
`e63457cd61eabd8fae8c4ec0d5087bc2f0fb55fd` tem como parent de main `9f0930fd`.

O primeiro candidato (`c8d0385`) havia falhado na fixture: SAVEPOINT externo
combinado com BEGIN no wrapper de batch causava transação aninhada durante
o bootstrap de schema. O commit a65efc substituiu apenas o wrapper por
SAVEPOINT/RELEASE com rollback real e acrescentou um controle executável de
atomicidade. Não removeu nenhum dos seis blocos antigos ou dos quinze novos
cenários de diretório. Falha e correção constam no comentário 5856995236.

Antes do merge, main foi observado em
`8c24de888158c35d4e111a8352c6c2b9643fa24a`, já incorporando #1003, #1006 e
#1009 em trabalho concorrente. Não atribuir esses merges a esta revisão.
Os blobs de AGENTS.md, public-booking.ts e operations-tenant-isolation.test.ts
nessa nova base são idênticos aos da base anterior; a alteração continua
restrita ao mesmo domínio. O novo onboarding, protocolo e SuperNeuroPad devem
ser preservados, não reaplicados nem sobrescritos.

Este acréscimo documental provoca uma nova CI do candidato combinado com a
base atual. Onze workflows verdes contra a base anterior NÃO comprovam essa
nova combinação. Antes de integrar, verificar os parents do merge sintético,
resultados correspondentes e main atualizado, sem override de proteção.
Nenhum merge, deploy ou ensaio produtivo A/B da #1015 é atestado por este
registro. S9 e S5 permanecem abertos com os limites já descritos.
