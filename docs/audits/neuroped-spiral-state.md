# NeuroPed — estado da espiral de convergência

Memória compacta entre sessões. Só fatos verificados na máquina; sem diário.
Branch de trabalho: `claude/modo-computador-game-tab-vo6xvc`; uma PR em voo por vez,
reiniciada a partir da main mesclada a cada merge (squash), com os commits seguintes
reaplicados por cherry-pick e re-verificados.

## VALIDADO

- Baseline (main + Super NeuroPad Game, #969): check, lint, test:cognitive, test:sonda,
  test:direct-track, test:clinical, build:client, E2E de navegação e do jogo — exit 0.
- Motor compartilhado (`EasyGame`, #974 mergeada): trava de toque duplo por carimbo de
  evento, transição neutra em todo registro automático, entrega neutra no fim, dica/título
  do aplicador ocultos com a tela da criança aberta.
- Testes Cognitivos (#975 mergeada): ditado sem a palavra na tela/fala; GA_O com resposta
  única; títulos de fala identificam o estímulo; idade só aceita dígitos.
- Banco cognitivo: 304 itens = 19×4×4; Reconhecimento Visual: 89 itens, 58 SVGs presentes,
  faixas 12–239 meses contíguas; OBS-10: nomes de estação derivam de uma fonte única.

## FALHAS REPRODUZIDAS E CORRIGIDAS

- Espiral 1 (motor): toque duplo do adulto/da criança registrava passo extra; resultado
  com contagem aparecia no aparelho da criança; toque duplo em Próximo respondia pelo item
  seguinte; dica do aplicador visível com a tela da criança aberta.
- Espiral 2 (Cognitivos): ditado mostrava a palavra à criança; GA_O aceitava D/L (GADO/GALO);
  itens de fala idênticos no registro; idade "1.5"→15.
- Espiral 3 (OBS-10, PR #977 em CI): rascunho de omissão virava descrição da estação
  aplicada; estação omitida anunciada "concluída"; resumo do tablet dizia "tarefa" e não
  distinguia estação não alcançada de não registrada; `proneAllowed` persistia após trocar
  de faixa; nome de estação guiada era input editável (TXT/dossiê divergiam).
- Espiral 4 (Reconhecimento Visual, local, aguardando #977 mergear): "Mesma categoria" sem
  distrator não iniciava aos 12–23 meses; "categorias distintas" não era priorizado;
  Modo Fácil prometia 8 figuras aos 12–23 meses, só existem 7.
- Espiral 5 (Sonda, local): Voltar do navegador para /login com sessão ainda válida não
  disparava o prompt de saída (a própria página de login devolvia o profissional sozinha,
  perdendo o registro em curso). `leavesSondaRoute` agora recebe `sessionInvalid` real.
- Espiral 6 (CSS, local): `.obs10 button`/`.rv-workspace button` (especificidade 0,1,1)
  vencia as classes Tailwind do motor compartilhado (0,1,0): botão e título do passo
  mudavam de cor/peso/raio conforme a página. Escopado com `:where()`; medido antes/depois
  no build real (Sonda vs. OBS-10 convergem). `audit:design`/`contrast`/`tailwind-opacity`
  verdes.

## RISCOS

- `EasyGame` é consumido por Sonda 10, OBS-10, Reconhecimento Visual e Testes Cognitivos:
  qualquer mudança exige a matriz cruzada (`tests/e2e/modo-facil.mjs` + e2e de cada app).
- Cadência: o motor ignora um segundo toque em < 300 ms (`event.timeStamp`).
- `tests/e2e/sonda-dez-digital.mjs` tem uma asserção de "Tempo ativo: Ns" sensível a tempo
  real (flake conhecido, não corrigido).
- Restam seletores globais com `!important` fora do escopo desta espiral (`visual-reset.css`,
  `premium-polish-10.css`, `premium-app-shell-v12.css`) e o `#main-content button:not([data-size="icon"])`
  que fixa `min-height:44px` sobre todo `min-h-*`; não tocados nesta rodada por prudência de
  escopo (afetariam todo o app, não só as quatro aplicações auditadas).

## EM EXECUÇÃO

- PR #977 (OBS-10) em CI. Fila local, cada commit já verificado sozinho e em conjunto:
  Reconhecimento Visual → Sonda (exit-guard) → CSS (:where scoping).

## PRÓXIMA FRONTEIRA

- Após a fila local esvaziar: reaudita geral (bateria final — check, lint, test:patient-safety,
  test:auth-bootstrap, test:clinical, test:direct-track, test:cognitive, test:sonda, audit:a11y,
  audit:design, audit:contrast, build:client, verify:release) e smoke de produção pós-deploy.
- Se sobrar tempo: o `#main-content button` global e os `!important` de `visual-reset.css`,
  com prova visual completa nos quatro viewports antes de qualquer remoção.
