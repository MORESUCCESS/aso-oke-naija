const express = require('express');
const router  = express.Router();
const { getShippingZones, calculateShipping, createShippingZone, updateShippingZone } = require('../controllers/miscControllers');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/',          getShippingZones);
router.post('/calculate', calculateShipping);
router.post('/',          protect, adminOnly, createShippingZone);
router.put('/:id',        protect, adminOnly, updateShippingZone);

module.exports = router;
