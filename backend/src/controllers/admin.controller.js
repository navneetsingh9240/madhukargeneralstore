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



    const parsedMrp = parseFloat(mrp);

    const parsedSellingPrice = parseFloat(sellingPrice);

    const parsedStock = parseInt(stock, 10);



    if (

      !Number.isFinite(parsedMrp) ||

      !Number.isFinite(parsedSellingPrice) ||

      parsedMrp <= 0 ||

      parsedSellingPrice < 0

    ) {

      return res.status(400).json({

        success: false,

        message: 'MRP and selling price must be valid numbers',

      });

    }



    if (!Number.isFinite(parsedStock) || parsedStock < 0) {

      return res.status(400).json({

        success: false,

        message: 'Stock must be a valid non-negative number',

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

      Math.round(

        ((parsedMrp - parsedSellingPrice) / parsedMrp) * 100

      )

    );



    const stockStatus =

      parsedStock === 0

        ? 'OUT_OF_STOCK'

        : parsedStock <= 5

          ? 'LOW_STOCK'

          : 'IN_STOCK';



    // ----------------------------------------------------------

    // Product + Inventory transaction

    //

    // Keep the transaction short.

    // Complete product is fetched AFTER transaction commit.

    // ----------------------------------------------------------



    const product = await prisma.$transaction(

      async (tx) => {

        const newProduct = await tx.product.create({

          data: {

            name,

            slug,

            sku,

            unit,

            mrp: parsedMrp,

            sellingPrice: parsedSellingPrice,

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



        await tx.inventory.create({

          data: {

            productId: newProduct.id,

            currentStock: parsedStock,

            lowStockThreshold: 5,

            status: stockStatus,

          },

        });



        // Only return the created product.

        // Do NOT run findUnique inside the transaction.

        return newProduct;

      },

      {

        maxWait: 10000,

        timeout: 60000,

      }

    );



    // ----------------------------------------------------------

    // Fetch complete product AFTER transaction is committed.

    // ----------------------------------------------------------



    const completeProduct = await prisma.product.findUnique({

      where: {

        id: product.id,

      },

      include: {

        category: true,

        inventory: true,

        images: true,

      },

    });



    return res.status(201).json({

      success: true,

      message: 'Product created successfully',

      data: completeProduct,

    });

  } catch (error) {

    console.error('Create product error:', error);



    return res.status(500).json({

      success: false,

      message: 'Failed to create product',

    });

  }

}



// ============================================================

// UPDATE PRODUCT

// ============================================================



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



    // ----------------------------------------------------------

    // Find existing product BEFORE transaction.

    // ----------------------------------------------------------



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



    // ----------------------------------------------------------

    // PRODUCT NAME

    // ----------------------------------------------------------



    if (name !== undefined) {

      dataToUpdate.name = name;

    }



    // ----------------------------------------------------------

    // UNIT

    // ----------------------------------------------------------



    if (unit !== undefined) {

      dataToUpdate.unit = unit;

    }



    // ----------------------------------------------------------

    // MRP

    // ----------------------------------------------------------



    if (mrp !== undefined && mrp !== '') {

      const parsedMrp = parseFloat(mrp);



      if (

        Number.isFinite(parsedMrp) &&

        parsedMrp > 0

      ) {

        dataToUpdate.mrp = parsedMrp;

      }

    }



    // ----------------------------------------------------------

    // SELLING PRICE

    // ----------------------------------------------------------



    if (

      sellingPrice !== undefined &&

      sellingPrice !== ''

    ) {

      const parsedSellingPrice =

        parseFloat(sellingPrice);



      if (

        Number.isFinite(parsedSellingPrice) &&

        parsedSellingPrice >= 0

      ) {

        dataToUpdate.sellingPrice =

          parsedSellingPrice;

      }

    }



    // ----------------------------------------------------------

    // CATEGORY

    // ----------------------------------------------------------



    if (categoryId !== undefined) {

      dataToUpdate.categoryId =

        categoryId || null;

    }



    // ----------------------------------------------------------

    // BRAND

    // ----------------------------------------------------------



    if (brandId !== undefined) {

      dataToUpdate.brandId =

        brandId || null;

    }



    // ----------------------------------------------------------

    // DESCRIPTION

    // ----------------------------------------------------------



    if (description !== undefined) {

      dataToUpdate.description =

        description || null;

    }



    // ----------------------------------------------------------

    // FEATURED

    // ----------------------------------------------------------



    if (isFeatured !== undefined) {

      dataToUpdate.isFeatured =

        !!isFeatured;

    }



    // ----------------------------------------------------------

    // ACTIVE

    // ----------------------------------------------------------



    if (isActive !== undefined) {

      dataToUpdate.isActive =

        !!isActive;

    }



    // ----------------------------------------------------------

    // FINAL MRP

    // ----------------------------------------------------------



    const finalMrp =

      mrp !== undefined && mrp !== ''

        ? parseFloat(mrp)

        : Number(existingProduct.mrp);



    // ----------------------------------------------------------

    // FINAL SELLING PRICE

    // ----------------------------------------------------------



    const finalSellingPrice =

      sellingPrice !== undefined &&

      sellingPrice !== ''

        ? parseFloat(sellingPrice)

        : Number(

            existingProduct.sellingPrice

          );



    // ----------------------------------------------------------

    // DISCOUNT PERCENTAGE

    // ----------------------------------------------------------



    if (

      Number.isFinite(finalMrp) &&

      Number.isFinite(finalSellingPrice) &&

      finalMrp > 0

    ) {

      dataToUpdate.discountPercent =

        Math.max(

          0,

          Math.round(

            (

              (finalMrp -

                finalSellingPrice) /

              finalMrp

            ) * 100

          )

        );

    }



    // ----------------------------------------------------------

    // PRODUCT + IMAGE + INVENTORY TRANSACTION

    //

    // IMPORTANT:

    //

    // Old code:

    //

    // transaction

    //   -> product update

    //   -> image update

    //   -> inventory update

    //   -> product.findUnique()

    //

    // The final findUnique() inside the transaction could make

    // Render -> Aiven exceed Prisma's default 5 second timeout.

    //

    // New code:

    //

    // transaction

    //   -> product update

    //   -> image update

    //   -> inventory update

    // COMMIT

    //

    // Then:

    // product.findUnique()

    //

    // This keeps the transaction short.

    // ----------------------------------------------------------



    await prisma.$transaction(

      async (tx) => {

        // ------------------------------------------------------

        // 1. UPDATE PRODUCT

        // ------------------------------------------------------



        await tx.product.update({

          where: {

            id: productId,

          },

          data: dataToUpdate,

        });



        // ------------------------------------------------------

        // 2. UPDATE PRODUCT IMAGE

        //

        // Only update image when frontend actually sends

        // a new non-empty image URL.

        // ------------------------------------------------------



        if (

          imageUrl !== undefined &&

          imageUrl !== null &&

          imageUrl !== ''

        ) {

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



        // ------------------------------------------------------

        // 3. UPDATE INVENTORY

        // ------------------------------------------------------



        if (stock !== undefined) {

          const parsedStock =

            parseInt(stock, 10);



          if (

            Number.isFinite(parsedStock) &&

            parsedStock >= 0

          ) {

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

                currentStock:

                  parsedStock,

                status:

                  stockStatus,

              },

              create: {

                productId,

                currentStock:

                  parsedStock,

                status:

                  stockStatus,

                lowStockThreshold:

                  5,

              },

            });

          }

        }

      },



      // --------------------------------------------------------

      // INCREASED PRISMA TRANSACTION LIMITS

      // --------------------------------------------------------



      {

        maxWait: 10000,

        timeout: 60000,

      }

    );



    // ----------------------------------------------------------

    // FETCH COMPLETE UPDATED PRODUCT

    //

    // This query is deliberately OUTSIDE the transaction.

    // ----------------------------------------------------------



    const updated =

      await prisma.product.findUnique({

        where: {

          id: productId,

        },

        include: {

          category: true,

          inventory: true,

          images: true,

        },

      });



    return res.json({

      success: true,

      message:

        'Product updated successfully',

      data: updated,

    });

  } catch (error) {

    // ----------------------------------------------------------

    // DETAILED ERROR LOG

    // ----------------------------------------------------------



    console.error(

      '======================================'

    );



    console.error(

      'UPDATE PRODUCT ERROR'

    );



    console.error(

      '======================================'

    );



    console.error(

      'Error name:',

      error?.name

    );



    console.error(

      'Error code:',

      error?.code

    );



    console.error(

      'Error message:',

      error?.message

    );



    console.error(

      'Error meta:',

      error?.meta

    );



    console.error(

      'Full error:',

      error

    );



    console.error(

      '======================================'

    );



    return res.status(500).json({

      success: false,

      message:

        'Failed to update product',

    });

  }

}



