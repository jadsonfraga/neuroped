# BLOCKED_EXTERNAL_WHATSAPP_CLINICAL_DELIVERY — #1404

Status: transport prototype, not connected to production. No real messages sent.
Baseline connector main: 87b04b607821e45ec5d1b949cecbb41569a01d71.
Local Windows fetch reported a different origin/main (98507cf0cc333978fd64ce68b326027d910cb01e). Do not use that checkout for integration until reconciled. Isolated branch created from connector baseline.

## Verified
- Existing Windows WhatsAppRecepcao manual describes LAB mode, no sending, official Meta connection not enabled. No WhatsApp/Meta/Twilio credential environment variable names were found in the inspected Windows session. Production Cloudflare secrets were NOT verified (Wrangler executable unavailable in inspected checkout).
- Existing client shareText uses manual Web Share / wa.me; cannot deliver PDF automatically. Existing LIVE PDF archival is not a family release.
- Added server-side official Cloud API transport with strict Brazilian mobile normalization, SHA-256 check, explicit clinical-media approval/configuration gate, callback for server-side authorization checks before upload and dispatch, approved template with document header, and conservative uncertain-send handling. No route or scheduler invokes it.
- Windows Node 24 synthetic tests: 5 passed, 0 failed; network simulated exclusively. This is not an end-to-end or production test. Full app build/check not run.

## External activation gate
1. Use clinic's authorized Meta Business account (https://business.facebook.com/). Verify WABA, number ownership, WhatsApp Business/Coexistence eligibility; do not migrate existing reception number without approval. No credentials in chat, repository or logs.
2. Authorize clinical delivery use case and verify provider terms, data processing agreement, LGPD safeguards and whether PDF attachments containing sensitive clinical information are permissible; otherwise use an authenticated expiring private download with generic notification. Do not upload clinical media before approval. Ensure recipient opt-in/authority and a documented alternative.
3. Authorized Meta administrator must enable Cloud API, configure a business sender, permanent server token with minimum messaging permissions, a generic approved utility template with document header (if permissible), and authenticated delivery webhooks. Store secrets in the actual Cloudflare Pages project secret store. Use synthetic recipients first.
4. Wire persistent transactional outbox and unique claim by clinic/patient/document/version/recipient, scoped lookup and explicit medical release, verified guardian number and consent, revocation, retry/uncertain states, callback using durable authorization, webhook authenticity and idempotency, provider media retention/cleanup. No public links or automatic fallback to other recipients. Do not confuse accepted with delivered.
5. Wire ALL admin family-bound PDF issuers, ensure drafts/internal docs and non-admin unaffected, preserve signed PDF bytes, implement a safe manual handoff when official transport unavailable, and complete the acceptance criteria of #1404. Add tests for cross-tenant, cross-patient, duplicate, changed number, opt-out, and production-like synthetic E2E. Keep disabled until release review. Rollback: disable transport and revert isolated PR; no DB changes in this transport PR.

No live dispatch, feature activation, merge, deployment or production credentials were performed.