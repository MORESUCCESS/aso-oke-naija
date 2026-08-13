const { PrismaClient } = require('@prisma/client');
const bcrypt  = require('bcryptjs');
const slugify = require('slugify');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Àṣọ Òkè Royale database...\n');

  // ── ADMIN USER ─────────────────────────────────────────────
  const adminPass = await bcrypt.hash('Admin@123', 12);
  const admin = await prisma.user.upsert({
    where:  { email: 'admin@asookeroyale.ng' },
    update: {},
    create: {
      email:     'admin@asookeroyale.ng',
      password:  adminPass,
      firstName: 'Àṣọ Òkè',
      lastName:  'Admin',
      role:      'SUPER_ADMIN',
      isVerified:true,
    },
  });
  console.log(`✅ Admin: ${admin.email} / Admin@123`);

  // ── CATEGORIES ─────────────────────────────────────────────
  const categoryData = [
    { name: 'Gele',        description: 'Traditional head wraps for women',                color: '#5c1010', sortOrder: 1 },
    { name: 'Ipele',       description: 'Elegant shoulder and body wraps',                 color: '#2d5016', sortOrder: 2 },
    { name: 'Etu',         description: 'Classic dark indigo hand-woven fabric',           color: '#0a1a3a', sortOrder: 3 },
    { name: 'Sanyan',      description: 'Prestigious natural silk weave',                  color: '#5c3210', sortOrder: 4 },
    { name: 'Alaari',      description: 'Vibrant bright ceremonial fabric',                color: '#8b2200', sortOrder: 5 },
    { name: 'Bridal Sets', description: 'Complete bridal and groom Aso Oke collections',  color: '#5c4a00', sortOrder: 6 },
    { name: 'Agbada',      description: 'Flowing ceremonial robes for men',                color: '#1a2a3a', sortOrder: 7 },
    { name: 'Aso Ebi',     description: 'Matching group fabric packages for events',       color: '#2d1f5c', sortOrder: 8 },
  ];

  const categories = {};
  for (const cat of categoryData) {
    const slug = slugify(cat.name, { lower: true, strict: true });
    const c    = await prisma.category.upsert({
      where:  { slug },
      update: cat,
      create: { ...cat, slug },
    });
    categories[cat.name] = c;
    console.log(`  📂 ${cat.name}`);
  }
  console.log('✅ Categories seeded\n');

  // ── PRODUCTS ───────────────────────────────────────────────
  const productData = [
    {
      category: 'Gele', name: 'Royal Gold Gele Set', fabric: 'Etu', technique: 'Hand-woven Strip Loom',
      price: 45000, comparePrice: 55000, stock: 15, yards: '5 yards',
      badge: 'Bestseller', isFeatured: true, isBestseller: true,
      description: 'A magnificent gold-threaded gele set perfect for owambe ceremonies. Hand-woven in Iseyin with pure metallic thread and traditional Yoruba patterns.',
      variants: [
        { name: 'Gold', type: 'color', value: '#C4A45A', stock: 5 },
        { name: 'Cream', type: 'color', value: '#F5F0E8', stock: 5 },
        { name: 'Burgundy', type: 'color', value: '#8B1A4A', stock: 5 },
      ],
    },
    {
      category: 'Etu', name: 'Indigo Etu Classic Drape', fabric: 'Etu', technique: 'Strip Loom',
      price: 38000, stock: 20, yards: '4 yards',
      badge: null, isFeatured: true,
      description: 'Classic dark indigo etu fabric — a timeless Yoruba textile traditionally worn by elders and dignitaries at high-level ceremonies.',
      variants: [
        { name: 'Indigo', type: 'color', value: '#1a2a4a', stock: 10 },
        { name: 'Navy', type: 'color', value: '#0a0a2a', stock: 10 },
      ],
    },
    {
      category: 'Ipele', name: 'Crimson Ipele Prestige', fabric: 'Alaari', technique: 'Hand-woven',
      price: 28000, comparePrice: 35000, stock: 12, yards: '3 yards',
      badge: 'Sale', isFeatured: true,
      description: 'A vibrant crimson ipele with golden edge detailing. Versatile for ceremonies and chieftaincy events across Yorubaland.',
      variants: [
        { name: 'Crimson', type: 'color', value: '#8b1a1a', stock: 6 },
        { name: 'Gold', type: 'color', value: '#C4A45A', stock: 6 },
      ],
    },
    {
      category: 'Sanyan', name: 'Honey Sanyan Silk Premium', fabric: 'Sanyan', technique: 'Silk Strip Loom',
      price: 52000, stock: 8, yards: '5 yards',
      badge: 'Premium', isFeatured: true, isBestseller: true,
      description: 'Exquisite honey-brown sanyan silk — the most prestigious Aso Oke variety, woven to a lustrous finish. Ideal for high-ranking occasions.',
      variants: [
        { name: 'Honey Brown', type: 'color', value: '#8B7355', stock: 4 },
        { name: 'Natural Cream', type: 'color', value: '#F5F0E8', stock: 4 },
      ],
    },
    {
      category: 'Bridal Sets', name: 'The Alari Royale Bridal Set', fabric: 'Alaari', technique: 'Hand-woven Strip Loom',
      price: 120000, stock: 5, yards: '12 yards',
      badge: 'Bridal', isFeatured: true,
      description: 'The crown jewel of our bridal collection. Complete bride and groom matching Aso Oke set, woven with 24-carat gold thread and authentic Yoruba patterns.',
      variants: [
        { name: 'Burgundy & Gold', type: 'color', value: '#8B1A4A', stock: 2 },
        { name: 'Royal Blue & Gold', type: 'color', value: '#1A2B8B', stock: 2 },
        { name: 'Forest Green & Gold', type: 'color', value: '#1A5C3A', stock: 1 },
      ],
    },
    {
      category: 'Gele', name: 'Forest Green Ceremonial Gele', fabric: 'Etu', technique: 'Hand-woven',
      price: 42000, stock: 10, yards: '5 yards',
      badge: null,
      description: 'Deep forest green gele with copper thread borders. Perfect for thanksgiving services, family events, and cultural festivals.',
      variants: [
        { name: 'Forest Green', type: 'color', value: '#1A5C3A', stock: 5 },
        { name: 'Copper', type: 'color', value: '#8B4513', stock: 5 },
      ],
    },
    {
      category: 'Agbada', name: 'Presidential Agbada Set', fabric: 'Sanyan', technique: 'Grand Loom',
      price: 85000, stock: 6, yards: '8 yards',
      badge: 'New', isFeatured: true,
      description: 'A flowing presidential agbada crafted from premium sanyan fabric. Complete with matching trouser, sokoto, and embroidered cap.',
      variants: [
        { name: 'White & Gold', type: 'color', value: '#F5F0E8', stock: 2 },
        { name: 'Navy Blue', type: 'color', value: '#1A2B8B', stock: 2 },
        { name: 'Coffee Brown', type: 'color', value: '#5c3210', stock: 2 },
      ],
    },
    {
      category: 'Aso Ebi', name: 'Family Aso Ebi Package (10 sets)', fabric: 'Alaari', technique: 'Strip Loom',
      price: 180000, stock: 20, yards: '40 yards',
      badge: 'Package',
      description: 'Complete Aso Ebi package for 10 people. Uniform fabric in your chosen colour for family matching at weddings, naming ceremonies, and celebrations.',
      variants: [
        { name: 'Burgundy', type: 'color', value: '#8B1A4A', stock: 7 },
        { name: 'Royal Blue', type: 'color', value: '#1A2B8B', stock: 7 },
        { name: 'Emerald Green', type: 'color', value: '#1A5C3A', stock: 6 },
      ],
    },
  ];

  for (const p of productData) {
    const cat  = categories[p.category];
    const slug = slugify(p.name, { lower: true, strict: true }) + '-' + Date.now().toString(36);
    const { category, variants, ...rest } = p;

    await prisma.product.upsert({
      where:  { slug },
      update: {},
      create: {
        ...rest,
        categoryId: cat.id,
        slug,
        origin: 'Iseyin, Oyo State',
        variants: { create: variants || [] },
      },
    });
    console.log(`  🛍  ${p.name}`);
  }
  console.log('✅ Products seeded\n');

  // ── SETTINGS ───────────────────────────────────────────────
  const settingsData = {
    site_name:            'Àṣọ Òkè Royale',
    tagline:              'Home of Bespoke & Quality Aso Oke',
    phone:                '+234 803 000 0000',
    whatsapp:             '2348030000000',
    email:                'hello@asookeroyale.ng',
    address:              '12 Textile Lane, Iseyin, Oyo State, Nigeria',
    instagram:            'https://instagram.com/asookeroyale',
    facebook:             'https://facebook.com/asookeroyale',
    twitter:              'https://twitter.com/asookeroyale',
    currency:             'NGN',
    country:              'Nigeria',
    delivery_fee:         '3500',
    free_delivery_above:  '80000',
    hero_title:           'Woven in Gold & Thread',
    hero_subtitle:        "Authentic hand-woven Aso Oke from Nigeria's finest artisans — gele, ipele, etu, sanyan, and alaari for every occasion.",
    about_text:           'We are a household name in Aso Oke with over three decades in the trade. Our work is guided by Quality, Timeliness, and Uniqueness.',
    primary_color:        '#C4A45A',
    accent_color:         '#8b1a1a',
    tax_rate:             '0',
    paystack_public_key:  '',
    flutterwave_public_key: '',
  };

  for (const [key, value] of Object.entries(settingsData)) {
    await prisma.setting.upsert({
      where:  { key },
      update: { value },
      create: { key, value },
    });
  }
  console.log('✅ Settings seeded\n');

  // ── COUPONS ────────────────────────────────────────────────
  const coupons = [
    { code: 'ROYALE10',  type: 'PERCENTAGE', value: 10, description: '10% off all orders' },
    { code: 'NEWCUST20', type: 'PERCENTAGE', value: 20, description: '20% off for new customers', minOrderAmount: 30000 },
    { code: 'BRIDAL5K',  type: 'FIXED',      value: 5000, description: '₦5,000 off bridal orders', minOrderAmount: 80000 },
  ];

  for (const c of coupons) {
    await prisma.coupon.upsert({
      where:  { code: c.code },
      update: {},
      create: { ...c, value: parseFloat(c.value), minOrderAmount: c.minOrderAmount ? parseFloat(c.minOrderAmount) : null },
    });
    console.log(`  🎟  ${c.code} — ${c.description}`);
  }
  console.log('✅ Coupons seeded\n');

  // ── SHIPPING ZONES ─────────────────────────────────────────
  const zones = [
    { name: 'Lagos',           states: ['Lagos'],                            rate: 2500, freeAbove: 80000 },
    { name: 'Abuja (FCT)',     states: ['FCT', 'Abuja'],                    rate: 3000, freeAbove: 80000 },
    { name: 'South West',      states: ['Oyo','Osun','Ogun','Ekiti','Ondo'], rate: 2000, freeAbove: 60000 },
    { name: 'South South',     states: ['Rivers','Delta','Edo','Bayelsa','Akwa Ibom','Cross River'], rate: 3500, freeAbove: 100000 },
    { name: 'South East',      states: ['Anambra','Imo','Abia','Enugu','Ebonyi'], rate: 3500, freeAbove: 100000 },
    { name: 'North Central',   states: ['Kogi','Kwara','Nasarawa','Niger','Benue','Plateau'], rate: 3000, freeAbove: 80000 },
    { name: 'North West',      states: ['Kano','Kaduna','Zamfara','Sokoto','Kebbi','Jigawa','Katsina'], rate: 4000 },
    { name: 'North East',      states: ['Borno','Yobe','Gombe','Bauchi','Taraba','Adamawa'], rate: 4500 },
    { name: 'International',   states: ['International','Outside Nigeria'],  rate: 25000 },
  ];

  for (const z of zones) {
    const existing = await prisma.shippingZone.findFirst({ where: { name: z.name } });
    if (!existing) {
      await prisma.shippingZone.create({
        data: { ...z, rate: parseFloat(z.rate), freeAbove: z.freeAbove ? parseFloat(z.freeAbove) : null },
      });
      console.log(`  🚚 ${z.name} — ₦${z.rate.toLocaleString()}`);
    }
  }
  console.log('✅ Shipping zones seeded\n');

  console.log('✦ Database seeded successfully!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('ADMIN LOGIN:');
  console.log('  Email:    admin@asookeroyale.ng');
  console.log('  Password: Admin@123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => { console.error('❌ Seed error:', e); process.exit(1); })
  .finally(async () => await prisma.$disconnect());
