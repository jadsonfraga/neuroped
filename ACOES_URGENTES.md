# ✅ AÇÕES URGENTES — RESOLVIDAS E TRAVADAS CONTRA REGRESSÃO

Data da verificação: reconciliação de ciclo SaaS (head verificado: `8a22933`).

## PROBLEMA #1: Filtro aparece "lá embaixo" no `/filtro`

**Status: RESOLVIDO NO CÓDIGO.**

O WelcomeTour (`client/src/components/WelcomeTour.tsx`) é renderizado como
overlay `fixed inset-0 z-[99998]` com backdrop e spotlight — ele nunca ocupa o
fluxo de layout do documento, portanto não empurra o conteúdo do filtro para
baixo. O `role="dialog"` e `aria-modal="true"` estão presentes.

**Trava anti-regressão:** `tests/unit/filtro-first-paint-regression.test.mjs`
exige overlay `fixed`, `role="dialog"`, `aria-modal="true"` e veta
`position: static/relative` no componente. Executa em `npm run test:hardening-regressions`.

## PROBLEMA #2: Emojis das queixas não renderizam

**Status: RESOLVIDO NO CÓDIGO.**

Os chips de queixa em `client/src/pages/filtro-engine.tsx` renderizam
`{q.emoji && <span aria-hidden="true">{q.emoji}</span>}` — o emoji presente nos
dados sempre é renderizado, com `aria-hidden` para não poluir leitores de tela.
Nenhum seletor CSS oculta classes de emoji.

**Trava anti-regressão:** o mesmo teste exige o span de emoji por queixa e veta
seletores `[class*="emoji"]` e `display: none` no filtro.

## Como reproduzir a verificação

```bash
npm run test:hardening-regressions
```
