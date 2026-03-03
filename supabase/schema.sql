begin;

create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('trainer', 'member');
  end if;

  if not exists (select 1 from pg_type where typname = 'connection_status') then
    create type public.connection_status as enum ('active', 'disconnected');
  end if;

  if not exists (select 1 from pg_type where typname = 'reservation_status') then
    create type public.reservation_status as enum ('pending', 'approved', 'rejected', 'cancelled', 'completed');
  end if;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null,
  name text not null,
  phone text,
  photo_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.trainer_profiles (
  id uuid primary key references public.profiles (id) on delete cascade,
  specialties text[] not null default '{}'::text[],
  bio text
);

create table if not exists public.member_profiles (
  id uuid primary key references public.profiles (id) on delete cascade,
  age int,
  height numeric,
  weight numeric,
  goals text[] not null default '{}'::text[],
  notes text
);

create table if not exists public.trainer_members (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.profiles (id) on delete cascade,
  member_id uuid not null references public.profiles (id) on delete cascade,
  invite_code_used text,
  connected_at timestamptz not null default now(),
  status public.connection_status not null default 'active',
  check (trainer_id <> member_id)
);

create unique index if not exists trainer_members_unique_active_member
  on public.trainer_members (member_id)
  where status = 'active';

create unique index if not exists trainer_members_unique_active_pair
  on public.trainer_members (trainer_id, member_id)
  where status = 'active';

