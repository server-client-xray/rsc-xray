import { test, expect } from '@playwright/test';

test.describe('RSC X-Ray Interactive Demo - Smoke Tests', () => {
  test('should load the demo page successfully', async ({ page }) => {
    await page.goto('/');

    // Check title
    await expect(page).toHaveTitle(/RSC X-Ray Interactive Demo/);

    // Check status bar is present
    await expect(page.locator('[data-testid="status-bar"]')).toBeVisible();
  });

  test('should display default scenario with code editor', async ({ page }) => {
    await page.goto('/');

    // Check scenario selector is visible
    const selector = page.locator('select#scenario-select');
    await expect(selector).toBeVisible();
    await expect(selector).toHaveValue('serialization-boundary');

    // Check code editor loaded
    await expect(page.locator('.cm-editor')).toBeVisible();
  });

  test('should change scenarios via selector', async ({ page }) => {
    await page.goto('/');

    // Change scenario
    await page.locator('select#scenario-select').selectOption('suspense-boundary');
    await page.waitForTimeout(300);

    // Verify URL updated
    await expect(page).toHaveURL(/scenario=suspense-boundary/);
  });

  test('should support deep linking', async ({ page }) => {
    await page.goto('/?scenario=react19-cache');
    await page.waitForTimeout(300);

    // Verify correct scenario selected
    const selector = page.locator('select#scenario-select');
    await expect(selector).toHaveValue('react19-cache');
  });

  test('should display Pro preview button', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);

    // Check Pro preview button exists
    await expect(page.locator('button:has-text("Preview Boundary Tree")')).toBeVisible();
  });
});

