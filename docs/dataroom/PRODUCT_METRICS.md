# Product metrics and evidence semantics

Inspected baseline: `0b4f74fb49214d00944fc2a366d3b4454363601a`. Evidence date: 2026-09-26.

`Product Evidence` is an authenticated panel under the existing Settings → Activity area. Its endpoint is `/api/tenants/:id/product-evidence`, authorized by `organization.metrics.read`. It is deliberately limited to the current clinic, not a global operator view.

Observed SQL counters: active linked users and memberships; retained trial/active subscription status rows; unmerged patients; published-status documents; active clinical events/assessments; tenant audit records. A successful count of zero is displayed as zero. Query failure, missing schema, unavailable health and unconnected evidence are not converted into zeros.

Subscription status is not payment confirmation, MRR or paying-customer count. Real MRR/ARPA/churn require a defined recurring-revenue policy, verified provider mode, confirmed/reconciled events, refunds/cancellations and coherent cohort periods. None is inferred from prices, redirects or retained database status here.

The canonical health handler supplies a point observation of status/database/declared API version. Its static version string is not the deployed SHA. Uptime, critical tests, deployment, backup/restore/isolation attestations, incidents, registry counts and policy version remain `NOT_MEASURED` with null values until trusted evidence is attached.

Clinical counters measure stored records, not clinical improvement or completed care. No synthetic records are inserted into production by this operation. The new endpoint audits its own administrative read with actor, clinic, action, request ID and result, without PHI; global historical audit completeness is not certified.
