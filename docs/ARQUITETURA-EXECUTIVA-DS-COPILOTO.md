# Arquitetura Executiva — Design System Unificado + Copiloto Neuropediátrico

**Autor:** Dr. Jadson Fraga (direção) · engenharia assistida
**Data:** 2026-06-04 · **Status:** plano executivo (vinculado a `ds-recon.md` + `ARQUITETURA-CLINICA-V4.md`)
**Norte:** sair de "software médico" → **copiloto neuropediátrico** (Clinical Cognitive Infrastructure).

---

## 0. Correção estratégica (ler antes de tudo)

O prompt original pede "projetar o Design System e o Motor Clínico". A auditoria do repositório
diz outra coisa, e ignorá-la geraria **o pior débito possível: reconstruir o que já existe**.

| Premissa do prompt | Realidade no repo | Consequência |
|---|---|---|
| "Criar tokens" | `tokens.css` = **157 tokens canônicos** (cor, espaço, raio, sombra, tipografia, motion, z) | **Congelar, não criar** |
| "Criar Card/Button/Input/Modal/Badge/Table" | `components.css` = **`.np-*` já existem com todos os estados** | **Adotar, não criar** |
| "Criar motor de protocolos/intake" | `clinical-recommendation-pipeline.js`, `clinical-router.js`, `intake.html`, `NeuroPedCIL` | **Ativar/conectar, não criar** |
| Lacuna principal | **Adoção `.np-*` = 0 / 58 páginas** · clínica = inerte (gated) | O trabalho é **migração + ativação** |

> **Tese central:** o produto premium não nasce de mais CSS — nasce de **subtração** (matar
> camadas concorrentes) e **adoção** (uma só linguagem em todas as telas). Cada CSS novo que
> não seja `tokens.css`/`components.css` é débito por definição.

---

## FASE 0 — FOUNDATIONS (congelar + proibir)

Não há o que criar. Há o que **declarar canônico** e o que **proibir imediatamente**.

### Canônico (fonte única — qualquer outra coisa é exceção a ser extinta)
- **Tokens:** `tokens.css` (cor semântica, `--space-*`, `--radius-*`, `--shadow-*`, `--t-*` tipografia, `--motion-*`, `--z-*`, dark-first com tema claro opt-in).
- **Componentes:** `components.css` (`.np-card`, `.np-btn[--primary|secondary|ghost|danger]`, `.np-input/.np-select/.np-textarea`, `.np-badge[--status]`, `.np-modal`, `.np-table`, `.np-sidebar`, `.np-empty`, `.np-skeleton`, `.np-tooltip`, utilitários `.np-stack-*`, `.np-t-*`).
- **Auditoria:** `scripts/design-audit.mjs` (conta valores crus; `--strict` falha no CI).

### Proibido a partir de agora (congelamento duro — entra como guarda no `test-static.mjs`)
1. **Novos arquivos CSS de tema** (`*-premium.css`, `*-skin.css`, `ds-*.css`). `ds-tokens.css` (8 páginas) é **duplicata** do que `tokens.css` já faz → marcado para extinção.
2. **`:root` inline em páginas** com paleta própria (`--teal`, `--cream`, `--gold` cru). Hot pages: `filtro-escalas.html`, `escala.html`, bancos. `--teal` tem ~29 ocorrências.
3. **Valores crus** em arquivos novos (hex/rgb/px de espaçamento/sombra inline). Use token ou não faça.
4. **`premium-override.css`** (443 linhas — maior ofensor do audit): **frozen**. Nada novo entra; só sai.

### Entregável da Fase 0
- `docs/DESIGN-GOVERNANCE.md` (naming, ownership, regra "token-or-nothing").
- Guarda no `test-static.mjs`: nenhum HTML novo declara `:root{--teal…}`; nenhum CSS novo fora da allowlist.
- `design-audit.mjs --strict` no CI (orçamento de valores crus **decrescente** por onda).

---

## FASE 1 — ATOMIC SYSTEM + BRIDGE LAYER (compatibilidade híbrida)

Os átomos existem. Falta a **ponte** que deixa legado e novo coexistirem sem retrabalho.

