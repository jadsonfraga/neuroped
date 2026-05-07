-- Dados fictícios para demonstração. Não contém CPF, laudo real ou identificador sensível.
-- Ajuste os UUIDs de user_id após criar usuários reais no Supabase Auth.

insert into public.patients (code, display_name, birth_date, clinical_summary)
values
  ('paciente-demo-001', 'João Demo', '2018-01-01', 'Registro fictício para teste de navegação.'),
  ('paciente-demo-002', 'Maria Exemplo', '2020-01-01', 'Registro fictício para teste de documentos.');

insert into public.audit_logs (action, table_name, record_id)
values
  ('seed_demo_created', 'patients', 'paciente-demo-001'),
  ('seed_demo_created', 'patients', 'paciente-demo-002');
