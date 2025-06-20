# Security Compliance Tool (Examples)

> **Note:** This directory contains example/demo code only. Production backend code is in `apps/api/`.

## Overview

Automates compliance scanning for Microsoft 365, Azure Entra ID, and Power Platform, targeting regulated industries. Detects misconfigurations, aligns with compliance frameworks (NIST, ISO 27001, CIS, Essential 8), and provides dashboards, reporting, and remediation.

## Tech Stack

- **Backend:** Python (FastAPI, requests, pytest, Supabase REST API, msgraph-sdk, azure-identity, msal)
- **Frontend:** React, Vite, Chakra UI, React Query, Zod, Supabase-js, MSAL
- **Database:** Supabase (Postgres, REST API)
- **E2E:** Playwright, browsermcp (preferred, but not working in this env)
- **Cloud:** Azure/AWS for microservices/AI agent

## Microsoft Graph Integration

- Uses [msgraph-sdk](https://github.com/microsoftgraph/msgraph-sdk-python) for API access.
- Auth via [azure-identity](https://pypi.org/project/azure-identity/) (recommended) or [msal](https://pypi.org/project/msal/) for advanced scenarios.
- See Tasks.md for troubleshooting and best practices.

## Microsoft Graph Org Credential Management (Hybrid Pattern)

- **Supabase Table:** `ms_org_credentials` stores only org_id and a `secret_ref` (no secrets).
- **Secrets Manager:** Actual Microsoft API credentials (client_id, client_secret, tenant_id) are stored in Azure Key Vault, referenced by `secret_ref`.
- **Backend Flow:**
  1. Backend fetches `secret_ref` from Supabase for the org.
  2. Backend fetches credentials from Azure Key Vault using `secret_ref`.
  3. Credentials are never logged or stored in Supabase.
  4. All credential access is audit-logged (org_id, secret_ref, timestamp).
- **Dev Fallback:** In development, if no Supabase record is found, env vars are used with a warning.
- **Security:** Only org admins/owners can read/write their org's credential metadata (RLS enforced). All access is auditable and supports rotation.

## Structure

- `/frontend`: React SPA dashboard
- `/tests`: Backend unit/integration tests, seeding scripts
- `/test-results`: Playwright/browsermcp E2E results
- `api.py`, `auth.py`, `ms_api.py`, `supabase_client.py`: Backend entrypoints
- `db_schema.sql`: DB schema
- `Architecture.md`, `README.md`, `Tasks.md`: Docs

## Key Features

- Multi-org, RBAC, secure credential mgmt, modular rule engine, AI agent, robust error handling, modular frontend components, E2E automation.

## Recent Changes

- Migrated Python dependency management to uv (pyproject.toml, uv.lock). requirements.txt is deprecated and only present for compatibility.
- Implemented admin password reset feature (backend endpoint, frontend UI, audit logging, RBAC).
- Refactored dashboard to use react-grid-layout for drag-and-drop widgets, with layout persistence and accessibility improvements.
- Fixed dashboard widget overlap and scaling issues (zIndex, position, breakpoints, min/max widths).
- Integrated Monaco Editor API for code analysis and AI feedback (frontend and backend endpoints).
- Modularized scan trigger flow and dashboard widgets.
- Expanded E2E and backend test coverage for user management, scan flows, and audit logging.
- Updated troubleshooting and environment setup documentation for Windows and cross-platform compatibility.
- **Fixed jose/python-jose issue:** Removed legacy 'jose' package, added 'python-jose[cryptography]' for JWT support. See troubleshooting below and Tasks.md.

## Quick Start

1. Clone the repository and install dependencies (see Architecture.md for details).
2. Configure environment variables in `.env` and `/frontend/.env`.
3. Start backend: `uvicorn api:app --reload`
4. Start frontend: `cd frontend && npm run dev`
5. Run tests: `pytest` (backend), `npm run test` (frontend), `npm run e2e:dev` (E2E)

## Troubleshooting

- See Architecture.md and Tasks.md for detailed troubleshooting, dependency, and environment setup notes.
- For Python dependency issues, use `uv` and ensure all packages are present in pyproject.toml and uv.lock.
- For frontend issues, ensure Node.js 18+, all dependencies installed, and environment variables set.
- For E2E, ensure dev server is running, test users/orgs/data are seeded, and Playwright config is correct.
- **jose/python-jose Issue:**
  - The legacy 'jose' package is Python 2 only and incompatible with FastAPI/JWT usage. The correct package is 'python-jose[cryptography]'.
  - If you see SyntaxError or JWT import errors, check for the wrong 'jose' package. Always use 'python-jose'.
  - See Tasks.md for troubleshooting steps.

## Best Practices

- Use modular, reusable components (frontend)
- Use type hints and docstrings (backend)
- Use Zod for schema validation (frontend)
- Use React Context for state (frontend)
- Use fixtures/mocks for backend tests
- All PK/FK fields must be valid UUIDs
- Never expose secrets to the client
- Use Prettier and ESLint for formatting/linting
- Use Conventional Commits for PRs
- Store service keys securely (not in git)
- Wait for async state in E2E tests
- Use robust error handling and display
- RBAC enforced for all destructive actions

## References

- [Architecture.md](./Architecture.md)
- [Tasks.md](./Tasks.md)
- [Testing Plan.md](./Testing%20Plan.md)
- [UI Design.md](./UI%20Design.md)
- [Product Requirements Document (PRD).md](<./Product%20Requirements%20Document%20(PRD).md>)
- [Business Plan.md](./Business%20Plan.md)

## Quick Start (Coming Soon)

### 🚀 One-Command Setup (Planned)

```bash
# Future: One command to rule them all
docker-compose up
# Navigate to http://localhost:3000
```

### 📋 Current Setup Requirements

Until Docker Compose is implemented, follow the detailed setup below.

## Getting Started

### Recent Updates (December 2024)

- ✅ **Critical Syntax Error Fixed**: Resolved unterminated string literal in `api.py` line 270 (log_audit_event function)
- ✅ **Dependencies Updated**: Added missing `python-multipart` and `slowapi` to requirements.txt
- ✅ **Backend Startup**: All syntax errors resolved, backend now starts successfully with `uvicorn api:app --reload`
- ✅ **Documentation Updated**: Comprehensive updates to README.md, Architecture.md, and Tasks.md
- ✅ **Rate Limiting Implemented**: Added production-ready rate limiting using SlowAPI with proper middleware setup
  - User creation: Limited to 5 requests per minute per IP
  - Authentication: Limited to 10 requests per minute per IP
  - Automatic rate limit exceeded error handling
  - Support for Redis backend for distributed rate limiting

### Recent Updates (January 2025)

- ✅ **Phase 1 Implementation Complete**: Enhanced Dashboards & Visualizations successfully implemented
  - **HeatMapVisualization Component**: Interactive compliance risk heat maps using Recharts
  - **ComplianceScoreWidget**: Real-time monitoring widgets with compact and detailed views
  - **ReportingDashboard**: Advanced reporting module with filtering, export, and template support
  - **DashboardLayoutProvider**: Role-based dashboard layouts for security teams, developers, compliance officers, and admins
- ✅ **Dashboard Integration Complete**: Main Dashboard.tsx successfully integrated with Phase 1 components
  - **Role-Based Layouts**: Dashboard adapts based on user role (Security Teams, Developers, Compliance Officers, Admins)
  - **Preserved Functionality**: All existing scan trigger and results functionality maintained
  - **Mock Data System**: Comprehensive mock data for demonstration and testing
  - **Enhanced UX**: Modern interface with role-specific information and Phase 1 completion notifications
  - **Type Safety**: Full TypeScript integration with no compilation errors
- ✅ **UI Design Document Integration**: Comprehensive analysis and alignment planning with UI Design.md requirements
  - Identified gaps between current implementation and design specifications
  - Created detailed implementation roadmap for user-centric design
  - Researched and documented required libraries and frameworks
  - Planned phased approach for modern UI/UX implementation

### Prerequisites

1. **Clone the repository**
   ```sh
   git clone <repo-url>
   cd <project-directory>
   ```
2. **Install dependencies**

   ```sh
   # Backend dependencies (Python)
   pip install -r requirements.txt

   # Frontend dependencies (Node.js)
   cd frontend
   npm install
   npx playwright install --with-deps
   cd ..
   ```

3. **Configure environment variables**
   - Copy `.env.example` to `.env` and fill in your Supabase and Microsoft API credentials.
   - The backend loads environment variables using [python-dotenv](https://pypi.org/project/python-dotenv/) for local development and CI.
   - Never commit real secrets to version control. Store the service role key securely (e.g., in CI secrets or a local .env not committed to git).
   - If you see errors about missing SUPABASE_URL or SUPABASE_KEY, check your .env file and shell exports.
   - See `.env.example` for all required variables.
4. **Initialize Supabase backend**
   - Set up tables for users, scans, compliance results, and audit logs (all with org_id).
   - See [Supabase schema docs](https://supabase.com/docs/guides/database) for details.
   - All backend DB access is via the Supabase REST API (PostgREST) using requests. Do not use supabase-py.
5. **Run the application**

   ```sh
   # Start backend (from project root)
   uvicorn api:app --reload

   # Start frontend (in separate terminal)
   cd frontend
   npm run dev
   ```

## Organization Onboarding

- Each organization is assigned a unique org_id.
- All API requests must include org_id as a query parameter.
- Microsoft API credentials can be managed per organization (see `ms_api.py` for details).
- To onboard a new organization, create org-specific credentials and store org_id securely.

## API Endpoints

### Core Endpoints (all require org_id)

- `/users/` (POST, GET) - **Rate Limited**: POST limited to 5 requests/minute per IP
- `/scans/` (POST, GET)
- `/results/` (POST, GET)
- `/audit_logs/` (POST, GET)
- `/token` (POST) - **Rate Limited**: Limited to 10 requests/minute per IP for authentication

### Microsoft Graph Endpoints (all require org_id)

- `/msgraph/users/` — List users in Microsoft 365 tenant
- `/msgraph/groups/` — List groups in Microsoft 365 tenant
- `/msgraph/conditional_access_policies/` — List conditional access policies
- `/msgraph/compliance/users_without_mfa/` — Scan for users without MFA
- `/msgraph/compliance/inactive_users/` — Scan for inactive users
- `/msgraph/compliance/encryption_policies/` — Check encryption policies

## Microsoft API Integration

- Uses Microsoft Graph API for Microsoft 365 and Entra ID.
- Uses Power Platform CLI and REST APIs for Power Apps/Automate.
- See [Microsoft Graph Python SDK](https://github.com/microsoftgraph/msgraph-sdk-python) for usage examples.
- All Microsoft API calls are scoped by org_id and use per-org credentials.

## Testing

### Frontend

- Uses Jest and React Testing Library for unit/integration tests.
- Tests are located in `/frontend/src/__tests__`.
- Run tests with:
  ```sh
  cd frontend
  VITE_SUPABASE_URL=http://localhost VITE_SUPABASE_ANON_KEY=anon npm test
  ```

### Backend

- Uses pytest, httpx, and pytest-asyncio for unit and integration tests.
- Unit tests now cover user disable/enable/delete (success and error), RBAC, and audit log verification (see `tests/unit/test_supabase_client.py`).
- Integration/API tests now cover all user endpoints, including RBAC, edge, and negative cases for disable/enable/delete (see `tests/integration/test_api.py`).
- Expanded test coverage for scans, results, and audit_logs endpoints (see `tests/unit/` and `tests/integration/`).
- Run all backend tests with:
  ```sh
  pytest
  ```
- See [Testing Plan.md](./Testing Plan.md) for detailed scenarios and CI/CD integration.

### E2E Testing

- Frontend: Use browsermcp for browser-based E2E tests (see Tasks.md for scenarios).
- Backend: Use pytest for all API and logic tests.

See [Testing Plan.md](./Testing Plan.md) for detailed scenarios and CI/CD integration.

## Debug Logging & Troubleshooting

- Debug logging is now added to the scan trigger mutation and API call. All mutation starts, successes, and errors are logged to the browser console for easier troubleshooting.
- API calls log request parameters, responses, and errors to the console.
- For production, consider using a logging library (e.g., loglevel, debug) for more robust log management.
- See Tasks.md for ongoing improvements and recommendations.

## E2E Testing (Scan Trigger Flow)

- **Scenario:**
  1. Navigate to http://localhost:5173
  2. Login (if required)
  3. Open Dashboard
  4. Click "Trigger Scan"
  5. Select scan type from dropdown (compliance, security, or custom)
  6. If custom, enter custom scan type
  7. Fill in Target
  8. Enter Metadata in the JSON textarea (live validation, format as needed)
  9. Submit the scan
  10. Verify success toast notification and results refresh
- **Tools:**
  - Preferred: browsermcp (browser automation)
  - Alternatives: Playwright, Cypress (if browsermcp is unavailable)
- **Current Status:** browsermcp is not working in this environment; manual or alternative automation is recommended.

- **Best Practice:** In E2E tests, always wait for async state (e.g., orgId, user.id) to be ready before interacting with UI elements. After login, wait for both the dashboard heading and the scan trigger button to be enabled. Before submitting a scan, wait for the Start Scan button to be enabled. This avoids race conditions and test flakiness.
- **Troubleshooting:** If E2E tests fail due to missing org/user or disabled buttons, check that the test waits for all async state to be ready. See Tasks.md for more details and improvements.

## E2E Test Troubleshooting Checklist (2024-06)

- Verify FastAPI backend is running and accessible at the expected URL (e.g., http://localhost:8000)
- Confirm frontend login form and auth flow match seeded test users (see above)
- Check .env files and config for correct API URLs and keys
- Use Playwright debug output/screenshots (`npx playwright test --debug`) to diagnose UI and network issues
- See Tasks.md for ongoing tracking and reliability improvements

## Contribution Guidelines

- Fork the repo and create feature branches.
- Use Conventional Commits for PRs.
- Add/Update tests for new features.
- Follow code style and security best practices.
- See [CONTRIBUTING.md](./CONTRIBUTING.md) (to be created).

## Documentation & Resources

- [Business Plan.md](./Business Plan.md)
- [Product Requirements Document (PRD).md](./Product Requirements Document (PRD).md)
- [Testing Plan.md](./Testing Plan.md)
- [Examples.md](./Examples.md)

## Frontend Dashboard

- The dashboard is located in `/frontend` and built with React, Vite, Chakra UI, React Query, Zod, Supabase-js, and MSAL.
- See `/frontend/README.md` for setup, development, and contribution instructions.

## UI Design & User Experience

### User-Centric Design for Three Stakeholder Types

The frontend is designed to cater to distinct user roles with tailored interfaces:

#### **Security Teams: Real-Time Compliance Monitoring**

- **Centralized Dashboard**: Dynamic widgets displaying compliance scores, scan progress, and critical vulnerabilities
- **Heat Map Visualizations**: Visual representation of compliance gaps across Azure Entra ID and Microsoft 365 environments
- **Actionable Alerts**: Real-time notifications with drill-down capabilities for detailed remediation steps
- **Implementation Status**: ✅ **COMPLETED** - Phase 1 (January 2025)

#### **Developers: AI-Driven Code Analysis**

- **Integrated Code Editor**: Monaco Editor with real-time feedback for Power Automate workflow analysis
- **Side-by-Side Comparison**: Original code vs AI-recommended corrections
- **Drag-and-Drop Rule Builder**: Visual interface for creating custom compliance rules without technical expertise
- **Implementation Status**: 🔄 Planned for Phase 2 (Q2 2025)

#### **Compliance Officers: Customizable Reporting**

- **Real-Time Reports**: Filters for time frames, compliance standards (ISO 27001, NIST), and organizational units
- **Template Library**: Predefined report formats for consistency across audits
- **Multi-Format Export**: PDF, Excel, CSV export capabilities with customizable visualizations
- **Implementation Status**: ✅ **COMPLETED** - Phase 1 (January 2025)

### Modern UI/UX Features

#### **Current Implementation** ✅

- **Dark Mode**: Implemented with Chakra UI theme system
- **Responsive Design**: Mobile-first approach with Chakra UI responsive components
- **Component Library**: Modular components (NavBar, ResultsTable, MetadataEditor)
- **Authentication**: Integrated Supabase Auth and Microsoft MSAL
- **Form Validation**: React Hook Form with Zod schema validation

#### **Planned Enhancements** 🔄

- **Progressive Web App (PWA)**: Offline access, push notifications, home screen installation
- **Advanced Microinteractions**: Enhanced hover effects, loading states, and visual feedback
- **Lazy Loading**: Performance optimization for large datasets and non-critical components
- **Real-Time Synchronization**: WebSocket integration for live data updates
- **Customizable Themes**: User-configurable color schemes and dashboard layouts

### Implementation Roadmap

#### **Phase 1: Enhanced Dashboards & Visualizations** ✅ **COMPLETED** (January 2025)

- ✅ Heat map components using Recharts (HeatMapVisualization.tsx)
- ✅ Role-based dashboard layouts (DashboardLayoutProvider.tsx)
- ✅ Advanced data visualization components (ComplianceScoreWidget.tsx)
- ✅ Customizable reporting interface (ReportingDashboard.tsx)

#### **Phase 2: Code Editor, AI Feedback, and Rule Builder** (Q2 2025)

- **New Features**:
  - Monaco Editor Integration: Real-time Power Automate workflow editing in CodeAnalysisEditor.tsx, Power Automate language definition, real-time code analysis, inline feedback, and performance optimizations (lazy loading, web workers).
  - AI Feedback Panel: AIFeedbackPanel.tsx for AI-driven code analysis results, vulnerabilities, remediation suggestions, confidence scores, and evidence. Integrates with backend AI analysis API endpoints.
  - Drag-and-Drop Rule Builder: RuleBuilderCanvas.tsx and RuleComponentLibrary.tsx for visual rule construction using react-dnd, real-time validation (RuleValidator.tsx), export (RuleExporter.tsx), rule categories, templates, and examples.
  - Backend API Endpoints: For code analysis (AI/static) and rule management (CRUD), secure and well-documented.
  - Integration & UI/UX: Seamless workflow between code editor, AI feedback, and rule builder. CodeComparisonView.tsx for side-by-side code. Accessibility and responsive design.
  - Testing & Quality Assurance: Unit, integration, E2E, and visual regression tests for all new components.
  - Documentation: Usage, developer notes, API docs, troubleshooting, and Storybook examples.
- **Technologies Used**:
  - @monaco-editor/react, react-dnd, Chakra UI, TypeScript, Zod
- **Usage**:
  - Access dashboard to use code editor and rule builder. Drag rules onto canvas, view AI analysis, and apply fixes.
- **Developer Notes**:
  - See src/components/CodeAnalysisEditor.tsx, AIFeedbackPanel.tsx, RuleBuilderCanvas.tsx, RuleComponentLibrary.tsx, and src/types/phase2.ts for implementation details.
- **Recommendations & Future Improvements**:
  - Optimize bundle size, extend language support, add more rule types, improve accessibility, integrate with backend APIs, monitor performance, plan for PWA/offline support.
- **Monaco Editor Optimization & Feedback Subtasks**:
  - Implement lazy loading for Monaco Editor to improve initial load performance (using React.lazy and Suspense; see CodeAnalysisEditor.tsx)
  - Configure Monaco Editor web workers for language services (Vite/webpack config)
  - Optimize editor options for performance (minimap, folding, bracket colorization, etc.)
  - Ensure real-time code analysis and diagnostics are displayed as inline markers
  - Add keyboard shortcuts for analysis and formatting (Ctrl+R, Ctrl+S, etc.)
  - Document best practices for Monaco Editor integration in README.md and Architecture.md
  - Periodically review and update Monaco Editor integration for new features and performance improvements
  - **Monaco Editor Options & Performance Tuning**:
    - Minimap is disabled by default for performance (see CodeAnalysisEditor.tsx).
    - Bracket pair colorization is enabled for better readability.
    - Folding strategy is set to 'auto' for best results.
    - Review these settings with each Monaco release for new options or changes.
- **Monaco Editor Web Worker Configuration**:
  - Configured in vite.config.ts using globalThis.MonacoEnvironment.getWorker for language services (JSON, TS, CSS, HTML, etc.).
  - Ensures syntax highlighting, code analysis, and language features work in the editor.
  - See https://github.com/microsoft/monaco-editor/blob/main/docs/integrate-esm.md for details.
  - If you see errors like 'Unable to load worker', check the worker paths and Vite config.
  - This is required for Vite/React projects using @monaco-editor/react.

**Lazy Loading Note:**

- Monaco Editor is now lazy loaded in CodeAnalysisEditor.tsx using React.lazy and Suspense. This reduces the initial bundle size and improves load performance. If you see a loading spinner, the editor is being loaded asynchronously. For troubleshooting, ensure all props and handlers are passed through and that fallback UI is user-friendly.

#### **Monaco Editor Real-Time Code Analysis**

- The code editor now supports real-time code analysis and diagnostics as you type.
- Analysis is triggered automatically after a short pause (500ms debounce) on code changes.
- This uses lodash.debounce for performance and to avoid excessive API calls.
- If you see delays or missing diagnostics, check the browser console for errors and ensure the backend analysis API is reachable.
- See Architecture.md for implementation details.
- **Periodic Review:**
  - The debounce interval for real-time analysis (currently 500ms) and performance should be reviewed and benchmarked after each major Monaco/React upgrade or if performance issues are reported. Document any changes. Consider making the interval user-configurable in the future.

#### **Frontend Dependencies**

- lodash (for debouncing real-time analysis in Monaco Editor)
- react-grid-layout and react-resizable are used for dashboard drag-and-drop customization. Widgets can be rearranged by the user. See dashboard section for usage.

#### **Phase 3: PWA & Real-Time Features** (Q3 2025)

- Service worker implementation with Workbox
- Push notification system
- Offline data caching and synchronization
- WebSocket integration for real-time updates

#### **Phase 4: Advanced UX & Performance** (Q4 2025)

- Advanced microinteractions and animations
- Performance optimization with virtualization
- Enhanced accessibility features
- Mobile app-like experience optimization

### Technology Stack Alignment

- **Current**: React + Vite + Chakra UI + React Query + Zod
- **Additions**: Monaco Editor, React DnD, Recharts, Workbox, Socket.io
- **Performance**: Lazy loading, virtualization, PWA caching
- **Security**: End-to-end encryption, MFA, RBAC integration

## Updated Onboarding Steps

1. Backend: Set up Supabase, run migrations, configure environment variables.
2. Frontend: `cd frontend && npm install && npm run dev` (see `/frontend/README.md`).
3. Configure per-org credentials securely (see credential management section).
4. Start backend (`uvicorn api:app --reload`) and frontend (`npm run dev` in `/frontend`).
5. Onboard organizations, manage credentials, and begin compliance scans.

## Onboarding & Using the Scan Trigger Flow

1. **Login** to the dashboard using your organization credentials (Supabase Auth or Microsoft login).
2. **Navigate to the Dashboard**.
3. **Trigger a Scan**:

   - Click the "Trigger Scan" button to open the scan modal.
   - **Scan Type**: Select a scan type from the dropdown (compliance, security, or custom). If 'custom' is selected, enter your custom scan type in the input field.
   - **Target**: Optionally, enter a target (e.g., user email or resource ID).
   - **Metadata**: Enter additional scan parameters as JSON in the robust metadata editor (textarea). The editor provides live validation and a "Format JSON" button for readability.
   - If the JSON is invalid, an error is shown and the scan cannot be submitted.
   - Click "Start Scan" to submit. All parameters (org_id, user_id, scan_type, target, metadata) are securely derived from context/session and sent to the backend API.
   - On success, a toast notification confirms the scan was created and results will refresh automatically.
   - On error, a clear error message is shown.

4. **View Results**: The dashboard displays scan results for your organization. Use the "Refresh Results" button to update the table.

## Recent Fixes & Troubleshooting

### ✅ Syntax Error Resolution (December 2024)

**Problem**: Backend failed to start with `SyntaxError: unterminated string literal (detected at line 270)`

**Root Cause**: Broken string literal in `log_audit_event` function:

```python
# ❌ BROKEN:
f.write(json.dumps({...}) + "
")

# ✅ FIXED:
f.write(json.dumps({...}) + "
")
```

**Solution**: Fixed unterminated string literal by replacing broken multiline string with proper newline character.

**Status**: ✅ **RESOLVED** - Backend now starts successfully with `uvicorn api:app --reload`

### Missing Dependencies Resolution

**Problem**: Backend startup failed with missing module errors for `slowapi` and `python-multipart`

**Solution**: Added to requirements.txt:

- `python-multipart`: Required for FastAPI form data and file uploads
- `slowapi`: Rate limiting library for production FastAPI applications

**Status**: ✅ **RESOLVED** - All dependencies now properly documented and installable

## Troubleshooting

- **Login/E2E Test Failures:**

  - Ensure `.env` is present and correct in `/frontend`.
  - Check that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` match your Supabase project.
  - Confirm the test user (`testuser@example.com`) exists and is confirmed in the Supabase dashboard (Auth > Users).
  - If using the seeding script, ensure it sets `email_confirm: True`.
  - If login still fails, check browser console and network tab for errors.

- **Best Practice:** Always wait for the AuthContext user state to be set before navigating after login to avoid race conditions with Supabase Auth state updates.

## Backend/Test Environment Variables

- Before running backend scripts or tests (including the test user seeding script), you must set `SUPABASE_URL` and `SUPABASE_KEY` in your environment.
- You can do this by exporting them in your shell, or by using a `.env` file and a loader like `python-dotenv`.
- **Example:**
  ```sh
  export SUPABASE_URL=your-supabase-url
  export SUPABASE_KEY=your-service-role-key
  python tests/integration/seed_test_user.py
  ```
- **Important:** For backend/test scripts, `SUPABASE_KEY` **must be your Supabase service role key** (not the anon/public key). Only the service role key has admin privileges for user management. Never expose the service role key to the frontend or client-side code.
- **Troubleshooting:** If you see `403 Forbidden` or `User not allowed`, check that you are using the correct service role key and that it is set in your environment.
- **Best Practice:** Store the service role key securely (e.g., in CI secrets or a local .env not committed to version control).

## User Removal and Disable/Enable

- **Disable/Enable User**: Admins (and users themselves) can disable their own account (soft deactivation). Disabled users cannot log in or be assigned new roles. Disabled users are shown as grayed out in the UI. Admins can re-enable users.
- **Delete User**: Only admins can permanently delete a user. This is a hard delete and should be used with caution. All destructive actions are logged in the audit log.
- **RBAC**: Only admins can delete or enable users. Users can disable themselves but not others. Cannot disable or delete the last admin.
- **Audit Logging**: All disable, enable, and delete actions are logged in the audit_logs table for compliance and traceability.

## Database Migration

- Add `is_disabled boolean NOT NULL DEFAULT false` to the `users` table. See `db_schema.sql` for the latest schema. Run the migration before deploying the new features.

## UI/UX

- Disabled users are shown as grayed out with a "Disabled" badge. Only admins see the delete button. All actions provide toast feedback and require confirmation for delete.

## Troubleshooting

- If you cannot disable or delete a user, check your role and ensure you are not the last admin. If you see errors, check the audit log for details.

## Windows & E2E Setup Notes

- **Python dependencies:** Only backend dependencies are in `requirements.txt`. Do NOT add frontend (JS/TS) packages here. If you see install errors, check for stray frontend packages in requirements.txt.
- **Frontend dependencies:** Run `npm install` in the `/frontend` directory. All React/Chakra/Playwright/etc. dependencies are managed in `frontend/package.json`.
- **E2E Testing:**
  1. Start the frontend server: `cd frontend && npm run dev` (must be running on http://localhost:5173).
  2. In another terminal, run Playwright tests: `cd frontend && npx playwright test`.
  3. Alternatively, use the new automation scripts: `npm run e2e:dev` (assumes dev server is running) or `npm run e2e:full` (starts dev server and runs tests; see frontend/README.md for details).
  4. If you see `net::ERR_CONNECTION_REFUSED`, ensure the frontend server is running.
- **Troubleshooting:**
  - If `pip install -r requirements.txt` fails, check for non-Python packages in the file.
  - If `npm install` fails, ensure you are in the `/frontend` directory and have Node.js 18+.
  - For Playwright, always install browsers with `npx playwright install --with-deps` after `npm install`.
  - For Windows, use PowerShell-compatible command separators (`;` instead of `&&`).
  - For E2E, see frontend/README.md for automation scripts and best practices.

## Sequential Install Steps (Recommended for Windows)

1. **Clone the repository**
   ```sh
   git clone <repo-url>
   cd <project-directory>
   ```
2. **Install backend dependencies**
   ```sh
   pip install -r requirements.txt
   ```
3. **Install frontend dependencies**
   ```sh
   cd frontend
   npm install
   npx playwright install --with-deps
   ```
4. **Configure environment variables**
   - Copy `.env.example` to `.env` in both root and `/frontend` as needed.
   - Fill in Supabase and Microsoft API credentials.
5. **Start backend**
   ```sh
   uvicorn api:app --reload
   ```
6. **Start frontend**
   ```sh
   cd frontend
   npm run dev
   ```
7. **Run E2E tests (in a new terminal, with frontend running)**
   ```sh
   cd frontend
   npx playwright test
   ```

## Troubleshooting

- **E2E Test Failures:**
  - If Playwright tests fail with connection errors, ensure the frontend server is running on http://localhost:5173 before running tests.
  - For Windows, use separate terminals for backend, frontend, and tests.
  - See Tasks.md for ongoing E2E reliability improvements and troubleshooting tips.

## Backend Edge/Negative Case Test Coverage (Updated)

- Integration and unit tests now cover:
  - Missing/invalid parameters (including malformed UUIDs)
  - Unauthorized/forbidden access (RBAC, permission escalation)
  - Last admin protection (cannot disable/delete last admin)
  - Error handling for DB errors and external service failures
  - Audit log creation and immutability after destructive actions
  - Rate limiting and error responses
  - Input validation (invalid types, missing required fields)
  - Non-existent resources (404)
  - Custom error handlers and exception propagation
  - All new endpoints use the UUID validation utility and have negative tests
- Ongoing improvements and new edge cases are tracked in Tasks.md.
- Periodically review UUID validation coverage, error simulation, and audit log verification.
- Add negative tests for all new endpoints and business logic.
- See Tasks.md for recommendations and future improvements.

## Backend Testing

**Note:** All PK/FK fields (e.g., `org_id`, `user_id`, `scan_id`, `target_id`) must be valid UUIDs (e.g., `00000000-0000-0000-0000-000000000001`) in all API calls and tests. Do not use string placeholders like 'user-1', 'scan-1', etc.

**UUID Validation:**
All API endpoints now validate UUIDs for all relevant path/query parameters. Malformed UUIDs will return a 422 error with a descriptive message.

Integration tests now use FastAPI's `app.dependency_overrides` to mock authentication and other dependencies. This ensures that tests run with the correct user context and avoid 401 errors.

### Adding Dependency Overrides

To override dependencies in tests, use:

```python
app.dependency_overrides[auth.get_current_user] = lambda: {"id": "admin-1", "role": "admin", "org_id": "org-1"}
# ... run test ...
app.dependency_overrides = {}
```

### Running Tests

- **Backend tests:**
  ```sh
  pytest tests/integration/
  ```
- **E2E tests:**
  ```sh
  npm run e2e:dev
  # or
  npm run e2e:full
  ```

## Seeding the Test Database

Before running integration tests, seed the Supabase test database with required UUIDs:

```sh
export SUPABASE_URL=... # your Supabase project URL
export SUPABASE_KEY=... # your Supabase service role key
python tests/integration/seed_test_db_rest.py
```

If you see foreign key errors in tests, ensure the DB is seeded and the environment variables are set.

## REST API-Based Backend Access (2024-06)

- All backend database access is now performed via the Supabase REST API (PostgREST) using the Python requests library.
- supabase-py and postgrest-py are no longer used or required.
- If you see errors, check your SUPABASE_URL and SUPABASE_KEY, and ensure your service role key is used for backend/test scripts.
- See Tasks.md and Architecture.md for ongoing tracking and troubleshooting.

## Troubleshooting: REST API Errors (2024-06)

- If you see 401/403/404/422 errors from the backend, check your REST API request structure, headers, and environment variables.
- Ensure SUPABASE_URL and SUPABASE_KEY are set and correct.
- For backend/test scripts, SUPABASE_KEY must be your Supabase service role key (never expose to frontend).
- See Tasks.md for troubleshooting and ongoing recommendations.

## Critical: Backend Blocked by supabase-py Bug (2024-06)

- The backend previously could not start due to a supabase-py/gotrue/httpx bug. This has been resolved by refactoring all backend DB access to use the Supabase REST API (PostgREST) via requests.
- supabase-py and postgrest-py are no longer required or supported.
- See Tasks.md and Architecture.md for details and tracking.

## Route Protection & Authentication Flow

- All authenticated/protected routes (such as the Dashboard) are wrapped in a `ProtectedRoute` component.
- `ProtectedRoute` checks the authentication context and redirects unauthenticated users to `/login`.
- The loading spinner is only shown while authentication state is being resolved, not just when data queries are loading.
- This ensures that unauthenticated users cannot access protected pages and that loading states are clear and accurate.
- See `src/components/ProtectedRoute.tsx` and `src/App.tsx` for implementation details.

## Best Practices (updated)

- Always use `ProtectedRoute` for any page that requires authentication.
- Only show loading spinners when authentication is being resolved (`auth.loading`), not just when queries are loading.
- Prevent data queries from running until both `user` and `orgId` are set.

## E2E Automation Scripts (updated)

- `npm run pre-e2e`: Ensures the `test-results/` directory exists before running Playwright tests (required for artifact storage and to avoid FileNotFoundError).
- `npm run e2e:dev`: Runs Playwright E2E tests. Assumes the dev server is already running on http://localhost:5173. Runs `pre-e2e` first.
- `npm run e2e:full`: Starts the dev server and runs Playwright E2E tests sequentially (for automation or CI; may require manual server shutdown after). Runs `pre-e2e` first.
- **Best Practice:** For local development, use two terminals: one for `npm run dev`, one for `npm run e2e:dev`. For automation, use `npm run e2e:full` (see Tasks.md for reliability improvements).

## E2E Troubleshooting (updated)

- If you see `FileNotFoundError` for Playwright test-results, ensure the `test-results/` directory exists or run `npm run pre-e2e` before E2E tests.
- The Playwright setup script (`src/utils/playwrightSetup.ts`) will automatically create this directory as part of the E2E workflow.

## Playwright Setup Script Troubleshooting (2024-06)

- If you see a TypeScript error like "Module 'path' can only be default-imported using the 'esModuleInterop' flag", update the import to use `import * as path from 'path'` instead of `import path from 'path'`.
- This is required because `esModuleInterop` is not enabled in the current tsconfig settings.
- Periodically review `tsconfig.json` and related configs to ensure compatibility for Node.js scripts and E2E tooling.

## E2E Test Data Seeding (2024-06)

- Before running E2E or integration tests, always run BOTH:
  ```sh
  python tests/integration/seed_test_db_rest.py
  python tests/integration/seed_supabase_auth_users.py
  ```
- The first script seeds required users, scans, results, and audit logs in the database with valid UUIDs and hashed passwords.
- The second script ensures all test users exist in Supabase Auth (Auth > Users) with email confirmed, using the REST API and service role key.
- **If login fails, check that the test user (e.g., testuser@example.com) exists and is confirmed in Auth.**
- If you see errors, check your SUPABASE_URL, SUPABASE_KEY, and that your key is the service role key (not anon).

## Authentication & User Context (2024-06)

- After login, the frontend fetches the user profile from the DB (users table) using the user's email and merges org_id and role into the user context.
- This ensures org_id is always available for scan and compliance flows, and prevents race conditions in the scan modal logic.
- If you see issues with org_id or Start Scan remaining disabled, check the browser console for debug logs and ensure the user exists in both Auth and DB with matching email and org_id.

## E2E Testing (Scan Trigger Flow)

- Playwright E2E tests cover the scan trigger flow and user management. If tests fail, check the browser console for debug logs and errors.
- See frontend/README.md and Tasks.md for E2E test setup and troubleshooting.

## Component Modularization (2024-06)

- ResultsTable and MetadataEditor are now modular reusable components in src/components/.
- This improves project structure, reusability, and maintainability following React best practices.

## Navigation Bar (2024-06)

- Added a NavBar component with links to Dashboard, User Management, and Onboarding.
- Navigation is now consistent and accessible across the app.

## Backend Test Data Seeding & Troubleshooting (2024-06)

- Before running E2E or integration tests, seed Supabase Auth and DB with required test users, orgs, and data.
- **Required environment variables:**
  - `SUPABASE_URL` (your Supabase project URL)
  - `SUPABASE_KEY` (service role key, never expose to frontend)
- **Seeding steps:**
  1. `python tests/integration/seed_supabase_auth_users.py`
  2. `python tests/integration/seed_test_db_rest.py`
- If you see bcrypt warnings, ensure `bcrypt<4.1.0` is pinned in requirements.txt. Warnings are non-fatal if hashes are generated.
- See Tasks.md for ongoing troubleshooting and improvements.

### Required E2E Test Users (2024-06)

- testuser@example.com (admin, org1)
- testuser2@example.com (user, org1)
- nonadmin@example.com (user, org1)
- lastadmin@example.com (admin, org1)
- org2admin@example.com (admin, org2)
- org2user@example.com (user, org2)
- regularuser@example.com (user, org1)
- All users use password: testpassword (except org2admin/org2user if otherwise noted)
- Keep this list in sync with E2E test files and seeding scripts.

## Frontend Improvements (2024-06)

- **Login UX:**
  - Organization branding/logo on login page
  - Clear error messages and info section ("Why do I need to log in?")
  - Improved accessibility (ARIA, focus management)
  - Microsoft login button with icon (requires `react-icons/fa`)
- **Scan Usability:**
  - Step-by-step scan guide and tooltips
  - Info/help icons (requires `@chakra-ui/icons`)
  - Improved error feedback and empty state illustration
  - Sortable results table (requires `@chakra-ui/icons`)
- **Accessibility:**
  - All forms and buttons have ARIA attributes
  - Error and info messages are screen-reader friendly

### Requirements

- Install `react-icons` and `@chakra-ui/icons` in the frontend:
  ```sh
  npm install react-icons @chakra-ui/icons
  ```
- See `Tasks.md` for outstanding dependency and UI tasks.

### Rate Limiting

- **Implementation**: Uses SlowAPI middleware for production-ready rate limiting
- **Scope**: IP-based rate limiting with configurable limits per endpoint
- **Current Limits**:
  - User creation (`POST /users/`): 5 requests per minute
  - Authentication (`POST /token`): 10 requests per minute
- **Error Handling**: Returns HTTP 429 (Too Many Requests) when limits are exceeded
- **Future Enhancements**: Redis backend support for distributed rate limiting across multiple server instances

## Troubleshooting

### Chakra UI StatArrow Context Error

If you see `useStatStyles returned is 'undefined'. Seems you forgot to wrap the components in "<Stat />"`, ensure that `StatArrow` is always a child of `Stat`, ideally within `StatHelpText`.

### Supabase 406 Error on Profile Fetch

If you get a 406 error when fetching user profiles, it usually means `.single()` returned no rows. Handle this gracefully in your code and check that the user exists in the `users` table. See `frontend/src/context/AuthContext.tsx` for the recommended error handling pattern.

## Regression Testing

### Chakra UI StatArrow Usage

Regression tests are included in `frontend/src/__tests__/ComplianceScoreWidget.test.tsx` to ensure that `StatArrow` is always rendered within `StatHelpText` and `Stat` components, preventing context errors. These tests use React Testing Library and ChakraProvider for context.

### Supabase Profile Fetch Edge Cases

Regression tests for Supabase profile fetch edge cases are included in `frontend/src/__tests__/AuthContextProfileFetch.test.tsx`. These tests mock the Supabase client to verify correct handling of missing profiles (406 error) and successful fetches.

$1For dashboard widgets (e.g., ComplianceScoreWidget, AIFeedbackPanel), set zIndex={0} and position="relative" on the root Box.

See `frontend/src/components/NavBar.tsx`, `frontend/src/components/HeatMapVisualization.tsx`, `frontend/src/components/ComplianceScoreWidget.tsx`, and `frontend/src/components/AIFeedbackPanel.tsx` for implementation details.

## Frontend Performance & Code Splitting (2025-06)

### Vite Code Splitting Optimization

- The frontend uses advanced Vite code splitting via manualChunks in vite.config.ts, splitting vendor, UI, data, charts, forms, auth, and utils into separate bundles.
- Custom chunk and asset file naming for clarity and caching.
- CSS code splitting, tree shaking, and module preload for critical chunks are enabled.
- Dev-only dependencies are excluded from production builds.
- Bundle analyzer is available for development builds (see package.json scripts).

### Best Practices

- All non-critical components (AI code editor, charts, reporting modules) should be loaded with React.lazy() and Suspense for optimal performance.
- Monitor bundle analysis output after each build for large chunks (>500kB).
- Use @tanstack/react-virtual for large tables/lists to minimize DOM nodes.
- See Tasks.md for ongoing performance, optimization, and future recommendations.

## Troubleshooting

### Uncaught ReferenceError: process is not defined (Vite/React)

- **Problem:** This error occurs if you use process.env in frontend code. Vite does not provide process.env in the browser; use import.meta.env instead.
- **Solution:** Replace all process.env.VITE*\* usages with import.meta.env.VITE*\*. See frontend/src/utils/supabaseClient.ts for an example fix.

## Environment Variables (Vite Frontend)

- All frontend environment variables must be prefixed with VITE* and accessed via import.meta.env.VITE*\*. Do not use process.env in frontend code.
- See Vite documentation: https://vitejs.dev/guide/env-and-mode.html

#### **Monaco Editor Keyboard Shortcuts & Accessibility**

- **Keyboard Shortcuts:**
  - Ctrl+R: Analyze code
  - Ctrl+S: Save workflow
  - Ctrl+Shift+F: Format code
  - Ctrl+Shift+P: Command palette (Monaco built-in)
  - F8/Shift+F8: Next/previous error/warning (Monaco built-in)
  - Alt+F1: Accessibility help (Monaco built-in)
- **Accessibility:**
  - Monaco Editor supports screen readers and keyboard navigation.
  - Use Alt+F1 for accessibility help and Ctrl+H for more info.
  - See https://github.com/microsoft/monaco-editor/wiki/Monaco-Editor-Accessibility-Guide for details.
- **Future:**
  - User-configurable keyboard shortcuts (planned)
- **Troubleshooting:**
  - If shortcuts do not work, check browser/system conflicts and focus state.
  - For accessibility issues, see Monaco's accessibility guide and ensure `accessibilitySupport: "on"` if needed.

#### **Monaco Editor Help & Shortcuts Modal**

- Click the info/help button in the editor header to view all keyboard shortcuts and editor settings.
- **Shortcuts:**
  - Ctrl+R: Analyze code
  - Ctrl+S: Save workflow
  - Ctrl+Shift+F: Format code
  - Ctrl+Shift+P: Command palette (Monaco built-in)
  - F8/Shift+F8: Next/previous error/warning (Monaco built-in)
  - Alt+F1: Accessibility help (Monaco built-in)
- **User-Configurable Settings:**
  - Font size, theme, word wrap, line numbers, language
- **Coming Soon:**
  - User-configurable keyboard shortcuts and keybinding profiles
- **Troubleshooting:**
  - If the help modal does not open, check for JavaScript errors or missing Chakra UI dependencies.
  - For accessibility, all modal content is keyboard navigable and screen reader friendly.

## Dashboard Improvements (2024-07)

- Fixed missing chart rendering in ReportingDashboard (now uses recharts BarChart and PieChart)
- Improved grid layout and resolved overlayering issues in DashboardLayoutProvider
- Added instructions for adding mock/demo data to see dashboard widgets in action
- Troubleshooting: If charts or widgets do not appear, ensure mock data is provided and check browser console for errors

## Tech Stack

- Chakra UI Grid for layout
- recharts for charts

## Troubleshooting: Slow Authentication or Session Loading

- Ensure your Supabase project is on the latest version (PostgREST 12+).
- Check the [Supabase status page](https://status.supabase.com/) for incidents.
- Double-check that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set and correct in your environment.
- If using Row Level Security (RLS) on the `users` table, use `select auth.uid()` in policies and add a B-tree index on `id`.
- If session/profile fetch is slow, log network timings to distinguish which call is slow.
- Consider adding a frontend timeout or fallback UI for long auth loads.

## [2025-07] Monaco Editor API Integration

- Frontend integration complete: CodeAnalysisEditor and AIFeedbackPanel use real backend APIs for code analysis and AI feedback
- Periodic review: API integration, error handling, and accessibility

- Backend API endpoints for code analysis and AI feedback (see Tasks.md for contract and implementation plan)

  - POST /api/code-analysis: input code, language, org_id, user_id, metadata; returns diagnostics, summary
  - POST /api/ai-feedback: input code, language, org_id, user_id, metadata; returns feedback, summary
  - All endpoints require authentication and org scoping
  - See OpenAPI docs for schemas and error structure
  - Periodic review: keep OpenAPI and docs in sync

- Admins can trigger password reset emails for users via the dashboard (see Tasks.md for implementation plan and security notes; follows Supabase best practices)

## Admin Password Reset Feature

- Admins can trigger a password reset email for any user from the User Management page.
- The reset password button is only visible to admins.
- Clicking the button opens a confirmation dialog; confirming sends a request to the backend to trigger a Supabase password reset email.
- The User Management page now uses the UserManagement component from `frontend/src/components/UserManagement.tsx` for all user actions.
- The User Management page now supports full user management: role management (dropdown), disable/enable, delete, RBAC, status display (Active/Disabled), and reset password. All actions provide feedback and enforce correct permissions. Disabled users are grayed out and labeled. Cannot disable/delete self or last admin.

## New Feature: Heat Map Visualization Overlap Fix

- The dashboard heat map now uses zIndex: 0 and position: 'relative' to ensure widgets do not overlap. Regression/UI tests are recommended for layout and stacking issues.

## Troubleshooting: If you see 'Class constructor WidthProvider cannot be invoked without new', ensure ResponsiveReactGridLayout is used as a JSX component, not a function. See code comments in DashboardLayoutProvider.tsx for correct usage.

- Dashboard widgets now scale more naturally across breakpoints, with increased columns and min/max widths for better responsiveness.
- **Troubleshooting:** If widgets appear too narrow or do not scale, check breakpoints, columns, and min/max width settings in DashboardLayoutProvider.tsx.

## Scan Trigger Flow

- The scan trigger functionality is now handled exclusively by the modular ScanTriggerWidget, rendered as a dashboard widget via DashboardLayoutProvider.
- Legacy scan trigger/modal code has been removed from Dashboard.tsx for clarity and maintainability.
- The dashboard layout is fully modular and role-based; widgets can be added, removed, or rearranged per role.

### Recommendations

- Periodically review dashboard widget communication and modularity to ensure best practices and maintainability.

### Troubleshooting

- If you see `ImportError: email-validator is not installed`, run:
  ```bash
  uv add email-validator
  uv pip install -r pyproject.toml
  ```
  This ensures the dependency is tracked and installed by uv.

## Python Dependency Management with uv

This project uses [uv](https://docs.astral.sh/uv/) for fast, deterministic Python dependency management.

### Installation

- Install uv (recommended via pipx):
  ```bash
  pipx install uv
  # or
  pip install uv
  ```
- Verify:
  ```bash
  uv --version
  ```

### Migrating from requirements.txt

- Initialize uv project files:
  ```bash
  uv init --bare
  ```
- Import dependencies:
  ```bash
  uv add -r requirements.txt
  ```
- This creates/updates `pyproject.toml` and `uv.lock`.
- You may now remove or archive `requirements.txt`.

### Installing Dependencies

- To install all dependencies:
  ```bash
  uv pip install
  ```
- To add/remove dependencies:
  ```bash
  uv add <package>
  uv remove <package>
  ```

### Updating Dependencies

- To update all dependencies:
  ```bash
  uv update
  ```

### Troubleshooting

- If you encounter issues, see the [uv documentation](https://docs.astral.sh/uv/).

## Troubleshooting: Python Environment & Dependency Issues

### Common ImportError: email-validator

- If you see `ImportError: email-validator is not installed` but it is present in `pyproject.toml` and `uv.lock`, this is almost always due to a Python environment mismatch or broken PATH.

#### Steps to Diagnose and Fix:

1. **Check Python Interpreter**
   - Run `python -c "import sys; print(sys.executable)"` to see which Python is being used.
   - Run `python -m pip show email_validator` to check if the package is installed in that environment.
2. **Check for Multiple Python Installations**
   - On Windows, run `where python` to see all Python executables in PATH.
   - On Unix, run `which -a python3`.
3. **Ensure uv and uvicorn use the same Python**
   - If using a virtual environment, activate it before running any commands.
   - Reinstall dependencies with `uv pip install -r pyproject.toml` after activating the correct environment.
4. **If still broken**
   - Try `uv pip install email-validator` explicitly.
   - If using system Python, consider switching to a virtual environment.

### Environment Diagnostics

- Add a Makefile or script target to print environment info:
  - Python executable path
  - Installed packages
  - Environment variables (safe subset)

#### Example Makefile target:

```makefile
env-diagnostics:
	python -c "import sys; print('Python:', sys.executable)"
	python -m pip list
```

### Regression Checklist

- [ ] After any dependency or environment change, verify all required packages are present with `uv pip list` and `uv pip check`.
- [ ] Confirm the Python interpreter matches the one used for development and deployment.
- [ ] Add new troubleshooting steps to this section as issues are discovered.
