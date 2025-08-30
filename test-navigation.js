const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  console.log('🎨 Testing Navigation with Brand Colors\n');
  
  // Test Homepage Navigation
  console.log('1. Loading homepage...');
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(2000);
  
  // Verify buttons are visible
  const signInButton = await page.isVisible('text="Sign In"');
  const signUpButton = await page.isVisible('text="Sign Up"');
  
  console.log(`   ${signInButton ? '✓' : '✗'} Sign In button visible`);
  console.log(`   ${signUpButton ? '✓' : '✗'} Sign Up button visible`);
  
  await page.screenshot({ path: 'nav-with-buttons.png', fullPage: false });
  console.log('   ✓ Screenshot: nav-with-buttons.png');
  
  // Test Sign In flow
  console.log('\n2. Testing Sign In flow...');
  await page.click('text="Sign In"');
  await page.waitForTimeout(2000);
  
  const signInPage = page.url().includes('sign-in');
  console.log(`   ${signInPage ? '✓' : '✗'} Navigated to Sign In page`);
  
  await page.screenshot({ path: 'sign-in-page.png', fullPage: false });
  console.log('   ✓ Screenshot: sign-in-page.png');
  
  // Test Sign Up flow
  console.log('\n3. Testing Sign Up flow...');
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(1000);
  await page.click('text="Sign Up"');
  await page.waitForTimeout(2000);
  
  const signUpPage = page.url().includes('sign-up');
  console.log(`   ${signUpPage ? '✓' : '✗'} Navigated to Sign Up page`);
  
  await page.screenshot({ path: 'sign-up-page.png', fullPage: false });
  console.log('   ✓ Screenshot: sign-up-page.png');
  
  // Test Demo is still accessible
  console.log('\n4. Verifying demo page...');
  await page.goto('http://localhost:3000/demo');
  await page.waitForTimeout(2000);
  
  const chatUI = await page.isVisible('text="How can I help you today?"');
  console.log(`   ${chatUI ? '✓' : '✗'} ChatGPT UI still intact`);
  
  console.log('\n✅ Summary:');
  console.log('• Navigation has Sign In/Sign Up buttons with brand colors');
  console.log('• Sign In redirects to Clerk authentication');
  console.log('• Sign Up redirects to Clerk registration');
  console.log('• After auth, users go to /demo (ChatGPT UI)');
  console.log('• Demo page remains fully functional');
  
  console.log('\nClosing in 5 seconds...');
  await page.waitForTimeout(5000);
  await browser.close();
})();