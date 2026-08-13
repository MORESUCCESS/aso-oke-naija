const express = require('express');
const router  = express.Router();
const { getAllUsers, toggleUserStatus } = require('../controllers/miscControllers');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/',              protect, adminOnly, getAllUsers);
router.put('/:id/toggle',    protect, adminOnly, toggleUserStatus);

module.exports = router;
