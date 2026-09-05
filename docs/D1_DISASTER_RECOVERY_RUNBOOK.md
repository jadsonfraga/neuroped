# NeuroPed — D1 Disaster Recovery Runbook

**Data de revisão:** 23 de agosto de 2026  
**Runtime canônico:** Cloudflare Pages Functions + D1 (`neuroped-db`)  
**Estado desta revisão:** `BLOCKER_PRODUCTION` — procedimento definido, mas restore controlado ainda não foi executado com credencial provider nesta sessão.

## 1. Objetivo

Provar que o NeuroPed consegue recuperar o estado persistido de D1 após uma mutação destrutiva, migration defeituosa ou corrupção lógica **sem experimentar na base de produção** e sem expor PHI em logs/artefatos.

Backup somente não satisfaz este gate. O critério é **restauração executada + invariantes validadas** em ambiente isolado.

## 2. Mecanismos suportados pelo provider

Cloudflare D1 Production possui Time Travel / point-in-time recovery sempre ativo. O provider permite obter bookmark e restaurar a base para um bookmark/timestamp dentro da janela de retenção aplicável ao plano. A restauração Time Travel sobrescreve a base-alvo in-place; portanto **nunca deve ser ensaiada diretamente em `neuroped-db`**.

Wrangler também suporta export SQL remoto e import via `d1 execute --file`. Como Time Travel ainda não cria clone/fork diretamente, o rehearsal isolado deve usar **um D1 temporário criado exclusivamente para DR**, alimentado por export controlado ou por um snapshot sanitizado aprovado.

Comandos de referência atuais:

```bash
npx wrangler d1 info neuroped-db
npx wrangler d1 time-travel info neuroped-db --json
npx wrangler d1 export neuroped-db --remote --output=/tmp/neuroped-dr.sql
npx wrangler d1 execute <TEMP_DB> --remote --yes --file=/tmp/neuroped-dr.sql
npx wrangler d1 time-travel info <TEMP_DB> --json
npx wrangler d1 time-travel restore <TEMP_DB> --bookmark=<BOOKMARK>
```

> O arquivo `/tmp/neuroped-dr.sql` pode conter PHI. Ele deve existir somente no runner efêmero aprovado, com `set +x`, nunca ser impresso, anexado como artifact ou enviado a storage não aprovado, e deve ser apagado no `finally`/trap.

## 3. RPO e RTO

### RPO

- **Mecanismo:** D1 Time Travel.
- **Granularidade operacional documentada pelo provider:** restauração para um minuto/ponto no tempo dentro da janela de Time Travel.
- **RPO técnico esperado:** <= 1 minuto dentro da janela de retenção do plano.
- **RPO comprovado no NeuroPed:** `NÃO VERIFICADO NESTA SESSÃO`.

### RTO

- **RTO alvo operacional:** <= 60 minutos para incidente de corrupção lógica isolado em D1.
- **RTO estimado antes do rehearsal:** 30–60 minutos, incluindo decisão, criação/validação do alvo isolado, restore/import, migrations e smoke.
- **RTO evidenciado:** `DESCONHECIDO` até medir um rehearsal completo de ponta a ponta.

Não declarar RTO cumprido com base apenas nesta estimativa.

## 4. Pré-condições

1. `main` e SHA de produção identificados.
2. Incident commander nomeado.
3. Nenhuma restauração apontando para `neuroped-db` durante rehearsal.
4. Credencial Cloudflare com acesso mínimo necessário a D1.
5. Nome do D1 temporário explicitamente contendo `dr-rehearsal` e data.
6. Nenhum paciente real criado pelo teste.
7. Logs em modo metadata-only; não usar `cat`, `head`, `grep` ou debug sobre export de dados.
8. `CLINICAL_DATA_KEY`, `CLINICAL_INDEX_KEY` e versões necessárias disponíveis apenas como secrets do ambiente aprovado, nunca copiadas para relatório.

## 4-bis. Ensaio do mecanismo, automatizado

`.github/workflows/dr-mechanism-rehearsal.yml` executa as Etapas B, C
(variante sintética), D, E, F, G e I abaixo em um D1 temporário, medindo a
duração do restore. É `workflow_dispatch` com confirmação digitada — nunca
roda sozinho, porque cria e destrói banco.

O que ele prova: o Time Travel restaura estado neste provedor, a sentinela
volta, e quanto tempo o comando leva.

O que ele **não** prova, e por isso o campo RTO abaixo continua aberto: o
tempo de um restore de produção com volume real. Ele usa dados sintéticos
porque a Etapa C exige aprovação explícita de governança para copiar PHI
para um alvo temporário — aprovação que não existe. Enquanto essa decisão
não for tomada, o resultado é **mechanism rehearsal**, não restore integral.

Produção não é lida nem escrita em passo algum do workflow; o alvo é criado
pelo próprio job com a marca `dr-rehearsal` no nome, e um guard recusa
qualquer alvo sem essa marca — inclusive no `d1 delete` final.
`tests/unit/dr-rehearsal-safety.test.mjs` trava essas invariantes na CI.

## 5. Rehearsal seguro — procedimento obrigatório

### Etapa A — verdade de produção, somente metadata

Registrar sem segredos:

