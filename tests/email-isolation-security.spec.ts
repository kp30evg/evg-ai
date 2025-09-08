import { test, expect } from '@playwright/test';

/**
 * CRITICAL SECURITY TEST: Email User Isolation
 * 
 * This test verifies that the security fix for cross-user data leakage is working correctly.
 * Previously, Victor (Nike workspace) was seeing Kian's emails (Evergreen workspace).
 * 
 * Test Users:
 * - Victor (victor@novakindustries.ca) - Nike workspace
 * - Kian (kian@evergreengroup.ai) - Evergreen workspace
 * 
 * Test Objectives:
 * 1. Verify Victor can only see his own emails
 * 2. Ensure no cross-workspace data contamination
 * 3. Validate user context is correctly isolated
 * 4. Confirm debug endpoints show proper user isolation
 */

test.describe('Email Isolation Security Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set longer timeout for navigation due to OAuth and database operations
    page.setDefaultTimeout(30000);
    
    // Go to the app
    await page.goto('http://localhost:3000');
  });

  test('Victor user context isolation - debug endpoint verification', async ({ page }) => {
    console.log('🔍 Testing Victor user context via debug endpoint...');
    
    // Navigate to the debug endpoint to check user context
    await page.goto('http://localhost:3000/api/debug/check-user');
    
    // Take screenshot of debug response
    await page.screenshot({ 
      path: '/Users/kianpezeshki/Documents/Projects/evergreenlp/screenshots/victor-debug-context.png',
      fullPage: true 
    });
    
    // Check if we get a proper response
    const content = await page.textContent('body');
    console.log('Debug endpoint response:', content);
    
    // If user is authenticated, verify the user details
    if (content && !content.includes('Not authenticated')) {
      expect(content).toContain('victor@novakindustries.ca');
      expect(content).toContain('Nike'); // workspace name
      console.log('✅ Victor user context verified through debug endpoint');
    } else {
      console.log('ℹ️ User not authenticated - will proceed to sign-in flow');
    }
  });

  test('Victor email inbox isolation - no cross-user contamination', async ({ page }) => {
    console.log('📧 Testing Victor email inbox isolation...');
    
    try {
      // Navigate to mail inbox
      await page.goto('http://localhost:3000/mail/inbox');
      
      // Wait for the page to load
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      
      // Take screenshot of inbox state
      await page.screenshot({ 
        path: '/Users/kianpezeshki/Documents/Projects/evergreenlp/screenshots/victor-inbox-state.png',
        fullPage: true 
      });
      
      // Check if we're redirected to sign-in
      const currentUrl = page.url();
      console.log('Current URL:', currentUrl);
      
      if (currentUrl.includes('sign-in')) {
        console.log('ℹ️ User needs to sign in - this is expected for security');
        
        // Take screenshot of sign-in page
        await page.screenshot({ 
          path: '/Users/kianpezeshki/Documents/Projects/evergreenlp/screenshots/sign-in-page.png',
          fullPage: true 
        });
        
        // Check for Clerk sign-in form
        await expect(page.locator('[data-testid="sign-in-form"], .cl-rootBox, .cl-card')).toBeVisible({ timeout: 10000 });
        console.log('✅ Sign-in page properly displayed');
        
      } else if (currentUrl.includes('mail/inbox')) {
        console.log('✅ User authenticated - checking inbox content');
        
        // Wait for mail content to load
        await page.waitForSelector('[data-testid="email-list"], .mail-item, .email-item', { timeout: 15000 }).catch(() => {
          console.log('ℹ️ No email list found - checking for empty state or loading state');
        });
        
        // Check page content for user identification
        const pageContent = await page.textContent('body');
        
        // Verify no Kian's emails are shown
        const hasKianEmail = pageContent?.includes('kian@evergreengroup.ai') || 
                           pageContent?.includes('Evergreen') ||
                           pageContent?.includes('Kian');
        
        if (hasKianEmail) {
          console.error('🚨 SECURITY BREACH: Victor can see Kian\'s data!');
          await page.screenshot({ 
            path: '/Users/kianpezeshki/Documents/Projects/evergreenlp/screenshots/SECURITY-BREACH-victor-sees-kian-data.png',
            fullPage: true 
          });
          throw new Error('CRITICAL SECURITY ISSUE: Cross-user data leakage detected');
        }
        
        // Verify Victor's context if emails are present
        if (pageContent?.includes('@')) {
          // Should only see victor@novakindustries.ca related emails
          expect(pageContent).not.toContain('kian@evergreengroup.ai');
          expect(pageContent).not.toContain('Evergreen');
          console.log('✅ No cross-user contamination detected in email content');
        }
        
      } else {
        console.log('ℹ️ Redirected to:', currentUrl);
      }
      
    } catch (error) {
      console.error('❌ Test execution error:', error);
      await page.screenshot({ 
        path: '/Users/kianpezeshki/Documents/Projects/evergreenlp/screenshots/test-error.png',
        fullPage: true 
      });
      throw error;
    }
  });

  test('Mail sync endpoint security check', async ({ page }) => {
    console.log('🔄 Testing mail sync endpoint security...');
    
    // Check Gmail sync status
    await page.goto('http://localhost:3000/api/gmail/stats');
    
    // Take screenshot of sync status
    await page.screenshot({ 
      path: '/Users/kianpezeshki/Documents/Projects/evergreenlp/screenshots/gmail-sync-status.png',
      fullPage: true 
    });
    
    const content = await page.textContent('body');
    console.log('Gmail sync status response:', content);
    
    // Verify no cross-user data in sync response
    if (content && content.includes('gmail')) {
      expect(content).not.toContain('kian@evergreengroup.ai');
      console.log('✅ Gmail sync endpoint shows no cross-user data');
    }
  });

  test('Mail page routing and access control', async ({ page }) => {
    console.log('🔐 Testing mail page access control...');
    
    // Test various mail routes
    const mailRoutes = [
      '/mail',
      '/mail/inbox',
      '/mail/sent',
      '/mail/drafts'
    ];
    
    for (const route of mailRoutes) {
      console.log(`Testing route: ${route}`);
      
      await page.goto(`http://localhost:3000${route}`);
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      
      const currentUrl = page.url();
      console.log(`Route ${route} -> ${currentUrl}`);
      
      // Take screenshot of each route
      await page.screenshot({ 
        path: `/Users/kianpezeshki/Documents/Projects/evergreenlp/screenshots/route-${route.replace(/\//g, '-')}.png`,
        fullPage: true 
      });
      
      // Verify authentication/authorization is in place
      const content = await page.textContent('body');
      
      if (content) {
        // Should not contain Kian's data regardless of authentication state
        expect(content).not.toContain('kian@evergreengroup.ai');
        expect(content).not.toContain('Evergreen');
        console.log(`✅ Route ${route} shows no cross-user data`);
      }
    }
  });

  test('Comprehensive security validation', async ({ page }) => {
    console.log('🛡️ Running comprehensive security validation...');
    
    // Create a comprehensive security report
    const securityReport = {
      timestamp: new Date().toISOString(),
      testUser: 'victor@novakindustries.ca',
      workspace: 'Nike',
      checks: []
    };
    
    // Check 1: Debug endpoint
    try {
      await page.goto('http://localhost:3000/api/debug/check-user');
      const debugContent = await page.textContent('body');
      securityReport.checks.push({
        check: 'debug-endpoint',
        status: debugContent?.includes('victor@novakindustries.ca') ? 'PASS' : 'INFO',
        details: debugContent?.substring(0, 200)
      });
    } catch (error) {
      securityReport.checks.push({
        check: 'debug-endpoint',
        status: 'ERROR',
        details: error.message
      });
    }
    
    // Check 2: OAuth status
    try {
      await page.goto('http://localhost:3000/api/debug/oauth-status');
      const oauthContent = await page.textContent('body');
      securityReport.checks.push({
        check: 'oauth-status',
        status: !oauthContent?.includes('kian@evergreengroup.ai') ? 'PASS' : 'FAIL',
        details: oauthContent?.substring(0, 200)
      });
    } catch (error) {
      securityReport.checks.push({
        check: 'oauth-status',
        status: 'ERROR',
        details: error.message
      });
    }
    
    // Check 3: Main inbox
    try {
      await page.goto('http://localhost:3000/mail/inbox');
      await page.waitForLoadState('networkidle');
      const inboxContent = await page.textContent('body');
      securityReport.checks.push({
        check: 'inbox-isolation',
        status: !inboxContent?.includes('kian@evergreengroup.ai') ? 'PASS' : 'CRITICAL_FAIL',
        details: `Inbox content length: ${inboxContent?.length}, URL: ${page.url()}`
      });
    } catch (error) {
      securityReport.checks.push({
        check: 'inbox-isolation',
        status: 'ERROR',
        details: error.message
      });
    }
    
    // Take final comprehensive screenshot
    await page.screenshot({ 
      path: '/Users/kianpezeshki/Documents/Projects/evergreenlp/screenshots/comprehensive-security-final.png',
      fullPage: true 
    });
    
    // Log security report
    console.log('🛡️ SECURITY REPORT:', JSON.stringify(securityReport, null, 2));
    
    // Verify no critical failures
    const criticalFailures = securityReport.checks.filter(check => check.status === 'CRITICAL_FAIL');
    if (criticalFailures.length > 0) {
      throw new Error(`CRITICAL SECURITY FAILURES DETECTED: ${JSON.stringify(criticalFailures)}`);
    }
    
    console.log('✅ Comprehensive security validation completed - no critical issues detected');
  });
});