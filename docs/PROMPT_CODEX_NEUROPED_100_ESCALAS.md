# PROMPT CODEX — NEUROPED · CATÁLOGO 100 ESCALAS NEUROPSIQUIATRIA INFANTIL

Você é o engenheiro executor do repositório `jadsonfraga/neuroped`.

## Objetivo
Integrar ao NeuroPed um catálogo clínico profissional com 100 escalas, inventários e testes de neuropsiquiatria infantil/adolescente, usando o arquivo `client/src/data/scales/neuroped_escalas_neuropsiquiatria_infantil_100.json` como fonte de verdade e `client/src/data/scales/neuropedScalesRegistry.ts` como camada utilitária do frontend.

## Regras clínicas e jurídicas
1. Não tratar “gratuito” como “domínio público”.
2. Para `embedPolicy = permission_required` ou `link_only`, não copiar itens, respostas, normas proprietárias, tabelas protegidas ou algoritmos protegidos.
3. Para esses casos, o app deve mostrar apenas metadados clínicos: nome por extenso, sigla, domínio, idade, respondente, finalidade, modo geral de pontuação, fonte e aviso de permissão.
4. Para `embedPolicy = embed_allowed_with_attribution`, ainda assim conferir a fonte oficial antes de embutir itens.
5. Toda escala deve exibir aviso: “Triagem/monitoramento; não estabelece diagnóstico isolado.”

## Entregas obrigatórias
Criar ou atualizar:

- `client/src/data/scales/neuropedScalesRegistry.ts`
- `client/src/data/scales/neuroped_escalas_neuropsiquiatria_infantil_100.json`
- `client/src/features/scales/ScaleFinder.tsx`
- `client/src/features/scales/ScaleCard.tsx`
- `client/src/features/scales/ScaleFilters.tsx`
- `client/src/features/scales/ScaleLicenseBadge.tsx`
- `client/src/features/scales/ScaleClinicalTierBadge.tsx`
- `client/src/features/scales/scalesUtils.ts`
- `docs/ESCALAS_NEUROPED_100_CATALOGO.md`

## Campos obrigatórios no app
Cada escala deve ter:

- `id`
- `number`
- `fullName`
- `acronym`
- `categoryLabel`
- `ageMinYears`
- `ageMaxYears`
- `respondent`
- `clinicalDomain`
- `purpose`
- `clinicalTier`
- `accessStatus`
- `embedPolicy`
- `sourceHint`
- `warning`

## Filtros obrigatórios
Implementar filtros por:

- idade;
- domínio clínico;
- respondente: pais, professor, adolescente, clínico;
- selo clínico: Ouro, Prata, Bronze;
- política de incorporação: embutível, permissão necessária, apenas link;
- busca textual por nome, sigla e finalidade.

## UX obrigatória
A tela deve ser mobile-first:

- cards limpos;
- busca no topo;
- chips de filtro;
- badges Ouro/Prata/Bronze;
- badge de licença;
- aviso visual quando a escala não pode ser embutida;
- botão “Ver ficha clínica”;
- botão “Fonte oficial / verificar permissão”;
- sem excesso de texto na listagem.

## Fluxo de ficha clínica
Ao abrir uma escala, mostrar:

1. Nome completo + sigla.
2. Domínio clínico.
3. Idade indicada.
4. Respondente.
5. Finalidade.
6. Modo geral de pontuação.
7. Como usar no NeuroPed.
8. Política de licença/incorporação.
9. Aviso médico.
10. Fonte sugerida.

## Segurança clínica
Nunca gerar diagnóstico automático definitivo. A saída do app deve usar linguagem:

- “sugere risco”;
- “indica necessidade de avaliação clínica”;
- “compatível com rastreio positivo”;
- “não substitui avaliação médica”.

Evitar:

- “diagnóstico confirmado”;
- “tem autismo”;
- “tem TDAH”;
- “tem depressão”;
- “não precisa de avaliação”.

## Testes
Adicionar testes unitários para:

- total de 100 escalas;
- IDs únicos;
- filtro por idade;
- filtro por domínio;
- filtro por selo clínico;
- filtro por política de licença;
- busca por sigla;
- nenhuma escala com `embedPolicy` inválido.

## Critério de aceite
A implementação só está concluída quando:

- a lista renderiza no mobile sem quebra visual;
- os filtros funcionam;
- as 100 escalas aparecem;
- as políticas de licença são visíveis;
- não há reprodução indevida de itens protegidos;
- build passa;
- testes passam;
- documentação é criada.
