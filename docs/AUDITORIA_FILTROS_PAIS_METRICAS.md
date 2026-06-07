# Auditoria NeuroPed — filtros, métricas e área dos pais

Data: 2026-06-07

## Escopo

Auditoria e ajustes para garantir que escalas, questionários, inventários e ferramentas aplicáveis sejam encontráveis pelo filtro, que os números exibidos no app venham de dados reais e que conteúdo educativo não sensível fique concentrado na área dos pais.

## Arquivos alterados

| Arquivo | Alteração | Estado |
| --- | --- | --- |
| `client/src/data/filterableCatalog.ts` | Catálogo suplementar de itens aplicáveis fora de `allScales` | Funcional por revisão de código |
| `client/src/data/appMetrics.ts` | Métricas calculadas a partir de catálogos reais | Funcional por revisão de código |
| `client/src/pages/home.tsx` | Números dinâmicos e busca ampliada | Funcional por revisão de código |
| `client/src/pages/filtro.tsx` | Filtro usa catálogo principal, suplementar e base mundial | Funcional por revisão de código |
| `client/src/data/navigation.ts` | Grupo separado `Pais / Psicoeducação` | Funcional por revisão de código |
| `client/src/pages/portal-familia.tsx` | Área dos pais com conteúdo não sensível e documentos somente se liberados | Funcional por revisão de código |
| `client/src/components/Onboarding.tsx` | Métricas reais e explicação da área dos pais | Funcional por revisão de código |
| `client/src/components/WelcomeTour.tsx` | Tour ampliado com filtro, pais, política de acesso e questionário escolar | Funcional por revisão de código |

## Catálogo suplementar filtrável

Foram adicionados como itens filtráveis: inventários escolares, testes de reconhecimento, testes acadêmicos, autoavaliações, TDE-2, AH/SD x TEA, satisfação medicamentosa, orientação parental e Portal da Família.

## Métricas reais

As métricas passam a vir de `appMetrics.ts`:

- total de escalas: `allScales.length`
- itens filtráveis: catálogo principal + suplementar
- medicações: soma real das drogas cadastradas em `pharmCategories`
- páginas: rotas únicas de `navigablePages`

## Área dos pais

Conteúdo educativo não sensível fica em `Pais / Psicoeducação`. Documentos individualizados continuam dependentes de liberação/código no Portal da Família. Rotas clínicas como prontuário, pacientes e farmacologia permanecem separadas.

## Estado honesto

- Auditoria por código: realizada.
- Implementação: feita em `main`.
- Testes locais `npm run check`, `npm run build` e `npm run validate:catalog`: não executados neste ambiente.
- Validação visual em navegador real: não executada neste ambiente.

## Próximo passo recomendado

Criar um guard de CI para impedir que novas páginas aplicáveis sejam adicionadas sem entrada em `allScales` ou `supplementalFilterableInstruments`.
