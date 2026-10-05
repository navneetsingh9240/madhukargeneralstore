try { require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') }); } catch (e) {}
const express = require('express');
const cors = require('cors');
const path = require('path');
const prisma = require('./config/db');
const {
  authenticate,
  optionalAuthenticate,
  authorizeRoles,
} = require('./middleware/auth.middleware');
const authCtrl = require('./controllers/auth.controller');
const deliveryCtrl = require('./controllers/delivery.controller');
const productCtrl = require('./controllers/product.controller');
const orderCtrl = require('./controllers/order.controller');
const invoiceCtrl = require('./controllers/invoice.controller');
const adminCtrl = require('./controllers/admin.controller');
const userCtrl = require('./controllers/user.controller');
const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Madhukar General Store API',
    timestamp: new Date(),
  });
});
// Auth Routes
app.post('/api/auth/register', authCtrl.register);
app.post('/api/auth/login', authCtrl.login);
app.get('/api/auth/me', authenticate, authCtrl.getProfile);
// Delivery PIN Check & Customer Addresses
app.get('/api/delivery/check/:pincode', deliveryCtrl.checkPincode);
app.get('/api/addresses', authenticate, deliveryCtrl.getUserAddresses);
app.post('/api/addresses', authenticate, deliveryCtrl.addAddress);
app.delete('/api/addresses/:id', authenticate, deliveryCtrl.deleteAddress);
// Store Settings
app.get('/api/store-settings', adminCtrl.getStoreSettings);
// Products & Categories
app.get('/api/products', productCtrl.getProducts);
app.get('/api/products/:slug', productCtrl.getProductBySlug);
app.get('/api/categories', productCtrl.getCategories);
// Coupons, Wishlist & Reviews
app.get('/api/coupons', userCtrl.getActiveCoupons);
app.post('/api/coupons/validate', orderCtrl.validateCoupon);
app.get('/api/wishlist', authenticate, userCtrl.getWishlist);
app.post('/api/wishlist', authenticate, userCtrl.addToWishlist);
app.delete(
  '/api/wishlist/:productId',
  authenticate,
  userCtrl.removeFromWishlist
);
app.post('/api/reviews', authenticate, userCtrl.addReview);
// Orders
app.post('/api/orders', authenticate, orderCtrl.createOrder);
app.get('/api/orders', authenticate, orderCtrl.getUserOrders);
app.get('/api/orders/:id', authenticate, orderCtrl.getOrderDetails);
app.post('/api/orders/:id/cancel', authenticate, orderCtrl.cancelOrder);
app.post('/api/orders/:id/payment/submit', authenticate, orderCtrl.submitUpiPaymentProof);
// Invoices, PDF & QR Scanning
app.get(
  '/api/invoices/scan/:qrToken',
  optionalAuthenticate,
  invoiceCtrl.scanInvoiceQr
);
app.get('/api/invoices/pdf/:id', invoiceCtrl.generateInvoicePdf);
app.post(
  '/api/delivery/verify-and-deliver',
  authenticate,
  authorizeRoles('ADMIN', 'STAFF', 'DELIVERY'),
  invoiceCtrl.verifyAndMarkDelivered
);
app.post(
  '/api/delivery/collect-payment',
  authenticate,
  authorizeRoles('ADMIN', 'STAFF', 'DELIVERY'),
  adminCtrl.collectDeliveryPayment
);
// Admin Routes
app.get(
  '/api/admin/metrics',
  authenticate,
  authorizeRoles('ADMIN', 'STAFF'),
  adminCtrl.getAdminMetrics
);
// Admin Products
app.post(
  '/api/admin/products',
  authenticate,
  authorizeRoles('ADMIN', 'STAFF'),
  adminCtrl.createProduct
);
app.put(
  '/api/admin/products/:id',
  authenticate,
  authorizeRoles('ADMIN', 'STAFF'),
  adminCtrl.updateProduct
);
app.delete(
  '/api/admin/products/:id',
  authenticate,
  authorizeRoles('ADMIN', 'STAFF'),
  adminCtrl.deleteProduct
);
// Admin Categories
app.get(
  '/api/admin/categories',
  authenticate,
  authorizeRoles('ADMIN', 'STAFF'),
  adminCtrl.getAdminCategories
);
app.post(
  '/api/admin/categories',
  authenticate,
  authorizeRoles('ADMIN', 'STAFF'),
  adminCtrl.createCategory
);
app.put(
  '/api/admin/categories/:id',
  authenticate,
  authorizeRoles('ADMIN', 'STAFF'),
  adminCtrl.updateCategory
);
app.delete(
  '/api/admin/categories/:id',
  authenticate,
  authorizeRoles('ADMIN', 'STAFF'),
  adminCtrl.deleteCategory
);
// Admin Delivery Areas
app.get(
  '/api/admin/delivery-areas',
  authenticate,
  authorizeRoles('ADMIN', 'STAFF'),
  adminCtrl.getAdminDeliveryAreas
);
app.post(
  '/api/admin/delivery-areas',
  authenticate,
  authorizeRoles('ADMIN', 'STAFF'),
  adminCtrl.addDeliveryArea
);
// Edit Delivery PIN Code
app.put(
  '/api/admin/delivery-areas/:id',
  authenticate,
  authorizeRoles('ADMIN', 'STAFF'),
  adminCtrl.updateDeliveryArea
);
// Delete Delivery PIN Code
app.delete(
  '/api/admin/delivery-areas/:id',
  authenticate,
  authorizeRoles('ADMIN', 'STAFF'),
  adminCtrl.deleteDeliveryArea
);
// Admin Orders
app.put(
  '/api/admin/orders/:id/status',
  authenticate,
  authorizeRoles('ADMIN', 'STAFF', 'DELIVERY'),
  adminCtrl.updateOrderStatus
);
app.get(
  '/api/admin/orders',
  authenticate,
  authorizeRoles('ADMIN', 'STAFF'),
  adminCtrl.getAdminOrders
);
app.post(
  '/api/admin/orders/:id/payment/verify',
  authenticate,
  authorizeRoles('ADMIN', 'STAFF'),
  adminCtrl.verifyPayment
);
app.post(
  '/api/admin/orders/:id/payment/reject',
  authenticate,
  authorizeRoles('ADMIN', 'STAFF'),
  adminCtrl.rejectPayment
);
app.get(
  '/api/admin/invoices',
  authenticate,
  authorizeRoles('ADMIN', 'STAFF'),
  adminCtrl.getAdminInvoices
);
// Admin Coupons
app.get(
  '/api/admin/coupons',
  authenticate,
  authorizeRoles('ADMIN', 'STAFF'),
  adminCtrl.getAdminCoupons
);
app.post(
  '/api/admin/coupons',
  authenticate,
  authorizeRoles('ADMIN', 'STAFF'),
  adminCtrl.createCoupon
);
app.put(
  '/api/admin/coupons/:id/toggle',
  authenticate,
  authorizeRoles('ADMIN', 'STAFF'),
  adminCtrl.toggleCoupon
);
// Admin Customers
app.get(
  '/api/admin/customers',
  authenticate,
  authorizeRoles('ADMIN', 'STAFF'),
  adminCtrl.getAdminCustomers
);
const PORT = process.env.PORT || 5000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(
      `🚀 Madhukar General Store Modular Monolith Backend listening on port ${PORT}`
    );
  });
}
module.exports = app;