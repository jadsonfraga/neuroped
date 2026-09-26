# OBS-10 Tablet — cobertura recuperada pela câmera, ritmo e integridade da saturação

24/09/2026 · continuidade da issue #931 e da PR #934. Base: `8486fd76bb696440ca164e510af5892c46118328`.

## Por que esta rodada existe

A PR #934 entregou o modo sem kit físico e declarou honestamente a cobertura reduzida. Ao reler
aquela lista de limitações contra o roteiro presencial, uma parte do que faltava não dependia de
instrumento nenhum: dependia apenas da câmera e do espaço da sala. Marcha, levantar, braços à frente,
dedo ao nariz, apoio em um pé e a regra SOL/LUA não usam papel, lápis, bola, blocos ou boneco. Estavam
fora do modo tablet sem que a restrição física justificasse.

## O que entrou

A partir de cinco anos, duas propostas do roteiro presencial voltaram, com as palavras do próprio
roteiro, sem norma nova, escore ou ponto de corte:

- Uma atividade única com quatro movimentos observados pela câmera, na ordem do roteiro: caminhar até
  um ponto e voltar, braços à frente, dedo ao nariz e apoio em um pé. O tablet sai da mão e fica
  apoiado de pé, mostrando o corpo inteiro e os pés. Nenhum objeto entra na proposta.
- A regra SOL/LUA, apenas falada, com a sequência e os intervalos do roteiro.

Ambas são de tipo `quiet`: a superfície infantil não recebe estímulo algum, o que o teste de navegador
verifica lendo o DOM da tela da criança e exigindo ausência de SOL, LUA, nariz e do comando de marcha.
No roteiro escolar, o movimento ocupa o intervalo entre a apresentação das palavras e a evocação, como
no presencial, e o teste confere tanto a posição quanto a ausência de alvo de memória nos passos.

Cada movimento carrega o caminho de omissão do presencial: sem marcha estável, dor, recusa ou espaço
seguro, omitir e registrar o motivo. O contrato de limitações passou a ser calculado: quando a proposta
motora existe, o registro declara que marcha, equilíbrio e coordenação foram observados pela câmera,
sem instrumento e sem cronometragem por segmento; quando não existe, declara a ausência. Continuam
fora, e o teste exige que continuem declaradas: chute e recepção de bola, provas provocadas de postura,
medidas formais de equilíbrio ou marcha, manipulação de objetos reais, preensão do lápis, força contra
resistência, tônus, reflexos e sensibilidade.

## Ritmo por atividade

Cada tarefa passou a declarar uma duração sugerida, tirada do roteiro presencial. Ela aparece na
orientação da atividade e somada na tela de prontidão, sempre rotulada como orientação e não prazo. O
limite absoluto de 600 segundos continua pertencendo ao controlador, não a essa soma, e um teste garante
que o total sugerido de cada faixa cabe no limite com folga para recusa, pausa e anotação.

## Descrição na revisão, categoria na coleta

Somar as duas propostas revelou um problema anterior: o modo tablet exigia a descrição digitada dentro
dos dez minutos, enquanto o roteiro presencial manda marcar a categoria e detalhar depois. Com dez
atividades, isso colocaria a redação de prosa dentro do tempo da criança e faria a evocação e o
encerramento caírem fora do limite.

A regra passou a ser a mesma do presencial. As garantias compensatórias são explícitas e testadas: a
categoria continua obrigatória; nenhuma descrição é preenchida por suposição; `pendingDescriptions`
conta as pendências; a revisão abre esses itens já expandidos, marca cada um como pendente e mostra o
total; e o resumo entregue ao médico declara quantas atividades ficaram sem descrição. A omissão segue
diferente e continua exigindo texto, porque sem o motivo nada registra por que a proposta não aconteceu.

Isso substitui deliberadamente uma asserção anterior, que exigia descrição para avançar. A troca está
registrada aqui e no teste, com as asserções novas cobrindo o que a antiga protegia.

## Defeito de integridade corrigido

Na auditoria do reducer apareceu uma assimetria real. Ao abrir uma atividade, a observação era criada
com `attempted` verdadeiro e `openedAt` preenchido, mas o evento `shown` podia ser descartado pelo teto
de eventos. O próprio validador da modalidade exige exatamente um `shown` casando com `openedAt`, então
o aplicativo era capaz de exportar um arquivo que ele mesmo recusaria reabrir.

A abertura agora só acontece se o evento couber. Na saturação, a atividade não é entregue à criança, o
estado explica o limite e o registro permanece coerente. O teste executa a saturação de verdade, com
1500 eventos, e confere que o registro saturado continua reimportável. A guarda foi verificada
falhando com o defeito reintroduzido antes de ser considerada válida.

## Verificação

Tipos, lint com zero avisos, o teste unitário da modalidade com as asserções novas, as duas jornadas de
navegador do tablet e as regressões OBS-10 clássicas e de navegação. Nenhuma asserção anterior foi
removida sem substituição declarada.

## Limites que permanecem

Não houve estudo de usabilidade com aplicadores iniciantes ou pessoas idosas, teste em tablets reais,
validação clínica, enquadramento regulatório ou demonstração de interesse comercial. Observar marcha e
equilíbrio pela câmera não é exame neurológico e não prova normalidade. A duração sugerida não é medida
de desempenho. O vídeo continua separado do JSON e exige conferência no destino institucional.
