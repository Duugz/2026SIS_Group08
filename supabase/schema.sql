-- StudySpot: full schema (study_spots, profiles, favourites)
-- Run this in the Supabase dashboard: Project -> SQL Editor -> New query -> paste -> Run
--
-- Safe to run on a brand new project (creates everything from scratch) or
-- re-run against this team's existing project (every statement is
-- idempotent - "add column if not exists", "drop policy if exists" then
-- recreate, etc). Replaces the old 001/002/003 migration files, which
-- existed only because study_spots was originally created with a
-- different, smaller column set than the app ended up needing.

-- ============================================================
-- study_spots
-- ============================================================

create table if not exists study_spots (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

alter table study_spots
  add column if not exists slug text,
  add column if not exists latitude numeric(9, 6),
  add column if not exists longitude numeric(9, 6),
  add column if not exists walk_minutes integer not null default 0,
  add column if not exists noise_level text not null default 'quiet' check (noise_level in ('quiet', 'moderate', 'busy')),
  add column if not exists crowd_level text not null default 'quiet' check (crowd_level in ('quiet', 'moderate', 'busy')),
  add column if not exists study_types text[] not null default '{}', -- subset of: solo, group
  add column if not exists facilities text[] not null default '{}',  -- subset of: power, wifi, food, toilets
  add column if not exists is_open boolean not null default true,
  add column if not exists available_seats integer not null default 0,
  add column if not exists total_seats integer not null default 0,
  add column if not exists updated_at timestamptz not null default now();

-- Backfill slug + geo + metadata for the 4 sample rows if they already
-- exist from an earlier version of this schema (no-op on a fresh project).
update study_spots set
  slug = 'uts-library-l5', latitude = -33.8830, longitude = 151.1996,
  walk_minutes = 6, noise_level = 'quiet', crowd_level = 'quiet',
  study_types = '{solo}', facilities = '{power,wifi}',
  available_seats = 18, total_seats = 40
where name = 'UTS Library Level 5' and slug is null;

update study_spots set
  slug = 'central-park-study-room', latitude = -33.8838, longitude = 151.1989,
  walk_minutes = 10, noise_level = 'moderate', crowd_level = 'moderate',
  study_types = '{group}', facilities = '{power,wifi,food}',
  available_seats = 4, total_seats = 8
where name = 'Central Park Study Room' and slug is null;

update study_spots set
  slug = 'campus-cafe-corner', latitude = -33.8834, longitude = 151.2003,
  walk_minutes = 4, noise_level = 'busy', crowd_level = 'busy',
  study_types = '{solo,group}', facilities = '{wifi,food,toilets}',
  available_seats = 10, total_seats = 30
where name = 'Campus Cafe Corner' and slug is null;

update study_spots set
  slug = 'alumni-green-pods', latitude = -33.8828, longitude = 151.2007,
  walk_minutes = 3, noise_level = 'moderate', crowd_level = 'quiet',
  study_types = '{solo}', facilities = '{power,wifi,toilets}',
  available_seats = 6, total_seats = 12
where name = 'Alumni Green Pods' and slug is null;

-- Every row now has a slug (either just backfilled, or from a fresh
-- insert below) - safe to enforce not-null + uniqueness.
alter table study_spots alter column slug set not null;
alter table study_spots alter column latitude set not null;
alter table study_spots alter column longitude set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'study_spots_slug_key'
  ) then
    alter table study_spots add constraint study_spots_slug_key unique (slug);
  end if;
end $$;

-- Seed data for a fresh project - no-ops on the existing project since
-- the rows above already exist with matching slugs.
insert into study_spots (
  slug, name, description, latitude, longitude, walk_minutes,
  noise_level, crowd_level, study_types, facilities, is_open,
  available_seats, total_seats
)
values
  ('uts-library-l5', 'UTS Library Level 5', 'Quiet floor, individual desks, great for deep focus', -33.8830, 151.1996, 6, 'quiet', 'quiet', '{solo}', '{power,wifi}', true, 18, 40),
  ('central-park-study-room', 'Central Park Study Room', 'Bookable group rooms with whiteboards', -33.8838, 151.1989, 10, 'moderate', 'moderate', '{group}', '{power,wifi,food}', true, 4, 8),
  ('campus-cafe-corner', 'Campus Cafe Corner', 'Casual seating, good coffee, background noise', -33.8834, 151.2003, 4, 'busy', 'busy', '{solo,group}', '{wifi,food,toilets}', true, 10, 30),
  ('alumni-green-pods', 'Alumni Green Pods', 'Fast Wi-Fi, quick sessions between classes', -33.8828, 151.2007, 3, 'moderate', 'quiet', '{solo}', '{power,wifi,toilets}', true, 6, 12)
on conflict (slug) do nothing;

alter table study_spots enable row level security;

drop policy if exists "Public read access" on study_spots;
create policy "Public read access"
  on study_spots
  for select
  using (true);

-- ============================================================
-- profiles - one row per authenticated user, auto-created on signup
-- ============================================================

create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

-- Public read so other users can see display names on things like
-- check-ins; only the owner can write their own row (see update policy).
drop policy if exists "Users can read their own profile" on profiles;
drop policy if exists "Profiles are publicly readable" on profiles;
create policy "Profiles are publicly readable"
  on profiles for select
  using (true);

drop policy if exists "Users can update their own profile" on profiles;
create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- favourites - join table between a user and a study spot
-- ============================================================

create table if not exists favourites (
  user_id uuid not null references auth.users (id) on delete cascade,
  spot_id uuid not null references study_spots (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, spot_id)
);

alter table favourites enable row level security;

drop policy if exists "Users can read their own favourites" on favourites;
create policy "Users can read their own favourites"
  on favourites for select
  using (auth.uid() = user_id);

drop policy if exists "Users can add their own favourites" on favourites;
create policy "Users can add their own favourites"
  on favourites for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can remove their own favourites" on favourites;
create policy "Users can remove their own favourites"
  on favourites for delete
  using (auth.uid() = user_id);

-- ============================================================
-- check_ins - one active row per user; who's currently studying where.
-- References profiles (not auth.users directly) so the app can embed
-- display_name in a single query via PostgREST's FK-based joins.
-- ============================================================

create table if not exists check_ins (
  user_id uuid primary key references profiles (id) on delete cascade,
  spot_id uuid not null references study_spots (id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '2 hours'
);

alter table check_ins enable row level security;

-- A check-in is only useful if other people can see it, and only while
-- it's still active - expired rows are invisible to everyone, including
-- the user who made them.
drop policy if exists "Active check-ins are publicly readable" on check_ins;
create policy "Active check-ins are publicly readable"
  on check_ins for select
  using (expires_at > now());

drop policy if exists "Users can check themselves in" on check_ins;
create policy "Users can check themselves in"
  on check_ins for insert
  with check (auth.uid() = user_id);

-- Needed for "checking in elsewhere moves you" - the app upserts on the
-- user_id primary key, which requires update as well as insert rights.
drop policy if exists "Users can update their own check-in" on check_ins;
create policy "Users can update their own check-in"
  on check_ins for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can check themselves out" on check_ins;
create policy "Users can check themselves out"
  on check_ins for delete
  using (auth.uid() = user_id);
