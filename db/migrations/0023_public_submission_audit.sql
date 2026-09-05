-- 0023 — Trilha de auditoria dos envios clínicos públicos.
--
-- Problema: POST /api/public-scale e POST /api/public-intake persistem dado
-- clínico cifrado e mudam o estado de um convite sem deixar NENHUMA trilha.
-- São os únicos caminhos da plataforma em que um terceiro não autenticado
-- grava dado clínico — exatamente onde a rastreabilidade LGPD mais importa.
--
-- Por que uma tabela dedicada, e não saas_audit_log:
-- saas_audit_log.actor_user_id é NOT NULL REFERENCES users(id). Nestes envios
-- não existe usuário ator — quem responde é a família, portadora de um convite.
-- As duas saídas seriam:
--   (a) reconstruir saas_audit_log para aceitar ator nulo — rebuild de 12
--       passos numa tabela append-only viva, com risco desproporcional; ou
--   (b) gravar o profissional que criou o convite como ator — misatribuição:
--       a linha diria que o profissional submeteu o que a família submeteu.
-- Nenhuma das duas é aceitável. O ator aqui é estruturalmente diferente, então
-- ganha uma trilha própria. O repositório já tem precedente de trilha separada
-- por domínio (operations_audit_log).
--
-- O que esta tabela NÃO guarda, por construção (não há coluna para isso):
-- nome, respostas, conteúdo clínico, patient_id, token, URL ou qualquer PHI.
-- Só a classe da operação, a superfície, o convite, a versão do consentimento
-- e o resultado — o mínimo para provar que o envio ocorreu e sob qual aceite.
--
-- Rollback: DROP TABLE IF EXISTS public_submission_audit_log;
-- Migração puramente aditiva: não altera, não copia e não remove nenhuma
-- tabela existente, e não pode corromper o histórico de auditoria atual.

CREATE TABLE IF NOT EXISTS public_submission_audit_log (
  id TEXT PRIMARY KEY,
  -- Tenant-scoped: a trilha pertence à clínica dona do convite, e acompanha a
  -- eliminação do tenant (LGPD) em vez de sobreviver a ela órfã.
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  surface TEXT NOT NULL CHECK (surface IN ('public_scale', 'public_intake')),
  action TEXT NOT NULL CHECK (action IN ('submitted')),
  -- Id opaco do convite, dentro do tenant. Permite correlacionar o envio ao
  -- convite sem citar o paciente.
  invitation_id TEXT NOT NULL,
  consent_version TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK (outcome IN ('accepted')),
  origin TEXT NOT NULL DEFAULT 'public_invitation'
    CHECK (origin IN ('public_invitation')),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_public_submission_audit_clinic_time
  ON public_submission_audit_log (clinic_id, created_at DESC);

-- Um envio aceito por convite é registrado uma única vez: reenvio que vencesse
-- a corrida não pode inflar a trilha.
CREATE UNIQUE INDEX IF NOT EXISTS idx_public_submission_audit_invitation
  ON public_submission_audit_log (surface, invitation_id);
