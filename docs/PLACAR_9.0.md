# PLACAR 9.0 — NeuroPed

> Gerado por `scripts/guards/scorecard.mjs`. A **NOTA** é o **menor** dos 6 eixos
> medidos. Eixos "não medido" ficam de fora da NOTA e devem ser instrumentados.
> Não falseamos números: cada célula vem de uma ferramenta ou relatório real.

## NOTA atual: **0.0** / 10

| Eixo | Nota | Detalhe |
|------|------|---------|
| D1 FUNÇÃO | 0.0 | 0/46 chamadas /api tratadas (wrapper=false) |
| D2 CÓDIGO | 0.0 | tsErrors=0 lintErrors=712 (warn=136) |
| D3 BUILD | 10.0 | maior chunk 180.0KB gzip |
| D4 A11Y | 10.0 | axe serious/critical=0 (static-lint) |
| D5 TESTE | 0.0 | 0 specs E2E |
| D6 CLÍNICO | 9.9 | 577/583 com fonte (99.0%) |

## Definição de Pronto (9.0 = todos os 6 colados no verde)

- **D1 FUNÇÃO** — 0 feature 404; toda `/api` responde ou a UI mostra "em implantação".
- **D2 CÓDIGO** — `npm run check`=0 e `npm run lint`=0 (bloqueantes no pr-check).
- **D3 BUILD/PERF** — build ✓; nenhum chunk inicial >500kB; Lighthouse ≥90.
- **D4 A11Y** — axe-core 0 serious/critical no CI.
- **D5 TESTE** — `npm run verify` verde + ≥5 E2E Playwright verdes.
- **D6 CLÍNICO** — proveniência ≥90% (≥500/565 com fonte verificável).

## Eixo mais fraco (próximo alvo do loop)

**D1** (nota 0.0) — atacar primeiro.
