# Regra de Ouro — Filtro de Escalas PR #260

## Status

Esta regra é permanente e não deve ser quebrada sem ordem e permissão explícita do Dr. Jadson.

## Matriz visual protegida

O filtro de escalas deve preservar o comportamento visual consolidado até o PR #260:

- cards em coluna (`flex-column`);
- ritmo vertical uniforme com `gap` consistente;
- medalha em linha própria;
- faixa de cor no topo do card por tier: ouro, prata e bronze;
- hierarquia estável: medalha → sigla/título → selos → motivo/evidência → ação;
- sem cortes, zoom inesperado ou distorção de imagens/ícones;
- sem sobreposição de texto bloqueando clique;
- sem altura/largura fixa que quebre proporção;
- emojis/medalhas com `line-height: normal`.

## Travas CSS obrigatórias

A base visual deve respeitar:

```css
img {
  max-width: 100%;
  height: auto;
  display: block;
  object-fit: contain;
}

.container-filtro {
  position: relative;
  z-index: 1;
}

.elementos-texto {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
  pointer-events: none;
}
```

Complementos obrigatórios:

- containers visuais com `display: flex`, `justify-content: center` e `align-items: center` quando houver imagem/ícone;
- uso de `aspect-ratio: 1 / 1` para caixas visuais quadradas do filtro;
- evitar qualquer `width` ou `height` fixo em imagem que force desproporção;
- componentes de emoji/medalha devem ter `line-height: normal`;
- texto decorativo/overlay deve usar `pointer-events: none`.

## Arquivos protegidos

- `client/src/pages/filtro.tsx`
- `client/src/index.css`

## Implementação atual

Foram criadas classes de proteção:

- `.container-filtro`
- `.elementos-texto`
- `.filter-260-shell`
- `.filter-260-grid`
- `.filter-260-card`
- `.filter-260-card-content`
- `.filter-260-medalrow`
- `.filter-260-medal`
- `.filter-260-head`
- `.filter-260-symbol`
- `.filter-260-title`
- `.filter-260-subtitle`
- `.filter-260-evidence`
- `.filter-260-why`
- `.filter-260-source`

## Critério de aceite visual

Ao abrir `/filtro`:

1. os cards principais devem aparecer alinhados, sem zoom ou corte;
2. a medalha deve ficar em linha própria;
3. ouro/prata/bronze devem ter faixa superior clara;
4. o texto deve respeitar o fluxo do card sem empurrar imagem/ícone;
5. os cliques nos cards e botões não podem ser bloqueados por overlays;
6. em mobile, os cards devem cair para uma coluna sem quebrar proporção.
