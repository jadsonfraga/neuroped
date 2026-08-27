# Checklist de revisão antes de emitir o PDF

Este checklist é um **gate humano e técnico**. Um laudo só deve sair do estado de rascunho quando o médico responsável tiver revisado o conteúdo e o sistema tiver concluído as validações formais.

## 1. Identificação, finalidade e privacidade

| Verificação                                                                                              | Resultado |
| -------------------------------------------------------------------------------------------------------- | --------- |
| O paciente está identificado apenas com o mínimo necessário para o destino do documento?                 | ☐         |
| A data de nascimento/idade, sexo quando pertinente, local, data da avaliação e protocolo estão corretos? | ☐         |
| A finalidade e o destinatário do laudo estão definidos?                                                  | ☐         |
| A base legal/autorização para tratar e compartilhar dados foi verificada?                                | ☐         |
| O texto não contém CPF, endereço, contato ou nomes de terceiros sem necessidade?                         | ☐         |
| O documento não contém dados de outro paciente ou conteúdo de teste?                                     | ☐         |

## 2. Proveniência e cronologia

| Verificação                                                                                | Resultado |
| ------------------------------------------------------------------------------------------ | --------- |
| Cada dado relevante distingue relato, observação, medida, documento, inferência e decisão? | ☐         |
| Informante, fonte e data foram conferidos?                                                 | ☐         |
| Divergências de relatos ou datas aparecem sem serem “resolvidas” pelo modelo?              | ☐         |
| “Não informado”, “não avaliado”, “ausente” e “desconhecido” foram usados corretamente?     | ☐         |
| Não há inferência apresentada como fato?                                                   | ☐         |

## 3. História e exame

| Verificação                                                                                        | Resultado |
| -------------------------------------------------------------------------------------------------- | --------- |
| Motivo e contexto refletem a demanda real?                                                         | ☐         |
| A história do desenvolvimento e a linha temporal estão coerentes?                                  | ☐         |
| Exame clínico, neurológico e observação comportamental têm fonte explícita?                        | ☐         |
| Nenhum exame não fornecido foi descrito como normal ou realizado?                                  | ☐         |
| Funções, atividades, participação e fatores contextuais foram descritos apenas quando disponíveis? | ☐         |

## 4. Escalas e instrumentos

| Verificação                                                                                   | Resultado |
| --------------------------------------------------------------------------------------------- | --------- |
| Instrumento, versão, data, respondente e finalidade estão corretos?                           | ☐         |
| Escores e classificações foram copiados sem arredondamento ou estimativa indevida?            | ☐         |
| Não há “(est.)”, percentil inventado, ponto de corte inventado ou norma inferida?             | ☐         |
| O texto diz explicitamente que rastreamento/monitoramento não estabelece diagnóstico isolado? | ☐         |
| Licença e política de reprodução foram respeitadas?                                           | ☐         |
| Instrumento autoral ou sem validação publicada está rotulado como tal?                        | ☐         |

## 5. Diagnóstico e CIDs

| Verificação                                                                                            | Resultado |
| ------------------------------------------------------------------------------------------------------ | --------- |
| Cada item tem status: firmado, hipótese, sinal de rastreamento, diferencial, excluído ou pendente?     | ☐         |
| CID-10 e CID-11 correspondem ao mesmo item e aparecem em paralelo?                                     | ☐         |
| Códigos foram conferidos nas fontes oficiais e na versão vigente?                                      | ☐         |
| Um código não foi escolhido por semelhança textual?                                                    | ☐         |
| Gravidade, nível, especificador ou etiologia só aparecem quando informados e clinicamente sustentados? | ☐         |
| Hipótese não foi impressa como diagnóstico firmado?                                                    | ☐         |

## 6. Plano, medicamento e segurança

| Verificação                                                                                                      | Resultado |
| ---------------------------------------------------------------------------------------------------------------- | --------- |
| Condutas e encaminhamentos foram decididos pelo médico e estão atribuídos à fonte correta?                       | ☐         |
| Medicamento contém somente posologia fornecida; não houve cálculo ou sugestão do modelo?                         | ☐         |
| Exames estão classificados como solicitados, realizados, resultado disponível, não informado ou não solicitados? | ☐         |
| Sinais de alerta e orientação de retorno são apropriados ao caso e revisados pelo médico?                        | ☐         |
| Não há promessa prognóstica, prazo garantido ou recomendação autônoma?                                           | ☐         |

## 7. Texto, layout e PDF

| Verificação                                                                                                  | Resultado |
| ------------------------------------------------------------------------------------------------------------ | --------- |
| As seções 01–14 estão na ordem PANT e sem títulos duplicados?                                                | ☐         |
| A caixa de síntese e a caixa CID não escondem pendências?                                                    | ☐         |
| A prosa está em português brasileiro formal, sem conectores vetados ou emojis?                               | ☐         |
| O texto foi revisado na prévia antes de gerar PDF?                                                           | ☐         |
| Não há cortes, páginas em branco, texto fora da margem, caracteres ausentes ou marcadores internos expostos? | ☐         |
| Rodapé, protocolo, paginação, identificação profissional e contato estão corretos?                           | ☐         |
| O PDF final foi aberto e visualmente conferido?                                                              | ☐         |

## 8. Assinatura, arquivamento e entrega

| Verificação                                                                             | Resultado |
| --------------------------------------------------------------------------------------- | --------- |
| O documento permanece como rascunho até a assinatura?                                   | ☐         |
| A assinatura qualificada foi aplicada pelo profissional responsável, quando necessária? | ☐         |
| O certificado e a senha não foram enviados ao Qwen nem armazenados no repositório?      | ☐         |
| Hash, QR/URL de verificação e metadados do documento foram conferidos?                  | ☐         |
| Arquivamento, acesso, retenção e compartilhamento obedecem ao fluxo institucional?      | ☐         |
| O destinatário recebeu somente a versão final revisada?                                 | ☐         |

## Critério de bloqueio

Bloqueie a emissão se houver qualquer identificação incorreta, mistura de pacientes, diagnóstico inventado, código não conferido apresentado como validado, escore inventado, posologia alterada pelo modelo, exame não realizado descrito como normal, ausência de revisão médica, falha de assinatura ou exposição indevida de dado de saúde.
