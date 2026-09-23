# OBS-10 — estímulo em tela inteira e transições guiadas

23/09/2026 · continuidade da issue #929 e das PRs #930 e do ajuste de materiais.
Pedido do mantenedor: aplicação totalmente guiada dentro do aplicativo, com a
aplicadora precisando somente do tablet, da criança e da câmera.

## O que passou a existir

O cartão de tarefa exibe cenas de apontar/descrever e textos de leitura em tela
inteira para a criança, pela superfície dedicada `StimulusStage`. Essa
superfície é incapaz de vazar roteiro por construção: não importa `practical`,
`protocol` nem `session`, então só recebe o recurso permitido que `framePlan`
produz. Tarefas orais (memória casa–gato–pão, história e regra SOL/LUA) nunca
geram recurso de criança, o que o contrato `resourceIssues` já bloqueava e os
testes continuam provando. Após o encerramento da coleta a exibição fica
indisponível, para não induzir nova tentativa.

Entre tarefas consecutivas o cartão anuncia a próxima proposta e o que pegar ou
guardar, derivado da diferença de materiais das próprias tarefas; câmera,
colchonete, cadeira e trajeto não entram na troca. Avançar de bloco pelo cartão
mantém o foco no título da tarefa seguinte.

## O que continua fora da tela, por verdade clínica

Papel e lápis nas produções gráficas, objetos reais (bola, blocos, boneco,
recipiente) e o livro físico na tarefa de folhear não foram virtualizados:
transformá-los em toque na tela mudaria o que se observa. Modelos de círculo,
cruz e quadrado continuam desenhados na folha da aplicadora, porque ver o
traçado ser produzido faz parte da proposta. Equivalência papel/tela não é
presumida: a instrução manda registrar o meio utilizado e a interpretação é
médica. O guia avisa que, se a gravação usa o mesmo aparelho, mostrar a tela
desloca o enquadramento.

## Verificação e reversão

Testes unitários novos: pureza e correção de `taskHandoff` nos 145 cartões,
isolamento de importações do `StimulusStage` e presença dos portões de tela nos
componentes. Jornada de navegador nova: abrir o estímulo durante a coleta e
conferir que só o estímulo e o controle de encerrar aparecem, fechar por
Escape com retorno de foco, cena em tela inteira na preparação sem palavras de
resposta, transição anunciada com pegar/guardar corretos, foco preservado na
troca de bloco e bloqueio da tela inteira após o encerramento. Nenhuma asserção
anterior foi removida; a captura axe roda também com a superfície aberta.

Sem mudança de esquema JSON, versão clínica, backend, persistência ou upload.
Rollback: reverter somente a PR desta rodada. Resultados e SHA publicado devem
ser conferidos nos workflows e no deploy, não inferidos deste documento.
