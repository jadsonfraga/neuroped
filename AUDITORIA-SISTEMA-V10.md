# AUDITORIA-SISTEMA-V10 — NeuroPed SDG

> Auditoria **real**, feita sobre o repositório como ele está (não sobre o estado
> hipotético descrito no prompt V10). Data: 2026-06-02. Versão: 6.41.x.

## 0. Correção de premissas (honestidade técnica)

O prompt "OPERAÇÃO NEUROPED V10" descreve, em "CONTEXTO ABSOLUTO", artefatos como
já construídos. **Verificação no repositório: não existem.**

| Artefato citado como pronto | Existe? |
|---|---|
| `taxonomy-clinica.json` | ❌ não |
| `sanitize-catalog.js` | ❌ não |
| `clinical-engine-v4.js` / "engine v4" | ❌ não |
| `evidence-registry.json` | ❌ não (este doc cria o **template**) |
| `clinical-ontology-v2.json` | ❌ não (template criado como `clinical-ontology.json`) |
| `differential-engine.js`, `uncertainty-engine.js` etc. | ❌ não |

O que **de fato** existe como motor clínico:

- **Motor de produção:** `scoreScale()` inline em `filtro-escalas.html` — gate de
  idade, modalidade×idade, camada de construto, hierarquia Ouro/Prata/Bronze,
  triangulação e camada de **diferenciais** (esta auditoria).
- **Motor órfão:** `scale-recommender.js` (v5.1) + `scales-engine-v5.json`,
  ligados **apenas** a `scale-engine-demo.html`. Sem link em nenhuma navegação
  do app. **Duplicação de lógica** — risco de divergência silenciosa.

## 1. Inventário real

- HTML: **55** · JS: **62** · CSS: **13** · JSON: **6**
- `scales-bundle.js`: 233 KB (concatenação dos fontes `scales-*.js`).
- Maiores JS: `scales-bundle.js` (233 KB), `app-polish-mobile.js` (46 KB),
  `scales-autorais-npe.js` (36 KB).

## 2. Achados — DUPLICAÇÃO / CÓDIGO MORTO

| # | Achado | Severidade | Ação recomendada |
|---|---|---|---|
| D1 | **Dois motores de score** (`scoreScale` inline × `scale-recommender.js` v5.1) | Alta | Eleger 1 fonte de verdade. O órfão só serve `scale-engine-demo.html` — ou consolidar a riqueza do v5.1 no de produção, ou remover o demo. |
| D2 | Diário legado `diario-escola-terapias.html` convive com `-v2` | Média | v1 já redireciona p/ v2 (guard confirma). Manter como redirect, não duplicar conteúdo. |
| D3 | **15 scripts `.bat`/`.ps1`** versionados na raiz (PUSH-V99, MERGE-PR-AGORA…) | Baixa | Mover p/ `scripts/win/` ou `.gitignore`. Poluem a raiz; nenhum é runtime. |
| D4 | **32 relatórios `.md`** na raiz (AUDITORIA_*, RELATORIO_*, PUSH_*) | Baixa | Mover p/ `docs/historico/`. Dificultam achar os docs canônicos. |

## 3. Achados — MOTOR CLÍNICO (relevância)

| # | Achado | Status |
|---|---|---|
| C1 | Score só batia tag literal | ✅ resolvido (camada de construto, v6.41.1) |
| C2 | Idade não barrava escala fora de faixa | ✅ resolvido (gate multiplicador, v6.41.0) |
| C3 | Autorrelato sugerido p/ pré-escolar | ✅ resolvido (modalidade×idade) |
| C4 | Sem raciocínio diferencial (mimics/comorbidade) | ✅ resolvido (camada de diferenciais, **esta auditoria**) |
| C5 | Sem metadado de evidência/guideline por escala | ⛔ **bloqueado por dado** — ver §6 |
| C6 | Sem custo de fadiga / orquestração de protocolo | ⛔ depende de metadado curado (§6) |
| C7 | Longitudinalidade (baseline/delta) parcial | 🟡 `np-store` guarda resultados; falta engine de trajetória |

## 4. UX / Fluxo

- Filtro = porta única (mapa-escalas/escalas viram redirect). ✅
- Runner `escala.html` normaliza qualquer escala e encadeia "próxima". ✅
- **Novo:** painel "🧠 Raciocínio clínico do caso" (fenótipo + diferenciais),
  recolhível, rotulado como apoio à decisão. ✅

## 5. Performance / A11y (snapshot)

- SW com SWR p/ JS/CSS + precache de SHELL. Bundle único (13 req → 1). ✅
- `prefers-reduced-motion` respeitado nas animações do filtro. ✅
- **Pendência real:** `scales-bundle.js` (233 KB) carrega sempre no filtro mesmo
  quando o usuário só quer o Top-3 — candidato a lazy-load/split (V11).

## 6. O LIMITE HONESTO (por que C5/C6 não foram "implementados")

O prompt pede `evidence-registry.json` afirmando, por escala, `evidence_level`,
`guideline_support` (AAP/NICE/AACAP/DSM-5-TR/ICD-11/Cochrane),
`contraindicated_for`, `false_positive_with`.

**Isso não pode ser gerado por inferência sem virar fabricação clínica.** Um
sistema de apoio à decisão que afirma "NICE recomenda a escala X / nível de
evidência A" quando isso não foi verificado é risco de segurança do paciente e
risco médico-legal. Mantém-se a regra do projeto: **não inventar dado clínico.**

**Solução entregue:** os templates `clinical-ontology.json` e
`evidence-registry.json` com a **estrutura** e `"_needs_curation": true`. O autor
(Dr. Jadson) preenche incrementalmente; quando uma escala tiver metadado curado,
o motor passa a consumi-lo. Sem curadoria, o campo permanece nulo — **nunca um
palpite apresentado como fato.**

## 7. Próximos saltos reais (ver ROADMAP-V11)

1. Consolidar o motor órfão (D1) — uma fonte de verdade.
2. Curadoria incremental de `evidence-registry.json` (desbloqueia C5/C6).
3. `trajectory-engine` sobre `np-store` (baseline → delta funcional).
4. Lazy-load do bundle de escalas (perf).
5. Higiene de raiz (D3/D4).

— Soli Deo Gloria.
