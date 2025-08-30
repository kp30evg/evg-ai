const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  console.log('1. Going to demo page...');
  await page.goto('http://localhost:3000/demo');
  await page.waitForTimeout(2000);
  
  console.log('2. Clicking on burn rate sample prompt...');
  // Click on the burn rate prompt card
  await page.click('text="What\'s our monthly burn rate?"');
  
  console.log('3. Waiting for thinking animation...');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'demo-thinking-state.png', fullPage: false });
  
  console.log('4. Waiting for response...');
  await page.waitForTimeout(5000);
  
  console.log('5. Taking screenshot of response...');
  await page.screenshot({ path: 'demo-answer-state.png', fullPage: false });
  
  console.log('✅ Test complete! Check demo-answer-state.png');
  console.log('Browser will stay open for inspection...');
  
  await page.waitForTimeout(60000);
  await browser.close();
})();