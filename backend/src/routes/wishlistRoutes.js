const express = require('express');
const router  = express.Router();
const { getWishlist, toggleWishlist } = require('../controllers/miscControllers');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/',       getWishlist);
router.post('/toggle', toggleWishlist);

module.exports = router;
