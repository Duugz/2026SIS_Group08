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

-- Second wave of seed data, spreading out from campus into the wider
-- Sydney CBD - walk_minutes is approximate, measured from UTS.
insert into study_spots (
  slug, name, description, latitude, longitude, walk_minutes,
  noise_level, crowd_level, study_types, facilities, is_open,
  available_seats, total_seats
)
values
  ('the-goods-line', 'The Goods Line Study Steps', 'Outdoor amphitheatre seating and tables on the old rail corridor right by UTS', -33.8820, 151.1986, 3, 'moderate', 'moderate', '{solo,group}', '{wifi}', true, 25, 60),
  ('haymarket-study-hub', 'Haymarket Study Hub', 'Late-opening study room near Chinatown and Paddy''s Markets', -33.8805, 151.2037, 6, 'moderate', 'moderate', '{solo,group}', '{power,wifi,food}', true, 12, 30),
  ('prince-alfred-park-lawn', 'Prince Alfred Park Lawn', 'Open green space near Central Station, popular for outdoor group study', -33.8858, 151.1998, 8, 'quiet', 'quiet', '{solo,group}', '{}', true, 35, 40),
  ('pyrmont-library', 'Pyrmont Library', 'Local council library with bookable group rooms', -33.8701, 151.1952, 18, 'quiet', 'quiet', '{solo,group}', '{power,wifi,toilets}', true, 10, 35),
  ('darling-harbour-promenade', 'Darling Harbour Promenade', 'Waterside tables and cafes, good for casual laptop work', -33.8737, 151.2010, 15, 'busy', 'busy', '{solo,group}', '{wifi,food,toilets}', true, 15, 50),
  ('state-library-nsw', 'State Library of NSW', 'Grand reading rooms plus a dedicated postgrad research room', -33.8687, 151.2109, 22, 'quiet', 'moderate', '{solo}', '{power,wifi,toilets}', true, 30, 120),
  ('customs-house-library', 'Customs House Library', 'Council library at Circular Quay with harbour views and quiet floors', -33.8609, 151.2090, 28, 'quiet', 'quiet', '{solo,group}', '{power,wifi,toilets}', true, 20, 60),
  ('martin-place-study-pods', 'Martin Place Study Pods', 'Co-working style seating in the heart of the financial district', -33.8675, 151.2086, 25, 'moderate', 'busy', '{solo}', '{power,wifi,food}', true, 8, 20)
on conflict (slug) do nothing;

