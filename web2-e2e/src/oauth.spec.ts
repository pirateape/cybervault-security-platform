import { test, expect, Page } from '@playwright/test';

test.describe('OAuth Flow Verification', () => {
  // Navigate to the root. Playwright will use the `baseURL` from the config.
  // If your app redirects unauthenticated users to /login, this will work seamlessly.
  const loginPageUrl = 'http://localhost:3000/';

  test.beforeEach(async ({ page }) => {
    await page.goto(loginPageUrl);
    // Wait for the main auth container to be visible
    await expect(page.locator('[data-testid="auth-component"]')).toBeVisible({ timeout: 20000 });
  });

  /**
   * Verifies that clicking the Google login button initiates the OAuth flow
   * by checking if the page navigates to a URL containing 'accounts.google.com'.
   */
  test('should initiate Google OAuth flow', async ({ page }) => {
    // Click the Google login button
    await page.locator('[data-testid="google-login-button"]').click();

    // Wait for the navigation to Google's authentication page
    await page.waitForURL('**/accounts.google.com/**', { timeout: 15000 });

    // Assert that the URL is correct
    await expect(page).toHaveURL(/accounts\.google\.com/);

    // Note: We cannot proceed further without real credentials.
    // This test successfully verifies that the initial step of the OAuth flow works.
  });

  /**
   * Verifies that clicking the GitHub login button initiates the OAuth flow
   * by checking if the page navigates to a URL containing 'github.com/login'.
   */
  test('should initiate GitHub OAuth flow', async ({ page }) => {
    // Click the GitHub login button
    await page.locator('[data-testid="github-login-button"]').click();
    
    // Wait for the navigation to GitHub's authentication page
    await page.waitForURL('**/github.com/login/**', { timeout: 15000 });

    // Assert that the URL is correct
    await expect(page).toHaveURL(/github\.com\/login/);

    // Note: This confirms the initial redirect is correct.
  });
  
  /**
   * This is a placeholder for a more comprehensive test that would run after
   * configuring a mock OAuth server or using development credentials.
   * It checks for a successful redirect back to the application dashboard.
   */
  test.skip('should redirect to dashboard after successful OAuth login', async ({ page }) => {
    // This test would require a mock OAuth flow.
    // 1. Initiate login (e.g., Google)
    // 2. Intercept and mock the provider's response
    // 3. Verify the user is redirected back to the app's dashboard
    await page.goto('http://localhost:3000/dashboard'); // Placeholder
    await expect(page.locator('h1')).toHaveText(/Dashboard/);
  });
}); 