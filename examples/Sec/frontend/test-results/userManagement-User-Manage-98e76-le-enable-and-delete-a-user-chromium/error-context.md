# Test info

- Name: User Management Flows >> admin can disable, enable, and delete a user
- Location: C:\Users\apese\src\Sec\frontend\src\e2e\userManagement.spec.ts:14:7

# Error details

```
Error: expect.toBeVisible: Error: strict mode violation: getByText('Disabled') resolved to 8 elements:
    1) <td class="css-xumdn4">…</td> aka getByRole('row', { name: 'testuser2@example.com Test' }).getByRole('cell').nth(4)
    2) <td class="css-xumdn4">…</td> aka getByRole('row', { name: 'regularuser@example.com' }).getByRole('cell').nth(4)
    3) <td class="css-xumdn4">…</td> aka getByRole('row', { name: 'nonadmin@example.com Non' }).getByRole('cell').nth(4)
    4) <td class="css-xumdn4">…</td> aka getByRole('row', { name: 'testuser@example.com Test' }).getByRole('cell').nth(4)
    5) <td class="css-xumdn4">…</td> aka getByRole('row', { name: 'lastadmin@example.com Last' }).getByRole('cell').nth(4)
    6) <td class="css-xumdn4">…</td> aka getByRole('row', { name: 'user3@example.com User Three' }).getByRole('cell').nth(4)
    7) <td class="css-xumdn4">…</td> aka getByRole('row', { name: 'user2@example.com User Two' }).getByRole('cell').nth(4)
    8) <td class="css-xumdn4">…</td> aka getByRole('row', { name: 'admin@example.com Admin User' }).getByRole('cell').nth(4)

Call log:
  - expect.toBeVisible with timeout 5000ms
  - waiting for getByText('Disabled')

    at C:\Users\apese\src\Sec\frontend\src\e2e\userManagement.spec.ts:22:46
```

# Page snapshot

