# Auditoria FUNCIONAL — NeuroPed (2026-06)

Auditoria além de "parseia": **funciona de verdade?**. Foco em referências quebradas,
páginas que não renderizam e engines que não rodam.

## 🔴 CRÍTICO — encontrado e CORRIGIDO nesta auditoria
A mega-deploy V3.2 (#232) **referenciou 4 arquivos que nunca foram commitados**:
`neuroped-engine-clinica.js`, `neuroped-clinica-ui.js`, `neuroped-estilo-final.css`, `neuroped-clinica-ui.css`.

Consequência: **3 páginas quebradas em produção** (sem CSS e sem o engine que popula o conteúdo):
- `testes-diretos.html` (a V3 **substituiu** a versão clássica funcional por uma quebrada)
- `escalas-questionarios.html` (nova, quebrada)
- `diarios-clinicos.html` (nova, quebrada)

E o #237 (meu) havia redirecionado os diários para `diarios-clinicos.html` — ou seja, para uma página quebrada.

### Correção aplicada (reversível por git)
- `testes-diretos.html` → **restaurada a versão clássica funcional** (commit 4146e4f; carrega `testes-diretos-engine.js`, que existe).
- `diarios.html` → **restaurado o hub funcional** (lista do catálogo real; desfaz o redirect do #237).
- `escalas-questionarios.html` → **redireciona** para `filtro-escalas.html` (funcional).
- `diarios-clinicos.html` → **redireciona** para `diarios.html` (funcional).
- **Resultado: 0 referências quebradas** no app inteiro. `npm test` 747 OK.

## 🟢 Engines clínicos V3 — carregam OK
`clinical-event-bus/storage/engines/router/governance.js` e `neuroped-ontology/router.js`
**carregam sem lançar erro** num harness Node e expõem suas APIs
(`NeuroPedClinicalEventBus`, `NeuroPedClinicalStorage`, `NeuroPedClinical`, `NeuroPedClinicalRouter`, `NeuroPedClinicalGovernance`).
São carregados (aditivamente) pela `filtro-escalas.html` — não a quebram.

> ⚠️ **Risco latente — colisão de namespace:** a V3 (`clinical-engines.js`) e a V4 (minha camada)
> usam ambos `window.NeuroPedClinical`. Hoje **não co-carregam** na mesma página (V4 só na demo),
> então não colide. Recomendo renomear um dos dois antes de usá-los juntos.

## 🟢 Núcleo verificado
- Catálogo de escalas agrega (410 itens, 0 IDs duplicados) — ok.
- Inline scripts de TODAS as páginas parseiam (teste `script inline quebrado`: 0).
- Encoding: 0 mojibake residual.

## 🟡 Dívidas remanescentes (não-bloqueantes)
1. **Arquitetura V3 incompleta**: a outra sessão subiu páginas/refs sem os arquivos de UI/engine.
   Decidir se a direção V3 será completada (committar os 4 arquivos) ou abandonada (manter as clássicas).
2. **Namespace `NeuroPedClinical`** duplicado (V3×V4) — renomear.
3. **Páginas V3 redirecionadas** (`escalas-questionarios`, `diarios-clinicos`) — manter como redirect ou remover após sua decisão de consolidação.
4. **`menu-instrumentos.html`** (V3): carrega arquivos existentes; falta auditar se a LÓGICA lista corretamente (router/ontology) — fica para auditoria de lógica.

## Conclusão
O app estava com **3 páginas de conteúdo quebradas em produção** por arquivos faltantes do
mega-deploy V3.2 — agora **corrigido** (versões funcionais restauradas/redirecionadas, 0 refs quebradas).
Os engines V3 carregam; o núcleo (catálogo, escalas, encoding) está íntegro.

---

## Auditoria de LÓGICA dos engines V3 (continuação)

Exercitei a classificação real, não só o load:

### ✅ `clinical-router.classifyItem` — classifica corretamente (4/4)
| Entrada | Resultado | Correto? |
|---|---|---|
| "SNAP‑IV — Questionário para pais" | `scale / attention` | ✓ |
| "Teste de leitura e nomeação rápida" | `direct_test / academic` (id_pattern) | ✓ |
| "Diário do Sono (controle diário)" | `diary / sleep` (id_pattern) | ✓ |
| "Inventário de Processamento Sensorial" | `scale / sensory` | ✓ (inventário ∈ família escala) |

### ✅ Taxonomias são COMPLEMENTARES (corrige suspeita anterior)
- `clinical-taxonomy-v3.json` (v3.0): `canonical_allowlist` (scale 22 · direct_test 14 · diary 12 · comment 108) + `types`. **Usada pelo `clinical-router`.**
- `clinical-taxonomy-v3.1.json` (v3.1): `required_fields_per_instrument`. **Usada pelo `clinical-engines`.**
- **Não há duplicação nem conflito:** só o `clinical-router` seta `window.NeuroPedClinicalTaxonomyV3` (com a v3.0, allowlist intacta); o `clinical-engines` usa a v3.1 internamente. A allowlist curada NÃO é bypassada.

### Conclusão da auditoria de lógica
Os engines clínicos V3 **carregam e classificam corretamente**. O único problema real da V3 era as **4 telas/arquivos de UI faltantes** (já corrigido em #238). A lógica de classificação/roteamento está íntegra.
