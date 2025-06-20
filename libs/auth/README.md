# MSAL Authentication Module for Microsoft Graph API

This module provides secure OAuth2 authentication for Microsoft Graph API using `@azure/msal-node` and the Client Credentials flow.

## Usage

Import and use the `getGraphAccessToken` function in your backend services:

```typescript
import { getGraphAccessToken } from './msalAuth';

async function example() {
  const token = await getGraphAccessToken();
  // Use the token to call Microsoft Graph API
}
```

## Required Environment Variables

- `CLIENT_ID`: Azure AD Application (client) ID
- `CLIENT_SECRET`: Azure AD Application client secret
- `TENANT_ID`: Azure AD Tenant ID

## Security Notes

- **Never** commit secrets to source control.
- Use a secure vault or environment variable manager in production.
- Tokens are acquired on demand and not persisted.
- This module is designed for backend/server-side use only.