-- Third wave of seed data - filling out the CBD further so there's
-- enough coverage for real check-in data to be meaningful once it's
-- collected. walk_minutes is still approximate distance from UTS.
insert into study_spots (
  slug, name, description, latitude, longitude, walk_minutes,
  noise_level, crowd_level, study_types, facilities, is_open,
  available_seats, total_seats
)
values
  ('uts-tower-study-lounge', 'UTS Tower Study Lounge', 'Quiet corners tucked into the UTS Tower building foyer', -33.8833, 151.2005, 2, 'quiet', 'quiet', '{solo}', '{power,wifi}', true, 14, 30),
  ('chau-chak-wing-reading-room', 'Dr Chau Chak Wing Building Reading Room', 'Reading room inside the Frank Gehry-designed UTS Business School', -33.8823, 151.1989, 5, 'quiet', 'quiet', '{solo}', '{power,wifi,toilets}', true, 20, 45),
  ('carriageworks-foyer', 'Carriageworks Foyer', 'High-ceilinged foyer of the old rail workshops, now an arts venue', -33.8936, 151.1945, 15, 'moderate', 'moderate', '{solo,group}', '{wifi,food,toilets}', true, 18, 40),
  ('ultimo-community-centre', 'Ultimo Community Centre', 'Local council meeting rooms available for quiet study', -33.8798, 151.1958, 10, 'quiet', 'quiet', '{solo,group}', '{power,wifi,toilets}', true, 12, 25),
  ('wentworth-park-edge', 'Wentworth Park Edge', 'Grassy edge of Wentworth Park, popular for outdoor reading', -33.8776, 151.1912, 14, 'quiet', 'quiet', '{solo,group}', '{}', true, 30, 50),
  ('chippendale-green', 'Chippendale Green', 'Small urban park surrounded by cafes and galleries', -33.8870, 151.1978, 9, 'moderate', 'moderate', '{solo,group}', '{wifi}', true, 20, 35),
  ('spice-alley-courtyard', 'Spice Alley Courtyard', 'Hawker-style laneway courtyard, casual and lively', -33.8869, 151.1988, 8, 'busy', 'busy', '{solo,group}', '{wifi,food,toilets}', true, 15, 40),
  ('broadway-food-court-nook', 'Broadway Shopping Centre Food Court Nook', 'Tables tucked away from the main food court crowd', -33.8838, 151.1976, 4, 'busy', 'busy', '{solo,group}', '{wifi,food,toilets}', true, 10, 30),
  ('world-square-plaza', 'World Square Plaza', 'Open plaza seating between shops and cafes', -33.8770, 151.2062, 18, 'busy', 'busy', '{solo,group}', '{wifi,food,toilets}', true, 20, 50),
  ('dixon-house-food-court', 'Dixon House Food Court', 'Chinatown food court with cheap eats and free Wi-Fi', -33.8797, 151.2055, 12, 'busy', 'busy', '{solo,group}', '{wifi,food,toilets}', true, 15, 45),
  ('belmore-park', 'Belmore Park', 'Green space next to Central Station, handy between classes', -33.8822, 151.2062, 10, 'moderate', 'moderate', '{solo,group}', '{}', true, 25, 40),
  ('railway-square-steps', 'Railway Square Steps', 'Sunny steps near Central, popular for a quick laptop session', -33.8818, 151.1994, 6, 'moderate', 'moderate', '{solo}', '{wifi}', true, 12, 25),
  ('thomas-street-study-corner', 'Thomas Street Study Corner', 'Compact study room above a Haymarket cafe', -33.8807, 151.2020, 7, 'quiet', 'moderate', '{solo}', '{power,wifi,food}', true, 8, 18),
  ('town-hall-forecourt', 'Sydney Town Hall Forecourt', 'Open forecourt outside Town Hall station, good for a change of scenery', -33.8732, 151.2057, 20, 'moderate', 'moderate', '{solo,group}', '{wifi}', true, 20, 40),
  ('qvb-atrium', 'Queen Victoria Building Atrium', 'Heritage shopping arcade with upper-level seating', -33.8721, 151.2067, 21, 'moderate', 'busy', '{solo}', '{wifi,food,toilets}', true, 10, 30),
  ('hyde-park-north', 'Hyde Park North', 'Tree-lined lawns near the Archibald Fountain', -33.8714, 151.2113, 24, 'quiet', 'quiet', '{solo,group}', '{}', true, 40, 60),
  ('hyde-park-south', 'Hyde Park South', 'Quieter end of the park near the Anzac Memorial', -33.8766, 151.2111, 22, 'quiet', 'quiet', '{solo,group}', '{}', true, 35, 55),
  ('cook-phillip-park', 'Cook and Phillip Park', 'Park next to the aquatic centre, shaded seating available', -33.8744, 151.2127, 24, 'quiet', 'quiet', '{solo,group}', '{toilets}', true, 20, 35),
  ('wynyard-park', 'Wynyard Park', 'Small city park popular with office workers on lunch breaks', -33.8655, 151.2063, 27, 'moderate', 'busy', '{solo}', '{wifi}', true, 15, 30),
  ('barrack-street-study-nook', 'Barrack Street Study Nook', 'Co-working style seating tucked between CBD office towers', -33.8678, 151.2065, 26, 'moderate', 'busy', '{solo}', '{power,wifi,food}', true, 6, 15),
  ('tumbalong-park', 'Tumbalong Park', 'Darling Harbour''s main lawn, lively but spacious', -33.8754, 151.2017, 16, 'busy', 'moderate', '{solo,group}', '{wifi,toilets}', true, 30, 60),
  ('barangaroo-reserve', 'Barangaroo Reserve', 'Harbourside headland park with plenty of open space', -33.8610, 151.1988, 30, 'quiet', 'quiet', '{solo,group}', '{}', true, 40, 70),
  ('rocks-discovery-museum-courtyard', 'The Rocks Discovery Museum Courtyard', 'Quiet sandstone courtyard in the historic Rocks precinct', -33.8597, 151.2070, 31, 'quiet', 'quiet', '{solo}', '{toilets}', true, 10, 20),
  ('pyrmont-bay-park', 'Pyrmont Bay Park', 'Waterfront park with views of Darling Harbour', -33.8698, 151.1958, 17, 'quiet', 'moderate', '{solo,group}', '{wifi}', true, 20, 40),
  ('crown-street-study-cafe', 'Crown Street Study Cafe', 'Laptop-friendly cafe strip through Surry Hills', -33.8853, 151.2112, 17, 'moderate', 'busy', '{solo,group}', '{wifi,food,toilets}', true, 10, 25),
  ('taylor-square', 'Taylor Square', 'Open square at the edge of Surry Hills and Darlinghurst', -33.8807, 151.2157, 20, 'moderate', 'moderate', '{solo,group}', '{wifi}', true, 15, 30)
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
