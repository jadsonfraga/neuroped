# NeuroPed Solo Product Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar a oferta NeuroPed Solo no produto publicado, com posicionamento individual, onboarding principal de cinco passos e checkout inicial de um profissional, sem quebrar tenants multiusuário existentes.

**Architecture:** O tenant e o `plan_id` atuais permanecem canônicos. Uma migração forward-only altera somente o default de novas assinaturas trial para um assento; a UI projeta cinco marcos Solo a partir do snapshot server-side completo de dez marcos e preserva billing, isolamento e compatibilidade multiassento.

**Tech Stack:** React 18, TypeScript, Vite, Cloudflare Pages Functions, D1/SQLite, Node test runner, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-25-neuroped-solo-saas-design.md`

## Global Constraints

- Nome público: `NeuroPed Solo`; preço: `R$ 99/mês`; trial: `14 dias`.
- Manter `CANONICAL_PLAN_ID = "saas-professional"`; não migrar IDs de plano nesta entrega.
- Cloudflare Pages Functions + D1 continuam backend canônico; migrações são numeradas e forward-only.
- Cadastro continua fechado por padrão por `SAAS_SIGNUP_ENABLED`.
- Nenhum registro existente perde assento, membro, convite ou rota.
- Preço exibido deriva de `CANONICAL_PRICE_CENTS`; nunca duplicar literal monetário em componente.
- Snapshot de onboarding continua com dez marcos e fonte server-side; apenas a projeção visual tem cinco.
- Nenhum claim público pode antecipar cifra, exportação ou entrega não comprovada no ambiente publicado.
- Testes e provas usam apenas fixtures sintéticas; nenhum PHI, segredo ou credencial real.
- Preservar as alterações preexistentes em `client/public/sw-build.js`, `client/src/data/interactiveScaleIds.generated.ts` e `functions/api/_buildInfo.ts`; não incluí-las em commits sem prova de que pertencem à tarefa.

## Review Focus

- Tenant criado depois da nova migração recebe um assento; assinatura existente com dois ou mais permanece inalterada — coberto na Task 1.
- A UI mostra cinco marcos sem aceitar snapshot incompleto ou inventar conclusão local — coberto na Task 3.
- Billing bloqueado/pendente continua explícito e nunca aparece como pago — coberto na Task 3 e pela suíte existente.
- Checkout Solo usa um assento, mas jamais solicita menos que membros ativos ou assentos legados — coberto na Task 4.
- `/planos` permanece pública, deriva preço do domínio e não vende equipe nem capacidade externa não comprovada — coberto na Task 2.

---

### Task 1: Fundação de billing Solo sem converter assinaturas existentes

**Files:**
- Create: `db/migrations/0038_neuroped_solo_default_seat.sql`
- Create: `tests/unit/saas-solo-billing-foundation.test.ts`
- Modify: `shared/billing.ts:45-55`
- Modify: `tests/unit/saas-acceptance-journey.test.ts:185-230`

**Interfaces:**
- Produces: `CANONICAL_PLAN_DISPLAY_NAME = "NeuroPed Solo"` and `CANONICAL_PRIMARY_SEATS = 1` from `shared/billing.ts`.
- Produces: `trg_clinic_create_billing_trial` creating future trial subscriptions with `seats = 1` and `plan_id = "saas-professional"`.

- [ ] **Step 1: Write the failing migration test**

Create `tests/unit/saas-solo-billing-foundation.test.ts` with assertions that a clinic inserted before migration 0038 keeps two seats, the migration contains no `UPDATE billing_subscriptions`, and a clinic inserted after 0038 receives one seat under `saas-professional`.

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `node --import tsx --test tests/unit/saas-solo-billing-foundation.test.ts`  
Expected: FAIL because migration 0038 and Solo constants do not exist.

- [ ] **Step 3: Add constants and the forward-only trigger replacement**

In `shared/billing.ts`, export the two constants exactly as specified. In migration 0038, `DROP TRIGGER IF EXISTS trg_clinic_create_billing_trial` and recreate it from migration 0015 with only the new-subscription seat value changed from `2` to `1`; do not update existing rows.

- [ ] **Step 4: Keep the multi-member acceptance journey explicit**

Change the initial expectation in `saas-acceptance-journey.test.ts` to one seat, then set that synthetic subscription to two seats immediately before the invitation section so the existing team/anti-IDOR coverage remains intact.

- [ ] **Step 5: Run billing and migration tests**

Run: `node --import tsx --test tests/unit/saas-solo-billing-foundation.test.ts tests/unit/saas-acceptance-journey.test.ts tests/unit/saas-billing-contract.test.ts`  
Expected: PASS; new tenant is one seat, legacy/team fixture is still multi-seat.

- [ ] **Step 6: Commit the foundation**

```bash
git add shared/billing.ts db/migrations/0038_neuroped_solo_default_seat.sql tests/unit/saas-solo-billing-foundation.test.ts tests/unit/saas-acceptance-journey.test.ts
git commit -m "feat(saas): default new trials to NeuroPed Solo"
```

### Task 2: Reposicionar a página pública como NeuroPed Solo

**Files:**
- Modify: `client/src/pages/planos.tsx:17-205`
- Modify: `tests/unit/planos-page-contract.test.mjs:21-78`

**Interfaces:**
- Consumes: `CANONICAL_PLAN_DISPLAY_NAME`, `CANONICAL_PRICE_CENTS`, `CANONICAL_TRIAL_DAYS` from `@shared/billing`.
- Produces: public `/planos` copy and CTA for one professional; route contract remains unchanged.

- [ ] **Step 1: Rewrite the public-page contract first**

Replace the clinic/team assertion with assertions for `NeuroPed Solo`, `consultório`, `um profissional` and `14 dias`; assert absence of the headings `Equipe com papéis e assentos` and `LGPD executável, não declarativa`. Keep the price-source, public-route, CTA, no-diagnosis and no-WhatsApp assertions.

- [ ] **Step 2: Run the contract and confirm RED**

Run: `node tests/unit/planos-page-contract.test.mjs`  
Expected: FAIL on Solo positioning and removal of team claims.

- [ ] **Step 3: Implement the Solo copy**

Update `planos.tsx` to import the display-name constant, identify the audience as a neuropediatrician with a private practice, label the price as monthly for one professional, remove the team/reception card, and replace unverified production claims with a visible availability qualification. Preserve the existing explicit clinical limits and CTA to `/cadastro`.

- [ ] **Step 4: Run the page contract and typecheck**

Run: `node tests/unit/planos-page-contract.test.mjs`  
Expected: PASS.  
Run: `npm run check`  
Expected: exit 0.

- [ ] **Step 5: Commit the public offer**

```bash
git add client/src/pages/planos.tsx tests/unit/planos-page-contract.test.mjs
git commit -m "feat(saas): position public offer as NeuroPed Solo"
```

### Task 3: Projetar onboarding Solo de cinco passos sem mudar a verdade do servidor

**Files:**
- Create: `client/src/lib/soloOnboarding.ts`
- Create: `tests/unit/solo-onboarding-projection.test.ts`
- Modify: `client/src/components/OnboardingProgressCard.tsx:176-355`
- Modify: `client/src/pages/onboarding.tsx:15-178`
- Modify: `tests/unit/onboarding-progress-ui.test.tsx:95-148`

**Interfaces:**
- Consumes: `TenantOnboardingSnapshot` and `OnboardingMilestone` from `shared/onboarding.ts`.
- Produces: `SOLO_ONBOARDING_KEYS` in order `account_created`, `email_verified`, `clinic_created`, `first_patient`, `first_document`.
- Produces: `projectSoloOnboarding(snapshot: TenantOnboardingSnapshot): { milestones: OnboardingMilestone[]; progress: { completed: number; total: 5; percent: number } }`.

- [ ] **Step 1: Write projection and component expectations**

The pure test must assert a blocked 10-milestone snapshot projects to exactly five keys, `3/5` and `60%`, without `first_member`, while retaining the original snapshot unchanged. Update the component test to expect `3 de 5`, the five items only, the billing limitation text, and a link to `/#/configuracoes?secao=plano` when billing is not confirmed.

