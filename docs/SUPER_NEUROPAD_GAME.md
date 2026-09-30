# Super NeuroPad Game

Aba em destaque (`/super-neuropad-game`): **avaliação única de pré-consulta**, aplicada pela
aplicadora junto com a criança, sem câmera e sem instrumento externo, em no máximo 20 minutos.
Integra os elementos da Sonda 10, da Observa 10 (OBS-10), do Reconhecimento Visual e da
Avaliação Cognitiva Infantil. As quatro abas continuam existindo, com os seus bancos
intactos; o jogo **lê** os bancos delas e não os modifica.

## O que é

- Seis mundos (RPG com personagem, XP, conquistas e trilha chiptune sintetizada no dispositivo):
  Vila da Conversa, Floresta dos Olhos, Ilha das Palavras, Montanha dos Números, Caverna da
  Memória e Torre do Corpo.
- Faixas **anuais** de 2 a 17 anos (o banco objetivo e o cognitivo já são anuais). Menos de 2
  anos: o jogo não é aplicado; a tela bloqueia e encaminha para OBS-10 (0–23 meses) e Sonda 10.
- 4 desafios por mundo até 5 anos (24 na partida); 5 por mundo a partir de 6 anos (30).
- Efeitos sonoros 8-bit compartilhados do app (moeda ao registrar, power-up ao fechar fase,
  pulo ao trocar de mundo, bandeira ao concluir).
- Todo item tem certo e errado explícitos. Toque e montagem de palavra são conferidos pelo jogo;
  fala e ação são conferidas pela aplicadora contra o critério exibido na tela (Acertou /
  Acertou por gesto (2–3 anos) / Errou / Não respondeu / Recusou).
- Resultado objetivo em tela e em PDF detalhado via `buildDocumentPdf`, com figuras transcritas
  em texto pelo glossário `describeArt` e as figuras do Reconhecimento Visual pelo nome.
- Acabamento arcade anos 90 (`client/src/styles/super-neuropad-arcade.css`). Animações só sob
  `prefers-reduced-motion: no-preference`; modo escuro pelos tokens do app.

## Pré-consulta integrada (v2026-09-30.1)

### De onde vem cada item

| Aba de origem | Onde mora | O que entrou no jogo |
|---|---|---|
| Sonda 10 (`/testes-diretos`) | `client/src/data/sondaDez*.ts`, `components/sonda-dez/*`, itens de índice par de `components/jogo-facil/objectiveBank.ts` | chamar pelo nome, atenção conjunta, brincadeira simbólica, conversação/reciprocidade, narrativa e inferência, emoção, problema social, controle inibitório (DIA/NOITE), flexibilidade, memória operacional (ordem inversa), planejamento; itens objetivos de toque da idade |
| Observa 10 (`/avaliacao-pre-consulta-faixa-etaria`) | `client/src/features/obs10/protocol.ts` (v1.6.1), `docs/audits/obs10-stations-gameflow.md`, itens de índice ímpar do banco objetivo | interagir e conversar, linguagem e raciocínio, registro e evocação de CASA–GATO–PÃO (6+), repetição de dígitos, SOL/LUA, núcleo motor (andar, correr, equilíbrio, linha), mãos/desenho/escrita (cópia de figuras na tela), retomar e encerrar |
| Reconhecimento visual (`/testes-reconhecimento`) | `client/src/features/visual-recognition/model.ts` + `Stimulus.tsx` (figuras Mulberry, cores, opostos) | reconhecer (mesma pergunta e mesma graduação de alternativas do Modo Fácil: 2 opções abaixo de 4 anos, 3 até 6, 4 a partir de 7), parear, nomear (com sinônimos do banco), cores, opostos e conceitos contextualizados (quente/frio, pesado/leve, a partir de 5 anos, com o contexto do próprio banco) |
| Avaliação cognitiva infantil (`/testes-cognitivos`) | `client/src/features/cognitive-age/bank.ts` (1–19 anos; visual, leitura, escrita, aritmética) | itens da idade com as mesmas alternativas e a mesma resposta: toque, fala e montagem de palavra (ditado/cópia com letras grandes) |

Cada item leva `origin` e `ref` (ex.: `Sonda 10 · 5–7 anos · controle inibitório`,
`Cognitivos 7 anos · números 2`), que saem na tela, no PDF, no prontuário e no bloco
estruturado. O teste `tests/unit/super-neuropad-integrated-bank.test.ts` confere que os itens
cognitivos e objetivos são os mesmos das abas de origem.

### Mundos × domínios × origens

