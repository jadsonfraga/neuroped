# NeuroPed — Production Readiness Baseline — 02/10/2026 (Sprint 16h)

## Escopo e regra de evidência

Baseline levantado contra `jadsonfraga/neuroped` no início da sprint de 16h.
Issues antigas não foram tratadas como verdade sem comparação com o código atual.
Classificações: **RESOLVIDO**, **PARCIAL**, **AINDA REAL**, **SUPERADO**, **NÃO VERIFICÁVEL**.

## Fonte de verdade do código

- `origin/main` observado (pós `git fetch --all --prune`): **`ec6344241e815f43efa51ba89fd00c6c36d3672c`** (`chore: reconcile repo hygiene after audit-gate merge (#1085)`).
- O SHA conhecido antes da sprint (`eb3d9a42…`, baseline 23/08) **NÃO é mais o HEAD** — o main avançou ~60 commits.
- 30 commits recentes inspecionados: dyslexia risk, agenda multiprofissional, super-neuropad family delivery, dompurify 3.4.16 (#1081), reconcile de higiene (#1085).

## Produção publicada (verificação independente, 02/10/2026)

- **Cloudflare Pages** (`https://neuroped.pages.dev`): `sw-build.js` declara `2.0.0-fullstack-ec63442` → **convergente com main**.
- **Vercel** (`https://superneuroped.vercel.app`): `sw-build.js` declara `2.0.0-fullstack-ec63442` → **convergente com main**.
- `/api/health` (Cloudflare, resposta pública 02/10 23:52 UTC): `status: ok`, `database: ok`, porém
  - `clinicalCryptoConfigured: **false**`
  - `lgpdExport.configured: **false**`; `storageBindingPresent: **false**`
  - `blockers: ["CLINICAL_CRYPTO_NOT_READY", "LGPD_BUCKET_NOT_CONFIGURED"]`
- `/api/_buildInfo` responde `UNAUTHENTICATED` (protegido — correto).

## GitHub governance

- `main`: **`protected: true`** (verificado por API + prova prática: tentativa de push direto
  de branch descartável foi **rejeitada** com `protected branch hook declined`; 2 required checks:
  `Build & Lint`, `Dedicated E2E account only`).
- Issue #584 (proteger main): **RESOLVIDO/CLOSED**.
- Rulesets: `[]` (proteção via branch protection clássica; funcional e suficiente).

## Workflows no HEAD `ec63442`

- Verdes: No password regression, Open PR reconciliation, Filter spiral, OBS-10, S13 smoke,
  Certificate retirement, Production health smoke.
- **Vermelho consistente**: `Clinical and LGPD production readiness audit` —
  blockers `CLINICAL_CRYPTO_NOT_READY`, `LGPD_BUCKET_NOT_CONFIGURED`, `LGPD_EXPORT_NOT_CONFIGURED`.
  É **audit fail-closed correto**: o código exige segredos/binding que não estão configurados no provider.

## PRs abertos

- **#1083** (higiene de repo + audit-gate centralizado): **SUPERADO** — o conteúdo entrou no main
  por #1085 (`eb0f553` desbloqueia audit/deploy + `ec63442` reconcile). Merge state `DIRTY`
  (base antiga). Candidato a fechamento como superseded após confirmação de diff.

## Issues P0/P1 — reconciliação issue × main

| Issue | Título (resumo) | Estado real vs main |
|---|---|---|
| #584 | Proteger main | **RESOLVIDO** (closed; proteção ativa, prova de rejeição executada) |
| #585 | Conta E2E + change-password Cloudflare | **RESOLVIDO** (closed; `functions/api/auth/change-password.ts` + `_passwordChangeSession.ts` + `_passwordPolicy.ts` existem; deploy-vercel exige `NEUROPED_E2E_*`) |
| #629 | Verdade clínica/licenciamento | **AINDA REAL** — requer revisão clínica humana; fora do escopo de automação |
| #630 | LGPD runtime canônico | **PARCIAL→RESOLVIDO em código** (schema/triggers/worker jobs existem e são verificados por health); bloqueio restante é **configuração provider**, não código |
| #685 | Export/eliminação LGPD operacionais | **PARCIAL** — código e jobs existem (`live_lgpd_worker_jobs`, triggers); execução operacional depende de R2 binding ausente |
| #783 | appointments ↔ live_patients (purge) | **AINDA REAL (P1)** — não atacada nesta sprint salvo regressão |
| #926 | Prontidão LIVE: cripto/armazenamento não confirmados | **AINDA REAL — P0 operacional atual** (ver abaixo) |
| #1039 | Incidente agenda | verificar regressão no smoke de agenda (CI verde) — **provavelmente SUPERADO**, confirmar antes de fechar |
| #963 | Go-live NeuroPad (.br, SNCR) | **AINDA REAL (P2)** — decisão de domínio/business |
| #1001 | Atomicidade pré-condições eliminação | **AINDA REAL (P1)** |

## P0 real atual (o maior risco não fechado)

**Produção está rodando com Clinical LIVE ativo (`CLINICAL_LIVE_ENABLED=true`) SEM criptografia configurada.**

Causa raiz (código auditado em `functions/api/tenant/_crypto.ts`, `functions/api/health.ts`,
`functions/api/live/governance/_artifactStore.ts`):

1. `CLINICAL_DATA_KEY` (≥32 chars) + `CLINICAL_DATA_KEY_ID` ausentes no ambiente Cloudflare;
2. `CLINICAL_INDEX_KEY` (≥32 chars) ausente;
3. Binding R2 `LGPD_EXPORT_BUCKET` ausente (export LGPD sem destino → `LGPD_EXPORT_NOT_CONFIGURED`).

Sem (1)/(2), escritas clínicas LIVE devem estar falhando fechado (por design), e leitura/gravação
de pacientes cifrados não operam. Sem (3), direitos LGPD de exportação não são operacionais.

**Classificação: AINDA REAL — P0 de configuração provider (não de código).**
Credencial Wrangler/Cloudflare não disponível nesta sessão (wrangler: "not authenticated");
secrets de produção não podem ser gerados/instalados de forma segura por agente sem acesso
provider. → `HUMAN_ACTION_REQUIRED.md` (ação única e precisa).

## Itens já resolvidos em sprints anteriores (NÃO reimplementar)

- Política central `client/src/lib/clinicalBrowserPersistencePolicy.ts` com classificação
  ALLOW/EPHEMERAL_ONLY/DENY e namespaces cognitivos/CAA/assinatura/agenda mapeados;
- Guards E2E LIVE: `live-browser-persistence-block.mjs`, `live-tenant-session-boundary.mjs`
  (workflow `LIVE browser persistence guard` verde no main);
- Teste adversarial RED/BLUE: `tests/unit/live-tenant-isolation-adversarial.test.ts` (TENANT_RED/TENANT_BLUE);
- Change-password canônico Cloudflare + política de senha + password change session;
- Conta E2E dedicada sem fallback admin (deploy-vercel exige `NEUROPED_E2E_*`);
- D1 DR runbook (`docs/D1_DISASTER_RECOVERY_RUNBOOK.md`) com rehearsal de RPO já executado
  (run `33999561301`, 05/09) e workflow de DR;
- Diários/Pré-Consulta/Pré-Retorno fail-closed em LIVE (regressões presentes no CI);
- Billing: migrations 0012/0013/0015 + workflows de migration física no D1 remoto;
- Main protegida + gates obrigatórios.

## Próxima classe de falha a atacar nesta sprint

1. Fechar #1083 como superseded (prova por diff contra #1085).
2. `HUMAN_ACTION_REQUIRED.md` com o procedimento exato de configuração provider (P0).
3. Reconciliar issues desatualizadas (#584 já fechada; avaliar #1039, #926 com evidência).
4. Gate adicional: fazer o readiness audit existente impedir regressão silenciosa
   (blockers já falham fechado — garantir que permanece required quando aplicável).
5. Trabalho de código restante de maior valor: atomicidade #1001 e mapping #783 (P1),
   desde que não duplicados.
