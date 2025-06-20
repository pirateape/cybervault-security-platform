# Project Structure

- `/frontend`: React SPA dashboard (Vite, Chakra UI, React Query, Zod, Supabase-js, MSAL)
  - `/src/components`: Reusable UI components
  - `/src/pages`: Route-level pages
  - `/src/api`: API clients
  - `/src/context`: React context providers
  - `/src/e2e`: Playwright E2E tests
  - `/src/utils`: Utility functions
  - `/src/__tests__`: Unit/integration tests
- `/tests`: Backend unit/integration tests, seeding scripts
  - `/integration`: Integration tests, DB/Auth seeding scripts
  - `/unit`: Unit tests
- `/test-results`: Playwright/browsermcp E2E results
- `api.py`, `auth.py`, `ms_api.py`, `supabase_client.py`: Backend entrypoints
- `db_schema.sql`: DB schema
- `Architecture.md`, `README.md`, `Tasks.md`: Docs

See README.md and Architecture.md for more details.
