# Commercial go-live — reconciliação LGPD (S12B / PR #1007)

## Escopo e rastreabilidade

Revisão iniciada em 26/09/2026 (America/Recife). PR #1007; risco legado S9 relacionado à issue #594. Este registro não certifica prontidão comercial, conformidade jurídica ou produção.

- AGENTS.md lido integralmente; Cloudflare Pages Functions + D1 continuam canônicos.
- Snapshot fornecido: `574236b350181651664313f72afcf26297940003`.
- Main observado nesta revisão: `12520218e938c3cde8b075772f1bedf544554f4d`, com a PR #1010 integrada.
- Head de código LGPD revisado: `f064238477c67fa65561d524ffdb5ac4caf7b9ff`.
- Nenhuma migração, atribuição de paciente, cobrança, purge ou operação em dados clínicos reais executada por esta revisão.

## Reconciliação antes de alteração

Foram lidos AGENTS.md, BACKLOG.md, EVIDENCE.md, o censo agregado documentado, as sete PRs abertas e seus arquivos alterados. Foram conferidos os sete diffs da #1007 e comparada a alteração de atomicidade nas #1003/#1005.

| Trabalho | Decisão desta revisão | Razão |
| --- | --- | --- |
| #1010 — recepção | MERGED_MAIN, não reaplicar | Já presente no main observado. |
| #1007 — export/lifecycle | MERGE_NOW somente após CI do candidato com base atual | Escopo LGPD único; sem migração; preserva as asserções de recusa e rollback transacional. |
| #1008 — link por clínica | REBASE_AND_FIX | GitHub informa conflito; preservar a recepção da #1010 e a seleção explícita da clínica. |
| #1003 — autonomia/Cliente Zero | REBASE_AND_FIX | Draft; compartilha o teste LGPD da #1007 e TenantMetricsPanel com #1005. |
| #1005 — Product Evidence/recovery | REBASE_AND_FIX | Draft; mesma correção de teste LGPD e sobreposição com #1003 na UI de métricas. |
| #1006 — protocolo de deploy | BLOCKED | Draft; documentação não equivale a validação operacional. Não é o bloqueador escolhido. |
| #1000 — inteligência longitudinal | UNRELATED_TO_COMMERCIAL_GO_LIVE neste ciclo | Preservar como diferencial posterior; não substitui resolução de P0/P1. |
| #1009 — SuperNeuroPad | UNRELATED_TO_COMMERCIAL_GO_LIVE neste ciclo | Correção de domínio clínico separado, preservada sem merge oportunista. |

O patch de `tests/unit/lgpd-purge-atomicity.test.ts` é idêntico nas #1007, #1003 e #1005. Integrar pela #1007 e reconhecer essa contribuição nas reconciliações seguintes, sem duplicar nem remover a corrida adversarial.

## Conteúdo LGPD efetivamente revisado

- Export de `clinic_settings` e `live_retention_policies` com `clinic_id` nos predicados finais; ausência representada por `null`.
- Contagem combinada dos oito domínios S12B, inclusive metadata sem ciphertext, com limite síncrono validado na pré-checagem e no snapshot.
- Corrida de purge transferida de um domínio agora coberto pelo export para o appointment órfão ainda recusado pelo mecanismo. As garantias de rollback e isolamento continuam exigidas.
- Nenhum teste removido ou assertion enfraquecida por esta revisão.
- A classificação de appointments como não coberto refere-se ao caminho do executor; os comentários antigos dizendo que a tabela não possui clinic_id não descrevem o schema pós-migração 0029. Esta revisão não usa esse comentário como prova de schema.

## Evidência observada antes deste commit documental

No head `f064238477c67fa65561d524ffdb5ac4caf7b9ff`, GitHub Actions retornou sucesso para:

- Verify NeuroPed: run `36280506359`, job `108511336384`; instalação, gate de release, build e smoke Chromium concluídos.
- PR Check: run `36280506399`.
- Test, Lint & Build: run `36280506384`.
- LGPD purge atomicity: run `36280506415`.
- SaaS tenant lifecycle: run `36280506419`.
- LGPD worker executor core: run `36280506430`.

Esses resultados pertencem ao head anterior. A referência sintética de merge observada (`4f2484c154e7e513ba82d69b76662ce50a706149`) ainda tinha `574236b` como parent de main, não `12520218`. Logo, não são prova suficiente da combinação atual com #1010.

Este commit documental deve disparar nova CI de PR. Antes do merge, conferir o head resultante, o parent de main na referência sintética, o gate de release, operações, lifecycle, atomicidade e as revisões aplicáveis. Não substituir resultados novos pelos do ancestral. Sem override de proteção de branch.

## Limites e bloqueios

- Nenhum `npm ci`, typecheck, lint, build ou teste completo foi executado no terminal desta revisão: clone local falhou por DNS; o terminal remoto recusou execução por limite mensal. Não confundir leitura da CI com execução local.
- S9/P0 permanece aberto: o censo documentado não fornece mapeamento inequívoco de tenant. Não atribuir órfãos ao admin, apagar seeds ou remover acesso às cegas. Exige associação autorizada, backup/restauração e ensaio antes de backfill.
- S10, conclusão de S13, Cliente Zero autenticado completo e recuperação operacional continuam pendentes.
- Asaas sandbox real e entrega real de e-mail não foram exercitados nesta revisão. Não há evidência nova de receita, cobrança ou integração externa.
- Sem nova atestação de DEPLOYED ou PRODUCTION_VERIFIED neste registro pré-merge.

## Gate posterior e rollback

Somente após merge autorizado e CI válida: conferir workflow Cloudflare, SHA em deploy-check, health/auth/CORS/D1/migrações e a rota alterada. Cada observação deve identificar SHA e ambiente; smoke geral não substitui teste da exportação LGPD.

Rollback por PR de reversão do incremento LGPD, nunca por force-push ou edição de migrações históricas. Este commit acrescenta apenas documentação; removê-lo não modifica runtime ou dados. Reverter o código LGPD restaura a limitação anterior do export e exige reavaliar o teste de atomicidade, nunca apagá-lo para obter verde.
