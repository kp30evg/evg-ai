const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  console.log('1. Going to demo page...');
  await page.goto('http://localhost:3000/demo');
  await page.waitForTimeout(2000);
  
  console.log('2. Typing a question...');
  await page.fill('textarea[placeholder="Message evergreenOS..."]', 'What is 2+2?');
  await page.waitForTimeout(500);
  
  console.log('3. Submitting question...');
  await page.press('textarea[placeholder="Message evergreenOS..."]', 'Enter');
  
  console.log('4. Waiting for response...');
  await page.waitForTimeout(6000);
  
  console.log('5. Taking screenshot of response...');
  await page.screenshot({ path: 'openai-response.png', fullPage: false });
  
  console.log('✅ Test complete! Check openai-response.png');
  console.log('Browser will stay open for 30 seconds...');
  
  await page.waitForTimeout(30000);
  await browser.close();
})();