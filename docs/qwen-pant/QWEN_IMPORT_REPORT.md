# Relatório de inspeção e importação do Qwen

## Escopo

A URL compartilhada `https://chat.qwen.ai/p/d6f90d27-e281-4b62-aaf0-acb093ff9a5b` foi aberta no My Browser em 27/08/2026. A sessão estava autenticada como `medicina119@gmail.com`, mas a rota exibiu a interface de nova conversa, com modelo Qwen3.7-Plus e sem mensagens, instruções de projeto, arquivos ou histórico clínico visíveis.

A área “Projetos” foi expandida e recolhida e mostrou apenas “Novo Projeto”. A busca por “laudo” não retornou tarefas/conversas. Não foi feita qualquer alteração no Qwen, não foi criado projeto e nenhum dado clínico foi enviado.

## Base usada

Como o conteúdo da rota não ficou acessível, o pacote foi construído a partir do repositório `jadsonfraga/neuroped`, incluindo o contrato `SuperEntrada`, o serializador `laudoSuperParaTexto`, a validação `qaSuper`, o fluxo de impressão `buildPrintHtmlSuper`, o construtor `buildDocumentPdf`, o painel de assinatura ICP-Brasil e os documentos de produto, proveniência, LGPD e catálogo de escalas.

## Entrega efetiva

A integração local permite importar na página SuperNeuroPed um arquivo JSON conforme `SCHEMA_LAUDO_PANT.json`. O adaptador `client/src/lib/laudo/qwenContract.ts` valida campos essenciais, preserva proveniência e status dos CIDs, converte para `SuperEntrada` e expõe avisos de revisão. O botão “Importar JSON Qwen” lê o arquivo apenas no navegador; a saída pode ser revisada na tela e os controles de PDF/assinatura permanecem bloqueados até a confirmação explícita da revisão médica.

A estratégia evita acoplamento a API externa e mantém no app a responsabilidade por layout, PDF, QR, assinatura e arquivamento. O Qwen não recebe certificado, senha, HTML, CSS, JavaScript ou credenciais.

## Limitação conhecida

O PDF premium existente em `documentPdf.ts` usa fontes padrão do `pdf-lib` e sanitização `pdfSafe`; o fluxo de impressão do SuperNeuroPed usa HTML/CSS e a identidade visual do projeto. A implementação não afirma que o documento está juridicamente válido apenas por ser PDF. A assinatura qualificada e a conferência profissional continuam obrigatórias.
