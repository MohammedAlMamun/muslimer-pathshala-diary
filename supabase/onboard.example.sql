-- FIRST invite the teacher and each parent in Supabase Dashboard > Authentication > Users.
-- THEN copy this file, replace every example email/alias, and run it in SQL Editor.
-- Never commit the filled-in copy: it contains participant identities.

begin;

-- 1) One teacher account.
insert into public.profiles (id,display_name,role)
select id,'পাইলট শিক্ষক','teacher' from auth.users where lower(email)=lower('teacher@example.com')
on conflict (id) do update set display_name=excluded.display_name,role='teacher',active=true;

-- 2) One parent and family. Repeat this block for each family.
insert into public.profiles (id,display_name,role)
select id,'অভিভাবক ১','parent' from auth.users where lower(email)=lower('parent1@example.com')
on conflict (id) do update set display_name=excluded.display_name,role='parent',active=true;

insert into public.families (id,alias)
values ('11111111-1111-4111-8111-111111111111','পরিবার ১')
on conflict (id) do update set alias=excluded.alias;

insert into public.family_members (family_id,user_id)
select '11111111-1111-4111-8111-111111111111',id from auth.users where lower(email)=lower('parent1@example.com')
on conflict do nothing;

-- 3) Add learner aliases only. Valid levels: tamhidi, ibtidai, pathshala.
-- The database rejects a sixth active learner in any level.
insert into public.learners (id,family_id,alias,level)
values ('21111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111','শিশুর ডাকনাম','tamhidi')
on conflict (id) do update set alias=excluded.alias,level=excluded.level,active=true;

-- 4) Assign the learner to the teacher so the teacher can read answers.
insert into public.teacher_assignments (teacher_id,learner_id)
select u.id,'21111111-1111-4111-8111-111111111111'
from auth.users u where lower(u.email)=lower('teacher@example.com')
on conflict do nothing;

commit;

-- Capacity check. No level should exceed 5.
select level,count(*) as active_learners
from public.learners where active group by level order by level;
