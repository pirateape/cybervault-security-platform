import { test, expect } from '@playwright/test';

test.describe('Multi-Org Isolation Flows', () => {
  test('org1 admin can only see org1 data, org2 admin can only see org2 data', async ({
    page,
  }) => {
    // --- Org1 Admin ---
    await page.goto('/login');
    await page.getByLabel('Email').fill('testuser@example.com');
    await page.getByLabel('Password').fill('testpassword');
    await page.getByRole('button', { name: /login/i }).click();
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible(
      { timeout: 5000 }
    );
    // Trigger a scan for org1
    await expect(
      page.getByRole('button', { name: /trigger scan/i })
    ).toBeEnabled({ timeout: 7000 });
    await page.getByRole('button', { name: /trigger scan/i }).click();
    await page.getByLabel('Scan Type').selectOption('compliance');
    await page.getByLabel(/target/i).fill('testuser@example.com');
    await page.getByLabel(/metadata/i).fill('{"org": "org1"}');
    await expect(page.getByRole('button', { name: /start scan/i })).toBeEnabled(
      { timeout: 7000 }
    );
    await page.getByRole('button', { name: /start scan/i }).click();
    await expect(
      page.locator('div[role="alert"]:has-text("Scan triggered")')
    ).toBeVisible({ timeout: 7000 });
    // Verify only org1 results are visible (should see testuser@example.com, not org2admin@example.com)
    await expect(page.getByText('testuser@example.com')).toBeVisible();
    await expect(page.getByText('org2admin@example.com')).not.toBeVisible();
    // Log out
    await page.getByRole('button', { name: /logout/i }).click();

    // --- Org2 Admin ---
    await page.getByLabel('Email').fill('org2admin@example.com');
    await page.getByLabel('Password').fill('testpassword');
    await page.getByRole('button', { name: /login/i }).click();
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible(
      { timeout: 5000 }
    );
    // Trigger a scan for org2
    await expect(
      page.getByRole('button', { name: /trigger scan/i })
    ).toBeEnabled({ timeout: 7000 });
    await page.getByRole('button', { name: /trigger scan/i }).click();
    await page.getByLabel('Scan Type').selectOption('compliance');
    await page.getByLabel(/target/i).fill('org2admin@example.com');
    await page.getByLabel(/metadata/i).fill('{"org": "org2"}');
    await expect(page.getByRole('button', { name: /start scan/i })).toBeEnabled(
      { timeout: 7000 }
    );
    await page.getByRole('button', { name: /start scan/i }).click();
    await expect(
      page.locator('div[role="alert"]:has-text("Scan triggered")')
    ).toBeVisible({ timeout: 7000 });
    // Verify only org2 results are visible (should see org2admin@example.com, not testuser@example.com)
    await expect(page.getByText('org2admin@example.com')).toBeVisible();
    await expect(page.getByText('testuser@example.com')).not.toBeVisible();
  });
});
