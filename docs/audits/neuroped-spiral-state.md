# NeuroPed · estado da espiral de convergência

Memória compacta entre sessões. Só fatos verificados (comando + exit code) ou
achados com reprodução. Atualizado ao fim de cada volta.

## VALIDADO

- Baseline em `main` 5828e0f (2026-09-26): `npm ci`, `npm run check`, `npm run lint`,
  `npm run test:cognitive` (inclui `test:sonda` e `test:direct-track`), exit 0.
- E2E baseline exit 0: `test:e2e:modo-facil`, `test:e2e:direct-track`, `test:e2e:sonda`,
  `tests/e2e/visual-recognition.mjs`.
- Banco cognitivo: 19 × 4 × 4 = 304 itens, IDs únicos, resposta entre as opções,
  montagem com peças suficientes e nunca já montada (script de leitura, sem escrita).
- Reconhecimento Visual: 58 SVGs presentes com SHA-256 batendo; 89 estímulos;
  distrator nunca igual ao alvo; idade 12 a 239 meses inclusive.
- Sonda guiada/direta: faixas 12–23, 24–35, 36–59, 60–95, 96–143, 144–215 meses,
  contíguas, inclusivas; Modo Fácil 1–19 anos com 10 itens por aplicação, sem repetição
  entre Sonda 10 e OBS-10.

## FALHAS REPRODUZIDAS

- [ESPIRAL 1, corrigida] EasyGame (Reconhecimento Visual e Cognitivos, sem `objective`):
  após o toque da criança, o item seguinte renderizava Mostrar/Acertou/Não acertou/Pular
  sob o dedo; o segundo toque de um toque duplo registrava resposta do adulto para item
  nunca mostrado. Reprodução: `tests/e2e/modo-facil.mjs` (`doubleTapAt`).
- [ESPIRAL 1, corrigida] EasyGame objetivo: toque duplo em Pular pulava dois itens.
- [ESPIRAL 1, corrigida] EasyGame objetivo: o último toque da criança abria a tela de
  resultado com Certo/Errado na mão dela.
- [ESPIRAL 1, corrigida] EasyGame: dica do adulto ("Esperado: GATO") visível com a tela
  da criança aberta (Cognitivos). Título, fala, dica e ilustração agora somem com a tela
  da criança aberta em qualquer modo.
- [ESPIRAL 1, corrigida] Cognitivos Modo Fácil: sem guarda de saída, sem `onProgress`;
  Reiniciar e trocar idade apagavam passos sem confirmar.
- [ESPIRAL 1, corrigida] Relatório do Modo Fácil datado em UTC (após 21h em Recife
  mostrava o dia seguinte); nome do arquivo baixado mutilava acentos.
- [ESPIRAL 1, corrigida] `test:e2e:modo-facil` e `test:e2e:direct-track` não rodavam em
  nenhum workflow; `components/jogo-facil/**` não disparava CI algum.

## RISCOS

- Três cópias quase idênticas de guarda de saída (`useSondaExitGuard`, `obs10/useExitGuard`,
  `visual-recognition/Workspace.tsx#useExitGuard`). Consolidar só com testes.
- Cognitivos guiado: itens de ditado mostram a palavra na fala/enunciado (`bank.ts` build);
  `Esperado:` e "Respondeu certo/errado" na tela da criança em modo guiado (`q.say`,
  linhas ~461–490). Itens com mais de uma resposta válida: c6-escrita-4 (GA_O), c4-visual-1
  (🔷 vs 🔶). Enunciado contém a resposta: c6-leitura-2, c3/c4/c5-escrita-1, c4-aritmetica-2.
  Decisão de conteúdo clínico: registrar, não alterar sem o Dr.
- Reconhecimento Visual: "categorias distintas" filtra só por tipo de arte (`model.ts:111`);
  "mesma categoria" a 12–23 meses lança erro de pareamento; Modo Fácil promete 8 figuras
  abaixo de 24 meses e entrega 7.
- Sonda/OBS-10 Modo Fácil: campo de meses ignorado; aceita 18–19 anos enquanto o contrato
  da Sonda guiada vai a 215 meses.
- OBS-10: texto `task` editável no registro pode divergir do título canônico no dossiê;
  importador não confere o texto; `pendingDescriptions` conta estações sem categoria como
  "categoria marcada"; percurso e rota planejada diferem só pelo título.
- OBS-10 tablet: "tarefa(s)" ainda em `engine.ts:166` e `TabletWorkspace.tsx:193`; guarda
  de vocabulário testa só "atividade".
- Cognitive Lab (`CognitiveTaskRunner`): prática mostra "Acertou!/Ops"; resultado com
  acurácia aparece no mesmo aparelho sem devolução.

## EM EXECUÇÃO

- ESPIRAL 2: Reconhecimento Visual, plano do Modo Fácil e distratores (ver PRÓXIMA FRONTEIRA).

## CONCLUÍDO NESTA ESPIRAL

- ESPIRAL 1 · EasyGame (consumido por Sonda 10, OBS-10, Reconhecimento Visual, Cognitivos):
  portão Próximo após qualquer decisão da tela da criança e após Pular no modo objetivo;
  tela neutra de devolução antes do resultado; conteúdo do adulto oculto com a tela da
  criança aberta ou portão armado; Voltar um passo no resultado; Jogar de novo confirma;
  data local no registro; nome de arquivo sem acentos; Cognitivos com `onProgress` e guarda
  de saída (`useSondaExitGuard` aceita prompt). Novo workflow `modo-facil.yml` roda
  `test:direct-track`, `test:e2e:modo-facil` e `test:e2e:direct-track`.
  Evidência: `npm run check` 0 · `npm run lint` 0 · `npm run test:cognitive` 0 ·
  `test:e2e:modo-facil` 0 (com toque duplo real e portão em Sonda, OBS-10, RV, Cognitivos) ·
  `test:e2e:direct-track` 0 · `test:e2e:sonda` 0 · `visual-recognition.mjs` 0 · `obs10.mjs` 0 ·
  `workflow-governance.test.mjs` 0. Prova negativa: E2E novo contra o EasyGame da `main`
  falha (portão ausente, exit 1).

## PRÓXIMA FRONTEIRA

- Reconhecimento Visual: `distantes` de fato em categoria diferente; `categoria` sob 24
  meses fail-closed com mensagem certa; contagem prometida = entregue.
- OBS-10: coerência `task` entre registro, relatório e dossiê; `pendingDescriptions`.
- Guarda de saída única para os quatro fluxos.
