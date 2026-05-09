-- NutriTrack · Fasting sessions
-- Tracks manual start/stop fasting sessions. One active (ended_at IS NULL)
-- session per user is enforced via a partial unique index. The configured
-- protocol on users.fasting_protocol is captured into target_end_at at start
-- time so subsequent protocol changes don't rewrite history.

create table public.fasting_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  started_at timestamptz not null default now(),
  target_end_at timestamptz not null,
  ended_at timestamptz,
  protocol text,
  notes text,
  created_at timestamptz not null default now(),
  check (ended_at is null or ended_at >= started_at),
  check (target_end_at > started_at)
);

create index idx_fasting_sessions_user_started
  on public.fasting_sessions(user_id, started_at desc);

create unique index idx_fasting_sessions_one_active_per_user
  on public.fasting_sessions(user_id)
  where ended_at is null;

alter table public.fasting_sessions enable row level security;

create policy "Users can view own fasting sessions"
  on public.fasting_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert own fasting sessions"
  on public.fasting_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own fasting sessions"
  on public.fasting_sessions for update
  using (auth.uid() = user_id);

create policy "Users can delete own fasting sessions"
  on public.fasting_sessions for delete
  using (auth.uid() = user_id);
