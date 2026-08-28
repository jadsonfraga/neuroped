# Auditoria Contínua NeuroPed SDG

## Registro v37 — Quality Foundation

Data: 2026-05-08

### Área auditada

- Fluxo de PIN master.
- Service worker.
- Rotas principais.
- Consulta.
- PWA.
- Política de armazenamento.
- Documentação LGPD.
- Planejamento backend/memória.

### Problemas tratados

1. Rotas espalhadas sem registro central.
2. Ausência de painel único de qualidade.
3. Falta de teste navegável específico para PIN master.
4. Consulta longa sem atalhos modulares.
5. Falta de documentação objetiva para backend gratuito.
6. Falta de documentação objetiva para memória/embeddings.
7. Falta de checklist LGPD resumido.

### Correções feitas

- Criado `routes.config.js`.
- Criado `teste-ouro-pin.html`.
- Criado `qualidade-neuroped.html`.
- Criado `consulta-tabs.js`.
- Criado `storage-policy.js`.
- Criado `app-mode.js`.
- Criado `docs/PLANO_BACKEND_GRATUITO.md`.
- Criado `docs/MEMORIA_E_EMBEDDINGS.md`.
- Criado `docs/LGPD_CHECKLIST.md`.

### Riscos restantes

- PIN frontend segue sendo controle de interface, não segurança de produção.
- O service worker ainda injeta várias camadas e deve ser consolidado progressivamente.
- Backend real ainda não foi implementado.
- Embeddings reais ainda não configurados.
- Dados clínicos reais continuam proibidos nesta fase.

---

## Registro v38 — Quality Panel Fix

Data: 2026-05-08

### Correção feita

- Atualizado `qualidade-neuroped.html` para carregar diretamente `./app-mode.js`.
- Ajustada validação do painel para considerar OK quando `window.NEUROPED_APP_MODE.mode === "HOMOLOGAÇÃO"`.
- Atualizado `sw.js` para `neuroped-v38-quality-panel-fix`.

### Riscos restantes

- Ausência de teste automatizado formal via npm naquela etapa.
- Service worker ainda injeta múltiplas camadas; consolidar em rodada futura.

---

## Registro v39 — Static Test Baseline

Data: 2026-05-08

### Correção feita

- Criado `scripts/test-static.mjs`.
- Adicionado `npm run test:static`.
- Adicionado `npm test` apontando para `test:static`.

### Teste

```bash
npm test
# Resultado: 759 OK, 0 aviso(s), 0 falhas.
```

---

## Registro v40 — Engine e Clinical

Data: 2026-06-01

### Área auditada

- Motor pré-consulta (Clinical Intelligence Engine)
- Testes clínicos V3.2

### Estado

- Engine: 48/48 testes passando
- Clínicos: 29/29 testes passando
- Smoke: 14/14 testes passando

### Riscos restantes

- Cobertura de skin ainda baixa (~7% das páginas).
- 8 sistemas de estilo coexistindo.
- Baseline design-audit elevado.

---

## Registro v41 — Instrumentos Internacionais Lote 2

Data: 2026-06-01

### Área auditada

- Bundle de escalas (`NEUROPED_EDITORIAL_SCALES`)
- Filtro de escalas (`filtro-escalas.html`)

### Estado

- 914 asserções estáticas passando (inclui novos instrumentos lote 2)
- Todos os instrumentos do lote 2 com keywords e presença no bundle confirmada

---

## Registro v42 — Auditoria Completa v6.46.0

Data: 2026-08-28

### Área auditada

- Stack completa v6.46.0
- 8 sistemas de estilo identificados (déficit)
- Scorecard 4/5 (cobertura skin < 60%)

### Problemas diagnosticados

1. **Sistemas de estilo**: 8 sistemas coexistindo (alvo ≤3)
2. **Cobertura skin**: ~7% (alvo ≥60%)
3. **Baseline design-audit**: 9068 raw values
4. **Arquivos CSS mortos**: `design-system-premium.css` sem referência

### Scorecard v42

| Métrica | Valor | Alvo | Status |
|---|---|---|---|
| API órfãos (SPA→404) | 0 | 0 | ✓ |
| Sistemas de estilo | 8 | ≤3 | ✗ |
| Cobertura skin | 7% | ≥60% | ✗ |
| console.log em prod | 0 | 0 | ✓ |
| Marcadores de conflito | 0 | 0 | ✓ |

**4/5 métricas no alvo.**

---

## Registro v43 — Consolidação de Estilos Completa

Data: 2026-08-28

### Área auditada

- 8 sistemas de estilo → 3
- Cobertura skin 7% → 97%
- Baseline design-audit

### Fases executadas

**FASE 1** — Elimina `ds-tokens.css` e `design-system-premium.css`
- `ds-tokens.css`: aliases migrados para `tokens.css`
- `design-system-premium.css`: arquivo morto removido

