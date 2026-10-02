const prisma = require('./src/config/db');

async function cleanupSeededData() {
  console.log('\n========================================');
  console.log('   MADHUKAR STORE - CATALOG CLEANUP');
  console.log('========================================\n');

  try {
    console.log('Removing product images...');
    const deletedImages = await prisma.productImage.deleteMany({});
    console.log(`Deleted: ${deletedImages.count} product images`);

    console.log('Removing inventory records...');
    const deletedInventory = await prisma.inventory.deleteMany({});
    console.log(`Deleted: ${deletedInventory.count} inventory records`);

    console.log('Removing wishlist entries...');
    const deletedWishlist = await prisma.wishlist.deleteMany({});
    console.log(`Deleted: ${deletedWishlist.count} wishlist entries`);

    console.log('Removing product reviews...');
    const deletedReviews = await prisma.review.deleteMany({});
    console.log(`Deleted: ${deletedReviews.count} reviews`);

    console.log('Disconnecting products from old order items...');

    const disconnectedItems = await prisma.orderItem.updateMany({
      where: {
        productId: {
          not: null,
        },
      },
      data: {
        productId: null,
      },
    });

    console.log(`Disconnected: ${disconnectedItems.count} order items`);

    console.log('Removing products...');
    const deletedProducts = await prisma.product.deleteMany({});
    console.log(`Deleted: ${deletedProducts.count} products`);

    console.log('Removing categories...');
    const deletedCategories = await prisma.category.deleteMany({});
    console.log(`Deleted: ${deletedCategories.count} categories`);

    console.log('Removing brands...');
    const deletedBrands = await prisma.brand.deleteMany({});
    console.log(`Deleted: ${deletedBrands.count} brands`);

    console.log('\n----------------------------------------');
    console.log('PRESERVED DATA');
    console.log('----------------------------------------');
    console.log('Store Settings: PRESERVED');
    console.log('Delivery Areas: PRESERVED');
    console.log('Users: PRESERVED');
    console.log('Orders: PRESERVED');
    console.log('Invoices: PRESERVED');
    console.log('Payments: PRESERVED');
    console.log('Addresses: PRESERVED');

    console.log('\n========================================');
    console.log('        CLEANUP COMPLETED');
    console.log('========================================\n');
  } catch (error) {
    console.error('\nCLEANUP FAILED');
    console.error(error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

cleanupSeededData();