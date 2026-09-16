-- StudySpot: study_spots table
-- Run this in the Supabase dashboard: Project -> SQL Editor -> New query -> paste -> Run
--
-- Schema matches src/services/studySpots.ts (the Map/Discover data layer)
-- rather than the app's original mock-up columns, so a fresh project ends
-- up with the same table shape the live app already depends on. If you're
-- running this against the team's existing Supabase project, check the
-- table already exists first - this is only needed to provision a new one.

create table if not exists study_spots (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  latitude numeric(9, 6) not null,
  longitude numeric(9, 6) not null,
  walk_minutes integer not null default 0,
  noise_level text not null default 'quiet' check (noise_level in ('quiet', 'moderate', 'busy')),
  crowd_level text not null default 'quiet' check (crowd_level in ('quiet', 'moderate', 'busy')),
  study_types text[] not null default '{}', -- subset of: solo, group
  facilities text[] not null default '{}',  -- subset of: power, wifi, food, toilets
  is_open boolean not null default true,
  available_seats integer not null default 0,
  total_seats integer not null default 0,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Row Level Security: public read access, writes reserved for the
-- dashboard/SQL editor for now (no admin UI yet).
alter table study_spots enable row level security;

create policy "Public read access"
  on study_spots
  for select
  using (true);

-- Sample data so a fresh project has something to display immediately.
-- Skipped automatically if rows already exist (see the slug unique constraint).
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
