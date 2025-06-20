import { test, expect } from '@playwright/test';

const storybookBase = 'http://localhost:6006/iframe.html?id=';

test.describe('ExportWidget', () => {
  test('loads ExportWidget idle story without ChakraProvider errors', async ({ page }) => {
    await page.goto(`${storybookBase}dashboard-exportwidget--idle`);
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Check if there are any ChakraProvider errors in the page
    const errorMessages = await page.locator('#error-message').allTextContents();
    console.log('Error messages:', errorMessages);
    
    // Check if the page shows error display
    const hasErrorDisplay = await page.locator('.sb-errordisplay').isVisible();
    console.log('Has error display:', hasErrorDisplay);
    
    // Check if there are elements in storybook-root
    const rootContent = await page.locator('#storybook-root').innerHTML();
    console.log('Root content exists:', rootContent.length > 0);
    
    // The test passes if there's no error display showing
    expect(hasErrorDisplay).toBe(false);
  });
});

