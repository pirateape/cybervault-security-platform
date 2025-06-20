import { test, expect } from '@playwright/test';

test.describe('Scan Trigger Flow', () => {
  test('user can trigger a scan and see success feedback', async ({ page }) => {
    // 1. Navigate to the login page
    await page.goto('/login');

    // 2. Log in as test user
    await page.getByLabel('Email').fill('testuser@example.com');
    await page.getByLabel('Password').fill('testpassword');
    await page.getByRole('button', { name: /login/i }).click();
    // Wait for dashboard heading to be visible
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible(
      { timeout: 5000 }
    );
    // Best practice: Wait for scan trigger button to be enabled (ensures orgId/user.id are set)
    await expect(
      page.getByRole('button', { name: /trigger scan/i })
    ).toBeEnabled({ timeout: 7000 });

    // 3. Open the scan trigger modal
    await page.getByRole('button', { name: /trigger scan/i }).click();

    // 4. Select scan type (compliance)
    await page.getByLabel('Scan Type').selectOption('compliance');

    // 5. Enter target
    await page.getByLabel(/target/i).fill('testuser@example.com');

    // 6. Enter valid JSON metadata
    await page.getByLabel(/metadata/i).fill('{"key": "value"}');

    // 7. Submit the scan
    // Best practice: Wait for Start Scan button to be enabled before clicking (handles async state)
    await expect(page.getByRole('button', { name: /start scan/i })).toBeEnabled(
      { timeout: 7000 }
    );
    await page.getByRole('button', { name: /start scan/i }).click();

    // Debug: Capture screenshot and print page content after submitting scan
    await page.screenshot({ path: 'scan-trigger-debug.png' });
    // eslint-disable-next-line no-console
    console.log(await page.content());

    // 8. Verify the success toast
    // Best practice: Chakra UI toasts may render in a portal and not be found by getByText or getByRole('status').
    // Use a robust locator for the toast: div[role="alert"]:has-text("Scan triggered")
    try {
      await expect(
        page.locator('div[role="alert"]:has-text("Scan triggered")')
      ).toBeVisible({ timeout: 7000 });
    } catch (e) {
      // If success toast not found, log any error alert for diagnostics
      const errorAlert = await page.locator('div[role="alert"]').textContent();
      console.error('Scan trigger error alert:', errorAlert);
      throw e;
    }

    // 9. Optionally, check that results table refreshes (look for a row with the target or a new timestamp)
    // This step may require a mock or test backend to ensure deterministic results
    // await expect(page.getByText('testuser@example.com')).toBeVisible();
  });
});
