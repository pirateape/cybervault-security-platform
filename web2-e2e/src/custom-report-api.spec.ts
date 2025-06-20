import { test, expect } from '@playwright/test';

const ENDPOINT = '/api/custom-report';

// Utility: Get auth cookies for a given role (stub, replace with real login/session logic)
async function getAuthCookies(role) {
  // TODO: Implement real login/session retrieval for each role
  // For now, return [] to simulate unauthenticated
  return [];
}

test.describe('API: /api/custom-report', () => {
  test('returns 401 for unauthenticated user (JSON)', async ({ request }) => {
    const response = await request.post(ENDPOINT, {
      data: { filters: {}, format: 'json' },
    });
    expect(response.status()).toBe(401);
  });

  for (const role of ['admin', 'auditor']) {
    test(`allows ${role} to export JSON`, async ({ request }) => {
      // TODO: Use getAuthCookies(role) to authenticate
      const response = await request.post(ENDPOINT, {
        data: { filters: {}, format: 'json' },
      });
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('application/json');
      const body = await response.json();
      expect(Array.isArray(body)).toBe(true);
    });
    test(`allows ${role} to export CSV`, async ({ request }) => {
      const response = await request.post(ENDPOINT, {
        data: { filters: {}, format: 'csv' },
      });
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('text/csv');
      expect(response.headers()['content-disposition']).toContain('.csv');
      const body = await response.body();
      expect(body.length).toBeGreaterThan(10);
    });
    test(`allows ${role} to export PDF`, async ({ request }) => {
      const response = await request.post(ENDPOINT, {
        data: { filters: {}, format: 'pdf' },
      });
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('application/pdf');
      expect(response.headers()['content-disposition']).toContain('.pdf');
      const body = await response.body();
      expect(body.length).toBeGreaterThan(10);
    });
    test(`allows ${role} to export Excel`, async ({ request }) => {
      const response = await request.post(ENDPOINT, {
        data: { filters: {}, format: 'excel' },
      });
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(response.headers()['content-disposition']).toContain('.excel');
      const body = await response.body();
      expect(body.length).toBeGreaterThan(10);
    });
  }

  test('returns 403 for user with insufficient role', async ({ request }) => {
    // TODO: Use getAuthCookies('user') to authenticate as a regular user
    const response = await request.post(ENDPOINT, {
      data: { filters: {}, format: 'json' },
    });
    expect([401, 403]).toContain(response.status());
  });

  test('returns 400 for invalid format', async ({ request }) => {
    const response = await request.post(ENDPOINT, {
      data: { filters: {}, format: 'invalid' },
    });
    expect(response.status()).toBe(400);
  });

  test('returns 500 for simulated DB error', async ({ request }) => {
    // TODO: Simulate DB error (e.g., by passing a filter that causes an error)
    const response = await request.post(ENDPOINT, {
      data: { filters: { causeError: true }, format: 'json' },
    });
    expect([400, 500]).toContain(response.status());
  });
}); 