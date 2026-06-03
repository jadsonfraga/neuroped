# NeuroPed EDJ — Design System

Implementação da spec **SUPERNEUROPED — UNIFICAÇÃO VISUAL TOTAL**.

## Estado atual (mapa por fase)

| Fase | Status | Onde |
|---|---|---|
| 1. Tokens | ✅ entregue | `tokens.css` |
| 2. Auditoria | ✅ ferramenta entregue | `scripts/design-audit.mjs` (rode com `node scripts/design-audit.mjs`) |
| 3. Componentes canônicos | ✅ entregues | `components.css` (`.np-*`) |
| 4. Migração tela a tela | ⏳ aberta — PRs subsequentes | use `node scripts/design-audit.mjs` para escolher lote |
| 5. Dark mode | ✅ pronto (data-theme + prefers-color-scheme) | `tokens.css` |
| 6. Polimento | parcial (`app-polish-mobile.*` já existe) | a consolidar com `components.css` |

## Regra permanente

**Qualquer tela ou recurso novo consome `tokens.css` + `components.css`.** Não pode introduzir:
- Cor hex/rgb fora dos tokens
- `px` que não seja múltiplo de 4 ou que não venha de `--space-*`
- Raio fora de `--radius-sm/md/lg/xl`
- Sombra fora de `--shadow-1/2/3`
- Tamanho de fonte fora de `--t-*`
- Easing/duração fora de `--motion-*`

CI: `node scripts/design-audit.mjs --strict` falha quando isso for ativado (não ativar até Fase 4 fechar).

## Como usar

### Carregamento

```html
<link rel="stylesheet" href="./tokens.css">
<link rel="stylesheet" href="./components.css">
```

53 das 55 páginas HTML já carregam ambos.

### Tokens (resumo)

- **Espaço:** `--space-1` (4px) → `--space-16` (64px)
- **Raio:** `--radius-sm` (8) `--radius-md` (12) `--radius-lg` (16) `--radius-xl` (24)
- **Sombra:** `--shadow-1` `--shadow-2` `--shadow-3`
- **Cor:** `--bg --surface --surface-muted --border --text-strong --text --text-muted --primary --primary-hover --primary-press --primary-tint --accent-violet --accent-teal --success --warning --danger` + tints
- **Tipo:** `--t-display --t-h1 --t-h2 --t-body --t-label --t-mono` (size/lh separados) + `--weight-regular/medium/semibold`
- **Motion:** `--motion-fast` (120) `--motion-base` (200) `--motion-slow` (320) + `--motion-ease`

### Componentes (resumo)

| Classe | O que é |
|---|---|
| `.np-card` | Card padrão (hover → eleva) |
| `.np-btn`, `.np-btn--primary/secondary/ghost/danger` | Botão 44px com loading + disabled |
| `.np-input`, `.np-select`, `.np-textarea` | Inputs 44px com focus ring + aria-invalid |
| `.np-badge`, `.np-badge--primary/success/warning/danger` | Badge de status |
| `.np-modal-backdrop` + `.np-modal` | Modal com scale animation |
| `.np-table` | Tabela canônica (linha 52px, hover sutil, sem zebra) |
| `.np-sidebar` + `.np-sidebar-group` | Navegação lateral com `aria-current="page"` |
| `.np-empty` | Empty state com ícone+título+desc |
| `.np-skeleton` | Skeleton loader (anula em reduced-motion) |
| `.np-tooltip` | Tooltip |
| `.np-t-display/h1/h2/body/label/mono` | Tipografia utilitária |
| `.np-container`, `.np-stack-N`, `.np-row` | Layout utilitário |
| `.np-sr-only` | Texto só para leitor de tela |

## Dark mode

```html
<html data-theme="dark">   <!-- forçado dark -->
<html data-theme="light">  <!-- forçado light -->
<html>                      <!-- auto via prefers-color-scheme -->
```

Tokens viram dark sem CSS paralelo. Componentes herdam.

## Auditoria (Fase 2)

```sh
node scripts/design-audit.mjs            # resumo, top 25 com mais valores crus
node scripts/design-audit.mjs --json     # estruturado para CI
node scripts/design-audit.mjs --strict   # falha se houver pendência (não ativar ainda)
```

Use o resumo para escolher o próximo lote da Fase 4.

## Migração (Fase 4)

Plano sugerido — não fazer tudo num PR:

1. **Lote A — telas-referência** (Seção 2 da spec): `escalas.html`, `banco-escalas.html`, `instrumento.html`, `consulta.html` (cards de resumo)
2. **Lote B — banco-escalas-lote{1..5}**: hoje cada uma tem ~162 hits crus (~18 hex + 99px + 12 radius). Substituir CSS inline por classes `.np-*`.
3. **Lote C — portal família + secretaria + agenda**
4. **Lote D — auxiliares** (`verificar-app`, `central-atalhos`, `acessibilidade`, etc.)
5. **Lote E — limpeza** de `design-system-premium.css`, `editorial-impact.css`, `premium-override.css`, `neuroped-shell.css`, `np-cards.css` redundantes

Cada lote: substituir CSS inline → classes `.np-*`, rodar `design-audit.mjs` antes/depois para mostrar que o número caiu, abrir PR pequeno.

## Critérios de aceite (Seção 8 da spec)

| Item | Status |
|---|---|
| Tokens existem e cobrem cor/espaço/raio/sombra/tipo/motion | ✅ |
| Componentes repetidos com 1 implementação | ✅ em `components.css`; Fase 4 remove duplicação nas páginas |
| Estados (hover, pressed, focus, loading, disabled, error, empty) | ✅ todos definidos |
| Touch target ≥ 44px | ✅ `--tap-min` em `.np-btn`, `.np-input`, sidebar |
| Contraste AA light + dark | ✅ paleta validada na spec |
| Dark mode = troca de tokens (sem CSS paralelo) | ✅ |
| Tela nova herda sistema sem CSS adicional | ✅ basta usar `.np-*` |
| Navegação por 10 rotas: zero quebra | ⏳ depende da Fase 4 |

## Não esqueça

- A spec disse **"não avançar de fase com pendências da anterior"** — não ativar `--strict` antes da Fase 4 estar concluída.
- A spec disse **"introduzir estilo novo fora do design system é regressão e deve ser tratado como bug"** — qualquer PR daqui pra frente que adicione hex cru em CSS inline deve ser bloqueado em code review.
