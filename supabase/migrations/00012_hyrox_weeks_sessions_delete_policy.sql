-- NutriTrack · Hyrox weeks/sessions delete policy
-- hyrox_weeks/hyrox_sessions previously had select-only RLS policies —
-- writes went through the admin client in the AI tool (generate_hyrox_plan).
-- The user-facing "clear plan" action (app/(main)/hyrox/actions.ts) deletes
-- via the RLS-bound client instead, so it needs an explicit delete policy
-- scoped through the owning race.

create policy "Users can delete own hyrox weeks"
  on public.hyrox_weeks for delete
  using (
    exists (
      select 1 from public.hyrox_races r
      where r.id = hyrox_weeks.race_id and r.user_id = auth.uid()
    )
  );

create policy "Users can delete own hyrox sessions"
  on public.hyrox_sessions for delete
  using (
    exists (
      select 1 from public.hyrox_weeks w
      join public.hyrox_races r on r.id = w.race_id
      where w.id = hyrox_sessions.week_id and r.user_id = auth.uid()
    )
  );
