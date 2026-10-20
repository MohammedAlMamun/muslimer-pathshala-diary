-- Run only after enabling the Supabase Cron integration/pg_cron extension.
-- Deletes diary rows older than 90 days every night at 03:17 UTC.
select cron.schedule(
  'muslimer-pathshala-90-day-retention',
  '17 3 * * *',
  $$select public.purge_old_diary_entries();$$
);

-- Verify:
select jobid,jobname,schedule,command,active
from cron.job
where jobname='muslimer-pathshala-90-day-retention';
