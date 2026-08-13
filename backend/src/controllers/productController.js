const prisma  = require('../config/db');
const slugify = require('slugify');
const { deleteImage } = require('../config/cloudinary');

// ── GET ALL PRODUCTS (with filters, search, pagination) ────────
const getProducts = async (req, res) => {
  const {
    page = 1, limit = 12, category, search,
    minPrice, maxPrice, fabric, sort = 'createdAt_desc',
    featured, bestseller,
  } = req.query;

  const skip  = (parseInt(page) - 1) * parseInt(limit);
  const where = { isActive: true };

  if (category)    where.category    = { slug: category };
  if (featured)    where.isFeatured  = true;
  if (bestseller)  where.isBestseller = true;
  if (fabric)      where.fabric      = { contains: fabric, mode: 'insensitive' };
  if (search)      where.OR = [
    { name:        { contains: search, mode: 'insensitive' } },
    { description: { contains: search, mode: 'insensitive' } },
    { fabric:      { contains: search, mode: 'insensitive' } },
  ];
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = parseFloat(minPrice);
    if (maxPrice) where.price.lte = parseFloat(maxPrice);
  }

  const [field, direction] = sort.split('_');
  const orderBy = { [field]: direction || 'desc' };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where, skip, take: parseInt(limit), orderBy,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        images:   { orderBy: { sortOrder: 'asc' } },
        variants: true,
        reviews:  { select: { rating: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  const formatted = products.map(p => ({
    ...p,
    avgRating:   p.reviews.length ? (p.reviews.reduce((a, r) => a + r.rating, 0) / p.reviews.length).toFixed(1) : null,
    reviewCount: p.reviews.length,
    primaryImage: p.images.find(i => i.isPrimary)?.url || p.images[0]?.url || null,
  }));

  res.json({
    success: true,
    data: {
      products: formatted,
      pagination: {
        page: parseInt(page), limit: parseInt(limit), total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    },
  });
};

// ── GET SINGLE PRODUCT ─────────────────────────────────────────
const getProduct = async (req, res) => {
  const { slug } = req.params;

  const product = await prisma.product.findUnique({
    where:   { slug, isActive: true },
    include: {
      category: true,
      images:   { orderBy: { sortOrder: 'asc' } },
      variants: true,
      reviews:  {
        where:   { isApproved: true },
        include: { user: { select: { firstName: true, lastName: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

  // Related products
  const related = await prisma.product.findMany({
    where:   { categoryId: product.categoryId, isActive: true, id: { not: product.id } },
    take:    4,
    include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } },
  });

  const avgRating = product.reviews.length
    ? (product.reviews.reduce((a, r) => a + r.rating, 0) / product.reviews.length).toFixed(1)
    : null;

  res.json({
    success: true,
    data: { product: { ...product, avgRating, reviewCount: product.reviews.length }, related },
  });
};

// ── CREATE PRODUCT (Admin) ─────────────────────────────────────
const createProduct = async (req, res) => {
  const {
    categoryId, name, description, fabric, technique, origin,
    price, comparePrice, costPrice, sku, stock, yards, badge,
    isFeatured, isBestseller, metaTitle, metaDesc, sortOrder, variants,
  } = req.body;

  if (!categoryId || !name || !description || !price) {
    return res.status(400).json({ success: false, message: 'Category, name, description, and price are required.' });
  }

  const slug = slugify(name, { lower: true, strict: true }) + '-' + Date.now().toString(36);

  const product = await prisma.product.create({
    data: {
      categoryId, name, slug, description,
      fabric, technique, origin: origin || 'Iseyin, Oyo State',
      price:       parseFloat(price),
      comparePrice:comparePrice ? parseFloat(comparePrice) : null,
      costPrice:   costPrice    ? parseFloat(costPrice)    : null,
      sku, stock: parseInt(stock) || 0, yards, badge,
      isFeatured:  isFeatured  === 'true' || isFeatured  === true,
      isBestseller:isBestseller=== 'true' || isBestseller=== true,
      metaTitle, metaDesc, sortOrder: parseInt(sortOrder) || 0,
      variants: variants ? {
        create: (typeof variants === 'string' ? JSON.parse(variants) : variants).map(v => ({
          name:  v.name,
          type:  v.type,
          value: v.value,
          stock: parseInt(v.stock) || 0,
          price: v.price ? parseFloat(v.price) : null,
        })),
      } : undefined,
    },
    include: { images: true, variants: true, category: true },
  });

  // Handle uploaded images (from Cloudinary via multer)
  if (req.files?.length) {
    const imageData = req.files.map((file, i) => ({
      productId: product.id,
      url:       file.path,
      publicId:  file.filename,
      isPrimary: i === 0,
      sortOrder: i,
    }));
    await prisma.productImage.createMany({ data: imageData });
  }

  const full = await prisma.product.findUnique({
    where: { id: product.id },
    include: { images: true, variants: true, category: true },
  });

  res.status(201).json({ success: true, message: 'Product created.', data: { product: full } });
};

// ── UPDATE PRODUCT (Admin) ─────────────────────────────────────
const updateProduct = async (req, res) => {
  const { id } = req.params;

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ success: false, message: 'Product not found.' });

  const {
    categoryId, name, description, fabric, technique, origin,
    price, comparePrice, costPrice, sku, stock, yards, badge,
    isFeatured, isBestseller, isActive, metaTitle, metaDesc, sortOrder,
  } = req.body;

  const updated = await prisma.product.update({
    where: { id },
    data:  {
      ...(categoryId   && { categoryId }),
      ...(name         && { name, slug: slugify(name, { lower: true, strict: true }) + '-' + id.slice(0, 6) }),
      ...(description  && { description }),
      ...(fabric       && { fabric }),
      ...(technique    && { technique }),
      ...(origin       && { origin }),
      ...(price        && { price:        parseFloat(price) }),
      ...(comparePrice && { comparePrice: parseFloat(comparePrice) }),
      ...(costPrice    && { costPrice:    parseFloat(costPrice) }),
      ...(sku          && { sku }),
      ...(stock        !== undefined && { stock: parseInt(stock) }),
      ...(yards        && { yards }),
      ...(badge        !== undefined && { badge: badge || null }),
      ...(isFeatured   !== undefined && { isFeatured:   isFeatured   === 'true' || isFeatured   === true }),
      ...(isBestseller !== undefined && { isBestseller: isBestseller === 'true' || isBestseller === true }),
      ...(isActive     !== undefined && { isActive:     isActive     === 'true' || isActive     === true }),
      ...(metaTitle    && { metaTitle }),
      ...(metaDesc     && { metaDesc }),
      ...(sortOrder    !== undefined && { sortOrder: parseInt(sortOrder) }),
    },
    include: { images: true, variants: true, category: true },
  });

  // Handle new uploaded images
  if (req.files?.length) {
    const imageData = req.files.map((file, i) => ({
      productId: id,
      url:       file.path,
      publicId:  file.filename,
      isPrimary: false,
      sortOrder: (updated.images?.length || 0) + i,
    }));
    await prisma.productImage.createMany({ data: imageData });
  }

  res.json({ success: true, message: 'Product updated.', data: { product: updated } });
};

// ── DELETE PRODUCT (Admin) ─────────────────────────────────────
const deleteProduct = async (req, res) => {
  const { id } = req.params;
  const product = await prisma.product.findUnique({ where: { id }, include: { images: true } });
  if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

  // Delete Cloudinary images
  await Promise.all(product.images.filter(i => i.publicId).map(i => deleteImage(i.publicId)));

  await prisma.product.delete({ where: { id } });
  res.json({ success: true, message: 'Product deleted.' });
};

// ── DELETE PRODUCT IMAGE ───────────────────────────────────────
const deleteProductImage = async (req, res) => {
  const { imageId } = req.params;
  const image = await prisma.productImage.findUnique({ where: { id: imageId } });
  if (!image) return res.status(404).json({ success: false, message: 'Image not found.' });

  if (image.publicId) await deleteImage(image.publicId);
  await prisma.productImage.delete({ where: { id: imageId } });

  res.json({ success: true, message: 'Image deleted.' });
};

// ── SET PRIMARY IMAGE ──────────────────────────────────────────
const setPrimaryImage = async (req, res) => {
  const { imageId } = req.params;
  const image = await prisma.productImage.findUnique({ where: { id: imageId } });
  if (!image) return res.status(404).json({ success: false, message: 'Image not found.' });

  await prisma.productImage.updateMany({ where: { productId: image.productId }, data: { isPrimary: false } });
  await prisma.productImage.update({ where: { id: imageId }, data: { isPrimary: true } });

  res.json({ success: true, message: 'Primary image updated.' });
};

module.exports = { getProducts, getProduct, createProduct, updateProduct, deleteProduct, deleteProductImage, setPrimaryImage };
