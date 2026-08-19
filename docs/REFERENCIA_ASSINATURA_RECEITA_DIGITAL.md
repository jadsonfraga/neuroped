# Referência de assinatura e prescrição digital

## Fontes oficiais consultadas

1. Conselho Federal de Medicina, Prescrição Eletrônica: https://sistemas.cfm.org.br/prescricaoeletronica/
2. Anvisa, Medicamentos controlados: receitas com assinatura digital: http://antigo.anvisa.gov.br/resultado-de-busca?p_p_id=101&p_p_lifecycle=0&p_p_state=maximized&p_p_mode=view&p_p_col_id=column-1&p_p_col_count=1&_101_struts_action=%2Fasset_publisher%2Fview_content&_101_assetEntryId=5825195&_101_type=content&_101_groupId=219201&_101_urlTitle=medicamentos-controlados-receitas-com-assinatura-digital&inheritRedirect=true
3. Gov.br/ITI, Plugin PAdES ICP-Brasil: https://www.gov.br/pt-br/servicos/download-do-plugin-pades-icp-brasil

## Pontos que orientam o produto

O CFM descreve a prescrição eletrônica como um documento originalmente eletrônico em PDF, assinado digitalmente com certificado ICP-Brasil, que pode ser conferido em validador e cuja dispensação pode ser registrada pelo farmacêutico. A página também informa que a validação envolve autoria, habilitação do prescritor, integridade do documento e, quando aplicável, se ele já foi dispensado.

A Anvisa informa que a assinatura digital ICP-Brasil se aplica às receitas de controle especial e às prescrições de antimicrobianos quando atendidas as exigências sanitárias e de controle aplicáveis. A receita digitalizada não equivale ao documento eletrônico originalmente assinado. Também existem exceções, como notificações de receita A, B/B2, talidomida e retinoides sistêmicos, que não podem ser tratadas pelo app como se um PDF assinado genérico garantisse a dispensação.

O app pode persistir o PDF final assinado, seu SHA-256, certificado público/metadados de assinatura e trilha de auditoria. O arquivo de certificado privado (.p12/.pfx) e a senha devem permanecer somente na memória local durante a assinatura e nunca devem ser enviados ou armazenados pelo backend.

A implementação deve apresentar a aceitação em farmácias como dependente da conferência do PDF no validador oficial, da habilitação do prescritor, do tipo de medicamento, das regras sanitárias vigentes e dos procedimentos da farmácia. O app não deve afirmar aceitação universal nem substituir os validadores e registros oficiais.
