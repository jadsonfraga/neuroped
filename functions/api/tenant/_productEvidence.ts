/** Current-tenant metadata only. A successful SQL status is never a provider-revenue attestation. */
export const PRODUCT_EVIDENCE_SQL = `WITH authorized AS (
  SELECT c.id AS clinic_id FROM clinics c
  JOIN clinic_memberships m ON m.clinic_id = c.id
  JOIN users actor ON actor.id = m.user_id AND actor.is_active = 1
  WHERE c.id = ? AND m.user_id = ? AND m.active = 1 AND c.status = 'active'
    AND m.role IN (SELECT value FROM json_each(?))
)
SELECT a.clinic_id,
  (SELECT COUNT(DISTINCT u.id) FROM clinic_memberships m JOIN users u ON u.id = m.user_id
    WHERE m.clinic_id = a.clinic_id AND m.active = 1 AND u.is_active = 1) AS users,
  (SELECT COUNT(*) FROM clinic_memberships m WHERE m.clinic_id = a.clinic_id AND m.active = 1) AS memberships,
  (SELECT COUNT(*) FROM billing_subscriptions s JOIN billing_customers c ON c.id = s.customer_id
    WHERE c.clinic_id = a.clinic_id AND s.status = 'trial') AS trial_records,
  (SELECT COUNT(*) FROM billing_subscriptions s JOIN billing_customers c ON c.id = s.customer_id
    WHERE c.clinic_id = a.clinic_id AND s.status = 'active') AS active_subscription_records,
  (SELECT COUNT(*) FROM live_patients p WHERE p.clinic_id = a.clinic_id AND p.status <> 'merged') AS patients,
  (SELECT COUNT(*) FROM live_documents d WHERE d.clinic_id = a.clinic_id AND d.status = 'published') AS documents,
  (SELECT COUNT(*) FROM live_clinical_events e WHERE e.clinic_id = a.clinic_id AND e.status = 'active') AS clinical_events,
  (SELECT COUNT(*) FROM live_assessments s WHERE s.clinic_id = a.clinic_id AND s.status = 'active') AS assessments,
  (SELECT COUNT(*) FROM saas_audit_log l WHERE l.clinic_id = a.clinic_id) AS audit_records
FROM authorized a LIMIT 1`;
