# Agenda multiprofissional — uma recepção, vários médicos (OPS-03)

Rastreio: issue #1064. Origem: `docs/audits/SAAS_TENANCY_AUDIT_2026-09-26.md`
(OPS-03). Este documento é estendido a cada PR do ciclo; o estado de cada etapa
está na tabela abaixo.

| Etapa | Escopo | Estado |
| --- | --- | --- |
| A | Migração 0032, bootstrap em runtime, workflow de migração, resolução do principal fail-closed com mais de um vínculo | PR A |
| B | Seleção validada do profissional, middleware, vínculo com vários profissionais, revogação por vínculo, e-mail com contexto do profissional | PR B (empilhada sobre a A) |
| C | Seletor na UI, rótulo "Agenda de X", `queryKey` com o profissional, texto de `/planos` | PR C (empilhada sobre a B) |
| D | Visão unificada do dia (opcional, PR separada) | pendente |

## Problema

`booking_staff_links.staff_user_id` é `UNIQUE` (0008) e `resolveOperationsPrincipal`
resolve a recepção com `LIMIT 1`. Uma secretária atende no máximo um profissional,
o que é inviável numa clínica com vários.

## Decisões

1. **Reconstruir a tabela no lugar, e não criar uma segunda tabela.** A auditoria
   sugere uma tabela nova com chave por clínica. Foi avaliada e não adotada na
   etapa A: duas tabelas exigiriam sincronizar vínculos criados ou suspensos entre
   a migração e o corte do código (a migração e o deploy são workflows separados e
   concorrentes). Reconstruindo no lugar há uma única fonte de verdade, e o
   escopo por clínica é imposto **a cada requisição** (etapa B), não pela chave.
2. **A etapa A só relaxa o schema.** Nada passa a aceitar dois vínculos:
   `linkOperationsOperator` continua recusando o segundo. O que muda de
   comportamento é apenas fechar a ambiguidade: operador com mais de um vínculo
   ativo não recebe agenda (antes, o `LIMIT 1` escolheria uma por ordem de
   armazenamento).
3. **O vínculo não consome assento.** O teto conta memberships
   (`assertSeatAvailable`, `functions/api/billing`); uma membership `assistant`
   vale um assento qualquer que seja o número de profissionais atendidos.

## Migração 0032: por que a sequência é essa

O SQLite não remove `UNIQUE` com `ALTER`. A reconstrução é: renomear a tabela
atual, derrubar os índices (os nomes acompanham a tabela renomeada), criar a
nova com `IF NOT EXISTS`, copiar com `INSERT OR IGNORE`, descartar a legada e
recriar os índices (mais `idx_booking_staff_staff_active`, que substitui o
índice implícito da `UNIQUE` nas consultas por operador).

Ela converge mesmo que o D1 não execute o arquivo de forma atômica e mesmo que o
bootstrap em runtime (`ensureOperationsHardeningSchema`, `CREATE TABLE IF NOT
EXISTS` a cada requisição) recrie a tabela vazia no intervalo; os dois casos e a
reexecução são testados em `tests/unit/staff-links-multi-provider-migration.test.ts`.
A tabela não é pai de nenhuma chave estrangeira, então renomear e descartar não
afeta outras tabelas.

Duas garantias fora do SQL:

- **Fila D1.** `staff-links-multi-d1.yml` está em `D1_MIGRATION_WORKFLOWS`
  (`scripts/ci/wait-d1-writers.mjs`), então roda em FIFO com
  `operations-d1-migration.yml`, que reaplica a 0008 (cria a tabela no formato
  antigo se ela não existir) a cada push da agenda. Sem a fila, a reaplicação
  poderia intercalar com a reconstrução.
- **Preflight fail-closed.** O workflow classifica o D1 antes de escrever: já
  aplicada (pula), a aplicar (exige zero vínculos órfãos), tabela legada presente
  (migração interrompida: falha sem alterar nada) ou tabela ausente (falha). A
  verificação final confere ausência da `UNIQUE`, PK composta, autoria, os dois
  índices, ausência da tabela legada e que os vínculos não diminuíram.

`operations-d1-migration.yml` verificava `staff_user_id ... UNIQUE` no D1. Essa
asserção foi trocada por "PK composta presente", válida nas duas formas; a
verificação da forma nova é do workflow da 0032 (mais estrita: exige que a
`UNIQUE` tenha saído).

## Ordem segura e rollback

- A etapa A pode ser publicada com qualquer ordem entre código e migração: com no
  máximo um vínculo por operador (o código ainda não cria o segundo), código novo
  e antigo se comportam igual.
