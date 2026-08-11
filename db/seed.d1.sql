-- Seed D1 pós-criptografia clínica.
--
-- Registros clínicos fictícios deixaram de ser semeados por SQL porque um seed
-- estático não possui acesso à CLINICAL_DATA_KEY e reintroduziria plaintext.
-- O catálogo demonstrativo sem banco permanece no código do cliente/API.
-- Em instalações D1, qualquer dado clínico deve nascer pelos endpoints, que
-- aplicam o envelope AES-GCM c1 antes de persistir.

INSERT OR IGNORE INTO app_settings (key, value)
VALUES ('app.seed.clinical_plaintext', 'disabled');
