# Inventário de Consolidação NeuroPed — meta 8,5 real

Este documento consolida a missão de maturidade: preservar o patrimônio já criado, reduzir fragmentação e validar a operação do fluxo clínico único sem abrir novas frentes funcionais.

## Fluxo clínico único

O fluxo que deve orientar todas as telas é:

**Paciente → Queixa → Escala → Aplicação → Resultado → Documento → Histórico**

A aplicação agora reforça esse contexto no layout das telas internas, indicando onde o usuário está, qual grupo de navegação está ativo e qual é o próximo passo operacional esperado.

## Inventário por domínio

| Domínio | Evidência | Classificação | Decisão de maturidade |
| --- | --- | --- | --- |
| Páginas e rotas | Rotas declaradas em `client/src/App.tsx` e páginas TSX em `client/src/pages`. | A/B | Manter rotas operacionais; páginas existentes sem import direto devem ser revisadas antes de exclusão. |
| Menus e atalhos | Navegação lateral e paleta de comandos agora usam `client/src/data/navigation.ts`. | A | Fonte única para reduzir divergência entre menu e busca. |
| Escalas e catálogo | Catálogo carregado sob demanda pela paleta e páginas de escalas existentes. | A | Priorizar abertura, resposta, resultado, PDF e histórico em validações futuras. |
| Filtros | Filtro inteligente preservado como entrada clínica principal por queixa/idade. | A | Deve continuar sendo porta de descoberta das escalas. |
| Relatórios/documentos | `ClinicalReport` preservado como saída clínica das escalas. | A | Deve permanecer integrado ao salvamento em paciente e geração de documento. |
| Pacientes/prontuário | Rotas protegidas de pacientes, detalhes e prontuário. | A | Mantidas como eixo do histórico clínico. |
| Preferências/armazenamento local | Tema, sidebar, onboarding, favoritos/recente e preferências são auditados por script. | A/B | Persistir apenas preferências que melhoram previsibilidade; evitar chaves soltas novas. |
| Assets/identidade | Logos, ícones, imagens e assets mobile preservados. | A/B | Lapidar uso e consistência; não criar nova identidade. |
| Componentes equivalentes | Componentes de UI e fluxos clínicos mantidos. | B/C | Consolidar importações e fontes de verdade antes de criar componentes novos. |

## Eliminação de fragmentação aplicada

1. **Navegação centralizada** — a lista de seções, links e ícones foi movida para `client/src/data/navigation.ts`.
2. **Paleta unificada** — a paleta de comandos consome a mesma fonte de navegação, aumentando descoberta sem duplicar listas manuais.
3. **Contexto clínico persistente** — o layout exibe o fluxo clínico único nas telas internas, reforçando “onde estou” e “qual o próximo passo”.
4. **Auditoria programática** — `npm run audit:inventory` valida rotas de navegação, imports de páginas, componentes, módulos, assets e chaves de `localStorage`.

## Critérios de validação para próximas iterações

- Toda rota presente no menu deve existir em `App.tsx`.
- Toda página importada por `App.tsx` deve ter arquivo TSX correspondente.
- Toda entrada de busca/atalho deve vir da fonte central de navegação, salvo escalas carregadas do catálogo.
- Toda escala deve preservar respostas, resultado, relatório e possibilidade de vínculo ao paciente.
- Toda tela interna deve responder: onde estou, o que faço agora e qual é o próximo passo.

## Comando de prova de maturidade

```bash
npm run audit:inventory
npm run validate:catalog
npm run test:clinical
npm run check
npm run build
```

Essas verificações formam a base objetiva para afirmar maturidade operacional sem depender de novas funcionalidades.
