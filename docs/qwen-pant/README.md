# Pacote Qwen para Laudos PANT e PDF premium

Este diretório reúne a base de conhecimento operacional para usar o Qwen como **redator de rascunhos estruturados**, sem transformá-lo em fonte autônoma de diagnóstico, prescrição ou codificação. O pacote foi derivado do fluxo SuperNeuroPed existente no repositório e foi desenhado para produzir uma saída JSON auditável, convertível para `SuperEntrada`, revisável na tela e exportável pelo PDF premium já implementado em `client/src/lib/documentPdf.ts` e `client/src/pages/laudo-super.tsx`.

> **Regra de uso clínico:** todo resultado é rascunho até revisão, correção e assinatura do médico responsável. O Qwen não deve receber dados identificáveis de pacientes em ambiente externo sem base legal, governança, contrato e autorização institucionais adequados. Para testes e treinamento, use apenas o exemplo sintético deste pacote.

## Arquivos do pacote

| Arquivo                      | Finalidade                                                                                                                                    |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `INSTRUCOES_PROJETO_QWEN.md` | Texto para colar no campo “Instruções do Projeto” do Qwen. Define papel, dados permitidos, ordem PANT, prosa, CIDs, escalas, revisão e saída. |
| `SCHEMA_LAUDO_PANT.json`     | Contrato JSON da resposta. Impede propriedades inesperadas e torna campos ausentes, proveniência, CIDs, fontes e pendências verificáveis.     |
| `FONTES_E_PROVENIENCIA.md`   | Catálogo de fontes oficiais e internas, com escopo autorizado e limites de reprodução.                                                        |
| `CHECKLIST_REVISAO.md`       | Gate de revisão médica, codificação, PDF, assinatura e privacidade.                                                                           |
| `EXEMPLO_SINTETICO.json`     | Caso fictício completo para testar o projeto sem PHI. Não representa um paciente real.                                                        |
| `QWEN_IMPORT_REPORT.md`      | Registro da inspeção da conversa compartilhada e das limitações encontradas no acesso.                                                        |

## Fluxo recomendado

O fluxo seguro é: preencher dados no NeuroPed; retirar identificadores desnecessários; exportar apenas o conjunto mínimo aprovado para o Qwen; solicitar **JSON conforme o schema**; validar a resposta; revisar o conteúdo clínico e os CIDs; importar para o adaptador `qwenContract.ts`; abrir o rascunho na página SuperNeuroPed; editar o texto final; gerar o PDF; e, somente após conferência, assinar e arquivar.

O Qwen deve sempre receber a instrução de devolver `document_status = "draft_for_clinician_review"`, mesmo quando os dados estiverem completos. A aplicação não deve tratar uma resposta textual sem contrato, proveniência e gate de qualidade como documento emitível.

## Compatibilidade com o PDF premium

O texto final deve seguir os marcadores que `buildPrintHtmlSuper` reconhece: cabeçalho `SUPER NEURO PED — LAUDO NEUROPEDIÁTRICO`, caixa `[SÍNTESE DA CONSULTA]`, caixa `[CAIXA CID]`, seções `01` a `14`, subtítulos iniciados por `—`, rótulos `INDICAÇÃO:`, `EVIDÊNCIA:`, `[FAVORÁVEL]`, `[ESPERADO]`, `[RESERVADO]` e assinatura institucional. O adaptador não deve reescrever a narrativa clínica; ele apenas converte o JSON validado para o contrato local `SuperEntrada`.

A emissão premium utiliza o layout do projeto, a paleta editorial NeuroPed, rodapé, QR de validação e o painel de assinatura ICP-Brasil. O Qwen não deve gerar HTML, JavaScript, CSS, QR code, certificado ou assinatura. Ele entrega dados e texto estruturado; a aplicação local controla a apresentação, a assinatura e o arquivamento.

## Limites de conteúdo

O pacote não autoriza reprodução de itens protegidos de escalas, normas proprietárias, manuais, tabelas normativas ou algoritmos licenciados. Para instrumentos com permissão necessária ou política de apenas link, o Qwen pode usar nome, versão, domínio, respondente, finalidade, fonte e resultado explicitamente fornecido, mas não pode reconstruir o instrumento. Toda escala deve ser descrita como rastreamento ou monitoramento quando esse for o seu papel; resultado positivo não equivale a diagnóstico.

A proveniência tem prioridade sobre a fluência. Relato familiar, relato escolar, observação direta, medida padronizada, documento externo e inferência clínica devem permanecer diferenciados. Ausência de registro deve ser escrita como “não informado”, “não avaliado” ou “desconhecido”, conforme o caso; nunca como normalidade.

## Critério de aceite

Um rascunho só é aceito quando o JSON passa pelo schema, cada seção obrigatória possui status e proveniência, os CIDs estão explicitamente confirmados ou marcados como pendentes, não há escore estimado, não há diagnóstico criado pelo modelo, todas as pendências aparecem no gate de qualidade e o médico responsável conclui a revisão antes da impressão ou assinatura.

O pacote foi preparado a partir do repositório `jadsonfraga/neuroped`. A conversa compartilhada no Qwen foi aberta pelo My Browser, mas a rota exibiu uma nova conversa vazia e nenhum projeto/anexo acessível; por isso, o conteúdo de referência recuperável está documentado aqui e no registro de inspeção.
