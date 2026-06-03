# Auditoria das Escalas — NeuroPed EDJ (2026-06)

Auditoria de **funcionamento** e **conteúdo** do sistema de escalas/instrumentos.
Método: carga de todos os bundles num harness Node (stub de `window`/`document`),
reconstrução do catálogo consumido e inspeção de dados + lógica do motor de laudo.

## Resumo executivo

| Dimensão | Situação |
|---|---|
| Sintaxe dos bundles | ✅ OK (`node --check`) |
| Catálogo final consumido | ✅ **410 escalas, 0 IDs duplicados** |
| Deduplicação na fusão | ✅ Funciona (merges com `filter(!ids.has(id))`) |
| Integridade dos respondíveis (12 NPE) | ✅ 0 sem opções, 0 itens vazios, índices de subdomínio válidos, contagens batem |
| Conformidade legal (escalas oficiais) | ✅ Catalogadas, não reproduzidas item a item |
| Interpretação por `cutoffs` autorais | ⚠️ Motor usava só % do máximo → **corrigido (aditivo)** |
| Sinais de segurança (`traps`/`gate`/`sentinel`) | ⚠️ Não disparavam → `traps`/`gate` **corrigidos**; `sentinel` **pendente de autor** |

## Arquitetura (resumo)

- **Fontes**: `scales-editorial.js`, `scales-bundle.js` (agregador + motor), `scales-autorais-npe.js` (+ lote2), `scales-oficiais.js` (+ lote2), `scales-featured-10.js`/`-extra`, `scales-priority-uploaded.js`, `scales-global-max.js`, `scales-impacto-medicacao.js`; índice `scales-index.json`; banco inline `banco-escalas-lote[1-5].html`.
- **Agregação**: cada bundle faz merge em `window.NEUROPED_EDITORIAL_SCALES` deduplicando por `id`. `scales-curate.js` roda por último (dedup adicional de geradas por `domínio|faixa|público`).
- **Motor de laudo**: `scales-enhance.js` (também embutido em `scales-bundle.js`) → `domainScores()`, `totalScore()`, `tipFor()`, `laudoText()`, `printResult()`, `showResultOverlay()` (overlay `#npResultOverlay` / `#npResultContent`).
- **Resposta**: `escala.html?id=<id>` normaliza a escala (domínio único para NPE; chaves `0-ii`) e expõe `window.scales`/`window.activeId`/`window.answers`.
- **Recomendador**: `scale-recommender.js` (score por idade/queixa/finalidade/informantes/peso documental).

## Achados de funcionamento

### 1. Interpretação ignorava os `cutoffs` autorais (corrigido, aditivo)
`tipFor()` classificava só por **% do escore máximo** (<25% baixa … >75% muito elevada), sem usar os `cutoffs` calibrados de cada escala. O próprio laudo já declarava isso ("faixa baseada em % … não substitui cutoffs originais").

### 2. Sinais de segurança não disparavam (corrigido p/ `traps`/`gate`)
`traps` (20 escalas), `gate_message` (1) e `sentinel` (2) estavam definidos nos dados mas **nenhum era avaliado**. Exemplo crítico: a trava *"PERDA DE HABILIDADES (regressão): avaliação prioritária independentemente do total"* (npe-br-002) nunca aparecia, mesmo com o item de regressão no máximo e total baixo.

**Correção:** novo módulo `scales-clinical-signals.js` — **aditivo e à prova de falhas** — lê `cutoffs`/`traps`/`gate_message` do catálogo e injeta, no resultado, um painel "Interpretação calibrada" + "⚠ Sinais de atenção", com disclaimer e sem fechar diagnóstico. Não altera o motor/bundle gerado. Função pura `window.NeuroPedClinicalSignals.evaluate(scale, answers)` validada por 8 testes unitários contra dados reais (inclui o caso regressão-isolada).

> **Semântica das travas** assumida: dispara se **qualquer** item do `idx` ≥ `min` (alinhado ao `gate_message.anyItem`). **A confirmar com o autor clínico** (poderia ser "todos").

### 3. Menores
- `scales-impacto-medicacao.js`: concat em `NEUROPED_EDITORIAL_SCALES` sem dedup por id → **corrigido no fonte** (padrão dos demais merges). Sem colisão real hoje; a cópia no bundle gerado herdaria via rebuild.

## Achados de conteúdo

- ✅ Sem mismatch "N itens" × real; sem itens vazios; subdomínios (`subs.idx`) dentro do range.
- ✅ 12 instrumentos respondíveis (NPE autorais) com `options` completas; `items === plain_questions` (renderização e índices de scoring coerentes).
- ⚠️ **`npe-br-005` (SERA-10)** e **`npe-br-011` (DLEG-12)**: sem `cutoffs`. **Não foram preenchidos**: definir limiares clínicos é decisão do autor. `npe-br-005` ainda carrega um **`sentinel` de risco de autolesão/suicídio** com roteamento próprio — requer implementação dedicada e revisão clínica (não improvisar).

## Pendências para o autor clínico (Dr. Jadson)
1. Confirmar semântica das `traps` (qualquer × todos os itens do `idx`).
2. Definir `cutoffs` de `npe-br-005` e `npe-br-011` (ou confirmar que ficam só na faixa %).
3. Especificar o fluxo do `sentinel` de risco (npe-br-005) para implementação segura.
4. Avaliar regenerar `scales-bundle.js` para o motor embutido também passar a consumir `cutoffs`/`traps` (hoje suprido pela camada `scales-clinical-signals.js`).

## Itens verificados que NÃO eram problema
- 58 "IDs duplicados" entre globais-fonte → **deduplicados na fusão**; catálogo final tem 0 duplicados.
- Imagens sem `alt`: 0 · viewport/title ausentes: 0 · links/refs quebrados: 0.