- SHA do `main`;
- SHA publicado no Cloudflare;
- D1 database name/id;
- `wrangler d1 info` com `version` e tamanho, redigindo qualquer campo desnecessário;
- bookmark atual do Time Travel;
- lista das migrations 0001–0015 esperadas pelo código.

Não executar mutação.

### Etapa B — criar alvo isolado

Criar banco temporário, por exemplo:

```text
neuroped-dr-rehearsal-20260823-<suffix>
```

O alvo não pode ser referenciado por Pages/Workers/domínios de produção.

### Etapa C — popular o alvo

Opção preferida quando aprovada pela governança:

1. export remoto de `neuroped-db` para arquivo efêmero no runner;
2. importar diretamente no D1 temporário;
3. apagar o arquivo imediatamente após import.

Se a cópia de PHI para D1 temporário não estiver explicitamente aprovada, usar snapshot sanitizado/sintético e marcar o resultado como **mechanism rehearsal**, não como restore integral de produção.

### Etapa D — medir baseline sem PHI

Capturar apenas invariantes/contagens:

- lista de tabelas/triggers/indexes;
- contagem por tabela clínica e operacional;
- checksums de metadata não clínica quando disponíveis;
- contagem por `clinic_id`, sem nomes/payloads;
- número de linhas cifradas e número de linhas com formato de envelope esperado;
- zero payload clínico selecionado em claro.

Salvar somente os números/checksums necessários.

### Etapa E — criar ponto de restauração

No D1 temporário:

1. obter bookmark `B0`;
2. inserir **somente sentinelas sintéticas** em tabelas de teste/tenant sintético;
3. obter bookmark `B1`;
4. executar uma mutação destrutiva controlada apenas sobre sentinelas sintéticas;
5. confirmar que as sentinelas foram alteradas/removidas.

### Etapa F — restaurar

Executar Time Travel **somente no D1 temporário** para `B1` ou timestamp correspondente.

Registrar:

- início/fim monotônico;
- bookmark restaurado;
- `previous_bookmark` retornado pelo provider para undo;
- status do comando.

Nunca registrar payload de linha.

### Etapa G — validação pós-restore

1. sentinelas sintéticas retornaram exatamente;
2. contagens/checksums metadata-only retornaram ao baseline;
3. schema esperado continua presente;
4. rodar migrations idempotentes aplicáveis;
5. executar suíte `tenant isolation RED x BLUE` contra o alvo isolado;
6. executar smoke de autenticação em ambiente isolado quando configurável;
7. validar que envelopes clínicos continuam cifrados;
8. validar que blind indexes continuam consultáveis sem revelar plaintext;
9. confirmar nenhuma migration pendente/inconsistente.

### Etapa H — undo do próprio restore

Quando tecnicamente seguro no D1 temporário, usar `previous_bookmark` para provar reversibilidade da restauração. Validar novamente sentinelas/contagens.

### Etapa I — destruição do ambiente de rehearsal

Somente após evidência concluída:

- remover o D1 temporário;
- apagar qualquer export efêmero;
- confirmar que nenhum Pages/Worker ficou vinculado ao alvo;
- manter apenas relatório metadata-only.

A exclusão do D1 temporário é permitida porque contém exclusivamente a cópia controlada de rehearsal e não é produção; se houver qualquer dúvida sobre o alvo, **não excluir** até revisão humana.

## 6. Critérios de sucesso

O rehearsal é `PASS` somente se todos forem verdadeiros:

- restore executado em D1 isolado;
- duração medida;
- sentinelas recuperadas;
- contagens/checksums reconciliados;
- migrations idempotentes;
- tenant isolation pós-restore verde;
- criptografia continua legível apenas pelas chaves corretas;
- nenhum log/artifact contém PHI;
- undo/reversibilidade documentados ou justificativa técnica explícita;
- alvo de produção jamais foi alterado.

## 7. Rollback de incidente real

Em incidente real, antes de qualquer restore in-place:

1. congelar writes no runtime quando possível;
2. registrar bookmark atual `B_current`;
3. identificar timestamp/bookmark saudável `B_good`;
4. validar decisão por duas pessoas autorizadas;
5. executar restore para `B_good`;
6. guardar o `previous_bookmark` retornado;
7. rodar smoke de health/auth/tenant isolation;
8. se inválido, usar `previous_bookmark` para desfazer;
9. somente então reabrir writes.

## 8. Quem precisa agir

- **Engenharia/operador Cloudflare:** executar comandos e capturar metadata.
- **Responsável clínico/controlador:** aprovar qualquer rehearsal que copie dados reais para um D1 temporário.
- **Incident commander:** autorizar restore em produção em incidente real.

## 9. Evidência faltante em 23/08/2026

Nesta sessão não existe ferramenta Cloudflare autenticada capaz de criar um D1 temporário e executar Time Travel. O GitHub contém secrets usados pelos workflows de deploy/migration, mas o conector disponível não oferece `workflow_dispatch` nem acesso aos valores dos secrets — corretamente.

Portanto:

```text
D1_RESTORE_REHEARSAL = NOT_PROVEN
BLOCKER_PRODUCTION = YES
PILOT_READY contribution = FAIL
```

A próxima ação externa única é executar este runbook com credencial provider em ambiente isolado e anexar somente evidência metadata-only (durations, bookmarks truncados/IDs não secretos, contagens e resultados dos gates).