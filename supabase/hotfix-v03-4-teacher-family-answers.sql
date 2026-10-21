-- v0.3 hotfix: let assigned teachers monitor guardian support answers.
-- The view deliberately excludes family_entries.note. Private comments remain
-- private unless the parent explicitly writes to shared_family_notes.

begin;

drop view if exists public.teacher_family_entries;
create view public.teacher_family_entries as
select
  fe.family_id,
  fe.entry_date,
  fe.answers,
  fe.updated_at
from public.family_entries fe
where public.is_teacher_for_family(fe.family_id);

revoke all on public.teacher_family_entries from anon;
grant select on public.teacher_family_entries to authenticated;

commit;
