-- NeuroPed — evidência LGPD do aceite no agendamento público
-- Não retropreenche registros históricos: evidência só nasce em novos inserts.

CREATE TABLE IF NOT EXISTS public_booking_consent_evidence (
  id TEXT PRIMARY KEY,
  appointment_id TEXT UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
  waitlist_entry_id TEXT UNIQUE REFERENCES waitlist_entries(id) ON DELETE CASCADE,
  notice_version TEXT NOT NULL,
  notice_sha256 TEXT NOT NULL,
  purpose TEXT NOT NULL,
  accepted_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (
    (appointment_id IS NOT NULL AND waitlist_entry_id IS NULL)
    OR (appointment_id IS NULL AND waitlist_entry_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_public_booking_consent_accepted_at
  ON public_booking_consent_evidence(accepted_at DESC);

-- O endpoint /api/public-booking já falha fechado quando privacyAccepted !== true.
-- Logo, um appointment com source='public' criado por esse fluxo representa um
-- aceite validado pelo servidor. A trigger persiste versão/hash/finalidade no
-- mesmo commit do INSERT, evitando janela de sucesso sem evidência.
CREATE TRIGGER IF NOT EXISTS trg_public_appointment_consent_evidence
AFTER INSERT ON appointments
WHEN NEW.source = 'public'
BEGIN
  INSERT INTO public_booking_consent_evidence
    (id, appointment_id, waitlist_entry_id, notice_version, notice_sha256, purpose, accepted_at, created_at)
  VALUES
    ('consent-appt-' || NEW.id,
     NEW.id,
     NULL,
     'public-booking-privacy-v1',
     'sha256:d0a7e8c1ed9dff137adb2532a1ce4b11a3e91accf5ce6880fd3108a918932ece',
     'appointment_scheduling_and_management',
     NEW.created_at,
     NEW.created_at);
END;

-- Atualmente waitlist_entries só é criada pelo fluxo público, que também exige
-- privacyAccepted === true. Não há backfill: entradas antigas permanecem sem
-- evidência em vez de receberem consentimento presumido retroativamente.
CREATE TRIGGER IF NOT EXISTS trg_public_waitlist_consent_evidence
AFTER INSERT ON waitlist_entries
BEGIN
  INSERT INTO public_booking_consent_evidence
    (id, appointment_id, waitlist_entry_id, notice_version, notice_sha256, purpose, accepted_at, created_at)
  VALUES
    ('consent-wait-' || NEW.id,
     NULL,
     NEW.id,
     'public-booking-privacy-v1',
     'sha256:d0a7e8c1ed9dff137adb2532a1ce4b11a3e91accf5ce6880fd3108a918932ece',
     'appointment_scheduling_and_management',
     NEW.created_at,
     NEW.created_at);
END;
