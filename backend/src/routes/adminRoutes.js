const express = require('express');
const router  = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Admin-specific aggregated dashboard route
router.get('/dashboard', protect, adminOnly, async (req, res) => {
  const prisma = require('../config/db');
  const now    = new Date();
  const som    = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalOrders, totalRevenue, pendingOrders, totalProducts, totalCustomers, recentOrders, lowStock] = await Promise.all([
    prisma.order.count(),
    prisma.order.aggregate({ where: { paymentStatus: 'PAID' }, _sum: { total: true } }),
    prisma.order.count({ where: { status: 'PENDING' } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.order.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { items: { take: 1 } } }),
    prisma.product.findMany({ where: { stock: { lte: 5 }, isActive: true }, select: { id: true, name: true, stock: true }, take: 5 }),
  ]);

  res.json({
    success: true,
    data: {
      totalOrders,
      totalRevenue: parseFloat(totalRevenue._sum.total || 0),
      pendingOrders,
      totalProducts,
      totalCustomers,
      recentOrders,
      lowStock,
    },
  });
});

module.exports = router;
