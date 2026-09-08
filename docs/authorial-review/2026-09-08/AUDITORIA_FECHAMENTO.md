# Auditoria editorial/clínica — instrumentos autorais NeuroPed SDG

Data de corte: 2026-09-08

Status deste documento: **auditoria em branch não produtiva**. Nenhum instrumento publicado foi substituído, nenhum `clinicalReviewStatus` foi alterado e nenhuma revisão foi apresentada como validação psicométrica.

## 1. Escopo canônico

A coorte formalmente pendente foi definida por `clinicalReviewStatus: "pending"` nas três fontes autorais efetivamente agregadas pelo aplicativo:

- `client/src/data/authorialMonitoring.json` — blob `9f357d89cbbc8eb67f9b5f81ee2d79915b54e476`;
- `client/src/data/authorialMonitoringChannel2026.json` — blob `b1f219ac018e1050b739824d5edaa8fbdd5278db`;
- `client/src/data/authorialMonitoringMcri2026.json` — blob `587574604874df78eb60b585bfb21439bc3d6864`.

A integração no app é feita por `client/src/data/authorialMonitoring.ts` — blob `ebec042ad3222553c96981ed7e05d744df3ae06d`.

A coorte contém **9 instrumentos**: AFI-12 SDG, SDRD-12 SDG, SARF-12 SDG, Irritabilidade e Desregulação no Cotidiano — VS1, NEXO-S 24, MAPA-RI 18, VIGIA-SD 20, BALANÇO-MED 24 e MCRI-24.

O índice mestre histórico do Google Drive contém outros instrumentos com pendências editoriais genéricas. Eles **não foram promovidos automaticamente** a esta coorte, porque isso confundiria backlog histórico com o estado formal `clinicalReviewStatus`. Foram usados apenas para detectar duplicação e risco de coexistência.

## 2. Regras de fechamento preservadas

Para todos os nove instrumentos:

- caráter autoral NeuroPed SDG preservado;
- uso restrito a monitorização clínica/organização longitudinal;
- nenhuma alegação de validação, norma, sensibilidade, especificidade, percentil, ponto de corte ou gravidade psicométrica;
- nenhum escore deve, isoladamente, estabelecer diagnóstico, indicar/retirar tratamento ou fundamentar perícia;
- comparação longitudinal exige, sempre que possível, mesma versão, respondente, contexto e janela;
- `NO`, item não observado ou item em branco nunca deve ser convertido em zero;
- red flags independem da soma;
- versões predecessoras permanecem rastreáveis; não há sobrescrita silenciosa.

## 3. Achados transversais no aplicativo

### 3.1 Instrução de respondente

A implementação atual trata qualquer instrumento sem `professor` como se fosse exclusivamente preenchido por responsável/cuidador. Isso diverge do BALANÇO-MED 24, que declara `pais` e `clinico`.

**Correção editorial não regressiva proposta:** instrução condicional para `clinico`, mantendo aplicações de cuidador e clínico separadas e comparáveis longitudinalmente.

### 3.2 Seguimento fixo indevido

A interface acrescenta globalmente `Seguimento: Basal, S4, S8 e S12`, embora essa periodicidade não seja contrato comum a todos os instrumentos.

**Correção não regressiva proposta:** substituir por “repetir no intervalo definido pelo plano clínico, mantendo versão, respondente e contexto comparáveis”. Quando o PDF original explicitamente sugerir S4/S8/S12, a sugestão histórica permanece no documento de origem, sem ser imposta globalmente.

### 3.3 Proveniência apresentada como PDF disponível

O catálogo usa a frase “PDF autoral fornecido ao fluxo NeuroPed” para todo registro. Em MAPA-RI 18, VIGIA-SD 20, BALANÇO-MED 24 e MCRI-24, os nomes/hash de revisões canônicas estão registrados no JSON, porém algumas dessas revisões não foram localizadas nas fontes conectadas consultadas.

