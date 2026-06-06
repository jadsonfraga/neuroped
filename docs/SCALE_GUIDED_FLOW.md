# Fluxo Guiado de Escalas

## Problema

O filtro tinha poder de busca e sinônimos, mas não deixava claro o raciocínio clínico: idade, queixa, objetivo, contexto e recomendação.

## Solução aplicada

- Filtro agora exibe stepper de 5 etapas.
- Idades foram reagrupadas conforme faixas clínicas solicitadas: 0–2, 2–5, 6–12, 13–17 e adulto jovem.
- Foram adicionados objetivo clínico e contexto de aplicação.
- Cards de escala mostram nome completo, tempo, idade, respondente, quando usar, quando evitar e ações.

## Arquivos alterados

- `client/src/pages/filtro.tsx`

## Critério de aceitação

- Usuário não precisa conhecer siglas previamente.
- Botão “Limpar filtros” visível quando há seleção.
- Resultado apresenta prioridade e contexto básico de uso.
- Mobile usa grids responsivos.

## Evidência

- UI de objetivo/contexto implementada.
- Cards exibem `fullName`, faixa etária e limitações.

## Pendências honestas

- Objetivo/contexto ainda são usados principalmente como orientação visual; próxima etapa deve incorporá-los ao ranking algorítmico.
- “PDF/relatório” ainda depende da implementação individual de cada escala.
