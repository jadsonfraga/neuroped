# Recuperação do contrato de entrega autoral — 12/09/2026

Issue #800; execução analisada 34673541422, commit af515513.

A preparação aplica overlays aprovados e muda o fingerprint. O teste histórico
lia o catálogo já transformado e exigia os recibos anteriores para bytes novos.
A fixture preserva exatamente os três registros originais; seus fingerprints
continuam obrigatoriamente correspondendo aos recibos históricos. Um novo teste
aplica o overlay real e exige recibos próprios, bloqueando status pending.
Nenhum recibo, conteúdo clínico ou regra de envio foi alterado.

Verificação local: 18 testes Python antes e depois da preparação (exit 0 em ambos);
21 testes Node de incidente e unicidade (exit 0). PDFs de teste determinísticos,
MIME e gravação de intenção antes de SMTP continuam cobertos.

## BLOCKED_EXTERNAL_SCALE_MAIL_RECONCILIATION

A consulta conectada de scale-mail-receipts.json na branch
 automation/scale-email-receipts retornou 404 em 12/09/2026. Isso não comprova
entrega nem autoriza reconstruir recibos. O run analisado pulou deliver.
Acesso necessário: leitura da branch/recibos persistentes e dos artefatos de
execuções anteriores; transporte depende dos secrets SMTP do runner.
Antes da recuperação com envio, reconciliar esses registros e configurar/verificar
o transporte. Risco sem isso: duplicação ou falsa declaração de entrega.
Concluir somente com PDFs, fingerprints e recibos de aceite correspondentes;
aceite SMTP não comprova recebimento final. Issue #800 permanece aberta.

Rollback: reverter o commit desta PR; nenhum dado ou recibo requer migração.