| Mundo | Domínio | Origens |
|---|---|---|
| 1 · Vila da Conversa | Interação e comunicação | Sonda 10, OBS-10 |
| 2 · Floresta dos Olhos | Reconhecimento visual e raciocínio visual | Reconhecimento visual, Cognitiva |
| 3 · Ilha das Palavras | Linguagem, leitura e escrita | Sonda 10, OBS-10, Cognitiva |
| 4 · Montanha dos Números | Quantidade e aritmética | Cognitiva, Sonda 10, OBS-10 |
| 5 · Caverna da Memória | Memória, atenção e funções executivas | Sonda 10, OBS-10 |
| 6 · Torre do Corpo | Coordenação motora, desenho e escrita | OBS-10, Sonda 10, Cognitiva |

### Tabela de calibração por idade

Contagens geradas do banco (`INTEGRATED_BANK`); tempo por `estimateBandSeconds`.

| Idade | Itens (por mundo) | Sonda 10 | OBS-10 | Rec. visual | Cognitiva | Tipos (toque/fala/ação/montar) | Com gesto | Tempo estimado |
|---|---|---|---|---|---|---|---|---|
| 2 anos | 24 (4) | 10 | 6 | 4 | 4 | 9/5/10/0 | 4 | 16.0 min |
| 3 anos | 24 (4) | 11 | 5 | 3 | 5 | 9/6/9/0 | 3 | 16.2 min |
| 4 anos | 24 (4) | 8 | 7 | 3 | 6 | 9/11/4/0 | 0 | 14.8 min |
| 5 anos | 24 (4) | 8 | 7 | 3 | 6 | 12/7/5/0 | 0 | 15.2 min |
| 6 anos | 30 (5) | 11 | 10 | 2 | 7 | 14/11/5/0 | 0 | 13.9 min |
| 7 anos | 30 (5) | 8 | 12 | 2 | 8 | 14/11/4/1 | 0 | 13.7 min |
| 8 anos | 30 (5) | 10 | 10 | 1 | 9 | 14/11/4/1 | 0 | 14.3 min |
| 9 anos | 30 (5) | 7 | 13 | 1 | 9 | 14/11/4/1 | 0 | 14.4 min |
| 10 anos | 30 (5) | 11 | 9 | 1 | 9 | 14/11/4/1 | 0 | 14.4 min |
| 11 anos | 30 (5) | 9 | 11 | 1 | 9 | 14/11/4/1 | 0 | 14.3 min |
| 12 anos | 30 (5) | 11 | 9 | 1 | 9 | 14/11/4/1 | 0 | 15.2 min |
| 13 anos | 30 (5) | 7 | 13 | 1 | 9 | 14/11/4/1 | 0 | 15.1 min |
| 14 anos | 30 (5) | 11 | 9 | 1 | 9 | 14/11/4/1 | 0 | 15.4 min |
| 15 anos | 30 (5) | 7 | 13 | 1 | 9 | 14/11/4/1 | 0 | 15.4 min |
| 16 anos | 30 (5) | 11 | 9 | 1 | 9 | 14/11/4/1 | 0 | 15.5 min |
| 17 anos | 30 (5) | 7 | 13 | 1 | 9 | 14/11/4/1 | 0 | 15.4 min |

**Tempo estimado**: toque 12 s (+1 s a cada 25 caracteres de leitura, máx. +25 s), fala 20 s,
ação 25 s, montar 30 s + 2 s por letra (ou o tempo próprio do item); fator de criança pequena
×1,5 até 3 anos e ×1,25 até 5; 10 % de folga para repetições; preparação 60 s, 15 s de
apresentação por mundo, 5 s por exposição de memória e pausa planejada de 90 s até 5 anos.
O teste exige ≤ 20 min em todas as idades; a tela de preparação mostra a estimativa.

**Critérios de calibração** (sem norma, sem inflar escore, sem mudar corte):

- Cada ano usa os itens do perfil da **própria idade** nas abas de origem; quando um item da
  idade era mais difícil que o esperado, entrou o item mais fácil do ano anterior (item-piso,
  permitido pelo teste só um ano abaixo). Corrigir item mal nivelado não mexe nas razões de corte.
- 2–3 anos: menos desafios, sem letras, leitura, numerais ou nomeação de cor (cor receptiva só
  a partir de 30 meses, nomeação a partir de 4 anos, como no roteiro visual); quantidades
  comparadas por figura; falas com **alternativa aceita por gesto/apontar**; alvos grandes.
