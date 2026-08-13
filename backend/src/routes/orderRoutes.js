const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/orderController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/',                   protect, ctrl.createOrder);
router.get('/my',                  protect, ctrl.getMyOrders);
router.get('/my/:ref',             protect, ctrl.getOrder);
router.get('/admin/all',           protect, adminOnly, ctrl.getAllOrders);
router.get('/admin/stats',         protect, adminOnly, ctrl.getStats);
router.put('/admin/:id/status',    protect, adminOnly, ctrl.updateOrderStatus);

module.exports = router;
