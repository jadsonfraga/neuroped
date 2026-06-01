# 🧹 Caça às Bruxas — Auditoria sistemática do app

> **Data:** 2026-06-01 · **Versão:** 6.23.2 · **Gatilho:** bug visual reportado no `filtro-escalas.html`

## 🐛 A bruxa real (corrigida)
**Shell invasivo** — o `data-ns-shell` (adicionado em massa na SUPERMEGA) tinha 3 regras que
sobrescreviam o design próprio das páginas:
- `body[data-ns-shell] .panel input/textarea/select` → reescrevia inputs do `.panel`
  (quebrava o campo IDADE do filtro; **11 páginas** com `.panel` afetadas)
- `body[data-ns-shell] a:not(...)` → recoloria links com cor própria
- `body[data-ns-shell]{background;font-family}` → sobrescrevia fundo/fonte da página

**Correção (v6.23.2):** shell tornado **não-invasivo** — só fornece scrollbar, foco, fade-in,
print styles e classes opt-in. Fundo/fonte/inputs/links seguem o design de cada página.

## 🔍 Bruxas caçadas (todas falsas ou já sãs)
| # | Classe verificada | Resultado |
|---|---|---|
| 1 | Typography global (app-polish) | ✅ intencional (Fraunces/Inter premium) |
| 2 | Páginas claras com shell escuro | ✅ nenhuma |
| 3 | JS com erro de sintaxe | ✅ 59 arquivos válidos |
| 4 | `<style>`/`<script>` não fechado | ✅ balanceado |
| 5 | Botões mortos (onclick→função inexistente) | ✅ falso positivo (módulos + `print` nativo) |
| 6 | IDs duplicados | ✅ falso positivo (modais mutuamente exclusivos) |
| 7 | Animação dupla (flash) | ✅ falso positivo (mascote/bounce específicos) |
| 8 | app-polish pinta `.card/.btn/input` global | ✅ só tap-target + foco (benigno) |
| 9 | fade-in `both` → conteúdo invisível | ✅ reduced-motion zera duração |
| 10 | `target=_blank` sem `noopener` | ✅ todos seguros |
| 11 | `aria-labelledby/describedby` → id inexistente | ✅ todas resolvem |
| 12 | Mixed content (`http://` em https) | ✅ nenhum |

## ✅ Conclusão
Após corrigir a bruxa do shell, o app está **zerado de bruxas** nas 12 classes auditadas.
Base sólida: visual coeso, JS íntegro, acessível, seguro e offline.
