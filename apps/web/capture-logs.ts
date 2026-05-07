const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const logs: string[] = [];

  page.on('console', (msg: any) => {
    logs.push(msg.text());
    console.log('BROWSER LOG:', msg.text());
  });

  await page.goto('http://localhost:3001/onboarding');

  await page.waitForTimeout(5000);

  await browser.close();

  console.log('\n=== CAPTURED LOGS ===');
  logs.forEach((log, i) => console.log(`${i + 1}. ${log}`));
})();
