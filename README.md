# sec-comp

A modern web application using React 18, TypeScript, and Supabase.

## Project Overview

This project is designed as a secure, scalable, and maintainable web application leveraging the latest technologies:

- **React 18** for the frontend UI
- **TypeScript** for type safety and maintainability
- **Supabase** as the backend (database, authentication, storage)
- **GitHub Actions** for CI/CD automation

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Supabase account and project

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/sec-comp.git
cd sec-comp

# Install dependencies
npm install
# or
yarn install
```

### Environment Variables

Create a `.env` file in the project root and add your Supabase credentials:

```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Running Locally

```bash
npm run dev
# or
yarn dev
```

### Seeding Supabase Auth and Database (Local/CI/E2E)

To populate Supabase Auth and database tables with deterministic test data for local development, integration, or E2E testing, use the provided seed script:

**Prerequisites:**

- Supabase project with the required tables and Auth enabled
- Service role key (for admin operations)
- Environment variables set in `.env`:
  ```
  SUPABASE_URL=your-supabase-url
  SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
  ```
- Install dependencies:
  ```bash
  npm install @supabase/supabase-js dotenv bcryptjs
  ```

**Usage:**

- For ESM projects ("type": "module" in package.json):
  ```bash
  npm run seed
  # or
  npx ts-node --loader ts-node/esm scripts/seed.ts
  ```
- For CommonJS projects:
  ```bash
  npx ts-node scripts/seed.ts
  ```
- The script is idempotent: it can be run multiple times safely.
- It will create/update test users in both Supabase Auth and the `users` table, and seed related tables (`scans`, `results`, `audit_logs`).
- Output will summarize all seeded data.

## Environment Variables Setup

### Local Development

- Create a `.env` file in the project root with:
  ```
  VITE_SUPABASE_URL=your-supabase-url
  VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
  ```

### GitHub Actions (CI/CD)

- Go to your GitHub repository > Settings > Secrets and variables > Actions > New repository secret
- Add the following secrets:
  - `VITE_SUPABASE_URL`: Your Supabase project URL
  - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
- For deployment, also add:
  - `SUPABASE_ACCESS_TOKEN`: Your Supabase access token (for CLI deploy)
  - `SUPABASE_PROJECT_ID`: Your Supabase project reference ID
- These secrets will be used by the GitHub Actions workflow for secure builds and deployments.

## CI/CD Pipeline

- Automated with **GitHub Actions**
- On push or PR to `main`, the pipeline will:
  - Install dependencies
  - Run tests
  - Deploy to staging/production (if configured)
- See `.github/workflows/` for pipeline configuration

## Branch Protection & Repository Permissions

- **Main branch protection**: Enable branch protection rules for `main` to require pull request reviews before merging, enforce status checks (CI must pass), and prevent force pushes.
- **Required reviews**: Set at least one required reviewer for all pull requests.
- **Status checks**: Require all CI checks (tests, build, lint) to pass before merging.
- **Secret management**: Store sensitive environment variables (e.g., Supabase keys, tokens) in GitHub Secrets, not in code or public settings.
- **Access control**: Use GitHub Teams or Collaborators to manage write/admin access. Grant the least privilege necessary.
- **Dependabot**: Enable Dependabot for automated dependency updates and security alerts.

## License

MIT

## Monorepo Architecture

This project uses a scalable Nx monorepo structure for both frontend (Next.js/React) and backend (API/Supabase), following industry best practices for maintainability and code sharing.

### Folder Structure

```
root/
├── apps/
│   ├── web/           # Next.js frontend app
│   ├── api/           # Node.js backend app (Express/Fastify/serverless)
│   ├── web-e2e/       # E2E test runner (Playwright/Cypress)
├── libs/
│   ├── ui/            # Shared React UI components (Shadcn UI, Tailwind)
│   ├── utils/         # Shared utilities
│   ├── data-access/   # Supabase/Postgres client logic
│   ├── types/         # Shared TypeScript types/interfaces
│   ├── hooks/         # Shared React hooks
│   ├── auth/          # Shared authentication logic
├── tools/             # Custom Nx scripts/generators (optional)
├── dist/              # Build output (auto-generated)
├── nx.json
├── package.json
├── tsconfig.base.json
├── .eslintrc.base.json
└── ...
```

