const jwt    = require('jsonwebtoken');
const prisma = require('../config/db');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorised, no token.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user    = await prisma.user.findUnique({
      where:  { id: decoded.id },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true },
    });

    if (!user)          return res.status(401).json({ success: false, message: 'User not found.' });
    if (!user.isActive) return res.status(401).json({ success: false, message: 'Account deactivated.' });

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

const adminOnly = (req, res, next) => {
  if (req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN') return next();
  res.status(403).json({ success: false, message: 'Admin access required.' });
};

const superAdminOnly = (req, res, next) => {
  if (req.user?.role === 'SUPER_ADMIN') return next();
  res.status(403).json({ success: false, message: 'Super admin access required.' });
};

module.exports = { protect, adminOnly, superAdminOnly };
