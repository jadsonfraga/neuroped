# Bloqueio externo — prova autenticada de escrita da agenda (#1039)

Em 28/09/2026, a inspeção por GitHub/Cloudflare forneceu schema e metadados
reais suficientes para identificar ausência de membership da conta institucional.
A PR #1040 corrige somente esse provisionamento, com testes SQLite e guards
existentes preservados. Este registro fica na branch diagnóstica, sem alterar o
aplicativo publicado.

| Sistema/acesso | Situação | Ação que falta | Como verificar |
| --- | --- | --- | --- |
| Sessão de navegador do proprietário | Não disponível nesta execução | Abrir a agenda com sessão legítima após a correção | Confirmar dashboard 200, clínica correta e releitura de uma alteração autorizada |
| Identidade operacional sintética para teste no domínio publicado | Criação do workflow de fixture bloqueada pelos controles de execução; não foi executada | Um teste autorizado, isolado e com limpeza verificada | Registrar o resultado real, nunca resposta mockada ou token forjado |
| Sentinela E2E reservada | Reader sem clinic_membership por desenho | Nenhuma mudança nessa conta | Login/logout continuam funcionais e acesso clínico continua negado |

Não usar senha administrativa como fallback, não elevar a sentinela E2E e não
criar sessões em nome do proprietário para produzir evidência artificial.
Nenhuma tentativa alternativa foi usada para contornar o bloqueio de fixture.

A prova de configuração/entitlement persistido, se obtida pela PR #1040, não
substitui prova da jornada de escrita publicada. A issue #1039 deve permanecer
aberta enquanto faltar essa etapa; não afirmar funcionamento integral de todos
os módulos ou encerramento ponta a ponta apenas porque CI/deploy ficaram verdes.
