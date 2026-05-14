-- NeuroPed EDJ - Supabase schema (Postgres + RLS)
--
-- ATENCAO: este schema e a estrategia coexistir-lado-a-lado escolhida no PR.
-- O backend D1 + Pages Functions continua canonico. Supabase entra como portal
-- multi-medico futuro, sem PII real enquanto a auth (magic link / email+senha)
-- nao for habilitada.
--
-- Politica RLS atual:
--   * INSERT em submissions: permitido para anon (qualquer um com a anon key
--     publica pode gravar uma submission, e isso e o objetivo - coleta).
--   * SELECT/UPDATE/DELETE: bloqueado para anon. Apenas service_role (chave
--     que NAO vai pro browser) consulta. Quando a fase 2 da auth for ativada,
--     trocar a policy para auth.uid() owner-based.
--
-- Como aplicar:
--   1. Crie um projeto Supabase (free tier serve).
--   2. SQL Editor > New Query > cole este arquivo > Run.
--   3. Em Project Settings > API: copie 'Project URL' (vai em supabaseUrl)
--      e 'anon public' (vai em supabasePublicAnon) para cloud-config.js.
--   4. Em cloud-config.js, troque 'enabled: false' para 'enabled: true'.
--   5. Adicione cloud-config.js ao .gitignore se contiver chaves reais
--      (a anon e publica, mas mantem o arquivo sem versionar evita confusao).

-- ============================================================
-- 1) Tabelas
-- ============================================================

create table if not exists public.submissions (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  case_code       text,
  patient_code    text,
  instrument_id   text not null,
  instrument_title text,
  instrument_group text,
  answers_json    jsonb not null,
  raw_score       integer,
  total_items     integer,
  source_page     text,
  notes           text
);

create index if not exists idx_submissions_case_code     on public.submissions (case_code);
create index if not exists idx_submissions_instrument_id on public.submissions (instrument_id);
create index if not exists idx_submissions_created_at    on public.submissions (created_at desc);

create table if not exists public.audit_logs (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  action          text not null,
  entity          text,
  entity_id       text,
  metadata_json   jsonb
);

create index if not exists idx_audit_logs_created_at on public.audit_logs (created_at desc);

-- ============================================================
-- 2) RLS - row level security
-- ============================================================

alter table public.submissions enable row level security;
alter table public.audit_logs  enable row level security;

-- INSERT por anon: permitido (write-only collection).
drop policy if exists "anon can insert submissions" on public.submissions;
create policy "anon can insert submissions"
  on public.submissions
  for insert
  to anon
  with check (true);

-- SELECT por anon: bloqueado (qualquer leitura precisa service_role).
-- Quando ativar auth, trocar para auth.uid() owner-based.
drop policy if exists "anon cannot select submissions" on public.submissions;
create policy "anon cannot select submissions"
  on public.submissions
  for select
  to anon
  using (false);

-- UPDATE/DELETE por anon: bloqueado.
drop policy if exists "anon cannot update submissions" on public.submissions;
create policy "anon cannot update submissions"
  on public.submissions
  for update
  to anon
  using (false)
  with check (false);

drop policy if exists "anon cannot delete submissions" on public.submissions;
create policy "anon cannot delete submissions"
  on public.submissions
  for delete
  to anon
  using (false);

-- audit_logs: insert por anon ok, leitura bloqueada.
drop policy if exists "anon can insert audit_logs" on public.audit_logs;
create policy "anon can insert audit_logs"
  on public.audit_logs
  for insert
  to anon
  with check (true);

drop policy if exists "anon cannot read audit_logs" on public.audit_logs;
create policy "anon cannot read audit_logs"
  on public.audit_logs
  for select
  to anon
  using (false);

-- ============================================================
-- 3) Trigger updated_at
-- ============================================================

create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_submissions_updated_at on public.submissions;
create trigger trg_submissions_updated_at
  before update on public.submissions
  for each row execute function public.tg_set_updated_at();

-- ============================================================
-- 4) View enxuta (sem answers_json) - para uso futuro com auth
-- ============================================================

create or replace view public.submissions_summary as
  select
    id, created_at, case_code, patient_code,
    instrument_id, instrument_title, instrument_group,
    raw_score, total_items, source_page
  from public.submissions
  order by created_at desc;

-- ============================================================
-- 5) Comentarios para documentacao
-- ============================================================

comment on table public.submissions is
  'NeuroPed EDJ - resultados de instrumentos clinicos. Coexiste com tabela equivalente em D1.';
comment on column public.submissions.case_code is
  'Codigo local do caso. Sem CPF, sem nome real. Identificador opaco controlado pelo medico.';
comment on column public.submissions.patient_code is
  'Iniciais ou nome curto. Idem: nao e dado pessoal sensivel obrigatorio.';
comment on column public.submissions.answers_json is
  'JSON estruturado: { answers: {key:val}, domains:[{name,score,max,pct}], total:{score,max} }';
