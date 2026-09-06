-- NutriTrack · Hyrox race results
-- Lets a user record their finish time and race format (individual/doubles)
-- on a hyrox_races row once the race is done. Both nullable — set only after
-- racing, via the /hyrox web UI (see app/(main)/hyrox/actions.ts).

alter table public.hyrox_races
  add column finish_time_seconds int,
  add column format text check (format in ('individual', 'doubles'));
