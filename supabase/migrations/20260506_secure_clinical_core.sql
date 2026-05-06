-- NeuroPed EDJ secure clinical core
-- Apply in Supabase SQL editor before enabling production mode.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('doctor', 'staff', 'family')),
  display_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete restrict,
  initials text not null,
  birth_year integer check (birth_year between 1900 and extract(year from now())::integer + 1),
  encrypted_payload bytea,
  payload_digest text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clinical_documents (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete restrict,
  document_type text not null check (document_type in ('report', 'prescription', 'school_letter', 'exam_request', 'other')),
  title text not null,
  encrypted_payload bytea,
  payload_digest text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.family_access_grants (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  family_user_id uuid not null references auth.users(id) on delete cascade,
  granted_by uuid not null references auth.users(id) on delete restrict,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique(patient_id, family_user_id)
);

create table if not exists public.audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  event_name text not null,
  target_table text not null,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
security definer
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists patients_touch_updated_at on public.patients;
create trigger patients_touch_updated_at
before update on public.patients
for each row execute function public.touch_updated_at();

drop trigger if exists clinical_documents_touch_updated_at on public.clinical_documents;
create trigger clinical_documents_touch_updated_at
before update on public.clinical_documents
for each row execute function public.touch_updated_at();

create or replace function public.current_profile_role()
returns text
language sql
stable
security definer
as $$
  select role from public.profiles where id = auth.uid();
$$;

alter table public.profiles enable row level security;
alter table public.patients enable row level security;
alter table public.clinical_documents enable row level security;
alter table public.family_access_grants enable row level security;
alter table public.audit_events enable row level security;

create policy "profiles_read_own" on public.profiles
for select using (id = auth.uid());

create policy "profiles_insert_own" on public.profiles
for insert with check (id = auth.uid());

create policy "patients_owner_all" on public.patients
for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "patients_family_read_granted" on public.patients
for select using (
  exists (
    select 1 from public.family_access_grants grant_row
    where grant_row.patient_id = patients.id
      and grant_row.family_user_id = auth.uid()
      and grant_row.expires_at > now()
  )
);

create policy "documents_owner_all" on public.clinical_documents
for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "documents_family_read_granted" on public.clinical_documents
for select using (
  exists (
    select 1 from public.family_access_grants grant_row
    where grant_row.patient_id = clinical_documents.patient_id
      and grant_row.family_user_id = auth.uid()
      and grant_row.expires_at > now()
  )
);

create policy "family_grants_owner_manage" on public.family_access_grants
for all using (granted_by = auth.uid()) with check (granted_by = auth.uid());

create policy "family_grants_family_read_own" on public.family_access_grants
for select using (family_user_id = auth.uid());

create policy "audit_insert_authenticated" on public.audit_events
for insert with check (actor_id = auth.uid());

create policy "audit_read_doctor_only" on public.audit_events
for select using (public.current_profile_role() = 'doctor');

create index if not exists patients_owner_idx on public.patients(owner_id);
create index if not exists documents_patient_idx on public.clinical_documents(patient_id);
create index if not exists documents_owner_idx on public.clinical_documents(owner_id);
create index if not exists grants_family_idx on public.family_access_grants(family_user_id);
create index if not exists audit_actor_idx on public.audit_events(actor_id, created_at desc);
