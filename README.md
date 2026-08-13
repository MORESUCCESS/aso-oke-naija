# Àṣọ Òkè Royale — Full-Stack E-Commerce

A production-grade Nigerian Aso Oke e-commerce platform built as a final year project.

## Tech Stack
- **Frontend:** React 18 + Vite + Tailwind CSS
- **Backend:** Node.js + Express
- **Database:** PostgreSQL (via Prisma ORM)
- **Payments:** Paystack + Flutterwave
- **Images:** Cloudinary
- **Email:** Nodemailer

## Quick Start

### 1. Clone & Install
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure Environment
```bash
cd backend
cp .env.example .env
# Fill in your DATABASE_URL, Paystack keys, Flutterwave keys, Cloudinary credentials, SMTP
```

### 3. Setup Database
```bash
cd backend
npx prisma generate
npx prisma db push
npm run db:seed
```

### 4. Run Development
```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Visit: http://localhost:5173
API: http://localhost:5000/api/health
Admin: http://localhost:5173/admin
Admin login: admin@asookeroyale.ng / Admin@123

## Production Deployment

### Railway / Render (Recommended for beginners)
1. Push to GitHub
2. Connect repo on Railway.app
3. Add environment variables in Railway dashboard
4. Railway auto-detects Node.js and deploys

### VPS (Ubuntu)
```bash
sudo apt update && sudo apt install nodejs npm postgresql nginx -y
git clone <your-repo>
cd asooke-royale/backend
cp .env.example .env && nano .env
npm install
npx prisma db push && npm run db:seed
npm install -g pm2
pm2 start src/index.js --name asooke-api
cd ../frontend && npm run build
# Serve frontend/dist with Nginx
```

## Admin Panel Features
- Dashboard with live stats
- Product management with Cloudinary image upload
- Category management with images
- Order management with status updates
- Customer management
- Coupon management
- Shipping zone configuration
- Contact messages
- Site settings

## Payment Flow
1. Customer adds items to cart & checks out
2. Selects Paystack or Flutterwave
3. Redirected to secure payment page
4. On success → redirected back to /payment/verify
5. Verification confirms payment & updates order
6. Order confirmation email sent automatically

## Default Coupon Codes
- `ROYALE10` — 10% off all orders
- `NEWCUST20` — 20% off (min order ₦30,000)
- `BRIDAL5K` — ₦5,000 off bridal orders (min ₦80,000)
