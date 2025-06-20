import { test, expect } from '@playwright/test';

test.describe('CustomReportWidget', () => {
  test('renders and shows filter inputs', async ({ page }) => {
    await page.goto(
      '/storybook/iframe.html?id=dashboard-customreportwidget--empty'
    );
    await expect(page.getByLabel('Custom report widget')).toBeVisible();
    await expect(page.getByPlaceholder('Project')).toBeVisible();
    await expect(page.getByPlaceholder('Date')).toBeVisible();
  });
  test('shows report data table', async ({ page }) => {
    await page.goto(
      '/storybook/iframe.html?id=dashboard-customreportwidget--with-data'
    );
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByText('Alpha')).toBeVisible();
    await expect(page.getByText('Beta')).toBeVisible();
  });
});
