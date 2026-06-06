# Proteção de branch & política de gates — NeuroPed

> Estado: **parcial**. Este doc é o contrato-alvo; itens marcados ⏳ ainda
> precisam ser ligados (ver "Roadmap" no fim). Faz parte da FASE 1 do
> PROMPT 9.0 (subconjunto seguro aplicado sem quebrar trabalho concorrente).

## Regra do `main`
- `main` só recebe via **Pull Request** + merge (nada de push direto).
- Merge só com **CI verde**.
- Recomendado no GitHub (Settings → Branches → branch protection rule):
  - ✅ Require a pull request before merging
  - ✅ Require status checks to pass before merging
  - ✅ Require branches to be up to date before merging
  - Checks obrigatórios: `test`, `integrity`, `design-audit`

## Gates que JÁ bloqueiam PR (workflow `test.yml` → `npm run verify`)
1. `check-no-conflicts` — sem marcadores de merge.
2. `check-version` — versão única (package.json = sw.js).
3. `check-contrast --strict` — contraste WCAG AA por matemática.
4. `check-theme --strict` — cascata tokens→palette-v2 em toda página.
5. `check-styles --strict` — anti-sprawl de sistemas de estilo (catraca ≤ teto).
6. `test-static` — checagens estáticas (atual: ~915 OK).
7. `smoke` — E2E leve (14).
8. `test-preconsulta-engine` — motor (48).
9. `run-clinical-tests` — suíte clínica (29 — **a ampliar, ver Fase 2**).
+ `design-audit --check` — valores crus não podem passar do baseline.

## Auditores que NÃO bloqueiam PR (apenas relatório)
- `audit-mp90.yml` roda em **cron semanal + dispatch** (não em PR). Mede
  **Lighthouse** (Perf/BP/SEO/A11y) e **axe-core** (a11y) contra produção.
- A partir da FASE 1, o `continue-on-error` foi **removido**: o relatório
  semanal agora fica **vermelho de verdade** se regredir (antes era sempre
  verde = teatro). Continua sem bloquear PR — vira gate de PR só na Fase 3/4
  (precisa de medição de piso e tem custo de tempo/flakiness).

## Catracas "não-piorar por PR" (⏳ a ligar quando o campo esfriar)
Objetivo: nenhum PR pode regredir os números-piso. Ainda **não ligadas** para
não quebrar a CI da sessão concorrente em voo. Quando ligar:
- design-audit não pode **aumentar** (piso = valor atual).
- nº de testes clínicos não pode **cair**.
- nenhum `.js` pode **crescer** acima do teto (≈1500 linhas; `scales-bundle.js`
  fica como dívida explícita a quitar na Fase 3).

## Roadmap até "9.0 de piso"
| Fase | Entrega | Vira gate? |
|---|---|---|
| 1 | catracas não-piorar + honestidade dos auditores | ⏳ catracas |
| 2 | suíte clínica 29→≥150 + validador de catálogo (229) | ✅ no verify |
| 3 | perf: split do bundle + Lighthouse ≥90 **em PR** | ⏳ PR-gate |
| 4 | a11y: axe 0 serious/critical **em PR** | ⏳ PR-gate |
| 5 | tokenização → `design-audit --strict` + ≤3 sistemas | ✅ no verify |

Nota final = **o menor** dos eixos (Processo, Clínico, Perf, A11y, Estrutura,
Segurança), medido no CI — nunca a média.
