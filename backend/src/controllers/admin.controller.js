const prisma = require('../config/db');

// ============================================================
// ADMIN DASHBOARD METRICS
// ============================================================

// GET /api/admin/metrics
async function getAdminMetrics(req, res) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalSalesAgg,
      todaySalesAgg,
      totalOrders,
      pendingOrders,
      totalCustomers,
      totalProducts,
      lowStockProducts,
      recentOrders,
    ] = await Promise.all([
      prisma.order.aggregate({
        where: {
          paymentStatus: 'COMPLETED',
        },
        _sum: {
          totalAmount: true,
        },
      }),

      prisma.order.aggregate({
        where: {
          createdAt: {
            gte: today,
          },
          paymentStatus: 'COMPLETED',
        },
        _sum: {
          totalAmount: true,
        },
      }),

      prisma.order.count(),

      prisma.order.count({
        where: {
          orderStatus: 'PENDING',
        },
      }),

      prisma.user.count({
        where: {
          role: 'CUSTOMER',
        },
      }),

      prisma.product.count({
        where: {
          isActive: true,
        },
      }),

      prisma.inventory.count({
        where: {
          OR: [
            {
              status: 'LOW_STOCK',
            },
            {
              status: 'OUT_OF_STOCK',
            },
          ],
        },
      }),

      prisma.order.findMany({
        take: 5,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          user: {
            select: {
              name: true,
              phone: true,
            },
          },
          invoice: {
            select: {
              invoiceNumber: true,
            },
          },
        },
      }),
    ]);

    return res.json({
      success: true,
      data: {
        totalSales: totalSalesAgg._sum.totalAmount || 0,
        todaySales: todaySalesAgg._sum.totalAmount || 0,
        totalOrders,
        pendingOrders,
        totalCustomers,
        totalProducts,
        lowStockProducts,
        recentOrders,
      },
    });
  } catch (error) {
    console.error('Get admin metrics error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch admin dashboard metrics',
    });
  }
}

// ============================================================
// PRODUCT MANAGEMENT
// ============================================================

// POST /api/admin/products
async function createProduct(req, res) {
  try {
    const {
      name,
      unit,
      mrp,
      sellingPrice,
      categoryId,
      brandId,
      description,
      isFeatured,
      imageUrl,
      stock = 10,
    } = req.body;

    if (!name || !unit || !mrp || !sellingPrice || !categoryId) {
      return res.status(400).json({
        success: false,
        message:
          'Name, unit, MRP, selling price, and category are required',
      });
    }

    const slug =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') +
      '-' +
      Date.now().toString().slice(-4);

    const sku = `MGS-PRD-${Math.floor(1000 + Math.random() * 9000)}`;

    const discountPercent = Math.max(
      0,
      Math.round(((mrp - sellingPrice) / mrp) * 100)
    );

    const product = await prisma.$transaction(async (tx) => {
      const newProduct = await tx.product.create({
        data: {
          name,
          slug,
          sku,
          unit,
          mrp: parseFloat(mrp),
          sellingPrice: parseFloat(sellingPrice),
          discountPercent,
          categoryId,
          brandId: brandId || null,
          description: description || null,
          isFeatured: !!isFeatured,

          images: {
            create: imageUrl
              ? [
                  {
                    url: imageUrl,
                    isPrimary: true,
                  },
                ]
              : [
                  {
                    url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80',
                    isPrimary: true,
                  },
                ],
          },
        },
      });

      const parsedStock = parseInt(stock);

      const stockStatus =
        parsedStock === 0
          ? 'OUT_OF_STOCK'
          : parsedStock <= 5
            ? 'LOW_STOCK'
            : 'IN_STOCK';

      await tx.inventory.create({
        data: {
          productId: newProduct.id,
          currentStock: parsedStock,
          lowStockThreshold: 5,
          status: stockStatus,
        },
      });

      return await tx.product.findUnique({
        where: {
          id: newProduct.id,
        },
        include: {
          category: true,
          inventory: true,
          images: true,
        },
      });
    });

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error) {
    console.error('Create product error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to create product',
    });
  }
}

