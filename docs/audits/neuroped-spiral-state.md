# NeuroPed — estado da espiral de convergência

Memória compacta entre sessões. Só fatos verificados na máquina; sem diário.
Branch de trabalho: `claude/modo-computador-game-tab-vo6xvc`; uma PR em voo por vez,
reiniciada a partir da main mesclada a cada merge (squash), com os commits seguintes
reaplicados por cherry-pick e re-verificados antes do próximo push.

## VALIDADO

- Baseline (main + Super NeuroPad Game, #969): check, lint, test:cognitive
  (inclui test:sonda e test:direct-track), test:clinical, build:client, E2E de
  navegação, do jogo, do Modo Fácil, da Sonda, do OBS-10, do Reconhecimento
  Visual e das abas diretas — exit 0.
- Motor compartilhado (`EasyGame`): trava de toque duplo por carimbo de evento,
  transição neutra em todo registro automático, entrega neutra no fim, dica e
  título do aplicador ocultos com a tela da criança aberta.
- Banco cognitivo: 304 itens = 19×4×4; ditado sem a palavra na fala/tela;
  itens de fala identificam o estímulo no registro.
- Reconhecimento Visual: 89 itens, 58 SVGs presentes, faixas 12–239 meses
  contíguas; "mesma categoria" nunca trava o roteiro; distratores de outra
  categoria priorizados quando existem; nota do Modo Fácil nunca promete mais
  figuras do que o roteiro tem.
- OBS-10: nomes de estações/blocos derivam de uma fonte única
  (`PHASES`/`PRACTICAL_TASKS`/`tabletPlan`); round-trip export→import sem
  perda; rascunho de omissão nunca vira descrição de estação aplicada; prono
  não sobrevive à troca de faixa fora de onde é permitido.
- Sonda 10: Voltar do navegador para `/login` com sessão válida não apaga o
  registro em curso (a isenção do prompt de saída agora depende da sessão
  real, não de uma lista fixa de rotas).
- CSS: botão e título de passo do motor compartilhado deixaram de divergir
  entre Sonda, OBS-10, Reconhecimento Visual e Cognitivos (`:where()` no
  escopo `.obs10`/`.rv-workspace`/`.rv-child-dialog`); medido antes/depois no
  build real. `audit:design`, `audit:contrast`, `audit:tailwind-opacity` verdes.
- CSS: `escuta-clinica.css` deixou de reimportar `tokens.css` (#984). O chunk
  lazy da rota `/escuta-clinica` compilava com 106 propriedades `--np-*`
  duplicadas e um `:root` inteiro a mais, mais tarde na ordem do documento —
  medido nos bytes reais do build, num worktree isolado no `origin/main` não
  modificado, antes/depois. Guard estático novo
  (`tests/unit/css-import-scope.test.mjs`, encadeado em `test:quick-wins`)
  trava qualquer CSS por rota que volte a reimportar `tokens.css`.

## MERGEADO (ordem cronológica)

1. #969 — Super NeuroPad Game integrado à main atual.
2. #974 — motor compartilhado: trava de toque duplo, transição neutra.
3. #975 — Testes Cognitivos: ditado sem a palavra, GA_O com resposta única.
4. #977 — OBS-10: rascunho de omissão, prono fora da ficha, nome de estação.
5. #979 — Reconhecimento Visual: categoria sem par, distratores, contagem.
6. #980 — Sonda: exit-guard reconhece sessão real, não rota fixa.
7. #981 — CSS: escopo `:where()` no botão/h2 de página.
8. #984 — CSS: `escuta-clinica.css` para de vazar tokens duplicados.

Fila local esvaziada; nenhum commit pendente sem PR neste ponto da espiral.

## RESOLVIDO EM SESSÃO POSTERIOR (PR #999)

- `#main-content button:not([data-size="icon"]) {min-height:44px}`
  (`premium-app-shell-v12.css` e duplicata em `premium-polish-10.css`) —
  **corrigido**. Reanálise por profundidade de chaves no CSS buildado mostrou
  que a regra é incondicional (não está dentro do `@media (hover:hover)` que a
  cerca visualmente na leitura da fonte), então o bug afetava todo
  dispositivo/viewport, não só desktop com mouse. Especificidade real
  (1,1,1) — ID + atributo dentro de `:not()` — vencia qualquer `min-h-*`
  isolado (0,1,0). Corrigido com o mesmo padrão `:where()` da PR #981,
  neutralizando `#main-content` e o atributo de `:not()`, preservando a
  especificidade do seletor de tipo `button` (perde para qualquer classe
  utilitária, mas ainda aplica o piso de 44px quando nada mais o disputa).
  Medido em build real, 4 viewports, antes (44px preso) e depois (80/96px
  corretos); botão sem classe e aba sem classe seguem em 44px, sem
  regressão. Prova negativa em
  `tests/unit/global-button-min-height-specificity.test.mjs`, wired em
  `test:quick-wins`.

## RISCOS CONHECIDOS (não corrigidos nesta espiral, por prudência de escopo)

- `visual-reset.css`/`premium-polish-10.css` têm vários seletores globais com
  `!important` sobre `button`/`input`/`select`/`textarea`/`[role=tab]`; não
  auditados individualmente nesta espiral.
- `tests/e2e/sonda-dez-digital.mjs` tem uma asserção de "Tempo ativo: Ns"
  sensível a tempo real (flake conhecido, observado uma vez, não corrigido).
- Cadência: o motor ignora um segundo toque em < 300 ms (`event.timeStamp`);
  qualquer novo E2E que toque em sequência imediata precisa espaçar toques.
- SuperNeuroPad Game: "Desfazer último" (undo) não tem a mesma guarda de
  toque duplo aplicada ao registro de resposta nesta rodada (2026-09-27) —
  um clique duplo no botão desfaz dois itens em vez de um. Risco menor
  (ação corretiva da aplicadora, não registro automático da criança) e fora
  do escopo desta correção pontual; considerar se houver relato real.

## BATERIA FINAL DE CONVERGÊNCIA (verificada nesta sessão, HEAD `9b3a300`)

- `npm run check`, `npm run lint`, `npm run test:patient-safety`,
  `npm run test:auth-bootstrap`, `npm run test:clinical` (356 casos, 97358
  assertivas), `npm run test:direct-track` (6 suítes), `npm run test:cognitive`,
  `npm run test:sonda`, `npm run audit:design`, `npm run audit:contrast`,
  `npm run audit:a11y` (0 violações serious/critical em 7 rotas),
  `npm run build:client` — todos exit 0, executados individualmente.
- `npm run verify:release` (bateria composta completa: lint, check,
  segurança, ownership, operações, metas terapêuticas, inventário diário,
  escalas clínicas, catálogo, ranking, fluxogramas, acesso, identidade,
  navegação, cores, filtro, podium, e2e autenticado visual,
  `test:e2e:missao-saude`, `test:e2e:neuroped-acompanhamento`,
  `audit:lighthouse`, `build:client`, `test:e2e:modo-facil`,
  `audit:built-pin`, `audit:offline-shell`, `check-baseline`) — **exit 0**,
  sem regressão de baseline (`[baseline] ✓ sem regressão`).
- Artefatos auto-gerados pela própria bateria (`client/public/sw-build.js`,
  `functions/api/_buildInfo.ts`, `scripts/guards/a11y-report.json`,
  `scripts/guards/lighthouse-report.json`) descartados após a execução —
  não representam mudança funcional.

## RODADA 2026-09-27 — SuperNeuroPad Game: guarda de toque duplo (base `main@574236b`)

Mandato do usuário: "evolução total sem regressões" do SuperNeuroPad Game.
Mapeamento (`client/src/pages/super-neuropad-game.tsx` +
`client/src/features/super-neuropad/{model,music,pdf}.ts`, 883+167+129 linhas,
18 testes unitários, 1 E2E de jornada completa) mostrou um motor já maduro
(oito PRs anteriores: #969/#974/#975/#977/#979/#980/#981/#984/#999) — sem
regressões estruturais óbvias, sem dead code, sem feature incompleta. A
fragilidade real encontrada: o motor compartilhado `EasyGame` (usado por
Sonda 10, OBS-10, Reconhecimento Visual e Testes Cognitivos) trava toque
duplo por `event.timeStamp` desde a PR #974 (`acceptManualTap`,
`client/src/components/jogo-facil/easyReport.ts`, 300 ms), mas o SuperNeuroPad
Game — motor bespoke que **reúne** esses quatro módulos numa jornada única —
nunca herdou essa trava: `TouchStage`/`JudgeStage` chamavam `pushAnswer`
direto do `onClick`. Toque duplo (~100–250 ms, comum em tablet) registrava o
mesmo desafio duas vezes com o `itemIndex` da renderização anterior e pulava
o desafio seguinte sem nenhum registro — sessão terminaria "incompleta" sem
explicação visível para a aplicadora.

| Item | Status | Evidência |
| ---- | ------ | --------- |
| Guarda de toque duplo no SuperNeuroPad Game | DONE | Reaproveita `acceptManualTap`/`MANUAL_TAP_MIN_GAP_MS` (já testado em `modo-facil.test.ts`) via novo `submitAnswer` na página; os três caminhos de registro (opção de toque, "não respondeu · pular", Acertou/Errou/Não respondeu) passam pela guarda; `lastAnswerAt` reseta em `startGame`/`restart`. |
| Teste antirregressão | DONE | `tests/unit/super-neuropad-game.test.ts`: nova asserção estática (mesmo padrão já usado em `modo-facil.test.ts` para o `EasyGame`) prova que os três call sites chamam `submitAnswer`, não `pushAnswer` direto, e que a guarda reseta no início/reinício. 18/18 testes verdes. |
| `tests/e2e/super-neuropad-game.mjs` atualizado | DONE | `pace()` (320 ms, mesmo padrão de `modo-facil.mjs`) antes de cada toque de resposta real, para o teste continuar determinístico sob a guarda nova — sem isso a jornada de 20 itens ficaria sujeita a perder registros por clique-em-sequência rápido do Playwright. |

Evidência local, réplica exata do workflow dedicado `super-neuropad.yml`:
`npm run check` (limpo), `npm run lint` (limpo — `--max-warnings=0`),
`npm run test:cognitive` (cognitive-lab + `test:sonda` + `test:direct-track`,
que inclui `test:super-neuropad` com os 18 casos), `npm run build:client` com
`VITE_AUTH_MODE=remote` e depois `VITE_AUTH_MODE=local`, `node
tests/e2e/super-neuropad-game.mjs` em ambos os modos (20/20 desafios, PDF
válido, zero violações `axe` em cada tela, zero erros de página) — todos
exit 0, executados individualmente nesta sessão (dependências reinstaladas
via `npm ci`, pois o container chegou sem `node_modules`).

Rollback: reverter o commit único (sem migração, sem mudança de schema/API).

## EM EXECUÇÃO

Nenhuma frente aberta neste momento; espiral SuperNeuroPad convergiu no
achado e correção acima.

## PRÓXIMA FRONTEIRA

- Escopo de CSS, parte 3: os `!important` de
  `visual-reset.css`/`premium-polish-10.css` sobre
  `button`/`input`/`select`/`textarea`/`[role=tab]` (item `#main-content
  button` global já resolvido na PR #999, ver seção acima), com prova visual
  completa (4 viewports, luz/escuro) antes de qualquer remoção — maior risco
  de regressão visual ampla se feito sem essa prova.
- Smoke de produção contra o deploy do commit `9b3a300` (ou posterior):
  **bloqueado nesta sessão** por política de rede do ambiente (proxy nega
  saída HTTPS para `neuroped.pages.dev`/`vercel.app`/`github.io`, 403 em
  todo host externo testado — ver
  `docs/audits/BLOCKED_EXTERNAL_smoke-producao.md`). Pendência real: rodar
  `npm run test:e2e:published-health` com `EXPECTED_COMMIT=9b3a300` fora
  deste ambiente antes de declarar a espiral concluída em produção.
