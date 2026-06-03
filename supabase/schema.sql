-- NeuroPed EDJ — Supabase schema inicial
-- Execute no SQL Editor do Supabase.
-- Não inclui dados reais de pacientes.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key,
  email text,
  name text,
  role text not null check (role in ('master','secretaria','familia','escola','terapeuta')),
  created_at timestamptz default now()
);

create table if not exists public.children (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  birth_date date,
  last_name_key text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

create table if not exists public.family_passes (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique,
  child_id uuid references public.children(id) on delete cascade,
  issued_by uuid references public.profiles(id),
  issued_to_label text,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.family_child_access (
  id uuid primary key default gen_random_uuid(),
  child_id uuid references public.children(id) on delete cascade,
  family_user_id uuid references public.profiles(id),
  pass_id uuid references public.family_passes(id),
  active boolean default true,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

create table if not exists public.consultations (
  id uuid primary key default gen_random_uuid(),
  child_id uuid references public.children(id) on delete set null,
  doctor_id uuid references public.profiles(id),
  consultation_date date default current_date,
  type text,
  priority text,
  complaint text,
  context text,
  alerts text,
  instruments text,
  plan text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  child_id uuid references public.children(id) on delete set null,
  consultation_id uuid references public.consultations(id) on delete set null,
  type text not null check (type in ('prescricao','laudo','relatorio','declaracao','outro')),
  title text,
  content text,
  status text default 'draft' check (status in ('draft','ready_to_sign','signed','archived')),
  hash_sha256 text,
  pdf_url text,
  signed_pdf_url text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.document_signatures (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references public.documents(id) on delete cascade,
  provider text,
  certificate_subject text,
  signature_status text,
  hash_before text,
  hash_after text,
  signed_at timestamptz,
  verification_url text,
  raw_metadata jsonb,
  created_at timestamptz default now()
);

create table if not exists public.caa_boards (
  id uuid primary key default gen_random_uuid(),
  child_id uuid references public.children(id) on delete cascade,
  board_json jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

create table if not exists public.diary_entries (
  id uuid primary key default gen_random_uuid(),
  child_id uuid references public.children(id) on delete cascade,
  entry_type text,
  entry_date date default current_date,
  content_json jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

create table if not exists public.scale_responses (
  id uuid primary key default gen_random_uuid(),
  child_id uuid references public.children(id) on delete cascade,
  instrument_id text,
  respondent_type text,
  response_json jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  action text not null,
  entity_type text,
  entity_id text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
