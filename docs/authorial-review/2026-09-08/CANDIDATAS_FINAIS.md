# Versões finais aprovadas — instrumentos autorais NeuroPed SDG

Data: 2026-09-08

Status: **fechamento clínico/editorial aprovado pelo autor**. Estas revisões não criam instrumentos novos, não alegam validação psicométrica e não apagam versões históricas. A implementação operacional é feita por camada de revisão rastreável (`authorialMonitoringReview20260908.json`) sobre as fontes canônicas anteriores, preservando PDF/hash de base.

## Contrato comum aprovado

- natureza autoral NeuroPed SDG e finalidade de monitorização clínica preservadas;
- ausência de validação psicométrica publicada explicitada;
- ausência de pontos de corte diagnósticos e de classificação de gravidade validada;
- escore ou registro nunca deve, isoladamente, estabelecer diagnóstico, indicar/retirar tratamento ou fundamentar perícia;
- `NO`, item não observado, não aplicável ou em branco nunca é convertido em zero;
- comparação longitudinal exige versão, respondente, contexto e janela comparáveis;
- red flags independem de qualquer soma;
- periodicidade de repetição é definida pelo plano clínico, sem imposição global de S4/S8/S12;
- versões predecessoras permanecem rastreáveis e não são sobrescritas silenciosamente.

## AFI-12 SDG — final aprovado

Versão operacional: **1.0**.

Fonte de base: `client/src/data/authorialMonitoring.json#afi12-sdg` e PDF `01_AFI12_Atencao_Freio_Impacto_NeuroPed_SDG.pdf`.

Decisão: manter 12 itens, 2 domínios e pontuação existentes. Acrescentar somente instrução de não imputação de zero quando o item não puder ser observado e periodicidade definida pelo plano clínico.

## SDRD-12 SDG — final aprovado

Versão operacional: **1.0**.

Fonte de base: `client/src/data/authorialMonitoring.json#sdrd12-sdg`.

Decisão: manter conteúdo e pontuação como **monitor breve de sono**. O VIGIA-SD 20 fica definido como monitor ampliado. Para impedir recomendação automática simultânea, o SDRD-12 permanece disponível por nome/rota, mas não participa da recomendação automática baseada em queixa.

## SARF-12 SDG — final aprovado

Versão operacional: **1.0**.

Fonte de base: `client/src/data/authorialMonitoring.json#sarf12-sdg`.

Decisão: manter conteúdo e pontuação. Achados de mastigação, organização oral, progressão de consistências ou deglutição exigem avaliação clínica própria e não devem ser reduzidos a seletividade alimentar. Red flags independem da soma.

## Irritabilidade e Desregulação no Cotidiano — VS1 — final aprovado

Versão operacional: **VS1**.

Fonte de base: `client/src/data/authorialMonitoring.json#irritabilidade-desregulacao-vs1`.

Decisão: manter integralmente itens, domínios, âncoras por número de dias, opção `NO` e regras de incompletude. Papel final: **monitor breve de frequência observável** dentro do cluster de irritabilidade/desregulação.

## NEXO-S 24 — final aprovado

Versão operacional: **1.1-app**.

Fonte de base: `client/src/data/authorialMonitoring.json#nexo-s-24-sdg`; PDF predecessor `NEXO_S_24_NeuroPed_SDG.pdf`, SHA-256 `f1ee15559a36827ebeda1f3a33caaeee534909b7c628725bcaf843e092ce706a`.

Decisão: preservar os 24 itens, 4 domínios, opções 0–4 + `NO` e regra de apuração. Respondentes formalizados: **família, professor/escola e clínico/profissional**, sempre em aplicações separadas e sem combinação numérica entre informantes.

A alteração de respondentes caracteriza revisão operacional do app; o PDF predecessor permanece como base documental e não é apresentado como se já contivesse a revisão 1.1-app.

## MAPA-RI 18 — final aprovado

Versão operacional: **1.1-app**.

Fonte de base: `client/src/data/authorialMonitoringChannel2026.json#mapa-ri-18-sdg`; predecessor v1.0 preservado.

Decisão: manter a semântica v1.1-app, inclusive itens 17–18 em direção de dificuldade e pontuação direta. Papel final: **mapa clínico expandido** de irritabilidade/desregulação, complementar ao VS1 breve.

Comparação v1.0→v1.1 deve declarar quebra de versão; novo basal em v1.1 é recomendado quando possível.

## VIGIA-SD 20 — final aprovado

Versão operacional: **1.1-app**.

Fonte de base: `client/src/data/authorialMonitoringChannel2026.json#vigia-sd-20-sdg`.

Decisão: manter 20 itens, 4 domínios e resposta 0–3. Papel final: **monitor ampliado de sono e repercussão diurna**, opção automática preferencial da linhagem; SDRD-12 permanece como versão breve manual.

## BALANÇO-MED 24 — final aprovado

Versão operacional: **1.2-app**.

Fonte de base: `client/src/data/authorialMonitoringChannel2026.json#balanco-med-24-sdg`; PDF predecessor `BALANCO_MED_24_v1.1_NeuroPed_SDG.pdf`, SHA-256 `98326fc57f8a4ee19c3c37769fddaf067a9064fe52fd529d40d85300ad18ea74`.

Decisões aprovadas:

- manter aplicabilidade da primeira infância à adolescência somente quando o item for observável e pertinente ao nível de desenvolvimento;
- incluir `NO — não observado/não aplicável/informação insuficiente`, sem pontuação;
- usar âncoras predominantemente baseadas em **repercussão funcional**;
- manter os 24 itens e red flags atuais;
- apurar separadamente tolerabilidade (A–D) e lacunas de benefício funcional (E);
- **não calcular nem interpretar total global**;
- cuidador e clínico registram em formulários separados.

O PDF v1.1 permanece como predecessor documental; não é apresentado como equivalente literal à revisão operacional 1.2-app.

## MCRI-24 — final de disposição aprovado

Versão preservada: **1.0**.

Fonte de base: `client/src/data/authorialMonitoringMcri2026.json#mcri-24-sdg`.

Decisão: preservar integralmente para rastreabilidade e histórico, mas **não oferecer como terceira opção paralela ativa** ao VS1 e ao MAPA-RI 18. Não recomendar para novas aplicações rotineiras nesta arquitetura. Registros prévios permanecem válidos como registros da versão utilizada e não devem ser convertidos retrospectivamente para outro instrumento.

Como o MCRI-24 não permanece ativo para novas aplicações rotineiras, as decisões condicionais sobre redesenho de âncoras e retirada do total 0–96 deixam de bloquear o fechamento desta coorte.

## Estado final da coorte

Os nove instrumentos formalmente pendentes nesta linhagem tiveram revisão clínica/editorial encerrada em 08/09/2026. O status de revisão clínica operacional passa a `reviewed` por overlay rastreável, sem alterar os JSON/PDF históricos de base.

A revisão clínica **não** equivale a validação psicométrica. Todos permanecem classificados como instrumentos autorais de monitorização clínica não validados, conforme aplicável.