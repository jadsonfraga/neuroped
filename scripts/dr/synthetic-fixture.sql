-- Fixtures 100% sintéticos para o ensaio de disaster recovery.
-- Os identificadores e domínios `.invalid` impedem confusão com pessoas reais.
INSERT INTO users (
  id, name, email, password_hash, role, is_active, created_at, updated_at
) VALUES
  (
    'dr-rehearsal-user-alpha', 'DR Alpha', 'alpha@dr-rehearsal.invalid',
    'synthetic', 'professional', 1,
    '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z'
  ),
  (
    'dr-rehearsal-user-beta', 'DR Beta', 'beta@dr-rehearsal.invalid',
    'synthetic', 'professional', 1,
    '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z'
  );

INSERT INTO clinics (
  id, slug, name, status, created_by_user_id, created_at, updated_at
) VALUES
  (
    'dr-rehearsal-clinic-alpha', 'dr-rehearsal-alpha', 'DR Alpha',
    'active', 'dr-rehearsal-user-alpha',
    '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z'
  ),
  (
    'dr-rehearsal-clinic-beta', 'dr-rehearsal-beta', 'DR Beta',
    'active', 'dr-rehearsal-user-beta',
    '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z'
  );

INSERT INTO clinic_memberships (
  clinic_id, user_id, role, active, created_at, updated_at
) VALUES
  (
    'dr-rehearsal-clinic-alpha', 'dr-rehearsal-user-alpha', 'owner', 1,
    '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z'
  ),
  (
    'dr-rehearsal-clinic-beta', 'dr-rehearsal-user-beta', 'owner', 1,
    '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z'
  );

INSERT INTO live_patients (
  id, clinic_id, primary_professional_user_id, created_by_user_id,
  external_reference_hash, patient_identity_hash, profile_encrypted,
  encryption_version, status, created_at, updated_at
) VALUES
  (
    'dr-rehearsal-patient-alpha', 'dr-rehearsal-clinic-alpha',
    'dr-rehearsal-user-alpha', 'dr-rehearsal-user-alpha',
    'dr-alpha-ref', 'dr-alpha-identity', 'enc:v1:synthetic-alpha-profile',
    'clinical-v1', 'active',
    '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z'
  ),
  (
    'dr-rehearsal-patient-beta', 'dr-rehearsal-clinic-beta',
    'dr-rehearsal-user-beta', 'dr-rehearsal-user-beta',
    'dr-beta-ref', 'dr-beta-identity', 'enc:v1:synthetic-beta-profile',
    'clinical-v1', 'active',
    '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z'
  );

INSERT INTO live_clinical_events (
  id, clinic_id, patient_id, author_user_id, event_type, occurred_at,
  provenance_kind, provenance_source, payload_encrypted,
  encryption_version, status, created_at
) VALUES
  (
    'dr-rehearsal-event-alpha', 'dr-rehearsal-clinic-alpha',
    'dr-rehearsal-patient-alpha', 'dr-rehearsal-user-alpha',
    'observation', '2026-01-01T00:00:00Z', 'measured', 'system',
    'enc:v1:synthetic-alpha-event', 'clinical-v1', 'active',
    '2026-01-01T00:00:00Z'
  ),
  (
    'dr-rehearsal-event-beta', 'dr-rehearsal-clinic-beta',
    'dr-rehearsal-patient-beta', 'dr-rehearsal-user-beta',
    'observation', '2026-01-01T00:00:00Z', 'measured', 'system',
    'enc:v1:synthetic-beta-event', 'clinical-v1', 'active',
    '2026-01-01T00:00:00Z'
  );
