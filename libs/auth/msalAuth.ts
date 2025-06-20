import 'dotenv/config';
// NOTE: This module is for backend/server-side use only. Do NOT import in frontend code.
// It handles secure authentication for Microsoft Graph API using @azure/msal-node.
import { ConfidentialClientApplication, Configuration } from '@azure/msal-node';

/**
 * Loads MSAL configuration from environment variables.
 * Throws if any required variable is missing.
 */
function getMsalConfig(): Configuration {
  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;
  const tenantId = process.env.TENANT_ID;

  if (!clientId || !clientSecret || !tenantId) {
    throw new Error(
      'Missing required environment variables: CLIENT_ID, CLIENT_SECRET, TENANT_ID'
    );
  }

  return {
    auth: {
      clientId,
      clientSecret,
      authority: `https://login.microsoftonline.com/${tenantId}`,
    },
    system: {
      loggerOptions: {
        loggerCallback(loglevel, message) {
          if (loglevel <= 2) console.log(message);
        },
        piiLoggingEnabled: false,
        logLevel: 2, // Info
      },
    },
  };
}

const msalClient = new ConfidentialClientApplication(getMsalConfig());

/**
 * Acquires a Microsoft Graph access token using the Client Credentials flow.
 * @returns {Promise<string>} The access token string.
 */
export async function getGraphAccessToken(): Promise<string> {
  const result = await msalClient.acquireTokenByClientCredential({
    scopes: ['https://graph.microsoft.com/.default'],
  });
  if (!result || !result.accessToken) {
    throw new Error('Failed to acquire Microsoft Graph access token');
  }
  return result.accessToken;
}

// ESM-compatible direct execution check
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    try {
      const token = await getGraphAccessToken();
      console.log(
        'Successfully acquired Microsoft Graph access token:',
        token.substring(0, 32) + '...'
      );
    } catch (err) {
      console.error('Error acquiring token:', err);
      process.exit(1);
    }
  })();
}
