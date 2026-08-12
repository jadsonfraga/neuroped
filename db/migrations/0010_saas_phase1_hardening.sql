-- NeuroPed SaaS Phase 1 — hardening pós-auditoria.
--
-- Invariantes físicas:
-- 1. uma clínica nunca pode ficar sem owner ativo por corrida ou endpoint alternativo;
-- 2. um evento clínico só pode ter um sucessor direto, formando cadeia linear;
-- 3. provenance_source em plaintext é exclusivamente taxonomia controlada,
--    nunca texto livre/PII. Detalhes de fonte permanecem no payload cifrado.

CREATE UNIQUE INDEX IF NOT EXISTS ux_live_clinical_events_supersedes_once
  ON live_clinical_events(supersedes_event_id)
  WHERE supersedes_event_id IS NOT NULL;

CREATE TRIGGER IF NOT EXISTS trg_clinic_memberships_keep_last_owner_update
BEFORE UPDATE OF role, active ON clinic_memberships
WHEN OLD.role = 'owner'
 AND OLD.active = 1
 AND (NEW.role <> 'owner' OR NEW.active <> 1)
 AND NOT EXISTS (
   SELECT 1
     FROM clinic_memberships other
    WHERE other.clinic_id = OLD.clinic_id
      AND other.user_id <> OLD.user_id
      AND other.role = 'owner'
      AND other.active = 1
 )
BEGIN
  SELECT RAISE(ABORT, 'LAST_OWNER_PROTECTED');
END;

CREATE TRIGGER IF NOT EXISTS trg_clinic_memberships_keep_last_owner_delete
BEFORE DELETE ON clinic_memberships
WHEN OLD.role = 'owner'
 AND OLD.active = 1
 AND NOT EXISTS (
   SELECT 1
     FROM clinic_memberships other
    WHERE other.clinic_id = OLD.clinic_id
      AND other.user_id <> OLD.user_id
      AND other.role = 'owner'
      AND other.active = 1
 )
BEGIN
  SELECT RAISE(ABORT, 'LAST_OWNER_PROTECTED');
END;

CREATE TRIGGER IF NOT EXISTS trg_live_events_provenance_source_insert
BEFORE INSERT ON live_clinical_events
WHEN NEW.provenance_source NOT IN (
  'patient','family','school','therapist','clinician','instrument','laboratory',
  'imaging','eeg','genetics','document','device','system','other'
)
BEGIN
  SELECT RAISE(ABORT, 'INVALID_PROVENANCE_SOURCE');
END;

CREATE TRIGGER IF NOT EXISTS trg_live_events_provenance_source_update
BEFORE UPDATE OF provenance_source ON live_clinical_events
WHEN NEW.provenance_source NOT IN (
  'patient','family','school','therapist','clinician','instrument','laboratory',
  'imaging','eeg','genetics','document','device','system','other'
)
BEGIN
  SELECT RAISE(ABORT, 'INVALID_PROVENANCE_SOURCE');
END;
