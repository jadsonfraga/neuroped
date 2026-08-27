# Auditoria de descoberta do NeuroPed

A auditoria cruza páginas, rotas, navegação, aliases e política de acesso. Rotas filhas de um hub não são tratadas como esquecidas quando o hub oferece o caminho de entrada.

## Resumo

| Métrica | Quantidade |
|---|---:|
| Arquivos de páginas | 156 |
| Entradas de rota | 153 |
| Itens atuais de navegação | 84 |
| Rotas sensíveis | 34 |
| Literais na allowlist pública | 42 |
| Rotas filhas cobertas por hubs | 72 |
| Rotas sem entrada ou hub | 0 |

## Resultado da descoberta

Todas as entradas de navegação apontam para uma rota ou para o acesso externo intencional do Nesplora. Instrumentos individuais são encontrados pelo Filtro de Escalas, tarefas do Cognitive Lab pelo hub correspondente, detalhes de pacientes pela área Pacientes e subpáginas do Portal da Família pelo próprio portal.

## Rotas sem item de navegação ou hub

Nenhum item encontrado.

## Rotas sensíveis fora da navegação

Nenhum item encontrado.

## Itens de navegação sem rota correspondente

Nenhum item encontrado.

## Arquivos de página sem importação direta

| Classificação | Itens |
|---|---|
| Módulos internos | `filtro-engine` |
| Aliases ou rotas especiais | `efeitos-colaterais`, `portal-novidades` |
| Legados ou duplicatas | `bloco3-showcase`, `diario-epilepsia` |

O relatório não transforma módulos internos, aliases ou duplicatas legadas em links públicos sem uma rota de produto segura. Eles permanecem identificados para evolução futura, enquanto as capacidades maduras recebem hubs ou entradas diretas.