**FASE 2** — Absorve `app-skin.css` em `np-skin.css`
- 366 linhas de `app-skin.css` incorporadas como Seção 1 global de `np-skin.css`
- Referências atualizadas em 72 páginas

**FASE 2b** — Inline `escalas-hero.css` e `premium-override.css`
- `escalas-hero.css`: inlined em `filtro-escalas.html`, `escala.html`, `banco-escalas.html`
- `premium-override.css`: inlined em `index.html`

### Arquivos eliminados

- `ds-tokens.css` — bridge aliases migrados para `tokens.css`
- `design-system-premium.css` — arquivo morto (não referenciado por nenhuma página)
- `app-skin.css` (366 linhas) — absorvido em `np-skin.css` como Seção 1 global
- `escalas-hero.css` — inlined em `filtro-escalas.html`, `escala.html`, `banco-escalas.html`
- `premium-override.css` — inlined em `index.html`

### Sistemas de estilo remanescentes (3 — meta atingida)

1. `tokens.css` — tokens canônicos + aliases-ponte legacy
2. `np-tokens.css` — tokens Apple-grade (`--np-*`)
3. `np-skin.css` — skin canônica unificada (Seção 1 global + Seção 2 `.np-skin` opt-in)

### Baseline design-audit

- Antes (v42): 9068 raw values
- Após (v43): **8758** (−310 desde o início da sessão)

### Ratchet `check-styles.mjs`

- BASELINE_LEGACY: 9 → 4 arquivos legados
- MAX_LEGACY auto: 9 → 4

### Limites mantidos

- PIN frontend: controle de interface, não segurança de produção.
- Dados clínicos reais: proibidos (ver `GO_LIVE_CHECKLIST.md`).
- CRM: **CRM-PE 25227 / RQE 17756** — nenhuma referência a CRM-BA.
- `consulta-pin-fix.js`: mantido como utilitário; não é dependência de `consulta.html`.

### Próximos passos

1. Implementar Workstream 1 (endpoints backend) quando a infraestrutura estiver disponível.
2. Testes Lighthouse ≥90 (Workstream 4) — requer browser.
3. Branch protection no GitHub (exigir os 4 checks verdes antes do merge).

---

## Registro v44 — Premium Sidebar (SPA React/TS)

Data: 2026-08-28

### Área auditada

- Sidebar do app SPA (`client/src/components/Layout.tsx`)
- Regra de ouro do filtro de escalas (`filtro-escalas.html`)

### Melhorias aplicadas

**Premium Sidebar:**
- Largura expandida: 256px → **280px** (rail colapsado mantido em 64px)
- Indicador de item ativo: adicionado **left-bar accent** animado (3px, `--primary`, `layoutId` Framer Motion)
- Gradiente ativo: simplificado para wash teal sutil esquerda→transparente
- Ícones: 17px, strokeWidth 2,1 em ativo / 1,7 em repouso
- Labels: `text-[12.5px]` para leitura densa mais confortável
- Cabeçalhos de seção: tracking mais forte, hover com tint teal, chevron 12px
- Header: gradiente teal suave atrás do logo/wordmark
- Todos os `data-testid` preservados; comportamento inalterado

**Filtro de Escalas — Regra de Ouro (já na v43, confirmado):**
- Bug JS truthy `[]` corrigido em `pickDirect`
- Função `fillMedals()` garante sempre 3 medalhas (ouro/prata/bronze)
- Slots direto-com-criança e escola sempre presentes

### Gate verify (tudo verde)

- `test-static.mjs`: **914/914** OK
- `smoke.mjs`: **14/14** OK
- `test-preconsulta-engine.mjs`: **48/48** OK
- `run-clinical-tests.mjs`: **29/29** OK
- `check-contrast.mjs --strict`: **AA** em todos os pares (light + dark)
- `check-theme.mjs --strict`: **72 páginas** OK
- `check-styles.mjs --strict`: **9 canônicos + 4/4 legados**
- `audit-report.mjs`: **5/5** métricas no alvo

### Scorecard (5/5 — mantido)

| Métrica | Valor | Alvo |
|---|---|---|
| API órfãos (SPA→404) | 0 | 0 |
| Sistemas de estilo | 3 | ≤3 |
| Cobertura skin | 97% (70/72) | ≥60% |
| console.log em prod | 0 | 0 |
| Marcadores de conflito | 0 | 0 |

### Limites mantidos

- CRM: **CRM-PE 25227 / RQE 17756** — nenhuma referência a CRM-BA.
- Dados clínicos reais: proibidos.
- TDAH ≠ TOD: sem confusão nem sobreposição.

### Próximos passos

1. Workstream 1: endpoints backend (`/api/patients`, `/api/results`, etc.) — aguarda infraestrutura.
2. Workstream 4: Lighthouse mobile ≥90 — requer browser/CI Lighthouse.
3. Workstream 5: branch protection no GitHub (exigir verify verde antes do merge).