- A etapa B só deve ser publicada depois da A.
- **B e C devem ir ao ar juntas.** Depois da B, um profissional pode vincular uma
  recepção que já atende outro médico (antes era recusado). Uma recepção com dois
  profissionais recebe `409 PROVIDER_SELECTION_REQUIRED` até escolher, e a UI atual
  (anterior à C) não sabe escolher: ela ficaria sem agenda até a C. Publicar a B
  sozinha só é seguro se ninguém vincular uma segunda vez no intervalo.
- **Rollback da B** volta ao código da A, que é fail-closed com mais de um vínculo.
- **Não reverta para antes da A** depois que existir operador com dois vínculos:
  o `LIMIT 1` antigo escolheria uma agenda arbitrária. Para voltar com segurança,
  deixe no máximo um vínculo ativo por operador antes (SQL no cabeçalho da 0032).

## Membership a cada requisição (decidido: vale para toda recepção)

Antes, a membership `assistant` ativa só era validada **ao vincular**
(`STAFF_MEMBERSHIP_PREDICATE`). Remover a membership de uma recepção não revogava o
vínculo, e o vínculo único legado (anterior ao AUTHZ-P1-06) nem a exigia nas
requisições. A etapa B manteve isso para o vínculo único só porque não havia censo.
O censo da migração 0032 mostrou **zero** vínculos em produção (`VINCULOS_ANTES: 0`,
2026-10-01), então não há vínculo legado a proteger, e a exigência passou a valer
para **toda** recepção:

- **No vínculo.** Um vínculo só é válido se a recepção for membro `assistant` ATIVO
  de uma clínica em que o profissional também é membro ativo
  (`OPERATOR_SHARES_CLINIC_WITH_PROVIDER`, dentro de `ACTIVE_VALID_PROVIDER_LINK`).
  Sem isso o vínculo conta como inexistente: a recepção que perdeu a membership
  recebe `403 STAFF_LINK_REQUIRED` e **nem a lista de nomes do `409`**. Pedir um
  profissional explicitamente nessa condição cai em `PROVIDER_NOT_AVAILABLE`,
  indistinguível dos outros motivos.
- **Na requisição.** Depois de resolver a clínica do profissional
  (`resolveBillingClinicId`), `resolveOperationsContext` exige a membership na
  clínica **exata** (fecha o `X-Tenant-Id` de uma clínica onde o profissional é
  membro mas a recepção não é): `403 PROVIDER_NOT_AVAILABLE`.
- **Revogação.** Retirar a membership revoga o acesso na requisição seguinte, sem
  mexer no vínculo; devolver a membership devolve o acesso.

Antes de publicar, rode o censo **no D1 de produção** (somente contagem; não é
possível a partir do ambiente de desenvolvimento). Ele conta os vínculos ativos que
**perderiam o acesso** com esta mudança:

```sql
SELECT COUNT(*) FROM booking_staff_links l
 WHERE l.active = 1 AND NOT EXISTS (
   SELECT 1 FROM clinic_memberships ms
     JOIN clinic_memberships mp ON mp.clinic_id = ms.clinic_id
    WHERE ms.user_id = l.staff_user_id AND ms.role = 'assistant' AND ms.active = 1
      AND mp.user_id = l.provider_user_id AND mp.active = 1);
```

Resultado `0`: nada muda para ninguém. Maior que `0`: essas recepções passam a receber
`STAFF_LINK_REQUIRED` até serem convidadas para a clínica (convite + aceite) ou a
membership ser reativada. **Rollback:** reverter o PR devolve o comportamento da etapa
B (vínculo único sem exigir membership); não há migração.

## Etapa B — contrato da seleção de profissional

Fonte única: `functions/api/operations/_context.ts` (`resolveOperationsContext`),
usada pelo middleware (tenant e billing) e pelo handler. O Express chama o handler
sem o middleware, então a validação não pode viver só no middleware.

- **Transporte.** `?provider=<id do profissional>` na query, em GET e POST. O
  corpo da requisição **nunca** define o profissional (o contexto não lê o corpo; há
  asserção estática e teste). Só o papel `operator` seleciona; profissional e admin
  operam sempre a própria agenda e o pedido é ignorado.
- **Resolução** (`resolveOperationsAccess`): entre os vínculos **ativos** com
  profissional **ativo** e papel `admin`/`professional`:
  - pedido presente e válido → essa agenda;
  - pedido ausente e exatamente um profissional possível → essa agenda;
  - pedido ausente e mais de um → `409 PROVIDER_SELECTION_REQUIRED` com
    `providers: [{ id, name }]` (nada além de id e nome);
  - pedido que não está entre os vínculos ativos → `403 PROVIDER_NOT_AVAILABLE`.
    Inexistente, sem vínculo, vínculo suspenso, profissional inativo e o próprio
    operador como alvo respondem **exatamente igual** (anti-enumeração);
  - nenhum vínculo → `403 STAFF_LINK_REQUIRED` (inalterado).
