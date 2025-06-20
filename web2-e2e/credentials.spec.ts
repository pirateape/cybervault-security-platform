import { test, expect } from '@playwright/test';

// Test data setup (replace with your actual test users/tenants)
const admin = { email: 'admin-a@example.com', password: 'passwordA', org: 'TenantA' };
const member = { email: 'member-b@example.com', password: 'passwordB', org: 'TenantB' };

/**
 * Logs in a user using the login form.
 * @param page Playwright page object
 * @param user User credentials
 */
async function login(page, { email, password }) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /sign in|login/i }).click();
  await expect(page).toHaveURL(/dashboard/);
}

test.describe('CredentialManager RBAC, Multi-Tenant, and Security', () => {
  test('Tenant admin can CRUD credentials', async ({ page }) => {
    await login(page, admin);
    await page.goto(`/organizations/${admin.org}/credentials`);
    await page.getByRole('button', { name: /add credential/i }).click();
    await page.getByLabel('Name').fill('e2e-cred');
    await page.getByLabel(/encrypted value|secret/i).fill('secret');
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByRole('cell', { name: 'e2e-cred' })).toBeVisible();
    await page.getByRole('button', { name: /edit/i }).click();
    await page.getByLabel(/encrypted value|secret/i).fill('new-secret');
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByRole('cell', { name: 'e2e-cred' })).toBeVisible();
    await page.getByRole('button', { name: /delete/i }).click();
    await page.getByRole('button', { name: /confirm/i }).click();
    await expect(page.getByRole('cell', { name: 'e2e-cred' })).not.toBeVisible();
  });

  test('Tenant member can only view credentials and is blocked from admin actions', async ({ page }) => {
    await login(page, member);
    await page.goto(`/organizations/${member.org}/credentials`);
    await expect(page.getByRole('button', { name: /add credential/i })).toBeDisabled();
    await expect(page.getByRole('button', { name: /edit/i })).toBeDisabled();
    await expect(page.getByRole('button', { name: /delete/i })).toBeDisabled();
    // Try to submit the form directly (should be blocked)
    await page.evaluate(() => {
      const btn = document.querySelector('button[type="submit"]');
      if (btn) (btn as HTMLButtonElement).disabled = false;
    });
    await page.getByRole('button', { name: /add credential/i }).click({ force: true });
    await page.getByLabel('Name').fill('should-not-work');
    await page.getByLabel(/encrypted value|secret/i).fill('fail');
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText(/not authorized|access denied|forbidden/i)).toBeVisible();
  });

  test('Cross-tenant access is not possible (UI)', async ({ page }) => {
    await login(page, admin);
    await page.goto(`/organizations/${member.org}/credentials`);
    await expect(page.getByText(/access denied|not authorized|forbidden/i)).toBeVisible();
  });

  test('Member cannot access admin UI via direct navigation', async ({ page }) => {
    await login(page, member);
    await page.goto(`/organizations/${member.org}/credentials`);
    await expect(page.getByRole('button', { name: /add credential/i })).toBeDisabled();
    await expect(page.getByRole('button', { name: /edit/i })).toBeDisabled();
    await expect(page.getByRole('button', { name: /delete/i })).toBeDisabled();
  });
}); 