const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  console.log('Navigating to demo page...');
  await page.goto('http://localhost:3000/demo');
  
  // Wait for page to load
  await page.waitForTimeout(2000);
  
  // Take initial screenshot
  console.log('Taking welcome state screenshot...');
  await page.screenshot({ 
    path: 'demo-welcome.png', 
    fullPage: false 
  });
  
  // Click on first prompt
  console.log('Clicking on sample prompt...');
  await page.click('text="What\'s our monthly burn rate?"');
  
  // Wait for thinking animation
  await page.waitForTimeout(2000);
  console.log('Taking thinking state screenshot...');
  await page.screenshot({ 
    path: 'demo-thinking.png', 
    fullPage: false 
  });
  
  // Wait for answer
  await page.waitForTimeout(3000);
  console.log('Taking answer state screenshot...');
  await page.screenshot({ 
    path: 'demo-answer.png', 
    fullPage: false 
  });
  
  console.log('Screenshots saved!');
  console.log('Keeping browser open for manual inspection...');
  
  // Keep browser open
  await page.waitForTimeout(60000);
  await browser.close();
})();