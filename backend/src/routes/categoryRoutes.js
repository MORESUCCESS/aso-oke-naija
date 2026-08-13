const express = require('express');
const router  = express.Router();
const { getCategories, getAllCategoriesAdmin, createCategory, updateCategory, deleteCategory } = require('../controllers/miscControllers');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { uploadCategory } = require('../config/cloudinary');

router.get('/',           getCategories);
router.get('/admin/all',  protect, adminOnly, getAllCategoriesAdmin);
router.post('/',          protect, adminOnly, uploadCategory.single('image'), createCategory);
router.put('/:id',        protect, adminOnly, uploadCategory.single('image'), updateCategory);
router.delete('/:id',     protect, adminOnly, deleteCategory);

module.exports = router;
