const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

// Paystack
router.post('/paystack/init',              protect, ctrl.paystackInit);
router.get ('/paystack/verify/:reference', protect, ctrl.paystackVerify);
router.post('/paystack/webhook',                    ctrl.paystackWebhook);

// Flutterwave
router.post('/flutterwave/init',              protect, ctrl.flutterwaveInit);
router.get ('/flutterwave/verify/:reference', protect, ctrl.flutterwaveVerify);
router.post('/flutterwave/webhook',                    ctrl.flutterwaveWebhook);

module.exports = router;
