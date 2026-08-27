-- Evidências de backup/restore são provas operacionais append-only.
-- Correções devem gerar nova evidência; não se altera a prova anterior.
CREATE TRIGGER IF NOT EXISTS trg_saas_backup_evidence_append_only_update
BEFORE UPDATE ON saas_backup_evidence
BEGIN
  SELECT RAISE(ABORT, 'SAAS_BACKUP_EVIDENCE_APPEND_ONLY');
END;

CREATE TRIGGER IF NOT EXISTS trg_saas_backup_evidence_append_only_delete
BEFORE DELETE ON saas_backup_evidence
BEGIN
  SELECT RAISE(ABORT, 'SAAS_BACKUP_EVIDENCE_APPEND_ONLY');
END;
