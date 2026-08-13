const express = require('express');
const router  = express.Router();
const { getSettings, getPublicSettings, updateSettings } = require('../controllers/miscControllers');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/public',  getPublicSettings);
router.get('/',        protect, adminOnly, getSettings);
router.put('/',        protect, adminOnly, updateSettings);

module.exports = router;
