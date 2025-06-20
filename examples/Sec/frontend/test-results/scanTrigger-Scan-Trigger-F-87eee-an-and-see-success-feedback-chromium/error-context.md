# Test info

- Name: Scan Trigger Flow >> user can trigger a scan and see success feedback
- Location: C:\Users\apese\src\Sec\frontend\src\e2e\scanTrigger.spec.ts:4:7

# Error details

```
Error: Timed out 7000ms waiting for expect(locator).toBeVisible()

Locator: locator('div[role="alert"]:has-text("Scan triggered")')
Expected: visible
Received: <element(s) not found>
Call log:
  - expect.toBeVisible with timeout 7000ms
  - waiting for locator('div[role="alert"]:has-text("Scan triggered")')

    at C:\Users\apese\src\Sec\frontend\src\e2e\scanTrigger.spec.ts:42:80
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
        - textbox "Metadata (JSON, optional)": '{"key": "value"}'
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
   3 | test.describe('Scan Trigger Flow', () => {
   4 |   test('user can trigger a scan and see success feedback', async ({ page }) => {
   5 |     // 1. Navigate to the login page
   6 |     await page.goto('/login');
   7 |
   8 |     // 2. Log in as test user
   9 |     await page.getByLabel('Email').fill('testuser@example.com');
  10 |     await page.getByLabel('Password').fill('testpassword');
  11 |     await page.getByRole('button', { name: /login/i }).click();
  12 |     // Wait for dashboard heading to be visible
  13 |     await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible({ timeout: 5000 });
  14 |     // Best practice: Wait for scan trigger button to be enabled (ensures orgId/user.id are set)
  15 |     await expect(page.getByRole('button', { name: /trigger scan/i })).toBeEnabled({ timeout: 7000 });
  16 |
  17 |     // 3. Open the scan trigger modal
  18 |     await page.getByRole('button', { name: /trigger scan/i }).click();
  19 |
  20 |     // 4. Select scan type (compliance)
  21 |     await page.getByLabel('Scan Type').selectOption('compliance');
  22 |
  23 |     // 5. Enter target
  24 |     await page.getByLabel(/target/i).fill('testuser@example.com');
  25 |
  26 |     // 6. Enter valid JSON metadata
  27 |     await page.getByLabel(/metadata/i).fill('{"key": "value"}');
  28 |
  29 |     // 7. Submit the scan
  30 |     // Best practice: Wait for Start Scan button to be enabled before clicking (handles async state)
  31 |     await expect(page.getByRole('button', { name: /start scan/i })).toBeEnabled({ timeout: 7000 });
  32 |     await page.getByRole('button', { name: /start scan/i }).click();
  33 |
  34 |     // Debug: Capture screenshot and print page content after submitting scan
  35 |     await page.screenshot({ path: 'scan-trigger-debug.png' });
  36 |     // eslint-disable-next-line no-console
  37 |     console.log(await page.content());
  38 |
  39 |     // 8. Verify the success toast
  40 |     // Best practice: Chakra UI toasts may render in a portal and not be found by getByText or getByRole('status').
  41 |     // Use a robust locator for the toast: div[role="alert"]:has-text("Scan triggered")
> 42 |     await expect(page.locator('div[role="alert"]:has-text("Scan triggered")')).toBeVisible({ timeout: 7000 });
     |                                                                                ^ Error: Timed out 7000ms waiting for expect(locator).toBeVisible()
  43 |
  44 |     // 9. Optionally, check that results table refreshes (look for a row with the target or a new timestamp)
  45 |     // This step may require a mock or test backend to ensure deterministic results
  46 |     // await expect(page.getByText('testuser@example.com')).toBeVisible();
  47 |   });
  48 | });
```