- [ ] **Step 2: Run the two tests and confirm RED**

Run: `node --import tsx --test tests/unit/solo-onboarding-projection.test.ts tests/unit/onboarding-progress-ui.test.tsx`  
Expected: FAIL because projection and five-step rendering do not exist.

- [ ] **Step 3: Implement the pure projection**

Create `soloOnboarding.ts` with the exact keys and signature above. Compute progress only from projected persisted statuses; do not read storage, URL state or timestamps outside the snapshot.

- [ ] **Step 4: Render the projection and keep billing separate**

In `OnboardingProgressSummary`, preserve strict parsing of all ten server milestones, then render projected milestones/progress. Keep the billing evidence footer and add the plan link only while billing is not `SERVER_CONFIRMED`.

- [ ] **Step 5: Change onboarding creation language only**

Change visible copy from “clínica/equipe/2 assentos” to “seu consultório/14 dias”; labels and buttons become `Configurar seu consultório`, `Nome do consultório` and `Criar consultório e entrar`. Keep request payload names and tenant APIs unchanged.

- [ ] **Step 6: Run projection, UI and server-source tests**

Run: `node --import tsx --test tests/unit/solo-onboarding-projection.test.ts tests/unit/onboarding-progress-ui.test.tsx tests/unit/saas-onboarding-progress.test.ts`  
Expected: PASS; UI is 5-step, API remains 10-step and anti-IDOR stays green.