### Rationale

- **apps/**: Contains all application entry points (frontend, backend, e2e, etc.)
- **libs/**: Contains all shared code, utilities, and domain logic for maximum code reuse
- **tools/**: For custom scripts and Nx generators
- **dist/**: Auto-generated build output
- **Root config files**: Centralized configuration for Nx, TypeScript, ESLint, etc.

This structure enables scalable development, strict module boundaries, and efficient CI/CD workflows. Use Nx Console or CLI to generate and manage apps/libraries, and enforce boundaries with Nx ESLint rules.

## Organization-Based Role Enforcement for FastAPI Endpoints

This project uses a robust, DRY, and testable pattern for enforcing multi-tenant, role-based access control on all sensitive FastAPI endpoints. This is achieved via the `require_org_role` dependency, which ensures that only users with the correct role in the correct organization can perform privileged actions.

### Usage

Import and use the dependency in your endpoint:

```python
from auth import require_org_role

@app.post("/users/{user_id}/disable")
def disable_user(org_id: str = Query(...), user_id: str = Path(...), role_check=Depends(require_org_role("org_id", "admin")), current_user=Depends(auth.get_current_user)):
    # ... endpoint logic ...
```

- The dependency will extract the user from the JWT, check their membership and role in the specified org via the `org_members` table, and raise a 403 if not authorized.
- The role hierarchy is enforced (owner > admin > member > user).
- Inline role checks are no longer needed—use the dependency for all org-scoped sensitive endpoints.

### Rationale

- This pattern ensures consistent, maintainable, and secure enforcement of access control across all API endpoints.
- It mirrors the middleware pattern used in Supabase Edge Functions, and aligns with Supabase RLS policies for defense-in-depth.
- Tests cover access granted/denied for various org/role scenarios, including non-members and insufficient roles.

### Adding to New Endpoints

- For any endpoint that should be restricted by org/role, add `role_check=Depends(require_org_role("org_id", "admin"))` (or the appropriate role) to the function signature.
- Remove any redundant inline role checks.

### Further Reading

- See `examples/Sec/auth.py` for the dependency implementation.
- See `examples/Sec/api.py` for usage examples.
- See `examples/Sec/tests/integration/test_api.py` for test coverage.

## Session Expiry and Refresh Token Security

The test suite includes coverage for session expiration and refresh token flows:

- Simulates expired access tokens to ensure session expiry is enforced on all protected endpoints.
- If refresh tokens are supported, tests both valid and invalid/expired refresh token scenarios.
- These tests help ensure that users cannot access resources after their session expires, and that refresh tokens are handled securely.

See `examples/Sec/tests/integration/test_api.py` for details.

## Backend Structure

- **Production Backend:** All production Python/FastAPI backend code is now located in `apps/api/`.
  - Main app entrypoint: `apps/api/main.py`
  - Auth, Microsoft Graph, Supabase, and Azure Key Vault modules are in this directory.
  - Integration tests are in `apps/api/tests/integration/`.
- **Example/Demo Code:** The `examples/` directory is reserved for demo, prototype, or reference code only. No code in `examples/` is used in production.

## Running the Backend

```sh
# Start the production FastAPI backend
cd apps/api
uvicorn main:app --reload
```

## Supabase Integration

This project uses [Supabase](https://supabase.com/) for database, authentication, and storage. Both frontend and backend services interact with Supabase using environment variables and the official SDKs.

### Required Environment Variables

- `SUPABASE_URL`: Your Supabase project URL (required for all clients)
- `SUPABASE_ANON_KEY`: Public/anon key (frontend/public, limited access)
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (backend/admin, full access)
- `SUPABASE_KEY`: (Ambiguous; use either anon or service role as appropriate)
- (Optional) `SUPABASE_ACCESS_TOKEN`: For CLI/automation
- (Optional) `SUPABASE_PROJECT_ID`: For CLI/automation

### Local Development

- Add the following to your `.env` file:
  ```
  SUPABASE_URL=your-supabase-url
  SUPABASE_ANON_KEY=your-supabase-anon-key
  SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
  # SUPABASE_KEY=your-supabase-key (if used)
  ```
- The frontend typically uses the anon key, while backend services (FastAPI, scripts) use the service role key for admin operations.

### Usage Patterns

- **Frontend:** Uses `@supabase/supabase-js` with anon key for user auth and public data access.
- **Backend:** Uses `supabase-py` or REST API with service role key for privileged operations (e.g., seeding, admin, audit logs).
- **Edge Functions:** Use the service role key for secure, server-side logic.

### Security Best Practices

- Never expose the service role key in frontend or public code.
- Store all secrets in environment variables or GitHub Actions secrets.
- Use Row Level Security (RLS) and policies in Supabase for defense-in-depth.

### References

- [Supabase Docs](https://supabase.com/docs/)
- [supabase-py (Python)](https://github.com/supabase-community/supabase-py)
- [@supabase/supabase-js (JS/TS)](https://github.com/supabase/supabase-js)

# Storybook & UI Development

## Quick Start

- **Run Storybook:**

  ```sh
  npm run storybook
  ```

  Opens Storybook at http://localhost:6006/ for live UI development and review.

- **Build Static Storybook:**

  ```sh
  npm run build-storybook
  ```

  Outputs static Storybook to `storybook-static/` for deployment or visual regression.

- **Run Chromatic (Visual Regression):**
  1. Get your Chromatic project token from https://www.chromatic.com/
  2. Set the token in `package.json` (`chromatic` script, replacing `<project-token>`)
  3. Run:
     ```sh
     npm run chromatic
     ```
  4. Chromatic will upload your Storybook and provide a link for visual review and regression results.

## Adding/Editing Stories

- Add `.stories.tsx` files next to your components (see `web/src/components/rule-management/`).
- Use [Component Story Format (CSF)](https://storybook.js.org/docs/writing-stories/introduction) with a default export and named stories.
- Use controls, actions, and args for interactive stories.

## Theming, Accessibility, and Responsive Testing

- Use the **toolbar** in Storybook to toggle between light/dark themes (DaisyUI/Tailwind supported).
- Use the **a11y** panel for accessibility checks.
- Use the **viewport** panel to preview mobile, tablet, and desktop layouts.

## Best Practices for Atomic UI

- Keep components small, focused, and reusable.
- Use TypeScript for all components and stories.
- Document props and usage with JSDoc and Storybook controls.
- Test all states: loading, error, empty, edge cases.
- Use Tailwind/DaisyUI for consistent, accessible styling.
- Add stories for every new component and major UI state.

## Visual Regression (Chromatic)

- (Optional) Set up Chromatic for automated visual regression and UI review in CI.
- See below for setup instructions.

## API: /api/report-export

### Description
Exports report data in CSV, PDF, or Excel format. Requires authentication and appropriate RBAC (admin or auditor role).

### Supported Formats
- CSV: `?format=csv`
- PDF: `?format=pdf`
- Excel: `?format=excel`

### Authentication & RBAC
- User must be authenticated (Supabase session)
- User must have `admin` or `auditor` role (checked via `profiles` table)

### Usage Example
```
GET /api/report-export?type=compliance&format=csv
GET /api/report-export?type=compliance&format=pdf
GET /api/report-export?type=compliance&format=excel
```

### Filters
- Pass filters as a JSON string in the `filters` query param.

### Response
- Returns a file download with the requested format.
- 401 if not authenticated, 403 if not authorized.

### Example curl
```
curl -H "Authorization: Bearer <token>" "https://yourdomain.com/api/report-export?type=compliance&format=csv"
```

## API: /api/custom-report

### Description
Generates and exports custom reports based on dynamic filters. Supports JSON, CSV, PDF, and Excel formats. Requires authentication and appropriate RBAC (admin or auditor role).

### Method
POST

### Request Body
```
{
  "filters": { /* key-value pairs for filtering the report */ },
  "format": "json" | "csv" | "pdf" | "excel" // default: "json"
}
```

### Supported Formats
- JSON: `format: "json"` (default)
- CSV: `format: "csv"`
- PDF: `format: "pdf"`
- Excel: `format: "excel"`

### Authentication & RBAC
- User must be authenticated (Supabase session)
- User must have `admin` or `auditor` role (checked via `profiles` table)

### Usage Example
```
POST /api/custom-report
Content-Type: application/json