### 1A. Bridge de variáveis (1 arquivo, reversível)
`ds-bridge.css` — mapeia variáveis legadas → tokens, para telas antigas herdarem a paleta nova
**sem reescrever HTML**:
```css
:root{
  --teal: var(--primary);
  --cream: var(--bg);
  --gold: var(--accent-gold);
  --wine: var(--text-strong);
  /* … todo o vocabulário legado aponta para o canônico */
}
```
Efeito: 1 inclusão por página → coerência cromática imediata em telas legadas, **antes** de qualquer
migração de markup. É a "Onda 0 perceptiva" — ganho visual com risco ~zero.

### 1B. Wrappers de transição
Para telas que ainda usam markup antigo, classes-ponte que herdam o look `.np-*` sem trocar a árvore
(`.card → aplica tokens de .np-card` via seletor escopado em `neuroped-shell.css`, já existente como
`data-ns-shell`). Reaproveitar `data-ns-shell` como **camada de ponte oficial**, não criar nova.

### 1C. Codemod assistido
Script `scripts/ds-migrate-page.mjs`: recebe 1 HTML, troca classes legadas conhecidas (`.btn→.np-btn`,
`.card→.np-card`), remove `:root` inline, injeta `ds-bridge.css`, e roda `design-audit` antes/depois
(diff de valores crus). Migração vira **operação de minutos por tela, auditável**.

---

## ONDAS DE MIGRAÇÃO (Wave Migration)

Princípio: cada onda **reduz** o orçamento de débito (`design-audit --strict`) e **mata** pelo menos
uma camada concorrente. "Pronto" = orçamento atingido **e** legado removido, não só "tela bonita".

### ONDA 1 — CRITICAL EXPERIENCE (percepção premium imediata)
Telas que o médico/secretária veem 80% do tempo. Maior impacto, menor risco.

| Tela | Arquivo | Ação |
|---|---|---|
| Home/dashboard | `index.html` (SPA) | adota `.np-*` no shell, mata override inline |
| Perfil do paciente | `perfil-crianca.html` | timeline/cards → `.np-card`/`TimelineCard` |
| Triagem | `filtro-escalas.html` | remove `:root{--teal}`, adota tokens + bridge |
| Intake | `intake.html` | já em tokens — vira **referência canônica** de tela "nova" |
| Trajetória | `clinical-trajetoria.html` | já em tokens — referência |
| Secretária | `secretaria.html` | `.np-table`/`.np-btn`, densidade operacional |

Saída: 6 telas-âncora 100% canônicas, servindo de **gabarito** para as demais.

### ONDA 2 — CLINICAL INTELLIGENCE (ativar o que está inerte)
O motor existe e está **gated por segurança** (`_status:'VALIDADO'`). Esta onda **conecta**, não inventa.

- **Card System clínico** derivado de `.np-card`: `ClinicalCard`, `MetricCard`, `TimelineCard`,
  `InsightCard`, `ActionCard`, `AIRecommendationCard` — todos com `evidence[]`+`confidence` visíveis
  (explicabilidade obrigatória, já no `clinical-explainability.js`).
- **Pipeline de protocolo:** `clinical-recommendation-pipeline.js` + `intake.html` → seleção de escalas
  por idade/queixa + destinatário (família/escola/terapeuta). **Já roda determinístico.**
- **Gate de segurança mantido:** sem `clinical-config` validada para um instrumento, o card mostra
  sinal bruto, **nunca** melhora/piora/fenótipo. (`PROIBIDO FABRICAR CLÍNICA`.)
- **Pendência clínica do Dr. Jadson** (bloqueia ativação plena, não inventável): cutoffs
  `npe-br-005/011`, traps ANY/ALL, fluxo sentinela, pesos de fenótipo.

### ONDA 3 — LONGITUDINAL EXPERIENCE
- Heatmap clínico + evolução temporal sobre `clinical-timeline-engine.js` (12 domínios canônicos).
- Resposta terapêutica (`response-engine.js`, stream `np:medlog` já separado das escalas).
- Relatório automático auditável (`clinical-pdf-auditable.js`) — laudo com proveniência.
- `VisualSchema.functionalRadar` já existe → vira `MetricCard`/`TimelineCard` no Card System.

