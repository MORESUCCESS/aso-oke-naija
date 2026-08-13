const prisma = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const { sendOrderConfirmationEmail } = require('../emails/emailService');

const generateOrderRef = () => 'AOR-' + uuidv4().replace(/-/g, '').slice(0, 8).toUpperCase();

// ── CREATE ORDER ──────────────────────────────────────────────
const createOrder = async (req, res) => {
  const userId = req.user.id;
  const {
    items, shippingName, shippingPhone, shippingEmail,
    shippingStreet, shippingCity, shippingState, shippingCountry,
    shippingNotes, couponCode, paymentMethod,
  } = req.body;

  if (!items?.length) return res.status(400).json({ success: false, message: 'No items in order.' });

  // Validate + price all items fresh from DB
  const productIds = items.map(i => i.productId);
  const dbProducts = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
    include: { variants: true },
  });

  let subtotal = 0;
  const orderItems = [];

  for (const item of items) {
    const product = dbProducts.find(p => p.id === item.productId);
    if (!product) return res.status(400).json({ success: false, message: `Product not found: ${item.productId}` });
    if (product.stock < item.quantity) {
      return res.status(400).json({ success: false, message: `Insufficient stock for: ${product.name}` });
    }

    let price       = parseFloat(product.price);
    let variantName = null;
    let variantId   = null;

    if (item.variantId) {
      const variant = product.variants.find(v => v.id === item.variantId);
      if (variant) {
        if (variant.price) price = parseFloat(variant.price);
        variantName = variant.name;
        variantId   = variant.id;
      }
    }

    const itemSubtotal = price * item.quantity;
    subtotal += itemSubtotal;

    orderItems.push({
      productId:   product.id,
      productName: product.name,
      variantId,
      variantName,
      price,
      quantity:    item.quantity,
      subtotal:    itemSubtotal,
    });
  }

  // Coupon validation
  let discount       = 0;
  let appliedCoupon  = null;
  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({ where: { code: couponCode.toUpperCase() } });
    if (coupon && coupon.isActive && (!coupon.expiresAt || coupon.expiresAt > new Date())) {
      if (!coupon.minOrderAmount || subtotal >= parseFloat(coupon.minOrderAmount)) {
        if (!coupon.maxUses || coupon.usedCount < coupon.maxUses) {
          discount = coupon.type === 'PERCENTAGE'
            ? (subtotal * parseFloat(coupon.value)) / 100
            : parseFloat(coupon.value);
          appliedCoupon = coupon;
        }
      }
    }
  }

  // Shipping fee (lookup by state)
  let shippingFee = 3500; // default
  const zone = await prisma.shippingZone.findFirst({
    where: { states: { has: shippingState }, isActive: true },
  });
  if (zone) {
    shippingFee = zone.freeAbove && subtotal >= parseFloat(zone.freeAbove) ? 0 : parseFloat(zone.rate);
  }

  const total = Math.max(0, subtotal - discount + shippingFee);

  // Create order in a transaction
  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        orderRef:       generateOrderRef(),
        userId,
        shippingName,   shippingPhone, shippingEmail,
        shippingStreet, shippingCity,  shippingState,
        shippingCountry:shippingCountry || 'Nigeria',
        shippingNotes,
        paymentMethod,
        couponCode:    appliedCoupon?.code,
        couponDiscount:discount > 0 ? discount : null,
        subtotal, shippingFee, discount, total,
        items: { create: orderItems },
        statusHistory: { create: { status: 'PENDING', note: 'Order placed.' } },
      },
      include: { items: true },
    });

    // Decrement stock
    for (const item of orderItems) {
      await tx.product.update({
        where: { id: item.productId },
        data:  { stock: { decrement: item.quantity } },
      });
    }

    // Increment coupon usage
    if (appliedCoupon) {
      await tx.coupon.update({
        where: { id: appliedCoupon.id },
        data:  { usedCount: { increment: 1 } },
      });
    }

    // Clear cart
    const cart = await tx.cart.findUnique({ where: { userId } });
    if (cart) await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    return newOrder;
  });

  // Send confirmation email
  sendOrderConfirmationEmail({ ...order, userEmail: shippingEmail, userName: shippingName }).catch(console.error);

  res.status(201).json({ success: true, message: 'Order placed successfully.', data: { order } });
};

