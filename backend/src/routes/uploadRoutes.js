const express = require('express');
const router  = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { uploadProduct, uploadCategory, uploadAvatar } = require('../config/cloudinary');

router.post('/product',  protect, adminOnly, uploadProduct.single('image'),  (req, res) => res.json({ success: true, data: { url: req.file.path, publicId: req.file.filename } }));
router.post('/category', protect, adminOnly, uploadCategory.single('image'), (req, res) => res.json({ success: true, data: { url: req.file.path, publicId: req.file.filename } }));
router.post('/avatar',   protect,            uploadAvatar.single('image'),   (req, res) => res.json({ success: true, data: { url: req.file.path, publicId: req.file.filename } }));

module.exports = router;
