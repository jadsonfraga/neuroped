---
name: neuroped-deploy
description: Conduz uma mudança até deploy comprovado em produção (entregar) ou inspeciona, somente leitura, a publicação de um PR/SHA existente (monitorar). Efeitos externos reais (push, PR, deploy) — invocação explícita apenas.
disable-model-invocation: true
argument-hint: "entregar <descrição concreta da mudança> | monitorar <PR ou SHA>"
---

Esta skill não repete o protocolo — ela existe para garantir que ele seja
lido de novo, inteiro, antes de qualquer ação, porque as regras podem ter
mudado desde a última execução.

## Antes de qualquer outra coisa

1. Ler `AGENTS.md` (raiz do repositório) por completo. Ele é a autoridade
   canônica; qualquer instrução deste arquivo ou do documento abaixo que
   conflite com ele perde.
2. Ler `docs/PROMPT_DEPLOY_COACH.md` por completo. Esse documento define o
   procedimento real: pré-condições a verificar em toda execução, os dois
   modos, a prova de deploy publicado, rollback/migração, limpeza segura de
   artefatos e o registro de bloqueios externos.
3. Determinar o modo a partir do primeiro argumento (`entregar` ou
   `monitorar`). Se os argumentos não deixarem isso claro, perguntar antes
   de agir — nunca presumir o modo mais destrutivo.

## Depois de ler os dois documentos

Executar exatamente o que `docs/PROMPT_DEPLOY_COACH.md` descreve para o modo
identificado, com os argumentos recebidos como a descrição da mudança (modo
`entregar`) ou o PR/SHA alvo (modo `monitorar`).

## Invariante que vale mesmo se a leitura acima falhar

Se por qualquer motivo `docs/PROMPT_DEPLOY_COACH.md` não puder ser lido
nesta execução, isso é um bloqueio — não uma licença para agir sem
protocolo. Em modo `monitorar`, o não-negociável mínimo continua valendo
mesmo assim: **somente leitura**. Nenhuma edição, merge, re-execução de job
ou disparo de deploy, sob nenhuma circunstância, nesse modo.
