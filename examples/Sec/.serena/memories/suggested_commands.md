# Suggested Commands for Development

## Backend

- `pip install -r requirements.txt` — Install backend dependencies
- `uvicorn api:app --reload` — Run FastAPI backend
- `pytest` — Run all backend tests
- `python tests/integration/seed_supabase_auth_users.py` — Seed Supabase Auth users
- `python tests/integration/seed_test_db_rest.py` — Seed DB with test users/orgs/data (REST-based, primary method)

## Frontend

- `cd frontend && npm install` — Install frontend dependencies
- `npm run dev` — Start frontend dev server
- `npm run lint` — Lint frontend code
- `npm run format` — Format frontend code
- `npm run e2e:dev` — Run Playwright E2E tests (dev server must be running)
- `npm run e2e:full` — Start dev server and run E2E tests sequentially

## Utilities

- `ls`, `cd`, `cat`, `type` (Windows), `findstr` (Windows grep), `git` — Standard file and version control commands

## Environment

- Set environment variables in `.env` (backend) and `/frontend/.env` (frontend)
- Use `python-dotenv` for backend local dev

See README.md for troubleshooting and more details.
