# NEUROPED — PLANO CIENTÍFICO DE ELEVAÇÃO 7,0 → 9,0

**Repo:** github.com/jadsonfraga/neuroped · **Prod:** jadsonfraga.github.io/neuroped (Pages on push→main)
**Nota neutra auditada: 7,0/10.** Meta: **9,0** (+2,0). Cada ponto é rastreável a uma
evidência medida por `scripts/audit-report.mjs` (`npm run audit`). Nada de polimento sem métrica.

## REGRA DO MÉTODO
Toda mudança precisa: (a) reduzir um déficit MEDIDO, (b) passar o gate, (c) ser verificável.
Se não move uma métrica do scorecard, não entra. PRs pequenos e temáticos.

## GATE OBRIGATÓRIO (antes de todo PR)
```
npm run verify   # no-conflicts + check-version + test-static(836) + smoke(14) + motor(48) + clínico(29/29)
node scripts/design-audit.mjs --check   # não pode subir do baseline (atual 8388)
npm run audit    # scorecard 7→9 (informativo)
```
CI por PR: test · design-audit · clinical-tests(integrity) · lighthouse. Só mergeie verde.

## RESTRIÇÕES ABSOLUTAS
- NÃO alterar a regra de ouro do filtro (pódio 1–3 + teste direto + escola).
- NÃO tocar `clinical-*.js` (V3.2) sem rodar a suíte antes/depois.
- Sem cor crua em CSS de feature (use tokens) · sem `!important` (exceto reset) ·
  sem emoji em UI clínica formal · sem marcador de conflito (guard no CI).
- Não regredir fixes · não subir baseline do design-audit.

---

## WORKSTREAM 1 — COMPLETUDE FUNCIONAL  (5,5 → 8,5 · **+0,8**)  [precisa de backend]
**Déficit medido:** SPA chama endpoints inexistentes (`npm run audit` → "API órfãos").
Hoje: `/api/patients`, `/api/portal/diary`, `/api/portal/messages`, `/api/results`,
`/api/certificado(+/salvar)`, `/api/laudo/salvar`, `/api/send-report` → 404 em produção.
**Tarefa:** implementar em `functions/api/` (padrão `submissions.ts`/`verify.js` + D1/Supabase)
os de valor real; **desabilitar graciosamente** (estado vazio honesto, sem botão→404) o resto.
**Aceite:** scorecard "API órfãos" = 0. Teste em `functions/` por endpoint (200 + 401/403).

## WORKSTREAM 2 — CONSOLIDAÇÃO VISUAL  (6,0 → 8,5 · **+0,6**)  [parcial sem browser]
**Déficit medido:** 8 sistemas de estilo coexistem; skin nova em ~7% das páginas.
**Tarefa:** (1) fonte única = `np-tokens`(+`tokens` ponte); deprecar `ds-tokens`/
`premium-override`/`design-system-premium` migrando a tokens (catraca o baseline p/ baixo).
(2) rollout `np-skin`+`np-theme` a todas as telas de conteúdo (uma leva/PR, conferida no browser).
(3) home/SPA premium no FONTE da SPA (tokens + hero + `.np-stage` + `data-theme`).
**Aceite:** scorecard "sistemas de estilo" ≤3 · "cobertura skin" ≥60% · home com tokens.

## WORKSTREAM 3 — HIGIENE DE PRODUÇÃO  (**+0,3**)
**Déficit medido:** `console.log/.debug` em prod (hoje ~1, fallback) · "assinatura" de PDF
client-side (segredo no bundle = teatro). **Tarefa:** manter 0 `console.log` (gate no test-static);
mover `signatureSecret` p/ env do servidor + assinar via `functions/api/sign`; no cliente,
rotular como "hash de integridade local", não "assinatura". **Aceite:** 0 console.log · 0 segredo no bundle.

## WORKSTREAM 4 — VERIFICAÇÃO REAL  (**+0,3**)  [precisa de browser]
Lighthouse mobile ≥90 (meta 95) em index/filtro/3 hubs (LCP≤2,0s·CLS≤0,02·TBT≤150ms) ·
auditoria de leitor de tela (NVDA/VoiceOver) · validação clínica `QA_FILTRO_10.md` (≥13/15).

## WORKSTREAM 5 — CONFIABILIDADE / PROCESSO  (6,0 → 7,5 · **+0,2**)
Proteção de branch exigindo os 4 checks verdes · smoke pós-deploy (curl no Pages valida
versão/sw íntegros). Guard anti-conflito já existe.

---

## ALOCAÇÃO (rastreável pelo scorecard)
| WS | De→Para | Ganho | Depende de |
|---|---|---|---|
| 1 endpoints | 5,5→8,5 | +0,8 | backend |
| 2 visual+home | 6,0→8,5 | +0,6 | browser (parcial) |
| 3 higiene | — | +0,3 | — |
| 4 verificação | — | +0,3 | browser |
| 5 processo | 6,0→7,5 | +0,2 | — |
| **Total** | **7,0→~9,0** | **+2,0** | |

## ORDEM (maior alavanca que não trava primeiro)
audit-report (medir) → WS1 (endpoints, se houver backend) → WS2.2 (rollout skin) →
WS4 (verificação) → WS2.1/2.3 (consolidação+home) → WS3.2 (assinatura) → WS5.

## "9,0 ATINGIDO"
0 API órfão · 0 console.log · ≤3 sistemas de estilo · home com tokens · Lighthouse ≥90 ·
QA clínico ≥13/15 · gate 100% verde · e "parece um sistema único e confiável, não montado" = sim.
