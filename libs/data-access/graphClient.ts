import { getGraphAccessToken } from '../auth/msalAuth.js';
// If not already installed, run: npm install node-fetch
import fetch, { RequestInit } from 'node-fetch';

// List of PII fields to strip if STORE_PII is not enabled
const PII_FIELDS = [
  'mail',
  'userPrincipalName',
  'displayName',
  'givenName',
  'surname',
  'mobilePhone',
  'businessPhones',
  'jobTitle',
  'officeLocation',
  'department',
];

/**
 * Strips PII fields from an object or array of objects.
 * @param data - The data to filter
 * @returns The filtered data
 */
function stripPII(data: any): any {
  if (Array.isArray(data)) {
    return data.map(stripPII);
  }
  if (typeof data === 'object' && data !== null) {
    const filtered = { ...data };
    for (const field of PII_FIELDS) {
      if (field in filtered) {
        delete filtered[field];
      }
    }
    return filtered;
  }
  return data;
}

/**
 * Fetches data from the Microsoft Graph API using an authenticated request.
 * If STORE_PII is not set to 'true', strips PII fields from the result.
 * @param endpoint - The Microsoft Graph API endpoint (e.g., '/users', '/groups')
 * @param options - Optional fetch options (method, headers, body, etc.)
 * @returns The parsed JSON response from Microsoft Graph (PII filtered if required)
 * @throws If the request fails or returns a non-2xx status
 */
export async function fetchGraphData(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const accessToken = await getGraphAccessToken();
  const url = endpoint.startsWith('https://')
    ? endpoint
    : `https://graph.microsoft.com/v1.0${
        endpoint.startsWith('/') ? endpoint : '/' + endpoint
      }`;

  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Graph API request failed: ${response.status} ${response.statusText}\n${errorText}`
    );
  }
  const result: any = await response.json();
  const storePII = process.env.STORE_PII === 'true';
  const timestamp = new Date().toISOString();
  if (!storePII) {
    console.info(
      `[PII] Stripped PII fields from Graph API response for endpoint '${endpoint}' at ${timestamp}`
    );
    // If the result is a paginated Graph response, filter the 'value' array
    if (result && typeof result === 'object' && Array.isArray(result.value)) {
      return { ...result, value: stripPII(result.value) };
    }
    return stripPII(result);
  } else {
    console.info(
      `[PII] Stored PII fields from Graph API response for endpoint '${endpoint}' at ${timestamp}`
    );
  }
  return result;
}

/*
// Usage Example:
(async () => {
  try {
    const users = await fetchGraphData('/users');
    console.log('Graph users:', users);
  } catch (err) {
    console.error('Graph API error:', err);
  }
})();
*/
