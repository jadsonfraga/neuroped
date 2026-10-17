# Instrumentos autorais NeuroPed (ondas 2–3)

Instrumentos **originais**, escritos para este projeto: itens próprios em português do Brasil (família, escola, UBS/SUS), inspirados apenas no **construto** clínico. Nenhum item foi copiado de instrumento protegido.

## O que cada um é (e não é)
- Rótulo fixo: *instrumento autoral NeuroPed, sem validação psicométrica, apoio à decisão clínica, não diagnóstico*.
- **Sem ponto de corte**: a interpretação é descritiva (soma/média por bloco e leitura item a item), conforme AGENTS.md.
- Não substituem instrumentos validados quando estes existem; entram para cobrir lacunas do banco e dão a cada queixa/idade/respondente ao menos três opções que abrem e funcionam.
- Licença registrada como `authorial` (autoria do projeto) em `scaleLicenseRegistry`; nenhuma licença de terceiros é necessária nem solicitada.
- Ids com prefixo `na-`. Definição em `client/src/data/authorial*.ts` via `authorialKit.ts`.

## Escalas (por PR)
- Cuidado/medicação: `na-sobrecarga-cuidador`, `na-apoio-rede-cuidador`, `na-efeitos-estimulantes-pais`, `na-efeitos-psicofarmacos-adolescente`, `na-adesao-tratamento-pais`, `na-transicao-saude-adolescente`.
- Epilepsia, cefaleia e paralisia cerebral: `na-efeitos-antiepilepticos-pais`, `na-qualidade-vida-epilepsia`, `na-mobilidade-funcional-pc`, `na-funcao-pc-pais`, `na-funcao-pc-escola-professor`, `na-cefaleia-gatilhos-rotina`.
- Humor, regulação, psicose (observação), seguimentos e substâncias: `na-labilidade-humor-pais`, `na-regulacao-emocional-pais`, `na-experiencias-perceptivas-adolescente`, `na-sinais-iniciais-psicose-pais`, `na-humor-depressivo-adolescente`, `na-ansiedade-seguimento-pais`, `na-tiques-seguimento-pais`, `na-toc-seguimento-pais`, `na-uso-substancias-adolescente`, `na-tracos-insensiveis-pais`.
- Neurodesenvolvimento, aprendizagem, sensorial, sono, alimentação: `na-coordenacao-motora-pais`, `na-interacao-social-precoce-pais`, `na-sono-crianca-pais`, `na-comportamentos-repetitivos-pais`, `na-selecao-alimentar-pais`, `na-sensorial-casa-pais`, `na-sensorial-escola-professor`, `na-leitura-dislexia-professor`, `na-escrita-professor`, `na-matematica-professor`, `na-comportamento-adaptativo-pais`, `na-saude-mental-pre-escolar-pais`, `na-funcoes-executivas-casa-pais`.

Marcadores de sintoma (`signalTags`) e domínio (`primaryDomain`, `overlapGroup`) alimentam o filtro e o seletor v2 da pré-consulta.
- Substitutos dos instrumentos proprietários retirados do app em 17/10/2026 (ASEBA, MHS, PAR, WPS), com formas paralelas casa × escola de mesmos blocos e número de itens:
  - CBCL/TRF (ASEBA) → `na-perfil-emocional-comportamental-pais` e `na-perfil-emocional-comportamental-professor`;
  - Conners 3 (MHS) → `na-atencao-atividade-pais` e `na-atencao-atividade-professor`;
  - CDI-2 (MHS) → `na-humor-crianca-autorrelato` (7–12 anos; 13+ segue em `na-humor-depressivo-adolescente`);
  - BRIEF-2 (PAR) → `na-funcoes-executivas-ampliado-pais` e `na-funcoes-executivas-escola-professor`;
  - CARS-2 (WPS) → `na-observacao-clinica-tea` (registro do profissional na consulta).
- Substitutos da segunda leva de licenciados retirados em 17/10/2026:
  - M-CHAT-R/F → `na-sinais-precoces-tea-pais` (16–36 meses; inclui perda de habilidades) e `na-interacao-social-precoce-pais`;
  - PedsQL → `na-qualidade-vida-pais` e `na-qualidade-vida-autorrelato` (formas paralelas, mesmos blocos e número de itens);
  - ABC → `na-comportamento-tea-di-pais` (acompanhamento em TEA e deficiência intelectual, com autoagressão e agressão separadas e frequência em vez de gravidade);
  - SCARED → `na-ansiedade-autorrelato` (8–18 anos) e `na-ansiedade-seguimento-pais`;
  - SDQ → `na-perfil-emocional-comportamental-adolescente` (autorrelato, terceira forma paralela do perfil) e as formas de pais e professor;
  - Vanderbilt → `na-atencao-atividade-pais` e `na-atencao-atividade-professor`; CSHQ → `na-sono-crianca-pais`; CRAFFT → `na-uso-substancias-adolescente`; Vineland-3 → `na-comportamento-adaptativo-pais`;
  - ASQ-3 e Denver II → SWYC Marcos do desenvolvimento (livre, Tufts, um formulário por idade), em vez de marcos autorais: é instrumento aberto já no app, com adaptação brasileira publicada.

## Instrumentos licenciados retirados (17/10/2026)
Segunda leva, no mesmo dia: `/asq3`, `/denver`, `/pedsql`, `/cshq`, `/abc`, `/mchat`, `/crafft`, `/sdq`, `/scared` e `/vanderbilt` saíram pelo mesmo caminho (ficha de referência + alternativa + redirecionamento); ASQ-3 e Denver II abrem a própria ficha, que lista o formulário SWYC Marcos de cada idade. O M-CHAT-R também saiu do envio remoto às famílias, com o histórico de respostas preservado por número do item. Mapa completo em `docs/ESCALAS_LICENCAS.md`.

Primeira leva: as páginas `/cbcl`, `/conners`, `/cdi2`, `/brief2` e `/cars` reproduziam itens, subescalas ou âncoras dos originais e calculavam "escore T" e pontos de corte sem norma. Foram removidas: o instrumento original segue apenas como ficha de referência em `/generic-scale/<id>` (`external_only`), que aponta a alternativa autoral, e a rota antiga redireciona para essa alternativa. Os roteiros de TEA (`/tea-checklists`) passaram a ter nome autoral; ADOS-2, ADI-R, CARS-2, GARS-3 e SRS-2 aparecem só como instrumentos de referência, com os dados psicométricos atribuídos a eles, não aos roteiros.

Os substitutos cobrem o mesmo construto clínico com itens próprios, mas **não são equivalentes nem melhores em validade** que os originais: não têm norma, validação nem ponto de corte. O que oferecem a mais é uso livre, linguagem brasileira concreta, formas paralelas para comparar casa e escola, impacto funcional separado dos sintomas e leitura item a item. A validação (consistência interna, teste-reteste, validade convergente com instrumentos livres como SNAP-IV, PSC-35 e CES-DC) é a etapa seguinte e depende de coleta com crianças reais.
