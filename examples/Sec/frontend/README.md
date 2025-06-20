# Security Compliance Tool Frontend

## Overview

This is the frontend dashboard for the Security Compliance Tool, built with React, Vite, Chakra UI, React Query, Zod, Supabase-js, and MSAL. It provides:

- Organization onboarding
- Secure credential management
- Scan triggers and results dashboards
- Compliance status and user management

## Stack

- **React + Vite**: SPA foundation
- **Chakra UI**: Accessible component library
- **React Query**: Data fetching and caching
- **Zod**: Schema validation
- **Supabase-js**: Real-time data and auth
- **MSAL**: Microsoft authentication
- **react-hook-form**: Form state management

## Project Structure

```
/frontend
  ├── src/
  │   ├── components/      # Reusable UI components (tables, etc.)
  │   ├── pages/           # Route-level pages (Dashboard, Onboarding, UserManagement, etc.)
  │   ├── hooks/           # Custom React hooks
  │   ├── context/         # React context providers (auth, org, etc.)
  │   ├── api/             # API clients and query logic
  │   ├── utils/           # Utility functions (supabaseClient, etc.)
  │   ├── App.tsx          # Main app shell
  │   └── main.tsx         # Entry point
  ├── public/              # Static assets
  ├── package.json         # NPM dependencies
  └── ...
```

## Setup

1. `cd frontend`
2. `npm install`
3. Copy `.env.example` to `.env` and fill in Supabase/MSAL values
   - **Important:** The `.env` file must be present and contain valid `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for authentication to work. If missing or incorrect, login and E2E tests will fail.
4. `npm run dev`

## Core Features

- **Authentication**: Supabase Auth and/or MSAL for user/org login
- **Org Onboarding**: UI for registering and managing organizations and Microsoft credentials
- **Credential Management**: Secure forms for storing/updating org credentials (backend only)
- **Scan Dashboard**: Trigger scans, view results, compliance status (see `/` route)
- **User Management**: Invite/manage users, assign roles (see `/users` route)
- **Robust Error Handling**: All queries and mutations use robust error typing and display
- **Modular Components**: Results and user tables are modularized for reuse

## Best Practices

- Use React Context for auth/org state
- Use Zod for all form/API validation
- Use React Query for robust data fetching
- Modularize components and logic for maintainability
- Never expose secrets to the client; all sensitive actions go through backend APIs
- In E2E tests, always wait for async state (e.g., orgId, user.id) to be ready before interacting with UI elements. After login, wait for both the dashboard heading and the scan trigger button to be enabled. Before submitting a scan, wait for the Start Scan button to be enabled. This avoids race conditions and test flakiness.

## E2E Automation Scripts

- `npm run e2e:dev`: Runs Playwright E2E tests. Assumes the dev server is already running on http://localhost:5173.
- `npm run e2e:full`: Starts the dev server and runs Playwright E2E tests sequentially (for automation or CI; may require manual server shutdown after).
- **Best Practice:** For local development, use two terminals: one for `npm run dev`, one for `npm run e2e:dev`. For automation, use `npm run e2e:full` (see Tasks.md for reliability improvements).

## E2E User Management Tests (2024-06)

- Playwright E2E tests for user disable/enable/delete flows are implemented in `src/e2e/userManagement.spec.ts`.
- Edge/negative cases (cannot disable/delete self, last admin, RBAC, etc.) are now tested.
- Recommendations: Ensure test users (admin, non-admin, last admin) are seeded in Supabase for E2E reliability. Add audit log assertions as features are implemented.
- See Tasks.md for ongoing E2E coverage and reliability tracking.

## Component Modularization (2024-06)

- ResultsTable and MetadataEditor are now modular reusable components in src/components/.
- This improves project structure, reusability, and maintainability following React best practices.

## Next Steps

- Connect dashboard to backend APIs for scan triggers
- Add user removal/disable actions
- Add frontend tests and CI/CD
- Modularize tables/components further as features grow

## Troubleshooting

- **Login/E2E Test Failures:**
  - Ensure `.env` is present and correct in `/frontend`.
  - Check that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` match your Supabase project.
  - Confirm the test user (`testuser@example.com`) exists and is confirmed in the Supabase dashboard (Auth > Users).
  - If using the seeding script, ensure it sets `email_confirm: True`.
  - If login still fails, check browser console and network tab for errors.
- If E2E tests fail due to missing org/user or disabled buttons, check that the test waits for all async state to be ready. See Tasks.md for more details and improvements.

## Debug Logging & Troubleshooting

- Debug logging is present for scan trigger mutation and API calls. All mutation starts, successes, and errors are logged to the browser console.
- API calls log request parameters, responses, and errors to the console.
- For production, consider using a logging library (e.g., loglevel, debug) for more robust log management.
- Use browser console logs to diagnose E2E and runtime issues.

## E2E Test Coverage

- Playwright E2E tests cover scan trigger, user management, and edge cases. Debug logs are helpful for diagnosing test failures.
- See Tasks.md for ongoing E2E coverage and troubleshooting.

## Navigation Bar (2024-06)

- Added a NavBar component with links to Dashboard, User Management, and Onboarding.
- Navigation is now consistent and accessible across the app.

## UI/UX Improvements (2024-06)

- **Login Page:**
  - Organization logo and branding
  - Info section: "Why do I need to log in?"
  - Microsoft login button with icon (requires `react-icons/fa`)
  - Improved error and loading feedback
  - Accessibility: ARIA attributes, focus management
- **Dashboard/Scan:**
  - Step-by-step scan guide (info alert)
  - Tooltips and help icons (requires `@chakra-ui/icons`)
  - Improved error feedback and empty state illustration
  - Sortable results table (requires `@chakra-ui/icons`)

### Requirements

- Install `react-icons` and `@chakra-ui/icons`:
  ```sh
  npm install react-icons @chakra-ui/icons
  ```
- See `../Tasks.md` for outstanding UI and dependency tasks.

## Performance & Code Splitting (2025-06)

- Vite config uses manualChunks to split vendor, UI, data, charts, forms, auth, and utils into separate bundles for optimal performance.
- All non-critical components (AI code editor, charts, reporting modules) should be loaded with React.lazy() and Suspense.
- Monitor bundle analysis output after each build for large chunks (>500kB).
- Use @tanstack/react-virtual for large tables/lists.
- See Tasks.md for ongoing performance and optimization tracking.

### Uncaught ReferenceError: process is not defined

- This error occurs if you use process.env in frontend code. Vite does not provide process.env in the browser; use import.meta.env instead.
- **Fix:** Replace all process.env.VITE*\* usages with import.meta.env.VITE*\*. See src/utils/supabaseClient.ts for an example.

## Environment Variables (Vite)

- All frontend environment variables must be prefixed with VITE* and accessed via import.meta.env.VITE*\*. Do not use process.env in frontend code.
- See Vite documentation: https://vitejs.dev/guide/env-and-mode.html
