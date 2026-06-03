# Auditoria de Design System — SUPERNEUROPED

> Fase 2 do plano de execução (Seção 7). Inventário determinístico do estado
> visual atual: todo valor cru fora de token e todo componente com mais de uma
> implementação. Base para a migração tela a tela (fase 4).
>
> Coleta: `grep` sobre `*.html` e `*.css` no commit desta branch
> (`claude/design-system-tokens`). Números são reproduzíveis.

---

## 1. Veredito

O app **não tem** uma fonte única da verdade. Convivem **10 raízes `:root`
concorrentes** com paletas e escalas divergentes, **50 de 55 telas** carregam
estilo embutido próprio, e a linguagem visual de origem (azul clínico off-white
da spec) **ainda não existe** no código — a estética dominante é
roxo/violeta/dourado "premium" em fundo escuro.

A camada canônica foi instalada nesta branch:

- `ds-tokens.css` — Seção 3 integral (fonte única da verdade).
- `ds-components.css` — Seção 4 integral (componentes únicos, todos os estados).
- `design-system.html` — style guide vivo; prova a Seção 8 (tela do zero herda
  o sistema sem nenhum CSS adicional).

---

## 2. Valores crus fora de token (medido)

| Métrica | Ocorrências |
|---|---|
| Cores hex cruas (`#rrggbb`) em HTML+CSS | **1.349** |
| Cores hex **distintas** | **~112** |
| `border-radius: <n>px` cru | **493** |
| Declarações `box-shadow` cruas | **237** |
| Telas com `<style>` embutido | **50 / 55** |
| Raízes `:root` concorrentes (sem contar `ds-tokens.css`) | **10** |

### 2.1 Raízes `:root` concorrentes (cada uma é uma "fonte da verdade" rival)

`styles.css` · `design-system-premium.css` · `premium-override.css` ·
`brand-dr-jadson.css` · `app-polish-mobile.css` · `np-cards.css` ·
`editorial-impact.css` · `neuroped-master-biblioteca.css` ·
`neuroped-master-vitrine.css` · `neuroped-shell.css`

**Colisões de token comprovadas** (mesmo nome, valor diferente):

| Token | `styles.css` | `design-system-premium.css` | Spec (Seção 3) |
|---|---|---|---|
| `--radius-md` | `18px` | `16px` | **`12px`** |
| `--radius-lg` | `22px` | `22px` | **`16px`** |
| `--surface` | `#ffffff` | `rgba(255,253,249,.965)` | **`#FFFFFF`** |
| `--primary`/`--brand` | `#df2f3a` (vermelho) | `--teal:#6d6af5` (roxo) | **`#2D6FF0` (azul)** |
| `--bg` | `#fbfaf7` | `#0a0a16` (escuro) | **`#F7F8FA`** |

> Consequência: carregar duas folhas legadas na mesma tela produz resultado
> dependente da ordem do cascade — exatamente o que a Seção 1 proíbe.

### 2.2 Concentração de cores cruas (top ofensores)

`#fff` (112×) · `#0e0e22` (88×) · `#0a0a16` (81×) · `#6d6af5` (70×) ·
`#eceaff` (63×) · `#14132a` (61×) · `#f2dca6` (60×) · `#b6b2e6` (56×) ·
`#a9a4ff` (42×) · `#e7c98b` (41×)

Nenhuma dessas cores pertence à paleta da Seção 3. São o tema escuro
roxo/dourado legado, a ser substituído na migração.

### 2.3 Tipografia divergente

Famílias em uso simultâneo: `system-ui`, `Georgia,serif`, `Fraunces`,
`Cormorant Garamond`, `Inter`, `Arial`, `Consolas`. A spec (3.6) fixa **Inter**
(fallback SF Pro) + `--font-mono`. Telas serifadas (Georgia/Fraunces/Cormorant)
quebram a Seção 1.

---

## 3. Componentes com implementação duplicada

Cada um abaixo viola "uma implementação por componente" (Seção 4). A coluna
"canônico" indica o substituto único já disponível.