create table if not exists public.invite_codes (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.profiles (id) on delete cascade,
  code text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.work_schedules (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.profiles (id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  is_enabled boolean not null default true,
  slot_duration_minutes int not null default 60 check (slot_duration_minutes > 0),
  check (start_time < end_time),
  unique (trainer_id, day_of_week)
);

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.profiles (id) on delete cascade,
  member_id uuid not null references public.profiles (id) on delete cascade,
  date date not null,
  start_time time not null,
  end_time time not null,
  status public.reservation_status not null default 'pending',
  session_type text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (trainer_id <> member_id),
  check (start_time < end_time)
);

create unique index if not exists reservations_unique_active_slot
  on public.reservations (trainer_id, date, start_time)
  where status in ('pending', 'approved');

create table if not exists public.memos (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.profiles (id) on delete cascade,
  member_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  tags jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_reservations_updated_at on public.reservations;
create trigger set_reservations_updated_at
before update on public.reservations
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.trainer_profiles enable row level security;
alter table public.member_profiles enable row level security;
alter table public.trainer_members enable row level security;
alter table public.invite_codes enable row level security;
alter table public.work_schedules enable row level security;
alter table public.reservations enable row level security;
alter table public.memos enable row level security;

drop policy if exists "Profiles are insertable by owner" on public.profiles;
create policy "Profiles are insertable by owner"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "Profiles are readable by owner" on public.profiles;
create policy "Profiles are readable by owner"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Profiles are updatable by owner" on public.profiles;
create policy "Profiles are updatable by owner"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Profiles are readable by connected users" on public.profiles;
create policy "Profiles are readable by connected users"
on public.profiles
for select
to authenticated
using (
  exists (
    select 1
    from public.trainer_members tm
    where tm.status = 'active'
      and (
        (tm.trainer_id = auth.uid() and tm.member_id = profiles.id)
        or (tm.member_id = auth.uid() and tm.trainer_id = profiles.id)
      )
  )
);

drop policy if exists "Trainer profiles are insertable by owner" on public.trainer_profiles;
create policy "Trainer profiles are insertable by owner"
on public.trainer_profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "Trainer profiles are updatable by owner" on public.trainer_profiles;
create policy "Trainer profiles are updatable by owner"
on public.trainer_profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Trainer profiles are readable by owner" on public.trainer_profiles;
create policy "Trainer profiles are readable by owner"
on public.trainer_profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Trainer profiles are readable by connected members" on public.trainer_profiles;
create policy "Trainer profiles are readable by connected members"
on public.trainer_profiles
for select
to authenticated
using (
  exists (
    select 1
    from public.trainer_members tm
    where tm.status = 'active'
      and tm.trainer_id = trainer_profiles.id
      and tm.member_id = auth.uid()
  )
);

drop policy if exists "Trainer profiles are publicly readable" on public.trainer_profiles;
create policy "Trainer profiles are publicly readable"
on public.trainer_profiles
for select
to public
using (true);

drop policy if exists "Member profiles are insertable by owner" on public.member_profiles;
create policy "Member profiles are insertable by owner"
on public.member_profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "Member profiles are readable by owner" on public.member_profiles;
create policy "Member profiles are readable by owner"
on public.member_profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Member profiles are updatable by owner" on public.member_profiles;
create policy "Member profiles are updatable by owner"
on public.member_profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Member profiles are readable by connected trainers" on public.member_profiles;
create policy "Member profiles are readable by connected trainers"
on public.member_profiles
for select
to authenticated
using (
  exists (
    select 1
    from public.trainer_members tm
    where tm.status = 'active'
      and tm.trainer_id = auth.uid()
      and tm.member_id = member_profiles.id
  )
);

drop policy if exists "Trainer members are insertable by participants" on public.trainer_members;
create policy "Trainer members are insertable by participants"
on public.trainer_members
for insert
to authenticated
with check (auth.uid() = trainer_id or auth.uid() = member_id);

drop policy if exists "Trainer members are readable by participants" on public.trainer_members;
create policy "Trainer members are readable by participants"
on public.trainer_members
for select
to authenticated
using (auth.uid() = trainer_id or auth.uid() = member_id);

drop policy if exists "Trainer members are updatable by participants" on public.trainer_members;
create policy "Trainer members are updatable by participants"
on public.trainer_members
for update
to authenticated
using (auth.uid() = trainer_id or auth.uid() = member_id)
with check (auth.uid() = trainer_id or auth.uid() = member_id);

drop policy if exists "Trainer members are deletable by participants" on public.trainer_members;
create policy "Trainer members are deletable by participants"
on public.trainer_members
for delete
to authenticated
using (auth.uid() = trainer_id or auth.uid() = member_id);

drop policy if exists "Invite codes are insertable by trainer" on public.invite_codes;
create policy "Invite codes are insertable by trainer"
on public.invite_codes
for insert
to authenticated
with check (auth.uid() = trainer_id);

drop policy if exists "Invite codes are readable by authenticated users" on public.invite_codes;
create policy "Invite codes are readable by authenticated users"
on public.invite_codes
for select
to authenticated
using (true);

drop policy if exists "Invite codes are updatable by trainer" on public.invite_codes;
create policy "Invite codes are updatable by trainer"
on public.invite_codes
for update
to authenticated
using (auth.uid() = trainer_id)
with check (auth.uid() = trainer_id);

drop policy if exists "Invite codes are deletable by trainer" on public.invite_codes;
create policy "Invite codes are deletable by trainer"
on public.invite_codes
for delete
to authenticated
using (auth.uid() = trainer_id);

drop policy if exists "Work schedules are insertable by trainer" on public.work_schedules;
create policy "Work schedules are insertable by trainer"
on public.work_schedules
for insert
to authenticated
with check (auth.uid() = trainer_id);

drop policy if exists "Work schedules are readable by trainer" on public.work_schedules;
create policy "Work schedules are readable by trainer"
on public.work_schedules
for select
to authenticated
using (auth.uid() = trainer_id);

drop policy if exists "Work schedules are readable by connected members" on public.work_schedules;
create policy "Work schedules are readable by connected members"
on public.work_schedules
for select
to authenticated
using (
  exists (
    select 1
    from public.trainer_members tm
    where tm.status = 'active'
      and tm.trainer_id = work_schedules.trainer_id
      and tm.member_id = auth.uid()
  )
);

drop policy if exists "Work schedules are updatable by trainer" on public.work_schedules;
create policy "Work schedules are updatable by trainer"
on public.work_schedules
for update
to authenticated
using (auth.uid() = trainer_id)
with check (auth.uid() = trainer_id);

drop policy if exists "Work schedules are deletable by trainer" on public.work_schedules;
create policy "Work schedules are deletable by trainer"
on public.work_schedules
for delete
to authenticated
using (auth.uid() = trainer_id);

drop policy if exists "Reservations are insertable by participants" on public.reservations;
create policy "Reservations are insertable by participants"
on public.reservations
for insert
to authenticated
with check (auth.uid() = trainer_id or auth.uid() = member_id);

drop policy if exists "Reservations are readable by participants" on public.reservations;
create policy "Reservations are readable by participants"
on public.reservations
for select
to authenticated
using (auth.uid() = trainer_id or auth.uid() = member_id);

drop policy if exists "Reservations are updatable by participants" on public.reservations;
create policy "Reservations are updatable by participants"
on public.reservations
for update
to authenticated
using (auth.uid() = trainer_id or auth.uid() = member_id)
with check (auth.uid() = trainer_id or auth.uid() = member_id);

drop policy if exists "Reservations are deletable by participants" on public.reservations;
create policy "Reservations are deletable by participants"
on public.reservations
for delete
to authenticated
using (auth.uid() = trainer_id or auth.uid() = member_id);

drop policy if exists "Memos are insertable by trainer" on public.memos;
create policy "Memos are insertable by trainer"
on public.memos
for insert
to authenticated
with check (auth.uid() = trainer_id);

drop policy if exists "Memos are readable by trainer" on public.memos;
create policy "Memos are readable by trainer"
on public.memos
for select
to authenticated
using (auth.uid() = trainer_id);

drop policy if exists "Memos are updatable by trainer" on public.memos;
create policy "Memos are updatable by trainer"
on public.memos
for update
to authenticated
using (auth.uid() = trainer_id)
with check (auth.uid() = trainer_id);

drop policy if exists "Memos are deletable by trainer" on public.memos;
create policy "Memos are deletable by trainer"
on public.memos
for delete
to authenticated
using (auth.uid() = trainer_id);

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update
set public = excluded.public;

drop policy if exists "Avatar images are publicly readable" on storage.objects;
create policy "Avatar images are publicly readable"
on storage.objects
for select
to public
using (bucket_id = 'avatars');

drop policy if exists "Avatar images are insertable by authenticated users" on storage.objects;
create policy "Avatar images are insertable by authenticated users"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'avatars' and auth.uid() is not null);

drop policy if exists "Avatar images are updatable by owners" on storage.objects;
create policy "Avatar images are updatable by owners"
on storage.objects
for update
to authenticated
using (bucket_id = 'avatars' and owner = auth.uid())
with check (bucket_id = 'avatars' and owner = auth.uid());

drop policy if exists "Avatar images are deletable by owners" on storage.objects;
create policy "Avatar images are deletable by owners"
on storage.objects
for delete
to authenticated
using (bucket_id = 'avatars' and owner = auth.uid());

create or replace function public.connect_via_invite(p_code text)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_member_id uuid := auth.uid();
  v_trainer_id uuid;
  v_used_code text;
  v_connection_id uuid;
begin
  if v_member_id is null then
    raise exception 'Authentication required';
  end if;

  select ic.trainer_id, ic.code
  into v_trainer_id, v_used_code
  from public.invite_codes ic
  where ic.is_active = true
    and upper(ic.code) = upper(trim(p_code))
  limit 1;

  if v_trainer_id is null then
    raise exception 'Invalid invite code';
  end if;

  if v_trainer_id = v_member_id then
    raise exception 'Trainer and member cannot be the same user';
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.id = v_member_id
      and p.role = 'member'
  ) then
    raise exception 'Only member accounts can use invite codes';
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.id = v_trainer_id
      and p.role = 'trainer'
  ) then
    raise exception 'Invite code owner is not a trainer';
  end if;

  if exists (
    select 1
    from public.trainer_members tm
    where tm.member_id = v_member_id
      and tm.status = 'active'
  ) then
    raise exception 'Member already has an active trainer connection';
  end if;

  insert into public.trainer_members (
    id,
    trainer_id,
    member_id,
    invite_code_used,
    connected_at,
    status
  )
  values (
    gen_random_uuid(),
    v_trainer_id,
    v_member_id,
    v_used_code,
    now(),
    'active'
  )
  returning id into v_connection_id;

  return v_connection_id;
