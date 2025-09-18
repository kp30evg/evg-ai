#!/usr/bin/env tsx
/**
 * Simple script to open browser and save auth state manually
 */

import { chromium } from 'playwright';
import path from 'path';

async function openBrowserForAuth() {
  console.log('🔐 Opening Browser for Manual Authentication');
  console.log('============================================\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    channel: 'chrome'
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Navigate to sign-in page
  await page.goto('http://localhost:3001/sign-in');
  
  console.log('📋 Browser opened at sign-in page\n');
  console.log('Please:\n');
  console.log('1. Sign in with your Google account (kian@evergreengroup.ai)');
  console.log('2. Wait until you reach the dashboard');
  console.log('3. Keep this terminal open\n');
  console.log('The browser will stay open for 5 minutes.');
  console.log('Tell me when you\'re signed in and I\'ll save the auth state.\n');
  
  // Keep browser open for 5 minutes
  await page.waitForTimeout(300000);
  
  await browser.close();
}

openBrowserForAuth().catch(error => {
  console.error('Error:', error);
});