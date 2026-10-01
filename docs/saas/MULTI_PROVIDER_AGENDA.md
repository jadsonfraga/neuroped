# Agenda multiprofissional — uma recepção, vários médicos (OPS-03)

Rastreio: issue #1064. Origem: `docs/audits/SAAS_TENANCY_AUDIT_2026-09-26.md`
(OPS-03). Este documento é estendido a cada PR do ciclo; o estado de cada etapa
está na tabela abaixo.

| Etapa | Escopo | Estado |
| --- | --- | --- |
| A | Migração 0032, bootstrap em runtime, workflow de migração, resolução do principal fail-closed com mais de um vínculo | PR A |
| B | Seleção validada do profissional, middleware, vínculo com vários profissionais, revogação por vínculo, e-mail com contexto do profissional | PR B (empilhada sobre a A) |
| C | Seletor na UI, rótulo "Agenda de X", `queryKey` com o profissional, texto de `/planos` | pendente |
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

## Risco aberto para a etapa B: membership a cada requisição

Hoje a membership `assistant` ativa só é validada **ao vincular**
(`STAFF_MEMBERSHIP_PREDICATE`), não a cada requisição. Remover a membership de uma
recepção não revoga o vínculo. Exigi-la a cada requisição fecha essa brecha, mas
pode barrar vínculos legados anteriores ao AUTHZ-P1-06 (a auditoria registra, em
OPS-10, "se a secretária do cliente zero tem membership: unknown").

Censo a rodar **no D1 de produção** antes de endurecer (somente contagem; não é
possível a partir do ambiente de desenvolvimento, por isso não foi executado):

```sql
SELECT COUNT(*) FROM booking_staff_links l
 WHERE l.active = 1 AND NOT EXISTS (
   SELECT 1 FROM clinic_memberships m
    WHERE m.user_id = l.staff_user_id AND m.role = 'assistant' AND m.active = 1);
```

Resultado `0`: a etapa B pode exigir a membership a cada requisição. Maior que `0`:
tratar esses vínculos (convite + aceite) antes, ou manter a exigência apenas para
o caminho com seleção de profissional.

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
  - pedido ausente e exatamente um profissional possível → essa agenda (histórico,
    inalterado);
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
- **Membership a cada requisição.** Com escolha explícita ou vários vínculos, a
  membership `assistant` ativa da recepção na clínica da requisição é exigida e a
  falta responde como "indisponível". Um vínculo **único** sem escolha mantém o
  comportamento histórico (não exige a membership), para não barrar vínculos legados
  anteriores ao AUTHZ-P1-06; ver o risco aberto abaixo. A UI (etapa C) só deve enviar
  `provider` quando houver mais de um profissional.
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
