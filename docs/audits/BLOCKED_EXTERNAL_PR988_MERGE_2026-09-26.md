# BLOCKED_EXTERNAL — merge da PR #988 travado por colisão de migração em PRs de terceiros

Data: 2026-09-26 · PR `jadsonfraga/neuroped#988` (branch
`claude/neuroped-multi-tenant-saas-wqywjw`, head `7dc118bd7e143f1ed7a1214b356c20de7011fe1f`).

## Sistema

Branch protection do repositório `jadsonfraga/neuroped` na branch `main`,
via o check obrigatório `Build & Lint` (workflow `pr-check.yml`), cujo step
"Validar governança de migrations" roda
`scripts/guards/check-migration-governance.py` contra a API do GitHub.

## Ação que falta

A tentativa de merge (`PUT /repos/jadsonfraga/neuroped/pulls/988/merge`)
retorna `405 Required status check "Build & Lint" is failing.`. O log do
step mostra a causa exata:

```
prefixo 0026 concorre entre PRs abertos: #986 (db/migrations/0026_clinic_feature_flags.sql),
#840 (db/migrations/0026_saas_commercial_catalog.sql)
```

Nem #986 nem #840 pertencem a esta sessão/branch — são PRs de terceiros
(outras sessões autônomas rodando em paralelo no mesmo repositório). A
migração desta PR já foi renumerada de `0026` para `0029`
(`db/migrations/0029_operations_clinic_scope.sql`, commit `7dc118b`) e o
próprio log de CI já não cita #988 na lista de colisão — a falha
remanescente é mútua entre #986 e #840. Resolvê-la exige que um dos dois
renumere sua migração ou que um deles mescle primeiro (o que libera o
prefixo `0026` para o outro), e nenhuma dessas ações pode ser tomada a
partir do repositório/branch desta sessão: exigiria push em branch alheia
sem autorização, o que a política operacional desta sessão proíbe
explicitamente.

Já executado antes de declarar o bloqueio, conforme a disciplina de CI
vermelho: diagnóstico da causa raiz via log do job, um re-run do check
(`rerun_failed_jobs`, run `36246515359`) confirmando reprodução idêntica, e
um comentário de standing-down na PR
(https://github.com/jadsonfraga/neuroped/pull/988#issuecomment-5846831715)
nomeando o check, a causa e a ausência de correção possível a partir desta
PR.

## Por que isso bloqueia o achado

Todos os demais checks obrigatórios e não-obrigatórios da PR #988 estão
verdes (39 de 41 check runs com `conclusion: success`, incluindo
`tenant-isolation`, `test:tenant-isolation:live`, `billing`,
`reconcile-contracts`, `lgpd-worker-executor`, `guided-flow` e o próprio
`require-checks`/"Production Readiness"). Os únicos dois vermelhos
(`Migration governance` standalone e o step homônimo dentro de
`Build & Lint`) falham pelo mesmo motivo externo. Sem a liberação do
prefixo `0026` por #986 ou #840, o GitHub recusa o merge por proteção de
branch — mesmo com a PR tecnicamente pronta e sem nenhum item pendente do
lado desta sessão.

## Risco de não executar

Nenhum risco de segurança ou dado: o bloqueio é puramente de governança de
CI entre PRs concorrentes, não de conteúdo. O risco é de atraso — as nove
correções de isolamento multi-tenant (S6–S22) já testadas e revisadas
ficam represadas em PR até a colisão externa se resolver.

## Como verificar a conclusão

1. Observar quando #986 ou #840 mesclar em `main`, ou quando qualquer um
   dos dois renumerar sua migração para sair de `0026`.
2. Reconferir `Migration governance`/`Build & Lint` na PR #988 (podem
   passar a verdes automaticamente assim que a colisão cruzada deixar de
   existir, sem exigir novo push desta PR — o script consulta PRs abertos
   ao vivo).
3. Repetir a tentativa de merge (`merge_method: "merge"`, preservando os
   commits atômicos por camada) assim que os dois checks reportarem
   `success`.
4. Após o merge, acompanhar os workflows disparados por push em `main`
   (`operations-clinic-scope-d1-migration.yml` aplicando
   `0029_operations_clinic_scope.sql`, `deploy-cloudflare.yml`,
   `boaconsulta-import-release.yml`) até confirmarem sucesso, corrigindo
   adiante qualquer falha própria desta mudança.

Esta sessão mantém a subscrição de eventos da PR #988 ativa e vai agir
assim que o gate externo mudar de estado.
