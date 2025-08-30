const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  console.log('1. Landing page...');
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '1-landing.png', fullPage: false });
  
  console.log('2. Demo page...');
  await page.goto('http://localhost:3000/demo');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '2-demo.png', fullPage: false });
  
  console.log('✅ Screenshots saved!');
  console.log('Browser will stay open for 10 seconds...');
  
  await page.waitForTimeout(10000);
  await browser.close();
})();