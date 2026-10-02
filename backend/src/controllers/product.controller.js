const prisma = require('../config/db');

// GET /api/products
async function getProducts(req, res) {
  try {
    const { category, brand, search, minPrice, maxPrice, sort, featured, page = 1, limit = 20 } = req.query;

    const where = { isActive: true };

    if (category) {
      where.category = { slug: category };
    }

    if (brand) {
      where.brand = { slug: brand };
    }

    if (featured === 'true') {
      where.isFeatured = true;
    }

    if (minPrice || maxPrice) {
      where.sellingPrice = {};
      if (minPrice) where.sellingPrice.gte = parseFloat(minPrice);
      if (maxPrice) where.sellingPrice.lte = parseFloat(maxPrice);
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { category: { name: { contains: search } } },
        { brand: { name: { contains: search } } },
      ];
    }

    let orderBy = { createdAt: 'desc' };
    if (sort === 'price_low') orderBy = { sellingPrice: 'asc' };
    else if (sort === 'price_high') orderBy = { sellingPrice: 'desc' };
    else if (sort === 'popular') orderBy = { ratingCount: 'desc' };
    else if (sort === 'rating') orderBy = { ratingAverage: 'desc' };

    const take = parseInt(limit);
    const skip = (parseInt(page) - 1) * take;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        take,
        skip,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          brand: { select: { id: true, name: true, slug: true } },
          images: { select: { id: true, url: true, isPrimary: true } },
          inventory: { select: { currentStock: true, status: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return res.json({
      success: true,
      data: products,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / take),
        limit: take,
      },
    });
  } catch (error) {
    console.error('Get products error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch products' });
  }
}

// GET /api/products/:slug
async function getProductBySlug(req, res) {
  try {
    const { slug } = req.params;

    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true, slug: true } },
        images: { select: { id: true, url: true, isPrimary: true } },
        inventory: { select: { currentStock: true, status: true, lowStockThreshold: true } },
        reviews: {
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Similar Products
    const similarProducts = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
        isActive: true,
      },
      take: 4,
      include: {
        images: true,
        inventory: { select: { currentStock: true, status: true } },
      },
    });

    return res.json({
      success: true,
      data: {
        ...product,
        similarProducts,
      },
    });
  } catch (error) {
    console.error('Get product details error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch product details' });
  }
}

// GET /api/categories
async function getCategories(req, res) {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { products: true } },
      },
      orderBy: { name: 'asc' },
    });

    return res.json({ success: true, data: categories });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
}

module.exports = {
  getProducts,
  getProductBySlug,
  getCategories,
};