exception
  when unique_violation then
    raise exception 'Member already has an active trainer connection';
end;
$$;

create or replace function public.create_reservation(
  p_trainer_id uuid,
  p_date date,
  p_start_time time,
  p_end_time time,
  p_session_type text
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_member_id uuid := auth.uid();
  v_reservation_id uuid;
begin
  if v_member_id is null then
    raise exception 'Authentication required';
  end if;

  if p_start_time >= p_end_time then
    raise exception 'End time must be later than start time';
  end if;

  if not exists (
    select 1
    from public.trainer_members tm
    where tm.trainer_id = p_trainer_id
      and tm.member_id = v_member_id
      and tm.status = 'active'
  ) then
    raise exception 'No active trainer-member connection';
  end if;

  insert into public.reservations (
    id,
    trainer_id,
    member_id,
    date,
    start_time,
    end_time,
    status,
    session_type,
    created_at,
    updated_at
  )
  values (
    gen_random_uuid(),
    p_trainer_id,
    v_member_id,
    p_date,
    p_start_time,
    p_end_time,
    'pending',
    p_session_type,
    now(),
    now()
  )
  returning id into v_reservation_id;

  return v_reservation_id;
exception
  when unique_violation then
    raise exception 'Reservation time slot is already booked';
end;
$$;

grant execute on function public.connect_via_invite(text) to authenticated;
grant execute on function public.create_reservation(uuid, date, time, time, text) to authenticated;

commit;
