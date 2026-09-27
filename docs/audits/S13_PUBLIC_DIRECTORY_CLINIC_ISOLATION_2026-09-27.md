# S13 — isolamento do diretório público por clínica

Data: 27 de setembro de 2026. Correção de seguimento: [PR #1016](https://github.com/jadsonfraga/neuroped/pull/1016).

## Contexto e causa

A [PR #1008](https://github.com/jadsonfraga/neuroped/pull/1008), head `2da4ef4815f57c3655e48b4bdee0d03207791b33`, já havia sido mergeada antes deste trabalho (merge `84f469e8843525f747a06741e75729fe0ec8d13c`). Esta correção parte do main `9f0930fdfe6d03913935c03a6fe49d8cd9f044e3` e deve seguir em PR separada, sem merge automático.

Em `functions/api/public-booking.ts`, `publicProviders` verificava a membership na clínica solicitada em um predicado independente do `EXISTS` de serviços. Este aceitava qualquer serviço público ativo do profissional, mesmo de outra clínica. Não era problema de seletor ou timing: a própria consulta SQL admitia o resultado incorreto.

A correção une `booking_services`, `clinic_memberships` e `clinics` dentro do mesmo `EXISTS`: o serviço e a membership ativa precisam corresponder ao mesmo profissional e à mesma clínica ativa. Com slug explícito, essa mesma clínica precisa ter o slug solicitado. Sem slug, permanece a exigência de exatamente uma membership ativa; serviços de memberships revogadas não podem habilitar a descoberta legada.

## Prova RED — regressão antes da correção

Head com os testes e SQL original: `9dcfc928eb5523e43267896e53958a6e5c14c55a`.

[PR Check, run 36328509261, job 108645808849](https://github.com/jadsonfraga/neuroped/actions/runs/36328509261/job/108645808849).

O CI executou `npm run test:operations` sobre o merge de teste do GitHub `ac3c850ccb6603af9e0c589228beb5ef4e77bdd1`. A falha foi a assertiva de `public-booking-clinic-regressions.ts:60`: `S13: public service only in B must not list the provider in A`. O resultado efetivo continha `s13-synthetic-professional`; o esperado era `[]`. Havia memberships ativas em A e B, mas zero serviços em A e um serviço público em B. TypeScript, build, lint e bundle das Functions passaram; o gate agregado corretamente falhou pela suíte de operações.

## Prova GREEN — mesma regressão após a correção

Commit da correção: `7c9499e7312e97fae6afa565218028fba121649e`.

[PR Check, run 36328888506, job 108646871659](https://github.com/jadsonfraga/neuroped/actions/runs/36328888506/job/108646871659).

O CI executou o merge de teste `8cc97439bd85d1a40f8819d900f34b9d9af85fd0` contra main `8c24de888158c35d4e111a8352c6c2b9643fa24a`. Em 15:17:46 UTC, o log registrou a conclusão da regressão S13: diretório negativo A/B, reservas e listas de espera 201 nas duas clínicas, persistência isolada e recusas de acesso. A suíte completa de operações e o gate agregado terminaram com sucesso. Também passaram `operations-delegated-staff-gate` e `operations-staff-link-anti-enumeration`, preservando a cobertura da #1010.

Este registro comprova esses runs e commits específicos, não substitui a verificação dos checks do head final da PR. Resultados posteriores e estado de revisão ficam na conversa e no painel de checks da #1016. Merge de teste do GitHub não significa merge no main.

## Cobertura permanente

`tests/unit/public-booking-clinic-regressions.ts` é chamado por `tests/unit/operations-tenant-isolation.test.ts`, já incluído em `npm run test:operations` e no gate de release. Usa os handlers reais, o schema real e todas as migrations no harness SQLite/D1 existente; não mocka o SQL.

- Diretório A vazio quando só B possui serviço; controle positivo de B; A passa a listar após criar seu próprio serviço. Serviços inativos ou não públicos não habilitam descoberta.
- Horários realmente disponíveis, em data futura calculada, e serviços restritos à clínica selecionada. Horários A/B distintos preservam a proteção global contra sobreposição do profissional.
- Reserva e lista de espera bem-sucedidas em A e em B, com HTTP 201, tokens, status e `clinic_id`, `provider_user_id` e `service_id` conferidos nas linhas persistidas. A reserva ocupa efetivamente o horário.
- Dashboards autenticados com apenas os serviços, consultas e listas de espera de sua clínica, inclusive dados sintéticos decifrados.
- Troca de serviços A/B recusada nos dois sentidos, sem gravações. Clínica inexistente, sem membership, suspensa ou com membership revogada: perfil/horários/diretório e POSTs falham fechados, sem alterar registros existentes.
- Link sem clínica permanece bloqueado quando ambíguo; link legado de clínica única válida continua funcionando e não aproveita serviço de clínica revogada.

Reprodução, em checkout com dependências instaladas e Node 24:

```sh
node --import tsx tests/unit/operations-tenant-isolation.test.ts
npm run test:operations
npm run verify
```

## Reconciliação, limites e rollback

O merge da #1010 (`12520218e938c3cde8b075772f1bedf544554f4d`) é ancestral do commit corrigido: comparação do GitHub retornou `ahead`, `behind_by: 0`, com o próprio merge da #1010 como merge-base. Esta PR não reescreve agenda, middleware da recepção, autorização de equipe, migrations, workflows ou documentos compartilhados S23/S23b.

Nenhum teste anterior foi removido ou enfraquecido. Nenhum dado de produção foi usado. Não se afirma deploy, validação manual de navegador, migração remota, entrega de notificações ou operação comercial a partir desta prova de integração em CI.

Rollback: reverter os commits desta PR corretiva. Não há migration nem mutação de dados de produção decorrente da mudança.