{
  "filters": { "project": "Alpha", "date": "2024-06-01" },
  "format": "csv"
}
```

### Filters
- Pass any key-value pairs in the `filters` object to filter the report data.
- Filters are applied as `.match(filters)` on the Supabase view `custom_report_view`.

### Response
- For `json` format: returns an array of report objects.
- For file formats (csv, pdf, excel): returns a file download with the requested format.
- 401 if not authenticated, 403 if insufficient role, 400 for invalid format, 500 for server/database errors.

### Error Codes
- 401 Unauthorized: User is not authenticated
- 403 Forbidden: User does not have required role
- 400 Bad Request: Invalid format or request body
- 500 Internal Server Error: Database or export error

### Shared Export Utility
- All export logic (CSV, PDF, Excel) is handled by a shared utility in `libs/utils/export-utils.ts`.
- Ensures consistent, robust, and maintainable export functionality across endpoints.

### Notes
- The endpoint is designed for extensibility: add new filters or formats as needed.
- RBAC and RLS are enforced at both the API and database levels.

## Scheduled Report Exports: Scheduling & Automation Framework

This project features a best-in-class, modular scheduling and automation system for report exports, designed for extensibility, accessibility, and robust architecture.

### Backend
- **Supabase Table:** `scheduled_exports` table stores all scheduled jobs, recurrence, delivery method, and status.
- **API:** Modular RESTful endpoints (`/api/scheduled-exports`) for CRUD operations, RBAC, and audit logging.
- **Serverless Worker:** Cron-triggered route (`/api/scheduled-exports/process`) polls for due jobs, runs export logic, delivers results (email/dashboard), and updates status/logs.

### Frontend
- **Dashboard UI:** `/reports/scheduling` features a modular, accessible dashboard with widgets:
  - `ScheduleExportWidget`: Schedule new exports with recurrence and delivery options.
  - `ScheduledJobsListWidget`: Manage, edit, and delete jobs.
  - `JobHistoryWidget`: View export history and status.
  - `NotificationSettingsWidget`: Manage notification preferences.
- **Best Practices:** Built with React, TypeScript, DaisyUI/Tailwind, React Query, and Zod. Fully accessible and responsive.

### Extensibility
- Pluggable email providers (Resend, Supabase SMTP, etc.)
- Ready for multi-tenant, advanced recurrence, and notification enhancements.
- Modular hooks and widgets for rapid feature development.

### Testing
- Playwright E2E tests for dashboard and API.
- React Testing Library unit/visual tests for all widgets.
- Storybook stories (see `/src/app/reports/scheduling/` for widget stories).

### Documentation
- See [`docs/scheduling.md`](docs/scheduling.md) for full technical and user documentation, API details, and advanced usage.

## Modular Chakra UI Theme System

The project uses a modular, extensible Chakra UI v3 theme system for best-in-class, branded, and accessible UI theming.

- **Location:** `web/src/components/ui/theme.ts`
- **Provider:** `web/src/components/ui/Provider.tsx` wraps the app with the custom theme system.
- **Brand Color:** Defined as a 50-950 scale in `theme.ts` for consistent branding.
- **Semantic Tokens:** Includes tokens for backgrounds, foregrounds, borders, accents, and brand, with light/dark mode support.
- **Extension Points:**
  - Add or modify tokens in `theme.ts` for new colors, typography, or spacing.
  - Use semantic tokens in Chakra UI components for adaptive, accessible styling.
  - (Planned) Add tenant-specific overrides by extending the system in `theme.ts` (see placeholder function).
- **Storybook:** Visualize and test the theme in isolation with `theme.stories.tsx`.

**How to add tenant-specific overrides:**
- Use the `getTenantSystem` placeholder in `theme.ts` to merge tenant-specific tokens or palettes.
- Pass the resulting system to the Provider for tenant-scoped theming.

For more details, see Chakra UI v3 theming docs and the code comments in `theme.ts`.
