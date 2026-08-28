-- NutriTrack · Hyrox races
-- Moves the previously-hardcoded (lib/hyrox/plan.ts) training plan into
-- per-user, per-race tables so a second user or a next race doesn't require
-- a new static TS file + deploy. No authoring UI yet — races/weeks/sessions
-- are seeded via SQL (see supabase/seed.sql).

create table public.hyrox_races (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  venue text,
  race_date date not null,
  plan_start date not null,
  created_at timestamptz not null default now()
);

create table public.hyrox_weeks (
  id uuid primary key default gen_random_uuid(),
  race_id uuid not null references public.hyrox_races(id) on delete cascade,
  week_num int not null,
  phase text not null check (phase in ('1', '2', '3', 'taper')),
  start_date date not null,
  date_label text not null,
  load int not null,
  focus text not null,
  descarga boolean not null default false,
  sim boolean not null default false,
  race_day boolean not null default false,
  unique (race_id, week_num)
);

create table public.hyrox_sessions (
  id uuid primary key default gen_random_uuid(),
  week_id uuid not null references public.hyrox_weeks(id) on delete cascade,
  day_code text not null check (day_code in ('Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb')),
  session_type text not null check (session_type in ('run', 'hybrid', 'strength', 'sim', 'rest')),
  description text not null,
  unique (week_id, day_code)
);

create index idx_hyrox_races_user on public.hyrox_races(user_id);
create index idx_hyrox_weeks_race on public.hyrox_weeks(race_id);
create index idx_hyrox_sessions_week on public.hyrox_sessions(week_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

alter table public.hyrox_races enable row level security;
alter table public.hyrox_weeks enable row level security;
alter table public.hyrox_sessions enable row level security;

create policy "Users can view own hyrox races"
  on public.hyrox_races for select
  using (auth.uid() = user_id);

create policy "Users can insert own hyrox races"
  on public.hyrox_races for insert
  with check (auth.uid() = user_id);

create policy "Users can update own hyrox races"
  on public.hyrox_races for update
  using (auth.uid() = user_id);

create policy "Users can delete own hyrox races"
  on public.hyrox_races for delete
  using (auth.uid() = user_id);

-- Weeks/sessions are never user-edited directly (only read) — scope select
-- through the owning race's user_id.
create policy "Users can view own hyrox weeks"
  on public.hyrox_weeks for select
  using (
    exists (
      select 1 from public.hyrox_races r
      where r.id = hyrox_weeks.race_id and r.user_id = auth.uid()
    )
  );

create policy "Users can view own hyrox sessions"
  on public.hyrox_sessions for select
  using (
    exists (
      select 1 from public.hyrox_weeks w
      join public.hyrox_races r on r.id = w.race_id
      where w.id = hyrox_sessions.week_id and r.user_id = auth.uid()
    )
  );
