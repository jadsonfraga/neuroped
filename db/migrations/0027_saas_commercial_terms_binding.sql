-- NeuroPed SaaS — vínculo canônico entre SKU e versão contratual.
--
-- 0026 introduziu catálogo/licenças. Esta migração separada fixa a versão dos
-- termos por SKU sem reescrever a migração anterior durante revisão.

ALTER TABLE commercial_offers ADD COLUMN terms_version TEXT;

UPDATE commercial_offers
   SET terms_version = 'institutional-pilot-terms-v1'
 WHERE code = 'institutional-pilot-1-0';

UPDATE commercial_offers
   SET terms_version = 'institutional-annual-terms-v1'
 WHERE code = 'institutional-annual-1-0';

-- Ofertas futuras não podem nascer sem uma versão contratual explícita.
CREATE TRIGGER IF NOT EXISTS trg_commercial_offer_terms_required_insert
BEFORE INSERT ON commercial_offers
WHEN NEW.terms_version IS NULL OR length(trim(NEW.terms_version)) = 0
BEGIN
  SELECT RAISE(ABORT, 'commercial offer terms version required');
END;

CREATE TRIGGER IF NOT EXISTS trg_commercial_offer_terms_required_update
BEFORE UPDATE OF terms_version ON commercial_offers
WHEN NEW.terms_version IS NULL OR length(trim(NEW.terms_version)) = 0
BEGIN
  SELECT RAISE(ABORT, 'commercial offer terms version required');
END;

-- A versão colocada na licença precisa ser exatamente a versão vigente do SKU.
-- O tenant pode aceitar somente esse mesmo valor, pois o trigger de ativação de
-- 0026 já exige acceptance.terms_version = license.contract_version.
CREATE TRIGGER IF NOT EXISTS trg_commercial_license_canonical_terms_insert
BEFORE INSERT ON commercial_licenses
WHEN NEW.contract_version <> (
  SELECT terms_version FROM commercial_offers WHERE id = NEW.offer_id
)
BEGIN
  SELECT RAISE(ABORT, 'commercial license terms version mismatch');
END;

CREATE TRIGGER IF NOT EXISTS trg_commercial_license_canonical_terms_update
BEFORE UPDATE OF contract_version ON commercial_licenses
WHEN NEW.contract_version <> (
  SELECT terms_version FROM commercial_offers WHERE id = NEW.offer_id
)
BEGIN
  SELECT RAISE(ABORT, 'commercial license terms version mismatch');
END;

-- Falha fechada caso um ambiente tenha recebido a coluna mas não os seeds.
CREATE TRIGGER IF NOT EXISTS trg_commercial_license_offer_terms_present
BEFORE INSERT ON commercial_licenses
WHEN (
  SELECT terms_version IS NULL OR length(trim(terms_version)) = 0
    FROM commercial_offers WHERE id = NEW.offer_id
)
BEGIN
  SELECT RAISE(ABORT, 'commercial offer terms version unavailable');
END;
