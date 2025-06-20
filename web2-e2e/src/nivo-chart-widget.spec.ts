import { test, expect } from '@playwright/test';
import { expectVisualRegression, expectA11y } from './visual-regression-utils';

const storybookBase = 'http://localhost:6006/iframe.html?id=';

test.describe('NivoChartWidget', () => {
  test('renders BarChart story and is accessible', async ({ page }) => {
    await page.goto(`${storybookBase}dashboard-nivochartwidget--bar-chart`);
    // Wait for chart to be present in DOM (not necessarily visible)
    await page.waitForSelector('[aria-label="Bar chart demo"]', { state: 'attached', timeout: 10000 });
    // Wait a bit more for the chart to fully render
    await page.waitForTimeout(2000);
    await expect(page.getByLabel('Bar chart demo')).toBeAttached();
    await expect(page.getByRole('region')).toBeAttached();
    await expectVisualRegression(page, 'nivochartwidget-bar-chart');
    await expectA11y(page);
  });

  test('renders LineChart story and is accessible', async ({ page }) => {
    await page.goto(`${storybookBase}dashboard-nivochartwidget--line-chart`);
    // Wait for chart to be present in DOM (not necessarily visible)
    await page.waitForSelector('[aria-label="Line chart demo"]', { state: 'attached', timeout: 10000 });
    // Wait a bit more for the chart to fully render
    await page.waitForTimeout(2000);
    await expect(page.getByLabel('Line chart demo')).toBeAttached();
    await expect(page.getByRole('region')).toBeAttached();
    await expectVisualRegression(page, 'nivochartwidget-line-chart');
    await expectA11y(page);
  });

  test('renders PieChart story and is accessible', async ({ page }) => {
    await page.goto(`${storybookBase}dashboard-nivochartwidget--pie-chart`);
    // Wait for chart to be present in DOM (not necessarily visible)
    await page.waitForSelector('[aria-label="Pie chart demo"]', { state: 'attached', timeout: 10000 });
    // Wait a bit more for the chart to fully render
    await page.waitForTimeout(2000);
    await expect(page.getByLabel('Pie chart demo')).toBeAttached();
    await expect(page.getByRole('region')).toBeAttached();
    await expectVisualRegression(page, 'nivochartwidget-pie-chart');
    await expectA11y(page);
  });
}); 