**Correção não regressiva proposta:** a interface deve dizer “proveniência autoral registrada” e manter nome/hash/data, sem afirmar disponibilidade física do PDF quando ela não foi verificada.

### 3.4 Comentário de código ambíguo

O comentário `Validated authorial sources` pode ser lido como validação clínica/psicométrica, embora o código faça apenas validação estrutural de esquema.

**Correção editorial proposta:** `Schema-validated authorial sources` ou equivalente em português técnico.

## 4. Auditoria por instrumento

### AFI-12 SDG — v1.0

**Fonte canônica:** `authorialMonitoring.json`; PDF `01_AFI12_Atencao_Freio_Impacto_NeuroPed_SDG.pdf`, SHA-256 `f2123c61e7f03c52e20a24348b444f5c66293457c76b87756c0800435221b74d`.

**Paridade:** itens, domínios, faixa 5–17 anos, janela de 7 dias e estrutura 0–3 estão coerentes entre PDF/JSON/app.

**Achados:** itens 1–3 são próximos semanticamente, mas distinguem perda de fio, abandono de etapas e troca prematura de tarefa; não há duplicação suficiente para justificar fusão. Item 12 funciona como resumo funcional e pode carregar tanto atenção quanto freio, sem erro estrutural. Falta explicitar no papel a regra de item não observável já protegida no app.

**Candidata:** conteúdo clínico e pontuação congelados; acrescentar apenas instrução de não imputação de zero e periodicidade de seguimento definida pelo plano clínico.

### SDRD-12 SDG — v1.0

**Fonte canônica:** `authorialMonitoring.json`; PDF `02_SDRD12_Sono_Despertares_Repercussao_Diurna_NeuroPed_SDG.pdf`, SHA-256 `df63139cd65e52c46f99c772362b6ba36fcaad57794ab9616dbae7dce1c26225`.

**Paridade:** boa entre PDF/JSON/app.

**Achado principal:** sobreposição extensa com VIGIA-SD 20. O SDRD-12 é operacionalmente uma versão breve; o VIGIA-SD 20 cobre quase todo o seu conteúdo e acrescenta ritmo, ronco/eventos noturnos, impacto familiar e granularidade adicional.

**Candidata:** conteúdo congelado. Pode permanecer como “monitor breve de sono” somente se essa função for explicitamente aprovada; caso contrário, deve ser deprecado no catálogo com histórico preservado, nunca apagado.

### SARF-12 SDG — v1.0

**Fonte canônica:** `authorialMonitoring.json`; PDF `03_SARF12_Seletividade_Alimentar_Repertorio_Funcional_NeuroPed_SDG.pdf`, SHA-256 `d0c55e5b29718bdf7b0ccfdb869914ce4f81d69b9dc5c38586c8ffb60194d8e9`.

**Paridade:** boa entre PDF/JSON/app; faixa 2–14 anos e janela de 7 dias coerentes.

**Achados:** item 7 inclui mastigação/organização oral/avanço de consistências e não deve ser interpretado como simples seletividade sensorial. Não há motivo para excluir o item, pois ele aumenta segurança clínica. Itens 11–12 são funcionais/impacto e não redundantes com repertório.

**Candidata:** manter itens e pontuação; acrescentar nota de que sinais oromotores/deglutição exigem avaliação própria e red flags independem da soma.

### Irritabilidade e Desregulação no Cotidiano — VS1

**Fonte canônica:** `authorialMonitoring.json`; PDF `NeuroPed_SDG_Irritabilidade_Desregulacao_20_itens_VS1.pdf`.

**Paridade:** alta. Escala por número de dias em 14 dias, com `NO`, regra explícita de observabilidade e soma somente quando válida.

**Achados:** é o instrumento mais claramente ancorado em frequência observável dentro do cluster de irritabilidade. Não há erro de pontuação detectado. O problema é de posicionamento: coexistência com MAPA-RI 18 e MCRI-24 gera triplicação temática.

**Candidata:** congelar texto, opções e pontuação; definir apenas o papel no catálogo em relação aos dois instrumentos maiores.

