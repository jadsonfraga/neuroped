/** One snapshot/authorization statement: missing and foreign tenants both return no row. */
export const ONBOARDING_PROGRESS_SQL = `WITH authorized AS (
  SELECT c.id AS clinic_id, c.created_at AS clinic_created, m.user_id
  FROM clinic_memberships m JOIN clinics c ON c.id = m.clinic_id
  WHERE m.clinic_id = ? AND m.user_id = ? AND m.active = 1 AND c.status = 'active'
    AND m.role IN (SELECT value FROM json_each(?))
)
SELECT u.created_at AS account_created, u.email_verified_at AS email_verified,
  a.clinic_created,
  (SELECT COALESCE(pc.created_at, 'INVALID_TIMESTAMP') FROM billing_provider_checkouts pc
    JOIN billing_customers bc ON bc.id = pc.billing_customer_id
    WHERE bc.clinic_id = a.clinic_id ORDER BY julianday(pc.created_at) LIMIT 1) AS plan_selected,
  (SELECT COALESCE(cm.created_at, 'INVALID_TIMESTAMP') FROM clinic_memberships cm WHERE cm.clinic_id = a.clinic_id ORDER BY julianday(cm.created_at) LIMIT 1) AS first_member,
  (SELECT COALESCE(p.created_at, 'INVALID_TIMESTAMP') FROM live_patients p WHERE p.clinic_id = a.clinic_id ORDER BY julianday(p.created_at) LIMIT 1) AS first_patient,
  (SELECT COALESCE(e.created_at, 'INVALID_TIMESTAMP') FROM live_clinical_events e
    WHERE e.clinic_id = a.clinic_id AND e.event_type = 'encounter' AND e.status <> 'voided' ORDER BY julianday(e.created_at) LIMIT 1) AS first_consultation,
  (SELECT COALESCE(d.created_at, 'INVALID_TIMESTAMP') FROM live_documents d
    WHERE d.clinic_id = a.clinic_id AND d.status <> 'voided' ORDER BY julianday(d.created_at) LIMIT 1) AS first_document,
  (SELECT COALESCE(s.created_at, 'INVALID_TIMESTAMP') FROM live_assessments s
    WHERE s.clinic_id = a.clinic_id AND s.status <> 'voided' ORDER BY julianday(s.created_at) LIMIT 1) AS first_assessment
FROM authorized a JOIN users u ON u.id = a.user_id AND u.is_active = 1
LIMIT 1`;
