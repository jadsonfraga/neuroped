# Inventários Autorais Diários — NeuroPed SDG

## Finalidade

O módulo gera um novo inventário clínico estruturado por dia e o preserva como artefato auditável no repositório. Cada registro entra obrigatoriamente como **rascunho em revisão**, identificado como **não validado psicometricamente**.

A geração automática não equivale a publicação clínica. Somente registros promovidos manualmente para `revisado_clinicamente` entram no catálogo operacional exibido pelo aplicativo. Rascunhos e itens arquivados permanecem rastreáveis no repositório, mas não ficam disponíveis como instrumento de uso corrente.

A automação não transforma rascunhos em escalas diagnósticas. Os instrumentos autorais não participam do ranking clínico automático, não possuem ponto de corte e não produzem escore total. Red flags são analisadas separadamente.

## Rotação temática

A matriz contém cinco temas por dia da semana, com ciclo mínimo de 35 dias e bloqueio de repetição por 30 dias:

- domingo: família, adesão, rotina, qualidade de vida e transição do cuidado;
- segunda-feira: comunicação social, pragmática, flexibilidade, brincar e mascaramento;
- terça-feira: funções executivas, atenção, impulsividade, tempo e regulação emocional;
- quarta-feira: ansiedade, humor, somatização e trauma;
- quinta-feira: irritabilidade, agressividade, autoagressão, oposição e uso de telas;
- sexta-feira: leitura, escrita, matemática, fala e altas habilidades;
- sábado: eventos paroxísticos, cefaleia, sono, movimentos involuntários e regressão.

A escolha é determinística e não aleatória. Um tema só retorna após o período de resfriamento, salvo execução manual explícita.

## Governança clínica

Todo registro precisa conter:

- finalidade, faixa etária, respondente, contexto e período de referência;
- três a oito domínios e doze a trinta itens originais;
- linguagem observável, diferenciais e integração clínica;
- limitações explícitas e declaração de que não substitui avaliação clínica;
- modo de interpretação qualitativo, sem escore total;
- ações independentes para cada red flag;
- rastreabilidade de data, versão, modelo e pipeline.

A auditoria bloqueia duplicidade de identificadores, item sem domínio, red flag sem ação, linguagem diagnóstica categórica, pontos de corte inventados, alegações de sensibilidade/especificidade, prescrição ou dose medicamentosa e padrões que sugiram dado pessoal identificável.

## Estados de publicação

1. `rascunho_revisao`: gerado automaticamente, auditável no repositório e **não publicado no catálogo operacional**.
2. `revisado_clinicamente`: promovido manualmente após revisão do conteúdo, redação, segurança e utilidade; é o único estado elegível para aparecer na Biblioteca do aplicativo.
3. `arquivado`: retirado da utilização corrente, preservando rastreabilidade.

A promoção de status nunca é automática.

## Segredos do GitHub

O workflow requer dois segredos no repositório:

- `OPENAI_API_KEY`: chave de projeto da OpenAI usada exclusivamente no servidor do GitHub Actions;
- `NEUROPED_AUTOMATION_TOKEN`: token de automação usado pelo fluxo de versionamento/publicação controlada.

Nenhuma chave deve ser colocada em arquivos `.env`, no cliente Vite ou em commits.

## Execução

A rotina é disparada diariamente às **19h40 no fuso America/Recife**, equivalente a `22:40 UTC`.

Execução manual:

```bash
OPENAI_API_KEY=... \
NEUROPED_GENERATION_DATE=2026-08-09 \
node --import tsx scripts/generate-daily-authorial-inventory.mts
```

Auditoria local:

```bash
node --import tsx scripts/generate-daily-authorial-inventory.mts --validate-only
npm run check
npm run build:client
```

## Catálogo no aplicativo

`client/src/data/dailyAuthorialCatalog.ts` usa `import.meta.glob` para carregar os arquivos JSON em `client/src/data/daily-authorial/`, mas mantém duas fronteiras distintas:

- `dailyAuthorialReviewCatalog`: inventário completo válido, para auditoria/revisão interna;
- `dailyAuthorialCatalog`: somente registros com `status === "revisado_clinicamente"`, que podem aparecer na Biblioteca operacional.

Assim, adicionar um JSON válido ao repositório não o transforma automaticamente em conteúdo clínico publicado.