- Repetição de dígitos cresce com a idade (direta 3 aos 4 anos, 4 aos 6, 5 aos 9, 6 aos 12;
  inversa só a partir de 6), CASA–GATO–PÃO a partir de 6 anos, conceitos contextualizados a
  partir de 5 anos.
- Vocabulário e situações do cotidiano brasileiro (parquinho, escola, R$, ônibus, guarda-chuva,
  comida do dia a dia), nada que exija objeto, papel ou lápis: desenho e cópia são
  feitos com o dedo na tela (nada é exportado); o ambiente usa só o chão, a porta e a mesa da sala.
- Marcos citados para 2–5 anos vêm das fontes que o OBS-10 já usa
  (`SUPER_NEUROPAD_MILESTONE_SOURCES`: CDC *Learn the Signs. Act Early*, AAP Bright Futures).
  As faixas são **descritivas / esperadas**, não normas validadas em crianças brasileiras.

### Dificuldades de criança pequena

- Roteiro da aplicadora em cada item (o que perguntar e o que conta como acerto).
- "Não respondeu" (criança calada) e "Recusou" (diz não, empurra) separados de "Errou"; ambos
  contam como não acertados e aparecem à parte no resultado, na leitura e no PDF.
- "Repeti o comando" (repetição permitida, registrada), Pausa (o tempo do item para; conta o
  tempo em pausa), pausa automática quando a tela sai de foco, pausa planejada no tempo estimado
  até 5 anos.
- "Pular este mundo" com motivo (criança cansada ou sem colaboração, recusou o mundo inteiro,
  sem espaço ou condição na sala, pedido da família, outro motivo): o mundo vira **não aplicado — motivo**; os registros dos outros mundos continuam.
  Pela regra de 26/09/2026, a partida fica incompleta e não recebe classificação (global ou por
  mundo).

### Resultado, PDF e prontuário

- Tela: resumo, desempenho por domínio × esperado para a idade (mínimo esperado conforme o
  número de itens do mundo), painel "O que foi testado por instrumento de origem",
  observações da aplicadora (chips + texto livre, até 1200 caracteres) e registros item a item.
- PDF (`pdf.ts`): Identificação da sessão (data e hora locais, idade, duração, pausas e tempo em
  pausa, repetições, acertos por gesto, mundos não aplicados); O que foi testado por
  instrumento de origem; Desempenho por domínio x esperado para a idade; Leitura para a
  consulta (só partida completa); um bloco por mundo com cada item (origem, tipo, resposta
  esperada, resposta da criança, resultado, tempo e repetições); Observações da aplicadora;
  Critérios de leitura; **Dados estruturados** (uma linha por registro `SESSAO`, `DOMINIO`,
  `ORIGEM`, `ITEM`, `OBSERVACOES`, cada uma com JSON numa linha, para leitura por IA);
  Proveniência e natureza.
- Salvar no prontuário continua explícito; as linhas trazem o que foi testado por instrumento,
  mundos não aplicados, observações e cada item com a origem.

## Controles da aplicadora (v2026-09-26.1)

- **Desfazer último**: apaga o último registro e volta exatamente ao mesmo desafio
  (`undoLastAnswer`). Serve para toque errado da aplicadora ou criança que mudou de ideia.
- **Pausa**: congela o desafio (opções somem) e zera o cronômetro do item ao continuar, para o
  tempo não inflar com lanche ou banheiro.
- **Encerrar**: fecha a partida antes do fim e mostra o resultado como partida incompleta;
  fases sem item registrado aparecem como "não aplicada", nunca como alerta.
- **Repeti o comando**: marca no registro que a instrução foi repetida uma vez (campo
  `repeated`); sai no detalhamento, no PDF e na leitura.
- **Preparação em três toques**: passos com check (idade, herói, inventário opcional).
- **Dicas de tela**: "Tela para a criança" nos itens de toque, "Tela para você" nos itens
  julgados e na introdução de cada fase; "Leia em voz alta" sobre a pergunta.
- **Exposição padronizada na memória visual**: contagem de 5 s visível e as figuras somem
  sozinhas; a aplicadora pode esconder antes.
- **Rolagem automática**: cada tela nova começa no topo, para caber no tablet sem rolar.
- **Proveniência do registro**: pausas e registros desfeitos ficam na sessão
  (`pauseCount`, `undoCount`) e saem na identificação do PDF e na leitura.
- Diversão sem revelar acerto: balões de fala do herói na introdução e na conquista,
  prateleira de conquistas no HUD e na tela final.

## Uso prático na consulta (30/09/2026)

