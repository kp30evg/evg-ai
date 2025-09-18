#!/usr/bin/env tsx
/**
 * Capture authentication state from existing browser session
 * This script helps generate storageState.json for Playwright testing
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function captureAuthState() {
  console.log('🔐 Auth State Capture Tool');
  console.log('========================\n');
  
  console.log('This tool will help you capture authentication state for Playwright testing.\n');
  console.log('Instructions:');
  console.log('1. A browser window will open');
  console.log('2. Sign in to your application normally (using Google OAuth)');
  console.log('3. Once signed in, press Enter in this terminal');
  console.log('4. The auth state will be saved to storageState.json\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    channel: 'chrome' 
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Navigate to the app
  const baseUrl = process.env.E2E_BASE_URL || 'http://localhost:3001';
  console.log(`📍 Opening browser at: ${baseUrl}/sign-in`);
  await page.goto(`${baseUrl}/sign-in`);
  
  console.log('\n👉 Please sign in manually in the browser window...');
  console.log('   (Use your Google account or any method that works)');
  console.log('\n✋ Once you are signed in and see the dashboard, press Enter here...');
  
  // Wait for user input
  await new Promise(resolve => {
    process.stdin.once('data', resolve);
  });
  
  // Check if we're authenticated
  const currentUrl = page.url();
  console.log(`\n📍 Current URL: ${currentUrl}`);
  
  if (currentUrl.includes('/sign-in')) {
    console.log('❌ Still on sign-in page. Please sign in before pressing Enter.');
    await browser.close();
    process.exit(1);
  }
  
  // Save the storage state
  const statePath = path.join(process.cwd(), 'storageState.json');
  await context.storageState({ path: statePath });
  
  console.log(`✅ Authentication state saved to: ${statePath}`);
  console.log('\n📝 You can now run Playwright tests with: npm run e2e');
  console.log('   Or use Playwright MCP with the saved auth state');
  
  await browser.close();
}

// Enable stdin for user input
process.stdin.resume();

captureAuthState().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});