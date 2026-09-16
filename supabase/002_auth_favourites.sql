-- StudySpot: auth + favourites
-- Run this in the Supabase dashboard: Project -> SQL Editor -> New query -> paste -> Run
--
-- NOTE: this only creates `profiles` and `favourites`. It does NOT touch
-- `study_spots` - that table's schema (slug, walk_minutes, noise_level,
-- crowd_level, study_types, facilities, is_open, available_seats,
-- total_seats, latitude, longitude, ...) already includes geo columns and
-- is owned by whoever set up the live Supabase project the app currently
-- points at. Confirm this table already exists before running the parts
-- below that reference `study_spots (id)`.

-- 1. Profiles: one row per authenticated user, auto-created on signup.
-- Supabase Auth already ships an `auth.users` table - we don't touch that,
-- we just extend it with app-specific fields.
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Users can read their own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

-- Auto-insert a profile row whenever someone signs up
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

-- 2. Favourites: join table between a user and a study spot
create table if not exists favourites (
  user_id uuid not null references auth.users (id) on delete cascade,
  spot_id uuid not null references study_spots (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, spot_id)
);

alter table favourites enable row level security;

create policy "Users can read their own favourites"
  on favourites for select
  using (auth.uid() = user_id);

create policy "Users can add their own favourites"
  on favourites for insert
  with check (auth.uid() = user_id);

create policy "Users can remove their own favourites"
  on favourites for delete
  using (auth.uid() = user_id);
