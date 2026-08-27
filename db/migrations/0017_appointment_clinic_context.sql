-- Associa appointments ao tenant clínico sem alterar dados clínicos cifrados.
-- Linhas legadas são preenchidas apenas quando o profissional possui uma única
-- membership ativa; linhas ambíguas permanecem NULL até reconciliação explícita.
ALTER TABLE appointments ADD COLUMN clinic_id TEXT REFERENCES clinics(id) ON DELETE SET NULL;

UPDATE appointments
   SET clinic_id = (
     SELECT CASE WHEN COUNT(*) = 1 THEN MAX(cm.clinic_id) END
       FROM clinic_memberships cm
      WHERE cm.user_id = appointments.provider_user_id
        AND cm.active = 1
   )
 WHERE clinic_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_clinic_provider_time
  ON appointments(clinic_id, provider_user_id, starts_at_local);
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_status_time
  ON appointments(clinic_id, status, starts_at_local);

CREATE TRIGGER IF NOT EXISTS trg_appointments_clinic_provider_same_tenant
BEFORE INSERT ON appointments
FOR EACH ROW WHEN NEW.clinic_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM clinic_memberships cm
   WHERE cm.clinic_id = NEW.clinic_id
     AND cm.user_id = NEW.provider_user_id
     AND cm.active = 1
)
BEGIN SELECT RAISE(ABORT, 'APPOINTMENT_CLINIC_PROVIDER_MISMATCH'); END;

CREATE TRIGGER IF NOT EXISTS trg_appointments_clinic_provider_same_tenant_update
BEFORE UPDATE OF clinic_id, provider_user_id ON appointments
FOR EACH ROW WHEN NEW.clinic_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM clinic_memberships cm
   WHERE cm.clinic_id = NEW.clinic_id
     AND cm.user_id = NEW.provider_user_id
     AND cm.active = 1
)
BEGIN SELECT RAISE(ABORT, 'APPOINTMENT_CLINIC_PROVIDER_MISMATCH'); END;

CREATE TRIGGER IF NOT EXISTS trg_communication_delivery_appointment_same_clinic
BEFORE INSERT ON communication_deliveries
WHEN NEW.appointment_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM appointments a WHERE a.id = NEW.appointment_id AND a.clinic_id = NEW.clinic_id
)
BEGIN SELECT RAISE(ABORT, 'COMMUNICATION_APPOINTMENT_TENANT_MISMATCH'); END;

CREATE TRIGGER IF NOT EXISTS trg_communication_delivery_survey_same_clinic
BEFORE INSERT ON communication_deliveries
WHEN NEW.survey_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM feedback_surveys s WHERE s.id = NEW.survey_id AND s.clinic_id = NEW.clinic_id
)
BEGIN SELECT RAISE(ABORT, 'COMMUNICATION_SURVEY_TENANT_MISMATCH'); END;
