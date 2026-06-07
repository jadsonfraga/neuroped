# Consolidação visual premium — NeuroPed

## Objetivo

Consolidar o ciclo de uso das imagens e artes do repositório com função estética clara, sem redesign e sem poluição visual.

## Regra-mãe

As imagens não devem ser usadas como enfeite solto. Cada arte deve cumprir pelo menos uma função:

- orientar a leitura;
- humanizar a tela;
- marcar contexto clínico;
- criar respiro editorial;
- reforçar identidade institucional;
- apoiar família/recepção/médico sem competir com dados.

## Travas visuais aplicadas

1. Uso preferencial do componente `PremiumVisualPanel`.
2. Imagens com opacidade reduzida.
3. Overlay forte para manter legibilidade.
4. Badge curto e título clínico, sem texto de bastidor.
5. Máximo de uma imagem editorial relevante por tela.
6. Nada de redesign da home, sidebar, cards, botões ou paleta.
7. Evitar repetir mascote/imagem quando a tela já tiver densidade visual alta.

## Componentes consolidados

### `BrandAssets.tsx`

Centraliza a identidade visual:

- escudo novo Dr. Jadson como logo mestre;
- logo roxo NeuroPed como símbolo legado/secundário;
- mascotes do Dr. Jadson;
- ilustrações clínicas;
- imagens institucionais.

### `PremiumVisualPanel.tsx`

Componente-padrão para inserir arte sem piorar o visual:

- `loading="lazy"`;
- opacidade reduzida;
- saturação controlada;
- gradiente de proteção textual;
- borda discreta;
- linha superior sutil;
- badge e copy clínica curta.

## Mapa final de uso das artes

| Asset | Uso consolidado |
|---|---|
| Escudo Dr. Jadson Fraga | Logo mestre, favicon, desbloqueio, BrandMark e watermark. |
| Logo NeuroPed roxa | Acento histórico discreto na Home; não compete com o escudo. |
| Child assessment | Pré-consulta guiada. |
| Team multiprofessional | Painel da recepção. |
| Child development | Portal dos Pais / Psicoeducação. |
| Mental health child | Guia de Psiquiatria Infantil. |
| Hero brain | Fundo sutil no desbloqueio/local unlock. |
| Mascote SuperNeuroPed | Home e estados de acolhimento. |
| Consultório Superman/Batman/Selfie/Full/Arte | Página Sobre e humanização institucional. |
| Neural abstract | Hero institucional e contexto visual nobre. |

## Textos lapidados

Foram removidas frases técnicas como “a imagem entra como apoio visual” e substituídas por linguagem clínica real.

### Pré-consulta

“Antes da consulta, a história já começa a ficar mais clara.”

### Recepção

“Família, equipe e médico chegam à consulta falando a mesma língua.”

### Portal dos Pais

“Orientação clara para a rotina, a escola e os próximos passos.”

### Psiquiatria Infantil

“Ansiedade, humor e comportamento precisam de leitura clínica cuidadosa.”

## Resultado esperado

O app deve parecer mais institucional, humano e premium sem parecer decorado, infantilizado ou visualmente carregado.

## Pendências recomendadas para próximo ciclo

1. Rodar `npm run build` no ambiente de desenvolvimento.
2. Verificar mobile real no iPhone.
3. Confirmar que o service worker não está servindo cache antigo.
4. Revisar se há assets órfãos adicionais fora de `BrandAssets.tsx`.
5. Aplicar a arquitetura final de acesso por rota quando o ambiente permitir alteração do gate global.
