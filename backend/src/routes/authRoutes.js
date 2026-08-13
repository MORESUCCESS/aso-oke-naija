// ─── authRoutes.js ────────────────────────────────────────────
const express   = require('express');
const router    = express.Router();
const auth      = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register',         auth.register);
router.post('/login',            auth.login);
router.post('/refresh',          auth.refreshToken);
router.get ('/me',    protect,   auth.getMe);
router.put ('/me',    protect,   auth.updateProfile);
router.put ('/change-password', protect, auth.changePassword);

module.exports = router;
