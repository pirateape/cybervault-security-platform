# Architecture (Examples)

> **Note:** This document describes the example/demo architecture. The production backend architecture is now in `apps/api/`.

## Summary

- **Data Ingestion Layer**: API connectors for Microsoft 365, Azure, Power Platform (via msgraph-sdk, azure-identity, msal).
- **Compliance Engine**: Rule-based and AI-driven logic.
- **Reporting Layer**: Dashboards, exportable reports.
- **Backend**: Supabase (Postgres) for data storage and user management, with org_id on all tables. All backend DB access is now via Supabase REST API (PostgREST) using the Python requests library. No supabase-py or postgrest-py dependencies are required.
- **Cloud Hosting**: Azure/AWS for microservices and AI agent.

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

## High-Level Diagram

```
+-------------------+      +-------------------+      +-------------------+
| Microsoft 365     |      | Azure Entra ID    |      | Power Platform    |
+-------------------+      +-------------------+      +-------------------+
         |                        |                        |
         |  (API Integration)     |  (API Integration)     |  (API Integration)
         |                        |                        |
         v                        v                        v
+---------------------------------------------------------------+
|                  Data Ingestion Layer                         |
|  - Microsoft Graph API, Power Platform API, Custom Connectors |
+---------------------------------------------------------------+
         |
         v
+---------------------------------------------------------------+
|                  Compliance Engine                            |
|  - Rule-based checks (NIST, ISO 27001, CIS, Essential 8)      |
|  - AI Agent (ML/NLP for code/config analysis)                 |
|  - Custom Rule Engine                                         |
+---------------------------------------------------------------+
         |
         v
+-------------------+      +-------------------+
| Reporting Layer   |<---->| Supabase Backend  |
| - Dashboards      |      | - User mgmt       |
| - Export Reports  |      | - Scan results    |
+-------------------+      | - Audit logs      |
                         | - org_id on all tables (multi-tenant)
                         | - Per-org credential management
                         +-------------------+
         |
         v
+-------------------+
| User Interface    |
| - Web Dashboard   |
| - API Access      |
+-------------------+
```

## Component Breakdown

- See README.md for detailed feature and component descriptions.

## Troubleshooting & Recommendations

- See Tasks.md for ongoing improvements, troubleshooting, and recommendations.
- For Python dependency issues, use `uv` and ensure all packages are present in pyproject.toml and uv.lock.
- For frontend issues, ensure Node.js 18+, all dependencies installed, and environment variables set.
- For E2E, ensure dev server is running, test users/orgs/data are seeded, and Playwright config is correct.
- For dashboard layout and widget issues, see code comments and Tasks.md for zIndex, scaling, and drag-and-drop troubleshooting.
- For admin password reset, see UserManagement page and API endpoint documentation.
- For Monaco Editor integration, see CodeAnalysisEditor, AIFeedbackPanel, and backend API endpoints.
- **jose/python-jose Issue:**
  - The legacy 'jose' package is Python 2 only and incompatible with FastAPI/JWT usage. The correct package is 'python-jose[cryptography]'.
  - If you see SyntaxError or JWT import errors, check for the wrong 'jose' package. Always use 'python-jose'.
  - See Tasks.md for troubleshooting steps.

## Microsoft Graph Integration

- Uses msgraph-sdk for all Microsoft Graph API access.
- Auth via azure-identity (recommended) or msal for advanced scenarios.
- See Tasks.md for troubleshooting and best practices.

## Microsoft Graph Org Credential Management (Hybrid Pattern)

- Supabase table `ms_org_credentials` stores only org_id and a `secret_ref` (never secrets).
- Actual Microsoft API credentials are stored in Azure Key Vault, referenced by `secret_ref`.
- Backend fetches `secret_ref` from Supabase, then fetches credentials from Key Vault at runtime.
- All credential access is audit-logged (org_id, secret_ref, timestamp), never logs secrets.
- RLS ensures only org admins/owners can read/write their org's credential metadata.
- Dev fallback: env vars used if no Supabase record (with warning).
- Supports credential rotation, audit, and strong separation of duties.

## References

- [README.md](./README.md)
- [Tasks.md](./Tasks.md)
- [Testing Plan.md](./Testing%20Plan.md)
- [UI Design.md](./UI%20Design.md)
- [Product Requirements Document (PRD).md](<./Product%20Requirements%20Document%20(PRD).md>)
- [Business Plan.md](./Business%20Plan.md)
