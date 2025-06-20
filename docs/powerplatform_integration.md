# Power Platform API Integration Preparation

## 1. Azure AD Application Registration (Service Principal)

- Go to Azure Portal > Azure Active Directory > App registrations > New registration.
- Name: `SecComp Power Platform Integration`
- Supported account types: Single tenant (recommended for most orgs)
- Redirect URI: (leave blank for backend integration)
- After registration, note:
  - Application (client) ID
  - Directory (tenant) ID

### API Permissions

- Add permissions:
  - `Dynamics CRM` > `user_impersonation` (Delegated)
  - `PowerApps Service` > `user_impersonation` (Delegated)
  - `Microsoft Graph` > (as needed)
- Grant admin consent.

### Certificates & Secrets

- Create a new client secret. Note the value (store securely).

---

## 2. Assign Application User in Power Platform Environment

- Once you have a Power Platform environment:
  - Go to Power Platform Admin Center > Environment > Settings > Users + permissions > Application users.
  - Add the Azure AD app registration as an application user.
  - Assign the "System Administrator" role (or least-privilege required).

---

## 3. Backend Integration Configuration

- Add the following environment variables to your backend service (e.g., in `.env` or Supabase secrets):

  ```
  POWERPLATFORM_CLIENT_ID=your-client-id
  POWERPLATFORM_CLIENT_SECRET=your-client-secret
  POWERPLATFORM_TENANT_ID=your-tenant-id
  POWERPLATFORM_ENVIRONMENT_URL=https://your-environment.crm.dynamics.com/
  ```

- These will be used by the backend FastAPI service for authentication.

---

## 4. API Endpoints

The following endpoints are available for Power Platform integration (returning mock data until a live environment is configured):

### Health Check

- `GET /powerplatform/health`
  - Returns: `{ "status": "ok", "token_preview": "..." }` if configuration is valid.

### List Power Apps

- `GET /powerplatform/apps`
  - Returns:
    ```json
    {
      "apps": [
        {
          "id": "mock-app-1",
          "displayName": "Sample Power App 1",
          "type": "CanvasApp"
        },
        {
          "id": "mock-app-2",
          "displayName": "Sample Power App 2",
          "type": "ModelDrivenApp"
        }
      ]
    }
    ```

### List Power Automate Flows

- `GET /powerplatform/flows`
  - Returns:
    ```json
    {
      "flows": [
        {
          "id": "mock-flow-1",
          "displayName": "Sample Flow 1",
          "state": "Started"
        },
        {
          "id": "mock-flow-2",
          "displayName": "Sample Flow 2",
          "state": "Stopped"
        }
      ]
    }
    ```

### Scan Result Storage

Scan results are stored in the `powerplatform_scan_results` table in Supabase/Postgres. This table is designed for extensibility, security, and auditability.

### Table Schema

- `id` (UUID, PK): Unique scan result ID
- `solution_name` (text): Name of the scanned solution
- `solution_path` (text): Path or identifier of the solution
- `scan_timestamp` (timestamptz): When the scan was performed
- `findings` (jsonb): Array of findings (compliance, security, best-practice issues)
- `summary` (jsonb): Summary of scan results (counts, severity, etc)
- `initiated_by` (uuid): User who initiated the scan
- `status` (text): Scan status (completed, failed, pending, etc)
- `raw_response` (jsonb): Raw response from checker tool/API
- `created_at`, `updated_at` (timestamptz): Timestamps

Row Level Security (RLS) is enabled: only the user who initiated the scan can access their results (future: org-based RLS).

### API Behavior

- The `/powerplatform/scan` endpoint now stores the scan result and returns the stored record (not just the analysis result).

---

## 5. Error Handling and Response Formats

All Power Platform API endpoints return structured error responses on failure. Errors are logged server-side (no sensitive info is returned to clients).

### Error Response Format

```
{
  "error": "Human-readable error message.",
  "code": "ERROR_CODE"
}
```

### Example Error Responses

- Health check failure:
  ```json
  {
    "error": "Power Platform health check failed.",
    "code": "HEALTH_CHECK_FAILED"
  }
  ```
- List Power Apps failure:
  ```json
  { "error": "Failed to list Power Apps.", "code": "LIST_APPS_FAILED" }
  ```
- List Flows failure:
  ```json
  {
    "error": "Failed to list Power Automate Flows.",
    "code": "LIST_FLOWS_FAILED"
  }
  ```
- Scan/store failure:
  ```json
  { "error": "Failed to scan and store result.", "code": "SCAN_FAILED" }
  ```

All errors are logged for audit and debugging. No stack traces or sensitive details are exposed in API responses.

---

## 6. Next Steps

- Once the environment is available, update the configuration and complete the integration.
- Run the provided FastAPI integration code to validate connectivity and begin implementing scanning logic.