- [ ] **Step 7: Commit onboarding**

```bash
git add client/src/lib/soloOnboarding.ts client/src/components/OnboardingProgressCard.tsx client/src/pages/onboarding.tsx tests/unit/solo-onboarding-projection.test.ts tests/unit/onboarding-progress-ui.test.tsx
git commit -m "feat(saas): simplify onboarding for solo practices"
```

### Task 4: Usar um assento no checkout novo e preservar multiassento legado

**Files:**
- Create: `client/src/lib/soloBilling.ts`
- Create: `tests/unit/solo-billing-ui.test.ts`
- Modify: `client/src/pages/configuracoes.tsx:597-681`

**Interfaces:**
- Produces: `checkoutSeatsForSolo(input: { contracted: number | null; activeMembers: number | null }): number`.
- Produces: `isMultiSeatTenant(input: { contracted: number | null; activeMembers: number | null }): boolean`.
- Consumes: `CANONICAL_PLAN_DISPLAY_NAME` from `shared/billing.ts`.

- [ ] **Step 1: Write the seat-selection tests**

Assert `{null, null} -> 1`, `{1, 1} -> 1`, `{2, 1} -> 2`, `{1, 2} -> 2`, invalid zero/null values never yield less than one, and `isMultiSeatTenant` is true only when contracted or active exceeds one.

- [ ] **Step 2: Run and confirm RED**

Run: `node --import tsx --test tests/unit/solo-billing-ui.test.ts`  
Expected: FAIL because the helper does not exist.

- [ ] **Step 3: Implement helper and wire the plan panel**

Use `checkoutSeatsForSolo(snapshot.seats)` in `PlanoSection`. Show `NeuroPed Solo` instead of the internal plan ID; label the button `Gerenciar assinatura` for one-seat tenants and retain `Gerenciar assentos` for existing multi-seat tenants. Do not change the checkout API or its server-side lower-bound validation.

- [ ] **Step 4: Run UI and server billing regressions**

