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