### ONDA 4 — LEGACY DESTRUCTION (a onda que paga o investimento)
Critério de "zero legacy" mensurável:
- `ds-tokens.css`, `premium-override.css`, `app-skin.css` concorrente, `escalas-card-premium.css`,
  `:root` inline → **removidos** (ou reduzidos a bridge).
- `design-audit --strict` com orçamento de valores crus → **0 fora da allowlist**.
- `.np-*` adoption → de 0/58 para **≥ 95% das telas quentes**.
- `app-shell.html` (casca legada, já aposentada como start_url) → removido quando deep-links migrarem
  para overlay do SPA (`np-frame.js`).

---

## Matriz Impacto × Complexidade (priorização real)

```
ALTO IMPACTO
   │  [ds-bridge.css]        [Onda 1: home/perfil/triagem]
   │  (1 arquivo, ganho       [Card System clínico s/ .np-card]
   │   cromático global)      [Ativar pipeline intake→protocolo]
   │
   │  [design-audit --strict] [Onda 3: heatmap/timeline]
   │  [proibir :root inline]   [Relatório auditável]
   │
   │  [Codemod ds-migrate]    [Onda 4: legacy destruction]
   │                          [Migrar 68 telas uma a uma]
BAIXO IMPACTO ───────────────────────────────────────────► ALTA COMPLEXIDADE
```
**Ordem de execução ótima (ROI):** `ds-bridge.css` → guardas anti-débito → Onda 1 (6 âncoras) →
Card System clínico → ativar pipeline → Ondas 3/4. Cada passo é independente e reversível.

---

## Design Governance (prevenção de débito)

- **Naming:** componentes `.np-*` (canônico). Clínicos derivam por modificador, não por novo arquivo
  (`.np-card.np-card--clinical`, `.np-card--metric`). **Zero** prefixos novos (`ds-`, `sn-`, `j26-`).
- **Ownership:** `tokens.css` e `components.css` têm dono único; PR que os toca exige justificativa.
  Telas têm dono de migração; "âncoras" da Onda 1 são read-only após congelamento.
- **Debt prevention system:** `design-audit --strict` no CI com **orçamento decrescente**; `test-static`
  proíbe novos `:root` inline e novos CSS de tema fora da allowlist.
- **UX consistency auditing:** checklist por tela (usa só `.np-*`? só tokens? estados vazios/skeleton/
  motion canônicos? dark-first?), verificável por script.
- **Visual regression:** snapshot por tela-âncora (Playwright headless) — PR que muda token roda diff
  visual nas 6 âncoras antes de mergear.

---

## Critérios de "Copiloto" (resultado esperado, mensurável)

1. **Coerência:** 1 linguagem visual — `.np-*` ≥ 95% telas quentes, 0 paletas inline.
2. **Autonomia operacional:** secretária opera intake→protocolo→destinatário **sem saber nome de escala**
   (o motor escolhe; ela confirma).
3. **Carga cognitiva ↓:** toda recomendação é um `AIRecommendationCard` com "por quê?" (evidência+confiança).
4. **Densidade clínica premium:** timeline/heatmap/radar como cidadãos de primeira classe do Card System.
5. **Zero clínica fabricada:** todo juízo (melhora/piora/fenótipo) **gated** por config validada.

---

## Próximos 3 movimentos (executáveis já, sem decisão clínica pendente)

1. **`ds-bridge.css`** + incluir nas 6 âncoras → coerência cromática global, risco ~zero (1 PR).
2. **Guardas anti-débito** no `test-static.mjs` + `design-audit --strict` no CI (congela a fundação).
3. **Card System clínico** (`.np-card` → `ClinicalCard/MetricCard/TimelineCard/InsightCard/Action/AIRec`)
   aplicado em `perfil-crianca.html` + `clinical-trajetoria.html` (já em tokens — menor atrito).

> Tudo aditivo e reversível. Nada disso depende das pendências clínicas (cutoffs/fenótipo) — essas
> só liberam a **interpretação plena** da Onda 2, e continuam exigindo sua validação (`VALIDADO`).
