import { test, expect } from '@playwright/test';

test.describe('User Management Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('testuser@example.com');
    await page.getByLabel('Password').fill('testpassword');
    await page.getByRole('button', { name: /login/i }).click();
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible(
      { timeout: 5000 }
    );
    await page.getByRole('link', { name: /user management/i }).click();
    await expect(
      page.getByRole('heading', { name: /user management/i })
    ).toBeVisible({ timeout: 5000 });
  });

  test('admin can disable, enable, and delete a user', async ({ page }) => {
    // Wait for users table to load
    await expect(page.getByText('testuser2@example.com')).toBeVisible({
      timeout: 7000,
    });
    // Disable user
    const disableBtn = page.getByRole('button', { name: /disable/i }).first();
    await expect(disableBtn).toBeEnabled();
    await disableBtn.click();
    // Status should update to Disabled
    await expect(page.getByText('Disabled')).toBeVisible({ timeout: 5000 });
    // Enable user
    const enableBtn = page.getByRole('button', { name: /enable/i }).first();
    await expect(enableBtn).toBeEnabled();
    await enableBtn.click();
    await expect(page.getByText('Active')).toBeVisible({ timeout: 5000 });
    // Delete user (confirm dialog)
    const deleteBtn = page.getByRole('button', { name: /delete/i }).first();
    await expect(deleteBtn).toBeEnabled();
    // Intercept window.confirm and accept
    await page.evaluate(() => (window.confirm = () => true));
    await deleteBtn.click();
    // User row should disappear
    await expect(page.getByText('testuser2@example.com')).not.toBeVisible({
      timeout: 7000,
    });
  });

  test('user cannot disable or delete self', async ({ page }) => {
    await expect(page.getByText('testuser@example.com')).toBeVisible({
      timeout: 7000,
    });
    const selfRow = page
      .getByText('testuser@example.com')
      .locator('..')
      .locator('..');
    const disableBtn = selfRow.getByRole('button', { name: /disable/i });
    const deleteBtn = selfRow.getByRole('button', { name: /delete/i });
    await expect(disableBtn).toBeDisabled();
    await expect(deleteBtn).toBeDisabled();
  });

  test('cannot disable or delete last admin', async ({ page }) => {
    // Assumes testuser@example.com is the last admin
    await expect(page.getByText('testuser@example.com')).toBeVisible({
      timeout: 7000,
    });
    const selfRow = page
      .getByText('testuser@example.com')
      .locator('..')
      .locator('..');
    const disableBtn = selfRow.getByRole('button', { name: /disable/i });
    const deleteBtn = selfRow.getByRole('button', { name: /delete/i });
    await expect(disableBtn).toBeDisabled();
    await expect(deleteBtn).toBeDisabled();
    // Optionally, check for tooltip or error message if attempted
  });

  test('non-admin cannot disable, enable, or delete other users', async ({
    page,
  }) => {
    // Log out and log in as a non-admin user
    await page.getByRole('button', { name: /logout/i }).click();
    await page.getByLabel('Email').fill('regularuser@example.com');
    await page.getByLabel('Password').fill('testpassword');
    await page.getByRole('button', { name: /login/i }).click();
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible(
      { timeout: 5000 }
    );
    await page.getByRole('link', { name: /user management/i }).click();
    await expect(
      page.getByRole('heading', { name: /user management/i })
    ).toBeVisible({ timeout: 5000 });
    // Try to find disable/enable/delete buttons for other users
    const otherRow = page
      .getByText('testuser@example.com')
      .locator('..')
      .locator('..');
    const disableBtn = otherRow.getByRole('button', { name: /disable/i });
    const enableBtn = otherRow.getByRole('button', { name: /enable/i });
    const deleteBtn = otherRow.getByRole('button', { name: /delete/i });
    await expect(disableBtn).toBeDisabled();
    await expect(enableBtn).toBeDisabled();
    await expect(deleteBtn).toBeDisabled();
  });

  // TODO: Add audit log verification after destructive actions
});
