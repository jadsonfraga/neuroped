-- 0030 — Feature flags por clínica.
--
-- Até aqui a única decisão de "o que está ligado" era por plano
-- (shared/entitlements.ts). A clínica não tinha como desligar, para si, um
-- recurso que o plano concede — por exemplo, parar de emitir links de
-- pré-consulta remota sem cancelar a assinatura.
--
-- Uma linha por (clínica, chave). Ausência de linha = padrão do catálogo em
-- shared/clinicFeatures.ts (todas as flags existentes nascem LIGADAS, porque
-- representam recursos que já operavam). O conjunto válido de chaves mora no
-- catálogo, não em CHECK: cada flag nova é uma linha no catálogo com teste,
-- não uma migração — e o código ignora chave que não conhece.
--
-- A tabela é configuração da clínica (sem coluna de titular): entra na lista
-- de preservadas do purge LGPD, ao lado de clinic_settings.
--
-- Rollback: reverter o código, preservando a tabela aditiva e as decisões
-- auditadas. Não apagar configurações persistidas como rotina de rollback.

CREATE TABLE IF NOT EXISTS clinic_feature_flags (
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  flag_key TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
  updated_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (clinic_id, flag_key)
);
