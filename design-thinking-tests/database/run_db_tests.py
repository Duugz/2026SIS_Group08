"""Run the spot_reviews migration's rules against a local PostgreSQL that mimics
Supabase's anon / authenticated roles and auth.uid(). Each test runs in its own
transaction as the given role and user."""
import subprocess, sys

SPOT = "11111111-1111-1111-1111-111111111111"
ANA = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
BEN = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"

def run(sql, role, uid=""):
    script = (
        "begin;\n"
        f"set local role {role};\n"
        f"select set_config('request.jwt.claim.sub', '{uid}', true);\n"
        f"{sql}\n"
        "commit;\n"
    )
    p = subprocess.run(
        ["psql", "-h", "/tmp/pg", "-p", "5544", "-U", "postgres", "-d", "t",
         "-v", "ON_ERROR_STOP=1", "-X", "-q", "-t", "-A"],
        input=script, capture_output=True, text=True)
    return p.returncode, (p.stdout + p.stderr).strip()

results = []
def test(name, sql, role, uid, expect, contains=None):
    code, out = run(sql, role, uid)
    last = out.splitlines()[-1] if out else ""
    if expect == "ok":
        ok = code == 0 and (contains is None or contains in out)
    else:  # expect error
        ok = code != 0 and (contains is None or contains in out)
    results.append(ok)
    detail = last if expect == "error" else (contains or "ok")
    print(f"{'PASS' if ok else 'FAIL'}  {name}\n      -> {detail}")

ins = lambda uid_expr, rating=4, name="Guest", comment="Quiet, good Wi-Fi": (
    f"insert into public.spot_reviews (spot_id, user_id, author_name, rating, comment) "
    f"values ('{SPOT}', {uid_expr}, '{name}', {rating}, '{comment}') returning 'inserted';")

print("== Database rules (constraints) ==")
test("Guest can post a review (user_id null)", ins("null"), "anon", "", "ok", "inserted")
test("Rating 6 is rejected by the database", ins("null", rating=6), "anon", "", "error", "spot_reviews_rating_check")
test("Rating 0 is rejected by the database", ins("null", rating=0), "anon", "", "error", "spot_reviews_rating_check")
test("Blank name is rejected", ins("null", name="   "), "anon", "", "error", "author_name_check")
test("41-character name is rejected", ins("null", name="a" * 41), "anon", "", "error", "author_name_check")
test("501-character comment is rejected", ins("null", comment="x" * 501), "anon", "", "error", "comment_check")

print("\n== Row-level security (who may do what) ==")
test("Guest cannot post as a signed-in user (spoofed user_id)", ins(f"'{ANA}'"), "anon", "", "error", "row-level security")
test("Signed-in user cannot post under someone else's id", ins(f"'{BEN}'"), "authenticated", ANA, "error", "row-level security")
test("Signed-in user posts under own id", ins(f"'{ANA}'", name="Ana"), "authenticated", ANA, "ok", "inserted")
test("Second review by the same user on the same spot is blocked", ins(f"'{ANA}'", name="Ana"), "authenticated", ANA, "error", "spot_reviews_spot_id_user_id_key")
test("Different user can review the same spot", ins(f"'{BEN}'", name="Ben"), "authenticated", BEN, "ok", "inserted")
test("Guests are not limited to one review (second guest review allowed)", ins("null"), "anon", "", "ok", "inserted")
test("Anyone can read reviews",
     "select count(*) from public.spot_reviews;", "anon", "", "ok", "4")
test("Guest cannot update any review (no permission)",
     "update public.spot_reviews set rating = 1;", "anon", "", "error", "permission denied")
test("Guest cannot delete any review (no permission)",
     "delete from public.spot_reviews;", "anon", "", "error", "permission denied")
test("Ben's update of Ana's review changes 0 rows",
     f"with u as (update public.spot_reviews set rating = 1 where user_id = '{ANA}' returning 1) select 'rows='||count(*) from u;",
     "authenticated", BEN, "ok", "rows=0")
test("Ben's delete of Ana's review changes 0 rows",
     f"with d as (delete from public.spot_reviews where user_id = '{ANA}' returning 1) select 'rows='||count(*) from d;",
     "authenticated", BEN, "ok", "rows=0")
test("Ana can edit her own review",
     f"with u as (update public.spot_reviews set rating = 5 where user_id = '{ANA}' returning 1) select 'rows='||count(*) from u;",
     "authenticated", ANA, "ok", "rows=1")
test("Ana cannot hand her review to Ben (with check on update)",
     f"update public.spot_reviews set user_id = '{BEN}' where user_id = '{ANA}';",
     "authenticated", ANA, "error", "row-level security")
test("Ana can delete her own review",
     f"with d as (delete from public.spot_reviews where user_id = '{ANA}' returning 1) select 'rows='||count(*) from d;",
     "authenticated", ANA, "ok", "rows=1")

print("\n== Realtime publication ==")
test("spot_reviews is in the supabase_realtime publication",
     "select tablename from pg_publication_tables where pubname = 'supabase_realtime';",
     "authenticated", "", "ok", "spot_reviews")

print(f"\n{sum(results)}/{len(results)} database tests passed")
sys.exit(0 if all(results) else 1)
