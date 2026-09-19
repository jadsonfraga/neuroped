# OBS-10 v1.3 — candidato a piloto operacional supervisionado

Status: plano de avaliação, **sem resultados de uso clínico**. Origem: solicitação do proprietário e issue #899. Esta mudança entrega engenharia e meios de avaliação; não demonstra benefício, validação diagnóstica ou reconhecimento internacional.

## Finalidade e limites

Pergunta: uma assistente treinada consegue produzir uma amostra segura e utilizável, e o médico consegue conferir rapidamente a origem das informações? O módulo não substitui exame médico, rastreio validado ou avaliação clínica. Não realiza reconhecimento facial, análise de emoções, diagnóstico, escore ou interpretação automática da filmagem.

## Portas de entrada, sem implantação clínica automática

1. **Simulação sem pacientes.** No dispositivo institucional, praticar preparação, voz, enquadramento, aplicação, marcação, reabertura do JSON e reanexação do mesmo vídeo. Incluir falha de som, permissão negada, recusa fictícia, falta de material e arquivo de outra sessão. Conferir quem pode anotar e quem pode revisar.
2. **Elegibilidade institucional.** Médico responsável revisa o conteúdo; define treinamento, consentimento/assentimento aplicável, guarda e retenção. Determina se a iniciativa é assistência, melhoria de qualidade ou pesquisa e quais aprovações são necessárias antes de qualquer coleta. Não usar dados reais em GitHub, logs ou demonstrações.
3. **Piloto supervisionado.** Aplicações elegíveis, com apoio disponível, recusa respeitada e interrupção por segurança. Não selecionar somente crianças que completam tudo. Registrar tempo efetivo, omissões e falhas. A amostra e seus estratos precisam de justificativa clínica/metodológica própria; nenhum número arbitrário aqui constitui validação.
4. **Comparação com fluxo habitual.** Definir previamente denominadores, medidas e comparação. Incluir tempo de preparação e revisão, não apenas os dez minutos. Avaliar se economizou trabalho ou apenas o transferiu. Opinião de utilidade não é acurácia diagnóstica.
5. **Reprodução externa.** Somente após resultados auditáveis, repetir com outra aplicadora/equipe. Adaptação de idioma exige revisão cultural e de compreensão, não simples tradução. Não divulgar redução de tempo, acurácia, segurança total ou superioridade sem dados.

## Medidas propostas, não resultados

| Pergunta | Como registrar | Limitação |
|---|---|---|
| A coleta cabe na rotina? | Duração da coleta e períodos voluntariamente cronometrados de preparação/revisão/entrega. | Períodos não medidos não são zero; mudança de aba pausa medição. |
| O vídeo serve à consulta? | Conferência humana de som/imagem e trechos utilizáveis; tarefas sem evidência ficam explícitas. | Número de vínculos não prova qualidade. |
| A aplicação respeitou o roteiro? | Médico confere comando, ajuda, repetição, omissão e proteção. | Software não observa fidelidade automaticamente. |
| A revisão é eficiente? | Tempo marcado de revisão e facilidade para encontrar os trechos. | Não comparar médias sem ajuste ao contexto. |
| Agregou informação? | Utilidade percebida e necessidade de repetir tarefas, declaradas pelo profissional. | Não mede acurácia, causalidade ou desfecho clínico. |
| O processo exclui grupos? | Rever taxas de recusa, falha e não aplicação por faixa e recursos de comunicação. | Evitar reidentificação em grupos pequenos. |

## Critérios de interrupção operacional

Qualquer associação à criança errada, perda de arquivo essencial, exposição não autorizada ou incidente de segurança exige interromper o uso afetado, acolher/atender conforme fluxo local e analisar a causa antes de ampliar. Falha de vídeo não deve impedir ou atrasar consulta necessária. Não exigir completar cartões diante de desconforto. Risco clínico aciona o médico/equipe, não espera revisão de IA.

## Governança do que existe e do que não existe

- Arquivos locais e metadados exportados: sem transmissão automática, sem armazenamento central nem backup automático.
- SHA-256 reconhece o mesmo conjunto de bytes; não certifica origem, identidade, integridade prévia à associação ou autenticidade das anotações.
- Comentários profissionais append-only na interface; JSON externo é editável. Nenhuma assinatura eletrônica ou auditoria inviolável é alegada.
- Dados importados não herdam autenticação de autoria; o vídeo precisa ser selecionado novamente e conferido.
- Exportação de métricas é minimizada por campos, não anonimização garantida. Não publicar microdados que possam ser combinados para identificar uma criança.
- Armazenamento institucional centralizado, estudos e IA clínica são etapas distintas; não foram ativados nesta intervenção.

## Reversão

Reverter a PR da issue #899. Não há migração, nova API ou persistência clínica. Manter acesso às exportações existentes sob a política institucional; arquivos 1.3 com extensões de evidência não devem ser abertos em aplicativo anterior sem conversão revisada, pois a validação estrita os recusará.
