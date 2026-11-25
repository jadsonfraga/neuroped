# Prova local da agenda LIVE

Fluxo: profissional autenticado cria uma consulta manual vinculada a um
paciente sintético, recebe recusa ao tentar ocupar um horário sobreposto,
remarca a consulta original e confirma em nova sessão a duração, o vínculo
e a liberação do horário anterior. O backend é o Pages Worker compilado,
com D1 descartável, sem interceptar a API. Não usa contas, contatos ou
dados de produção. Não envia mensagens.

1. Node 22+, dependências instaladas e Chromium disponível:
   `npm run build:client`.
2. Compile `wrangler pages functions build functions --outdir /tmp/neuroped-agenda-worker`.
3. Defina `SCALE_RETRY_WORKER=/tmp/neuroped-agenda-worker/index.js`
   e `SCALE_RETRY_MINIFLARE` com o caminho do módulo JS do Miniflare v4 local.
4. Execute `node tests/e2e/fixtures/run-live-scale-save-retry.mjs --agenda`.
   O harness cria o banco sintético e fornece chaves efêmeras.

Não cobre marcação pública, envio real ou escolha de agenda por recepção
multiprofissional. `npm run test:operations` e o smoke da agenda com API
sintética continuam complementares. Rollback: reverter os arquivos de
teste/documentação; nenhuma migração ou modificação de produto.
