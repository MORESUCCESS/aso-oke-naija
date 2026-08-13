const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const prisma = require('../config/db');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../emails/emailService');

// ── Generate tokens ───────────────────────────────────────────
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  });
  return { accessToken, refreshToken };
};

const safeUser = (user) => ({
  id:        user.id,
  email:     user.email,
  firstName: user.firstName,
  lastName:  user.lastName,
  phone:     user.phone,
  role:      user.role,
  avatar:    user.avatar,
  isVerified:user.isVerified,
});

// ── REGISTER ──────────────────────────────────────────────────
const register = async (req, res) => {
  const { email, password, firstName, lastName, phone } = req.body;

  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ success: false, message: 'Please fill all required fields.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) return res.status(409).json({ success: false, message: 'Email already registered.' });

  const hashed = await bcrypt.hash(password, 12);
  const user   = await prisma.user.create({
    data: {
      email:     email.toLowerCase().trim(),
      password:  hashed,
      firstName: firstName.trim(),
      lastName:  lastName.trim(),
      phone:     phone?.trim(),
    },
  });

  // Create empty cart
  await prisma.cart.create({ data: { userId: user.id } });

  // Send welcome email (non-blocking)
  sendWelcomeEmail(user).catch(console.error);

  const { accessToken, refreshToken } = generateTokens(user.id);

  res.status(201).json({
    success: true,
    message: 'Account created successfully.',
    data: { user: safeUser(user), accessToken, refreshToken },
  });
};

// ── LOGIN ─────────────────────────────────────────────────────
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  if (!user.isActive) return res.status(401).json({ success: false, message: 'Account deactivated. Contact support.' });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ success: false, message: 'Invalid email or password.' });

  const { accessToken, refreshToken } = generateTokens(user.id);

  res.json({
    success: true,
    message: 'Login successful.',
    data: { user: safeUser(user), accessToken, refreshToken },
  });
};

// ── REFRESH TOKEN ─────────────────────────────────────────────
const refreshToken = async (req, res) => {
  const { refreshToken: token } = req.body;
  if (!token) return res.status(401).json({ success: false, message: 'Refresh token required.' });

  const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  const user    = await prisma.user.findUnique({ where: { id: decoded.id } });
  if (!user) return res.status(401).json({ success: false, message: 'User not found.' });

  const { accessToken, refreshToken: newRefresh } = generateTokens(user.id);
  res.json({ success: true, data: { accessToken, refreshToken: newRefresh } });
};

// ── GET ME ────────────────────────────────────────────────────
const getMe = async (req, res) => {
  const user = await prisma.user.findUnique({
    where:   { id: req.user.id },
    include: { addresses: true },
  });
  res.json({ success: true, data: { user: { ...safeUser(user), addresses: user.addresses } } });
};

// ── UPDATE PROFILE ────────────────────────────────────────────
const updateProfile = async (req, res) => {
  const { firstName, lastName, phone } = req.body;
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data:  { firstName, lastName, phone },
  });
  res.json({ success: true, message: 'Profile updated.', data: { user: safeUser(user) } });
};

// ── CHANGE PASSWORD ───────────────────────────────────────────
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Both passwords are required.' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ success: false, message: 'New password must be at least 8 characters.' });
  }

  const user  = await prisma.user.findUnique({ where: { id: req.user.id } });
  const match = await bcrypt.compare(currentPassword, user.password);
  if (!match) return res.status(400).json({ success: false, message: 'Current password is incorrect.' });

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });

  res.json({ success: true, message: 'Password changed successfully.' });
};

module.exports = { register, login, refreshToken, getMe, updateProfile, changePassword };
