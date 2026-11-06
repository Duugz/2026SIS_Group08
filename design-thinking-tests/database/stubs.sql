-- Minimal stand-ins for what Supabase provides
create role anon nologin; create role authenticated nologin;
create schema auth; grant usage on schema auth to anon, authenticated;
create table auth.users (id uuid primary key);
create function auth.uid() returns uuid language sql stable as
$$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant execute on function auth.uid() to anon, authenticated;
create publication supabase_realtime;
grant usage on schema public to anon, authenticated;
create table public.study_spots (id uuid primary key default gen_random_uuid(), name text);
insert into public.study_spots (id, name) values ('11111111-1111-1111-1111-111111111111','UTS Library Level 5');
insert into auth.users values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'), ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
