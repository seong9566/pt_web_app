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
  created_at timestamptz not null default now(),
  deleted_at timestamptz default null
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
  rejection_reason text,
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

drop policy if exists "Trainer profiles are searchable by authenticated users" on public.profiles;
create policy "Trainer profiles are searchable by authenticated users"
on public.profiles
for select
to authenticated
using (role = 'trainer' and deleted_at is null and auth.uid() is not null);

drop policy if exists "Profiles are readable by connected users" on public.profiles;
create policy "Profiles are readable by connected users"
on public.profiles
for select
to authenticated
using (
  deleted_at is null
  and exists (
    select 1
    from public.trainer_members tm
    where tm.status in ('active', 'pending')
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
on public.reservations for insert to authenticated
with check (
  (auth.uid() = trainer_id or auth.uid() = member_id)
  and exists (
    select 1 from public.trainer_members tm
    where tm.trainer_id = reservations.trainer_id
      and tm.member_id = reservations.member_id
      and tm.status = 'active'
  )
);

drop policy if exists "Reservations are readable by participants" on public.reservations;
create policy "Reservations are readable by participants"
on public.reservations for select to authenticated
using (
  (auth.uid() = trainer_id or auth.uid() = member_id)
  and exists (
    select 1 from public.trainer_members tm
    where tm.trainer_id = reservations.trainer_id
      and tm.member_id = reservations.member_id
      and tm.status = 'active'
  )
);

drop policy if exists "Reservations are updatable by participants" on public.reservations;
create policy "Reservations are updatable by participants"
on public.reservations for update to authenticated
using (
  (auth.uid() = trainer_id or auth.uid() = member_id)
  and exists (
    select 1 from public.trainer_members tm
    where tm.trainer_id = reservations.trainer_id
      and tm.member_id = reservations.member_id
      and tm.status = 'active'
  )
)
with check (
  (auth.uid() = trainer_id or auth.uid() = member_id)
  and exists (
    select 1 from public.trainer_members tm
    where tm.trainer_id = reservations.trainer_id
      and tm.member_id = reservations.member_id
      and tm.status = 'active'
  )
);

drop policy if exists "Reservations are deletable by participants" on public.reservations;
create policy "Reservations are deletable by participants"
on public.reservations for delete to authenticated
using (
  (auth.uid() = trainer_id or auth.uid() = member_id)
  and exists (
    select 1 from public.trainer_members tm
    where tm.trainer_id = reservations.trainer_id
      and tm.member_id = reservations.member_id
      and tm.status = 'active'
  )
);

drop policy if exists "Memos are insertable by trainer" on public.memos;
create policy "Memos are insertable by trainer"
on public.memos for insert to authenticated
with check (
  auth.uid() = trainer_id
  and exists (
    select 1 from public.trainer_members tm
    where tm.trainer_id = memos.trainer_id
      and tm.member_id = memos.member_id
      and tm.status = 'active'
  )
);

drop policy if exists "Memos are readable by trainer" on public.memos;
create policy "Memos are readable by trainer"
on public.memos for select to authenticated
using (
  auth.uid() = trainer_id
  and exists (
    select 1 from public.trainer_members tm
    where tm.trainer_id = memos.trainer_id
      and tm.member_id = memos.member_id
      and tm.status = 'active'
  )
);

drop policy if exists "Memos are updatable by trainer" on public.memos;
create policy "Memos are updatable by trainer"
on public.memos for update to authenticated
using (
  auth.uid() = trainer_id
  and exists (
    select 1 from public.trainer_members tm
    where tm.trainer_id = memos.trainer_id
      and tm.member_id = memos.member_id
      and tm.status = 'active'
  )
)
with check (
  auth.uid() = trainer_id
  and exists (
    select 1 from public.trainer_members tm
    where tm.trainer_id = memos.trainer_id
      and tm.member_id = memos.member_id
      and tm.status = 'active'
  )
);

drop policy if exists "Memos are deletable by trainer" on public.memos;
create policy "Memos are deletable by trainer"
on public.memos for delete to authenticated
using (
  auth.uid() = trainer_id
  and exists (
    select 1 from public.trainer_members tm
    where tm.trainer_id = memos.trainer_id
      and tm.member_id = memos.member_id
      and tm.status = 'active'
  )
);

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
security definer
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
security definer
set search_path = public
as $$
declare
  v_member_id uuid := auth.uid();
  v_trainer_id uuid;
  v_used_code text;
  v_connection_id uuid;
  v_existing_reservation uuid;
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

-- ============================================================
-- Phase 2: PRD Full Completion Schema
-- Run in Supabase Dashboard SQL Editor
-- ============================================================

-- T2: messages table (1:1 채팅)
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  content text,
  file_url text,
  file_name text,
  file_type text,
  file_size bigint,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  constraint sender_id_ne_receiver check (sender_id <> receiver_id)
);
create index if not exists idx_messages_participants on public.messages (sender_id, receiver_id, created_at desc);
create index if not exists idx_messages_receiver_unread on public.messages (receiver_id) where is_read = false;
alter table public.messages enable row level security;
create policy "Messages are readable by participants" on public.messages for select to authenticated
using (
  (auth.uid() = sender_id or auth.uid() = receiver_id)
  and exists (
    select 1 from public.trainer_members tm
    where (
      (tm.trainer_id = messages.sender_id and tm.member_id = messages.receiver_id)
      or (tm.trainer_id = messages.receiver_id and tm.member_id = messages.sender_id)
    )
    and tm.status = 'active'
  )
);
create policy "Messages are insertable by sender" on public.messages for insert to authenticated
with check (
  auth.uid() = sender_id
  and exists (
    select 1 from public.trainer_members tm
    where (
      (tm.trainer_id = messages.sender_id and tm.member_id = messages.receiver_id)
      or (tm.trainer_id = messages.receiver_id and tm.member_id = messages.sender_id)
    )
    and tm.status = 'active'
  )
);
create policy "Messages are updatable by receiver" on public.messages for update to authenticated
using (
  auth.uid() = receiver_id
  and exists (
    select 1 from public.trainer_members tm
    where (
      (tm.trainer_id = messages.sender_id and tm.member_id = messages.receiver_id)
      or (tm.trainer_id = messages.receiver_id and tm.member_id = messages.sender_id)
    )
    and tm.status = 'active'
  )
);

-- T3: pt_sessions table (PT 횟수 이력)
create table if not exists public.pt_sessions (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  member_id uuid not null references public.profiles(id) on delete cascade,
  change_amount int not null,
  reason text,
  created_at timestamptz not null default now()
);
create index if not exists idx_pt_sessions_member on public.pt_sessions (member_id, created_at desc);
alter table public.pt_sessions enable row level security;
create policy "PT sessions readable by trainer and member" on public.pt_sessions for select to authenticated
using (
  (auth.uid() = trainer_id or auth.uid() = member_id)
  and exists (
    select 1 from public.trainer_members tm
    where tm.trainer_id = pt_sessions.trainer_id
      and tm.member_id = pt_sessions.member_id
      and tm.status = 'active'
  )
);
create policy "PT sessions insertable by trainer" on public.pt_sessions for insert to authenticated
with check (
  auth.uid() = trainer_id
  and exists (
    select 1 from public.trainer_members tm
    where tm.trainer_id = pt_sessions.trainer_id
      and tm.member_id = pt_sessions.member_id
      and tm.status = 'active'
  )
);

-- T3: payments table (수납 기록)
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  member_id uuid not null references public.profiles(id) on delete cascade,
  amount int not null check (amount > 0),
  memo text,
  payment_date date not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_payments_member on public.payments (member_id, created_at desc);
alter table public.payments enable row level security;
create policy "Payments readable by trainer and member" on public.payments for select to authenticated
using (
  (auth.uid() = trainer_id or auth.uid() = member_id)
  and exists (
    select 1 from public.trainer_members tm
    where tm.trainer_id = payments.trainer_id
      and tm.member_id = payments.member_id
      and tm.status = 'active'
  )
);
create policy "Payments insertable by trainer" on public.payments for insert to authenticated
with check (
  auth.uid() = trainer_id
  and exists (
    select 1 from public.trainer_members tm
    where tm.trainer_id = payments.trainer_id
      and tm.member_id = payments.member_id
      and tm.status = 'active'
  )
);
create policy "Payments deletable by trainer" on public.payments for delete to authenticated
using (
  auth.uid() = trainer_id
  and exists (
    select 1 from public.trainer_members tm
    where tm.trainer_id = payments.trainer_id
      and tm.member_id = payments.member_id
      and tm.status = 'active'
  )
);

-- T4: manual_category enum + manuals table
do $$ begin
  create type public.manual_category as enum ('재활', '근력', '다이어트', '스포츠퍼포먼스');
exception when duplicate_object then null;
end $$;

create table if not exists public.manuals (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  category public.manual_category not null,
  description text,
  youtube_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_manuals_category on public.manuals (category);
alter table public.manuals enable row level security;
create policy "Manuals readable by all authenticated" on public.manuals for select to authenticated using (true);
create policy "Manuals insertable by trainer" on public.manuals for insert to authenticated with check (auth.uid() = trainer_id);
create policy "Manuals updatable by trainer" on public.manuals for update to authenticated using (auth.uid() = trainer_id);
create policy "Manuals deletable by trainer" on public.manuals for delete to authenticated using (auth.uid() = trainer_id);

-- T4: manual_media table
create table if not exists public.manual_media (
  id uuid primary key default gen_random_uuid(),
  manual_id uuid not null references public.manuals(id) on delete cascade,
  file_url text not null,
  file_type text not null,
  file_size bigint,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.manual_media enable row level security;
create policy "Manual media readable by all authenticated" on public.manual_media for select to authenticated using (true);
create policy "Manual media insertable by manual owner" on public.manual_media for insert to authenticated with check (
  exists (select 1 from public.manuals where id = manual_id and trainer_id = auth.uid())
);
create policy "Manual media deletable by manual owner" on public.manual_media for delete to authenticated using (
  exists (select 1 from public.manuals where id = manual_id and trainer_id = auth.uid())
);

-- T5: workout_plans table (오늘의 운동)
create table if not exists public.workout_plans (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  member_id uuid not null references public.profiles(id) on delete cascade,
  date date not null,
  exercises jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (trainer_id, member_id, date)
);
create index if not exists idx_workout_plans_member_date on public.workout_plans (member_id, date desc);
alter table public.workout_plans enable row level security;
create policy "Workout plans readable by trainer and member" on public.workout_plans for select to authenticated
using (
  (auth.uid() = trainer_id or auth.uid() = member_id)
  and exists (
    select 1 from public.trainer_members tm
    where tm.trainer_id = workout_plans.trainer_id
      and tm.member_id = workout_plans.member_id
      and tm.status = 'active'
  )
);
create policy "Workout plans insertable by trainer" on public.workout_plans for insert to authenticated
with check (
  auth.uid() = trainer_id
  and exists (
    select 1 from public.trainer_members tm
    where tm.trainer_id = workout_plans.trainer_id
      and tm.member_id = workout_plans.member_id
      and tm.status = 'active'
  )
);
create policy "Workout plans updatable by trainer" on public.workout_plans for update to authenticated
using (
  auth.uid() = trainer_id
  and exists (
    select 1 from public.trainer_members tm
    where tm.trainer_id = workout_plans.trainer_id
      and tm.member_id = workout_plans.member_id
      and tm.status = 'active'
  )
);
create policy "Workout plans deletable by trainer" on public.workout_plans for delete to authenticated
using (
  auth.uid() = trainer_id
  and exists (
    select 1 from public.trainer_members tm
    where tm.trainer_id = workout_plans.trainer_id
      and tm.member_id = workout_plans.member_id
      and tm.status = 'active'
  )
);

-- T6: notification_type enum + notifications table
do $$ begin
  create type public.notification_type as enum (
    'reservation_requested', 'reservation_approved', 'reservation_rejected', 'reservation_cancelled',
    'new_message', 'workout_assigned',
    'connection_requested', 'connection_approved',
    'pt_count_changed', 'payment_recorded',
    'account_deleted'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  body text not null,
  target_id uuid,
  target_type text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_notifications_user on public.notifications (user_id, created_at desc);
create index if not exists idx_notifications_unread on public.notifications (user_id) where is_read = false;
alter table public.notifications enable row level security;
create policy "Notifications readable by owner" on public.notifications for select to authenticated using (auth.uid() = user_id);
create policy "Notifications insertable by authenticated" on public.notifications for insert to authenticated with check (true);
create policy "Notifications updatable by owner" on public.notifications for update to authenticated using (auth.uid() = user_id);
create policy "Notifications deletable by owner" on public.notifications for delete to authenticated using (auth.uid() = user_id);

-- T7: trainer_holidays table (휴무일)
create table if not exists public.trainer_holidays (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  date date not null,
  created_at timestamptz not null default now(),
  unique (trainer_id, date)
);
alter table public.trainer_holidays enable row level security;
create policy "Holidays manageable by trainer" on public.trainer_holidays for all to authenticated using (auth.uid() = trainer_id) with check (auth.uid() = trainer_id);
create policy "Holidays readable by connected members" on public.trainer_holidays for select to authenticated using (
  exists (
    select 1 from public.trainer_members tm
    where tm.trainer_id = trainer_holidays.trainer_id
      and tm.member_id = auth.uid()
      and tm.status = 'active'
  )
);

-- T8: connection_status enum 'pending' 추가
alter type public.connection_status add value if not exists 'pending';

-- T8: memos 회원 읽기 RLS 추가
do $$ begin
  create policy "Memos are readable by member" on public.memos for select to authenticated
  using (
    auth.uid() = member_id
    and exists (
      select 1 from public.trainer_members tm
      where tm.trainer_id = memos.trainer_id
        and tm.member_id = memos.member_id
        and tm.status = 'active'
    )
  );
exception when duplicate_object then null;
end $$;

-- T9: Storage buckets
insert into storage.buckets (id, name, public, file_size_limit)
values ('chat-files', 'chat-files', false, 52428800)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit)
values ('manual-media', 'manual-media', true, 524288000)
on conflict (id) do nothing;

-- chat-files bucket storage policies
drop policy if exists "Users can list own chat files" on storage.objects;
create policy "Users can list own chat files"
on storage.objects
for select
using (bucket_id = 'chat-files' and (storage.foldername(name))[1] = auth.uid()::text);

-- manual-media bucket storage policies
drop policy if exists "Manual media files are publicly readable" on storage.objects;
create policy "Manual media files are publicly readable"
on storage.objects
for select
to public
using (bucket_id = 'manual-media');

drop policy if exists "Manual media files are uploadable by authenticated users" on storage.objects;
create policy "Manual media files are uploadable by authenticated users"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'manual-media' and auth.uid() is not null);

drop policy if exists "Manual media files are updatable by owners" on storage.objects;
create policy "Manual media files are updatable by owners"
on storage.objects
for update
to authenticated
using (bucket_id = 'manual-media' and owner = auth.uid())
with check (bucket_id = 'manual-media' and owner = auth.uid());

drop policy if exists "Manual media files are deletable by owners" on storage.objects;
create policy "Manual media files are deletable by owners"
on storage.objects
for delete
to authenticated
using (bucket_id = 'manual-media' and owner = auth.uid());

-- T10: create_reservation RPC — PT 횟수 검증 추가
create or replace function public.create_reservation(
  p_trainer_id uuid,
  p_date date,
  p_start_time time,
  p_end_time time,
  p_session_type text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member_id uuid := auth.uid();
  v_reservation_id uuid;
  v_remaining int;
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

  -- PT 잔여 횟수 확인 (0이면 예약 불가)
  select coalesce(sum(change_amount), 0) into v_remaining
  from public.pt_sessions
  where member_id = v_member_id and trainer_id = p_trainer_id;

  if v_remaining <= 0 then
    raise exception 'PT 잔여 횟수가 부족합니다. 예약이 불가능합니다.';
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

-- T11: delete_user_account RPC — 계정 삭제 (auth.users CASCADE)
create or replace function public.delete_user_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

create or replace function public.soft_delete_user_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set deleted_at = now()
  where id = auth.uid()
    and deleted_at is null;
end;
$$;

create or replace function public.cancel_account_deletion()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set deleted_at = null
  where id = auth.uid();
end;
$$;

-- T10: PT 자동 차감 trigger
create or replace function public.auto_deduct_pt_session()
returns trigger as $$
begin
  if new.status = 'completed' and old.status <> 'completed' then
    insert into public.pt_sessions (trainer_id, member_id, change_amount, reason)
    values (new.trainer_id, new.member_id, -1, '수업 완료 자동 차감');
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_auto_deduct_pt on public.reservations;
create trigger trg_auto_deduct_pt
after update on public.reservations
for each row
execute function public.auto_deduct_pt_session();

-- T12: 예약 자동 완료 (pg_cron) — 종료 시간이 지난 approved 예약을 completed로 변경
create extension if not exists pg_cron with schema pg_catalog;

create or replace function public.auto_complete_past_reservations()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update reservations
  set status = 'completed'
  where status = 'approved'
    and (date + end_time) < (now() at time zone 'Asia/Seoul');
end;
$$;

create or replace function public.purge_deleted_accounts()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from auth.users
  where id in (
    select p.id
    from public.profiles p
    where p.deleted_at is not null
      and p.deleted_at <= now() - interval '30 days'
  );
end;
$$;

select cron.schedule(
  'auto-complete-reservations',
  '*/5 * * * *',
  $$select public.auto_complete_past_reservations()$$
);

select cron.schedule(
  'purge-deleted-accounts',
  '0 3 * * *',
  $$select public.purge_deleted_accounts()$$
);

commit;
