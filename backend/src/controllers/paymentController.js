const prisma = require('../config/db');
const crypto = require('crypto');

// ─────────────────────────────────────────────────────────────
// PAYSTACK
// ─────────────────────────────────────────────────────────────

// Initialize Paystack transaction
const paystackInit = async (req, res) => {
  const { orderId } = req.body;
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
  if (order.userId !== req.user.id)
    return res.status(403).json({ success: false, message: 'Access denied.' });

  const reference = `PAY-${order.orderRef}-${Date.now()}`;
  const amountKobo = Math.round(parseFloat(order.total) * 100); // Paystack uses kobo

  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email:     order.shippingEmail,
      amount:    amountKobo,
      reference,
      currency:  'NGN',
      metadata: {
        orderId:    order.id,
        orderRef:   order.orderRef,
        customerId: req.user.id,
      },
      callback_url: `${process.env.FRONTEND_URL}/payment/verify?gateway=paystack&ref=${reference}`,
    }),
  });

  const data = await response.json();
  if (!data.status) return res.status(400).json({ success: false, message: data.message });

  // Save payment record
  await prisma.payment.upsert({
    where:  { orderId: order.id },
    create: { orderId: order.id, gateway: 'paystack', reference, amount: order.total, currency: 'NGN' },
    update: { reference, gateway: 'paystack' },
  });

  res.json({
    success: true,
    data: {
      authorizationUrl: data.data.authorization_url,
      accessCode:       data.data.access_code,
      reference:        data.data.reference,
    },
  });
};

// Verify Paystack payment
const paystackVerify = async (req, res) => {
  const { reference } = req.params;

  const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
  });
  const data = await response.json();

  if (!data.status || data.data.status !== 'success') {
    return res.status(400).json({ success: false, message: 'Payment verification failed.', data: data.data });
  }

  const payment = await prisma.payment.findUnique({ where: { reference } });
  if (!payment) return res.status(404).json({ success: false, message: 'Payment record not found.' });

  // Mark paid
  await prisma.$transaction([
    prisma.payment.update({
      where: { reference },
      data:  { status: 'PAID', gatewayRef: data.data.id?.toString(), paidAt: new Date(), metadata: data.data },
    }),
    prisma.order.update({
      where: { id: payment.orderId },
      data:  {
        paymentStatus: 'PAID',
        paymentRef:    reference,
        paidAt:        new Date(),
        status:        'CONFIRMED',
        statusHistory: { create: { status: 'CONFIRMED', note: 'Payment confirmed via Paystack.' } },
      },
    }),
  ]);

  const order = await prisma.order.findUnique({
    where:   { id: payment.orderId },
    include: { items: true },
  });

  res.json({ success: true, message: 'Payment successful.', data: { order } });
};

// Paystack webhook
const paystackWebhook = async (req, res) => {
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
    .update(req.body)
    .digest('hex');

  if (hash !== req.headers['x-paystack-signature']) {
    return res.status(400).json({ message: 'Invalid signature.' });
  }

  const event = JSON.parse(req.body);
  if (event.event === 'charge.success') {
    const { reference } = event.data;
    const payment = await prisma.payment.findUnique({ where: { reference } });
    if (payment && payment.status !== 'PAID') {
      await prisma.$transaction([
        prisma.payment.update({
          where: { reference },
          data:  { status: 'PAID', paidAt: new Date(), metadata: event.data },
        }),
        prisma.order.update({
          where: { id: payment.orderId },
          data:  {
            paymentStatus: 'PAID',
            status:        'CONFIRMED',
            paidAt:        new Date(),
            statusHistory: { create: { status: 'CONFIRMED', note: 'Confirmed via Paystack webhook.' } },
          },
        }),
      ]);
    }
  }

  res.sendStatus(200);
};

// ─────────────────────────────────────────────────────────────
// FLUTTERWAVE
// ─────────────────────────────────────────────────────────────

