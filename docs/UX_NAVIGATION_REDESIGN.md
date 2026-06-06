# Redesign de UX e Navegação

## Problema

A home e o menu transmitiam catálogo extenso mais do que produto guiado. O usuário podia rolar listas longas antes de entender o fluxo principal.

## Solução aplicada

- Home com seção “Fluxo clínico principal” e quatro CTAs dominantes.
- Cards secundários agrupados por utilidade.
- Menu lateral com seções recolhíveis.
- Rodapé com links de confiança.

## Arquivos alterados

- `client/src/pages/home.tsx`
- `client/src/components/Layout.tsx`

## Critério de aceitação

- Máximo de quatro CTAs dominantes na home.
- Menu lateral recolhível por grupo.
- Busca visível na home e no menu.
- Mobile mantém cards em grid/coluna com áreas de toque ≥ 44px nos principais controles.

## Evidência

- Componentes `PrimaryAction` e grupos secundários implementados.
- Navegação com `aria-expanded` e `aria-controls` nos grupos.

## Pendências honestas

- Teste com usuários reais não foi realizado.
- Breadcrumb atual ainda é botão “Voltar”; breadcrumb hierárquico completo permanece como próximo passo.
