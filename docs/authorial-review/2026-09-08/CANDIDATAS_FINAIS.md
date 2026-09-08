# Candidatas finais — instrumentos autorais NeuroPed SDG

Data: 2026-09-08

Estas candidatas são revisões editoriais rastreáveis, não novos instrumentos. O conteúdo de itens e domínios permanece herdado da fonte canônica atual. Nenhuma candidata altera produção, substitui arquivos históricos ou muda `clinicalReviewStatus` antes da aprovação médica.

## Contrato comum

- manter o caráter autoral e de monitorização clínica;
- declarar ausência de validação psicométrica publicada e de pontos de corte diagnósticos;
- não converter resposta ausente/NO/não observada em zero;
- comparar longitudinalmente apenas versão, respondente e contexto compatíveis;
- tratar alertas clínicos independentemente da soma;
- periodicidade de repetição definida pelo plano clínico, e não imposta globalmente pelo aplicativo.

## AFI-12 SDG

Candidata: `AFI-12-SDG@1.0-rc-final.20260908`.

Fonte congelada: `client/src/data/authorialMonitoring.json#afi12-sdg`, v1.0.

Manter 12 itens, 2 domínios e pontuação atuais. Acrescentar apenas instrução sobre resposta não observável e retirar da interface a imposição global de S4/S8/S12.

Status: candidata editorialmente fechada, sem alteração estrutural.

## SDRD-12 SDG

Candidata: `SDRD-12-SDG@1.0-rc-final.20260908`.

Fonte congelada: `client/src/data/authorialMonitoring.json#sdrd12-sdg`, v1.0.

Manter conteúdo e pontuação. Acrescentar regra de resposta não observável. Se mantido junto ao VIGIA-SD 20, usar rótulo funcional de monitor breve de sono.

Bloqueio: decisão clínica sobre coexistência com VIGIA-SD 20.

## SARF-12 SDG

Candidata: `SARF-12-SDG@1.0-rc-final.20260908`.

Fonte congelada: `client/src/data/authorialMonitoring.json#sarf12-sdg`, v1.0.

Manter conteúdo e pontuação. Acrescentar instrução de resposta não observável e nota de que achados orais/motores/de deglutição exigem avaliação própria, não sendo reduzidos a seletividade.

Status: candidata editorialmente fechada, sem alteração estrutural.

## Irritabilidade e Desregulação no Cotidiano — VS1

Candidata: `IRRITABILIDADE-VS1@VS1-rc-final.20260908`.

Fonte congelada: `client/src/data/authorialMonitoring.json#irritabilidade-desregulacao-vs1`, VS1.

Manter integralmente itens, domínios, âncoras por dias, opção NO e regras de incompletude. Alterar somente o posicionamento no catálogo depois da decisão sobre o cluster de irritabilidade.

Bloqueio: relação funcional com MAPA-RI 18 e MCRI-24.

## NEXO-S 24

Candidata: `NEXO-S-24@1.0-rc-final.20260908`.

Fonte congelada: `client/src/data/authorialMonitoring.json#nexo-s-24-sdg`, v1.0. Proveniência registrada: `NEXO_S_24_NeuroPed_SDG.pdf`, SHA-256 `f1ee15559a36827ebeda1f3a33caaeee534909b7c628725bcaf843e092ce706a`.

Manter 24 itens, 4 domínios, opções 0–4 + NO e regra de soma atual. Corrigir somente tipografia/diacríticos do artefato e uniformizar instruções.

Bloqueio: decidir se o respondente canônico permanece apenas `pais` ou inclui escola/profissional, sempre em aplicações separadas.

## MAPA-RI 18

Candidata: `MAPA-RI-18@1.1-rc-final.20260908`.

Fonte operacional congelada: `client/src/data/authorialMonitoringChannel2026.json#mapa-ri-18-sdg`, v1.1-app.

Manter a semântica v1.1-app, inclusive os itens 17–18 em direção de dificuldade e pontuação direta. O predecessor v1.0 deve permanecer preservado. Comparação v1.0→v1.1 deve declarar quebra de versão; novo basal em v1.1 é recomendado.

Após aprovação, gerar novo snapshot/PDF a partir do JSON vigente, com novo hash e referência explícita ao predecessor, sem declarar recuperação literal de arquivo não verificado.

Bloqueio: papel no cluster de irritabilidade.

## VIGIA-SD 20

Candidata: `VIGIA-SD-20@1.1-rc-final.20260908`.

Fonte operacional congelada: `client/src/data/authorialMonitoringChannel2026.json#vigia-sd-20-sdg`, v1.1-app.

Manter 20 itens, 4 domínios e resposta 0–3. Acrescentar regra de não imputação quando o item não for observável/aplicável. Novo snapshot/PDF, se aprovado, deve ser criado do JSON vigente e receber novo hash.

Bloqueio: manter SDRD-12 como versão breve ou deprecar uma das entradas, preservando histórico.

## BALANÇO-MED 24

Candidata: `BALANCO-MED-24@1.1-rc-final.20260908`.

Fonte operacional congelada: `client/src/data/authorialMonitoringChannel2026.json#balanco-med-24-sdg`, v1.1-app.

Manter os 24 itens e alertas atuais enquanto as decisões abaixo não forem tomadas. Ajustes editoriais já seguros: aplicações de cuidador e clínico separadas; direção de escore preservada pela leitura de benefício como lacuna/insuficiência; novo snapshot rastreado a partir do JSON vigente.

Bloqueios clínicos: faixa etária mínima/estratégia por desenvolvimento; inclusão ou não de opção NO; manutenção ou retirada do total global; manutenção das âncoras atuais ou escolha de um único eixo ordinal.

## MCRI-24

Candidata: `MCRI-24@1.0-rc-final.20260908`.

Fonte operacional congelada: `client/src/data/authorialMonitoringMcri2026.json#mcri-24-sdg`, v1.0.

Manter 24 itens, 6 domínios, NO e alertas. Dar prioridade editorial ao perfil por domínio. Novo snapshot/PDF deve nascer do JSON vigente e receber novo hash.

Bloqueios clínicos: manter ou redesenhar âncoras que hoje combinam múltiplos eixos; manter ou suprimir a soma global; definir papel em relação a VS1 e MAPA-RI 18.

## Estado final da coorte candidata

- sem mudança estrutural: AFI-12 e SARF-12;
- conteúdo preservado, decisão de posicionamento: SDRD-12, VS1, MAPA-RI 18 e VIGIA-SD 20;
- conteúdo preservado, decisão de respondente: NEXO-S 24;
- decisão de arquitetura de mensuração ainda necessária: BALANÇO-MED 24 e MCRI-24.

Nenhum registro deve ser marcado `reviewed` automaticamente com base neste arquivo.