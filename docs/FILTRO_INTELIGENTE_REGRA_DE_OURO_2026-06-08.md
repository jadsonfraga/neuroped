# NeuroPed — Filtro Clínico Inteligente: Regra de Ouro Intocável

Data: 2026-06-08

## Decisão permanente de produto

O Filtro Clínico Inteligente é área nobre do NeuroPed.

A estética e a forma de filtrar consolidadas no PR #260 são intocáveis, salvo ordem explícita do Dr. Jadson. Esta regra existe para impedir que ajustes de navegação, deploy, identidade visual ou manutenção técnica redesenhem indiretamente o filtro.

## Escopo permitido

Só é permitido destacar o acesso ao filtro no app, como atalho superior, selo discreto ou realce do item de navegação `/filtro`.

Esse destaque deve respeitar a identidade premium discreta do NeuroPed, sem trocar paleta, sem criar zoom, sem criar corte visual e sem overlay bloqueando clique.

## Arquivo interno protegido

Não redesenhar `client/src/pages/filtro.tsx`.

Qualquer alteração nesse arquivo deve ser tratada como exceção clínica/técnica objetiva, nunca como redesenho visual. Antes de tocar no arquivo, é obrigatório confirmar que a matriz PR260 permanece intacta.

## Elementos que devem ser preservados

- Preservar o ranking Ouro/Prata/Bronze/Teste Direto/Questionário Escolar.
- Preservar a busca textual.
- Preservar o filtro por idade.
- Preservar o filtro por queixa clínica.
- Preservar as classes `container-filtro` e `filter-260-*`.
- Preservar cards em coluna, gap vertical e medalha em linha própria.
- Preservar a faixa superior por tier.
- Preservar a hierarquia visual: medalha → símbolo → título/subtítulo → motivo/evidência → estado → ação.
- Preservar a responsividade mobile em coluna única.
- Preservar a proporção dos ícones com `object-fit: contain` e sem zoom/corte.
- Preservar a ausência de overlay bloqueando clique.

## Trava automatizada

A auditoria `npm run audit:filter` deve reprovar quando tokens essenciais do PR260 desaparecerem de:

- `client/src/pages/filtro.tsx`;
- `client/src/index.css`;
- `docs/GOLDEN_RULE_FILTRO_PR260.md`.

## Critério de aceite

Ao abrir `/filtro`, o usuário deve ver o Filtro Clínico Inteligente valorizado como área central do NeuroPed, mas com a estética, hierarquia, proporção e forma de filtragem do PR #260 preservadas integralmente.
