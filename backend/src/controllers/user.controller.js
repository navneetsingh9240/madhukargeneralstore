const prisma = require('../config/db');

// GET /api/wishlist
async function getWishlist(req, res) {
  try {
    const wishlist = await prisma.wishlist.findMany({
      where: { userId: req.user.id },
      include: {
        product: {
          include: {
            images: { select: { url: true, isPrimary: true } },
            inventory: { select: { currentStock: true, status: true } },
            category: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      success: true,
      data: wishlist.map((w) => w.product),
    });
  } catch (error) {
    console.error('Get wishlist error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch wishlist' });
  }
}

// POST /api/wishlist
async function addToWishlist(req, res) {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    const existing = await prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId: req.user.id,
          productId,
        },
      },
    });

    if (existing) {
      return res.json({ success: true, message: 'Item already in wishlist' });
    }

    await prisma.wishlist.create({
      data: {
        userId: req.user.id,
        productId,
      },
    });

    return res.status(201).json({ success: true, message: 'Added to wishlist' });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    return res.status(500).json({ success: false, message: 'Failed to add to wishlist' });
  }
}

// DELETE /api/wishlist/:productId
async function removeFromWishlist(req, res) {
  try {
    const { productId } = req.params;

    await prisma.wishlist.deleteMany({
      where: {
        userId: req.user.id,
        productId,
      },
    });

    return res.json({ success: true, message: 'Removed from wishlist' });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    return res.status(500).json({ success: false, message: 'Failed to remove from wishlist' });
  }
}

// POST /api/reviews
async function addReview(req, res) {
  try {
    const { productId, rating, comment } = req.body;

    if (!productId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Valid product ID and rating (1-5) are required' });
    }

    // Check if user purchased the product
    const purchased = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: { userId: req.user.id, paymentStatus: 'COMPLETED' },
      },
    });

    const review = await prisma.review.create({
      data: {
        productId,
        userId: req.user.id,
        rating: parseInt(rating),
        comment: comment || null,
        isVerified: !!purchased,
      },
    });

    // Recalculate average rating for product
    const stats = await prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.product.update({
      where: { id: productId },
      data: {
        ratingAverage: Math.round((stats._avg.rating || 0) * 10) / 10,
        ratingCount: stats._count.rating || 0,
      },
    });

    return res.status(201).json({ success: true, message: 'Review submitted successfully', data: review });
  } catch (error) {
    console.error('Add review error:', error);
    return res.status(500).json({ success: false, message: 'Failed to submit review' });
  }
}

// GET /api/coupons
async function getActiveCoupons(req, res) {
  try {
    const coupons = await prisma.coupon.findMany({
      where: {
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
      },
      select: {
        id: true,
        code: true,
        description: true,
        discountType: true,
        discountAmount: true,
        minOrderAmount: true,
        maxDiscount: true,
        expiresAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, data: coupons });
  } catch (error) {
    console.error('Get coupons error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch coupons' });
  }
}

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  addReview,
  getActiveCoupons,
};
