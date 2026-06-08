# NeuroPed — Bug hunt: destino real do relatório clínico

Data: 2026-06-08

## Achado

O componente de relatório clínico exibe mensagem indicando envio para o e-mail profissional institucional.

Na rota de backend responsável por envio de relatório, quando o campo de destinatário não é informado pelo frontend, o destino padrão atual é o e-mail do usuário autenticado.

## Impacto

Em modo estático ou offline, o fluxo tende a cair para abertura do aplicativo de e-mail, com destino correto configurado no próprio frontend.

Em ambiente fullstack autenticado com SMTP ativo, pode ocorrer divergência entre a mensagem exibida na interface e o destino real usado pelo backend.

## Correção recomendada

Aplicar em ambiente local/Codex/Cursor uma das duas opções:

1. Enviar explicitamente o e-mail profissional no corpo da requisição feita pelo componente de relatório.
2. Alterar o fallback do endpoint de envio para usar o e-mail profissional institucional quando nenhum destinatário for informado.

## Status

Achado documentado. Build preservado. Não foi deixada auditoria falhando sem correção aplicada.

## Motivo de não correção direta nesta sessão

A edição automática dos arquivos envolvidos foi bloqueada pela camada de segurança do conector por envolver fluxo de e-mail/SMTP e rotina de impressão/HTML. A correção deve ser aplicada no ambiente de desenvolvimento e validada com a esteira padrão.
