-- NutriTrack · Push notifications
-- Stores Web Push subscriptions and a dedup log so the reminder cron
-- (app/api/cron/reminders/route.ts, triggered by pg_cron — see
-- supabase/CRON_SETUP.md) only sends each reminder once.

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index idx_push_subscriptions_user on public.push_subscriptions(user_id);

alter table public.push_subscriptions enable row level security;

create policy "Users can view own push subscriptions"
  on public.push_subscriptions for select
  using (auth.uid() = user_id);

create policy "Users can insert own push subscriptions"
  on public.push_subscriptions for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own push subscriptions"
  on public.push_subscriptions for delete
  using (auth.uid() = user_id);

-- Dedup log for the reminder cron. Never read/written by user-facing code —
-- RLS is enabled with zero policies, i.e. locked to the service role.
create table public.reminder_log (
  user_id uuid not null references public.users(id) on delete cascade,
  kind text not null check (kind in ('fasting_end', 'hyrox_session', 'meal_time')),
  ref_id text not null,
  sent_at timestamptz not null default now(),
  primary key (user_id, kind, ref_id)
);

alter table public.reminder_log enable row level security;

alter table public.fasting_sessions add column end_notified_at timestamptz;
