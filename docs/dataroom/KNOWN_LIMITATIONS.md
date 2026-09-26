# Known limitations — mandatory release companion

Inspected baseline: `0b4f74fb49214d00944fc2a366d3b4454363601a`. Evidence date: 2026-09-26.

Overall VALUE ×3 acceptance is **PARTIAL**, not commercial-ready or production-recovery-certified.

1. Autonomous customer-zero E2E is not implemented/executed in this delivery. Existing signup/team/clinic/patient flows plus a progress view are not the entire self-service journey. Real payment-method setup, provider cancellation/reactivation, invoices, revenue/cohorts and professional identity remain unproven.
2. Onboarding is a read model over retained timestamps, not an immutable completion ledger. Owner membership counts explicitly; saved draft is not final reviewed document. Billing is deliberately not marked verified.
3. Clinical summary preserves structured sources but does not extract arbitrary documents. Comparability is structural only; source category is not rater identity. Numeric change is not improvement. The existing 500-event reader cap is flagged. Universal durable professional-review attestation across existing publishing paths is not implemented.
4. Product Evidence is current-tenant metadata only. Platform customer counts, MRR/ARPA/churn, uptime, deployed SHA, restore/backup, incidents and policy approvals remain unknown rather than fabricated zero. Published-document status does not prove professional review.
5. Recovery proof covers a two-table synthetic SQLite projection, not D1, the full schema, clinical decryption, real data or production volume. Trusted manifest/key custody, cloud backup policy and operational RPO/RTO remain unverified.
6. Sampled audit does not certify all tenant-owned entities, legacy handlers, links, pagination, lookup side channels, telemetry or alternate runtimes. An existing supersession exception lookup lacks an explicit tenant predicate and still needs defense-in-depth review.
7. New CI files are not automatically required production gates. No branch-protection bypass, force push to main, merge or new deploy was performed. Independent PR CI is not combined regression acceptance.
8. UI integration is source-level until authenticated browser tests and visual/behavioral inspection complete. SaaS/trust share a panel file; reconcile both additions before merge.
9. No real customer, revenue, certification, clinical efficacy, legal compliance or asset valuation was asserted. External configuration availability was not established; absence of proof is not proof the service is down.

Update this file when a limitation is removed, attaching the actual scope, environment, SHA and evidence. Never remove an item solely because code was written or a narrow test passed.