```yaml
- navigation:
    - link "Dashboard":
        - /url: /
    - link "User Management":
        - /url: /user-management
    - link "Onboarding":
        - /url: /onboarding
- heading "User Management" [level=2]
- paragraph: Manage users, invite new members, and assign roles.
- group:
    - text: Invite User by Email
    - textbox "Invite User by Email"
- button "Send Invite"
- table:
    - rowgroup:
        - row "Email Full Name Role Status Actions":
            - cell "Email"
            - cell "Full Name"
            - cell "Role"
            - cell "Status"
            - cell "Actions"
    - rowgroup:
        - row "testuser2@example.com Test User 2 User Active Disable Delete":
            - cell "testuser2@example.com"
            - cell "Test User 2"
            - cell "User":
                - combobox:
                    - option "User" [selected]
                    - option "Admin"
            - cell "Active"
            - cell "Disable Delete":
                - button "Disable"
                - button "Delete"
        - row "regularuser@example.com Regular User User Active Disable Delete":
            - cell "regularuser@example.com"
            - cell "Regular User"
            - cell "User":
                - combobox:
                    - option "User" [selected]
                    - option "Admin"
            - cell "Active"
            - cell "Disable Delete":
                - button "Disable"
                - button "Delete"
        - row "nonadmin@example.com Non Admin User Active Disable Delete":
            - cell "nonadmin@example.com"
            - cell "Non Admin"
            - cell "User":
                - combobox:
                    - option "User" [selected]
                    - option "Admin"
            - cell "Active"
            - cell "Disable Delete":
                - button "Disable"
                - button "Delete"
        - row "testuser@example.com Test Admin Admin Active Disable Delete":
            - cell "testuser@example.com"
            - cell "Test Admin"
            - cell "Admin":
                - combobox:
                    - option "User"
                    - option "Admin" [selected]
            - cell "Active"
            - cell "Disable Delete":
                - button "Disable" [disabled]
                - button "Delete" [disabled]
        - row "lastadmin@example.com Last Admin Admin Active Disable Delete":
            - cell "lastadmin@example.com"
            - cell "Last Admin"
            - cell "Admin":
                - combobox:
                    - option "User"
                    - option "Admin" [selected]
            - cell "Active"
            - cell "Disable Delete":
                - button "Disable"
                - button "Delete"
        - row "user3@example.com User Three User Active Disable Delete":
            - cell "user3@example.com"
            - cell "User Three"
            - cell "User":
                - combobox:
                    - option "User" [selected]
                    - option "Admin"
            - cell "Active"
            - cell "Disable Delete":
                - button "Disable"
                - button "Delete"
        - row "user2@example.com User Two User Active Disable Delete":
            - cell "user2@example.com"
            - cell "User Two"
            - cell "User":
                - combobox:
                    - option "User" [selected]
                    - option "Admin"
            - cell "Active"
            - cell "Disable Delete":
                - button "Disable"
                - button "Delete"
        - row "admin@example.com Admin User Admin Active Disable Delete":
            - cell "admin@example.com"
            - cell "Admin User"
            - cell "Admin":
                - combobox:
                    - option "User"
                    - option "Admin" [selected]
            - cell "Active"
            - cell "Disable Delete":
                - button "Disable"
                - button "Delete"
- region "Notifications-top"
- region "Notifications-top-left"
- region "Notifications-top-right"
- region "Notifications-bottom-left"
- region "Notifications-bottom"
- region "Notifications-bottom-right"
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 |
   3 | test.describe('User Management Flows', () => {
   4 |   test.beforeEach(async ({ page }) => {
   5 |     await page.goto('/login');
   6 |     await page.getByLabel('Email').fill('testuser@example.com');
   7 |     await page.getByLabel('Password').fill('testpassword');
   8 |     await page.getByRole('button', { name: /login/i }).click();
   9 |     await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible({ timeout: 5000 });
  10 |     await page.getByRole('link', { name: /user management/i }).click();
  11 |     await expect(page.getByRole('heading', { name: /user management/i })).toBeVisible({ timeout: 5000 });
  12 |   });
  13 |
  14 |   test('admin can disable, enable, and delete a user', async ({ page }) => {
  15 |     // Wait for users table to load
  16 |     await expect(page.getByText('testuser2@example.com')).toBeVisible({ timeout: 7000 });
  17 |     // Disable user
  18 |     const disableBtn = page.getByRole('button', { name: /disable/i }).first();
  19 |     await expect(disableBtn).toBeEnabled();
  20 |     await disableBtn.click();
  21 |     // Status should update to Disabled
> 22 |     await expect(page.getByText('Disabled')).toBeVisible({ timeout: 5000 });
     |                                              ^ Error: expect.toBeVisible: Error: strict mode violation: getByText('Disabled') resolved to 8 elements:
  23 |     // Enable user
  24 |     const enableBtn = page.getByRole('button', { name: /enable/i }).first();
  25 |     await expect(enableBtn).toBeEnabled();
  26 |     await enableBtn.click();
  27 |     await expect(page.getByText('Active')).toBeVisible({ timeout: 5000 });
  28 |     // Delete user (confirm dialog)
  29 |     const deleteBtn = page.getByRole('button', { name: /delete/i }).first();
  30 |     await expect(deleteBtn).toBeEnabled();
  31 |     // Intercept window.confirm and accept
  32 |     await page.evaluate(() => window.confirm = () => true);
  33 |     await deleteBtn.click();
  34 |     // User row should disappear
  35 |     await expect(page.getByText('testuser2@example.com')).not.toBeVisible({ timeout: 7000 });
  36 |   });
  37 |
  38 |   test('user cannot disable or delete self', async ({ page }) => {
  39 |     await expect(page.getByText('testuser@example.com')).toBeVisible({ timeout: 7000 });
  40 |     const selfRow = page.getByText('testuser@example.com').locator('..').locator('..');
  41 |     const disableBtn = selfRow.getByRole('button', { name: /disable/i });
  42 |     const deleteBtn = selfRow.getByRole('button', { name: /delete/i });
  43 |     await expect(disableBtn).toBeDisabled();
  44 |     await expect(deleteBtn).toBeDisabled();
  45 |   });
  46 |
  47 |   test('cannot disable or delete last admin', async ({ page }) => {
  48 |     // Assumes testuser@example.com is the last admin
  49 |     await expect(page.getByText('testuser@example.com')).toBeVisible({ timeout: 7000 });
  50 |     const selfRow = page.getByText('testuser@example.com').locator('..').locator('..');
  51 |     const disableBtn = selfRow.getByRole('button', { name: /disable/i });
  52 |     const deleteBtn = selfRow.getByRole('button', { name: /delete/i });
  53 |     await expect(disableBtn).toBeDisabled();
  54 |     await expect(deleteBtn).toBeDisabled();
  55 |     // Optionally, check for tooltip or error message if attempted
  56 |   });
  57 |
  58 |   test('non-admin cannot disable, enable, or delete other users', async ({ page, context }) => {
  59 |     // Log out and log in as a non-admin user
  60 |     await page.getByRole('button', { name: /logout/i }).click();
  61 |     await page.getByLabel('Email').fill('regularuser@example.com');
  62 |     await page.getByLabel('Password').fill('testpassword');
  63 |     await page.getByRole('button', { name: /login/i }).click();
  64 |     await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible({ timeout: 5000 });
  65 |     await page.getByRole('link', { name: /user management/i }).click();
  66 |     await expect(page.getByRole('heading', { name: /user management/i })).toBeVisible({ timeout: 5000 });
  67 |     // Try to find disable/enable/delete buttons for other users
  68 |     const otherRow = page.getByText('testuser@example.com').locator('..').locator('..');
  69 |     const disableBtn = otherRow.getByRole('button', { name: /disable/i });
  70 |     const enableBtn = otherRow.getByRole('button', { name: /enable/i });
  71 |     const deleteBtn = otherRow.getByRole('button', { name: /delete/i });
  72 |     await expect(disableBtn).toBeDisabled();
  73 |     await expect(enableBtn).toBeDisabled();
  74 |     await expect(deleteBtn).toBeDisabled();
  75 |   });
  76 |
  77 |   // TODO: Add audit log verification after destructive actions
  78 | });
```
