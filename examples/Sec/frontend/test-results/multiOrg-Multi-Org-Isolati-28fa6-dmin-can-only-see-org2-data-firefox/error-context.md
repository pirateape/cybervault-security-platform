# Test info

- Name: Multi-Org Isolation Flows >> org1 admin can only see org1 data, org2 admin can only see org2 data
- Location: C:\Users\apese\src\Sec\frontend\src\e2e\multiOrg.spec.ts:4:7

# Error details

```
Error: Timed out 7000ms waiting for expect(locator).toBeVisible()

Locator: locator('div[role="alert"]:has-text("Scan triggered")')
Expected: visible
Received: <element(s) not found>
Call log:
  - expect.toBeVisible with timeout 7000ms
  - waiting for locator('div[role="alert"]:has-text("Scan triggered")')

    at C:\Users\apese\src\Sec\frontend\src\e2e\multiOrg.spec.ts:19:80
```

# Page snapshot

```yaml
- region "Notifications-top"
- region "Notifications-top-left"
- region "Notifications-top-right"
- region "Notifications-bottom-left"
- region "Notifications-bottom"
- region "Notifications-bottom-right"
- dialog "Trigger New Scan":
    - banner: Trigger New Scan
    - button "Close"
    - group:
        - text: Scan Type
        - combobox "Scan Type":
            - option "Compliance" [selected]
            - option "Security"
            - option "Custom"
    - group:
        - text: Target (optional)
        - textbox "Target (optional)": testuser@example.com
    - group:
        - text: Metadata (JSON, optional)
        - textbox "Metadata (JSON, optional)": '{"org": "org1"}'
        - button "Format JSON"
    - alert:
        - img
        - text: Failed to trigger scan
    - contentinfo:
        - button "Start Scan"
        - button "Cancel"
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 |
   3 | test.describe('Multi-Org Isolation Flows', () => {
   4 |   test('org1 admin can only see org1 data, org2 admin can only see org2 data', async ({ page }) => {
   5 |     // --- Org1 Admin ---
   6 |     await page.goto('/login');
   7 |     await page.getByLabel('Email').fill('testuser@example.com');
   8 |     await page.getByLabel('Password').fill('testpassword');
   9 |     await page.getByRole('button', { name: /login/i }).click();
  10 |     await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible({ timeout: 5000 });
  11 |     // Trigger a scan for org1
  12 |     await expect(page.getByRole('button', { name: /trigger scan/i })).toBeEnabled({ timeout: 7000 });
  13 |     await page.getByRole('button', { name: /trigger scan/i }).click();
  14 |     await page.getByLabel('Scan Type').selectOption('compliance');
  15 |     await page.getByLabel(/target/i).fill('testuser@example.com');
  16 |     await page.getByLabel(/metadata/i).fill('{"org": "org1"}');
  17 |     await expect(page.getByRole('button', { name: /start scan/i })).toBeEnabled({ timeout: 7000 });
  18 |     await page.getByRole('button', { name: /start scan/i }).click();
> 19 |     await expect(page.locator('div[role="alert"]:has-text("Scan triggered")')).toBeVisible({ timeout: 7000 });
     |                                                                                ^ Error: Timed out 7000ms waiting for expect(locator).toBeVisible()
  20 |     // Verify only org1 results are visible (should see testuser@example.com, not org2admin@example.com)
  21 |     await expect(page.getByText('testuser@example.com')).toBeVisible();
  22 |     await expect(page.getByText('org2admin@example.com')).not.toBeVisible();
  23 |     // Log out
  24 |     await page.getByRole('button', { name: /logout/i }).click();
  25 |
  26 |     // --- Org2 Admin ---
  27 |     await page.getByLabel('Email').fill('org2admin@example.com');
  28 |     await page.getByLabel('Password').fill('testpassword');
  29 |     await page.getByRole('button', { name: /login/i }).click();
  30 |     await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible({ timeout: 5000 });
  31 |     // Trigger a scan for org2
  32 |     await expect(page.getByRole('button', { name: /trigger scan/i })).toBeEnabled({ timeout: 7000 });
  33 |     await page.getByRole('button', { name: /trigger scan/i }).click();
  34 |     await page.getByLabel('Scan Type').selectOption('compliance');
  35 |     await page.getByLabel(/target/i).fill('org2admin@example.com');
  36 |     await page.getByLabel(/metadata/i).fill('{"org": "org2"}');
  37 |     await expect(page.getByRole('button', { name: /start scan/i })).toBeEnabled({ timeout: 7000 });
  38 |     await page.getByRole('button', { name: /start scan/i }).click();
  39 |     await expect(page.locator('div[role="alert"]:has-text("Scan triggered")')).toBeVisible({ timeout: 7000 });
  40 |     // Verify only org2 results are visible (should see org2admin@example.com, not testuser@example.com)
  41 |     await expect(page.getByText('org2admin@example.com')).toBeVisible();
  42 |     await expect(page.getByText('testuser@example.com')).not.toBeVisible();
  43 |   });
  44 | });
```
