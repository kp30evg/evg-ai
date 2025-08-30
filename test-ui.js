const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  console.log('Navigating to command page...');
  await page.goto('http://localhost:3000/command');
  
  // Wait for the page to fully load
  await page.waitForTimeout(2000);
  
  // Take screenshots
  console.log('Taking screenshots...');
  
  // Full page screenshot
  await page.screenshot({ 
    path: 'command-interface-full.png', 
    fullPage: true 
  });
  
  // Click on a sample prompt
  console.log('Testing interaction - clicking sample prompt...');
  const prompts = await page.$$('text="What\'s our monthly burn rate?"');
  if (prompts.length > 0) {
    await prompts[0].click();
    await page.waitForTimeout(3000);
    await page.screenshot({ 
      path: 'command-interface-thinking.png', 
      fullPage: true 
    });
  }
  
  console.log('Screenshots saved!');
  console.log('Browser will stay open for 30 seconds for manual inspection...');
  
  await page.waitForTimeout(30000);
  await browser.close();
})();