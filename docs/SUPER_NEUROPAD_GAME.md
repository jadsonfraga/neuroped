# Super NeuroPad Game

Aba em destaque (`/super-neuropad-game`) usada pela secretária na pré-consulta para
aplicar, sem câmera, um jogo de triagem de déficits grosseiros diretamente com a criança.

## O que é

- União reconciliada de quatro abas que continuam existindo: Sonda 10 (`/testes-diretos`),
  OBS-10 (`/avaliacao-pre-consulta-faixa-etaria`), Reconhecimento Visual
  (`/testes-reconhecimento`) e Testes Cognitivos por Faixa Etária (`/testes-cognitivos`).
- Estrutura de RPG: personagem à escolha, cinco fases (Floresta dos Olhos, Ilha das Palavras,
  Montanha dos Números, Caverna da Memória, Torre do Corpo), XP por participação, conquista
  por fase, trilha chiptune sintetizada no dispositivo (Web Audio, sem arquivos de áudio).
- Faixa etária somente em anos: 2–3, 4–5, 6–7, 8–9, 10–12, 13–17. Quatro desafios por fase,
  vinte por partida, cerca de dez minutos.
- Efeitos sonoros 8-bit compartilhados do app (moeda ao registrar, power-up ao fechar fase,
  pulo ao trocar de mundo, bandeira ao concluir).
- Todo item tem certo e errado explícitos. Itens de toque são conferidos pelo jogo; itens de
  fala e de ação são conferidos pela aplicadora contra o critério exibido na tela
  (Acertou / Errou / Não respondeu).
- Resultado objetivo em tela e em PDF detalhado (pergunta, resposta esperada, resposta
  registrada, certo/errado, tempo por item), via `buildDocumentPdf`, com figuras transcritas
  em texto pelo glossário `describeArt`.
- Acabamento arcade anos 90 (`client/src/styles/super-neuropad-arcade.css`): bordas grossas,
  sombra dura, barra de XP em blocos, moedas, corações por desafio, "press start" piscando,
  scanlines suaves. Animações só sob `prefers-reduced-motion: no-preference`; modo escuro
  pelos tokens do app.

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
- posição da idade na faixa (limite inferior ou superior), só quando há fase priorizada;
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

- Triagem autoral, não normativa: as faixas operacionais (por fase 3–4 esperado / 2 observar /
  0–1 alerta; total 16+ / 12–15 / ≤11) são leitura rápida da equipe, nunca escore, percentil,
  idade equivalente ou diagnóstico. A conclusão é do médico.
- A criança nunca vê certo/errado durante o jogo.
- Nada é persistido no navegador nem enviado por rede; o PDF é gerado localmente.
- Rota sensível (`SENSITIVE_ROUTES`): exige sessão; papéis admin, professional e operator.

## Código

- `client/src/features/super-neuropad/model.ts` — faixas, personagens, fases, banco de 120
  itens, motor de registro/resultado, relatório em texto e glossário para PDF.
- `client/src/features/super-neuropad/music.ts` — trilha chiptune.
- `client/src/features/super-neuropad/pdf.ts` — especificação do PDF detalhado.
- `client/src/pages/super-neuropad-game.tsx` — página.
- `client/src/styles/super-neuropad-arcade.css` — acabamento arcade (somente estilo).

## Verificação

- `npm run test:super-neuropad` (também encadeado em `test:direct-track`).
- `npm run build:client && npm run test:e2e:super-neuropad` — jornada completa no navegador
  com capturas, axe e download do PDF, incluindo pausa, desfazer, comando repetido e o painel
  de leitura para a consulta.

## Rollback

Reverter o commit desta entrega remove a rota, o item de navegação, a entrada em
`SENSITIVE_ROUTES` e os arquivos acima. Nenhuma migração, nenhum dado persistido.
