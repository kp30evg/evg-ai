#!/usr/bin/env tsx
/**
 * Quick auth capture - assumes you're already signed in
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function captureAuthState() {
  console.log('🔐 Quick Auth State Capture');
  console.log('==========================\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    channel: 'chrome' 
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Navigate directly to dashboard (assumes already authenticated)
  const baseUrl = process.env.E2E_BASE_URL || 'http://localhost:3001';
  console.log(`📍 Navigating to: ${baseUrl}/dashboard`);
  await page.goto(`${baseUrl}/dashboard`);
  
  // Wait a moment for page to load
  await page.waitForTimeout(3000);
  
  // Check if we're authenticated
  const currentUrl = page.url();
  console.log(`📍 Current URL: ${currentUrl}`);
  
  if (currentUrl.includes('/sign-in')) {
    console.log('❌ Not authenticated. Please sign in first.');
    
    console.log('\n👉 Please sign in manually in the browser window...');
    console.log('   Waiting 30 seconds for you to sign in...');
    
    // Wait for redirect away from sign-in page
    await page.waitForURL(
      url => !url.includes('/sign-in'),
      { timeout: 30000 }
    ).catch(() => {
      console.log('❌ Timeout waiting for sign in');
    });
  }
  
  // Final check
  const finalUrl = page.url();
  if (finalUrl.includes('/sign-in')) {
    console.log('❌ Still on sign-in page. Exiting.');
    await browser.close();
    process.exit(1);
  }
  
  // Save the storage state
  const statePath = path.join(process.cwd(), 'storageState.json');
  await context.storageState({ path: statePath });
  
  console.log(`✅ Authentication state saved to: ${statePath}`);
  console.log('\n📝 You can now:');
  console.log('   1. Run Playwright tests with: npm run e2e');
  console.log('   2. Use Playwright MCP - it will use the saved auth state');
  
  await browser.close();
}

captureAuthState().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});