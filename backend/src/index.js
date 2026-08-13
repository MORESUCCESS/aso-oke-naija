require('dotenv').config();
require('express-async-errors');
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
const rateLimit = require('express-rate-limit');

const { errorHandler, notFound } = require('./middleware/errorMiddleware');

// ── Route imports ─────────────────────────────────────────────
const authRoutes      = require('./routes/authRoutes');
const userRoutes      = require('./routes/userRoutes');
const categoryRoutes  = require('./routes/categoryRoutes');
const productRoutes   = require('./routes/productRoutes');
const cartRoutes      = require('./routes/cartRoutes');
const orderRoutes     = require('./routes/orderRoutes');
const paymentRoutes   = require('./routes/paymentRoutes');
const reviewRoutes    = require('./routes/reviewRoutes');
const wishlistRoutes  = require('./routes/wishlistRoutes');
const couponRoutes    = require('./routes/couponRoutes');
const uploadRoutes    = require('./routes/uploadRoutes');
const settingRoutes   = require('./routes/settingRoutes');
const contactRoutes   = require('./routes/contactRoutes');
const adminRoutes     = require('./routes/adminRoutes');
const shippingRoutes  = require('./routes/shippingRoutes');

const app = express();

// ── Security & Parsing ────────────────────────────────────────
app.use(helmet());
console.log("FRONTEND_URL:", process.env.FRONTEND_URL);
app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    'http://localhost:5173',
    'http://localhost:3000',
  ],
  credentials: true,
}));

// Webhook routes need raw body — register BEFORE express.json()
app.use('/api/payments/paystack/webhook',  express.raw({ type: 'application/json' }));
app.use('/api/payments/flutterwave/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Rate limiting ─────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 300,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many auth attempts, please try again later.' },
});

app.use('/api', globalLimiter);
app.use('/api/auth', authLimiter);

// ── Health check ──────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Àṣọ Òkè Royale API is running ✦',
    env:     process.env.NODE_ENV,
    time:    new Date().toISOString(),
  });
});

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/users',     userRoutes);
app.use('/api/categories',categoryRoutes);
app.use('/api/products',  productRoutes);
app.use('/api/cart',      cartRoutes);
app.use('/api/orders',    orderRoutes);
app.use('/api/payments',  paymentRoutes);
app.use('/api/reviews',   reviewRoutes);
app.use('/api/wishlist',  wishlistRoutes);
app.use('/api/coupons',   couponRoutes);
app.use('/api/upload',    uploadRoutes);
app.use('/api/settings',  settingRoutes);
app.use('/api/contact',   contactRoutes);
app.use('/api/shipping',  shippingRoutes);
app.use('/api/admin',     adminRoutes);

// ── Error handlers ────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n✦ Àṣọ Òkè Royale API`);
  console.log(`  Running on port ${PORT}`);
  console.log(`  Environment: ${process.env.NODE_ENV}`);
  console.log(`  Health: http://localhost:${PORT}/api/health\n`);
});

module.exports = app;
