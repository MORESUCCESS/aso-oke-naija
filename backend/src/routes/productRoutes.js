const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/productController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { uploadProduct } = require('../config/cloudinary');

router.get('/',                                   ctrl.getProducts);
router.get('/:slug',                              ctrl.getProduct);
router.post('/',    protect, adminOnly, uploadProduct.array('images', 8), ctrl.createProduct);
router.put('/:id',  protect, adminOnly, uploadProduct.array('images', 8), ctrl.updateProduct);
router.delete('/:id', protect, adminOnly,         ctrl.deleteProduct);
router.delete('/images/:imageId', protect, adminOnly, ctrl.deleteProductImage);
router.put('/images/:imageId/primary', protect, adminOnly, ctrl.setPrimaryImage);

module.exports = router;
