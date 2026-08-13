// ─── CATEGORY CONTROLLER ──────────────────────────────────────
const prisma   = require('../config/db');
const slugify  = require('slugify');
const { deleteImage } = require('../config/cloudinary');

const getCategories = async (req, res) => {
  const cats = await prisma.category.findMany({
    where:   { isActive: true },
    orderBy: { sortOrder: 'asc' },
    include: { _count: { select: { products: { where: { isActive: true } } } } },
  });
  res.json({ success: true, data: { categories: cats } });
};

const getAllCategoriesAdmin = async (req, res) => {
  const cats = await prisma.category.findMany({
    orderBy: { sortOrder: 'asc' },
    include: { _count: { select: { products: true } } },
  });
  res.json({ success: true, data: { categories: cats } });
};

const createCategory = async (req, res) => {
  const { name, description, color, sortOrder } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Name is required.' });

  const slug  = slugify(name, { lower: true, strict: true });
  const image = req.file ? req.file.path : null;
  const pubId = req.file ? req.file.filename : null;

  const cat = await prisma.category.create({
    data: { name, slug, description, color, image, sortOrder: parseInt(sortOrder) || 0 },
  });
  res.status(201).json({ success: true, message: 'Category created.', data: { category: cat } });
};

const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, description, color, isActive, sortOrder } = req.body;

  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ success: false, message: 'Category not found.' });

  let image = existing.image;
  if (req.file) {
    if (existing.image) await deleteImage(existing.image);
    image = req.file.path;
  }

  const cat = await prisma.category.update({
    where: { id },
    data: {
      ...(name        && { name, slug: slugify(name, { lower: true, strict: true }) }),
      ...(description !== undefined && { description }),
      ...(color       && { color }),
      ...(isActive    !== undefined && { isActive: isActive === 'true' || isActive === true }),
      ...(sortOrder   !== undefined && { sortOrder: parseInt(sortOrder) }),
      image,
    },
  });
  res.json({ success: true, message: 'Category updated.', data: { category: cat } });
};

const deleteCategory = async (req, res) => {
  const { id } = req.params;
  const cat = await prisma.category.findUnique({ where: { id }, include: { _count: { select: { products: true } } } });
  if (!cat) return res.status(404).json({ success: false, message: 'Category not found.' });
  if (cat._count.products > 0) return res.status(400).json({ success: false, message: 'Cannot delete category with products.' });
  if (cat.image) await deleteImage(cat.image);
  await prisma.category.delete({ where: { id } });
  res.json({ success: true, message: 'Category deleted.' });
};

// ─── REVIEW CONTROLLER ────────────────────────────────────────
const createReview = async (req, res) => {
  const { productId, rating, title, body } = req.body;
  if (!productId || !rating || !body) return res.status(400).json({ success: false, message: 'Product, rating, and review body are required.' });
  if (rating < 1 || rating > 5) return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

  const review = await prisma.review.upsert({
    where:  { productId_userId: { productId, userId: req.user.id } },
    create: { productId, userId: req.user.id, rating: parseInt(rating), title, body },
    update: { rating: parseInt(rating), title, body, isApproved: false },
    include:{ user: { select: { firstName: true, lastName: true, avatar: true } } },
  });
  res.status(201).json({ success: true, message: 'Review submitted and awaiting approval.', data: { review } });
};

const getProductReviews = async (req, res) => {
  const { productId } = req.params;
  const reviews = await prisma.review.findMany({
    where:   { productId, isApproved: true },
    include: { user: { select: { firstName: true, lastName: true, avatar: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: { reviews } });
};

const approveReview = async (req, res) => {
  const { id } = req.params;
  const review = await prisma.review.update({ where: { id }, data: { isApproved: true } });
  res.json({ success: true, message: 'Review approved.', data: { review } });
};

const deleteReview = async (req, res) => {
  await prisma.review.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: 'Review deleted.' });
};

// ─── WISHLIST CONTROLLER ──────────────────────────────────────
const getWishlist = async (req, res) => {
  const items = await prisma.wishlistItem.findMany({
    where:   { userId: req.user.id },
    include: { product: { include: { images: { take: 1 }, category: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: { items } });
};

const toggleWishlist = async (req, res) => {
  const { productId } = req.body;
  const existing = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId: req.user.id, productId } },
  });
  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
    return res.json({ success: true, message: 'Removed from wishlist.', data: { inWishlist: false } });
  }
  await prisma.wishlistItem.create({ data: { userId: req.user.id, productId } });
  res.json({ success: true, message: 'Added to wishlist.', data: { inWishlist: true } });
};

