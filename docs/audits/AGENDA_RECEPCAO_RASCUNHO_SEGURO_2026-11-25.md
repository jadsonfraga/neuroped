# Agenda LIVE: novo agendamento não herda os dados do anterior

Base remota `93734d7e95aba913b25bd73177db5aafbfa29692`. Ajuste local, sem push, merge, deploy, cadastro real ou entrega externa.

## Problema e correção

O formulário manual continuava preenchido depois de a API confirmar a gravação. No Chromium com recepção vinculada, o telefone da primeira família ainda aparecia no formulário depois do `200`. Como o formulário envia telefone/e-mail para a fila, o próximo agendamento poderia reutilizar contato anterior.

Após gravação confirmada, a tela agora limpa data/hora, nome da criança, vínculo com prontuário, nome do responsável, telefone, e-mail e busca. Mantém apenas o serviço escolhido na mesma agenda. Durante a gravação os campos ficam desabilitados. O rascunho continua disponível se o servidor recusar a gravação, e trocar de profissional continua zerando tudo. A permissão de recepção não muda: sem vínculo clínico ou consulta à lista de pacientes. Sem alteração de backend ou esquema.

## Prova isolada

- Reproduzido antes da correção na entrada real da agenda com Chromium, conta de recepção sintética vinculada pelo profissional via API e Worker Cloudflare Pages compilado + Miniflare D1. O teste falhou exatamente ao encontrar o telefone anterior depois do sucesso.
- Após a mudança, dois agendamentos de famílias fictícias: formulário limpo depois do primeiro, conflito de horário `409` conserva os dados apenas do segundo, tentativa em horário livre grava com sucesso. API de pacientes negada para a recepção. Consulta final ao D1 confirma dois agendamentos e dois registros cifrados na fila correlacionados ao destinatário de cada um; nenhuma tentativa de entrega. Worker de teste intercepta e bloqueia requisições externas.
- A agenda LIVE do profissional também é testada pelo roteiro preexistente: criação vinculada, conflito, remarcação e releitura.

Reprodução: build com `VITE_AUTH_MODE=remote VITE_OPEN_ACCESS=false VITE_API_URL= VITE_ZONE=full npm run build:client`, compile Functions com `wrangler pages functions build --outdir <pasta-local>`. Com `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`, `SCALE_RETRY_MINIFLARE` e `SCALE_RETRY_WORKER` definidos, execute `node --import tsx tests/e2e/fixtures/run-live-scale-save-retry.mjs --agenda-operator` e o mesmo comando com `--agenda`. O relatório não demonstra migração BoaConsulta, entrega real de mensagens ou prontidão geral para uso clínico.

Rollback: reverter o patch de UI/teste; sem reversão de dados ou migrações.
