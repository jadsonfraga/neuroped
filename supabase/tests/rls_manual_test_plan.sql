-- NeuroPed EDJ — plano manual de teste RLS
-- Execute em ambiente Supabase de teste. Substitua os UUIDs antes de rodar.

-- 1. Confirmar RLS ativo
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('profiles', 'patients', 'clinical_documents', 'family_access_grants', 'audit_events')
order by tablename;

-- 2. Confirmar policies criadas
select schemaname, tablename, policyname, permissive, roles, cmd
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- 3. Criar massa de teste manual via usuarios reais do Supabase Auth
-- Use tres usuarios Auth reais:
-- DOCTOR_UUID
-- STAFF_UUID
-- FAMILY_UUID

-- 4. Inserir perfis
-- insert into public.profiles (id, role, display_name) values ('DOCTOR_UUID', 'doctor', 'Doctor Test');
-- insert into public.profiles (id, role, display_name) values ('STAFF_UUID', 'staff', 'Staff Test');
-- insert into public.profiles (id, role, display_name) values ('FAMILY_UUID', 'family', 'Family Test');

-- 5. Testes esperados no app/API com token do usuario medico
-- Deve conseguir criar paciente com owner_id = auth.uid().
-- Deve conseguir criar clinical_documents com owner_id = auth.uid().
-- Deve conseguir criar family_access_grants concedendo acesso.
-- Deve conseguir ler audit_events se role = doctor.

-- 6. Testes esperados com token familiar
-- Sem grant: nao deve ler pacientes/documentos.
-- Com grant valido: deve ler apenas paciente/documentos relacionados.
-- Com grant expirado: deve voltar a bloquear.
-- Nao deve ler audit_events.

-- 7. Testes negativos
-- Usuario A nao deve alterar paciente de owner_id do Usuario B.
-- Usuario family nao deve inserir documentos clinicos.
-- Usuario anonimo nao deve ler tabelas clinicas.
