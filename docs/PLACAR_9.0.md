# Placar NeuroPed 9.0 — fonte viva e honesta

Gerado em: 2026-06-06T17:29:12.899Z

## Regra de nota

NOTA GLOBAL = menor eixo medido. Eixo essencial não medido impede nota 10. Não declarar 9,0 sem evidência.

## Nota global atual

**7.0 / 10**

> Diagnóstico: não declarar 9,0 real ainda porque D4/A11Y e Playwright em navegador real estão não medidos.

## Antes/depois

| Momento | Nota | Evidência |
|---|---:|---|
| Antes da sprint | não medido | Repositório não possuía package.json, scripts npm, scorecard vivo ou suíte E2E executável. |
| Depois desta alteração | 7.0 | Scorecard gerado por `npm run scorecard`; menor eixo medido define a nota. |

## Eixos

| Eixo | Status | Nota | Evidência |
|---|---|---:|---|
| D1 Função/local-first | 🟢 verde | 8.0 | 30 menções /api; wrapper/fallback honesto=true; estados em implantação=6; refs quebradas=0; 404 silencioso=false |
| D2 Código | 🟢 verde | 8.0 | check=passou; lint=passou; warnings observacionais no lint não bloqueiam |
| D3 Build/perf | 🟡 amarelo | 7.0 | build estático=passou; maior chunk=assets/paciente-detalhe-C7JxI3LU.js 612 KiB; Lighthouse=não medido |
| D4 A11Y | ⚪ não medido | 6.0 | axe serious/critical=não medido; ambiente sem browser Playwright instalado após bloqueio de registry npm |
| D5 Testes | 🟡 amarelo | 7.0 | 12 specs estáticas/e2e passaram via Node; 2 specs Playwright versionadas; execução real Playwright=não medida |
| D6 Clínico | 🟡 amarelo | 7.0 | conteúdo clínico preservado; validate-catalog=não medido; revisão médica humana pendente; fontes clínicas não alteradas |

## Métricas brutas

- Total de chamadas/menções `/api` detectadas: 30.
- Chamadas tratadas por wrapper/fallback honesto: detectado em index.html/sw.js.
- Rotas quebradas por referência estática local: 0.
- Estados em implantação detectados: 6.
- 404 silencioso: não detectado nos fallbacks estáticos.
- Specs estáticas/e2e versionadas e executadas: 12.
- Specs Playwright versionadas para navegador real: 2; execução: não medido.
- Lighthouse: não medido.
- axe: não medido.
- validate-catalog: não medido.

## Saída dos comandos medidos

### check

```
Static check aprovado: 7 arquivos-base, 4 referências locais e 210 assets publicados.
```

### lint

```
Lint estático aprovado com 0 warning(s) não bloqueante(s).
```

### build

```
Build estático validado: index.html 5781 bytes; maior bundle paciente-detalhe-C7JxI3LU.js 612 KiB.
```

### e2e estático

```
✓ App carrega shell HTML sem referência local quebrada
✓ Home expõe identidade NeuroPed no documento público
✓ Manifest PWA contém start_url, scope e modo standalone
✓ Menu/ferramentas principais existem no bundle publicado
✓ Área de escalas está presente
✓ Filtro/encontrar escala por idade/domínio/queixa está publicado
✓ Fluxo de aplicação possui itens, progresso e resultado
✓ Relatório/PDF ou estado honesto está publicado
✓ Histórico/localStorage ou estado honesto está publicado
✓ CSS responsivo/mobile publicado
✓ Alternância de tema ou tokens de tema publicados
✓ Rota inexistente possui fallback SPA compreensível

12 specs estáticas/e2e passaram. Observação: navegador Playwright real não executado quando @playwright/test não está instalado.
```
