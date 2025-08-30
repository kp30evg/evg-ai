const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  console.log('🚀 Testing evergreenOS with OpenAI GPT-4...\n');
  
  console.log('1. Navigating to demo page...');
  await page.goto('http://localhost:3000/demo');
  await page.waitForTimeout(2000);
  
  console.log('2. Testing with burn rate question...');
  await page.click('text="What\'s our monthly burn rate?"');
  
  console.log('   ⏳ Waiting for AI response...');
  await page.waitForTimeout(7000);
  
  console.log('3. Taking screenshot of burn rate response...');
  await page.screenshot({ path: 'test-1-burn-rate.png', fullPage: false });
  
  // Test another question
  console.log('4. Asking another question...');
  await page.click('text="Ask Another Question"');
  await page.waitForTimeout(1000);
  
  console.log('5. Testing custom question...');
  await page.fill('textarea[placeholder="Message evergreenOS..."]', 'How can I improve my customer retention rate?');
  await page.press('textarea[placeholder="Message evergreenOS..."]', 'Enter');
  
  console.log('   ⏳ Waiting for AI response...');
  await page.waitForTimeout(7000);
  
  console.log('6. Taking screenshot of custom response...');
  await page.screenshot({ path: 'test-2-custom-question.png', fullPage: false });
  
  console.log('\n✅ Tests complete! Check the screenshots:');
  console.log('   - test-1-burn-rate.png');
  console.log('   - test-2-custom-question.png');
  console.log('\nBrowser will stay open for manual testing...');
  
  await page.waitForTimeout(60000);
  await browser.close();
})();