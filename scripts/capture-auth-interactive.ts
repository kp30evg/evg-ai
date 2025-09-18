#!/usr/bin/env tsx
/**
 * Interactive auth capture with Google OAuth support
 */

import { chromium } from 'playwright';
import path from 'path';

async function captureAuthState() {
  console.log('🔐 Interactive Auth State Capture');
  console.log('==================================\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    channel: 'chrome'
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Navigate to sign-in page
  const baseUrl = 'http://localhost:3001';
  console.log(`📍 Opening: ${baseUrl}/sign-in`);
  await page.goto(`${baseUrl}/sign-in`);
  
  console.log('\n📋 Instructions:');
  console.log('1. Click "Sign in with Google" in the browser');
  console.log('2. Complete the Google OAuth flow');
  console.log('3. Wait until you see the dashboard');
  console.log('4. The script will automatically detect when you\'re signed in\n');
  
  console.log('⏳ Waiting for authentication (timeout: 2 minutes)...\n');
  
  try {
    // Wait for successful navigation away from sign-in page
    await page.waitForURL(
      url => {
        const pathname = new URL(url).pathname;
        // Success if we're on any authenticated page
        return pathname.includes('/dashboard') || 
               pathname.includes('/mail') ||
               pathname.includes('/chat') ||
               pathname.includes('/calendar') ||
               (pathname === '/' && !url.includes('sign-in'));
      },
      { timeout: 120000 } // 2 minutes timeout
    );
    
    console.log('✅ Authentication successful!');
    console.log(`📍 Current page: ${page.url()}`);
    
    // Save the storage state
    const statePath = path.join(process.cwd(), 'storageState.json');
    await context.storageState({ path: statePath });
    
    console.log(`\n💾 Authentication state saved to: ${statePath}`);
    console.log('\n🎉 Success! You can now:');
    console.log('   • Run E2E tests: npm run e2e');
    console.log('   • Use Playwright MCP with saved auth');
    console.log('\nThe browser will close in 3 seconds...');
    
    await page.waitForTimeout(3000);
    
  } catch (error) {
    console.error('\n❌ Authentication failed or timed out');
    console.error('Please try again and make sure to complete the sign-in process');
  }
  
  await browser.close();
}

captureAuthState().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});