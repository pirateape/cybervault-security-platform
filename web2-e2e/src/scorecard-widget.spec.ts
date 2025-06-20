import { test, expect } from '@playwright/test';

test.describe('ScorecardWidget', () => {
  test('renders and displays correct score and risk', async ({ page }) => {
    // TODO: Replace with real route if available
    await page.goto(
      '/storybook/iframe.html?id=dashboard-scorecardwidget--low-risk'
    );
    await expect(page.getByLabel('Compliance scorecard')).toBeVisible();
    await expect(page.getByText('98%')).toBeVisible();
    await expect(page.getByLabel('Risk: low')).toBeVisible();
  });
});
