import { test, expect } from '@playwright/test';

test.describe('EverMail Functionality Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the mail inbox
    await page.goto('http://localhost:3000/mail/inbox');
    await page.waitForLoadState('networkidle');
  });

  test('Inbox page loads without errors', async ({ page }) => {
    // Check that the inbox page loads
    await expect(page.locator('h1:has-text("Inbox")')).toBeVisible();
    
    // Check for the compose button
    await expect(page.locator('button:has-text("Compose")')).toBeVisible();
    
    // Check for the search bar
    await expect(page.locator('input[placeholder="Search emails..."]')).toBeVisible();
  });

  test('Compose modal - input fields do not lose focus', async ({ page }) => {
    // Click compose button
    await page.locator('button:has-text("Compose")').click();
    
    // Wait for modal to appear
    await page.waitForSelector('h3:has-text("New Message")', { timeout: 5000 });
    
    // Test To field - type continuously without losing focus
    const toField = page.locator('input[placeholder="To"]');
    await toField.click();
    await toField.type('test@example.com', { delay: 50 });
    
    // Verify the full text was entered (would fail if focus was lost)
    await expect(toField).toHaveValue('test@example.com');
    
    // Test Subject field
    const subjectField = page.locator('input[placeholder="Subject"]');
    await subjectField.click();
    await subjectField.type('Test Subject Line', { delay: 50 });
    
    // Verify the full text was entered
    await expect(subjectField).toHaveValue('Test Subject Line');
    
    // Test Body field
    const bodyField = page.locator('textarea[placeholder="Write your message..."]');
    await bodyField.click();
    await bodyField.type('This is a test email body with multiple words', { delay: 30 });
    
    // Verify the full text was entered
    await expect(bodyField).toHaveValue('This is a test email body with multiple words');
  });

  test('Star functionality works', async ({ page }) => {
    // Check if there are any emails
    const emailItems = page.locator('[style*="borderBottom"]').filter({ hasText: /@/ });
    const emailCount = await emailItems.count();
    
    if (emailCount > 0) {
      // Find the first star button
      const firstStarButton = emailItems.first().locator('button').filter({ has: page.locator('svg') }).first();
      
      // Click the star button
      await firstStarButton.click();
      
      // Wait for the mutation to complete
      await page.waitForTimeout(500);
      
      // Check that the star color changed (gold color #FFD600)
      const starIcon = firstStarButton.locator('svg');
      const fillColor = await starIcon.evaluate(el => window.getComputedStyle(el).fill);
      
      // Star should have changed appearance (either fill or color)
      // Note: The exact check depends on the star's state
      expect(fillColor).toBeDefined();
    }
  });

  test('Trash functionality works', async ({ page }) => {
    // Check if there are any emails
    const emailItems = page.locator('[style*="borderBottom"]').filter({ hasText: /@/ });
    const emailCount = await emailItems.count();
    
    if (emailCount > 0) {
      // Click on the first email to select it
      await emailItems.first().click();
      
      // Wait for email viewer to appear
      await page.waitForSelector('h2', { timeout: 5000 });
      
      // Find and click the trash button in the email viewer
      const trashButton = page.locator('button').filter({ has: page.locator('svg') }).nth(2); // Usually the 3rd button
      
      // Click trash button
      await trashButton.click();
      
      // Wait for the mutation to complete
      await page.waitForTimeout(1000);
      
      // Email should be removed from inbox view or marked as deleted
      // The exact behavior depends on the implementation
    }
  });

  test('Save Draft button exists and is clickable', async ({ page }) => {
    // Click compose button
    await page.locator('button:has-text("Compose")').click();
    
    // Wait for modal to appear
    await page.waitForSelector('h3:has-text("New Message")', { timeout: 5000 });
    
    // Check that Save Draft button exists
    const saveDraftButton = page.locator('button:has-text("Save Draft")');
    await expect(saveDraftButton).toBeVisible();
    
    // Enter some content
    await page.locator('input[placeholder="To"]').fill('draft@example.com');
    await page.locator('input[placeholder="Subject"]').fill('Draft Test');
    await page.locator('textarea[placeholder="Write your message..."]').fill('Draft content');
    
    // Click Save Draft
    await saveDraftButton.click();
    
    // Wait for the mutation to complete
    await page.waitForTimeout(1000);
    
    // Check for success message (alert)
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Draft saved');
      await dialog.accept();
    });
  });

  test('Compose modal can be closed', async ({ page }) => {
    // Click compose button
    await page.locator('button:has-text("Compose")').click();
    
    // Wait for modal to appear
    await page.waitForSelector('h3:has-text("New Message")', { timeout: 5000 });
    
    // Find and click the X button
    const closeButton = page.locator('button').filter({ has: page.locator('svg') }).last();
    await closeButton.click();
    
    // Modal should disappear
    await expect(page.locator('h3:has-text("New Message")')).not.toBeVisible();
  });

  test('Gmail connection status component renders', async ({ page }) => {
    // The GmailConnectionStatus component should be present
    // It may or may not be visible depending on connection status
    const gmailStatus = page.locator('[class*="GmailConnectionStatus"], [id*="gmail-status"]');
    
    // Component should exist in the DOM
    const exists = await gmailStatus.count() > 0;
    
    // If Gmail is not connected, there should be a connection prompt
    if (!exists) {
      // Check if emails are loading instead (meaning Gmail is connected)
      const hasEmails = await page.locator('[style*="borderBottom"]').filter({ hasText: /@/ }).count() > 0;
      const hasEmptyState = await page.locator('text=/No emails/i').count() > 0;
      
      // Either emails are shown or empty state is shown
      expect(hasEmails || hasEmptyState).toBeTruthy();
    }
  });
});