const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  console.log('1. Navigating to landing page...');
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(1000);
  
  // Take landing page with demo button
  console.log('2. Taking landing page screenshot with demo button...');
  await page.screenshot({ 
    path: 'landing-with-demo-button.png', 
    fullPage: false 
  });
  
  console.log('3. Going directly to demo page...');
  await page.goto('http://localhost:3000/demo');
  await page.waitForTimeout(2000);
  
  console.log('4. Taking demo welcome state screenshot...');
  await page.screenshot({ 
    path: 'demo-ui-welcome.png', 
    fullPage: false 
  });
  
  console.log('5. Typing in the input field...');
  await page.fill('textarea[placeholder="Message evergreenOS..."]', 'What is our monthly revenue?');
  await page.waitForTimeout(500);
  
  await page.screenshot({ 
    path: 'demo-ui-typing.png', 
    fullPage: false 
  });
  
  console.log('6. Clicking on sample prompt...');
  await page.fill('textarea[placeholder="Message evergreenOS..."]', '');
  await page.click('text="What\'s our monthly burn rate?"');
  
  // Wait for thinking animation
  await page.waitForTimeout(1500);
  console.log('7. Taking thinking state screenshot...');
  await page.screenshot({ 
    path: 'demo-ui-thinking.png', 
    fullPage: false 
  });
  
  // Wait for answer
  await page.waitForTimeout(3000);
  console.log('8. Taking answer state screenshot...');
  await page.screenshot({ 
    path: 'demo-ui-answer.png', 
    fullPage: false 
  });
  
  console.log('✅ All screenshots captured successfully!');
  
  await browser.close();
})();