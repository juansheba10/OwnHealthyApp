-- NutriTrack · Initial schema
-- 8 tables with RLS policies

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ============================================
-- ENUMS
-- ============================================

create type day_type as enum ('training', 'rest', 'double', 'football_only');
create type workout_type as enum ('crossfit', 'hyrox', 'football', 'running', 'other');
create type adherence_type as enum ('followed', 'modified', 'skipped', 'extra');
create type shopping_status as enum ('active', 'completed', 'archived');
create type chat_role as enum ('user', 'assistant', 'tool');

-- ============================================
-- TABLES
-- ============================================

-- 1. Users (extends Supabase auth.users)
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  name text not null,
  profile jsonb not null default '{}',
  calorie_targets jsonb not null default '{"training": 2500, "rest": 2000, "double": 3000, "football_only": 2500}',
  protein_target int not null default 150,
  restrictions text[] not null default '{}',
  fasting_protocol text,
  created_at timestamptz not null default now()
);

-- 2. Recipes
create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  tags text[] not null default '{}',
  ingredients jsonb not null default '[]',
  steps text,
  macros jsonb not null default '{"kcal": 0, "protein": 0, "carbs": 0, "fat": 0}',
  servings int not null default 1,
  prep_time_min int,
  pairing_notes text,
  created_at timestamptz not null default now()
);

-- 3. Meal plans
create table public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  date date not null,
  day_type day_type not null default 'training',
  meals jsonb not null default '[]',
  total_kcal int not null default 0,
  total_protein int not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  unique(user_id, date)
);

-- 4. Shopping lists
create table public.shopping_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  items jsonb not null default '[]',
  status shopping_status not null default 'active',
  generated_from uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

-- 5. Weight logs
create table public.weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  date date not null,
  weight_kg numeric(5,2) not null,
  notes text,
  created_at timestamptz not null default now(),
  unique(user_id, date)
);

-- 6. Workout logs
create table public.workout_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  date timestamptz not null,
  type workout_type not null,
  duration_min int not null,
  intensity int not null check (intensity between 1 and 10),
  fatigue int not null check (fatigue between 1 and 10),
  notes text,
  created_at timestamptz not null default now()
);

-- 7. Meal logs
create table public.meal_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  date date not null,
  meal_time time not null,
  planned_meal_id uuid references public.meal_plans(id) on delete set null,
  actual_meal jsonb not null default '{}',
  adherence adherence_type not null default 'followed',
  notes text,
  created_at timestamptz not null default now()
);

-- 8. Chat messages
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  role chat_role not null,
  content jsonb not null,
  tool_calls jsonb,
  created_at timestamptz not null default now()
);

-- 9. Change log (for AI audit trail)
create table public.change_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  action text not null,
  details jsonb not null default '{}',
  reverted boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================
-- INDEXES
-- ============================================

create index idx_meal_plans_user_date on public.meal_plans(user_id, date);
create index idx_weight_logs_user_date on public.weight_logs(user_id, date);
create index idx_workout_logs_user_date on public.workout_logs(user_id, date);
create index idx_meal_logs_user_date on public.meal_logs(user_id, date);
create index idx_chat_messages_user on public.chat_messages(user_id, created_at);
create index idx_shopping_lists_user on public.shopping_lists(user_id, status);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.recipes enable row level security;
alter table public.meal_plans enable row level security;
alter table public.shopping_lists enable row level security;
alter table public.weight_logs enable row level security;
alter table public.workout_logs enable row level security;
alter table public.meal_logs enable row level security;
alter table public.chat_messages enable row level security;
alter table public.change_log enable row level security;

-- Users: can only read/update own profile
create policy "Users can view own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

-- Recipes: all authenticated users can read, only owner can create
-- (shared catalog for both users)
create policy "Authenticated users can view recipes"
  on public.recipes for select
  to authenticated
  using (true);

create policy "Authenticated users can insert recipes"
  on public.recipes for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update recipes"
  on public.recipes for update
  to authenticated
  using (true);

-- Meal plans: own data only
create policy "Users can view own meal plans"
  on public.meal_plans for select
  using (auth.uid() = user_id);

create policy "Users can insert own meal plans"
  on public.meal_plans for insert
  with check (auth.uid() = user_id);

create policy "Users can update own meal plans"
  on public.meal_plans for update
  using (auth.uid() = user_id);

create policy "Users can delete own meal plans"
  on public.meal_plans for delete
  using (auth.uid() = user_id);

-- Shopping lists: own data only (or shared if user_id is null)
create policy "Users can view own shopping lists"
  on public.shopping_lists for select
  using (auth.uid() = user_id or user_id is null);

create policy "Users can insert shopping lists"
  on public.shopping_lists for insert
  with check (auth.uid() = user_id or user_id is null);

create policy "Users can update own shopping lists"
  on public.shopping_lists for update
  using (auth.uid() = user_id or user_id is null);

-- Weight logs: own data only
create policy "Users can view own weight logs"
  on public.weight_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert own weight logs"
  on public.weight_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can update own weight logs"
  on public.weight_logs for update
  using (auth.uid() = user_id);

create policy "Users can delete own weight logs"
  on public.weight_logs for delete
  using (auth.uid() = user_id);

-- Workout logs: own data only
create policy "Users can view own workout logs"
  on public.workout_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert own workout logs"
  on public.workout_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can update own workout logs"
  on public.workout_logs for update
  using (auth.uid() = user_id);

create policy "Users can delete own workout logs"
  on public.workout_logs for delete
  using (auth.uid() = user_id);

-- Meal logs: own data only
create policy "Users can view own meal logs"
  on public.meal_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert own meal logs"
  on public.meal_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can update own meal logs"
  on public.meal_logs for update
  using (auth.uid() = user_id);

-- Chat messages: own data only
create policy "Users can view own chat messages"
  on public.chat_messages for select
  using (auth.uid() = user_id);

create policy "Users can insert own chat messages"
  on public.chat_messages for insert
  with check (auth.uid() = user_id);

-- Change log: own data only
create policy "Users can view own change log"
  on public.change_log for select
  using (auth.uid() = user_id);

create policy "Users can insert own change log"
  on public.change_log for insert
  with check (auth.uid() = user_id);
