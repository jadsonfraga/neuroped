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

## RISCOS CONHECIDOS (não corrigidos nesta espiral, por prudência de escopo)

- `#main-content button:not([data-size="icon"]) {min-height:44px}`
  (`premium-app-shell-v12.css` e duplicata em `premium-polish-10.css`,
  especificidade 1,1,1) anula todo `min-h-*` de botão no app inteiro,
  incluindo os alvos "gigantes" do Modo Fácil (96/80/56/128px medidos como
  44px reais). Corrigir exige tocar um seletor global fora do escopo das
  quatro aplicações auditadas; requer prova visual nos quatro viewports em
  toda a superfície do app antes de mudar.
- `visual-reset.css`/`premium-polish-10.css` têm vários seletores globais com
  `!important` sobre `button`/`input`/`select`/`textarea`/`[role=tab]`; não
  auditados individualmente nesta espiral.
- `tests/e2e/sonda-dez-digital.mjs` tem uma asserção de "Tempo ativo: Ns"
  sensível a tempo real (flake conhecido, observado uma vez, não corrigido).
- Cadência: o motor ignora um segundo toque em < 300 ms (`event.timeStamp`);
  qualquer novo E2E que toque em sequência imediata precisa espaçar toques.

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

## EM EXECUÇÃO

Nenhuma frente aberta neste momento; espiral convergiu nas oito PRs acima e
na bateria final de checkpoints.

## PRÓXIMA FRONTEIRA

- Escopo de CSS, parte 2: `#main-content button` global e os `!important` de
  `visual-reset.css`/`premium-polish-10.css`, com prova visual completa (4
  viewports, luz/escuro) antes de qualquer remoção — maior risco de regressão
  visual ampla se feito sem essa prova.
- Smoke de produção contra o deploy do commit `9b3a300` (ou posterior):
  **bloqueado nesta sessão** por política de rede do ambiente (proxy nega
  saída HTTPS para `neuroped.pages.dev`/`vercel.app`/`github.io`, 403 em
  todo host externo testado — ver
  `docs/audits/BLOCKED_EXTERNAL_smoke-producao.md`). Pendência real: rodar
  `npm run test:e2e:published-health` com `EXPECTED_COMMIT=9b3a300` fora
  deste ambiente antes de declarar a espiral concluída em produção.