Run: `node --import tsx --test tests/unit/solo-billing-ui.test.ts tests/unit/saas-billing-adversarial.test.ts tests/unit/tenant-management-authorization.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit billing UI compatibility**

```bash
git add client/src/lib/soloBilling.ts client/src/pages/configuracoes.tsx tests/unit/solo-billing-ui.test.ts
git commit -m "feat(saas): make one seat the Solo checkout default"
```

### Task 5: Alinhar as fontes vivas de produto e GTM

**Files:**
- Modify: `ROADMAP.md`
- Modify: `DECISIONS.md`
- Modify: `METRICS.md`
- Modify: `docs/GTM_ENTREVISTAS_E_PILOTO.md`
- Modify: `docs/saas/gtm/README.md`
- Modify: `docs/saas/gtm/VALUE_PROPOSITION.md`
- Modify: `docs/saas/gtm/ROADMAP.md`
- Modify: `docs/saas/gtm/METRICS.md`
- Modify: `docs/saas/gtm/DECISIONS.md`
- Modify: `tests/unit/saas-loop-artifacts-static.test.mjs`

**Interfaces:**
- Consumes: product constants from `shared/billing.ts` and the approved spec.
- Produces: one non-conflicting source story: Solo is the decided ICP; Clínica is later.

- [ ] **Step 1: Strengthen the artifact guard**

Add assertions that root `ROADMAP.md` marks ICP Solo decided, `DECISIONS.md` records “Solo primeiro; Clínicas depois”, `METRICS.md` targets ten Solo interviews, and billing exports `CANONICAL_PLAN_DISPLAY_NAME` plus one primary seat. Keep external-blocker and `charge_paid` assertions.

- [ ] **Step 2: Run and confirm RED**

Run: `node tests/unit/saas-loop-artifacts-static.test.mjs`  
Expected: FAIL because the living documents still say ICP undecided or clinic-first.

- [ ] **Step 3: Reconcile documents without claiming production readiness**

Record the approved decision, change the interview pool from `5A + 5B` to ten neuropediatricians working independently, retain the three-paid-pilot and second-invoice criteria, move Clínica to Later, and keep all Asaas/Resend/R2/legal/legacy blockers explicit.

- [ ] **Step 4: Run the guard**

Run: `node tests/unit/saas-loop-artifacts-static.test.mjs`  
Expected: PASS.

- [ ] **Step 5: Commit product truth**

```bash
git add ROADMAP.md DECISIONS.md METRICS.md docs/GTM_ENTREVISTAS_E_PILOTO.md docs/saas/gtm tests/unit/saas-loop-artifacts-static.test.mjs
git commit -m "docs(saas): align GTM around NeuroPed Solo"
```

### Task 6: Verificação integrada e QA visual

**Files:**
- Modify only if a real regression is found: files owned by Tasks 1–5.
- Evidence output: `artifacts/visual-authenticated/` and the public visual-audit directory; do not commit generated evidence unless repository policy explicitly tracks it.

**Interfaces:**
- Consumes: all previous tasks.
- Produces: verified branch ready for the separate go-live plan.

- [ ] **Step 1: Run the raw-authorial-source guard before imports/builds**

Run: `node scripts/guards/assert-authorial-sources-raw.mjs`  
Expected: exit 0.

- [ ] **Step 2: Run SaaS and release-relevant suites**

Run: `npm run test:saas-self-service`  
Expected: exit 0.  
Run: `npm run test:quick-wins`  
Expected: exit 0.  
Run: `npm run check`  
Expected: exit 0.  
Run: `npm run build:client`  
Expected: exit 0.

- [ ] **Step 3: Run canonical visual contracts and matrices**

Run: `npm run test:visual-authenticated-contract`  
Expected: exit 0.  
Run: `npm run audit:visual-proof`  
Expected: exit 0.  
Run: `npm run audit:visual-authenticated`  
Expected: exit 0 with every declared state captured and no serious/critical accessibility failure.

- [ ] **Step 4: Inspect affected surfaces at all relevant viewports**

Review every `/planos`, `/onboarding`, home onboarding-card and Configurações/Plano capture in light/dark and mobile/desktop where present. Reject overflow, clipped CTA, stale clinic/team copy, fake paid state, login-gate capture or unreadable contrast.

- [ ] **Step 5: Verify repository scope**

Run: `git diff --check` and `git status --short`.  
Expected: no whitespace errors; only intended task files plus the three preexisting generated modifications. Do not stage those generated files by accident.

- [ ] **Step 6: Request whole-branch review**

Review the branch against the approved spec, with emphasis on tenant isolation, subscription compatibility, honest claims and five-step UI projection. Fix only evidenced findings, rerun the smallest affected suite, then rerun Step 2 before completion.

