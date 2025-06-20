// visual-regression-utils.ts
// Utility functions for Playwright visual regression and accessibility testing
import { expect, Page } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

/**
 * Capture a screenshot and compare to baseline for visual regression.
 * @param page Playwright Page
 * @param name Unique name for the screenshot
 */
export async function expectVisualRegression(page: Page, name: string) {
  const screenshot = await page.screenshot();
  expect(screenshot).toMatchSnapshot(`${name}.png`, { threshold: 0.01 });
}

/**
 * Inject axe and run accessibility checks, failing on violations.
 * @param page Playwright Page
 * @param context Optional selector for scoping a11y check
 */
export async function expectA11y(page: Page, context?: string) {
  await injectAxe(page);
  await checkA11y(page, context || 'body', {
    detailedReport: true,
    detailedReportOptions: { html: true },
  });
} 