// ============================================================

// DELIVERY AREA MANAGEMENT

// ============================================================



// GET /api/admin/delivery-areas

async function getAdminDeliveryAreas(req, res) {

  try {

    const areas =

      await prisma.deliveryArea.findMany({

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

      message:

        'Failed to fetch delivery areas',

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

      estimatedDeliveryTime =

        'Same Day Delivery',

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



    const existing =

      await prisma.deliveryArea.findUnique({

        where: {

          pincode,

        },

      });



    if (existing) {

      return res.status(400).json({

        success: false,

        message:

          `PIN code ${pincode} already exists in delivery network`,

      });

    }



    const newArea =

      await prisma.deliveryArea.create({

        data: {

          pincode,

          area,

          city,

          state,

          deliveryCharge:

            parseFloat(deliveryCharge),

          minimumOrderAmount:

            parseFloat(

              minimumOrderAmount

            ),

          estimatedDeliveryTime,

        },

      });



    return res.status(201).json({

      success: true,

      message:

        'Delivery PIN code area added successfully',

      data: newArea,

    });

  } catch (error) {

    return res.status(500).json({

      success: false,

      message:

        'Failed to add delivery area',

    });

  }

}



// ============================================================

// UPDATE DELIVERY AREA
// ============================================================

async function updateDeliveryArea(req, res) {

  try {

    const { id } = req.params;



    const {

      pincode,

      area,

      city,

      state,

      deliveryCharge = 30,

      minimumOrderAmount = 100,

      estimatedDeliveryTime = 'Same Day Delivery',

      isActive,

    } = req.body;



    if (!pincode || !/^\d{6}$/.test(String(pincode))) {

      return res.status(400).json({

        success: false,

        message: 'Valid 6-digit PIN code is required',

      });

    }



    if (!area || !city || !state) {

      return res.status(400).json({

        success: false,

        message: 'Area, city, and state are required',

      });

    }



    const existingArea =

      await prisma.deliveryArea.findUnique({

        where: { id },

      });



    if (!existingArea) {

      return res.status(404).json({

        success: false,

        message: 'Delivery PIN code area not found',

      });

    }



    const duplicatePin =

      await prisma.deliveryArea.findFirst({

        where: {

          pincode: String(pincode),

          NOT: { id },

        },

      });



    if (duplicatePin) {

      return res.status(400).json({

        success: false,

        message:

          `PIN code ${pincode} is already assigned to another delivery area`,

      });

    }



    const updatedArea =

      await prisma.deliveryArea.update({

        where: { id },

        data: {

          pincode: String(pincode),

          area: String(area).trim(),

          city: String(city).trim(),

          state: String(state).trim(),

          deliveryCharge:

            parseFloat(deliveryCharge) || 0,

          minimumOrderAmount:

            parseFloat(minimumOrderAmount) || 0,

          estimatedDeliveryTime:

            String(

              estimatedDeliveryTime

            ).trim(),

          isActive:

            isActive !== undefined

              ? Boolean(isActive)

              : existingArea.isActive,

        },

      });



    return res.json({

      success: true,

      message:

        'Delivery PIN code updated successfully',

      data: updatedArea,

    });

  } catch (error) {

    console.error(

      'Update delivery area error:',

      error

    );



    return res.status(500).json({

      success: false,

      message:

        'Failed to update delivery area',

    });

  }

}



// ============================================================

// DELETE DELIVERY AREA
// ============================================================

async function deleteDeliveryArea(req, res) {

  try {

    const { id } = req.params;



    const existingArea =

      await prisma.deliveryArea.findUnique({

        where: { id },

      });



    if (!existingArea) {

      return res.status(404).json({

        success: false,

        message:

          'Delivery PIN code area not found',

      });

    }



    await prisma.deliveryArea.delete({

      where: { id },

    });



    return res.json({

      success: true,

      message:

        `PIN code ${existingArea.pincode} deleted successfully`,

    });

  } catch (error) {

    console.error(

      'Delete delivery area error:',

      error

    );



    if (error?.code === 'P2003') {

      return res.status(400).json({

        success: false,

        message:

          'This delivery PIN code cannot be deleted because it is being used by existing records. Please deactivate it instead.',

      });

    }



    return res.status(500).json({

      success: false,

      message:

        'Failed to delete delivery area',

    });

  }

}



// POST /api/admin/coupons

async function createCoupon(req, res) {

  try {

    const {

      couponCode,

      description,

      discountType = 'PERCENTAGE',

      discountAmount,

      minOrderAmount = 0,

      maxDiscount,

      expiresAt,

      isActive = true,

    } = req.body;



    if (!couponCode || !String(couponCode).trim()) {

      return res.status(400).json({

        success: false,

        message: 'Coupon code is required',

      });

    }



    const normalizedCode = String(couponCode).trim().toUpperCase();



    if (!discountAmount || Number(discountAmount) <= 0) {

      return res.status(400).json({

        success: false,

        message: 'Discount amount is required and must be greater than 0',

      });

    }



    const existing =
      await prisma.coupon.findUnique({

        where: {

          code: normalizedCode,

        },

      });



    if (existing) {

      return res.status(400).json({

        success: false,

        message: `Coupon ${normalizedCode} already exists`,

      });

    }



    const coupon =
      await prisma.coupon.create({

        data: {

          code: normalizedCode,

          description: description || null,

          discountType: discountType || 'PERCENTAGE',

          discountAmount: parseFloat(discountAmount),

          minOrderAmount: parseFloat(minOrderAmount || 0),

          maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,

          expiresAt: expiresAt ? new Date(expiresAt) : null,

          isActive: isActive !== undefined ? Boolean(isActive) : true,

        },

      });



    return res.status(201).json({

      success: true,

      message: 'Coupon created successfully',

      data: coupon,

    });

  } catch (error) {

    console.error(
      'Create coupon error:',
      error
    );



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



    const coupon =
      await prisma.coupon.findUnique({

        where: {

          id,

        },

      });



    if (!coupon) {

      return res.status(404).json({

        success: false,

        message:
          'Coupon not found',

      });

    }



    const updated =
      await prisma.coupon.update({

        where: {

          id,

        },

        data: {

          isActive:
            !coupon.isActive,

        },

      });



    return res.json({

      success: true,

      message:
        `Coupon status changed to ${
          updated.isActive
            ? 'Active'
            : 'Inactive'
        }`,

      data: updated,

    });

  } catch (error) {

    return res.status(500).json({

      success: false,

      message:
        'Failed to update coupon status',

    });

  }

}



// ============================================================

// CUSTOMER MANAGEMENT

// ============================================================



// GET /api/admin/customers

async function getAdminCustomers(req, res) {

  try {

    const customers =
      await prisma.user.findMany({

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

      message:
        'Failed to fetch customer list',

    });

  }

}



// ============================================================

// CATEGORY MANAGEMENT

// ============================================================



// GET /api/admin/categories

async function getAdminCategories(req, res) {

  try {

    const categories =
      await prisma.category.findMany({

        orderBy: {

          name: 'asc',

        },

      });



    return res.json({

      success: true,

      data: categories,

    });

  } catch (error) {

    console.error(

      'Get admin categories error:',

      error

    );



    return res.status(500).json({

      success: false,

      message:
        'Failed to fetch categories',

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



    if (

      !name ||

      !String(name).trim()

    ) {

      return res.status(400).json({

        success: false,

        message:
          'Category name is required',

      });

    }



    const cleanName =
      String(name).trim();



    const generatedSlug =
      slug

        ? String(slug)

            .trim()

            .toLowerCase()

            .replace(

              /[^a-z0-9]+/g,

              '-'

            )

            .replace(

              /(^-|-$)+/g,

              ''

            )

        : cleanName

            .toLowerCase()

            .replace(

              /[^a-z0-9]+/g,

              '-'

            )

            .replace(

              /(^-|-$)+/g,

              '');



    if (!generatedSlug) {

      return res.status(400).json({

        success: false,

        message:
          'A valid category slug could not be generated',

      });

    }



    const existingName =
      await prisma.category.findFirst({

        where: {

          name: cleanName,

        },

      });



    if (existingName) {

      return res.status(400).json({

        success: false,

        message:
          'Category with this name already exists',

      });

    }



    const existingSlug =
      await prisma.category.findUnique({

        where: {

          slug: generatedSlug,

        },

      });



    if (existingSlug) {

      return res.status(400).json({

        success: false,

        message:
          'Category with this slug already exists',

      });

    }



    const category =
      await prisma.category.create({

        data: {

          name: cleanName,

          slug: generatedSlug,



          // Category image is optional.

          // Base64/data URL is stored in the LongText field.

          imageUrl:
            imageUrl || null,

        },

      });



    return res.status(201).json({

      success: true,

      message:
        'Category created successfully',

      data: category,

    });

  } catch (error) {

    console.error(

      'Create category error:',

      error

    );



    return res.status(500).json({

      success: false,

      message:
        'Failed to create category',

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



    if (

      !name ||

      !String(name).trim()

    ) {

      return res.status(400).json({

        success: false,

        message:
          'Category name is required',

      });

    }



    const cleanName =
      String(name).trim();



    const generatedSlug =
      slug

        ? String(slug)

            .trim()

            .toLowerCase()

            .replace(

              /[^a-z0-9]+/g,

              '-'

            )

            .replace(

              /(^-|-$)+/g,

              '')

        : cleanName

            .toLowerCase()

            .replace(

              /[^a-z0-9]+/g,

              '-'

            )

            .replace(

              /(^-|-$)+/g,

              '');



    if (!generatedSlug) {

      return res.status(400).json({

        success: false,

        message:
          'A valid category slug could not be generated',

      });

    }



    const existingCategory =
      await prisma.category.findUnique({

        where: {

          id,

        },

      });



    if (!existingCategory) {

      return res.status(404).json({

        success: false,

        message:
          'Category not found',

      });

    }



    const duplicateName =
      await prisma.category.findFirst({

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

        message:
          'Another category with this name already exists',

      });

    }



    const duplicateSlug =
      await prisma.category.findFirst({

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

        message:
          'Another category with this slug already exists',

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

      dataToUpdate.imageUrl =

        imageUrl || null;

    }



    const updatedCategory =
      await prisma.category.update({

        where: {

          id,

        },

        data: dataToUpdate,

      });



    return res.json({

      success: true,

      message:
        'Category updated successfully',

      data: updatedCategory,

    });

  } catch (error) {

    console.error(

      'Update category error:',

      error

    );



    return res.status(500).json({

      success: false,

      message:
        'Failed to update category',

    });

  }

}



// DELETE /api/admin/categories/:id

async function deleteCategory(req, res) {

  try {

    const { id } = req.params;



    const category =
      await prisma.category.findUnique({

        where: {

          id,

        },

      });



    if (!category) {

      return res.status(404).json({

        success: false,

        message:
          'Category not found',

      });

    }



    // Do not allow deleting a category that is already
    // being used by products.

    const productCount =
      await prisma.product.count({

        where: {

          categoryId: id,

        },

      });



    if (productCount > 0) {

      return res.status(400).json({

        success: false,

        message:
          `Cannot delete this category because ${productCount} product(s) are using it. Please move or remove those products first.`,

      });

    }



    await prisma.category.delete({

      where: {

        id,

      },

    });



    return res.json({

      success: true,

      message:
        'Category deleted successfully',

    });

  } catch (error) {

    console.error(

      'Delete category error:',

      error

    );



    return res.status(500).json({

      success: false,

      message:
        'Failed to delete category',

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

  updateDeliveryArea,

  deleteDeliveryArea,



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