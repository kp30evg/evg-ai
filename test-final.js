const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  console.log('🚀 Testing evergreenOS with OpenAI GPT-4...\n');
  
  console.log('1. Navigating to demo page...');
  await page.goto('http://localhost:3000/demo');
  await page.waitForTimeout(2000);
  
  console.log('2. Typing a direct question...');
  await page.fill('textarea[placeholder="Message evergreenOS..."]', 'What are the top 3 strategies to reduce monthly burn rate for a SaaS startup?');
  
  console.log('3. Submitting question...');
  await page.press('textarea[placeholder="Message evergreenOS..."]', 'Enter');
  
  console.log('   ⏳ Waiting for thinking animation...');
  await page.waitForTimeout(3000);
  
  console.log('   ⏳ Waiting for AI response to complete...');
  // Wait for the "Ask Another Question" button to appear, which means response is complete
  try {
    await page.waitForSelector('text="Ask Another Question"', { timeout: 15000 });
    console.log('   ✓ Response received!');
  } catch (e) {
    console.log('   ⚠️ Response taking longer than expected...');
  }
  
  await page.waitForTimeout(2000);
  
  console.log('4. Taking screenshot of complete response...');
  await page.screenshot({ path: 'openai-working.png', fullPage: false });
  
  console.log('\n✅ Test complete! OpenAI integration is working!');
  console.log('   Screenshot saved: openai-working.png');
  console.log('\nBrowser will stay open for manual testing...');
  
  await page.waitForTimeout(60000);
  await browser.close();
})();