// ─── COUPON CONTROLLER ────────────────────────────────────────
const validateCoupon = async (req, res) => {
  const { code, orderAmount } = req.body;
  if (!code) return res.status(400).json({ success: false, message: 'Coupon code required.' });

  const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
  if (!coupon || !coupon.isActive) return res.status(404).json({ success: false, message: 'Invalid coupon code.' });
  if (coupon.expiresAt && coupon.expiresAt < new Date()) return res.status(400).json({ success: false, message: 'Coupon has expired.' });
  if (coupon.startsAt && coupon.startsAt > new Date()) return res.status(400).json({ success: false, message: 'Coupon is not yet active.' });
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) return res.status(400).json({ success: false, message: 'Coupon usage limit reached.' });
  if (coupon.minOrderAmount && parseFloat(orderAmount) < parseFloat(coupon.minOrderAmount)) {
    return res.status(400).json({ success: false, message: `Minimum order of ₦${parseFloat(coupon.minOrderAmount).toLocaleString()} required.` });
  }

  const discount = coupon.type === 'PERCENTAGE'
    ? (parseFloat(orderAmount) * parseFloat(coupon.value)) / 100
    : parseFloat(coupon.value);

  res.json({ success: true, message: 'Coupon applied!', data: { coupon, discount } });
};

const getCoupons = async (req, res) => {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({ success: true, data: { coupons } });
};

const createCoupon = async (req, res) => {
  const { code, description, type, value, minOrderAmount, maxUses, startsAt, expiresAt } = req.body;
  const coupon = await prisma.coupon.create({
    data: {
      code:           code.toUpperCase().trim(),
      description,
      type:           type || 'PERCENTAGE',
      value:          parseFloat(value),
      minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount) : null,
      maxUses:        maxUses ? parseInt(maxUses) : null,
      startsAt:       startsAt ? new Date(startsAt) : null,
      expiresAt:      expiresAt ? new Date(expiresAt) : null,
    },
  });
  res.status(201).json({ success: true, data: { coupon } });
};

const updateCoupon = async (req, res) => {
  const { id } = req.params;
  const { isActive, expiresAt, maxUses, description } = req.body;
  const coupon = await prisma.coupon.update({
    where: { id },
    data: {
      ...(isActive    !== undefined && { isActive: isActive === 'true' || isActive === true }),
      ...(expiresAt   && { expiresAt: new Date(expiresAt) }),
      ...(maxUses     && { maxUses:   parseInt(maxUses) }),
      ...(description && { description }),
    },
  });
  res.json({ success: true, data: { coupon } });
};

const deleteCoupon = async (req, res) => {
  await prisma.coupon.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: 'Coupon deleted.' });
};

// ─── SETTINGS CONTROLLER ──────────────────────────────────────
const getSettings = async (req, res) => {
  const settings = await prisma.setting.findMany();
  const obj = settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {});
  res.json({ success: true, data: { settings: obj } });
};

const getPublicSettings = async (req, res) => {
  const publicKeys = ['site_name','tagline','phone','whatsapp','email','address',
                      'instagram','facebook','twitter','delivery_fee','free_delivery_above',
                      'currency','country','hero_title','hero_subtitle','about_text'];
  const settings = await prisma.setting.findMany({ where: { key: { in: publicKeys } } });
  const obj = settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {});
  res.json({ success: true, data: { settings: obj } });
};

const updateSettings = async (req, res) => {
  const updates = req.body;
  const ops = Object.entries(updates).map(([key, value]) =>
    prisma.setting.upsert({ where: { key }, create: { key, value: String(value) }, update: { value: String(value) } })
  );
  await Promise.all(ops);
  res.json({ success: true, message: 'Settings updated.' });
};

// ─── CONTACT CONTROLLER ───────────────────────────────────────
const submitContact = async (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  if (!name || !email || !message) return res.status(400).json({ success: false, message: 'Name, email, and message are required.' });

  const msg = await prisma.contactMessage.create({ data: { name, email, phone, subject, message } });
  res.status(201).json({ success: true, message: 'Message received. We will contact you shortly.', data: { id: msg.id } });
};

