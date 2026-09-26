-- 0026 — clinic_id na agenda/operações (achado OPS-01/OPS-02 da auditoria de
-- tenancy, docs/audits/SAAS_TENANCY_AUDIT_2026-09-26.md).
--
-- Problema: todo o esquema operacional (0007_operational_suite.sql e
-- 0008_operational_hardening.sql) escopa por `provider_user_id`, nunca por
-- clínica. Um profissional membro de duas clínicas (qualquer profissional
-- verificado cria uma segunda clínica por POST /api/tenants, ou aceita
-- convite de outra) expõe a agenda inteira — com PII de responsáveis e
-- pacientes decifrada — no contexto da clínica errada, inclusive para a
-- secretária vinculada a ele nessa clínica.
--
-- Correção: coluna aditiva `clinic_id` (nullable, sem FK — mesmo padrão de
-- `patients_demo.owner_user_id` em 0002_patient_ownership.sql, compatível
-- com D1/SQLite) em cada tabela que hoje só tem `provider_user_id`.
--
-- Backfill determinístico e sem perda: a clínica de uma linha existente é a
-- ÚNICA membership ativa do provider responsável. Quando o provider tem 0 ou
-- 2+ memberships ativas, a linha fica com `clinic_id` NULL — nunca é
-- adivinhada. O workflow de aplicação desta migração
-- (.github/workflows/operations-clinic-scope-d1-migration.yml) reporta a
-- contagem de linhas ainda com `clinic_id` NULL por tabela como parte da
-- verificação pós-migração (visível, não bloqueia o deploy: exige
-- atribuição manual auditada, não uma heurística automática). O código da
-- aplicação passa a exigir `clinic_id` explicitamente resolvido por
-- requisição; uma linha com `clinic_id` NULL simplesmente não aparece para
-- ninguém até ser atribuída — fail-closed, nunca fail-open.
--
-- `appointment_slot_locks` e `booking_provider_profiles`/`booking_staff_links`
-- ficam FORA desta migração de propósito: o lock de agenda é uma trava física
-- de tempo do PRÓPRIO PROFISSIONAL (uma pessoa não pode estar em dois lugares
-- ao mesmo tempo, mesmo em clínicas diferentes) e não deve ganhar dimensão de
-- clínica; o perfil público e o vínculo de recepção têm redesenho de chave
-- primária pendente (OPS-05/OPS-03 no backlog) que esta migração não tenta
-- resolver.

ALTER TABLE booking_services ADD COLUMN clinic_id TEXT;
ALTER TABLE booking_availability_rules ADD COLUMN clinic_id TEXT;
ALTER TABLE booking_blocks ADD COLUMN clinic_id TEXT;
ALTER TABLE appointments ADD COLUMN clinic_id TEXT;
ALTER TABLE waitlist_entries ADD COLUMN clinic_id TEXT;
ALTER TABLE appointment_reviews ADD COLUMN clinic_id TEXT;
ALTER TABLE notification_outbox ADD COLUMN clinic_id TEXT;
ALTER TABLE operations_audit_log ADD COLUMN clinic_id TEXT;

-- Backfill: clinic_id = a única membership ativa do provider_user_id.
-- `HAVING COUNT(*) = 1` garante que só o caso não ambíguo recebe valor;
-- reexecutar esta UPDATE depois de uma correção manual de membership é
-- seguro, porque só toca `WHERE clinic_id IS NULL`.
UPDATE booking_services SET clinic_id = (
  SELECT cm.clinic_id FROM clinic_memberships cm
   WHERE cm.user_id = booking_services.provider_user_id AND cm.active = 1
   GROUP BY cm.user_id HAVING COUNT(*) = 1
) WHERE clinic_id IS NULL;

UPDATE booking_availability_rules SET clinic_id = (
  SELECT cm.clinic_id FROM clinic_memberships cm
   WHERE cm.user_id = booking_availability_rules.provider_user_id AND cm.active = 1
   GROUP BY cm.user_id HAVING COUNT(*) = 1
) WHERE clinic_id IS NULL;

UPDATE booking_blocks SET clinic_id = (
  SELECT cm.clinic_id FROM clinic_memberships cm
   WHERE cm.user_id = booking_blocks.provider_user_id AND cm.active = 1
   GROUP BY cm.user_id HAVING COUNT(*) = 1
) WHERE clinic_id IS NULL;

UPDATE appointments SET clinic_id = (
  SELECT cm.clinic_id FROM clinic_memberships cm
   WHERE cm.user_id = appointments.provider_user_id AND cm.active = 1
   GROUP BY cm.user_id HAVING COUNT(*) = 1
) WHERE clinic_id IS NULL;

UPDATE waitlist_entries SET clinic_id = (
  SELECT cm.clinic_id FROM clinic_memberships cm
   WHERE cm.user_id = waitlist_entries.provider_user_id AND cm.active = 1
   GROUP BY cm.user_id HAVING COUNT(*) = 1
) WHERE clinic_id IS NULL;

UPDATE appointment_reviews SET clinic_id = (
  SELECT cm.clinic_id FROM clinic_memberships cm
   WHERE cm.user_id = appointment_reviews.provider_user_id AND cm.active = 1
   GROUP BY cm.user_id HAVING COUNT(*) = 1
) WHERE clinic_id IS NULL;

UPDATE notification_outbox SET clinic_id = (
  SELECT cm.clinic_id FROM clinic_memberships cm
   WHERE cm.user_id = notification_outbox.provider_user_id AND cm.active = 1
   GROUP BY cm.user_id HAVING COUNT(*) = 1
) WHERE clinic_id IS NULL;

UPDATE operations_audit_log SET clinic_id = (
  SELECT cm.clinic_id FROM clinic_memberships cm
   WHERE cm.user_id = operations_audit_log.provider_user_id AND cm.active = 1
   GROUP BY cm.user_id HAVING COUNT(*) = 1
) WHERE clinic_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_booking_services_clinic ON booking_services(clinic_id, active, public_visible);
CREATE INDEX IF NOT EXISTS idx_booking_rules_clinic ON booking_availability_rules(clinic_id, provider_user_id, weekday, active);
CREATE INDEX IF NOT EXISTS idx_booking_blocks_clinic ON booking_blocks(clinic_id, provider_user_id, starts_at_local, ends_at_local);
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_time ON appointments(clinic_id, provider_user_id, starts_at_local);
CREATE INDEX IF NOT EXISTS idx_waitlist_clinic_status ON waitlist_entries(clinic_id, provider_user_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_reviews_clinic_approved ON appointment_reviews(clinic_id, provider_user_id, approved, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_clinic_status ON notification_outbox(clinic_id, provider_user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_operations_audit_clinic_time ON operations_audit_log(clinic_id, created_at DESC);
