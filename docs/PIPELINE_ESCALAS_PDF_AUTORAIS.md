# Contrato de integração automática de PDFs autorais de escalas

## Regra institucional

Todo PDF autoral de **escala, inventário, questionário, checklist clínico ou protocolo de triagem** gerado para a NeuroPed SDG deve ser transformado, na mesma entrega, em ferramenta aplicável no app NeuroPed por branch e pull request próprios.

A presença do PDF, de uma ficha técnica ou de um link não conta como integração. O ciclo só termina quando o conteúdo útil abre no app, o filtro escolhe corretamente, os limites clínicos estão visíveis e os testes passam.

## Etapas obrigatórias

1. **Auditoria do documento-fonte**
   - confirmar título, versão, data, autoria e total de itens;
   - separar inventários, roteiros, campos abertos, sentinelas e materiais auxiliares;
   - retirar qualquer reprodução indevida de instrumento protegido.

2. **Modelagem clínica**
   - decompor por faixa etária, informante e finalidade real;
   - declarar idade mínima/máxima em meses;
   - declarar respondente, modo de aplicação, alfabetização, linguagem e contexto;
   - listar sinais clínicos específicos e condições que modificam pertinência;
   - não converter escore autoral em diagnóstico ou probabilidade.

3. **Segurança**
   - manter ideação suicida, autolesão, abuso, fuga, regressão, evento neurológico e outros alertas fora do escore;
   - qualquer item sentinela positivo interrompe o fluxo rotineiro e exige avaliação própria;
   - não classificar instrumento amplo como teste específico de suicídio ou psicose sem revisão explícita.

4. **Implementação**
   - cadastrar `ScaleEntry` completo e honesto;
   - criar aplicação interativa, inclusive campos textuais quando pertinentes;
   - adicionar contagem esperada em runtime;
   - registrar o PDF em `generatedScalePdfRegistry.ts`;
   - preservar licença autoral, validação pendente e ausência de ponto de corte.

5. **Filtro clínico**
   - bloqueios duros por idade, informante, alfabetização e requisitos verbais;
   - correspondência por queixa, finalidade e sinais específicos;
   - instrumentos validados permanecem prioritários quando respondem melhor à pergunta clínica;
   - o autoral atua como aprofundamento, triangulação, observação ou organização quando isso for mais adequado;
   - nunca oferecer módulo de outro informante ou faixa etária.

6. **Não regressão e publicação**
   - teste focal do novo PDF;
   - teste genérico do registro de PDFs;
   - TypeScript, catálogo, segurança, ranking, filtro, escalas interativas e build;
   - `guard:open-access` obrigatório: não criar login, senha ou PIN para o uso interno aberto do app;
   - pull request, CI verde, merge e conferência pós-merge.

## Convenções

- Branch: `feat/ipn-<tema>-smart-filter`.
- IDs: `ipn-<tema>-<informante-ou-modulo>-<n>`.
- Fonte: nome do PDF, volume, versão, data, autoria e NeuroPed SDG.
- Status: `complete` somente quando a ferramenta realmente abre e funciona.
- PDF binário: arquivado no Google Drive; o repositório recebe conteúdo operacional, proveniência e contrato, evitando inflar o bundle sem necessidade clínica.

## Definição de pronto

Um PDF de escala está **integrado** somente quando:

- todos os módulos constam no catálogo;
- todos abrem no app;
- as contagens correspondem ao documento;
- o filtro respeita idade, informante e finalidade;
- sentinelas têm fluxo independente;
- limites de validação e direitos autorais estão claros;
- testes e guardas, incluindo acesso aberto, passam;
- a mudança está incorporada à branch principal.