// Initialize Flutterwave payment
const flutterwaveInit = async (req, res) => {
  const { orderId } = req.body;
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
  if (order.userId !== req.user.id)
    return res.status(403).json({ success: false, message: 'Access denied.' });

  const txRef = `FLW-${order.orderRef}-${Date.now()}`;

  const response = await fetch('https://api.flutterwave.com/v3/payments', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tx_ref:       txRef,
      amount:       parseFloat(order.total),
      currency:     'NGN',
      redirect_url: `${process.env.FRONTEND_URL}/payment/verify?gateway=flutterwave&ref=${txRef}`,
      customer: {
        email: order.shippingEmail,
        name:  order.shippingName,
        phone: order.shippingPhone,
      },
      customizations: {
        title:       'Àṣọ Òkè Royale',
        description: `Payment for order ${order.orderRef}`,
        logo:        `${process.env.FRONTEND_URL}/logo.png`,
      },
      meta: { orderId: order.id, orderRef: order.orderRef },
    }),
  });

  const data = await response.json();
  if (data.status !== 'success') return res.status(400).json({ success: false, message: data.message });

  await prisma.payment.upsert({
    where:  { orderId: order.id },
    create: { orderId: order.id, gateway: 'flutterwave', reference: txRef, amount: order.total, currency: 'NGN' },
    update: { reference: txRef, gateway: 'flutterwave' },
  });

  res.json({ success: true, data: { paymentLink: data.data.link, reference: txRef } });
};

// Verify Flutterwave payment
const flutterwaveVerify = async (req, res) => {
  const { reference } = req.params;
  const { transaction_id } = req.query;

  if (!transaction_id) return res.status(400).json({ success: false, message: 'Transaction ID required.' });

  const response = await fetch(`https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`, {
    headers: { Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}` },
  });
  const data = await response.json();

  if (data.status !== 'success' || data.data.status !== 'successful') {
    return res.status(400).json({ success: false, message: 'Payment verification failed.', data: data.data });
  }

  const payment = await prisma.payment.findUnique({ where: { reference } });
  if (!payment) return res.status(404).json({ success: false, message: 'Payment record not found.' });

  await prisma.$transaction([
    prisma.payment.update({
      where: { reference },
      data:  { status: 'PAID', gatewayRef: transaction_id, paidAt: new Date(), metadata: data.data },
    }),
    prisma.order.update({
      where: { id: payment.orderId },
      data:  {
        paymentStatus: 'PAID',
        paymentRef:    reference,
        paidAt:        new Date(),
        status:        'CONFIRMED',
        statusHistory: { create: { status: 'CONFIRMED', note: 'Payment confirmed via Flutterwave.' } },
      },
    }),
  ]);

  const order = await prisma.order.findUnique({
    where:   { id: payment.orderId },
    include: { items: true },
  });

  res.json({ success: true, message: 'Payment successful.', data: { order } });
};

// Flutterwave webhook
const flutterwaveWebhook = async (req, res) => {
  const secretHash = process.env.FLUTTERWAVE_SECRET_KEY;
  const signature  = req.headers['verif-hash'];
  if (signature !== secretHash) return res.status(400).json({ message: 'Invalid signature.' });

  const event = JSON.parse(req.body);
  if (event.event === 'charge.completed' && event.data.status === 'successful') {
    const reference = event.data.tx_ref;
    const payment   = await prisma.payment.findUnique({ where: { reference } });
    if (payment && payment.status !== 'PAID') {
      await prisma.$transaction([
        prisma.payment.update({
          where: { reference },
          data:  { status: 'PAID', paidAt: new Date(), metadata: event.data },
        }),
        prisma.order.update({
          where: { id: payment.orderId },
          data:  {
            paymentStatus: 'PAID',
            status:        'CONFIRMED',
            paidAt:        new Date(),
            statusHistory: { create: { status: 'CONFIRMED', note: 'Confirmed via Flutterwave webhook.' } },
          },
        }),
      ]);
    }
  }

  res.sendStatus(200);
};

module.exports = {
  paystackInit, paystackVerify, paystackWebhook,
  flutterwaveInit, flutterwaveVerify, flutterwaveWebhook,
};
