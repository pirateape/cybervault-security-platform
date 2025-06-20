import { test, expect } from '@playwright/test';

// Utility: Login as a specific role (admin, auditor, user)
async function loginAs(page, role) {
  // Implement login logic for each role (stub: replace with actual login flow)
  await page.goto('/login');
  await page.fill('[data-testid="email-input"]', `${role}@example.com`);
  await page.fill('[data-testid="password-input"]', 'password');
  await page.click('[data-testid="login-button"]');
  await page.waitForURL('/');
}

test.describe('Rule Management E2E', () => {
  test('Admin can create, edit, delete, and restore rules', async ({
    page,
  }) => {
    await loginAs(page, 'admin');
    await page.goto('/rules');

    // Create rule
    await page.click('[data-testid="create-rule-button"]');
    await page.fill('[data-testid="rule-name-input"]', 'E2E Test Rule');
    await page.fill(
      '[data-testid="monaco-editor"]',
      '{ "condition": "always true" }'
    );
    await page.click('[data-testid="save-rule-button"]');
    await expect(page.locator('[data-testid="rule-list"]')).toContainText(
      'E2E Test Rule'
    );

    // Edit rule
    await page.click('[data-testid="edit-rule-button-E2E Test Rule"]');
    await page.fill(
      '[data-testid="monaco-editor"]',
      '{ "condition": "always false" }'
    );
    await page.click('[data-testid="save-rule-button"]');
    await expect(page.locator('[data-testid="rule-list"]')).toContainText(
      'E2E Test Rule'
    );

    // Version history
    await page.click('[data-testid="version-history-button-E2E Test Rule"]');
    await expect(page.locator('[data-testid="version-list"]')).toBeVisible();

    // Restore version
    await page.click('[data-testid="restore-version-button-0"]');
    await expect(page.locator('[data-testid="monaco-editor"]')).toContainText(
      'always true'
    );

    // Delete rule
    await page.click('[data-testid="delete-rule-button-E2E Test Rule"]');
    await page.click('[data-testid="confirm-delete-button"]');
    await expect(page.locator('[data-testid="rule-list"]')).not.toContainText(
      'E2E Test Rule'
    );
  });

  test('Auditor can view but not edit or delete rules', async ({ page }) => {
    await loginAs(page, 'auditor');
    await page.goto('/rules');
    await expect(
      page.locator('[data-testid="create-rule-button"]')
    ).toBeDisabled();
    await page.click('[data-testid="rule-list-item-0"]');
    await expect(
      page.locator('[data-testid="edit-rule-button"]')
    ).toBeDisabled();
    await expect(
      page.locator('[data-testid="delete-rule-button"]')
    ).toBeDisabled();
  });

  test('Unauthorized user cannot access rule management', async ({ page }) => {
    await page.goto('/rules');
    await expect(page.locator('[data-testid="login-page"]')).toBeVisible();
  });
});
