const prisma = require('../config/db');

// ============================================================
// HELPER
// ============================================================

function toNumber(value, fallback = 0) {
  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
}

// ============================================================
// COUPON VALIDATION
// ============================================================

// POST /api/coupons/validate
async function validateCoupon(req, res) {
  try {
    const { code, subtotal = 0 } = req.body;

    const numericSubtotal = toNumber(subtotal);

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code is required',
      });
    }

    const coupon = await prisma.coupon.findUnique({
      where: {
        code: code.toUpperCase(),
      },
    });

    if (!coupon || !coupon.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or inactive coupon code',
      });
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code has expired',
      });
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({
        success: false,
        message: 'Coupon usage limit reached',
      });
    }

    if (numericSubtotal < toNumber(coupon.minOrderAmount)) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount of ₹${coupon.minOrderAmount} required for this coupon`,
      });
    }

    let discount = 0;

    if (coupon.discountType === 'PERCENTAGE') {
      discount =
        (numericSubtotal * toNumber(coupon.discountAmount)) / 100;

      if (
        coupon.maxDiscount &&
        discount > toNumber(coupon.maxDiscount)
      ) {
        discount = toNumber(coupon.maxDiscount);
      }
    } else {
      discount = toNumber(coupon.discountAmount);
    }

    discount = Math.min(discount, numericSubtotal);

    return res.json({
      success: true,
      message: 'Coupon applied successfully',
      data: {
        couponId: coupon.id,
        code: coupon.code,
        discountAmount: Math.round(discount * 100) / 100,
        description: coupon.description,
      },
    });
  } catch (error) {
    console.error('Validate coupon error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to validate coupon',
    });
  }
}

// ============================================================
// CREATE ORDER
// ============================================================

// POST /api/orders
async function createOrder(req, res) {
  try {
    const userId = req.user.id;

    const {
      items,
      addressId,
      couponCode,
      paymentMethod = 'COD',
      deliveryNotes,
    } = req.body;

    // --------------------------------------------------------
    // Validate Cart
    // --------------------------------------------------------

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart items are required to place an order',
      });
    }

    // --------------------------------------------------------
    // Validate Address
    // --------------------------------------------------------

    if (!addressId) {
      return res.status(400).json({
        success: false,
        message: 'Delivery address is required',
      });
    }

    // --------------------------------------------------------
    // 1. Fetch Address & Validate PIN
    // --------------------------------------------------------

    const address = await prisma.address.findFirst({
      where: {
        id: addressId,
        userId,
      },
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Delivery address not found',
      });
    }

    const pincode = address.pincode;

    if (!/^\d{6}$/.test(pincode)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid 6-digit delivery PIN code',
      });
    }

    // --------------------------------------------------------
    // Find Delivery Area
    // --------------------------------------------------------
    // IMPORTANT:
    // Customer-entered PIN codes are NEVER auto-created.
    // Only PIN codes added by Admin are allowed for delivery.
    // --------------------------------------------------------

    const deliveryArea = await prisma.deliveryArea.findUnique({
      where: {
        pincode,
      },
    });

    // --------------------------------------------------------
    // PIN code is not configured by Admin
    // --------------------------------------------------------

    if (!deliveryArea) {
      return res.status(400).json({
        success: false,
        message: `Pincode ${pincode} is not available for delivery. Please enter a serviceable delivery address.`,
      });
    }

    // --------------------------------------------------------
    // PIN code exists but Admin has disabled delivery
    // --------------------------------------------------------

    if (!deliveryArea.isActive) {
      return res.status(400).json({
        success: false,
        message: `Delivery is currently paused for PIN code ${pincode}. Please enter a serviceable delivery address.`,
      });
    }

    // --------------------------------------------------------
    // Fetch Store Settings
    // --------------------------------------------------------

    const storeSettings =
      (await prisma.storeSettings.findFirst()) || {
        enableGst: true,
        gstPercentage: 0.0,
        invoicePrefix: 'MGS-INV',
        invoiceYear: '2026',
        freeDeliveryThreshold: 499,
      };

    // --------------------------------------------------------
    // 2. Re-validate Prices & Stocks Server-Side
    // --------------------------------------------------------

    let subtotal = 0;
    let productDiscount = 0;

    const orderItemsData = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: {
          id: item.productId,
        },
        include: {
          inventory: true,
        },
      });

      // ------------------------------------------------------
      // Product validation
      // ------------------------------------------------------

      if (!product || !product.isActive) {
        return res.status(400).json({
          success: false,
          message: `Product "${
            item.productName || 'Selected product'
          }" is no longer available.`,
        });
      }

      // ------------------------------------------------------
      // Stock validation
      // ------------------------------------------------------

      const availableStock = product.inventory
        ? toNumber(product.inventory.currentStock)
        : 0;

      const itemQuantity = toNumber(item.quantity);

      if (availableStock < itemQuantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product "${product.name}". Available stock: ${availableStock}`,
        });
      }

      // ------------------------------------------------------
      // Convert Prisma Decimal values before arithmetic
      // ------------------------------------------------------

      const itemMRP = toNumber(product.mrp);
      const itemPrice = toNumber(product.sellingPrice);

      const itemSubtotal = itemPrice * itemQuantity;

      const itemDiscount =
        (itemMRP - itemPrice) * itemQuantity;

      // ------------------------------------------------------
      // Add to order totals
      // ------------------------------------------------------

      subtotal += itemSubtotal;
      productDiscount += itemDiscount;

      // ------------------------------------------------------
      // Store order item
      // ------------------------------------------------------

      orderItemsData.push({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        unit: product.unit,

        mrp: itemMRP,
        sellingPrice: itemPrice,

        quantity: itemQuantity,
        subtotal: itemSubtotal,
      });
    }

    // --------------------------------------------------------
    // Minimum Order Validation
    // --------------------------------------------------------

    const minimumOrderAmount =
      toNumber(deliveryArea.minimumOrderAmount);

    if (subtotal < minimumOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount for area (${deliveryArea.area}) is ₹${deliveryArea.minimumOrderAmount}. Current total: ₹${subtotal}`,
      });
    }

    // --------------------------------------------------------
    // 3. Coupon Discount Calculation Server-Side
    // --------------------------------------------------------

    let couponDiscount = 0;
    let couponRecord = null;

    if (couponCode) {
      couponRecord = await prisma.coupon.findUnique({
        where: {
          code: couponCode.toUpperCase(),
        },
      });

      if (
        couponRecord &&
        couponRecord.isActive &&
        (!couponRecord.expiresAt ||
          new Date(couponRecord.expiresAt) >= new Date()) &&
        (!couponRecord.usageLimit ||
          couponRecord.usedCount < couponRecord.usageLimit) &&
        subtotal >= toNumber(couponRecord.minOrderAmount)
      ) {
        if (couponRecord.discountType === 'PERCENTAGE') {
          couponDiscount =
            (subtotal *
              toNumber(couponRecord.discountAmount)) /
            100;

          if (
            couponRecord.maxDiscount &&
            couponDiscount >
              toNumber(couponRecord.maxDiscount)
          ) {
            couponDiscount =
              toNumber(couponRecord.maxDiscount);
          }
        } else {
          couponDiscount =
            toNumber(couponRecord.discountAmount);
        }

        couponDiscount = Math.min(
          couponDiscount,
          subtotal
        );
      }
    }

    // --------------------------------------------------------
    // 4. Delivery Charge Calculation
    // --------------------------------------------------------

    let deliveryCharge =
      toNumber(deliveryArea.deliveryCharge);

    const freeDeliveryThreshold =
      toNumber(storeSettings.freeDeliveryThreshold);

    if (
      freeDeliveryThreshold > 0 &&
      subtotal >= freeDeliveryThreshold
    ) {
      deliveryCharge = 0;
    }

    // --------------------------------------------------------
    // 5. Tax Calculation
    // --------------------------------------------------------

    const numericSubtotal =
      toNumber(subtotal);

    const numericCouponDiscount =
      toNumber(couponDiscount);

    const numericDeliveryCharge =
      toNumber(deliveryCharge);

    const gstPercentage =
      toNumber(storeSettings.gstPercentage);

    const netAmount =
      numericSubtotal - numericCouponDiscount;

    let taxAmount = 0;

    if (
      storeSettings.enableGst &&
      gstPercentage > 0
    ) {
      taxAmount =
        (netAmount * gstPercentage) / 100;
    }

    // --------------------------------------------------------
    // Final Total
    // --------------------------------------------------------

    const totalAmount =
      Math.round(
        (
          netAmount +
          numericDeliveryCharge +
          taxAmount
        ) * 100
      ) / 100;

    // --------------------------------------------------------
    // Debug Information
    // --------------------------------------------------------

    console.log('\n========================================');
    console.log('           ORDER CALCULATION');
    console.log('========================================');

    console.log(
      'Subtotal:',
      numericSubtotal,
      typeof numericSubtotal
    );

    console.log(
      'Product Discount:',
      toNumber(productDiscount),
      typeof toNumber(productDiscount)
    );

    console.log(
      'Coupon Discount:',
      numericCouponDiscount,
      typeof numericCouponDiscount
    );

    console.log(
      'Delivery Charge:',
      numericDeliveryCharge,
      typeof numericDeliveryCharge
    );

    console.log(
      'Net Amount:',
      netAmount,
      typeof netAmount
    );

    console.log(
      'GST:',
      taxAmount,
      typeof taxAmount
    );

    console.log(
      'TOTAL:',
      totalAmount,
      typeof totalAmount
    );

    console.log('========================================\n');

    // --------------------------------------------------------
    // 6. Execute Order Creation in Database Transaction
    //
    // IMPORTANT:
    // Render -> Aiven can take longer than a local MySQL
    // transaction. Increase Prisma interactive transaction
    // timeout to prevent P2028.
    // --------------------------------------------------------

    const orderCount =
      await prisma.order.count();

    const orderNumber =
      `MGS${10001 + orderCount}`;

    const order = await prisma.$transaction(
      async (tx) => {
        // ----------------------------------------------------
        // ATOMIC INVENTORY CHECK + DEDUCTION
        // ----------------------------------------------------

        for (const item of orderItemsData) {
          const quantity = toNumber(item.quantity);

          if (
            !Number.isInteger(quantity) ||
            quantity <= 0
          ) {
            throw new Error(
              `INVALID_QUANTITY|${item.productName}`
            );
          }

          // Atomic stock check + deduction
          const inventoryUpdate =
            await tx.inventory.updateMany({
              where: {
                productId: item.productId,
                currentStock: {
                  gte: quantity,
                },
              },

              data: {
                currentStock: {
                  decrement: quantity,
                },
              },
            });

          // No row updated = insufficient stock
          if (inventoryUpdate.count === 0) {
            const currentInventory =
              await tx.inventory.findUnique({
                where: {
                  productId: item.productId,
                },
              });

            const availableStock =
              currentInventory
                ? toNumber(
                    currentInventory.currentStock
                  )
                : 0;

            throw new Error(
              `INSUFFICIENT_STOCK|${item.productName}|${availableStock}`
            );
          }

          // Read remaining stock
          const updatedInventory =
            await tx.inventory.findUnique({
              where: {
                productId: item.productId,
              },
            });

          const remainingStock =
            updatedInventory
              ? toNumber(
                  updatedInventory.currentStock
                )
              : 0;

          const lowStockThreshold =
            updatedInventory
              ? toNumber(
                  updatedInventory.lowStockThreshold
                )
              : 5;

          const newStatus =
            remainingStock === 0
              ? 'OUT_OF_STOCK'
              : remainingStock <= lowStockThreshold
                ? 'LOW_STOCK'
                : 'IN_STOCK';

          await tx.inventory.update({
            where: {
              productId: item.productId,
            },

            data: {
              status: newStatus,
            },
          });
        }

        // ----------------------------------------------------
        // Increment Coupon Usage
        // ----------------------------------------------------

        if (couponRecord) {
          await tx.coupon.update({
            where: {
              id: couponRecord.id,
            },

            data: {
              usedCount: {
                increment: 1,
              },
            },
          });
        }

        // ----------------------------------------------------
        // Create Order
        // ----------------------------------------------------

        const newOrder =
          await tx.order.create({
            data: {
              orderNumber,

              userId,

              addressId,

              couponId:
                couponRecord
                  ? couponRecord.id
                  : null,

              subtotal:
                numericSubtotal,

              productDiscount:
                toNumber(productDiscount),

              couponDiscount:
                numericCouponDiscount,

              deliveryCharge:
                numericDeliveryCharge,

              taxAmount:
                toNumber(taxAmount),

              totalAmount:
                toNumber(totalAmount),

              paymentMethod,

              paymentStatus:
                paymentMethod === 'COD' || paymentMethod === 'UPI' || paymentMethod === 'ONLINE'
                  ? 'PENDING'
                  : 'COMPLETED',

              orderStatus:
                paymentMethod === 'UPI' || paymentMethod === 'ONLINE'
                  ? 'PENDING'
                  : 'CONFIRMED',

              deliveryPincode:
                pincode,

              deliveryNotes:
                deliveryNotes || null,

              items: {
                create: orderItemsData,
              },
            },

            include: {
              items: true,
              address: true,
            },
          });

        // ----------------------------------------------------
        // Generate Invoice
        // ----------------------------------------------------

        const invoiceCount =
          await tx.invoice.count();

        const invoiceNumber =
          `${storeSettings.invoicePrefix}-${storeSettings.invoiceYear}-${String(
            invoiceCount + 1
          ).padStart(6, '0')}`;

        const qrToken =
          `mgs_qr_tok_${Date.now()}_${newOrder.id.slice(
            0,
            8
          )}`;

        await tx.invoice.create({
          data: {
            invoiceNumber,

            orderId:
              newOrder.id,

            qrToken,
          },
        });

        // ----------------------------------------------------
        // Create Payment Record
        // ----------------------------------------------------

        await tx.payment.create({
          data: {
            orderId:
              newOrder.id,

            paymentMethod,

            amount:
              toNumber(totalAmount),

            status:
              paymentMethod === 'COD'
                ? 'PENDING'
                : paymentMethod === 'UPI' || paymentMethod === 'ONLINE'
                  ? 'VERIFICATION_PENDING'
                  : 'SUCCESS',

            transactionId:
              paymentMethod === 'ONLINE'
                ? `PAY_${Date.now()}_${Math.floor(
                    Math.random() * 1000
                  )}`
                : null,
          },
        });

        return newOrder;
      },

      // ======================================================
      // IMPORTANT TRANSACTION OPTIONS
      // ======================================================

      {
        maxWait: 10000,
        timeout: 60000,
      }
    );

    // --------------------------------------------------------
    // WhatsApp Notification
    // --------------------------------------------------------

    console.log(
      `\n[WHATSAPP NOTIFICATION SENT] To: ${
        address.mobileNumber ||
        '+91 9876543210'
      }`
    );

    console.log(
      `"Namaste ${address.fullName}! Your order #${
        order.orderNumber
      } from Madhukar General Store is CONFIRMED (Total: ₹${
        order.totalAmount
      }). Direct WhatsApp Support: https://wa.me/919876543210"\n`
    );

    // --------------------------------------------------------
    // Dynamic UPI Payment URI Generation
    // --------------------------------------------------------

    const upiId = process.env.STORE_UPI_ID || '9235070979@ptaxis';
    const storeName = storeSettings?.storeName || 'MADHUKAR GENERAL STORE';
    const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(storeName)}&am=${toNumber(totalAmount).toFixed(2)}&cu=INR&tr=${order.orderNumber}`;

    // --------------------------------------------------------
    // Response
    // --------------------------------------------------------

    return res.status(201).json({
      success: true,

      message:
        'Order placed successfully!',

      data: {
        ...order,
        upiDetails: {
          upiId,
          storeName,
          amount: toNumber(totalAmount),
          upiUri,
          orderNumber: order.orderNumber,
        },
      },
    });
  } catch (error) {
    // --------------------------------------------------------
    // Detailed Error Logging
    // --------------------------------------------------------

    console.error('========================================');
    console.error('CREATE ORDER ERROR');
    console.error('========================================');
    console.error('Error name:', error?.name);
    console.error('Error code:', error?.code);
    console.error('Error message:', error?.message);
    console.error('Error meta:', error?.meta);
    console.error('Full error:', error);
    console.error('========================================');

    // --------------------------------------------------------
    // Insufficient Stock Error
    // --------------------------------------------------------

    if (
      error.message &&
      error.message.startsWith(
        'INSUFFICIENT_STOCK|'
      )
    ) {
      const [
        ,
        productName,
        availableStock,
      ] = error.message.split('|');

      return res.status(400).json({
        success: false,
        message: `Insufficient stock for "${productName}". Only ${availableStock} item(s) available.`,
      });
    }

    // --------------------------------------------------------
    // Invalid Quantity Error
    // --------------------------------------------------------

    if (
      error.message &&
      error.message.startsWith(
        'INVALID_QUANTITY|'
      )
    ) {
      const [
        ,
        productName,
      ] = error.message.split('|');

      return res.status(400).json({
        success: false,
        message: `Invalid quantity for product "${productName}".`,
      });
    }

    return res.status(500).json({
      success: false,
      message:
        'Failed to process and place order',
    });
  }
}

// ============================================================
// GET USER ORDERS
// ============================================================

// GET /api/orders
async function getUserOrders(req, res) {
  try {
    const orders =
      await prisma.order.findMany({
        where: {
          userId: req.user.id,
        },

        include: {
          items: true,

          invoice: {
            select: {
              invoiceNumber: true,
              qrToken: true,
            },
          },

          address: true,
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
    console.error(
      'Get user orders error:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        'Failed to fetch order history',
    });
  }
}

// ============================================================
// GET ORDER DETAILS
// ============================================================

// GET /api/orders/:id
async function getOrderDetails(req, res) {
  try {
    const { id } = req.params;

    const where = {
      id,
    };

    // Customers can only see their own orders
    if (req.user.role === 'CUSTOMER') {
      where.userId = req.user.id;
    }

    const order =
      await prisma.order.findFirst({
        where,

        include: {
          items: true,

          address: true,

          invoice: true,

          payments: true,

          user: {
            select: {
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    return res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error(
      'Get order details error:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        'Failed to fetch order details',
    });
  }
}

// ============================================================
// CANCEL ORDER
// ============================================================

// POST /api/orders/:id/cancel
async function cancelOrder(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // 1. Find the order with items & user check
    const order = await prisma.order.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // 2. Status validation
    const allowedStatuses = ['PENDING', 'CONFIRMED'];
    if (!allowedStatuses.includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled because its current status is ${order.orderStatus}.`,
      });
    }

    // 3. Atomic transaction for cancellation
    const cancelledOrder = await prisma.$transaction(
      async (tx) => {
        // Concurrency check: atomically update status only if still PENDING or CONFIRMED
        const updateResult = await tx.order.updateMany({
          where: {
            id,
            userId,
            orderStatus: {
              in: ['PENDING', 'CONFIRMED'],
            },
          },
          data: {
            orderStatus: 'CANCELLED',
          },
        });

        if (updateResult.count === 0) {
          const freshOrder = await tx.order.findUnique({ where: { id } });
          const currentStatus = freshOrder ? freshOrder.orderStatus : 'UNKNOWN';
          throw new Error(`CANNOT_CANCEL|${currentStatus}`);
        }

        // Restore inventory for each item
        for (const item of order.items) {
          if (!item.productId) continue;

          const qty = toNumber(item.quantity);
          if (qty <= 0) continue;

          // Add quantity back to stock
          await tx.inventory.update({
            where: { productId: item.productId },
            data: {
              currentStock: {
                increment: qty,
              },
            },
          });

          // Recalculate inventory status
          const inv = await tx.inventory.findUnique({
            where: { productId: item.productId },
          });

          if (inv) {
            const stock = toNumber(inv.currentStock);
            const threshold = toNumber(inv.lowStockThreshold, 5);
            const status =
              stock === 0
                ? 'OUT_OF_STOCK'
                : stock <= threshold
                  ? 'LOW_STOCK'
                  : 'IN_STOCK';

            await tx.inventory.update({
              where: { productId: item.productId },
              data: { status },
            });
          }
        }

        // Restore coupon usage count
        if (order.couponId) {
          const coupon = await tx.coupon.findUnique({
            where: { id: order.couponId },
          });

          if (coupon && coupon.usedCount > 0) {
            await tx.coupon.update({
              where: { id: order.couponId },
              data: {
                usedCount: {
                  decrement: 1,
                },
              },
            });
          }
        }

        // Fetch updated order with full details
        return await tx.order.findUnique({
          where: { id },
          include: {
            items: true,
            invoice: true,
            payments: true,
            address: true,
          },
        });
      },
      {
        maxWait: 10000,
        timeout: 60000,
      }
    );

    return res.json({
      success: true,
      message: `Order #${order.orderNumber} cancelled successfully.`,
      data: cancelledOrder,
    });
  } catch (error) {
    console.error('Cancel order error:', error);

    if (error.message && error.message.startsWith('CANNOT_CANCEL|')) {
      const status = error.message.split('|')[1];
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled because its current status is ${status}.`,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to cancel order. Please try again.',
    });
  }
}

// ============================================================
// SUBMIT UPI PAYMENT PROOF
// ============================================================

// POST /api/orders/:id/payment/submit
async function submitUpiPaymentProof(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { utr, screenshot } = req.body;

    // 1. Fetch order and verify ownership
    const order = await prisma.order.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        payments: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // 2. Validate Screenshot (REQUIRED)
    if (!screenshot || typeof screenshot !== 'string' || !screenshot.startsWith('data:')) {
      return res.status(400).json({
        success: false,
        message: 'Payment screenshot is required for verification.',
      });
    }

    if (screenshot.length > 7 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'Screenshot file size exceeds 5MB limit.',
      });
    }

    // 3. UTR (OPTIONAL)
    const cleanUtr = String(utr || '').trim() || 'N/A';

    // 4. Lock payable amount to actual database order.totalAmount
    const expectedAmount = toNumber(order.totalAmount);

    // Format transactionId to store UTR and screenshot proof
    const transactionIdPayload = `UTR:${cleanUtr}|SCREENSHOT:${screenshot}`;

    // Execute atomic payment update
    const updatedOrder = await prisma.$transaction(
      async (tx) => {
        // Find existing payment or create
        const existingPayment = await tx.payment.findFirst({
          where: { orderId: id },
        });

        if (existingPayment) {
          await tx.payment.update({
            where: { id: existingPayment.id },
            data: {
              paymentMethod: 'UPI',
              amount: expectedAmount,
              status: 'VERIFICATION_PENDING',
              transactionId: transactionIdPayload,
            },
          });
        } else {
          await tx.payment.create({
            data: {
              orderId: id,
              paymentMethod: 'UPI',
              amount: expectedAmount,
              status: 'VERIFICATION_PENDING',
              transactionId: transactionIdPayload,
            },
          });
        }

        // Update order payment status
        return await tx.order.update({
          where: { id },
          data: {
            paymentStatus: 'PENDING',
          },
          include: {
            items: true,
            address: true,
            payments: true,
            invoice: true,
          },
        });
      },
      {
        maxWait: 10000,
        timeout: 60000,
      }
    );

    return res.json({
      success: true,
      message: 'Payment details submitted successfully. Your order will be confirmed after verification.',
      data: updatedOrder,
    });
  } catch (error) {
    console.error('Submit UPI payment proof error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit payment details. Please try again.',
    });
  }
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  validateCoupon,
  createOrder,
  getUserOrders,
  getOrderDetails,
  cancelOrder,
  submitUpiPaymentProof,
};