| Componente | Implementações legadas (amostra) | Canônico |
|---|---|---|
| Card | `.card`, `.np-card`, `.np-box`, `.entry-card`, `.report-preview`, `.tool`, `.panel`, `.item`, `.hero` | `.ds-card` |
| Botão | `.btn`, `.np-btn`, `.fab`, `.scale-btn`, `.done button`, `<button>` solto | `.ds-btn` (+ variantes) |
| Badge/chip | `.badge`, `.np-chip`, `.entry-tag`, `.period-chip`, `.area-tab`, `.skill-chip`, `.kick`, `.sym span` | `.ds-badge` |
| Input | regras `input,textarea,select` repetidas em ≥4 folhas + inline | `.ds-input/.ds-select/.ds-textarea` |
| Skeleton | `.skel` (escala.html) + variações inline | `.ds-skeleton` |
| Sidebar/nav | `.nav-btn`, `.bottom-nav`, `.area-tab`, `.period-chip` | `.ds-sidebar`/`.ds-nav-item` |
| Modal | overlays ad hoc por tela | `.ds-overlay`/`.ds-modal` |
| Status | `.who`, `.done`, badges coloridos diversos | `.ds-status` (idle/active/done) |

---

## 4. Plano de migração (fases 4–6, Seção 7)

Pré-requisito cumprido: fases 1 (tokens) e 3 (componentes) entregues nesta branch.

1. **Telas-referência primeiro** (Seção 2), nesta ordem: escalas → dashboard
   clínico → aplicação de questionários → cards modulares → relatório.
   Para cada uma: incluir `ds-tokens.css` + `ds-components.css`, trocar markup
   pelas classes `ds-*`, **remover** o `<style>` embutido e o CSS órfão.
2. **Aposentar as raízes rivais**: deletar/parar de carregar
   `design-system-premium.css`, `premium-override.css`, `editorial-impact.css`
   e congêneres assim que cada tela deixar de depender delas.
3. **Telas restantes** por reutilização — nunca reimplementação.
4. **Dark mode** (fase 5): já é troca de tokens (`data-theme="dark"` /
   `prefers-color-scheme`). Nenhuma folha paralela.
5. **Polimento** (fase 6): skeletons no lugar de spinners de tela cheia,
   empty states, `focus-visible`, movimento só em `transform`/`opacity`.

### Gate de aceite por tela (Seção 8)
- [ ] `grep` de hex/px/shadow crus na tela = vazio (tudo via token).
- [ ] Cada componente repetido aponta para a implementação `ds-*` única.
- [ ] Estados presentes: hover, pressed, focus, loading, disabled, error, empty.
- [ ] Área interativa ≥ 44px; navegável só por toque.
- [ ] Contraste AA em light **e** dark.

---

## 4.1 Migração em andamento (fase 4)

| Tela | Estado | Observações |
|---|---|---|
| `banco-escalas.html` (biblioteca de escalas + aplicação de questionário) | **✅ migrada (piloto)** | Tokens clínicos light, Inter, componentes `ds-*`. Removidas as skins legadas (`app-polish-mobile.css/js`, `escalas-card-premium.css/js`) e o `:root` roxo/escuro. Zero hex cru. Alvos ≥ 44px. Gate atualizado para travar o novo padrão. |
| `banco-escalas-lote{1..5}.html` | pendente | Ainda no tema índigo legado + estética J26. Próximos da fila (mesmo template do piloto). |
| dashboard clínico, aplicação de questionários (`escala.html`), cards modulares, relatório | pendente | Telas-referência seguintes (Seção 2). |

> **Camada universal a aposentar (global):** `app-polish-mobile.css` força títulos
> em Fraunces serif e re-tinge tokens para índigo — incompatível com a Seção 3.6.
> O piloto a removeu localmente; o passo global é reescrever o chrome `np-*`
> (bottom-nav, toasts, sheets, journey) sobre os tokens canônicos e então retirar
> a skin de todas as telas.

## 5. Como verificar a fundação agora

Abra `design-system.html` (carrega **apenas** `ds-tokens.css` +
`ds-components.css`). Alterne o tema no botão "Tema": o dark mode é troca de
tokens, sem CSS duplicado. É a prova viva da Seção 8.
