require('dotenv').config();
const prisma = require('../backend/src/config/db');

async function runUnitTests() {
  console.log('🧪 Running Unit & Integration Checks for Madhukar General Store...');

  // 1. Database models check
  const productCount = await prisma.product.count();
  const deliveryAreaCount = await prisma.deliveryArea.count();
  const userCount = await prisma.user.count();

  console.log(`✓ Database initialized with ${productCount} products, ${deliveryAreaCount} delivery areas, and ${userCount} users.`);

  // 2. Test PIN lookup
  const pin800001 = await prisma.deliveryArea.findUnique({ where: { pincode: '800001' } });
  if (!pin800001 || !pin800001.isActive) {
    throw new Error('PIN 800001 check failed!');
  }
  console.log(`✓ PIN 800001 verified serviceable: ${pin800001.area}, ${pin800001.city}`);

  // 3. Test Coupon lookup
  const coupon = await prisma.coupon.findUnique({ where: { code: 'WELCOME50' } });
  if (!coupon || !coupon.isActive) {
    throw new Error('Coupon WELCOME50 check failed!');
  }
  console.log(`✓ Coupon WELCOME50 verified active: ₹${coupon.discountAmount} off.`);

  // 4. Test Invoice QR lookup
  const invoice = await prisma.invoice.findFirst({ include: { order: true } });
  if (!invoice || !invoice.qrToken) {
    throw new Error('Invoice QR check failed!');
  }
  console.log(`✓ Invoice #${invoice.invoiceNumber} verified with QR token.`);

  console.log('🎉 All backend unit & integration checks PASSED!');
  await prisma.$disconnect();
}

runUnitTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
