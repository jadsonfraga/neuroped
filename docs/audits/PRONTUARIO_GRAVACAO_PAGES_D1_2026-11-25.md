# Prontuário: gravar, reabrir e corrigir
Base main: `93734d7`, incluindo no candidato a correção local de leitura completa `3d811bd`. Somente Chromium sintético, Pages Functions canônico compilado, Miniflare D1 isolado, tenant sintético e nenhuma gravação externa.
- Reprodução 1: salvar retorna 400 `VALIDATION_ERROR` para o identificador de seção com dois-pontos. Não relaxar o contrato da API.
- Reprodução 2: após corrigir o identificador, novo save imediato devolvia 429, pois o formulário repetia todas as seções.
- Ajuste: identificadores opacos, leitura compatível com históricos, sem POST para campos novos vazios ou conteúdo clínico sem alterações. Limpeza explícita de campo existente mantém trilha de correção. Regressão/crises sem resposta ficam “Não informado”.
- O teste abre a ficha pelo link real da Agenda e confirma o ID do agendamento no atendimento que foi salvo e reaberto.
- Restauração de históricos sem mudança de esquema. O fluxo de gravação de múltiplas seções ainda não é uma transação única; não confundir uma correção individual com garantia contra interrupções para o prontuário inteiro.
- Gate local: `node tests/e2e/fixtures/run-live-scale-save-retry.mjs --prontuario`, com `SCALE_RETRY_MINIFLARE`, `SCALE_RETRY_WORKER` e `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. Rollback: reverter somente o commit deste candidato antes de qualquer produção; nenhum dado, migração ou permissão alterado.
