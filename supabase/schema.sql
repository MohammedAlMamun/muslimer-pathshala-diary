-- Muslimer Pathshala closed pilot v0.3
-- Run once in a new Supabase project's SQL Editor as the project owner.
-- Three levels, maximum five active learners per level (15 total).

begin;

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 80),
  role text not null check (role in ('parent','teacher')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  alias text not null check (char_length(alias) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.family_members (
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (family_id,user_id)
);

create table if not exists public.learners (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  alias text not null check (char_length(alias) between 1 and 60),
  level text not null check (level in ('tamhidi','ibtidai','pathshala')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.teacher_assignments (
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  learner_id uuid not null references public.learners(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (teacher_id,learner_id)
);

create table if not exists public.consents (
  family_id uuid primary key references public.families(id) on delete cascade,
  guardian_user_id uuid not null references public.profiles(id) on delete cascade,
  version text not null check (char_length(version) between 1 and 40),
  accepted_at timestamptz not null default now()
);

create table if not exists public.learner_entries (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.learners(id) on delete cascade,
  entry_date date not null,
  answers jsonb not null default '{}'::jsonb,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (learner_id,entry_date)
);

create table if not exists public.family_entries (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  entry_date date not null,
  answers jsonb not null default '{}'::jsonb,
  note text not null default '' check (char_length(note) <= 1200),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (family_id,entry_date)
);

-- Deliberately separate from family_entries. Teachers can never select the
-- parent's private diary; only an explicitly shared note reaches this table.
create table if not exists public.shared_family_notes (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  entry_date date not null,
  note text not null check (char_length(note) between 1 and 1200),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (family_id,entry_date)
);

-- Teacher reflection is private. A separate table contains only the optional
-- message that the teacher explicitly publishes to assigned families.
create table if not exists public.teacher_entries (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  entry_date date not null,
  answers jsonb not null default '{}'::jsonb,
  private_note text not null default '' check (char_length(private_note) <= 1200),
  parent_message text not null default '' check (char_length(parent_message) <= 1200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (teacher_id,entry_date)
);

create table if not exists public.published_teacher_updates (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  entry_date date not null,
  message text not null check (char_length(message) between 1 and 1200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (teacher_id,entry_date)
);

create index if not exists family_members_user_idx on public.family_members(user_id);
create index if not exists learners_family_idx on public.learners(family_id) where active;
create index if not exists learners_level_idx on public.learners(level) where active;
create index if not exists teacher_assignments_teacher_idx on public.teacher_assignments(teacher_id);
create index if not exists learner_entries_date_idx on public.learner_entries(entry_date);
create index if not exists family_entries_date_idx on public.family_entries(entry_date);
create index if not exists shared_family_notes_date_idx on public.shared_family_notes(entry_date);
create index if not exists teacher_entries_date_idx on public.teacher_entries(entry_date);
create index if not exists published_teacher_updates_date_idx on public.published_teacher_updates(entry_date);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_active_user(target uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles p where p.id=target and p.active);
$$;

create or replace function public.is_parent_of_family(target_family uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_active_user(auth.uid()) and exists(
    select 1 from public.family_members fm
    join public.profiles p on p.id=fm.user_id
    where fm.family_id=target_family and fm.user_id=auth.uid() and p.role='parent'
  );
$$;

create or replace function public.is_teacher_for_learner(target_learner uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_active_user(auth.uid()) and exists(
    select 1 from public.teacher_assignments ta
    join public.profiles p on p.id=ta.teacher_id
    where ta.learner_id=target_learner and ta.teacher_id=auth.uid() and p.role='teacher'
  );
$$;

create or replace function public.is_teacher_for_family(target_family uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_active_user(auth.uid()) and exists(
    select 1 from public.teacher_assignments ta
    join public.learners l on l.id=ta.learner_id and l.active
    join public.profiles p on p.id=ta.teacher_id
    where l.family_id=target_family and ta.teacher_id=auth.uid() and p.role='teacher'
  );
$$;

create or replace function public.is_teacher_user(target uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles p where p.id=target and p.active and p.role='teacher');
$$;

create or replace function public.is_parent_of_teacher(target_teacher uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_active_user(auth.uid()) and public.is_teacher_user(target_teacher) and exists(
    select 1
    from public.family_members fm
    join public.learners l on l.family_id=fm.family_id and l.active
    join public.teacher_assignments ta on ta.learner_id=l.id
    where fm.user_id=auth.uid() and ta.teacher_id=target_teacher
  );
$$;

create or replace function public.enforce_level_capacity()
returns trigger language plpgsql set search_path = '' as $$
declare active_count integer;
begin
  if new.active then
    perform pg_advisory_xact_lock(hashtext('muslimer-pathshala-level-' || new.level));
    select count(*) into active_count
    from public.learners l
    where l.level=new.level and l.active and l.id<>new.id;
    if active_count >= 5 then
      raise exception 'Pilot capacity reached: level % already has five active learners', new.level
        using errcode='check_violation';
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.validate_entry_date(target date)
returns void language plpgsql set search_path = '' as $$
begin
  if target > current_date then
    raise exception 'Future diary dates are not allowed' using errcode='check_violation';
  end if;
  if target < current_date - 89 then
    raise exception 'Diary entries are limited to the last 90 days' using errcode='check_violation';
  end if;
end;
$$;

create or replace function public.validate_learner_entry()
returns trigger language plpgsql set search_path = '' as $$
declare learner_level text;
declare pair record;
declare valid boolean;
begin
  perform public.validate_entry_date(new.entry_date);
  if jsonb_typeof(new.answers) <> 'object' then
    raise exception 'answers must be a JSON object' using errcode='check_violation';
  end if;
  select level into learner_level from public.learners where id=new.learner_id and active;
  if learner_level is null then raise exception 'Active learner not found'; end if;
  for pair in select key,value from jsonb_each_text(new.answers)
  loop
    valid := case learner_level
      when 'tamhidi' then
        (pair.key in ('salat_participation','quran_practice','good_deed') and pair.value in ('yes','no','na')) or
        (pair.key='parent_listening' and pair.value in ('yes','not_always','na')) or
        -- Legacy `na` values remain accepted until older entries age out.
        (pair.key in ('bismillah','quran') and pair.value in ('yes','no')) or
        (pair.key='respect' and pair.value in ('yes','reminder'))
      when 'ibtidai' then
        (pair.key='fajr_timing' and pair.value in ('on','late','no','na')) or
        (pair.key='quran_practice' and pair.value in ('yes','no','na')) or
        (pair.key='quran_listening' and pair.value in ('yes','no')) or
        (pair.key='disobedience_count' and pair.value in ('0','1','2+','na')) or
        -- v0.2 responsibility/fajr/quran keys remain accepted until old entries age out.
        (pair.key='responsibility' and pair.value in ('yes','partial','no','na')) or
        (pair.key='fajr' and pair.value in ('yes','no','na')) or
        (pair.key in ('quran','help') and pair.value in ('yes','no')) or
        (pair.key='remind' and pair.value in ('0','1','2+'))
      when 'pathshala' then
        (pair.key='fajr_timing' and pair.value in ('on','late','no','na')) or
        (pair.key='lesson_revision' and pair.value in ('yes','no')) or
        (pair.key='other_salat_care' and pair.value in ('all','some_missed','na')) or
        (pair.key='quran_study' and pair.value in ('yes','no','na')) or
        (pair.key='behavior_correction' and pair.value in ('tried','remembered','not_noticed','na')) or
        (pair.key='fajr' and pair.value in ('on','late','no','na')) or
        (pair.key in ('quran','good') and pair.value in ('yes','no')) or
        (pair.key='remind' and pair.value in ('0','1','2+'))
      else false end;
    if not valid then raise exception 'Invalid answer %=% for level %',pair.key,pair.value,learner_level using errcode='check_violation'; end if;
  end loop;
  return new;
end;
$$;

create or replace function public.validate_family_entry()
returns trigger language plpgsql set search_path = '' as $$
declare pair record;
declare valid boolean;
begin
  perform public.validate_entry_date(new.entry_date);
  if jsonb_typeof(new.answers) <> 'object' then raise exception 'answers must be a JSON object' using errcode='check_violation'; end if;
  for pair in select key,value from jsonb_each_text(new.answers)
  loop
    valid :=
      (pair.key in ('practice_support','child_conversation','patience_behavior','salat_prompting') and pair.value in ('yes','no')) or
      -- v0.3 pre-release values remain accepted until old entries age out.
      (pair.key in ('practice_support','child_conversation') and pair.value in ('partial','na')) or
      (pair.key='patience_behavior' and pair.value in ('not_always','na')) or
      -- v0.2 keys remain accepted until their entries age out under retention.
      (pair.key in ('time','talk','praise') and pair.value in ('yes','no')) or
      (pair.key='anger' and pair.value in ('0','1','2+'));
    if not valid then raise exception 'Invalid family answer %=%',pair.key,pair.value using errcode='check_violation'; end if;
  end loop;
  new.note=trim(new.note);
  return new;
end;
$$;

create or replace function public.validate_shared_note()
returns trigger language plpgsql set search_path = '' as $$
begin
  perform public.validate_entry_date(new.entry_date);
  new.note=trim(new.note);
  if char_length(new.note) < 1 or char_length(new.note) > 1200 then raise exception 'Shared note must contain 1 to 1200 characters' using errcode='check_violation'; end if;
  return new;
end;
$$;

create or replace function public.validate_teacher_entry()
returns trigger language plpgsql set search_path = '' as $$
declare pair record;
declare valid boolean;
begin
  perform public.validate_entry_date(new.entry_date);
  if not public.is_teacher_user(new.teacher_id) then raise exception 'Active teacher not found'; end if;
  if jsonb_typeof(new.answers) <> 'object' then raise exception 'answers must be a JSON object' using errcode='check_violation'; end if;
  for pair in select key,value from jsonb_each_text(new.answers)
  loop
    valid :=
      (pair.key in ('salat_fajr','salat_dhuhr','salat_asr','salat_maghrib','salat_isha') and pair.value in ('on','late','no','na')) or
      (pair.key in ('jamaah_fajr','jamaah_dhuhr','jamaah_asr','jamaah_maghrib','jamaah_isha','quran') and pair.value in ('yes','no','na')) or
      (pair.key='lesson_prep' and pair.value in ('yes','partial','no','na'));
    if not valid then raise exception 'Invalid teacher answer %=%',pair.key,pair.value using errcode='check_violation'; end if;
  end loop;
  new.private_note=trim(new.private_note);
  new.parent_message=trim(new.parent_message);
  return new;
end;
$$;

create or replace function public.validate_published_teacher_update()
returns trigger language plpgsql set search_path = '' as $$
begin
  perform public.validate_entry_date(new.entry_date);
  if not public.is_teacher_user(new.teacher_id) then raise exception 'Active teacher not found'; end if;
  new.message=trim(new.message);
  if char_length(new.message) < 1 or char_length(new.message) > 1200 then raise exception 'Published message must contain 1 to 1200 characters' using errcode='check_violation'; end if;
  return new;
end;
$$;

drop trigger if exists learners_capacity on public.learners;
create trigger learners_capacity before insert or update of level,active on public.learners for each row execute function public.enforce_level_capacity();
drop trigger if exists learner_entry_validation on public.learner_entries;
create trigger learner_entry_validation before insert or update on public.learner_entries for each row execute function public.validate_learner_entry();
drop trigger if exists family_entry_validation on public.family_entries;
create trigger family_entry_validation before insert or update on public.family_entries for each row execute function public.validate_family_entry();
drop trigger if exists shared_note_validation on public.shared_family_notes;
create trigger shared_note_validation before insert or update on public.shared_family_notes for each row execute function public.validate_shared_note();
drop trigger if exists teacher_entry_validation on public.teacher_entries;
create trigger teacher_entry_validation before insert or update on public.teacher_entries for each row execute function public.validate_teacher_entry();
drop trigger if exists published_teacher_update_validation on public.published_teacher_updates;
create trigger published_teacher_update_validation before insert or update on public.published_teacher_updates for each row execute function public.validate_published_teacher_update();

do $$
declare table_name text;
begin
  foreach table_name in array array['profiles','families','learners','learner_entries','family_entries','shared_family_notes','teacher_entries','published_teacher_updates']
  loop
    execute format('drop trigger if exists %I on public.%I',table_name || '_updated_at',table_name);
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()',table_name || '_updated_at',table_name);
  end loop;
end $$;

alter table public.profiles enable row level security;
alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.learners enable row level security;
alter table public.teacher_assignments enable row level security;
alter table public.consents enable row level security;
alter table public.learner_entries enable row level security;
alter table public.family_entries enable row level security;
alter table public.shared_family_notes enable row level security;
alter table public.teacher_entries enable row level security;
alter table public.published_teacher_updates enable row level security;

drop policy if exists profiles_read_self on public.profiles;
create policy profiles_read_self on public.profiles for select to authenticated using (id=auth.uid() and active);

drop policy if exists families_read_authorized on public.families;
create policy families_read_authorized on public.families for select to authenticated using (public.is_parent_of_family(id) or public.is_teacher_for_family(id));

drop policy if exists family_members_read_self on public.family_members;
create policy family_members_read_self on public.family_members for select to authenticated using (user_id=auth.uid() and public.is_active_user(auth.uid()));

drop policy if exists learners_read_authorized on public.learners;
create policy learners_read_authorized on public.learners for select to authenticated using (active and (public.is_parent_of_family(family_id) or public.is_teacher_for_learner(id)));

drop policy if exists assignments_read_self on public.teacher_assignments;
create policy assignments_read_self on public.teacher_assignments for select to authenticated using (teacher_id=auth.uid() and public.is_active_user(auth.uid()));

drop policy if exists consents_read_own on public.consents;
create policy consents_read_own on public.consents for select to authenticated using (public.is_parent_of_family(family_id));
drop policy if exists consents_insert_own on public.consents;
create policy consents_insert_own on public.consents for insert to authenticated with check (guardian_user_id=auth.uid() and public.is_parent_of_family(family_id));
drop policy if exists consents_update_own on public.consents;
create policy consents_update_own on public.consents for update to authenticated using (guardian_user_id=auth.uid() and public.is_parent_of_family(family_id)) with check (guardian_user_id=auth.uid() and public.is_parent_of_family(family_id));

drop policy if exists learner_entries_read_authorized on public.learner_entries;
create policy learner_entries_read_authorized on public.learner_entries for select to authenticated using (
  public.is_teacher_for_learner(learner_id) or exists(select 1 from public.learners l where l.id=learner_id and public.is_parent_of_family(l.family_id))
);
drop policy if exists learner_entries_insert_parent on public.learner_entries;
create policy learner_entries_insert_parent on public.learner_entries for insert to authenticated with check (
  created_by=auth.uid() and exists(select 1 from public.learners l where l.id=learner_id and l.active and public.is_parent_of_family(l.family_id))
);
drop policy if exists learner_entries_update_parent on public.learner_entries;
create policy learner_entries_update_parent on public.learner_entries for update to authenticated using (
  created_by=auth.uid() and exists(select 1 from public.learners l where l.id=learner_id and public.is_parent_of_family(l.family_id))
) with check (
  created_by=auth.uid() and exists(select 1 from public.learners l where l.id=learner_id and l.active and public.is_parent_of_family(l.family_id))
);
drop policy if exists learner_entries_delete_parent on public.learner_entries;
create policy learner_entries_delete_parent on public.learner_entries for delete to authenticated using (
  created_by=auth.uid() and exists(select 1 from public.learners l where l.id=learner_id and public.is_parent_of_family(l.family_id))
);

drop policy if exists family_entries_read_parent on public.family_entries;
create policy family_entries_read_parent on public.family_entries for select to authenticated using (public.is_parent_of_family(family_id));
drop policy if exists family_entries_insert_parent on public.family_entries;
create policy family_entries_insert_parent on public.family_entries for insert to authenticated with check (created_by=auth.uid() and public.is_parent_of_family(family_id));
drop policy if exists family_entries_update_parent on public.family_entries;
create policy family_entries_update_parent on public.family_entries for update to authenticated using (created_by=auth.uid() and public.is_parent_of_family(family_id)) with check (created_by=auth.uid() and public.is_parent_of_family(family_id));
drop policy if exists family_entries_delete_parent on public.family_entries;
create policy family_entries_delete_parent on public.family_entries for delete to authenticated using (created_by=auth.uid() and public.is_parent_of_family(family_id));

drop policy if exists shared_notes_read_authorized on public.shared_family_notes;
create policy shared_notes_read_authorized on public.shared_family_notes for select to authenticated using (public.is_parent_of_family(family_id) or public.is_teacher_for_family(family_id));
drop policy if exists shared_notes_insert_parent on public.shared_family_notes;
create policy shared_notes_insert_parent on public.shared_family_notes for insert to authenticated with check (created_by=auth.uid() and public.is_parent_of_family(family_id));
drop policy if exists shared_notes_update_parent on public.shared_family_notes;
create policy shared_notes_update_parent on public.shared_family_notes for update to authenticated using (created_by=auth.uid() and public.is_parent_of_family(family_id)) with check (created_by=auth.uid() and public.is_parent_of_family(family_id));
drop policy if exists shared_notes_delete_parent on public.shared_family_notes;
create policy shared_notes_delete_parent on public.shared_family_notes for delete to authenticated using (created_by=auth.uid() and public.is_parent_of_family(family_id));

drop policy if exists teacher_entries_read_own on public.teacher_entries;
create policy teacher_entries_read_own on public.teacher_entries for select to authenticated using (teacher_id=auth.uid() and public.is_teacher_user(auth.uid()));
drop policy if exists teacher_entries_insert_own on public.teacher_entries;
create policy teacher_entries_insert_own on public.teacher_entries for insert to authenticated with check (teacher_id=auth.uid() and public.is_teacher_user(auth.uid()));
drop policy if exists teacher_entries_update_own on public.teacher_entries;
create policy teacher_entries_update_own on public.teacher_entries for update to authenticated using (teacher_id=auth.uid() and public.is_teacher_user(auth.uid())) with check (teacher_id=auth.uid() and public.is_teacher_user(auth.uid()));
drop policy if exists teacher_entries_delete_own on public.teacher_entries;
create policy teacher_entries_delete_own on public.teacher_entries for delete to authenticated using (teacher_id=auth.uid() and public.is_teacher_user(auth.uid()));

drop policy if exists published_teacher_updates_read_authorized on public.published_teacher_updates;
create policy published_teacher_updates_read_authorized on public.published_teacher_updates for select to authenticated using ((teacher_id=auth.uid() and public.is_teacher_user(auth.uid())) or public.is_parent_of_teacher(teacher_id));
drop policy if exists published_teacher_updates_insert_own on public.published_teacher_updates;
create policy published_teacher_updates_insert_own on public.published_teacher_updates for insert to authenticated with check (teacher_id=auth.uid() and public.is_teacher_user(auth.uid()));
drop policy if exists published_teacher_updates_update_own on public.published_teacher_updates;
create policy published_teacher_updates_update_own on public.published_teacher_updates for update to authenticated using (teacher_id=auth.uid() and public.is_teacher_user(auth.uid())) with check (teacher_id=auth.uid() and public.is_teacher_user(auth.uid()));
drop policy if exists published_teacher_updates_delete_own on public.published_teacher_updates;
create policy published_teacher_updates_delete_own on public.published_teacher_updates for delete to authenticated using (teacher_id=auth.uid() and public.is_teacher_user(auth.uid()));

revoke all on public.profiles,public.families,public.family_members,public.learners,public.teacher_assignments,public.consents,public.learner_entries,public.family_entries,public.shared_family_notes,public.teacher_entries,public.published_teacher_updates from anon;
revoke all on public.profiles,public.families,public.family_members,public.learners,public.teacher_assignments,public.consents,public.learner_entries,public.family_entries,public.shared_family_notes,public.teacher_entries,public.published_teacher_updates from authenticated;
grant select on public.profiles,public.families,public.family_members,public.learners,public.teacher_assignments to authenticated;
grant select,insert,update on public.consents to authenticated;
grant select,insert,update,delete on public.learner_entries,public.family_entries,public.shared_family_notes,public.teacher_entries,public.published_teacher_updates to authenticated;

revoke all on function public.is_active_user(uuid) from public;
revoke all on function public.is_parent_of_family(uuid) from public;
revoke all on function public.is_teacher_for_learner(uuid) from public;
revoke all on function public.is_teacher_for_family(uuid) from public;
revoke all on function public.is_teacher_user(uuid) from public;
revoke all on function public.is_parent_of_teacher(uuid) from public;
grant execute on function public.is_active_user(uuid),public.is_parent_of_family(uuid),public.is_teacher_for_learner(uuid),public.is_teacher_for_family(uuid),public.is_teacher_user(uuid),public.is_parent_of_teacher(uuid) to authenticated;

revoke all on function public.set_updated_at() from public,anon,authenticated;
revoke all on function public.enforce_level_capacity() from public,anon,authenticated;
revoke all on function public.validate_entry_date(date) from public,anon,authenticated;
revoke all on function public.validate_learner_entry() from public,anon,authenticated;
revoke all on function public.validate_family_entry() from public,anon,authenticated;
revoke all on function public.validate_shared_note() from public,anon,authenticated;
revoke all on function public.validate_teacher_entry() from public,anon,authenticated;
revoke all on function public.validate_published_teacher_update() from public,anon,authenticated;

create or replace function public.purge_old_diary_entries()
returns void language plpgsql security definer set search_path = '' as $$
begin
  delete from public.published_teacher_updates where entry_date < current_date - 89;
  delete from public.teacher_entries where entry_date < current_date - 89;
  delete from public.shared_family_notes where entry_date < current_date - 89;
  delete from public.family_entries where entry_date < current_date - 89;
  delete from public.learner_entries where entry_date < current_date - 89;
end;
$$;
revoke all on function public.purge_old_diary_entries() from public,anon,authenticated;
grant execute on function public.purge_old_diary_entries() to service_role;

commit;

-- Post-install check: each should show rowsecurity = true.
select relname,relrowsecurity from pg_class
where relnamespace='public'::regnamespace
  and relname in ('profiles','families','family_members','learners','teacher_assignments','consents','learner_entries','family_entries','shared_family_notes','teacher_entries','published_teacher_updates')
order by relname;
