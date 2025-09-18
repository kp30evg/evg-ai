import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('should load dashboard when authenticated', async ({ page }) => {
    // Navigate to dashboard - should work because we're already authenticated
    await page.goto('/dashboard');
    
    // Wait for dashboard to load
    await page.waitForLoadState('networkidle');
    
    // Verify we're on the dashboard (not redirected to sign-in)
    expect(page.url()).toContain('/dashboard');
    
    // Check for dashboard elements
    await expect(page.getByText(/Welcome back/i).or(page.getByText(/Dashboard/i))).toBeVisible({ timeout: 10000 });
    
    // Verify user is signed in by checking for user button or org switcher
    const userIndicator = page.locator('[data-clerk-component="UserButton"], [data-clerk-component="OrganizationSwitcher"], .user-button, .org-switcher').first();
    await expect(userIndicator).toBeVisible();
  });

  test('should access mail page', async ({ page }) => {
    await page.goto('/mail');
    await page.waitForLoadState('networkidle');
    
    // Should not redirect to sign-in
    expect(page.url()).toContain('/mail');
    
    // Check for mail UI elements
    await expect(
      page.getByText(/Inbox/i).or(page.getByText(/Mail/i))
    ).toBeVisible({ timeout: 10000 });
  });

  test('should access chat page', async ({ page }) => {
    await page.goto('/chat');
    await page.waitForLoadState('networkidle');
    
    // Should not redirect to sign-in
    expect(page.url()).toContain('/chat');
    
    // Check for chat UI elements
    await expect(
      page.getByText(/Chat/i).or(page.getByText(/Messages/i)).or(page.getByText(/general/i))
    ).toBeVisible({ timeout: 10000 });
  });
});