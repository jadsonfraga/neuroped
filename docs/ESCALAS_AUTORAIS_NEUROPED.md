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

Marcadores de sintoma (`signalTags`) e domínio (`primaryDomain`, `overlapGroup`) alimentam o filtro e o seletor v2 da pré-consulta.
