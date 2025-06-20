# Testing, Formatting, and Linting Commands

## Backend

- `pytest` — Run all backend tests
- `pip install -r requirements.txt` — Install backend dependencies

## Frontend

- `npm run lint` — Lint frontend code
- `npm run format` — Format frontend code
- `npm run test` — Run frontend unit/integration tests
- `npm run e2e:dev` — Run Playwright E2E tests (dev server must be running)
- `npm run e2e:full` — Start dev server and run E2E tests sequentially

## E2E

- `python tests/integration/seed_supabase_auth_users.py` — Seed Supabase Auth users
- `python tests/integration/seed_test_db_rest.py` — Seed DB with test users/orgs/data

See README.md and frontend/README.md for more.
