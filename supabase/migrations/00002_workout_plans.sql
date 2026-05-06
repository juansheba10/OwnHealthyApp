-- NutriTrack · Forward-looking training schedule
-- Distinct from workout_logs (which records actuals).
-- Multiple sessions per day allowed (e.g. "double" = 2 rows).

create table public.workout_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  date date not null,
  type workout_type not null,
  intended_intensity int check (intended_intensity between 1 and 10),
  notes text,
  created_at timestamptz not null default now()
);

create index idx_workout_plans_user_date on public.workout_plans(user_id, date);

alter table public.workout_plans enable row level security;

create policy "Users can view own workout plans"
  on public.workout_plans for select
  using (auth.uid() = user_id);

create policy "Users can insert own workout plans"
  on public.workout_plans for insert
  with check (auth.uid() = user_id);

create policy "Users can update own workout plans"
  on public.workout_plans for update
  using (auth.uid() = user_id);

create policy "Users can delete own workout plans"
  on public.workout_plans for delete
  using (auth.uid() = user_id);
