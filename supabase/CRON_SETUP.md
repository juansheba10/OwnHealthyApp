# Reminder cron setup

`app/api/cron/reminders/route.ts` checks for due reminders (fasting end,
today's Hyrox session, meal times) and needs to be called on a schedule even
when nobody has the app open. This is done via Supabase's `pg_cron` +
`pg_net` extensions calling the route over HTTP every 5 minutes.

This is a **one-time setup step you run yourself** in the Supabase SQL
editor for your project — it's not part of the versioned migrations because
it embeds your real deployed URL and the `CRON_SECRET` value from your env
vars, neither of which belong in a committed file.

1. Deploy the app first (so you have a real URL), and make sure `CRON_SECRET`
   is set in your deployment's environment variables (same value you'll use
   below).
2. In the Supabase SQL editor, run:

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;

create table if not exists app_config (key text primary key, value text not null);

insert into app_config (key, value) values
  ('cron_target_url', 'https://YOUR-DOMAIN/api/cron/reminders'),
  ('cron_secret', 'YOUR_CRON_SECRET_VALUE')
on conflict (key) do update set value = excluded.value;

select cron.schedule(
  'send-reminders',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := (select value from app_config where key = 'cron_target_url'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select value from app_config where key = 'cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);
```

3. Verify it's scheduled: `select * from cron.job;`
4. To check recent runs: `select * from cron.job_run_details order by start_time desc limit 10;`
5. To stop it: `select cron.unschedule('send-reminders');`

If you ever rotate `CRON_SECRET`, re-run the `insert ... on conflict` block
with the new value (and update it in your deployment's env vars too).
