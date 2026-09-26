# Testes Cognitivos por Faixa Etária 1–19 anos e Reconhecimento Visual até 19 anos

Data: 2026-09-26 · Escopo: avaliação direta (Modo Fácil, guiado e direto).

## O que mudou

- `client/src/features/cognitive-age/bank.ts` (novo): banco único dos Testes
  Cognitivos, um perfil por idade de 1 a 19 anos, quatro domínios
  (reconhecimento visual; fala/leitura; letras/escrita; números/aritmética),
  quatro itens por domínio, 304 itens. Três tipos de item, todos resolvidos
  dentro do aplicativo: `tap` (a criança toca, a tela confere), `build` (a
  criança monta a palavra com peças de letras, a tela confere; cópia quando a
  palavra fica visível, ditado quando não) e `say` (a criança nomeia, lê em voz
  alta ou conta; o adulto compara com a resposta esperada escrita ao lado).
- `client/src/features/cognitive-age/screens.tsx` (novo): telas dos itens e a
  tela da criança do Modo Fácil (com "Voltar ao aplicador"). Sem timers, sem
  certo/errado visível à criança.
- `client/src/pages/testes-cognitivos-faixa-etaria.tsx`: os bancos antigos
  (bandas 2–19 com blocos de observação que pediam lápis e papel, e perfis
  6–13) foram extintos; as três trilhas consomem o banco novo. O Modo Fácil
  passa a usar o motor compartilhado `EasyGame` (mesmo fluxo da Sonda Dez, do
  OBS-10 e do Reconhecimento Visual): idade, Começar, um passo por vez,
  Acertou / Não acertou / Pular, resultado descritivo copiável.
- Reconhecimento Visual (`features/visual-recognition/model.ts`,
  `Workspace.tsx`): idade máxima passa de 17 anos e 11 meses para 19 anos e 11
  meses (faixa `156-239`, "13–19 anos"). O Modo Fácil ganha
  `easyPlanSettings(age)`: menos de 2 anos = 8 figuras e 2 alternativas de
  categorias familiares; 2–3 anos = 10 figuras e 2 alternativas; 4–6 anos = 12
  figuras e 3 alternativas; 7 anos ou mais = 12 figuras, 4 alternativas da
  mesma categoria. A dica do adulto declara a figura esperada.
- Sonda Dez e OBS-10: não alterados.

## Verdade clínica

Questionário interno autoral, registrado item a item. Sem escore, percentil,
idade equivalente, ponto de corte ou equivalência a instrumento licenciado.
Estrelas e herói continuam sendo participação. O registro exportado declara
"NÃO É ESCORE, PERCENTIL, IDADE EQUIVALENTE NEM DIAGNÓSTICO".

## Testes

- `tests/unit/cognitive-age-bank.test.ts` (substitui `cognitive-age-banks.test.ts`;
  em `npm run test:direct-track` e `npm run test:cognitive`): 19 × 4 × 4 itens,
  ids únicos, alternativas distintas com a resposta entre elas, peças de letras
  contendo a palavra e nunca já na ordem, nenhum item pedindo lápis, papel,
  brinquedo ou objeto de fora, gradação por idade (1–2 anos só toque gigante ou
  fala; alfabeto em 3–7; leitura em voz alta e texto na tela a partir dos 6;
  aritmética sobe de quantidade a porcentagem/equação).
- `tests/unit/modo-facil.test.ts`: integração do motor compartilhado na página
  cognitiva e pureza da tela da criança.
- `tests/unit/visual-recognition.test.ts`: limites 216 e 239 meses.
- `tests/e2e/modo-facil.mjs`: joga o Modo Fácil cognitivo com 6 anos (toque
  automático da criança + 15 passos marcados) e a montagem de ESCOLA com 8 anos.

## Rollback

Reverter o commit. Nenhuma migração ou dado persistido envolvido.
