# NeuroPed — Production Readiness Baseline — 23/08/2026

## Escopo e regra de evidência

Este baseline foi levantado contra o repositório canônico `jadsonfraga/neuroped` antes de qualquer merge em `main`. Issues antigas não foram tratadas como verdade sem comparação com o código atual.

Classificações usadas: **RESOLVIDO**, **PARCIAL**, **AINDA REAL**, **SUPERADO**, **NÃO VERIFICÁVEL**.

## Fonte de verdade do código

- `origin/main` observado: `eb3d9a428ebdc8d9e10bb639013d984f47a4262a`.
- Mensagem do HEAD: `test(live): falhar em qualquer toque de storage clínico pré-visita (#682)`.
- O SHA conhecido antes da sprint continuava sendo o HEAD no início da auditoria; isso foi verificado, não presumido.
- Branch de trabalho criada a partir desse SHA: `manus/production-readiness-2026-08-23`.
- Os 30 commits mais recentes foram inspecionados. O histórico recente confirma hardening de pré-visita, diários, Chromium obrigatório, tenant lifecycle, Clinical Memory e deploy fail-closed; não há justificativa para reimplementar essas correções sem regressão objetiva.

## Produção publicada

### GitHub deployment/status metadata

Para o SHA `eb3d9a428ebdc8d9e10bb639013d984f47a4262a`, o GitHub reporta:

- `NeuroPed / Cloudflare production`: **success**; run referenciado `32642285515`.
- `NeuroPed / Vercel production`: **success**; run referenciado `32642285511`.
- `NeuroPed / GitHub Pages`: **success**.

O workflow Vercel falha fechado se o sentinel Cloudflare não declarar o mesmo `GITHUB_SHA` e depois exige que `https://superneuroped.vercel.app/deploy-check.json` também declare o mesmo SHA. Portanto há evidência forte de convergência no pipeline do HEAD.

**Limitação:** a sessão atual não possui conector Cloudflare nem rede shell externa; por isso a leitura independente do sentinel Cloudflare não pôde ser repetida fora do GitHub Actions. Classificação da convergência externa independente: **NÃO VERIFICÁVEL nesta sessão** até nova prova por runtime/provider.

### Vercel — discrepância de governança

- Pipeline canônico aponta para projeto `superneuroped`, project id `prj_8gsXbaQoOZHgbhjnqiMPR9A5jg5b`.
- Alias esperado: `superneuroped.vercel.app`.
- Equipe visível no conector Vercel atual: `team_bv4ukCpg4I0DHyQAk757HXnp` (`medicina119-5281s-projects`).
- Essa equipe lista **zero projetos**.
- Consulta do project id canônico dentro dessa equipe retorna `404`.

Classificação: **AINDA REAL / governança de conta**. Não mover projeto, domínio ou equipe sem reconciliação humana/provider-side.

## GitHub governance

### `main`

A API do GitHub reportou para `main`:

- `protected: false`;
- sem required status checks server-side;
- sem ruleset efetivamente protegendo a branch.