### NEXO-S 24 — v1.0

**Fonte canônica:** `authorialMonitoring.json`; PDF `NEXO_S_24_NeuroPed_SDG.pdf`, SHA-256 `f1ee15559a36827ebeda1f3a33caaeee534909b7c628725bcaf843e092ce706a`.

**Paridade:** estrutura de 24 itens/4 domínios, janela de 14 dias, `NO`, total opcional 0–96 e ausência de cortes diagnósticos estão alinhadas. O PDF localizado reproduz o conteúdo, mas a extração/renderização apresenta falhas tipográficas em alguns diacríticos; isso é defeito editorial, não clínico.

**Redundância aparente, preservada:** itens de sobrecarga, recuperação, participação e adaptação familiar descrevem etapas diferentes da mesma cadeia funcional; não devem ser fundidos. Itens de detecção reativa de sobrecarga e antecipação/adaptação do adulto também são funcionalmente distintos.

**Divergência de respondente:** o PDF admite escola/terapeuta em preenchimentos separados; o JSON atual declara apenas `pais`.

**Candidata:** itens, domínios, resposta e pontuação congelados; regeneração tipográfica rastreada; decisão clínica necessária apenas sobre respondentes adicionais.

### MAPA-RI 18 — v1.1-app

**Fonte operacional canônica:** `authorialMonitoringChannel2026.json`. Proveniência registrada: `MAPA_RI_18_v1.1_NeuroPed_SDG.pdf`, SHA-256 `c1035675085d14a4f97a415abbc20dc577da7b99a59368b2bd4372b95dcde885`.

**Predecessor localizado:** `Mapa_RI_18_NeuroPed_SDG.pdf` (v1.0).

**Divergência material rastreada:** no predecessor, itens 17–18 são recursos/proteções redigidos positivamente e exigem inversão. Na revisão operacional v1.1-app, esses itens foram reescritos em direção de dificuldade, permitindo pontuação direta 0–4 e preservando `higher_worse`. Essa mudança foi deliberada e não deve ser revertida silenciosamente.

**Candidata:** manter sem alteração a semântica v1.1-app dos itens 17–18; gerar, após aprovação, novo artefato canônico rastreado a partir do JSON vigente. Comparações v1.0→v1.1 devem ser marcadas como quebra de versão; recomenda-se novo basal em v1.1.

### VIGIA-SD 20 — v1.1-app

**Fonte operacional canônica:** `authorialMonitoringChannel2026.json`. Proveniência registrada: `VIGIA_SD_20_v1.1_NeuroPed_SDG.pdf`, SHA-256 `5c8603630b4071c27c95b397e145c06567e076f6d39a4d25772315f3efe3aeb2`.

**Artefato:** a revisão PDF nomeada no JSON não foi localizada nas fontes conectadas consultadas; não se deve fingir recuperação literal. A revisão atual pode ser reconstruída apenas como **novo snapshot rastreado do JSON canônico**, com novo hash.

**Achados internos:** itens 6/7 distinguem necessidade de ajuda versus número/duração de despertares; itens 2/14 distinguem regularidade noturna versus diferença dias úteis/fim de semana; itens 11/16 distinguem insuficiência percebida versus repercussão diurna. Não há motivo clínico suficiente para fusão.

**Faixa/aplicabilidade:** 2–17 anos; itens ligados a escola/fim de semana podem não ser observáveis em alguns contextos. O app permite deixar em branco, mas o formulário deve explicitar que item não aplicável/não observável não vale zero.

**Duplicação:** sobreposição importante com SDRD-12.

**Candidata:** manter itens e 0–3; acrescentar regra explícita de não imputação; criar snapshot PDF rastreado após aprovação; definir papel “expandido” versus SDRD-12 breve ou deprecar um dos dois.

### BALANÇO-MED 24 — v1.1-app

**Fonte operacional canônica:** `authorialMonitoringChannel2026.json`. Proveniência registrada: `BALANCO_MED_24_v1.1_NeuroPed_SDG.pdf`, SHA-256 `98326fc57f8a4ee19c3c37769fddaf067a9064fe52fd529d40d85300ad18ea74`.

