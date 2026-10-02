require('dotenv').config();
const { chromium } = require('@playwright/test');
const { spawn } = require('child_process');
const fs = require('fs');

async function verifyE2E() {
  console.log('🚀 Starting E2E & Visual Verification...');

  // Start Backend API
  const backend = spawn('node', ['backend/src/server.js'], {
    env: { ...process.env, PORT: '5000', DATABASE_URL: 'file:./dev.db' },
    stdio: 'inherit',
  });

  // Start Next.js Frontend
  const frontend = spawn('npx', ['next', 'start', '-p', '3000'], {
    env: { ...process.env, PORT: '3000', NEXT_PUBLIC_API_URL: 'http://localhost:5000' },
    stdio: 'inherit',
  });

  // Wait 4 seconds for servers to start
  await new Promise((resolve) => setTimeout(resolve, 4000));

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();

    fs.mkdirSync('screenshots', { recursive: true });

    // 1. Visit Home Page
    console.log('📸 Navigating to Home Page...');
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'screenshots/01-home-page.png', fullPage: true });

    // 2. Check Delivery PIN 800001
    console.log('🔍 Testing mandatory 6-digit PIN delivery check...');
    await page.fill('input[placeholder*="800001"]', '800001');
    await page.click('button:has-text("CHECK")');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'screenshots/02-pincode-checked.png' });

    // 3. Visit Shop Page & Add Product to Cart
    console.log('🛒 Navigating to Shop Page...');
    await page.goto('http://localhost:3000/shop', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'screenshots/03-shop-page.png' });

    // Click ADD button on first product card
    const addBtn = await page.$('button:has-text("ADD")');
    if (addBtn) {
      await addBtn.click();
      await page.waitForTimeout(1000);
    }

    // 4. Visit Cart Page
    console.log('🛍️ Navigating to Cart Page...');
    await page.goto('http://localhost:3000/cart', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/04-cart-page.png' });

    // Apply Coupon WELCOME50
    const couponInput = await page.$('input[placeholder*="WELCOME50"]');
    if (couponInput) {
      await couponInput.fill('WELCOME50');
      await page.click('button:has-text("APPLY")');
      await page.waitForTimeout(1000);
    }
    await page.screenshot({ path: 'screenshots/05-cart-coupon-applied.png' });

    // 5. Login as Customer
    console.log('🔐 Logging in as customer...');
    await context.clearCookies();
    await page.evaluate(() => localStorage.clear());
    await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await page.fill('input[type="email"]', 'customer@gmail.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button:has-text("SIGN IN TO ACCOUNT")');
    await page.waitForTimeout(1500);

    // Proceed to Checkout
    console.log('💳 Proceeding to Checkout...');
    await page.goto('http://localhost:3000/checkout', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'screenshots/06-checkout-address.png' });

    // Click Continue to Payment
    const continueBtn = await page.$('button:has-text("CONTINUE TO PAYMENT")');
    if (continueBtn) {
      await continueBtn.click();
      await page.waitForTimeout(1000);
    }
    await page.screenshot({ path: 'screenshots/07-checkout-payment.png' });

    // Confirm Order
    const confirmBtn = await page.$('button:has-text("CONFIRM & PLACE ORDER")');
    if (confirmBtn) {
      await confirmBtn.click();
      await page.waitForTimeout(2500);
    }

    // Digital Invoice View
    await page.screenshot({ path: 'screenshots/08-digital-invoice.png', fullPage: true });

    // 6. Admin Login & Dashboard
    console.log('⚙️ Logging in as Admin & Navigating to Admin Dashboard...');
    await context.clearCookies();
    await page.evaluate(() => localStorage.clear());
    await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
    await page.fill('input[type="email"]', 'admin@madhukargeneralstore.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button:has-text("SIGN IN TO ACCOUNT")');
    await page.waitForTimeout(1500);

    await page.goto('http://localhost:3000/admin', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/09-admin-dashboard.png', fullPage: true });

    // 7. QR Delivery Scanner
    console.log('📱 Navigating to QR Delivery Scanner...');
    await page.goto('http://localhost:3000/delivery', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await page.click('button:has-text("VERIFY QR")');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/10-qr-delivery-scanner.png' });

    console.log('✨ E2E Visual Verification completed successfully!');
  } catch (err) {
    console.error('❌ Error during E2E verification:', err);
  } finally {
    if (browser) await browser.close();
    backend.kill();
    frontend.kill();
  }
}

verifyE2E().catch((e) => {
  console.error(e);
  process.exit(1);
});
