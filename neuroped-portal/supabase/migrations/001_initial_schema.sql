-- NeuroPed EDJ Portal - schema inicial para ambiente demo/produção.
-- Execute no SQL Editor do Supabase. Nao usar dados reais antes de revisão final.

create type public.app_role as enum ('admin','medico','secretaria','familia');
create type public.document_status as enum ('draft','pending_signature','signed_externally','archived');

create table public.profiles (
  id uuid primary key references auth.users(id),
  full_name text not null,
  role public.app_role not null default 'familia',
  created_at timestamptz not null default now()
);

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  display_name text not null,
  birth_date date,
  guardian_user_id uuid references public.profiles(id),
  clinical_summary text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id),
  title text not null,
  document_type text not null,
  status public.document_status not null default 'draft',
  storage_path text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id),
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigserial primary key,
  actor_id uuid references public.profiles(id),
  action text not null,
  table_name text not null,
  record_id text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.patients enable row level security;
alter table public.documents enable row level security;
alter table public.appointments enable row level security;
alter table public.audit_logs enable row level security;

create or replace function public.current_user_role()
returns public.app_role
language sql
security definer
set search_path = public
as $$ select role from public.profiles where id = auth.uid() $$;

create policy profiles_read on public.profiles for select using (id = auth.uid() or public.current_user_role() in ('admin','medico'));
create policy profiles_update_self on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy patients_read on public.patients for select using (public.current_user_role() in ('admin','medico','secretaria') or guardian_user_id = auth.uid());
create policy patients_write on public.patients for all using (public.current_user_role() in ('admin','medico')) with check (public.current_user_role() in ('admin','medico'));

create policy documents_read on public.documents for select using (public.current_user_role() in ('admin','medico','secretaria') or exists (select 1 from public.patients p where p.id = documents.patient_id and p.guardian_user_id = auth.uid()));
create policy documents_write on public.documents for all using (public.current_user_role() in ('admin','medico')) with check (public.current_user_role() in ('admin','medico'));

create policy appointments_read on public.appointments for select using (public.current_user_role() in ('admin','medico','secretaria') or exists (select 1 from public.patients p where p.id = appointments.patient_id and p.guardian_user_id = auth.uid()));
create policy appointments_write on public.appointments for all using (public.current_user_role() in ('admin','medico','secretaria')) with check (public.current_user_role() in ('admin','medico','secretaria'));

create policy audit_read on public.audit_logs for select using (public.current_user_role() in ('admin','medico'));
create policy audit_insert on public.audit_logs for insert with check (auth.uid() is not null);

insert into storage.buckets (id, name, public) values ('private-documents','private-documents',false) on conflict (id) do update set public = false;
create policy private_docs_read on storage.objects for select using (bucket_id = 'private-documents' and public.current_user_role() in ('admin','medico','secretaria'));
create policy private_docs_write on storage.objects for insert with check (bucket_id = 'private-documents' and public.current_user_role() in ('admin','medico'));
