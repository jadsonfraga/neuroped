# IMPLEMENTATION_PLAN_99 — NeuroPed SDG

Data: 2026-05-07
Meta: elevar a estabilidade funcional e reduzir dependências frágeis, preservando o app já construído.

## 1. Estado atual identificado

Arquivos centrais preservados:

- `index.html`
- `escalas.html`
- `comunicacao-alternativa.html`
- `caa-hotfix.js`
- `diario-escola-terapias-v2.html`
- `diario-hotfix.js`
- `filtro-escalas.html`
- `mapa-escalas.html`
- `scales-index.json`
- `scales-editorial.js`
- `manifest.json`
- `sw.js`
- `caa-sidebar.js`
- `AUDITORIA_OPERACIONAL_FUNCOES.md`

## 2. Estratégia conservadora

Não reescrever os HTML grandes da CAA e do Diário. Esses arquivos concentram a funcionalidade principal já operante. A intervenção destrutiva aumentaria risco de regressão.

A estratégia 9.9 é:

1. Manter hotfixes como arquivos externos cacheados.
2. Manter injeção pelo service worker como fallback.
3. Adicionar teste de fumaça navegável para verificar rotas, manifest, cache e textos-chave.
4. Atualizar cache para v17.
5. Documentar limitação da sidebar e dos HTML grandes.
6. Criar relatório final honesto.

## 3. Riscos

| Risco | Mitigação |
|---|---|
| Quebrar CAA ao reescrever HTML grande | Não reescrever a página; usar hotfix externo preservado |
| Quebrar Diário ao reescrever HTML grande | Não reescrever a página; usar hotfix externo preservado |
| Service worker antigo prender versão | Atualizar cache para v17 e usar `skipWaiting`/`clients.claim` |
| Sidebar não nativa | Documentar fallback e manter `caa-sidebar.js` sem botão flutuante |
| String histórica aparecer em auditoria antiga | Separar produção de documentação histórica |

## 4. Arquivos que serão criados

- `qa-smoke-test.html`
- `QA_SMOKE_RESULTS_TEMPLATE.md`
- `NAVIGATION_DECISION_99.md`
- `STRING_AUDIT_99.md`
- `RELATORIO_99_FUNCIONAL.md`

## 5. Arquivos que serão alterados

- `sw.js`

## 6. Rollback

- Reverter `sw.js` para a versão v16 se houver problema de cache.
- Remover `qa-smoke-test.html` não afeta o app principal.
- Remover documentação não afeta rotas clínicas.

## 7. Critérios de aceite

- `qa-smoke-test.html` existe e testa rotas principais.
- `sw.js` contém `neuroped-v17-operacional-99`.
- `sw.js` cacheia `qa-smoke-test.html`, `caa-hotfix.js` e `diario-hotfix.js`.
- Manifest não contém `CAA Premium` em produção.
- Índice contém `mapa-escalas.html`.
- Filtro contém perguntas fáceis.
- Relatório final declara nota honesta, não fictícia.