**Artefato:** a revisão PDF nomeada no JSON não foi localizada nas fontes conectadas consultadas; qualquer novo PDF deve ser declarado snapshot da fonte canônica atual, não recuperação do predecessor.

**Estrutura:** quatro domínios de tolerabilidade (0–60) + um domínio de “lacunas de benefício funcional” (0–12). A direção é coerente somente porque o benefício é redigido como insuficiência/lacuna.

**Pontos clínicos relevantes:**

1. Faixa 0–17 anos é ampla demais para alguns itens funcionais (escola, terapia, participação) sem opção explícita `NO`/não aplicável.
2. Os rótulos 1–3 misturam frequência e impacto (`leve/ocasional`, `moderado/com impacto`, `importante/limitante`), reduzindo a precisão longitudinal quando esses eixos divergem.
3. O total 0–72 mistura carga de efeitos adversos com insuficiência de benefício. Embora matematicamente `higher_worse`, pode mascarar perfis clinicamente opostos; a leitura por domínios é mais segura.
4. O app precisa instrução específica para aplicações por clínico.

**Candidata editorial:** itens e red flags congelados. Até decisão clínica, não alterar faixa, âncoras ou total. Recomenda-se: tornar domínios/subtotais a saída primária; considerar retirada do total global; considerar `NO` explícito; definir idade mínima/estratégia por desenvolvimento.

### MCRI-24 — v1.0

**Fonte canônica:** `authorialMonitoringMcri2026.json`. Proveniência registrada: `MCRI_24_NeuroPed_SDG.pdf`, SHA-256 `80d31ddc68467a6db8edc86b973665823c3bd9956cad518640046deee5016d6f`.

**Artefato:** o PDF nomeado não foi localizado nas fontes conectadas consultadas; gerar apenas novo snapshot rastreado após aprovação.

**Achados:**

1. As âncoras 1–4 misturam frequência, intensidade, necessidade de apoio, interferência e risco. Isso pode reduzir comparabilidade longitudinal.
2. Domínio E (“Contexto e sobrecarga”) contém moduladores/gatilhos, não apenas manifestações da desregulação; somá-lo ao total global pode dificultar interpretação.
3. O instrumento se sobrepõe fortemente a MAPA-RI 18 e VS1.
4. `NO` e a regra de domínio incompleto estão corretamente modelados.

**Candidata editorial:** manter os 24 itens e red flags congelados; priorizar perfil por domínio. Mudança das âncoras, supressão do total ou papel no catálogo exigem decisão clínica.

## 5. Duplicações históricas relevantes encontradas no Drive

Foram localizados instrumentos medicamentosos anteriores, incluindo `ESM-EDJ Escala Satisfacao Medicacao.pdf` e `Escala_DRJ_TDAH_Prejuizo_Escolar_e_Medicacao.docx`. Eles se sobrepõem parcialmente ao BALANÇO-MED 24 e contêm lógica histórica de interpretação/limiares que não deve migrar automaticamente para o novo monitor autoral.

**Decisão de segurança desta auditoria:** esses arquivos permanecem históricos; não foram recriados, alterados nem incorporados à coorte atual. Se o BALANÇO-MED for aprovado, recomenda-se impedir que instrumentos históricos concorrentes sejam apresentados como regras atuais de indicação medicamentosa, preservando rastreabilidade.

## 6. Conclusão de auditoria

Não foi detectada necessidade de reescrever em massa nenhum dos nove instrumentos. A maior parte pode avançar por correções editoriais/instrucionais sem mudança de item ou pontuação. As decisões clínicas reais concentram-se em quatro eixos: arquitetura do cluster de irritabilidade, relação SDRD/VIGIA, desenho de escore/aplicabilidade do BALANÇO-MED e respondentes do NEXO-S. Essas decisões estão isoladas em `DECISOES_CLINICAS.md`.
