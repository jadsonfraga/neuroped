-- =====================================================================
-- NeuroPed EDJ — Schema v6 production-ready (Supabase / PostgreSQL)
-- Inclui: RLS, auditoria, assinatura digital, multi-tenant futuro
-- Como aplicar:
--   1. Supabase SQL Editor → New query
--   2. Cole este arquivo inteiro
--   3. Run
-- =====================================================================

-- =====================================================================
-- 1. EXTENSÕES
-- =====================================================================
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- =====================================================================
-- 2. PERFIL DO USUÁRIO (vinculado a auth.users)
-- =====================================================================
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  role text not null check (role in ('admin','medico','secretaria','terapeuta','familia')),
  crm text,
  rqe text,
  active boolean default true,
  mfa_enabled boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "profiles_self_select" on public.profiles
  for select using (auth.uid() = user_id);

create policy "profiles_self_update" on public.profiles
  for update using (auth.uid() = user_id);

-- =====================================================================
-- 3. CLÍNICA (multi-tenant futuro)
-- =====================================================================
create table if not exists public.clinics (
  id uuid primary key default uuid_generate_v4(),
  owner_user_id uuid references auth.users(id),
  name text not null,
  cnpj text,
  address jsonb,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.clinic_members (
  clinic_id uuid references public.clinics(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role_in_clinic text check (role_in_clinic in ('admin','medico','secretaria','terapeuta')),
  primary key (clinic_id, user_id)
);

alter table public.clinic_members enable row level security;
create policy "members_see_own" on public.clinic_members for select
  using (user_id = auth.uid());

-- =====================================================================
-- 4. PACIENTES
-- =====================================================================
create table if not exists public.patients (
  id uuid primary key default uuid_generate_v4(),
  clinic_id uuid references public.clinics(id),
  code text unique not null,
  full_name text not null,
  dob date,
  gender text check (gender in ('M','F','outro','nao_informado')),
  responsible_name text,
  responsible_phone text,
  responsible_email text,
  domain text,
  status text default 'ativo' check (status in ('ativo','retorno','alta','arquivado')),
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  archived_at timestamptz,
  -- Marcador para distinguir pacientes reais de demo
  is_demo boolean default false
);

create index if not exists idx_patients_clinic on public.patients(clinic_id);
create index if not exists idx_patients_status on public.patients(status);

alter table public.patients enable row level security;

-- Médicos e secretárias da MESMA clínica veem
create policy "patients_select_clinic_member" on public.patients
  for select using (
    clinic_id in (select clinic_id from public.clinic_members where user_id = auth.uid())
  );

create policy "patients_insert_authorized" on public.patients
  for insert with check (
    clinic_id in (select clinic_id from public.clinic_members where user_id = auth.uid() and role_in_clinic in ('admin','medico','secretaria'))
  );

create policy "patients_update_authorized" on public.patients
  for update using (
    clinic_id in (select clinic_id from public.clinic_members where user_id = auth.uid() and role_in_clinic in ('admin','medico'))
  );

-- =====================================================================
-- 5. INSTRUMENTOS APLICADOS / SUBMISSIONS
-- =====================================================================
create table if not exists public.submissions (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid references public.patients(id) on delete cascade,
  clinic_id uuid references public.clinics(id),
  instrument_id text not null,
  instrument_title text not null,
  answers jsonb not null default '{}'::jsonb,
  raw_score int,
  total_items int,
  applied_by uuid references auth.users(id),
  family_token uuid,  -- se foi respondida via passe familiar
  created_at timestamptz default now()
);

create index if not exists idx_submissions_patient on public.submissions(patient_id);
create index if not exists idx_submissions_clinic on public.submissions(clinic_id);

alter table public.submissions enable row level security;

create policy "submissions_select_clinic_member" on public.submissions
  for select using (
    clinic_id in (select clinic_id from public.clinic_members where user_id = auth.uid())
  );

create policy "submissions_insert_authorized" on public.submissions
  for insert with check (
    clinic_id in (select clinic_id from public.clinic_members where user_id = auth.uid())
  );

-- =====================================================================
-- 6. CONSULTAS
-- =====================================================================
create table if not exists public.consultations (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid references public.patients(id) on delete cascade,
  clinic_id uuid references public.clinics(id),
  scheduled_at timestamptz,
  performed_at timestamptz,
  type text check (type in ('primeira','retorno','devolutiva','tele','familia','reuniao')),
  status text default 'agendada' check (status in ('agendada','realizada','cancelada','faltou')),
  chief_complaint text,
  hpma text,
  exam text,
  hypothesis text,
  conduct text,
  attended_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_consultations_patient on public.consultations(patient_id);
create index if not exists idx_consultations_scheduled on public.consultations(scheduled_at);

alter table public.consultations enable row level security;

create policy "consultations_select_clinic_member" on public.consultations
  for select using (
    clinic_id in (select clinic_id from public.clinic_members where user_id = auth.uid())
  );

create policy "consultations_modify_medico" on public.consultations
  for all using (
    clinic_id in (select clinic_id from public.clinic_members where user_id = auth.uid() and role_in_clinic in ('admin','medico'))
  );

-- =====================================================================
-- 7. DOCUMENTOS (laudos, atestados, receitas, pedidos de exame)
-- =====================================================================
create table if not exists public.documents (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid references public.patients(id),
  consultation_id uuid references public.consultations(id),
  clinic_id uuid references public.clinics(id),
  type text not null check (type in ('laudo','atestado','receita','receita_controlada','pedido_exame','declaracao','devolutiva','orientacao')),
  title text not null,
  content_html text,                          -- HTML renderizado
  content_pdf_storage_path text,              -- caminho no Supabase Storage
  content_hash text not null,                 -- SHA-256 do conteúdo
  status text default 'rascunho' check (status in ('rascunho','assinado','revogado','expirado')),
  created_by uuid references auth.users(id) not null,
  created_at timestamptz default now(),
  signed_at timestamptz,
  signature_id uuid                           -- FK para signatures
);

create index if not exists idx_documents_patient on public.documents(patient_id);
create index if not exists idx_documents_status on public.documents(status);
create index if not exists idx_documents_hash on public.documents(content_hash);

alter table public.documents enable row level security;

create policy "documents_select_clinic_member" on public.documents
  for select using (
    clinic_id in (select clinic_id from public.clinic_members where user_id = auth.uid())
  );

create policy "documents_modify_medico" on public.documents
  for all using (
    clinic_id in (select clinic_id from public.clinic_members where user_id = auth.uid() and role_in_clinic in ('admin','medico'))
  );

-- =====================================================================
-- 8. ASSINATURAS DIGITAIS
-- =====================================================================
create table if not exists public.signatures (
  id uuid primary key default uuid_generate_v4(),
  document_id uuid references public.documents(id) on delete cascade,
  signer_user_id uuid references auth.users(id) not null,
  signer_name text not null,
  signer_crm text,
  certificate_subject text,                   -- ex: "Dr. Jadson Fraga - CPF XXX..."
  certificate_issuer text,                    -- ex: "AC Soluti RFB v5"
  certificate_serial text,
  certificate_valid_from timestamptz,
  certificate_valid_until timestamptz,
  signature_format text default 'PAdES-LTA',  -- PAdES-B, PAdES-T, PAdES-LTA
  signature_algorithm text default 'RSA-SHA256',
  signature_bytes_base64 text,                -- assinatura criptográfica
  timestamp_authority text,                   -- TSA usada
  timestamp_token_base64 text,
  signed_pdf_storage_path text,               -- PDF final assinado
  signed_pdf_hash text,                       -- SHA-256 do PDF assinado
  verification_url text,                      -- /verificar/<id>
  signed_at timestamptz default now() not null,
  revoked_at timestamptz,
  revocation_reason text,
  -- Metadados para verificação pública
  public_metadata jsonb default '{}'::jsonb
);

create unique index if not exists idx_signatures_doc on public.signatures(document_id);
create index if not exists idx_signatures_hash on public.signatures(signed_pdf_hash);

alter table public.signatures enable row level security;

-- LEITURA PÚBLICA: qualquer pessoa pode verificar uma assinatura via hash
-- (mas só campos seguros são expostos por uma VIEW)
create policy "signatures_select_clinic_member" on public.signatures
  for select using (
    document_id in (
      select id from public.documents where clinic_id in (
        select clinic_id from public.clinic_members where user_id = auth.uid()
      )
    )
  );

-- View pública sanitizada para verificação
create or replace view public.signatures_public as
  select
    id,
    signer_name,
    signer_crm,
    certificate_subject,
    certificate_issuer,
    certificate_valid_from,
    certificate_valid_until,
    signature_format,
    signature_algorithm,
    timestamp_authority,
    signed_pdf_hash,
    signed_at,
    revoked_at,
    public_metadata
  from public.signatures;

grant select on public.signatures_public to anon;

-- =====================================================================
-- 9. PASSES FAMILIARES (compartilhamento limitado)
-- =====================================================================
create table if not exists public.family_passes (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid references public.patients(id) on delete cascade,
  token uuid unique not null default uuid_generate_v4(),
  allowed_instruments text[] default '{}',    -- IDs permitidos
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '14 days'),
  revoked_at timestamptz,
  usage_count int default 0,
  max_usages int default 100
);

create index if not exists idx_family_passes_token on public.family_passes(token);

alter table public.family_passes enable row level security;
create policy "family_passes_clinic_member" on public.family_passes
  for all using (
    patient_id in (
      select id from public.patients where clinic_id in (
        select clinic_id from public.clinic_members where user_id = auth.uid()
      )
    )
  );

-- =====================================================================
-- 10. AUDIT LOG (trilha imutável)
-- =====================================================================
create table if not exists public.audit_log (
  id bigserial primary key,
  user_id uuid references auth.users(id),
  action text not null,
  resource_type text not null,
  resource_id uuid,
  metadata jsonb default '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz default now()
);

create index if not exists idx_audit_user on public.audit_log(user_id);
create index if not exists idx_audit_resource on public.audit_log(resource_type, resource_id);
create index if not exists idx_audit_when on public.audit_log(created_at desc);

-- Apenas admin lê audit; ninguém escreve direto (Functions com service_role)
alter table public.audit_log enable row level security;
create policy "audit_select_admin" on public.audit_log
  for select using (
    auth.uid() in (
      select cm.user_id from public.clinic_members cm
      where cm.role_in_clinic = 'admin'
    )
  );

-- =====================================================================
-- 11. CONSENTIMENTOS LGPD
-- =====================================================================
create table if not exists public.consents (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid references public.patients(id) on delete cascade,
  consent_type text not null check (consent_type in ('clinico','marketing','telemedicina','compartilhamento_terapia','imagem')),
  granted boolean not null,
  granted_by_name text not null,             -- responsável
  granted_by_relation text,                  -- mãe, pai, tutor
  policy_version text not null,
  granted_at timestamptz default now(),
  revoked_at timestamptz,
  ip_address inet
);

alter table public.consents enable row level security;
create policy "consents_clinic_member" on public.consents
  for all using (
    patient_id in (
      select id from public.patients where clinic_id in (
        select clinic_id from public.clinic_members where user_id = auth.uid()
      )
    )
  );

-- =====================================================================
-- 12. FUNÇÕES UTILITÁRIAS
-- =====================================================================

-- Função para registrar auditoria (chamada por trigger ou Function)
create or replace function public.fn_log_audit(
  p_action text,
  p_resource_type text,
  p_resource_id uuid,
  p_metadata jsonb default '{}'::jsonb
) returns void
language plpgsql
security definer
as $$
begin
  insert into public.audit_log (user_id, action, resource_type, resource_id, metadata)
  values (auth.uid(), p_action, p_resource_type, p_resource_id, p_metadata);
end;
$$;

-- Trigger para auto-log de mudanças em pacientes
create or replace function public.tg_audit_patients() returns trigger
language plpgsql
as $$
begin
  if TG_OP = 'INSERT' then
    perform public.fn_log_audit('patient.create', 'patient', new.id, to_jsonb(new));
  elsif TG_OP = 'UPDATE' then
    perform public.fn_log_audit('patient.update', 'patient', new.id, jsonb_build_object('before', to_jsonb(old), 'after', to_jsonb(new)));
  elsif TG_OP = 'DELETE' then
    perform public.fn_log_audit('patient.delete', 'patient', old.id, to_jsonb(old));
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists tr_audit_patients on public.patients;
create trigger tr_audit_patients
  after insert or update or delete on public.patients
  for each row execute function public.tg_audit_patients();

-- =====================================================================
-- 13. STORAGE — buckets
-- =====================================================================
-- Executar manualmente no painel Supabase Storage:
-- - 'documents' (privado, autenticado)
-- - 'signed-pdfs' (privado, com URLs assinadas para acesso público temporário)

-- =====================================================================
-- 14. SEEDS — apenas para staging/dev (NÃO rodar em produção)
-- =====================================================================
-- insert into public.clinics (id, name, owner_user_id) values
--   ('00000000-0000-0000-0000-000000000001', 'Clínica NeuroPed Demo', null);

-- =====================================================================
-- FIM DO SCHEMA
-- =====================================================================