// PUT /api/admin/products/:id
async function updateProduct(req, res) {
  try {
    const { id } = req.params;

    const {
      name,
      unit,
      mrp,
      sellingPrice,
      categoryId,
      brandId,
      description,
      isFeatured,
      isActive,
      stock,
      imageUrl,
    } = req.body;

    const existingProduct = await prisma.product.findFirst({
      where: {
        OR: [
          {
            id,
          },
          {
            slug: id,
          },
          {
            sku: id,
          },
        ],
      },
    });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: `Product with ID/SKU "${id}" not found`,
      });
    }

    const productId = existingProduct.id;
    const dataToUpdate = {};

    if (name) {
      dataToUpdate.name = name;
    }

    if (unit) {
      dataToUpdate.unit = unit;
    }

    if (mrp) {
      dataToUpdate.mrp = parseFloat(mrp);
    }

    if (sellingPrice) {
      dataToUpdate.sellingPrice = parseFloat(sellingPrice);
    }

    if (categoryId) {
      dataToUpdate.categoryId = categoryId;
    }

    if (brandId !== undefined) {
      dataToUpdate.brandId = brandId || null;
    }

    if (description !== undefined) {
      dataToUpdate.description = description;
    }

    if (isFeatured !== undefined) {
      dataToUpdate.isFeatured = !!isFeatured;
    }

    if (isActive !== undefined) {
      dataToUpdate.isActive = !!isActive;
    }

    if (mrp && sellingPrice) {
      dataToUpdate.discountPercent = Math.max(
        0,
        Math.round(((mrp - sellingPrice) / mrp) * 100)
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: {
          id: productId,
        },
        data: dataToUpdate,
      });

      if (imageUrl) {
        await tx.productImage.deleteMany({
          where: {
            productId,
          },
        });

        await tx.productImage.create({
          data: {
            productId,
            url: imageUrl,
            isPrimary: true,
          },
        });
      }

      if (stock !== undefined) {
        const parsedStock = parseInt(stock);

        const stockStatus =
          parsedStock === 0
            ? 'OUT_OF_STOCK'
            : parsedStock <= 5
              ? 'LOW_STOCK'
              : 'IN_STOCK';

        await tx.inventory.upsert({
          where: {
            productId,
          },
          update: {
            currentStock: parsedStock,
            status: stockStatus,
          },
          create: {
            productId,
            currentStock: parsedStock,
            status: stockStatus,
            lowStockThreshold: 5,
          },
        });
      }

      return await tx.product.findUnique({
        where: {
          id: productId,
        },
        include: {
          category: true,
          inventory: true,
          images: true,
        },
      });
    });

    return res.json({
      success: true,
      message: 'Product updated successfully',
      data: updated,
    });
  } catch (error) {
    console.error('Update product error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to update product',
    });
  }
}

// ============================================================
// DELIVERY AREA MANAGEMENT
// ============================================================

// GET /api/admin/delivery-areas
async function getAdminDeliveryAreas(req, res) {
  try {
    const areas = await prisma.deliveryArea.findMany({
      orderBy: {
        pincode: 'asc',
      },
    });

    return res.json({
      success: true,
      data: areas,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch delivery areas',
    });
  }
}

// POST /api/admin/delivery-areas
async function addDeliveryArea(req, res) {
  try {
    const {
      pincode,
      area,
      city,
      state,
      deliveryCharge = 30,
      minimumOrderAmount = 100,
      estimatedDeliveryTime = 'Same Day Delivery',
    } = req.body;

    if (
      !pincode ||
      !/^\d{6}$/.test(pincode) ||
      !area ||
      !city ||
      !state
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Valid 6-digit PIN code, area, city, and state are required',
      });
    }

    const existing = await prisma.deliveryArea.findUnique({
      where: {
        pincode,
      },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `PIN code ${pincode} already exists in delivery network`,
      });
    }

    const newArea = await prisma.deliveryArea.create({
      data: {
        pincode,
        area,
        city,
        state,
        deliveryCharge: parseFloat(deliveryCharge),
        minimumOrderAmount: parseFloat(minimumOrderAmount),
        estimatedDeliveryTime,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Delivery PIN code area added successfully',
      data: newArea,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to add delivery area',
    });
  }
}

