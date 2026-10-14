-- Reviews for study spots.
-- Run this once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- It is safe to run again.

create table if not exists public.spot_reviews (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references public.study_spots (id) on delete cascade,
  author_name text not null
    check (char_length(btrim(author_name)) between 1 and 40),
  rating smallint not null
    check (rating between 1 and 5),
  comment text not null default ''
    check (char_length(comment) <= 500),
  created_at timestamptz not null default now()
);

-- Reviews from signed-in users (Google / Facebook) are linked to their
-- account. Guest reviews leave these columns empty.
alter table public.spot_reviews
  add column if not exists user_id uuid references auth.users (id) on delete cascade,
  add column if not exists author_avatar_url text,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists spot_reviews_spot_id_created_at_idx
  on public.spot_reviews (spot_id, created_at desc);

-- One review per signed-in user per spot (guests are not limited,
-- since NULL user_ids never conflict).
create unique index if not exists spot_reviews_spot_id_user_id_key
  on public.spot_reviews (spot_id, user_id);

alter table public.spot_reviews enable row level security;

-- Anyone using the app can read reviews.
drop policy if exists "Reviews are public" on public.spot_reviews;
create policy "Reviews are public"
  on public.spot_reviews
  for select
  to anon, authenticated
  using (true);

-- Guests can post unlinked reviews; signed-in users can only post
-- reviews linked to their own account.
drop policy if exists "Anyone can post a review" on public.spot_reviews;
create policy "Anyone can post a review"
  on public.spot_reviews
  for insert
  to anon, authenticated
  with check (user_id is null or user_id = auth.uid());

-- Signed-in users can edit and delete their own reviews.
drop policy if exists "Users can update their own reviews" on public.spot_reviews;
create policy "Users can update their own reviews"
  on public.spot_reviews
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Users can delete their own reviews" on public.spot_reviews;
create policy "Users can delete their own reviews"
  on public.spot_reviews
  for delete
  to authenticated
  using (user_id = auth.uid());

grant select, insert on public.spot_reviews to anon;
grant select, insert, update, delete on public.spot_reviews to authenticated;

-- Push review changes to open apps in real time.
do $$
begin
  alter publication supabase_realtime add table public.spot_reviews;
exception
  when duplicate_object then null;
end $$;
