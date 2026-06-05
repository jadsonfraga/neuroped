# Plano de consolidação de estilos (M3)

> Estado: **congelado e ratchetando**. Guarda: `scripts/check-styles.mjs` (no `verify` e no CI).

## Por que não consolidamos tudo de uma vez

O alvo do M3 é reduzir os sistemas de estilo a **≤3 canônicos**. A consolidação
plena (migrar `tokens.css`→`np-tokens` e `app-skin`→`np-skin` em ~55–71 páginas)
é um refactor grande que:

1. **colide com edição concorrente** da camada de paleta/skin (`np-palette-v2.css`
   é editado por outra sessão; o `main` quebrou 3× num único dia por isso);
2. **não é verificável sem navegador** nesta execução — trocar a folha de estilo
   de uma página muda o visual, e não há como conferir sem regressão visual.

Trocar uma métrica auditável por risco de regressão em produção é mau negócio.
Então a estratégia é **monotônica e segura**: congelar o inventário agora e só
deixá-lo **encolher**.

## Inventário (baseline)

**Canônicos (destino — ficam):**
`np-tokens.css` · `np-palette-v2.css` · `np-skin.css`
(+ camadas do mesmo DS: `np-foundation`, `np-components`, `np-catalog`,
`np-anchors`, `np-cards`, `np-embedded`)

**Legado a retirar (teto atual = 11, só cai):**

| arquivo | refs HTML | nota de migração |
|---|---|---|
| `tokens.css` | 59 | já em ponte via `ds-bridge.css` → migrar consumidores para `np-tokens` e remover a ponte |
| `app-skin.css` | 55 | sobreposto por `np-skin` onde a skin está aplicada (96% de cobertura) → migrar o resto |
| `ds-tokens.css` | 8 | tokens duplicados → mapear para `np-tokens` |
| `escalas-card-premium.css` | 6 | absorver em `np-cards`/`np-skin` |
| `escalas-hero.css` | 3 | absorver na skin de hero |
| `design-system-premium.css` | 1 (auditoria-operacional) | bespoke de 1 página → inlinar ou absorver |
| `filtro-hero-premium.css` | 1 (filtro-escalas) | bespoke de 1 página → absorver na skin |
| `scales-ui-premium.css` | 1 (instrumento) | bespoke de 1 página → absorver na skin |
| `premium-override.css` | 1 | 449 linhas de override → reconciliar com a skin canônica |
| `components.css` | — | legado de componentes → `np-components` |
| `ds-bridge.css` | — | a ponte some por último, quando `tokens.css` zerar |

## Como ratchetar (cada remoção segura)

1. Migrar os consumidores do arquivo legado para o canônico equivalente.
2. Confirmar com `npm run verify` (contraste, **contrato de tema**, estático,
   smoke, motor, clínico) — e, quando houver navegador, conferir o visual da(s)
   página(s) afetada(s).
3. Remover o arquivo + sua entrada no precache do `sw.js`.
4. Em `scripts/check-styles.mjs`: tirar o arquivo de `BASELINE_LEGACY` e **baixar
   `MAX_LEGACY`** para o novo total. O CI passa a travar o teto novo.

Quando `BASELINE_LEGACY` esvaziar, restam só os canônicos e o M3 fecha em ≤3.

## Janela segura

Executar as remoções **quando a sessão concorrente não estiver editando a camada
de estilo** (evita colisão de merge nos mesmos arquivos). Até lá, o guarda impede
qualquer crescimento — o débito está contido, não crescendo.