// ============================================================
// ORDER MANAGEMENT
// ============================================================

// PUT /api/admin/orders/:id/status
async function updateOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const { orderStatus } = req.body;

    const validStatuses = [
      'PENDING',
      'CONFIRMED',
      'PACKING',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'CANCELLED',
      'REFUNDED',
    ];

    if (!validStatuses.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order status',
      });
    }

    const targetOrder = await prisma.order.findUnique({
      where: {
        id,
      },
    });

    if (!targetOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    const updateData = {
      orderStatus,
    };

    if (orderStatus === 'DELIVERED') {
      updateData.paymentStatus = 'COMPLETED';
    }

    const updated = await prisma.order.update({
      where: {
        id,
      },
      data: updateData,
    });

    return res.json({
      success: true,
      message: `Order #${updated.orderNumber} status updated to ${orderStatus}`,
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update order status',
    });
  }
}

// GET /api/admin/orders
async function getAdminOrders(req, res) {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },

        address: true,

        invoice: {
          select: {
            invoiceNumber: true,
            qrToken: true,
          },
        },

        items: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch admin orders',
    });
  }
}

// ============================================================
// INVOICE MANAGEMENT
// ============================================================

// GET /api/admin/invoices
async function getAdminInvoices(req, res) {
  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        order: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },

            address: true,
            items: true,
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.json({
      success: true,
      data: invoices,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch admin invoices',
    });
  }
}

// ============================================================
// COUPON MANAGEMENT
// ============================================================

// GET /api/admin/coupons
async function getAdminCoupons(req, res) {
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.json({
      success: true,
      data: coupons,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch admin coupons',
    });
  }
}

