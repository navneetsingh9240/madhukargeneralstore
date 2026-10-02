const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // -------------------------
  // CATEGORIES
  // -------------------------
  const categories = [
    { name: 'Groceries', slug: 'groceries' },
    { name: 'Fruits & Vegetables', slug: 'fruits-vegetables' },
    { name: 'Dairy & Breakfast', slug: 'dairy-breakfast' },
    { name: 'Snacks & Biscuits', slug: 'snacks-biscuits' },
    { name: 'Beverages', slug: 'beverages' },
    { name: 'Personal Care', slug: 'personal-care' },
    { name: 'Household Essentials', slug: 'household-essentials' },
  ];

  const categoryMap = {};

  for (const category of categories) {
    const created = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        isActive: true,
      },
      create: {
        name: category.name,
        slug: category.slug,
        isActive: true,
      },
    });

    categoryMap[category.slug] = created;
  }

  console.log(`✅ ${categories.length} categories ready`);

  // -------------------------
  // BRANDS
  // -------------------------
  const brands = [
    { name: 'Tata', slug: 'tata' },
    { name: 'Britannia', slug: 'britannia' },
    { name: 'Parle', slug: 'parle' },
    { name: 'Amul', slug: 'amul' },
    { name: 'Maggi', slug: 'maggi' },
    { name: 'Dabur', slug: 'dabur' },
    { name: 'Surf Excel', slug: 'surf-excel' },
    { name: 'Coca-Cola', slug: 'coca-cola' },
  ];

  const brandMap = {};

  for (const brand of brands) {
    const created = await prisma.brand.upsert({
      where: { slug: brand.slug },
      update: {
        name: brand.name,
        isActive: true,
      },
      create: {
        name: brand.name,
        slug: brand.slug,
        isActive: true,
      },
    });

    brandMap[brand.slug] = created;
  }

  console.log(`✅ ${brands.length} brands ready`);

  // -------------------------
  // PRODUCTS
  // -------------------------
  const products = [
    {
      name: 'Tata Salt 1kg',
      slug: 'tata-salt-1kg',
      sku: 'MGS-TATA-SALT-1KG',
      unit: '1 kg',
      mrp: 30,
      sellingPrice: 28,
      category: 'groceries',
      brand: 'tata',
      stock: 50,
      imageUrl: 'https://placehold.co/600x600?text=Tata+Salt',
    },
    {
      name: 'Tata Tea Gold 500g',
      slug: 'tata-tea-gold-500g',
      sku: 'MGS-TATA-TEA-GOLD-500G',
      unit: '500 g',
      mrp: 285,
      sellingPrice: 260,
      category: 'groceries',
      brand: 'tata',
      stock: 30,
      imageUrl: 'https://placehold.co/600x600?text=Tata+Tea',
    },
    {
      name: 'Britannia Good Day Biscuits',
      slug: 'britannia-good-day-biscuits',
      sku: 'MGS-BRITANNIA-GOODDAY',
      unit: '200 g',
      mrp: 40,
      sellingPrice: 38,
      category: 'snacks-biscuits',
      brand: 'britannia',
      stock: 75,
      imageUrl: 'https://placehold.co/600x600?text=Good+Day',
    },
    {
      name: 'Parle-G Biscuits',
      slug: 'parle-g-biscuits',
      sku: 'MGS-PARLE-G',
      unit: '250 g',
      mrp: 30,
      sellingPrice: 28,
      category: 'snacks-biscuits',
      brand: 'parle',
      stock: 80,
      imageUrl: 'https://placehold.co/600x600?text=Parle-G',
    },
    {
      name: 'Amul Taaza Milk',
      slug: 'amul-taaza-milk',
      sku: 'MGS-AMUL-MILK',
      unit: '1 L',
      mrp: 60,
      sellingPrice: 60,
      category: 'dairy-breakfast',
      brand: 'amul',
      stock: 40,
      imageUrl: 'https://placehold.co/600x600?text=Amul+Milk',
    },
    {
      name: 'Maggi 2-Minute Noodles',
      slug: 'maggi-2-minute-noodles',
      sku: 'MGS-MAGGI-2MIN',
      unit: '280 g',
      mrp: 70,
      sellingPrice: 65,
      category: 'snacks-biscuits',
      brand: 'maggi',
      stock: 60,
      imageUrl: 'https://placehold.co/600x600?text=Maggi',
    },
    {
      name: 'Dabur Honey',
      slug: 'dabur-honey',
      sku: 'MGS-DABUR-HONEY',
      unit: '500 g',
      mrp: 250,
      sellingPrice: 220,
      category: 'groceries',
      brand: 'dabur',
      stock: 25,
      imageUrl: 'https://placehold.co/600x600?text=Dabur+Honey',
    },
    {
      name: 'Surf Excel Matic',
      slug: 'surf-excel-matic',
      sku: 'MGS-SURF-MATIC',
      unit: '2 kg',
      mrp: 420,
      sellingPrice: 390,
      category: 'household-essentials',
      brand: 'surf-excel',
      stock: 20,
      imageUrl: 'https://placehold.co/600x600?text=Surf+Excel',
    },
    {
      name: 'Coca-Cola',
      slug: 'coca-cola-750ml',
      sku: 'MGS-COCA-750ML',
      unit: '750 ml',
      mrp: 45,
      sellingPrice: 40,
      category: 'beverages',
      brand: 'coca-cola',
      stock: 45,
      imageUrl: 'https://placehold.co/600x600?text=Coca-Cola',
    },
  ];

  for (const item of products) {
    const product = await prisma.product.upsert({
      where: { sku: item.sku },
      update: {
        name: item.name,
        sellingPrice: item.sellingPrice,
        mrp: item.mrp,
        unit: item.unit,
        categoryId: categoryMap[item.category].id,
        brandId: brandMap[item.brand].id,
        isActive: true,
      },
      create: {
        name: item.name,
        slug: item.slug,
        sku: item.sku,
        unit: item.unit,
        mrp: item.mrp,
        sellingPrice: item.sellingPrice,
        discountPercent: Math.round(
          ((item.mrp - item.sellingPrice) / item.mrp) * 100
        ),
        categoryId: categoryMap[item.category].id,
        brandId: brandMap[item.brand].id,
        isActive: true,
      },
    });

    await prisma.inventory.upsert({
      where: { productId: product.id },
      update: {
        currentStock: item.stock,
        status: item.stock === 0
          ? 'OUT_OF_STOCK'
          : item.stock <= 5
            ? 'LOW_STOCK'
            : 'IN_STOCK',
      },
      create: {
        productId: product.id,
        currentStock: item.stock,
        lowStockThreshold: 5,
        status: item.stock === 0
          ? 'OUT_OF_STOCK'
          : item.stock <= 5
            ? 'LOW_STOCK'
            : 'IN_STOCK',
      },
    });

    await prisma.productImage.deleteMany({
      where: { productId: product.id },
    });

    await prisma.productImage.create({
      data: {
        productId: product.id,
        url: item.imageUrl,
        isPrimary: true,
      },
    });

    console.log(`   ✅ ${item.name}`);
  }

  console.log(`✅ ${products.length} products ready`);

  // -------------------------
  // STORE SETTINGS
  // -------------------------
  await prisma.storeSettings.upsert({
    where: { id: 'madhukar-store-settings' },
    update: {},
    create: {
      id: 'madhukar-store-settings',
      storeName: 'MADHUKAR GENERAL STORE',
      address: 'Prayagraj, Uttar Pradesh, India',
      phone: null,
      email: null,
      enableGst: true,
      gstPercentage: 5,
      invoicePrefix: 'MGS-INV',
      invoiceYear: '2026',
      freeDeliveryThreshold: 499,
    },
  });

  console.log('✅ Store settings ready');
  console.log('🎉 Database seed completed successfully!');
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });