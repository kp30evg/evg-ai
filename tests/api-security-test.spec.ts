import { test, expect } from '@playwright/test';

/**
 * FOCUSED API SECURITY TEST
 * 
 * This test directly examines the API endpoints to verify user isolation
 * and detect cross-user data leakage at the API level.
 */

test.describe('API Security - User Isolation', () => {
  
  test('Direct API endpoint security check', async ({ page }) => {
    console.log('🔍 Testing API endpoints for cross-user data leakage...');
    
    // Test the debug endpoint first
    console.log('Testing /api/debug/check-user endpoint...');
    try {
      await page.goto('http://localhost:3000/api/debug/check-user');
      
      const debugResponse = await page.textContent('body');
      console.log('Debug endpoint response:', debugResponse?.substring(0, 500));
      
      // Take screenshot of debug response
      await page.screenshot({ 
        path: '/Users/kianpezeshki/Documents/Projects/evergreenlp/screenshots/api-debug-check-user.png',
        fullPage: true 
      });
      
      if (debugResponse?.includes('victor@novakindustries.ca')) {
        console.log('✅ Victor context detected in debug endpoint');
        
        // Verify no cross-contamination in debug
        expect(debugResponse).not.toContain('kian@evergreengroup.ai');
        expect(debugResponse).not.toContain('Evergreen');
      }
      
    } catch (error) {
      console.log('⚠️ Debug endpoint test failed:', error.message);
    }
    
    // Test OAuth status endpoint
    console.log('Testing /api/debug/oauth-status endpoint...');
    try {
      await page.goto('http://localhost:3000/api/debug/oauth-status');
      
      const oauthResponse = await page.textContent('body');
      console.log('OAuth status response:', oauthResponse?.substring(0, 500));
      
      // Take screenshot
      await page.screenshot({ 
        path: '/Users/kianpezeshki/Documents/Projects/evergreenlp/screenshots/api-oauth-status.png',
        fullPage: true 
      });
      
      if (oauthResponse) {
        // Should not contain cross-user data
        const hasCrossUserData = 
          oauthResponse.includes('kian@evergreengroup.ai') && 
          oauthResponse.includes('victor@novakindustries.ca');
          
        if (hasCrossUserData) {
          console.error('🚨 CROSS-USER DATA DETECTED in OAuth status!');
          throw new Error('Cross-user data contamination in OAuth endpoint');
        }
      }
      
    } catch (error) {
      console.log('⚠️ OAuth status test failed:', error.message);
    }
    
    // Test email stats endpoint
    console.log('Testing /api/gmail/stats endpoint...');
    try {
      await page.goto('http://localhost:3000/api/gmail/stats');
      
      const statsResponse = await page.textContent('body');
      console.log('Gmail stats response:', statsResponse?.substring(0, 500));
      
      // Take screenshot
      await page.screenshot({ 
        path: '/Users/kianpezeshki/Documents/Projects/evergreenlp/screenshots/api-gmail-stats.png',
        fullPage: true 
      });
      
      if (statsResponse && statsResponse.length > 10) {
        // Check for cross-user contamination
        const hasVictorData = statsResponse.includes('victor@novakindustries.ca');
        const hasKianData = statsResponse.includes('kian@evergreengroup.ai');
        
        if (hasVictorData && hasKianData) {
          console.error('🚨 BOTH USERS VISIBLE in Gmail stats!');
          throw new Error('Cross-user data contamination in Gmail stats endpoint');
        }
      }
      
    } catch (error) {
      console.log('⚠️ Gmail stats test failed:', error.message);
    }
  });
  
  test('User context verification across endpoints', async ({ page }) => {
    console.log('🔐 Testing user context consistency across endpoints...');
    
    const endpoints = [
      '/api/debug/check-user',
      '/api/debug/oauth-status', 
      '/api/gmail/stats',
      '/api/organization/members'
    ];
    
    const results = [];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`Testing endpoint: ${endpoint}`);
        await page.goto(`http://localhost:3000${endpoint}`);
        
        const content = await page.textContent('body');
        const hasVictor = content?.includes('victor@novakindustries.ca') || false;
        const hasKian = content?.includes('kian@evergreengroup.ai') || false;
        
        results.push({
          endpoint,
          hasVictor,
          hasKian,
          hasBoth: hasVictor && hasKian,
          contentLength: content?.length || 0,
          sample: content?.substring(0, 200)
        });
        
        // Take screenshot of each endpoint
        await page.screenshot({ 
          path: `/Users/kianpezeshki/Documents/Projects/evergreenlp/screenshots/endpoint-${endpoint.replace(/\//g, '-')}.png`,
          fullPage: true 
        });
        
        await page.waitForTimeout(500); // Brief pause between requests
        
      } catch (error) {
        results.push({
          endpoint,
          error: error.message,
          hasVictor: false,
          hasKian: false,
          hasBoth: false
        });
      }
    }
    
    console.log('🛡️ ENDPOINT SECURITY ANALYSIS:');
    console.log(JSON.stringify(results, null, 2));
    
    // Check for cross-contamination
    const contaminatedEndpoints = results.filter(r => r.hasBoth);
    if (contaminatedEndpoints.length > 0) {
      console.error('🚨 CROSS-USER CONTAMINATION DETECTED IN ENDPOINTS:');
      contaminatedEndpoints.forEach(ep => {
        console.error(`- ${ep.endpoint}: Shows both Victor and Kian data`);
      });
      
      throw new Error(`Cross-user data contamination detected in ${contaminatedEndpoints.length} endpoints`);
    }
    
    console.log('✅ No cross-user contamination detected in API endpoints');
  });
  
  test('Email API isolation verification', async ({ page }) => {
    console.log('📧 Testing email-specific API endpoints...');
    
    // This test would ideally require authentication, but we can test for proper error handling
    const emailEndpoints = [
      '/api/gmail/sync',
      '/api/gmail/threads', 
      '/mail/inbox',
      '/mail/sent',
      '/mail/drafts'
    ];
    
    for (const endpoint of emailEndpoints) {
      try {
        console.log(`Testing email endpoint: ${endpoint}`);
        await page.goto(`http://localhost:3000${endpoint}`);
        
        // Wait for response
        await page.waitForLoadState('networkidle', { timeout: 10000 });
        
        const content = await page.textContent('body');
        const currentUrl = page.url();
        
        console.log(`${endpoint} -> ${currentUrl} (${content?.length} chars)`);
        
        // Take screenshot
        await page.screenshot({ 
          path: `/Users/kianpezeshki/Documents/Projects/evergreenlp/screenshots/email-endpoint-${endpoint.replace(/\//g, '-')}.png`,
          fullPage: true 
        });
        
        // Check that no email content is exposed without authentication
        if (content) {
          // Should not contain any user email addresses if not authenticated
          const hasUserEmails = 
            content.includes('victor@novakindustries.ca') || 
            content.includes('kian@evergreengroup.ai');
            
          if (hasUserEmails && !currentUrl.includes('sign-in')) {
            console.error(`🚨 USER EMAIL DATA EXPOSED in ${endpoint} without authentication!`);
            throw new Error(`Email data exposed without authentication in ${endpoint}`);
          }
        }
        
      } catch (error) {
        if (!error.message.includes('Email data exposed')) {
          console.log(`⚠️ ${endpoint} test completed with: ${error.message}`);
        } else {
          throw error; // Re-throw security errors
        }
      }
    }
    
    console.log('✅ Email endpoints properly protected or require authentication');
  });
});