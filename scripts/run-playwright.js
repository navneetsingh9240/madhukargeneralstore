const { chromium } = require('@playwright/test');
const fs = require('fs');

async function runPlaywright() {
  console.log('🎭 Running Playwright E2E & Screenshot Capture...');
  fs.mkdirSync('screenshots', { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  try {
    // 1. Home Page
    console.log('1. Loading Home Page...');
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'screenshots/01-home-page.png', fullPage: true });

    // 2. PIN Code Delivery Check
    console.log('2. Testing Delivery PIN 800001...');
    await page.fill('input[placeholder*="800001"]', '800001');
    await page.click('button:has-text("CHECK")');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/02-pincode-checked.png' });

    // 3. Shop Catalog Page
    console.log('3. Loading Shop Catalog...');
    await page.goto('http://localhost:3000/shop', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'screenshots/03-shop-page.png' });

    // Find enabled ADD button
    const addButtons = await page.$$('button:has-text("ADD"):not([disabled])');
    if (addButtons.length > 0) {
      await addButtons[0].click();
      await page.waitForTimeout(800);
    }

    // 4. Cart Page
    console.log('4. Loading Cart Page...');
    await page.goto('http://localhost:3000/cart', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/04-cart-page.png' });

    // 5. Customer Login Page
    console.log('5. Loading Login Page...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/05-login-page.png' });

    await page.fill('input[type="email"]', 'customer@gmail.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button:has-text("SIGN IN TO ACCOUNT")');
    await page.waitForTimeout(1500);

    // 6. Checkout Page
    console.log('6. Loading Checkout Page...');
    await page.goto('http://localhost:3000/checkout', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'screenshots/06-checkout.png' });

    // 7. QR Delivery Portal Page
    console.log('7. Loading QR Delivery Verification Scanner...');
    await page.goto('http://localhost:3000/delivery', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await page.click('button:has-text("VERIFY QR")');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/07-qr-delivery-scanner.png' });

    console.log('✅ Playwright E2E Screenshots captured successfully in /screenshots folder!');
  } catch (err) {
    console.error('❌ Playwright error:', err);
  } finally {
    await browser.close();
  }
}

runPlaywright();