- **Salvar no prontuário do paciente** (tela de resultado): envia ao paciente escolhido o
  resumo em prosa (`buildGameBrief`), uma linha com os dados da partida (idade, faixa, itens,
  tempo nas tarefas, duração da sessão, pausas e desfeitos) e cada item registrado com
  esperado, registrado, tempo e repetição (`buildPatientRecordItems`). Partida incompleta
  continua sem classificação. Carregado sob demanda só no resultado.
- **Resultado protegido**: "Nova partida" pede confirmação enquanto o resultado não foi
  copiado, baixado (PDF/TXT) ou salvo em paciente; um aviso mostra se já foi guardado.
- **Nova partida = outra criança**: limpa idade e herói, para a faixa (e os itens) nunca
  ficarem herdados da criança anterior.
- **Reiniciar (mesma criança)**: no HUD, confirma e volta direto ao mundo 1 mantendo idade,
  herói e inventário; a ordem das opções é sorteada de novo a cada partida.
- **Pausa automática**: tela bloqueada ou troca de aplicativo durante um desafio pausa sozinho
  (conta como pausa na proveniência), para o tempo do item não inflar. A trilha para na pausa
  e volta ao continuar. O botão Pausa só fica ativo no desafio.
- **Atalhos da aplicadora** (teclado físico ou tablet com teclado): `1` Acertou, `2` Errou,
  `3` Não respondeu, `4` Recusou e `5` Acertou por gesto (só quando o item aceita) nos itens
  julgados (fala e ação) e `P` pausa/continua. Itens de toque
  continuam exclusivos da criança; tecla segurada, combinações e digitação em campos não
  disparam atalhos; os atalhos passam pela mesma guarda de toque duplo.
- **Cabeçalho do resultado**: data e hora locais da partida, idade e faixa, duração da sessão
  (relógio, `sessionWallSeconds`) e tempo somado nas tarefas.

## Leitura para a consulta

`interpret(session)` produz uma leitura descritiva e autoral, sem norma, percentil, idade
equivalente ou diagnóstico, exibida na tela de resultado, no relatório em texto e na seção
"Leitura para a consulta" do PDF:

- prioridades: fases aplicadas fora do esperado, alerta antes de observar, menos acertos
  antes;
- padrão de resposta: predomínio de erro ativo (respondeu fora do critério), de não resposta
  (recusa, timidez, cansaço ou não compreensão a considerar antes de ler como déficit) ou
  misto;
- ritmo: mediana de segundos por item da própria partida e itens com 2 vezes a mediana
  (mínimo 12 s), comparação interna, nunca tempo normativo;
- toque × aplicadora: acertos nos itens conferidos pelo jogo contra os conferidos pela
  aplicadora, com diferença de 40 pontos percentuais ou mais anotada;
- comandos repetidos; abas de origem que aprofundam cada fase priorizada, com link direto
  (`Phase.routes`) na tela de resultado;
- toques impulsivos: dois ou mais toques errados em menos de 1 s;
- não resposta concentrada por tipo de tarefa (fala, ação ou toque), com hipóteses a separar;
- fadiga: 75 % ou mais de acertos na primeira metade e 50 % ou menos na segunda (partida
  completa); ritmo desacelerado quando a mediana dos cinco últimos itens é o dobro da dos
  cinco primeiros (mínimo 4 s);
- recusas e acertos por gesto contados à parte (as faixas agora são anuais; a antiga nota de
  posição da idade na faixa saiu);
- roteiro autoral por fase priorizada (`Phase.consult`): o que conferir na consulta, sem
  diagnóstico;
- sinais de confiabilidade do registro em chips (toques rápidos, queda, ritmo, pausas e
  desfazer);
- lista "Itens para checar na consulta" com enunciado, esperado, registrado, tempo e
  repetição.

`buildGameBrief(session)` gera um resumo em prosa corrida para colar no prontuário
(botão "Copiar resumo para o prontuário"); o registro completo continua em
"Copiar registro completo".

## Contrato clínico

- Triagem autoral, não normativa: as faixas operacionais mantêm as mesmas razões de antes
  (por mundo ≥ 75 % esperado, ≥ 50 % observar; total ≥ 80 % / ≥ 60 %). Com 4 itens por mundo:
  3–4 esperado / 2 observar / 0–1 alerta; com 5: 4–5 / 3 / 0–2; total 24 itens: 20–24 / 15–19 /
  0–14; total 30: 24–30 / 18–23 / 0–17. São leitura rápida da equipe, nunca escore, percentil,
  idade equivalente ou diagnóstico. A conclusão é do médico.
