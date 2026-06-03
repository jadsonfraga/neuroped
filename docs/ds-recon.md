# Design System — Reconhecimento (DS Recon)

**Data:** 2026-06-03 · **Status:** Fundação + componentes JÁ EXISTEM; gap é adoção (migração).

Este documento é o resultado da **auditoria** (Fase 1) antes de qualquer mudança visual.
Conclusão central — sustentada por evidência abaixo: **não criar um DS paralelo `ds-*`**;
o DS canônico já existe (spec SUPERNEUROPED). O trabalho real é **ponte de variáveis
legadas + migração tela a tela**.

---

## 1. O que JÁ existe (canônico)

| Camada | Arquivo | Papel | Status |
|---|---|---|---|
| **Tokens** (Fase 1) | `tokens.css` | Fonte única de cor, espaço, raio, sombra, tipografia, movimento, z-index + tema claro opt-in | ✅ canônico |
| **Componentes** (Fase 3) | `components.css` | `.np-card`, `.np-btn`(+primary/secondary/ghost/danger), `.np-input/.np-select/.np-textarea`, `.np-badge`(+status), `.np-modal`, `.np-table`, `.np-sidebar`, `.np-empty`, `.np-skeleton`, `.np-tooltip`, utils | ✅ canônico, opt-in `.np-*` |
| **Auditoria** | `scripts/design-audit.mjs` | Conta valores crus (hex/rgb/px/shadow/radius) por arquivo; `--strict` falha no CI | ✅ existe |

> Ou seja, **os 6 componentes pedidos (card, button, input, badge, modal, table) já são canônicos** em `components.css` como classes `.np-*`, consumindo apenas tokens, com todos os estados e prefixo anti-colisão. Criar `ds-components.css` duplicaria o DS — anti-padrão.

## 2. Evidência da lacuna real (adoção = 0%)

- **54** páginas `.html` já carregam `components.css`.
- **0** páginas usam classes `.np-*`.
- → O DS está **distribuído em todo lugar e adotado em lugar nenhum**. O gap é **Fase 4 (migração)**, não fundação.

## 3. Fontes de fragmentação (o que combate o DS hoje)

**Camadas CSS concorrentes/legadas** (px/cor crus, sombras inline):
`premium-override.css` (~16 KB, maior ofensor no audit), `app-skin.css` (~12 KB),
`neuroped-shell.css` (~11 KB), `design-system-premium.css`, `editorial-impact.css`,
`scales-ui-premium.css`.

**Paleta inline legada** (definida em `:root` dentro do `<style>` de páginas quentes —
`filtro-escalas.html`, `escala.html`, bancos), fora do vocabulário dos tokens:

| Legado (inline) | Ocorrências aprox. | Canônico equivalente |
|---|---|---|
| `--teal` | 29 | `--primary` / `--primary-light` |
| `--line2` | 27 | `--border-strong` |
| `--gold` | 24 | `--accent-gold` |
| `--line` | 18 | `--border` |
| `--wine` | 16 | `--accent-gold` (cream/realce de título) |
| `--muted` | 15 | `--text-muted` |
| `--ink` | 12 | `--text-strong` |
| `--soft-ink` / `--soft` | ~20 | `--text-soft` |
| `--glass` / `--glass2` | ~19 | `--surface-glass` / `--surface-muted` |
| `--indigo` | 8 | `--primary-deep` |
| `--gold2` | 6 | `--accent-gold-dark` |
| `--ok` | 5 | `--success` |
| `--bg2` | 4 | `--bg-2` |
| `--blue` | 2 | `--info` |

Essas páginas **redefinem** esses nomes inline; por isso adotar `.np-*` nelas exige um
**mapa de equivalência** (a ponte) para não depender dos nomes legados.

## 4. Decisão (o que fazer — e o que NÃO fazer)

**NÃO:**
- ❌ Criar `ds-tokens.css`/`ds-components.css` que **dupliquem** valores de `tokens.css`/`.np-*`.
- ❌ Migrar 60 páginas em lote (sem verificação visual disponível neste ambiente → risco alto).
- ❌ Tocar as camadas globais enquanto sessões paralelas as editam (risco de conflito).

**SIM (entregue neste PR):**
1. **`ds-tokens.css`** — camada fina **aditiva**: aliases semânticos `--ds-*` → tokens canônicos
   **+ ponte de variáveis legadas** (`--teal`, `--ink`, `--wine`, `--gold`, `--line`, … →
   tokens). Não redefine valores; só fornece os nomes legados a páginas que ainda não os
   têm, habilitando adoção do `.np-*`. Totalmente reversível (1 arquivo).
2. **`ds-pilot.html`** — **tela de referência ponta a ponta** construída 100% sobre
   `tokens.css` + `components.css` (`.np-*`) + a ponte. É o **modelo validado** para migrar
   o restante. Aditiva (arquivo novo; não altera nenhuma página de produção) → risco mínimo.

## 5. Próximos passos (Fase 4 — após sua revisão visual do piloto)

1. Abrir `ds-pilot.html` no navegador e validar visualmente (não tenho browser aqui).
2. Escolher a 1ª **página de produção** a migrar (sugestão: interna/baixo tráfego primeiro —
   ex.: `qualidade-neuroped.html`, `verificar-app.html`), trocando estilos bespoke por `.np-*`.
3. Integração global da ponte: quando as sessões paralelas estabilizarem, adicionar
   `ds-tokens.css` à cadeia global (via `<link>` nas páginas ou `@import` no topo de
   `tokens.css`) — fora deste PR para evitar conflito.
4. Reduzir os maiores ofensores do `design-audit.mjs` (`premium-override.css`, páginas quentes)
   migrando para tokens; só então ligar `--strict` no CI.

## 6. Como reverter

Reversível por arquivo: remover `ds-tokens.css` e `ds-pilot.html` (e a entrada no precache do
`sw.js`). Nenhuma página de produção foi alterada neste PR.
