# OBS-10 — concordância entre observadores

Revisão de engenharia: 24/09/2026. Esquema do relatório: `obs10-observer-agreement-1`.

## Por que existe

O OBS-10 declara com cuidado o que não é: não valida, não pontua, não diagnostica. Faltava o outro lado
da honestidade, que é poder **demonstrar** alguma coisa. O marco seguinte do piloto pede concordância
entre observadores, e nenhum dos dois modos permitia produzir esse número. Sem ele, a qualidade do
roteiro é afirmada, não medida.

Este painel compara duas codificações independentes da mesma sessão. Serve ao estudo de confiabilidade,
fora do atendimento, e **mede a codificação, não a criança**.

## Como se usa

Duas pessoas observam a mesma sessão de forma independente, uma ao vivo e outra pelo vídeo, e cada uma
produz seu registro pelo fluxo normal, presencial ou tablet. Na rota OBS-10, antes de iniciar qualquer
coleta, o painel "Estudo de confiabilidade" recebe os dois JSON e devolve:

- concordância exata e percentual sobre as tarefas que os dois categorizaram;
- kappa de Cohen, corrigido pelo acaso;
- quantas tarefas só um categorizou e quantas nenhum categorizou;
- a lista de divergências, tarefa a tarefa, com as duas categorias.

O rótulo do par é digitado pela pessoa e serve à planilha do estudo. Nada é enviado: leitura e cálculo
acontecem na tela.

## O que o painel se recusa a fazer

Falha fechada em vez de produzir um número sem sentido. Recusa comparar modalidades diferentes, fichas
ou idades diferentes, código institucional ausente ou divergente, e registros que repetem a mesma
tarefa. Registros livres do modo presencial não têm identidade estável entre observadores: são contados
e declarados, nunca pareados.

O kappa também se recusa a inventar. Quando nenhuma tarefa foi categorizada pelos dois, não há número.
Quando os dois usaram uma única categoria em tudo, a concordância esperada pelo acaso é total e o kappa
fica indefinido, declarado como tal em vez de virar 1. Discordância sistemática produz kappa negativo,
que não é truncado em zero. Abaixo de dez tarefas comparáveis, o relatório marca a amostra como
pequena demais para estabilidade.

## Privacidade da exportação

A exportação do estudo é whitelist e o teste compara a lista exata de chaves, para que um campo novo
não comece a carregar conteúdo de sessão sem que alguém perceba. Saem contagens, categorias,
identificadores de tarefa, ficha, idade em meses e o rótulo do par. Não saem código institucional,
identificador de sessão, descrições escritas, traçados nem vídeo. Isso não é uma declaração de
anonimato: em grupos pequenos, ficha e idade ainda podem aproximar de uma pessoa.

## Limites

Concordância alta pode refletir categorias fáceis ou um único padrão dominante; concordância baixa pode
refletir instrução ambígua, ângulo de câmera ou momentos diferentes observados. Divergência não prova
erro de um observador. Nenhum resultado aqui valida o roteiro, mede a criança ou autoriza diagnóstico, e
nada substitui a leitura médica. O painel oferece o instrumento de medida; o estudo, a amostra e a
interpretação continuam sendo trabalho humano.

## Verificação

`tests/unit/obs10-agreement.test.ts` cobre a matemática com um exemplo trabalhado conferido à mão, os
casos de borda do kappa (perfeito, indefinido, negativo, amostra pequena, nada comparável), o
pareamento que falha fechado e a whitelist da exportação. `tests/e2e/obs10-agreement.mjs` produz dois
registros reais pelo próprio aplicativo, com o mesmo código institucional e categorias divergentes,
confere a recusa de um par incompatível, os números na tela e a ausência de identificadores no arquivo
exportado. Ambos entram no workflow `OBS-10 clinical observation workflow`.
