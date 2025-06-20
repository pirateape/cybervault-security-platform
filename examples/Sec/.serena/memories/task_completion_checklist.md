# Task Completion Checklist

- Run all backend tests: `pytest`
- Run all frontend tests: `npm run test` (or E2E: `npm run e2e:dev`)
- Lint and format code: `npm run lint`, `npm run format`
- Ensure all new/changed code is covered by tests
- Update documentation (README.md, Architecture.md, Tasks.md)
- Confirm all environment variables are set in `.env` and `/frontend/.env`
- For DB/test data changes: re-seed using `python tests/integration/seed_supabase_auth_users.py` and `python tests/integration/seed_test_db_rest.py`
- For E2E: ensure dev server is running, all test users/orgs/data are seeded, and Playwright config is correct
- Commit with Conventional Commits
- Push to feature branch and open PR

See Tasks.md for ongoing improvements and recommendations.