Classificação: **AINDA REAL — P0** (#584).

A credencial conectada tem `admin=true`, `maintain=true` e `push=true`, porém o conector disponível nesta sessão não expõe mutação de branch protection/rulesets. A mudança não foi simulada nem marcada como concluída.

### Checks que realmente executam em PR

Confirmados em PR real (#683) e/ou definição de workflow sem filtro de paths:

- `Verify NeuroPed`;
- `Test, Lint & Build`;
- `PR Check`;
- `No password regression`;
- `Filter and scales spiral audit`.

No head do PR #683, esses workflows concluíram com sucesso quando aplicáveis. Não usar como required check um workflow que só roda após push em `main`.

## PRs abertos no início da sprint

### #683 — `test(live): provar zero toque no storage clínico de pré-visita`

- Base antiga: `2e972e7de925bd960b8ea8556b1b6f333240003e`.
- Alterava somente `tests/e2e/live-previsit-persistence-block.mjs`.
- O `main` atual já contém a instrumentação de zero toque de `getItem/setItem/removeItem` que o PR propõe.
- A branch desta sprint amplia a mesma classe de prova para múltiplas superfícies clínicas.

Classificação: **SUPERADO / candidato a superseded**, condicionado à comparação final do diff antes de fechar.

### #640 — inventário autoral diário 15/08

- Draft.
- Conteúdo explicitamente `rascunho_revisao` e `nao_validado_psicometricamente`.

Classificação: **AINDA REAL — revisão humana obrigatória**. Não auto-merge.

## Issues P0/P1

### #584 — proteger `main`

**AINDA REAL — P0.** A descrição antiga continua materialmente correta: a proteção servidor-side não existe.

### #585 — conta E2E dedicada + troca de senha Cloudflare

**AINDA REAL — P1.** Verificação no código atual:

- `POST /api/auth/change-password` existe no Express, mas não no runtime canônico Cloudflare Pages Functions;
- `bootstrapAdmin()` Cloudflare ainda grava `must_change_password=0`;
- `deploy-vercel.yml` prefere `NEUROPED_E2E_EMAIL/NEUROPED_E2E_PASSWORD`, mas ainda possui fallback para `ADMIN_EMAIL/ADMIN_INITIAL_PASSWORD`.

### #629 — verdade clínica/licenciamento

**AINDA REAL / requer reconciliação clínica.** Não será resolvida nesta sprint por invenção de itens, normas ou escores. Mudança substantiva continua `HUMAN_CLINICAL_REVIEW_REQUIRED`.

### #630 — LGPD no runtime canônico

**PARCIAL.** A issue é anterior a commits recentes de tenant lifecycle, retenção e exportação auditada. Deve ser reconciliada endpoint a endpoint antes de fechar; texto antigo não é prova do estado atual.

## Migrations D1 presentes no repositório

Foram observadas migrations `0001` a `0015`, incluindo:

- `0012_saas_billing_onboarding.sql` — plano `R$ 99,00`, seat price `R$ 99,00`, trial 14 dias;
- `0013_saas_billing_provider.sql` — integração/hardening Asaas;
- `0014_saas_tenant_lifecycle.sql` — lifecycle/retention/governance;
- `0015_saas_billing_trial_seats_hardening.sql` — hardening de trial/assentos.

Existe workflow `NeuroPed SaaS Billing D1 migration` que aplica/reconcilia 0009, 0010, 0012 e 0013 no `neuroped-db` remoto e consulta tabelas/triggers físicos depois.

**Importante:** arquivo SQL presente != migration fisicamente aplicada. Estado físico atual de 0012/0013/0015: **NÃO VERIFICÁVEL ainda neste baseline** até consultar execução remota/evidência correspondente.

## Storage browser-side — estado de `main` antes da sprint

### RESOLVIDO e preservado como regressão

- diários clínicos em LIVE remoto autenticado;
- Pré-Consulta;
- Pré-Retorno;
- Recepção associada à pré-visita;
- zero leitura/escrita/remoção das chaves pré-visita alvo no E2E já presente em `main`.

### P0 novo confirmado

O bloqueio não era transversal. Em `main`:

- `cognitive-lab:sessions:v2` estava na allowlist persistente do cofre IndexedDB;
- Cognitive Lab ainda podia `secureGet` → ler legado em `localStorage` → migrar com `secureSet`;
- `caa:workspace:v3` também era persistente e a página ainda migrava três chaves legadas;
- `assinatura:registros:v2` persistia histórico com campo de paciente e migrava legado;
- `agenda:workspace:v1` usa diretamente o cofre persistente e contém labels de paciente/responsável e notas;
- drafts de escalas ainda têm caminho de leitura legado em `localStorage`;
- a defesa do `persistentSecureStorage` cobria apenas prefixo `diario:`.

Classificação: **AINDA REAL em `main` — P0 PHI browser-side**. Correção em andamento na branch desta sprint por política central + gate global.

### Service Worker

`client/public/sw.js` trata `/api/*`, `/functions/*` e rotas clínicas explícitas como **Network Only** antes das estratégias de cache. Classificação: **RESOLVIDO no contrato atual**, mantido sob teste estrutural.

## Multi-tenant — baseline

- `ClinicContext` limpa `React Query` ao trocar de clínica e zera temporariamente o `activeClinicId` antes de ativar o novo tenant.
- logout/login limpa Query cache e executa `secureClearAll()`.
- isso é boa defesa, porém não substitui ataque RED/BLUE ponta a ponta contra IDs conhecidos e todos os recursos subordinados.

Classificação do isolamento adversarial completo exigido nesta sprint: **AINDA NÃO PROVADO**.

## Auth — baseline

Cloudflare possui login, refresh, logout, `/me`, refresh sessions revogáveis, lockout e TTLs. Gap confirmado: troca/rotação de senha canônica e desacoplamento total da conta admin do smoke E2E.

Classificação: **PARCIAL — P1**.

## Billing — baseline

Billing não precisa ser reconstruído. Código/migrations mostram provider Asaas, trial, assentos, entitlements, status e hardening. O workflow remoto possui verificação de tabelas/triggers. Jornada provider sandbox e ataques solicitados ainda não foram reproduzidos nesta sprint.

Classificação: **PARCIAL — provar, não reconstruir**.

## Disaster recovery — baseline

Não foi encontrada, nesta fase inicial, prova desta sessão de **restore D1 executado com sucesso em banco isolado**. Backup sem rehearsal não satisfaz o gate solicitado.

Classificação: **AINDA REAL / potencial BLOCKER_PRODUCTION** até restore controlado ser comprovado.

## P0 reais no início

1. `main` sem proteção servidor-side.
2. PHI browser-side não bloqueado transversalmente em LIVE (Cognitive Lab/CAA/assinatura/agenda/drafts e futuros callers).
3. Recuperabilidade D1 ainda sem prova de restore nesta sessão; sobe para P0/BLOCKER_PRODUCTION se não houver rehearsal verificável.

## P1 reais no início

1. Cloudflare `change-password` ausente + bootstrap/E2E acoplados.
2. Prova RED/BLUE adversarial ainda incompleta como gate de release.
3. Estado físico remoto de migrations/billing precisa ser reconciliado.
4. DR runbook + restore rehearsal.
5. Reconciliação LGPD #630.
6. Reconciliação de governança do projeto Vercel.

## Itens antigos que não devem ser reimplementados

- diários LIVE fail-closed;
- Pré-Consulta/Pré-Retorno LIVE fail-closed;
- build real + Chromium;
- deploy Cloudflare/Vercel amarrado a SHA;
- tenant lifecycle/retention já presente no código;
- billing base/Asaas/trial/entitlements já existente.

A sprint deve continuar atacando a próxima classe de falha não coberta, e não duplicar essas soluções.
