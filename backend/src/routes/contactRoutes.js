const express = require('express');
const router  = express.Router();
const { submitContact, getMessages, markMessageRead } = require('../controllers/miscControllers');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/',          submitContact);
router.get('/',           protect, adminOnly, getMessages);
router.put('/:id/read',   protect, adminOnly, markMessageRead);

module.exports = router;
