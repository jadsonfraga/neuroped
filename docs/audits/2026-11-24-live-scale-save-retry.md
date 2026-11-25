# Recuperação após falha parcial no salvamento de escalas LIVE

**Baseline, SHA 89c8d0d:** a avaliação foi gravada, o D1 rejeitou o documento,
e o segundo clique repetiu o POST da avaliação. O fluxo anterior também
descrevia o artefato LIVE como PDF premium, sem ter arquivado um PDF.

**Mudança:** durante o mesmo formulário aberto, o cliente retém em memória
apenas o ponto de retomada da avaliação confirmada, ligado a clínica, paciente e
respostas. Antes de voltar a escrever o documento, consulta o destino real.
Se o documento já estiver lá, confirma o vínculo sem regravá-lo, inclusive
quando a primeira resposta HTTP se perdeu após o commit. Caso não consiga
confirmar o estado (incluindo histórico com 200 itens ou mais), o formulário não
tenta criar outro documento. A interface diferencia avaliação salva de vínculo
pendente e não afirma que um PDF foi arquivado no caminho LIVE. Não foram
alterados tenant, publicação à família, dados existentes ou cálculo de escalas.

## Verificação local

1. Com Node 22+ e dependências instaladas, execute `npm run build:client`.
2. Compile o Worker da árvore local com
   `wrangler pages functions build functions --outdir /tmp/neuroped-scale-worker`.
3. Configure `SCALE_RETRY_WORKER=/tmp/neuroped-scale-worker/index.js` e
   `SCALE_RETRY_MINIFLARE` para o módulo JS do Miniflare v4 instalado para teste.
   Use as opções de Chromium do repositório (ou configure
   `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` para a instalação local).
4. Execute `node tests/e2e/fixtures/run-live-scale-save-retry.mjs`.
   Repita com `SCALE_RETRY_FAULT=db`, com `SCALE_RETRY_FAULT=response` e com
   `SCALE_RETRY_FAULT=db SCALE_RETRY_NEW_PATIENT=1`.

O harness gera sua própria fixture descartável e usa a API real do Pages
Worker. Para o primeiro erro, o D1 rejeita um INSERT por gatilho temporário; para
o segundo, apenas a conexão é fechada depois do 201 real. Não simula respostas
HTTP. O teste verifica POSTs, login novo, releitura da avaliação na UI e
documento interno vinculado com as mesmas sete respostas.

**Limites e rollback:** a retomada não sobrevive ao recarregamento da página e
não cobre perda da resposta do primeiro POST (avaliação) ou reenvio de outra aba.
Nesses casos ainda falta idempotência persistente para o fluxo completo. A
reversão é somente do commit do cliente e dos testes, sem migração de banco.
