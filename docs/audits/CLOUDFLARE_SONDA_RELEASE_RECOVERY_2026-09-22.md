# Cloudflare — recuperação da publicação do Sonda Dez

## Escopo e evidência

Solicitação do mantenedor: concluir de ponta a ponta a entrega da PR #923, incluindo publicação verificável. A PR #923 foi mesclada em `f41a26eb2e7c235b50b03fb4cb683b5cc3c722fa` em 22/09/2026. Seus 15 workflows foram aprovados. O deploy Cloudflare `35758986629` passou a suíte integral `npm run verify`, build e preflights D1, mas a publicação falhou.

A consulta **direta ao histórico do provedor** (diagnóstico `35760812927`, job `106858082552`) confirmou, para os deployments `54a6aafb-9b86-4a3c-8f0b-495adf05f816` e `c025a57e-8489-4fd7-8e9a-faf596c76f20`: `You need to enable Analytics Engine`. Não há Durable Objects no manifesto nem no projeto; a indicação anterior desse serviço não é a causa confirmada. O D1 é da geração production e corresponde ao UUID já versionado. Nenhum registro de paciente foi lido.

## Correção mínima e efeito observável

O sink `API_METRICS` é explicitamente opcional em `functions/api/_observability.ts`: sua ausência/erro não altera efeitos nem respostas clínicas. Ele não é o ledger obrigatório de auditoria. O endpoint autenticado de métricas já informa `apiInstrumentationBindingPresent: false` quando ausente, sem fabricar uma prova de entrega.

O manifesto passa a declarar `analytics_engine_datasets = []` na raiz, removendo a dependência de um recurso não provisionado e limpando o binding no próximo deploy pelo Wrangler, fonte de verdade. D1, AI, compatibilidade, variáveis LIVE/ESCUTA, autenticação, criptografia, RBAC, isolamento de tenant e auditoria D1 permanecem inalterados. Nenhuma assinatura, cobrança ou plano pago é criado/alterado. Não há remoção de gates nem fallback de credencial administrativa nos testes.

**Limitação assumida:** não serão enviados pontos novos de latência/status para Analytics Engine nesta configuração. Os agregados existentes derivados do ledger D1 continuam independentes. A infraestrutura clínica deixa de depender da ativação desse serviço auxiliar; não se declara telemetria entregue quando ela está desabilitada.

## Regressão

O guard executa o parsing real de TOML e mutações negativas: preserva DB/AI/LIVE e rejeita a volta implícita do sink indisponível. Também executa os testes existentes de middleware e métricas, prontidão e regras de workflow/entrypoint. Os workflows de diagnóstico com acesso a segredos usados nesta investigação foram substituídos por um guard somente leitura, sem segredos ou mutações de provedor.

Merge exige checks obrigatórios e guard novos verdes. A publicação continua exclusivamente no workflow canônico de main, com suíte completa, confirmação do SHA em `deploy-check.json`, health D1/auth, login sintético e isolamento. Vercel continua espelho condicionado ao mesmo SHA Cloudflare. Nenhum resultado de publicação é presumido nesta documentação.

## Reativação e rollback

Para reativar métricas: habilitar o produto na conta por um administrador autorizado, confirmar disponibilidade e eventuais condições de cobrança, restaurar o binding `API_METRICS` / dataset `neuroped_api_metrics` por PR e atualizar o contrato com evidência. Não alterar o ledger de auditoria para substituir Analytics Engine.

Rollback de código: revert desta PR por nova PR com testes. Reverter antes da ativação do produto reintroduz o bloqueio de publicação. Se necessário rollback de runtime, promover apenas um deployment anteriormente verificado e compatível, sem apagar dados D1, secrets ou migrações. Nenhuma migração é criada nesta recuperação.