const getMessages = async (req, res) => {
  const messages = await prisma.contactMessage.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({ success: true, data: { messages } });
};

const markMessageRead = async (req, res) => {
  await prisma.contactMessage.update({ where: { id: req.params.id }, data: { isRead: true } });
  res.json({ success: true, message: 'Marked as read.' });
};

// ─── SHIPPING CONTROLLER ──────────────────────────────────────
const getShippingZones = async (req, res) => {
  const zones = await prisma.shippingZone.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
  res.json({ success: true, data: { zones } });
};

const calculateShipping = async (req, res) => {
  const { state, orderAmount } = req.body;
  if (!state) return res.status(400).json({ success: false, message: 'State is required.' });

  const zone = await prisma.shippingZone.findFirst({ where: { states: { has: state }, isActive: true } });
  if (!zone) {
    const defaultFee = parseFloat(await prisma.setting.findUnique({ where: { key: 'delivery_fee' } }).then(s => s?.value || '3500'));
    return res.json({ success: true, data: { fee: defaultFee, isFree: false, zone: null } });
  }

  const amount  = parseFloat(orderAmount || 0);
  const isFree  = zone.freeAbove && amount >= parseFloat(zone.freeAbove);
  const fee     = isFree ? 0 : parseFloat(zone.rate);

  res.json({ success: true, data: { fee, isFree, zone } });
};

const createShippingZone = async (req, res) => {
  const { name, states, rate, freeAbove } = req.body;
  const zone = await prisma.shippingZone.create({
    data: { name, states, rate: parseFloat(rate), freeAbove: freeAbove ? parseFloat(freeAbove) : null },
  });
  res.status(201).json({ success: true, data: { zone } });
};

const updateShippingZone = async (req, res) => {
  const { id } = req.params;
  const { name, states, rate, freeAbove, isActive } = req.body;
  const zone = await prisma.shippingZone.update({
    where: { id },
    data: {
      ...(name      && { name }),
      ...(states    && { states }),
      ...(rate      && { rate:      parseFloat(rate) }),
      ...(freeAbove !== undefined && { freeAbove: freeAbove ? parseFloat(freeAbove) : null }),
      ...(isActive  !== undefined && { isActive: isActive === 'true' || isActive === true }),
    },
  });
  res.json({ success: true, data: { zone } });
};

// ─── USER MANAGEMENT (Admin) ──────────────────────────────────
const getAllUsers = async (req, res) => {
  const { page = 1, limit = 20, search, role } = req.query;
  const skip  = (parseInt(page) - 1) * parseInt(limit);
  const where = {};
  if (role)   where.role = role;
  if (search) where.OR   = [
    { email:     { contains: search, mode: 'insensitive' } },
    { firstName: { contains: search, mode: 'insensitive' } },
    { lastName:  { contains: search, mode: 'insensitive' } },
  ];

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where, skip, take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      select:  { id: true, email: true, firstName: true, lastName: true, phone: true, role: true, isActive: true, createdAt: true, _count: { select: { orders: true } } },
    }),
    prisma.user.count({ where }),
  ]);
  res.json({ success: true, data: { users, pagination: { page: parseInt(page), total, pages: Math.ceil(total / parseInt(limit)) } } });
};

const toggleUserStatus = async (req, res) => {
  const { id } = req.params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  const updated = await prisma.user.update({ where: { id }, data: { isActive: !user.isActive } });
  res.json({ success: true, message: `User ${updated.isActive ? 'activated' : 'deactivated'}.` });
};

module.exports = {
  // Categories
  getCategories, getAllCategoriesAdmin, createCategory, updateCategory, deleteCategory,
  // Reviews
  createReview, getProductReviews, approveReview, deleteReview,
  // Wishlist
  getWishlist, toggleWishlist,
  // Coupons
  validateCoupon, getCoupons, createCoupon, updateCoupon, deleteCoupon,
  // Settings
  getSettings, getPublicSettings, updateSettings,
  // Contact
  submitContact, getMessages, markMessageRead,
  // Shipping
  getShippingZones, calculateShipping, createShippingZone, updateShippingZone,
  // Users
  getAllUsers, toggleUserStatus,
};
