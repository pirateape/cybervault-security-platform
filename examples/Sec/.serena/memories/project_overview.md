# Project Overview: Security Compliance Tool

## Purpose

Automates compliance scanning for Microsoft 365, Azure Entra ID, and Power Platform, targeting regulated industries. Detects misconfigurations, aligns with compliance frameworks (NIST, ISO 27001, CIS, Essential 8), and provides dashboards, reporting, and remediation.

## Tech Stack

- **Backend:** Python (FastAPI, requests, pytest, Supabase REST API)
- **Frontend:** React, Vite, Chakra UI, React Query, Zod, Supabase-js, MSAL
- **Database:** Supabase (Postgres, REST API)
- **E2E:** Playwright, browsermcp (preferred, but not working in this env)
- **Cloud:** Azure/AWS for microservices/AI agent

## Structure

- `/frontend`: React SPA dashboard
- `/tests`: Backend unit/integration tests, seeding scripts
- `/test-results`: Playwright/browsermcp E2E results
- `api.py`, `auth.py`, `ms_api.py`, `supabase_client.py`: Backend entrypoints
- `db_schema.sql`: DB schema
- `Architecture.md`, `README.md`, `Tasks.md`: Docs

## Key Features

- Multi-org, RBAC, secure credential mgmt, modular rule engine, AI agent, robust error handling, modular frontend components, E2E automation.

See Architecture.md for more details.
