# Filtro clínico: compatibilidade do trio

Base auditada: NeuroPed `7a001180a75820f49720a28f16bf358410a688b4`. Os perfis são fictícios e não produzem recomendações para pacientes reais. Nenhum metadado clínico do banco foi alterado.

## Acervo e cobertura

- **846 registros** no catálogo geral (inclui fichas de referência); a auditoria de implementação e rotas passou. A auditoria clínica interna contou **340 aplicações completas**, 31 domínios e 45 aplicações parciais bloqueadas. São contagens de escopos distintos, não prova de validade clínica.
- A matriz abaixo usou **352 candidatas** do catálogo inicial do filtro, incluindo as opções locais complementares; não representa o registro mundial carregado depois. Nesse recorte, **28** ficaram sem carga de itens verificada na consulta do motor, **83** tinham a marcação interna de pendência e **16** não tinham referência nos campos `fonte` ou `pubmedId`. Ausência nesses campos não prova falta de publicação, licença ou validação.
- Em **480 combinações** do motor (12 perfis de queixas, 8 idades exatas, 5 opções de respondente): 217 trios, 70 duplas, 43 opções únicas e 150 pódios vazios. Não apareceram incompatibilidade com a idade exata ou com o respondente explicitamente escolhido, nem estouro de 100 itens. Em 79 combinações apareceu pelo menos uma opção ampla e, em 3, só havia triagem ampla no pódio. A matriz não mede sensibilidade, especificidade ou validade diagnóstica.

## Checagem documental prioritária

- **Q-CHAT-10:** o catálogo e a tela interativa informam 18–36 meses. O [formulário original](https://docs.autismresearchcentre.com/tests/QCHAT-10.pdf) e a [versão brasileira hospedada pelo Autism Research Centre](https://www.autismresearchcentre.com/content/uploads/2024/11/Q-CHAT-10-VERSAO-BRASILEIRA.pdf) descrevem 18–24 meses. O [estudo de Raza e colegas](https://pubmed.ncbi.nlm.nih.gov/30694516/) aplicou a escala aos 18 e 24 meses, com a avaliação diagnóstica aos 36 meses. A idade de seguimento não é faixa de aplicação. Priorizar conferência clínica e revisão conjunta do cadastro e da aplicação; nenhuma mudança desses metadados nesta entrega.
- **BISQ:** o catálogo declara 0–36 meses; a amostra clínica do [estudo original de Sadeh](https://publications.aap.org/pediatrics/article/113/6/e570/64359/A-Brief-Screening-Questionnaire-for-Infant-Sleep) abrangeu 5–29 meses. A amostra, sozinha, não prova o limite de uso. Confirmar qual versão e qual fonte sustentam os extremos cadastrados antes de alterar.

## Duas correções verificáveis

1. **Faixa integral no teto de itens.** Ao replanejar sob o mesmo custo e cobertura clínica, um estado de maior ranking podia eliminar um estado que atendia toda a faixa, embora o comparador final priorizasse cobertura integral. O teste sintético reproduziu a troca indevida; a seleção de estados agora respeita o mesmo desempate. A comparação adicional de 1.225 combinações de faixas do catálogo real não encontrou perda ou ganho no número de escalas de cobertura integral, indicando que o defeito reproduzido é um caso de borda.
2. **Triagem ampla não equivale a escala específica.** O fluxo real do navegador com perfil fictício de 6 meses e seleção da queixa de atenção exibiu “Escala principal: Responde primeiro à pergunta clínica principal” apesar de oferecer só triagem ampla. Cartão, plano, síntese e dados de exportação agora distinguem essa condição, sem percentual de encaixe nessas opções. A triagem ampla continua disponível quando indicada; as travas existentes não mudaram.

## Repetição e próxima decisão

- `node --import tsx scripts/audits/scale-trio-compatibility.mts`: matriz resumida, separada do QA em navegador.
- `npm run audit:instruments`, `npm run audit:scales:clinical`, `npm run test:podium`, `npm run test:filter`, `npm run test:ideal-choice`.
- `node tests/e2e/filter-age-complaint.mjs`: fluxo compilado em 390 e 1.280 px, incluindo o caso de triagem ampla; a ida filtro → escala interativa sintética → PDF → filtro passou com o build remoto, conforme o workflow do projeto. O mecanismo de seleção roda no cliente; não é correto atribuir a estes testes persistência clínica no backend.
- O gate existente de métricas passou em 12.364 contextos sintéticos, além da suíte de pódio. Isso não comprova desempenho diagnóstico.
- Revisar primeiro as fontes, finalidade, idade e carga dos instrumentos mais escolhidos. Só comparar/completar metadados clínicos com fonte primária pertinente; manter teste direto, contexto escolar e triagem ampla distintos da escala específica. O limite de tempo atual filtra por instrumento e não é garantia do tempo total do trio.
- Rollback: reverter o commit desta revisão. Não há migração, segredo, alteração de CI nem modificação em produção.
