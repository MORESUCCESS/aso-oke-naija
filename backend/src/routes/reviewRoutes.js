const express = require('express');
const router  = express.Router();
const { createReview, getProductReviews, approveReview, deleteReview } = require('../controllers/miscControllers');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/product/:productId',           getProductReviews);
router.post('/',              protect,      createReview);
router.put('/:id/approve',   protect, adminOnly, approveReview);
router.delete('/:id',        protect, adminOnly, deleteReview);

module.exports = router;