// POST /api/admin/coupons
async function createCoupon(req, res) {
  try {
    const {
      code,
      description,
      discountType,
      discountAmount,
      minOrderAmount,
      maxDiscount,
      expiresAt,
    } = req.body;

    if (!code || !discountAmount) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code and discount amount are required',
      });
    }

    const couponCode = code.toUpperCase().trim();

    const existing = await prisma.coupon.findUnique({
      where: {
        code: couponCode,
      },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Coupon ${couponCode} already exists`,
      });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: couponCode,
        description: description || null,
        discountType: discountType || 'PERCENTAGE',
        discountAmount: parseFloat(discountAmount),
        minOrderAmount: parseFloat(minOrderAmount || 0),
        maxDiscount: maxDiscount
          ? parseFloat(maxDiscount)
          : null,
        expiresAt: expiresAt
          ? new Date(expiresAt)
          : null,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Coupon created successfully',
      data: coupon,
    });
  } catch (error) {
    console.error('Create coupon error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to create coupon',
    });
  }
}

// PUT /api/admin/coupons/:id/toggle
async function toggleCoupon(req, res) {
  try {
    const { id } = req.params;

    const coupon = await prisma.coupon.findUnique({
      where: {
        id,
      },
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found',
      });
    }

    const updated = await prisma.coupon.update({
      where: {
        id,
      },
      data: {
        isActive: !coupon.isActive,
      },
    });

    return res.json({
      success: true,
      message: `Coupon status changed to ${
        updated.isActive ? 'Active' : 'Inactive'
      }`,
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update coupon status',
    });
  }
}

// ============================================================
// CUSTOMER MANAGEMENT
// ============================================================

// GET /api/admin/customers
async function getAdminCustomers(req, res) {
  try {
    const customers = await prisma.user.findMany({
      where: {
        role: 'CUSTOMER',
      },

      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,

        _count: {
          select: {
            orders: true,
            addresses: true,
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.json({
      success: true,
      data: customers,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch customer list',
    });
  }
}

// ============================================================
// CATEGORY MANAGEMENT
// ============================================================

// GET /api/admin/categories
async function getAdminCategories(req, res) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    return res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Get admin categories error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
    });
  }
}

// POST /api/admin/categories
async function createCategory(req, res) {
  try {
    const {
      name,
      slug,
      imageUrl,
    } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required',
      });
    }

    const cleanName = String(name).trim();

    const generatedSlug = slug
      ? String(slug)
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '')
      : cleanName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '');

    if (!generatedSlug) {
      return res.status(400).json({
        success: false,
        message: 'A valid category slug could not be generated',
      });
    }

    const existingName = await prisma.category.findFirst({
      where: {
        name: cleanName,
      },
    });

    if (existingName) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists',
      });
    }

    const existingSlug = await prisma.category.findUnique({
      where: {
        slug: generatedSlug,
      },
    });

    if (existingSlug) {
      return res.status(400).json({
        success: false,
        message: 'Category with this slug already exists',
      });
    }

    const category = await prisma.category.create({
      data: {
        name: cleanName,
        slug: generatedSlug,

        // Category image is optional.
        // Base64/data URL is stored in the LongText field.
        imageUrl: imageUrl || null,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category,
    });
  } catch (error) {
    console.error('Create category error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to create category',
    });
  }
}

// PUT /api/admin/categories/:id
async function updateCategory(req, res) {
  try {
    const { id } = req.params;

    const {
      name,
      slug,
      imageUrl,
    } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required',
      });
    }

    const cleanName = String(name).trim();

    const generatedSlug = slug
      ? String(slug)
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '')
      : cleanName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '');

    if (!generatedSlug) {
      return res.status(400).json({
        success: false,
        message: 'A valid category slug could not be generated',
      });
    }

    const existingCategory = await prisma.category.findUnique({
      where: {
        id,
      },
    });

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    const duplicateName = await prisma.category.findFirst({
      where: {
        name: cleanName,
        NOT: {
          id,
        },
      },
    });

    if (duplicateName) {
      return res.status(400).json({
        success: false,
        message: 'Another category with this name already exists',
      });
    }

    const duplicateSlug = await prisma.category.findFirst({
      where: {
        slug: generatedSlug,
        NOT: {
          id,
        },
      },
    });

    if (duplicateSlug) {
      return res.status(400).json({
        success: false,
        message: 'Another category with this slug already exists',
      });
    }

    const dataToUpdate = {
      name: cleanName,
      slug: generatedSlug,
    };

    /*
     * IMPORTANT:
     * During edit, imageUrl is only changed when the frontend
     * actually sends imageUrl.
     *
     * imageUrl: "data:image/..." -> replace image
     * imageUrl: ""              -> remove image
     * imageUrl: null            -> remove image
     * imageUrl not provided     -> keep existing image
     */
    if (
      Object.prototype.hasOwnProperty.call(
        req.body,
        'imageUrl'
      )
    ) {
      dataToUpdate.imageUrl = imageUrl || null;
    }

    const updatedCategory = await prisma.category.update({
      where: {
        id,
      },
      data: dataToUpdate,
    });

    return res.json({
      success: true,
      message: 'Category updated successfully',
      data: updatedCategory,
    });
  } catch (error) {
    console.error('Update category error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to update category',
    });
  }
}

// DELETE /api/admin/categories/:id
async function deleteCategory(req, res) {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({
      where: {
        id,
      },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    // Do not allow deleting a category that is already
    // being used by products.
    const productCount = await prisma.product.count({
      where: {
        categoryId: id,
      },
    });

    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete this category because ${productCount} product(s) are using it. Please move or remove those products first.`,
      });
    }

    await prisma.category.delete({
      where: {
        id,
      },
    });

    return res.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    console.error('Delete category error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to delete category',
    });
  }
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  // Dashboard
  getAdminMetrics,

  // Products
  createProduct,
  updateProduct,

  // Delivery Areas
  getAdminDeliveryAreas,
  addDeliveryArea,

  // Orders
  updateOrderStatus,
  getAdminOrders,

  // Invoices
  getAdminInvoices,

  // Coupons
  getAdminCoupons,
  createCoupon,
  toggleCoupon,

  // Customers
  getAdminCustomers,

  // Categories
  getAdminCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};