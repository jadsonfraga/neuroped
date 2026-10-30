# NeuroPed Solo Go-Live Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Levar o NeuroPed Solo já implementado do estado testado ao primeiro piloto externo pagante, sem abrir cadastro ou usar PHI antes dos gates.

**Architecture:** O go-live preserva Cloudflare Pages/D1 como autoridade, usa Resend para identidade e Asaas para cobrança, e mantém `SAAS_SIGNUP_ENABLED=false` até smoke sandbox e revisão jurídica. Provas operacionais são metadata-only e os segredos entram somente pelos consoles seguros.

**Tech Stack:** Cloudflare Pages, D1, R2, GitHub Actions, Resend, Asaas, scripts operacionais Node/TypeScript.

**Spec:** `docs/superpowers/specs/2026-10-25-neuroped-solo-saas-design.md`

## Global Constraints

- Executar somente depois do plano de produto estar integrado e publicado.
- Revalidar produção; nenhuma evidência histórica autoriza go-live atual.
- Nunca colocar chave, token, cookie, PHI ou resposta clínica em chat, Git, log ou screenshot.
- Escritas em console externo, habilitação de cadastro e troca sandbox→produção exigem confirmação específica do proprietário.
- `pronto: true` em `/api/admin/go-live` prova configuração, não pagamento, cifra, restauração ou conformidade jurídica.
- O único marcador de receita é `billing_invoice_events.kind = 'charge_paid' AND status = 'done'`.
- Qualquer falha de cifra, isolamento, documento ou restauração fecha o cadastro e interrompe o rollout.

## Review Focus

- Cadastro não abre antes de Resend, Asaas, R2, jurídico e smoke — Task 3.
- Probe do provedor não é confundido com entrega ou pagamento — Tasks 1 e 2.
- Smoke usa identidade e paciente sintéticos, sem reutilizar conta técnica privilegiada — Task 3.
- Evidência de billing vem do webhook persistido, nunca do redirect — Task 3.
- Cliente Zero tem critério temporal, rollback e aceite humano explícitos — Task 4.

---

### Task 1: Revalidar os bloqueios publicados sem alterar estado

**Files:**
- Read: `docs/ASAAS_OPERATIONAL_CONTRACT.md`
- Read: `docs/RESEND_OPERATIONAL_CONTRACT.md`
- Read: `docs/LGPD_PRE_GO_LIVE.md`
- Create only on observed blocker: `docs/audits/BLOCKED_EXTERNAL_NEUROPED_SOLO_<DATE>.md`

**Interfaces:**
- Produces: a metadata-only matrix `VERIFIED | BLOCKED_EXTERNAL | FAILED` for clinical crypto, R2, Resend, Asaas, legal, legacy census and DR.

- [ ] Run `node --import tsx scripts/ops/resend-operational-contract.ts`; record status without values.
- [ ] Run `node --import tsx scripts/ops/asaas-operational-contract.ts`; record status without values.
- [ ] Query the authenticated clinical/LGPD readiness and `/api/admin/go-live`; record only booleans/codes.
- [ ] Verify current S9 census and DR evidence without reading clinical content.
- [ ] If any requirement is missing, create one audit blocker with system, exact permission/action, risk and acceptance proof; do not open signup.

### Task 2: Provisionar dependências externas em ordem segura

**Files:**
- Modify after verified action: `docs/LGPD_PRE_GO_LIVE.md`
- Modify after verified action: `docs/saas/gtm/PHASE3_GATE.md`
- Evidence: provider IDs/run IDs only; no secret values.

**Interfaces:**
- Consumes: Task 1 matrix and explicit owner confirmation for each settings write.
- Produces: verified R2 binding, Resend sender, Asaas sandbox webhook, legal approval and DR rehearsal.

- [ ] Configure/verify the R2 bucket and Pages binding with least privilege; prove an export object can be written/read/deleted using synthetic data.
- [ ] Configure/verify Resend domain and sender; run `node --import tsx scripts/ops/resend-operational-contract.ts --probe`, then prove one synthetic verification e-mail arrived.
- [ ] Configure Asaas sandbox key and 32+ character webhook token; run `node --import tsx scripts/ops/asaas-operational-contract.ts --probe`, then prove an authenticated sandbox event is processed once.
- [ ] Execute the DR rehearsal with real ciphertext but synthetic clinical content; verify restored counts/digests without logging payload.
- [ ] Resolve S9 only after fresh census, restored backup and explicit destination authorization.
- [ ] Obtain written legal review of Solo terms/privacy/DPA/retention/DPO channel before any external patient data.

### Task 3: Executar o smoke publicado e controlar a abertura do cadastro

**Files:**
- Read/execute: `docs/SMOKE_CLIENTE_ZERO.md`
- Execute: `scripts/ops/cliente-zero-published-smoke.ts`
- Modify: `METRICS.md`
- Create on failure: `docs/audits/BLOCKED_EXTERNAL_CLIENTE_ZERO_<DATE>.md`

**Interfaces:**
- Consumes: all Task 2 gates.
- Produces: published synthetic journey with `charge_paid`, ten server milestones and measured time-to-first-document.

- [ ] Run the public-only smoke; require no `FAILED`.
- [ ] Create and verify the reserved synthetic owner manually through Resend.
- [ ] Run the synthetic write journey with `--write-synthetic --close-clinic`; require exit 0.
- [ ] Complete the one-seat Asaas sandbox checkout manually and verify `charge_paid` from the server, not redirect state.
- [ ] Verify anti-IDOR with a second synthetic tenant and time-to-first-document under 30 minutes.
- [ ] Record only aggregate results in `METRICS.md`.
- [ ] After explicit approval, switch Asaas to production, repeat preflight, then set `SAAS_SIGNUP_ENABLED=true`; any uncertain result leaves it false.

### Task 4: Concluir Cliente Zero antes de terceiros

**Files:**
- Execute: `docs/saas/gtm/CLIENTE_ZERO_14D.md`
- Modify: `METRICS.md`
- Modify: `DECISIONS.md`

**Interfaces:**
- Produces: owner-approved `go` or `no-go` decision.

- [ ] Days 1–2: run the published flow with 100% synthetic data and stop on any error.
- [ ] Days 3–14: use the owner clinic progressively under the documented clinical review and rollback rules.
- [ ] Require 14 days without isolation/crypto incident, at least 8/10 server milestones and under-30-minute first document in at least three patients.
- [ ] Record aggregate metrics only and obtain the proprietor's explicit `go/no-go` acceptance.
- [ ] On any stop criterion, disable clinical live/signup as documented, preserve tables and create a metadata-only incident record.

### Task 5: Validar venda antes de expandir o produto

**Files:**
- Execute/modify: `docs/GTM_ENTREVISTAS_E_PILOTO.md`
- Modify: `METRICS.md`
- Modify: `ROADMAP.md`

**Interfaces:**
- Consumes: Task 4 `go` decision.
- Produces: evidence for continuing Solo or revisiting the value proposition.

- [ ] Invite 25 independent neuropediatricians without PHI or prohibited clinical promises.
- [ ] Complete ten interviews before product demonstration; record only non-identifying aggregate signals.
- [ ] Offer the same R$ 99/month pilot with 14-day trial; no unapproved discount or hidden service.
- [ ] Require three accepted paid pilots and at least two second `charge_paid` invoices before planning Clínica.
- [ ] If ten interviews produce fewer than four spontaneous pain signals and zero paid pilots, stop feature work and revisit positioning.