- A criança nunca vê certo/errado durante o jogo.
- Nada é persistido no navegador nem enviado por rede automaticamente; o PDF é gerado
  localmente. A única saída por rede é **Salvar no prontuário do paciente**, uma ação explícita
  da profissional na tela de resultado, pelo mesmo componente das demais escalas
  (`SaveToPatient`).
- Rota sensível (`SENSITIVE_ROUTES`): exige sessão; papéis admin, professional e operator.

## Código

- `client/src/features/super-neuropad/items.ts` — tipos de item, origens e rótulos.
- `client/src/features/super-neuropad/bank.ts` — banco integrado por ano (2–17), montado a partir
  dos bancos das quatro abas de origem.
- `client/src/features/super-neuropad/model.ts` — faixas anuais, bloqueio de menores de 2 anos,
  estimativa de tempo, mundos, motor de registro/resultado, relatórios, bloco estruturado e
  glossário para PDF.
- `client/src/features/super-neuropad/music.ts` — trilha chiptune.
- `client/src/features/super-neuropad/pdf.ts` — especificação do PDF detalhado.
- `client/src/pages/super-neuropad-game.tsx` — página.
- `client/src/styles/super-neuropad-arcade.css` — acabamento arcade (somente estilo).

## Verificação

- `npm run test:super-neuropad` (também encadeado em `test:direct-track`): motor, relatório,
  PDF e `super-neuropad-integrated-bank.test.ts` (contagens por ano, ids e conteúdos sem
  duplicata, origens, reuso fiel, alternativas, figuras visuais por idade, adaptações de 2–3
  anos, nada externo, tudo legível no PDF, ≤ 20 min em todas as idades).
- `npm run build:client && npm run test:e2e:super-neuropad` — jornada completa no navegador
  com capturas, axe e download do PDF, incluindo pausa, desfazer, comando repetido e o painel
  de leitura para a consulta; também pausa automática por tela oculta, atalho `1`, painel de
  salvar em paciente, nova partida sem herdar idade, reiniciar direto no mundo 1 e confirmação
  antes de descartar resultado não guardado. Desde 30/09/2026 (integrada): bloqueio de menor
  de 2 anos, estimativa de tempo, seis mundos com 30 desafios aos 7 anos, recusa, montagem de
  palavra, desenho com o dedo, painéis de domínio/origem, observações, conteúdo do PDF (quando
  há `pdftotext`), mundo pulado como "não aplicado" e 3 anos com acerto por gesto.

## Rollback

Reverter o commit desta entrega remove a rota, o item de navegação, a entrada em
`SENSITIVE_ROUTES` e os arquivos acima. Nenhuma migração, nenhum dado persistido.


## Revisão da consolidação — 26/09/2026

Partidas incompletas não recebem classificação global, por fase ou interpretação.
Os registros individuais continuam disponíveis na tela, no resumo e no PDF; a
completude exige cada item previsto exatamente uma vez, não apenas 20 respostas.
A pausa mantém a contagem e o estado do estímulo de memória; retomar não expõe
novamente figuras já escondidas. O tempo informado soma somente os intervalos
ativos do desafio. Links de aprofundamento abrem em outra aba e conservam o
resultado na aba original. O aviso de fechar a aba também cobre resultados.

Regressões: `test:super-neuropad` cobre interrupções em 0/1/4/7/19 itens,
duplicação de registros e os três formatos de saída; `test:e2e:super-neuropad`
cobre pausa antes/depois de esconder memória, aprofundamento com preservação
de resultado, encerramento após um item e download do PDF parcial.
Rollback: reverter o commit da revisão; não há migração ou dado persistido.

### Navegação interna e registro em memória

A proteção também cobre navegação dentro do aplicativo: o `beforeunload` sozinho
não é disparado por mudanças de rota. A guarda compartilhada com os Cognitivos
pede confirmação antes de descartar a partida; cancelar mantém os 20 registros e
a tela de resultados. Aceitar permite sair. Redirecionamentos obrigatórios por
sessão inválida continuam liberados. A prova de navegador cobre recusa e aceite.
O aviso de PDF parcial descreve apenas as observações, sem prometer interpretação.


A guarda agora resolve o modo de acesso dentro do próprio hook. A ausência de
usuário remoto não torna uma sessão local inválida. A limpeza usa layout effect
para remover listeners antes de um redirecionamento obrigatório desmontar a tela.
O CI executa a jornada nos builds remoto e local; o remoto também simula o evento
real de expiração após uma partida e exige login visível sem confirmação obsoleta.
Testes Diretos, Sonda guiada e Cognitivos compartilham a mesma decisão de sessão.