// ── GET MY ORDERS ─────────────────────────────────────────────
const getMyOrders = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip  = (parseInt(page) - 1) * parseInt(limit);

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where:   { userId: req.user.id },
      skip, take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: { product: { include: { images: { take: 1 } } } },
        },
      },
    }),
    prisma.order.count({ where: { userId: req.user.id } }),
  ]);

  res.json({
    success: true,
    data: { orders, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } },
  });
};

// ── GET SINGLE ORDER ──────────────────────────────────────────
const getOrder = async (req, res) => {
  const { ref } = req.params;
  const order = await prisma.order.findUnique({
    where:   { orderRef: ref },
    include: {
      items:         { include: { product: { include: { images: { take: 1 } } }, variant: true } },
      payment:       true,
      statusHistory: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
  // Customers can only view their own orders
  if (order.userId !== req.user.id && !['ADMIN','SUPER_ADMIN'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }

  res.json({ success: true, data: { order } });
};

// ── ADMIN: GET ALL ORDERS ─────────────────────────────────────
const getAllOrders = async (req, res) => {
  const { page = 1, limit = 20, status, paymentStatus, search } = req.query;
  const skip  = (parseInt(page) - 1) * parseInt(limit);
  const where = {};

  if (status)        where.status        = status;
  if (paymentStatus) where.paymentStatus = paymentStatus;
  if (search)        where.OR = [
    { orderRef:      { contains: search, mode: 'insensitive' } },
    { shippingName:  { contains: search, mode: 'insensitive' } },
    { shippingEmail: { contains: search, mode: 'insensitive' } },
    { shippingPhone: { contains: search, mode: 'insensitive' } },
  ];

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where, skip, take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: { items: { include: { product: { select: { name: true } } } } },
    }),
    prisma.order.count({ where }),
  ]);

  res.json({
    success: true,
    data: { orders, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } },
  });
};

// ── ADMIN: UPDATE ORDER STATUS ────────────────────────────────
const updateOrderStatus = async (req, res) => {
  const { id }    = req.params;
  const { status, note, trackingNumber } = req.body;

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

  const updated = await prisma.order.update({
    where: { id },
    data:  {
      status,
      ...(trackingNumber && { trackingNumber }),
      ...(status === 'SHIPPED'   && { shippedAt:   new Date() }),
      ...(status === 'DELIVERED' && { deliveredAt: new Date() }),
      statusHistory: { create: { status, note: note || `Status updated to ${status}.` } },
    },
  });

  res.json({ success: true, message: 'Order status updated.', data: { order: updated } });
};

// ── ADMIN: DASHBOARD STATS ────────────────────────────────────
const getStats = async (req, res) => {
  const now         = new Date();
  const startOfDay  = new Date(now.setHours(0, 0, 0, 0));
  const startOfMonth= new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalOrders, totalRevenue, pendingOrders,
    todayOrders, monthRevenue, totalProducts,
    totalCustomers, lowStockProducts,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.aggregate({ where: { paymentStatus: 'PAID' }, _sum: { total: true } }),
    prisma.order.count({ where: { status: 'PENDING' } }),
    prisma.order.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.order.aggregate({ where: { paymentStatus: 'PAID', createdAt: { gte: startOfMonth } }, _sum: { total: true } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.product.findMany({
      where: { stock: { lte: prisma.product.fields.lowStockAlert } },
      select: { id: true, name: true, stock: true },
      take: 5,
    }),
  ]);

  res.json({
    success: true,
    data: {
      totalOrders,
      totalRevenue:   parseFloat(totalRevenue._sum.total || 0),
      pendingOrders,
      todayOrders,
      monthRevenue:   parseFloat(monthRevenue._sum.total || 0),
      totalProducts,
      totalCustomers,
      lowStockProducts,
    },
  });
};

module.exports = { createOrder, getMyOrders, getOrder, getAllOrders, updateOrderStatus, getStats };
