const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const logs = [];

  page.on('console', (msg) => {
    const text = msg.text();
    logs.push(text);
    console.log('BROWSER LOG:', text);
  });

  page.on('pageerror', (error) => {
    console.log('PAGE ERROR:', error.message);
  });

  try {
    const response = await page.goto('http://localhost:3002/onboarding', { waitUntil: 'networkidle' });
    console.log('Page loaded successfully');
    console.log('Final URL:', page.url());
    console.log('Status:', response.status());
    
    const content = await page.content();
    console.log('Page title:', await page.title());
    console.log('Body length:', content.length);
    
    // Check for Clerk in window
    const clerkCheck = await page.evaluate(() => {
      return {
        windowClerk: typeof window.Clerk,
        windowUnderscoreClerk: typeof window.__clerk,
        clerkLoaded: !!window.Clerk,
        clerkInstance: window.Clerk ? 'exists' : 'null',
        clerkKeys: Object.keys(window).filter(k => k.toLowerCase().includes('clerk'))
      };
    });
    
    console.log('\n=== CLERK WINDOW STATE ===');
    console.log(JSON.stringify(clerkCheck, null, 2));
    
    await page.waitForTimeout(10000);
  } catch (error) {
    console.log('Navigation error:', error.message);
  }

  await browser.close();

  console.log('\n=== CAPTURED LOGS ===');
  logs.forEach((log, i) => console.log(`${i + 1}. ${log}`));
})();
