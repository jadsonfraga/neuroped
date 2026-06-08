# NeuroPed — Filtro Clinico Inteligente: Regra de Ouro Intocavel

Data: 2026-06-08

## Decisao de produto

O Filtro Clinico Inteligente e area nobre do NeuroPed.

Ele deve permanecer destacado no app, mas sua estetica e sua forma de filtrar devem preservar o comportamento consolidado no PR #260.

## Regra principal

Nao alterar a estetica, hierarquia, proporcao, medalhas, cards, fluxo de busca ou forma de filtragem do Filtro Clinico Inteligente sem ordem explicita do Dr. Jadson.

## O que deve ser preservado

- busca textual por termo clinico;
- filtro por idade;
- filtro por queixa clinica;
- ranking obrigatorio com Ouro, Prata, Bronze, Teste Direto e Questionario Escolar;
- cards em coluna com proporcao estavel;
- medalha em linha propria;
- faixa superior por tier;
- classes `container-filtro` e `filter-260-*`;
- responsividade mobile em coluna unica;
- ausencia de zoom, corte visual ou overlay bloqueando clique.

## O que foi permitido nesta rodada

Apenas destacar o acesso ao filtro no app:

- atalho superior no menu lateral;
- reforco visual do item `/filtro` no menu;
- sinalizacao de que o PR260 esta protegido.

## O que nao foi alterado

- `client/src/pages/filtro.tsx` nao foi redesenhado;
- a logica de filtragem nao foi trocada;
- a matriz visual PR260 nao foi substituida;
- o comportamento Ouro/Prata/Bronze foi mantido.

## Arquivos protegidos

- `client/src/pages/filtro.tsx`
- `client/src/index.css`
- `docs/GOLDEN_RULE_FILTRO_PR260.md`

## Critério de aceite

Ao abrir `/filtro`:

1. o filtro deve manter a mesma experiencia visual PR260;
2. a busca por termo deve continuar funcionando;
3. idade e queixa devem continuar filtrando;
4. os cards de recomendacao devem manter medalha, hierarquia e proporcao;
5. nada deve ficar cortado ou com zoom inesperado;
6. o menu deve destacar o filtro como area nobre do app.
