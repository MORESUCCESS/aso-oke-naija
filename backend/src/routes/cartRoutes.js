const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/',              ctrl.getCart);
router.post('/add',          ctrl.addToCart);
router.put('/items/:itemId', ctrl.updateCartItem);
router.delete('/items/:itemId', ctrl.removeCartItem);
router.delete('/',           ctrl.clearCart);

module.exports = router;
