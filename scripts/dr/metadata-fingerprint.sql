-- Fingerprint metadata-only para o ensaio de disaster recovery.
-- Não seleciona nomes, e-mails, payloads clínicos ou qualquer conteúdo de PHI.
-- A saída é uma única linha de contagens/invariantes determinísticas, que o
-- workflow transforma em SHA-256 antes de registrar ou comparar.
SELECT
  (SELECT COUNT(*)
     FROM sqlite_master
    WHERE type = 'table'
      AND name NOT LIKE 'sqlite_%') AS schema_tables,
  (SELECT COUNT(*)
     FROM sqlite_master
    WHERE type = 'index'
      AND name NOT LIKE 'sqlite_%') AS schema_indexes,
  (SELECT COUNT(*)
     FROM sqlite_master
    WHERE type = 'trigger'
      AND name NOT LIKE 'sqlite_%') AS schema_triggers,
  (SELECT COUNT(*) FROM users
    WHERE id LIKE 'dr-rehearsal-%') AS synthetic_users,
  (SELECT COUNT(*) FROM clinics
    WHERE id LIKE 'dr-rehearsal-%') AS synthetic_clinics,
  (SELECT COUNT(*) FROM clinic_memberships
    WHERE clinic_id LIKE 'dr-rehearsal-%') AS synthetic_memberships,
  (SELECT COUNT(*) FROM live_patients
    WHERE id LIKE 'dr-rehearsal-%') AS synthetic_patients,
  (SELECT COUNT(*) FROM live_clinical_events
    WHERE id LIKE 'dr-rehearsal-%') AS synthetic_events,
  (SELECT COUNT(DISTINCT clinic_id) FROM live_patients
    WHERE id LIKE 'dr-rehearsal-%') AS represented_patient_clinics,
  (SELECT COUNT(*)
     FROM live_patients AS patient
     JOIN clinic_memberships AS membership
       ON membership.clinic_id = patient.clinic_id
      AND membership.user_id = patient.created_by_user_id
      AND membership.active = 1
    WHERE patient.id LIKE 'dr-rehearsal-%') AS tenant_scoped_patients,
  (SELECT COUNT(*) FROM live_patients
    WHERE id LIKE 'dr-rehearsal-%'
      AND profile_encrypted LIKE 'enc:v1:%'
      AND encryption_version = 'clinical-v1') AS encrypted_patient_envelopes,
  (SELECT COUNT(*) FROM live_clinical_events
    WHERE id LIKE 'dr-rehearsal-%'
      AND payload_encrypted LIKE 'enc:v1:%'
      AND encryption_version = 'clinical-v1') AS encrypted_event_envelopes,
  (SELECT COALESCE(SUM(LENGTH(profile_encrypted)), 0) FROM live_patients
    WHERE id LIKE 'dr-rehearsal-%') AS patient_envelope_bytes,
  (SELECT COALESCE(SUM(LENGTH(payload_encrypted)), 0) FROM live_clinical_events
    WHERE id LIKE 'dr-rehearsal-%') AS event_envelope_bytes;