- **Clínica.** É a do profissional escolhido (`resolveBillingClinicId`); `X-Tenant-Id`
  continua sendo só um alvo, validado contra a membership **do profissional**.
  Cada requisição opera exatamente um par (profissional, clínica), com billing e
  encerramento (402/423) por esse par.
- **Membership a cada requisição.** Exigida de toda recepção (com ou sem escolha,
  um ou vários vínculos); ver a seção "Membership a cada requisição" acima. A UI
  (etapa C) só deve enviar `provider` quando houver mais de um profissional.
- **Dashboard.** `access.availableProviders` (só para a recepção) lista as escolhas.
- **Vínculo.** `staff_link` passa a aceitar uma recepção já vinculada a outro
  profissional: o vínculo é do par (profissional, recepção). A membership `assistant`
  ativa continua repetida no predicado do `UPDATE` e do `INSERT`; o segundo vínculo
  não revela nada sobre o primeiro. `STAFF_ALREADY_LINKED` deixou de existir. Os três
  erros restantes (e-mail inexistente, papel inválido, sem membership aqui) seguem
  indistinguíveis.
- **Revogação.** `staff_active` só altera o vínculo do **próprio** profissional;
  suspender um vínculo mantém os outros.
- **Assentos.** Sem mudança: o teto conta memberships, não vínculos.

## Etapa C — UI da escolha de profissional

Só `client/src/pages/agenda.tsx` consome `/api/operations`. A `recepcao.tsx` é a
página das pré-consultas guardadas no dispositivo e não usa essa API, então não
recebe seletor.

- **Escolha.** Recepção com mais de um profissional que recebe o `409` vê "Qual
  agenda você vai operar?" com um botão "Agenda de X" por profissional. Com a
  agenda aberta, a barra "Agenda de X" fica acima das abas (vale para todas) e, com
  mais de um profissional, traz o seletor "Trocar profissional". Com um só
  profissional a barra mostra o rótulo e não há seletor.
- **Sem mistura.** A chave da consulta inclui o profissional
  (`/api/operations?resource=dashboard&provider=<id>`); depois de uma ação todas as
  agendas em cache são invalidadas. Trocar de profissional descarta o formulário de
  agendamento manual, a busca de paciente e a remarcação em andamento.
- **Ações.** Vão para o profissional escolhido pela **query** (`?provider=`); o corpo
  nunca o carrega. Cancelar, check-in, falta e remarcar dizem "— agenda de X" na
  mensagem de sucesso e no `title` do botão, e o formulário de remarcação diz
  "Remarcando na agenda de X."
- **Só quando preciso.** O `provider` só é enviado por recepção com mais de um
  profissional. Se o painel mostrar que não é recepção, ou que há um só profissional,
  a escolha lembrada é esquecida (profissional e recepção de vínculo único seguem o
  caminho sem `provider`; a membership é exigida do mesmo jeito).
- **Escolha lembrada.** `localStorage`, uma chave por conta
  (`neuroped:agenda:provider:v1:<id da conta>`), só o id do profissional, sempre em
  `try/catch` e só pelo helper `client/src/lib/agendaProvider.ts`. Nunca é
  autoridade: o servidor valida a cada pedido. Se o servidor recusar a escolha
  lembrada (`403 PROVIDER_NOT_AVAILABLE`), ela é esquecida e a tela volta a pedir.
- **`/planos`.** O texto passa a descrever a recepção com vários profissionais.
  Publicar a C sem a B tornaria o texto falso; por isso B e C vão juntas.

### Como foi provado

- `tests/unit/agenda-provider.test.ts`: chave e URL sem injeção por id hostil,
  leitura validada do `409`, escolha por conta, armazenamento que lança.
- `tests/unit/agenda-multi-provider-static.test.mjs`: contrato do código.
- `tests/e2e/agenda-multi-provider.mjs`: navegador (Chromium) sobre a UI de produção
  e uma API sintética que reproduz o contrato do backend da etapa B; inclui axe no
  escolhedor e na barra. Roda em `live-browser-persistence-guard.yml`. O backend
  real é provado em `operations-multi-provider.test.ts`; **a UI e o backend reais
  nunca rodaram juntos** neste ciclo.

### CI de PRs empilhados

Os workflows principais filtram `branches: [main]`. Um PR cujo base é a branch da
etapa anterior roda só uma parte dos checks até o base virar `main`. Cada etapa foi
validada localmente (tipos, lint, `test:operations`, `test:quick-wins`) e o CI
completo roda quando o base é retargetado para `main`, depois que a etapa anterior
entra.
