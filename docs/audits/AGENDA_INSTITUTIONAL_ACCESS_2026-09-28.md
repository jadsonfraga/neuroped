# Agenda institucional indisponível — incidente #1039

## Diagnóstico confirmado em 28/09/2026

Baseline de produção: `7859e3af4453fe4ae2134b46dffbd2bf359f2dd3`.
Diagnósticos metadata-only: runs `36443005206` e `36443282761`, na branch
`diagnose/agenda-live-20260928` (não publicada como aplicativo).

A conta institucional selecionada pelo secret existente `ADMIN_EMAIL` foi
localizada de forma única, ativa, com papel global `admin`, sem troca de
senha pendente e **sem qualquer membership de clínica persistida**. A agenda
exige identidade autenticada, vínculo persistente e entitlement da clínica:
o papel global isolado não satisfaz essa fronteira e não deve passar a ser
um bypass. As tabelas operacionais e os campos clinic_id já existem em D1;
a configuração da chave operacional está presente. Nenhum dado de agenda
foi lido para produzir esses relatórios; somente schema e metadados de acesso.

A conta técnica reservada NEUROPED_E2E_EMAIL é reader, sem memberships, como
exige seu contrato. Ela retorna BILLING_CLINIC_CONTEXT_REQUIRED na agenda.
Não será elevada para mascarar o incidente nem usada como identidade médica.

## Correção de escopo único

Após revisão e merge normal, o workflow `Institutional agenda access` cria
para a conta institucional exata uma clínica NeuroPed SDG, membership owner,
um cadastro de acesso interno não faturável (`provider=none`, `status=active`)
e um recibo em saas_audit_log. Isso usa o contrato de entitlement já existente,
sem criar assinatura paga, cobrança, fatura, cliente externo ou período trial.
Não altera os guards, papéis globais, senhas ou contas de terceiros.

O pedido expresso do proprietário é usar sua agenda institucional. O bootstrap
é administrativo e excepcional: não concede gratuidade a novos clientes nem
é ligado ao cadastro self-service. Sua execução real exige main, repositório
canônico, identidade exata e binding D1 de produção verificado.

Pré-condições e quatro INSERTs são executados no mesmo batch transacional.
Qualquer contexto preexistente não reconhecido exige reconciliação, sem
criar clínica duplicada. Nova execução com recibo reconhecido apenas confere
as pós-condições; não reativa clínica suspensa nem sobrescreve licença alterada.
Não são criados horários, serviços, preços, pacientes ou compromissos. Nenhum
registro histórico sem clinic_id é atribuído por suposição.

## Validação e limites

Executado localmente, saída 0:
`node --experimental-strip-types --experimental-sqlite tests/unit/institutional-agenda-setup.test.mjs`.

O teste executa os DDLs reais em SQLite, o SELECT real de entitlement e o
avaliador real de billing. Cobre dry-run, idempotência, exclusão da conta E2E,
concorrência, recusa de contexto preexistente/suspenso e rollback integral
quando a última gravação falha.

O container não dispõe de rede para npm/checkout; não foi alegada execução
local da suíte completa. Os checks normais do GitHub devem passar no SHA
final antes do merge. O workflow próprio valida o script em PR **sem secrets
ou gravações remotas**. O job de aplicação só existe no push revisado de main.
O recibo de aplicação registra resultado, commit e run, nunca dados pessoais.

Depois de aplicar: provar o vínculo e entitlement reais, checar os deploys
Cloudflare/Vercel e exercitar o fluxo de agenda em ambiente publicado com
identidade operacional de teste isolada, sem usar senha ADMIN_* como fallback
nem atribuir clínica à conta E2E reservada. Sem essa prova, não declarar
resolução ponta a ponta. A issue #1039 concentra evidências posteriores.

Essa mudança não certifica a prontidão clínica/LGPD geral. Tampouco ativa
agendamento público ou inventa configurações de atendimento ainda não fornecidas.

## Rollback seguro

Reverter a PR remove o mecanismo de bootstrap, mas não desfaz registros já
criados em D1. Após conferência de uso e autorização, revogar o acesso criado
por desativação auditada da membership e do cadastro interno exatos. Não
excluir a clínica, contas ou dados clínicos em cascata. Preservar o recibo de
auditoria e quaisquer atendimentos criados legitimamente depois da correção.
Se não houve aplicação, não há rollback de dados. Nenhuma migration histórica
é alterada, nenhuma senha é trocada e nenhuma sessão de usuário é forjada.
