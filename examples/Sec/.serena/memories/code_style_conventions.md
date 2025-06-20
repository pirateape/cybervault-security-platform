# Code Style & Conventions

## Backend (Python)

- Follows PEP8 (indentation, naming, docstrings)
- Type hints used in all new code
- Use `pytest` for tests, `requests` for HTTP, `pydantic` for validation
- All PK/FK fields must be valid UUIDs (see README/Architecture.md)
- Use `python-dotenv` for env vars
- RBAC enforced for all destructive actions
- Use `passlib[bcrypt]` for password hashing

## Frontend (TypeScript/React)

- Modular components in `/src/components`, pages in `/src/pages`
- Use React Context for auth/org state
- Use Zod for schema validation
- Use React Query for data fetching
- Use Chakra UI for all UI components
- Use Prettier and ESLint for formatting/linting
- Use type-only imports for ESM packages
- Never expose secrets to the client

## Testing

- Place unit/integration tests in `/tests/unit` and `/tests/integration`
- E2E tests in `/frontend/src/e2e` (Playwright)
- Use fixtures/mocks for backend tests

See README.md and Architecture.md for more.
