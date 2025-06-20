import { test, expect } from '@playwright/test';

test.describe('ExportWidget', () => {
  test('renders and shows export buttons', async ({ page }) => {
    await page.goto('/storybook/iframe.html?id=dashboard-exportwidget--idle');
    await expect(page.getByLabel('Export widget')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Export as PDF' })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Export as CSV' })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Export as Excel' })
    ).toBeVisible();
  });
  test('shows exporting status', async ({ page }) => {
    await page.goto(
      '/storybook/iframe.html?id=dashboard-exportwidget--exporting'
    );
    await expect(page.getByText('Exporting...')).toBeVisible();
  });
});
