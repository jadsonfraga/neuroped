# Prontuário LIVE: carregamento completo da leitura ativa

Base: `89c8d0d`. Evidência anterior à mudança: Chromium → Pages Functions → D1 local, 500 revisões mais recentes em estado corrected e uma anamnese ativa ainda gravada; HTTP 200 deixava o campo vazio. Controle com 499 revisões reabria corretamente.

1. Acrescentar teste com a rota real e SQLite: o modo ativo retorna a seção mais antiga apesar do histórico; o contrato de histórico não muda; paginação cobre empates e isolamento entre clínicas.
2. Em `functions/api/live/events/index.ts`, oferecer leitura ativa opcional, limitada por página, ordenada por data do evento, data de gravação e ID. Filtrar pelo tenant, paciente e status no SQL. Reutilizar autenticação, verificação da clínica e criptografia atuais.
3. No cliente, ler todas as páginas antes de hidratar os campos. Falha ou repetição de cursor bloqueia edição, exportação e salvamento; a tela oferece nova tentativa. Evitar mostrar o último paciente durante troca de contexto. Preservar demais consumidores e histórico.
4. Atualizar exclusivamente o contrato necessário na fixture visual. Rodar tipos, testes focados, build e comprovar em Chromium ligado ao Worker compilado com D1 local, inclusive falha na segunda página. Sem migração, produção, alterações clínicas ou dados reais.
5. Rollback: reverter o commit isolado. Não há migração nem mudança de dados.
