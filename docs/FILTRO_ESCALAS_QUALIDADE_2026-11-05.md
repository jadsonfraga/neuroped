# Filtro Clínico — qualidade do trio de escalas (estado atual)

Data: 2026-11-05 · Branch: `claude/filtro-escalas-clinico-v2` · Base: `origin/main` (`ef8db5c`)

Este documento descreve o comportamento **do código atual**, auditado antes e depois
das mudanças. Os documentos históricos (ex.: `FILTRO_INTELIGENTE_REGRA_DE_OURO_2026-06-08.md`)
não representam mais o código e não devem ser usados como fonte de comportamento.

> Revisão clínica pendente: textos de lacuna, papel das medalhas e critérios de
> encaixe etário devem ser lidos pelo responsável clínico antes de uso em produção.
> Nada aqui é norma, ponto de corte, diagnóstico ou equivalência psicométrica.

## 1. Fluxo auditado (antes)

| Etapa | Onde | Comportamento |
|---|---|---|
| Idade | `client/src/lib/filterClinicalInput.ts` (`resolveFilterAge`) | Exata (anos/meses, até 216 m) ou faixa. **Faixa resolvia `ageMonths` = ponto médio.** Idade inválida falha fechado. |
| Queixas e busca livre | `inferComplaintIds`, `parseFilterQueryIntent` | Expressão inteira; respondente/tempo/finalidade só viram filtro após um toque. |
| Sinais | `scaleCoversSelectedSignalExactly` | Igualdade normalizada de tag/rótulo (não substring). |
| Bloqueios e filtros obrigatórios | `advancedFilterLogic.ts` (`passesMandatoryFilters`, `clinicalHardBlock`) | Queixa, respondente, monitorização, risco agudo, idade, alfabetização, verbalidade, TDAH < 4 anos. |
| Score | `calculateRefinedScore` | 0–100. **Idade em faixa usava o ponto médio.** |
| Curadoria | `clinicalRanking.ts` + `signalFlowcharts` (precedência) | Ouro/Prata/Bronze por queixa × idade. **Idade em lacuna devolvia a regra de outra idade (`rules[0]`).** |
| Pódio | `filterPodium.ts` (`selectPodium`) | Camadas de qualidade (≥60), cobertura de queixas, aplicabilidade, resgate por sinal, teto de 100 perguntas (`podiumHardCap.ts`), complementaridade funcional (`filterPodiumComplementarity.ts`). **Faixa era validada pelo ponto médio. Mesmo construto podia ocupar Prata e Bronze.** |
| Direto e escola | `selectPodium` (`direct`, `school`) | Categorias separadas do trio; fora do teto de 100. |
| Rotas e catálogo | página `filtro-engine.tsx` | Só catálogo que abre no app (`opensInApp`, `isFullApp`). |
| Exportação | `client/src/lib/filterExport.ts` | CSV e PDF com faixa do instrumento; sem encaixe com a idade informada e sem lacunas. |

### Defeitos confirmados (antes)

1. **Ponto médio como idade exata** em: regra TDAH < 4 anos (`clinicalHardBlock`), score
   etário, `containsAge` do pódio, teto de 100, complementaridade e curadoria.
2. **Curadoria de outra idade**: idade exata em lacuna entre regras devolvia a primeira regra da queixa.
3. **Redundância residual**: 17 de 12.364 contextos sintéticos tinham duas formas do mesmo
   instrumento (família SWYC Marcos, um formulário por janela estreita, mesmo `overlapGroup`)
   em Prata e Bronze.
4. **Lacuna silenciosa de sinal**: sinal marcado sem cobertura no trio, sem explicação ao usuário.

## 2. Mudanças por patamar

### Patamar 1 — idade honesta (faixa não é idade exata)

- `client/src/data/scaleAgeFit.ts` (novo): classificador único `exact | full | partial | none | unknown`.
- Contrato do motor: `FilterContext.ageMonths` é **somente idade exata**. Em faixa fica `null`
  e a faixa vai em `ageBand`. A página (`filtro-engine.tsx`) faz essa conversão.
- `calculateRefinedScore`: com faixa e sem idade exata, pontua cobertura da faixa
  (cobertura total 26; parcial 14; sem sobreposição 0). Idade exata continua como antes.
- `clinicalHardBlock`: regra TDAH < 4 anos usa o extremo mais novo da faixa, como as demais travas.
- `selectPodium`: em faixa, a preferência é cobertura **total** da faixa; parcial continua
  elegível como fallback, com aviso. Teto e complementaridade validam por sobreposição (bloqueio), não por ponto médio.
- `getClinicalTiers(queixa, ageMonths, ageBand)`: em faixa escolhe a regra que cobre a faixa;
  sem regra total, a de maior sobreposição. Idade exata em lacuna devolve `undefined`.

### Patamar 2 — redundância resolvida e lacunas explicadas

- `resolveRedundantMedals` (`filterPodiumComplementarity.ts`): para Prata e Bronze, nesta ordem:
  1. troca por candidata segura de outro construto que preserve cobertura de queixas e sinais;
  2. mantém a duplicata **só** se cobrir queixa ou sinal que nenhuma outra medalha cobre (registrado);
  3. senão remove a duplicata (uma forma do instrumento basta; o pódio não preenche vaga por obrigação).
