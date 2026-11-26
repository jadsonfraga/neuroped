# Exame: preservar observações antes de registrar falta de material

Base: `b20e724818610e11768bff4782bccbb4683eda22` (inclui o kit #1415). Escopo: Exame via assistente e Exame neurológico e mental.

Uma atividade guiada com apenas “Apoio ou contexto” e uma etapa médica com observação sem classificação ainda exibiam o atalho “Registrar falta de material”. O atalho podia marcar a atividade como não realizada sem que a pessoa tivesse revisado o texto anterior. O componente agora usa o mesmo critério que identifica anotações no resumo, e a ficha médica reconhece qualquer registro não vazio. O atalho continua disponível quando não existe anotação. A classificação deliberada da ficha médica, os recursos visuais, as faixas e as permissões não mudaram.

## Evidência
- Chromium em modo tablet com o Worker Pages compilado e D1 local descartável (`node tests/e2e/fixtures/run-live-scale-save-retry.mjs --exam`, com `SCALE_RETRY_MINIFLARE`, `SCALE_RETRY_WORKER` e `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`). Baseline com a nova assertiva: saída 1, ambos os atalhos indevidamente visíveis. Após a correção: saída 0, ambos ocultos com anotação e voltam ao remover o texto. Conferência de permissões com login sintético real do backend, limpeza, recarga, prancha de desenho, continuidade para Observação Social e nenhuma leitura/escrita clínica pelo guia.
- `npm run check`, lint dos quatro arquivos alterados, `npm run build:client` e build do Worker com Wrangler: saída 0. O Worker não sofreu alterações neste patch.

Não houve uso de dados reais, acesso à produção, merge ou deploy. Não é validação clínica. Rollback: reverter o commit, sem migração ou estado persistente.

Regressão adicional: `npm run test:clinical-assistant-guide` saiu 0; 19 testes e quatro jornadas de navegador. A jornada de Observação Social desta suíte usa autenticação de fixture de UI separada (não é prova de backend); mostrou descarte do vídeo local, preservação da anotação e ausência de falsa observação direta. A entrada por login canônico e a navegação até Observação Social foram cobertas separadamente no ensaio D1.
