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

## Reconciliação com #867 — 13/09/2026

A main passou a tratar `clinicalReviewStatus` renderizado como conteúdo de
entrega (#867). Os dois contratos coexistem sem enfraquecer nenhum gate:
`test_originals_are_already_sent` usa a fixture congelada de 05/09 e mantém os
recibos históricos válidos para aqueles bytes;
`test_reviewed_originals_require_updated_delivery` lê o catálogo já preparado e
exige entrega nova porque a revisão clínica mudou o material impresso;
`test_reviewed_originals_require_their_own_receipts` aplica o overlay real e
continua bloqueando status pending.

Verificação local desta reconciliação: `prepare_authorial_delivery_sources.py`
seguido de 22 testes Python (exit 0, reportlab 4.4.9 instalado como no runner) e
21 testes Node de incidente e unicidade (exit 0). Nenhum recibo, conteúdo
clínico ou regra de envio foi alterado; o bloqueio BLOCKED_EXTERNAL_SCALE_MAIL
permanece válido enquanto os secrets SMTP não existirem.

## Guard do catálogo commitado — 13/09/2026

`client/src/data/authorialMonitoring.ts` espalha as três fontes autorais no
import (`[...source, ...channelSource, ...mcriSource]`) e valida o resultado;
`prepare_authorial_delivery_sources.py` funde as mesmas três em
`authorialMonitoring.json` e aplica os overlays. A saída do prepare é estado de
entrega, descartável, produzida dentro do runner — commitá-la faz o módulo
lançar `mapa-ri-18-sdg: id duplicado inválido` já no import e derruba o catálogo
de escalas do app.

Reproduzido nesta sessão: após rodar o prepare na árvore de trabalho, o import
do módulo falha e `secure-storage.test.ts` quebra com erro que não menciona a
causa. `tests/unit/authorial-sources-committed-raw.test.mjs` passa a falhar
antes, nomeando o arquivo, o instrumento e o remédio (`git checkout --`). Está
na cadeia `test:quick-wins`, executada por `test-and-build.yml` e por
`verify:release`.

O guard cobre as duas assinaturas da saída do prepare: presença de
`deliveryReview` nos registros commitados e colisão de id ou nome entre as três
fontes. Verificado em ambos os sentidos — falha com o catálogo preparado, passa
com o catálogo restaurado.
