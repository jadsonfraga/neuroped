-- Defesa adicional forward-only: não reescreve os triggers históricos de 0026.
-- A autorização do guard é um preflight. Vínculo/tenant/licença precisam estar
-- válidos também no instante da escrita que confirma abertura ou exportação.
CREATE TRIGGER IF NOT EXISTS trg_commercial_material_usage_live_membership
BEFORE INSERT ON commercial_usage_events
WHEN NEW.kind IN ('material_open','material_export')
BEGIN
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1
      FROM commercial_licenses cl
      JOIN clinics c ON c.id = cl.clinic_id AND c.status = 'active'
      JOIN clinic_memberships cm
        ON cm.clinic_id = cl.clinic_id
       AND cm.user_id = NEW.actor_user_id
       AND cm.active = 1
      JOIN commercial_license_users u
        ON u.license_id = cl.id
       AND u.user_id = cm.user_id
       AND u.status = 'active'
     WHERE cl.id = NEW.license_id
       AND cl.clinic_id = NEW.clinic_id
       AND cl.status = 'active'
       AND julianday(cl.activated_at) <= julianday('now')
       AND julianday(cl.expires_at) > julianday('now')
  ) THEN RAISE(ABORT, 'COMMERCIAL_ACCESS_CHANGED') END;
END;