- `selectPodiumDetailed` expõe as decisões; `selectPodium` mantém a assinatura anterior.
- `client/src/data/filterPodiumAudit.ts` (novo, função pura): lista lacunas com motivo:
  queixa sem instrumento no trio (com ou sem candidata segura), sinal sem cobertura
  (com motivo de teto de 100 quando for o caso), redundância mantida ou removida,
  medalha de cobertura parcial de faixa, trio com menos de três medalhas.

### Patamar 3 — experiência e transparência

- Cada medalha (Ouro, Prata, Bronze) mostra: papel (principal, complementar, terceira
  perspectiva), o que acrescenta em relação às demais, quem responde, tempo estimado,
  encaixe etário e se abre no app (já existente, em "Estado").
- Teste direto e escolar são rotulados como categoria separada, fora do teto de 100 do trio.
- Painel "Lacunas e avisos do trio" acima da grade.
- Botão **Trocar esta escala** em Ouro/Prata/Bronze: recalcula o trio **sobre o conjunto já seguro**
  (bloqueios, idade, respondente e risco não são contornados). Botão **Restaurar pódio sugerido**.
  As trocas são zeradas quando o perfil muda.
- Exportação CSV/PDF: colunas "Papel no trio" e "Encaixe etario" no fim do CSV (ordem anterior preservada) e linha/seção "Lacunas do trio".

## 3. Invariantes que a suíte verifica

- Idade exata: toda medalha contém a idade. Faixa: toda medalha se sobrepõe à faixa.
- Respondente escolhido: toda medalha aceita esse respondente (teste direto: modo de aplicação).
- Risco agudo (suicídio/psicose): sem fallback de triagem ampla e sem domínio estranho; sem instrumento seguro, o resultado é vazio.
- Teto: soma de Ouro + Prata + Bronze ≤ 100 perguntas.
- Redundância: no máximo uma forma por `overlapGroup` no trio, salvo justificativa registrada.
- Idade inválida: nenhuma recomendação.
- Principal sempre aplicável no app quando há alternativa; medalha que não abre é declarada como tal.
- TDAH como queixa principal abaixo de 4 anos continua bloqueado, inclusive em faixa.

## 4. Métricas (contextos sintéticos sobre o catálogo real)

Reprodução: `node --import tsx tests/tools/filter-quality-metrics.ts --json`
(12.364 contextos: idade exata, faixa, 1–2 queixas, sinais marcados, respondentes).

| Métrica | Antes | Depois |
|---|---:|---:|
| Trio com 3 medalhas (%) | 48,7 | 48,7 |
| Queixa coberta quando há candidata segura (%) | 99,1 | 99,1 |
| Medalhas com cobertura total da faixa (%) | 87,0 | 89,2 |
| Medalhas só parciais em faixa (contagem) | 885 | 736 |
| Pares de mesmo construto no trio (contagem) | 17 | 0 |
| Sinal marcado coberto pelo trio (%, contextos com sinal) | 50 | 50 |
| Violações de idade exata, faixa, respondente, teto, risco | 0 | 0 |
| Medalhas não aplicáveis no app | 0 | 0 |
| Contextos com curadoria aplicada | 12.364 | 11.726 |

Leitura: a redundância e a cobertura de faixa melhoraram. **A cobertura de sinais não melhorou**:
nos contextos restantes a candidata que cobre o sinal não cabe no teto de 100 junto com Ouro e Prata.
Agora essa lacuna aparece ao usuário com o motivo, em vez de passar em silêncio. A queda em
"curadoria aplicada" é esperada: lacunas de idade deixaram de receber regra de outra idade.

## 5. Testes e comandos

Todos executados em `ef8db5c` + mudanças desta branch (ver registro de execução no PR).

- `npm run test:filter` (inclui `tests/unit/filter-scale-quality.test.ts`, 33 testes novos)
- `npm run test:podium`, `npm run test:ideal-choice`, `npm run test:practical-filter`
- `npm run test:clinical`, `npm run test:interactive`, `npm run test:quick-wins`
- `npm run check`, `npm run lint`, `npm run build:client`

Alteração em gate existente (divulgada): `tests/clinical/test-filter-age-complaint.mjs` mantém a
asserção original de `curatedAgeMonths` e acrescenta asserções do novo contrato
(`ageMonths` nulo em faixa). Nenhuma asserção foi removida.

## 6. Limitações conhecidas

- Sinais que só cabem com instrumento de orçamento acima do teto de 100 perguntas continuam fora
  do trio. A decisão de ampliar o teto ou priorizar o instrumento é clínica.
- O resultado com três medalhas depende da densidade do catálogo e dos bloqueios de segurança;
  não é meta por si só.
- O resolvedor (`resolveFilterAge`) continua calculando o ponto médio da faixa como representante.
  Nenhum consumidor da página o usa para validar instrumento; o contexto do motor recebe `ageMonths` nulo em faixa.
- Textos novos (papel, lacunas, encaixe) não foram revisados clinicamente.
- "Trocar escala" não persiste entre sessões e é zerado quando o perfil muda.
- Mudanças de score em faixa alteram a ordem de candidatas; a validação foi feita pela suíte
  existente e pelas métricas acima, não por revisão clínica dos perfis.
- `client/src/pages/filtro.tsx` (wrapper de `/filtro`) não foi alterado. A alteração está em
  `filtro-engine.tsx`, de forma aditiva. O documento histórico de "regra de ouro" pede aprovação
  explícita para alterações de estética do filtro; o responsável deve confirmar essa aprovação.
- Não há alteração de normas, pontos de corte, validação brasileira, licenças ou metadados do catálogo.
