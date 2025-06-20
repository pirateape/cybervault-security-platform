import { test, expect } from '@playwright/test';

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin user
    await page.goto('/login');
    await page.getByLabel('Email').fill('testuser@example.com');
    await page.getByLabel('Password').fill('testpassword');
    await page.getByRole('button', { name: /login/i }).click();
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible(
      { timeout: 5000 }
    );
  });

  test('navigation has proper ARIA labels and roles', async ({ page }) => {
    // Check navigation accessibility
    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(nav).toBeVisible();

    // Check all navigation links are accessible
    const dashboardLink = page.getByRole('link', { name: 'Dashboard' });
    const userMgmtLink = page.getByRole('link', { name: 'User Management' });
    const onboardingLink = page.getByRole('link', { name: 'Onboarding' });

    await expect(dashboardLink).toBeVisible();
    await expect(userMgmtLink).toBeVisible();
    await expect(onboardingLink).toBeVisible();
  });

  test('keyboard navigation works properly', async ({ page }) => {
    // Test keyboard navigation through main elements
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(
      page.getByRole('link', { name: 'User Management' })
    ).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Onboarding' })).toBeFocused();
  });

  test('scan trigger modal has proper accessibility', async ({ page }) => {
    // Open scan trigger modal
    await page.getByRole('button', { name: /trigger scan/i }).click();

    // Check modal accessibility
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    // Check form labels and inputs
    await expect(page.getByLabel('Scan Type')).toBeVisible();
    await expect(page.getByLabel('Scan Target')).toBeVisible();
    await expect(page.getByLabel('Metadata (JSON, optional)')).toBeVisible();

    // Test keyboard navigation in modal
    await page.keyboard.press('Tab');
    await expect(page.getByLabel('Scan Type')).toBeFocused();
  });

  test('results table has proper accessibility', async ({ page }) => {
    // Navigate to a page with results table (assuming Dashboard has one)
    const table = page.getByRole('table', { name: 'Scan results table' });

    // Check if table exists (it might be empty)
    const tableExists = (await table.count()) > 0;

    if (tableExists) {
      await expect(table).toBeVisible();

      // Check column headers
      await expect(
        page.getByRole('columnheader', { name: /scan id/i })
      ).toBeVisible();
      await expect(
        page.getByRole('columnheader', { name: /finding/i })
      ).toBeVisible();
      await expect(
        page.getByRole('columnheader', { name: /severity/i })
      ).toBeVisible();
    }
  });

  test('user management page accessibility', async ({ page }) => {
    await page.getByRole('link', { name: /user management/i }).click();
    await expect(
      page.getByRole('heading', { name: /user management/i })
    ).toBeVisible();

    // Check if users table is accessible
    const usersTable = page.locator('table').first();
    if ((await usersTable.count()) > 0) {
      // Check action buttons have proper labels
      const disableButtons = page.getByRole('button', { name: /disable/i });
      const deleteButtons = page.getByRole('button', { name: /delete/i });

      if ((await disableButtons.count()) > 0) {
        await expect(disableButtons.first()).toBeVisible();
      }

      if ((await deleteButtons.count()) > 0) {
        await expect(deleteButtons.first()).toBeVisible();
      }
    }
  });

  test('error messages are announced to screen readers', async ({ page }) => {
    // Test error message accessibility in scan modal
    await page.getByRole('button', { name: /trigger scan/i }).click();

    // Try to submit with invalid data to trigger error
    await page.getByRole('button', { name: /start scan/i }).click();

    // Check if error alerts have proper role
    const errorAlerts = page.getByRole('alert');
    if ((await errorAlerts.count()) > 0) {
      await expect(errorAlerts.first()).toBeVisible();
    }
  });

  test('focus management in modals', async ({ page }) => {
    // Open scan modal
    await page.getByRole('button', { name: /trigger scan/i }).click();

    // Focus should be trapped in modal
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    // Close modal and check focus returns
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();

    // Focus should return to trigger button
    await expect(
      page.getByRole('button', { name: /trigger scan/i })
    ).toBeFocused();
  });
});
