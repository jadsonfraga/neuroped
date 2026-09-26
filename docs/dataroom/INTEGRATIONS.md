# Integrations

Inspected baseline: `0b4f74fb49214d00944fc2a366d3b4454363601a`. Evidence date: 2026-09-26.

| Integration | Existing implementation inspected | Evidence boundary |
|---|---|---|
| Asaas | functions/api/billing/_provider.ts, checkout.ts, webhook.ts, me.ts | Existing provider preserved. No real payment, recurring reconciliation, cancellation/reactivation or provider-mode attestation executed. BLOCKED_EXTERNAL for commercial acceptance. |
| Email verification/invitations | Existing auth verification and billing/_onboarding.ts | Versioned random token, hashed storage and HTTPS invitation construction inspected. No live mailbox/token delivery journey completed. |
| Cloudflare D1 / Pages | LIVE API, keyring and schema probes | Code and CI exist. New authenticated production route and native D1 restore unproven here. |
| Private artifacts | LIVE governance artifact-store abstraction and health binding probes | Binding/configuration is not export/download/cleanup completion. |
| Clinical synthesis | New deterministic read model over existing LIVE events | No external LLM service added. Raw documents remain explicitly unextracted. |
| Deployment/monitoring | Existing workflows and canonical health handler | Point health is not uptime or serving SHA; no new deployment attestation. |

The operation does not introduce a new billing/identity/AI provider, access secrets, make charges, send clinical data to third parties or claim pharmacy dispensing/signature compliance. Installation configuration, provider credentials, mode and governance permissions must be established through authorized operational procedures.
