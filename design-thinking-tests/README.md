# Design Thinking tests: Study Spot Reviews & Social Sharing

## Unit tests (Jest), 25 tests
The tests import `./reviews` and `./sharing`, so copy `src/services/reviews.ts` and
`src/services/sharing.ts` into `unit/`. In those copies, point the imports at the mocks:
`'../lib/supabase'` -> `'./mocks/supabase'`, `'react-native'` -> `'./mocks/react-native'`,
`'./studySpots'` -> `'./mocks/studySpots'`. Then:

    npm i -D jest ts-jest @types/jest typescript@~5.9.2
    npx jest --verbose

## Database tests (PostgreSQL 16), 21 tests
Runs `supabase/migrations/20260925_spot_reviews.sql` against a local Postgres with
Supabase-style `anon` / `authenticated` roles and `auth.uid()` (see stubs.sql):

    createdb t && psql -d t -f stubs.sql && psql -d t -f 20260925_spot_reviews.sql
    python3 run_db_tests.py      # edit the psql host/port at the top of the script if needed
