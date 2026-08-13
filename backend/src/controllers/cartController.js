const prisma = require('../config/db');

const getOrCreateCart = async (userId) => {
  let cart = await prisma.cart.findUnique({
    where:   { userId },
    include: {
      items: {
        include: {
          product: {
            include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 }, category: true },
          },
          variant: true,
        },
      },
    },
  });
  if (!cart) cart = await prisma.cart.create({ data: { userId }, include: { items: true } });
  return cart;
};

const formatCart = (cart) => {
  const items    = cart.items.map(item => ({
    id:          item.id,
    productId:   item.productId,
    variantId:   item.variantId,
    quantity:    item.quantity,
    product: {
      id:          item.product.id,
      name:        item.product.name,
      slug:        item.product.slug,
      price:       parseFloat(item.product.price),
      image:       item.product.images[0]?.url || null,
      stock:       item.product.stock,
      category:    item.product.category?.name,
    },
    variant:     item.variant ? { id: item.variant.id, name: item.variant.name, type: item.variant.type, value: item.variant.value, price: item.variant.price ? parseFloat(item.variant.price) : null } : null,
    unitPrice:   item.variant?.price ? parseFloat(item.variant.price) : parseFloat(item.product.price),
    subtotal:    (item.variant?.price ? parseFloat(item.variant.price) : parseFloat(item.product.price)) * item.quantity,
  }));

  const subtotal   = items.reduce((s, i) => s + i.subtotal, 0);
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);

  return { id: cart.id, items, subtotal, totalItems };
};

// GET CART
const getCart = async (req, res) => {
  const cart = await getOrCreateCart(req.user.id);
  res.json({ success: true, data: { cart: formatCart(cart) } });
};

// ADD TO CART
const addToCart = async (req, res) => {
  const { productId, variantId, quantity = 1 } = req.body;
  if (!productId) return res.status(400).json({ success: false, message: 'Product ID required.' });

  const product = await prisma.product.findUnique({ where: { id: productId, isActive: true } });
  if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
  if (product.stock < quantity) return res.status(400).json({ success: false, message: 'Insufficient stock.' });

  let cart = await prisma.cart.findUnique({ where: { userId: req.user.id } });
  if (!cart) cart = await prisma.cart.create({ data: { userId: req.user.id } });

  const existing = await prisma.cartItem.findFirst({
  where: {
    cartId: cart.id,
    productId,
    variantId: variantId ?? null,
    },
  });
  if (existing) {
    const newQty = existing.quantity + parseInt(quantity);
    if (product.stock < newQty) return res.status(400).json({ success: false, message: 'Insufficient stock.' });
    await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: newQty } });
  } else {
    await prisma.cartItem.create({
      data: { cartId: cart.id, productId, variantId: variantId || null, quantity: parseInt(quantity) },
    });
  }

  const updated = await getOrCreateCart(req.user.id);
  res.json({ success: true, message: 'Added to cart.', data: { cart: formatCart(updated) } });
};

// UPDATE CART ITEM
const updateCartItem = async (req, res) => {
  const { itemId }  = req.params;
  const { quantity } = req.body;

  if (quantity < 1) return res.status(400).json({ success: false, message: 'Quantity must be at least 1.' });

  const item = await prisma.cartItem.findUnique({ where: { id: itemId }, include: { cart: true, product: true } });
  if (!item || item.cart.userId !== req.user.id) return res.status(404).json({ success: false, message: 'Cart item not found.' });
  if (item.product.stock < quantity) return res.status(400).json({ success: false, message: 'Insufficient stock.' });

  await prisma.cartItem.update({ where: { id: itemId }, data: { quantity: parseInt(quantity) } });

  const updated = await getOrCreateCart(req.user.id);
  res.json({ success: true, message: 'Cart updated.', data: { cart: formatCart(updated) } });
};

// REMOVE CART ITEM
const removeCartItem = async (req, res) => {
  const { itemId } = req.params;
  console.log('itemId received:', itemId);
  const item = await prisma.cartItem.findUnique({ where: { id: itemId }, include: { cart: true } });
  console.log('item found:', item);
  if (!item || item.cart.userId !== req.user.id) return res.status(404).json({ success: false, message: 'Cart item not found.' });
  await prisma.cartItem.delete({ where: { id: itemId } });
  const updated = await getOrCreateCart(req.user.id);
  res.json({ success: true, message: 'Item removed.', data: { cart: formatCart(updated) } });
};

// CLEAR CART
const clearCart = async (req, res) => {
  const cart = await prisma.cart.findUnique({ where: { userId: req.user.id } });
  if (cart) await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  res.json({ success: true, message: 'Cart cleared.', data: { cart: { items: [], subtotal: 0, totalItems: 0 } } });
};

module.exports = { getCart, addToCart, updateCartItem, removeCartItem, clearCart };
