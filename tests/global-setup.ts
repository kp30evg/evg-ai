// tests/global-setup.ts
import { chromium, FullConfig } from '@playwright/test';

/**
 * Global setup that runs once before all tests
 * Signs in with test user and saves authentication state
 */
export default async function globalSetup(_config: FullConfig) {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log('🔐 Setting up E2E authentication...');

  try {
    // Navigate to sign-in page
    const baseUrl = process.env.E2E_BASE_URL || 'http://localhost:3000';
    console.log(`📍 Navigating to: ${baseUrl}/sign-in`);
    await page.goto(`${baseUrl}/sign-in`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Wait for sign-in form to be ready (reduced timeout)
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
      console.log('⚠️ Network idle timeout - continuing anyway');
    });

    // Get credentials from environment
    const username = process.env.E2E_CLERK_USER_USERNAME;
    const password = process.env.E2E_CLERK_USER_PASSWORD;

    if (!username || !password) {
      throw new Error('E2E_CLERK_USER_USERNAME and E2E_CLERK_USER_PASSWORD must be set in .env.e2e');
    }

    console.log(`📧 Signing in as: ${username}`);
    
    // Step 1: Enter email/username in the identifier field
    console.log('📝 Looking for email/phone input field');
    
    // The field is labeled "Email or phone" based on the screenshot
    const emailField = await page.locator('input[type="text"], input[type="email"]').first();
    
    console.log('📝 Filling email/username field');
    await emailField.fill(username);
    
    // Click the "Next" button to proceed to password
    console.log('➡️ Clicking Next button');
    const nextButton = page.getByRole('button', { name: 'Next' });
    await nextButton.click();
    
    // Wait for either password field or error message
    // Don't wait for network idle as it may not settle
    console.log('⏳ Waiting for next step...');
    
    // Step 2: Enter password
    console.log('🔐 Waiting for password field');
    
    // Wait for either password field to appear or stay on same page with error
    const passwordAppeared = await page.waitForSelector('input[type="password"]', { 
      state: 'visible',
      timeout: 10000 
    }).then(() => true).catch(() => false);
    
    if (!passwordAppeared) {
      // Check for error message
      const errorMessage = await page.locator('.cl-formFieldErrorText, [role="alert"]').textContent().catch(() => null);
      if (errorMessage) {
        throw new Error(`Sign-in failed at email step: ${errorMessage}`);
      }
      throw new Error('Password field did not appear after entering email');
    }
    
    const passwordField = await page.locator('input[type="password"]').first();
    
    console.log('📝 Filling password field');
    await passwordField.fill(password);

    // Submit the sign-in form
    console.log('🚀 Submitting sign-in form');
    
    // Look for Continue or Sign In button on password screen
    const submitButton = await page.locator(
      'button:has-text("Continue"), ' +
      'button:has-text("Sign in"), ' +
      'button[type="submit"]'
    ).first();

    await submitButton.click();

    // Wait for successful redirect to authenticated area
    // Adjust these URLs based on your app's behavior
    await page.waitForURL(
      url => {
        const pathname = new URL(url).pathname;
        return pathname.includes('/dashboard') || 
               pathname.includes('/app') || 
               pathname.includes('/mail') ||
               pathname.includes('/chat');
      },
      { 
        timeout: 30000,
        waitUntil: 'networkidle' 
      }
    );

    console.log('✅ Successfully authenticated');
    console.log(`📍 Landed on: ${page.url()}`);

    // Save authentication state for all tests
    await page.context().storageState({ path: 'storageState.json' });
    console.log('💾 Authentication state saved to storageState.json');

  } catch (error) {
    console.error('❌ Authentication setup failed:', error);
    
    // Take a screenshot for debugging
    await page.screenshot({ 
      path: 'auth-setup-error.png', 
      fullPage: true 
    });
    
    throw error;
  } finally {
    await browser.close();
  }
}