const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const GOLD    = '#C4A45A';
const DARK    = '#1A1A1A';
const CREAM   = '#FDFBF7';
const SITE    = process.env.STORE_URL || 'https://asookeroyale.ng';
const NAME    = process.env.STORE_NAME || 'Àṣọ Òkè Royale';

const baseLayout = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${NAME}</title>
</head>
<body style="margin:0;padding:0;background:#F3EDE0;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F3EDE0;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:${CREAM};max-width:600px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="background:${DARK};padding:28px 40px;text-align:center;">
            <div style="color:${GOLD};font-size:22px;letter-spacing:6px;font-weight:bold;">${NAME}</div>
            <div style="color:rgba(255,255,255,.45);font-size:10px;letter-spacing:4px;margin-top:4px;">LUXURY ASO OKE</div>
          </td>
        </tr>
        <!-- Content -->
        <tr><td style="padding:40px;">${content}</td></tr>
        <!-- Footer -->
        <tr>
          <td style="background:${DARK};padding:24px 40px;text-align:center;">
            <p style="color:rgba(255,255,255,.4);font-size:11px;margin:0;line-height:1.8;">
              © ${new Date().getFullYear()} ${NAME} · <a href="${SITE}" style="color:${GOLD};text-decoration:none;">${SITE}</a><br/>
              Honoring the legacy of Yoruba master weavers in Iseyin, Oyo State.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

// ── WELCOME EMAIL ──────────────────────────────────────────────
const sendWelcomeEmail = async (user) => {
  const html = baseLayout(`
    <h2 style="color:${DARK};font-size:28px;margin:0 0 16px;">Welcome, ${user.firstName}!</h2>
    <div style="width:48px;height:2px;background:${GOLD};margin-bottom:24px;"></div>
    <p style="color:#555;line-height:1.8;font-size:15px;">
      Your account has been created at <strong>${NAME}</strong>. You now have access to our full collection of authentic, hand-woven Aso Oke fabrics.
    </p>
    <p style="color:#555;line-height:1.8;font-size:15px;">
      Explore our bridal sets, Aso Ebi packages, and bespoke custom orders — all crafted by master weavers in Iseyin, Oyo State.
    </p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${SITE}/shop" style="background:${GOLD};color:${DARK};padding:14px 36px;text-decoration:none;font-family:Arial,sans-serif;font-size:13px;letter-spacing:3px;font-weight:bold;display:inline-block;">
        EXPLORE COLLECTIONS
      </a>
    </div>
    <p style="color:#999;font-size:12px;line-height:1.6;border-top:1px solid #E8E0D0;padding-top:16px;margin-top:24px;">
      If you did not create this account, please ignore this email.
    </p>
  `);

  await transporter.sendMail({
    from:    process.env.EMAIL_FROM,
    to:      user.email,
    subject: `Welcome to ${NAME} ✦`,
    html,
  });
};

// ── ORDER CONFIRMATION EMAIL ───────────────────────────────────
const sendOrderConfirmationEmail = async (order) => {
  const itemRows = (order.items || []).map(item => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #E8E0D0;color:#333;font-size:14px;">
        ${item.productName}${item.variantName ? ` (${item.variantName})` : ''}
      </td>
      <td style="padding:12px 0;border-bottom:1px solid #E8E0D0;text-align:center;color:#555;font-size:14px;">
        ×${item.quantity}
      </td>
      <td style="padding:12px 0;border-bottom:1px solid #E8E0D0;text-align:right;color:${DARK};font-size:14px;font-weight:bold;">
        ₦${parseFloat(item.subtotal).toLocaleString()}
      </td>
    </tr>
  `).join('');

  const html = baseLayout(`
    <div style="text-align:center;margin-bottom:32px;">
      <div style="font-size:48px;margin-bottom:8px;">✦</div>
      <h2 style="color:${DARK};font-size:26px;margin:0 0 8px;">Order Confirmed!</h2>
      <p style="color:#777;font-size:14px;margin:0;">Reference: <strong style="color:${DARK};">${order.orderRef}</strong></p>
    </div>

    <p style="color:#555;line-height:1.8;font-size:15px;">
      Dear ${order.userName || order.shippingName}, thank you for your order. Our team will begin processing it shortly.
    </p>

    <div style="background:#F9F4E8;border:1px solid #E8E0D0;padding:24px;margin:24px 0;">
      <h3 style="color:${DARK};font-size:14px;letter-spacing:3px;margin:0 0 16px;font-family:Arial,sans-serif;">ORDER SUMMARY</h3>
      <table width="100%" cellpadding="0" cellspacing="0">
        <thead>
          <tr>
            <th style="text-align:left;font-size:11px;letter-spacing:2px;color:#999;padding-bottom:8px;font-family:Arial,sans-serif;">ITEM</th>
            <th style="text-align:center;font-size:11px;letter-spacing:2px;color:#999;padding-bottom:8px;font-family:Arial,sans-serif;">QTY</th>
            <th style="text-align:right;font-size:11px;letter-spacing:2px;color:#999;padding-bottom:8px;font-family:Arial,sans-serif;">TOTAL</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
        <tr>
          <td style="color:#777;font-size:13px;padding:4px 0;">Subtotal</td>
          <td style="text-align:right;color:#555;font-size:13px;padding:4px 0;">₦${parseFloat(order.subtotal).toLocaleString()}</td>
        </tr>
        <tr>
          <td style="color:#777;font-size:13px;padding:4px 0;">Shipping</td>
          <td style="text-align:right;color:#555;font-size:13px;padding:4px 0;">${parseFloat(order.shippingFee) === 0 ? 'FREE' : '₦' + parseFloat(order.shippingFee).toLocaleString()}</td>
        </tr>
        ${parseFloat(order.discount) > 0 ? `
        <tr>
          <td style="color:#777;font-size:13px;padding:4px 0;">Discount</td>
          <td style="text-align:right;color:green;font-size:13px;padding:4px 0;">-₦${parseFloat(order.discount).toLocaleString()}</td>
        </tr>` : ''}
        <tr>
          <td style="color:${DARK};font-size:16px;font-weight:bold;padding-top:12px;border-top:2px solid ${GOLD};">TOTAL</td>
          <td style="text-align:right;color:${DARK};font-size:16px;font-weight:bold;padding-top:12px;border-top:2px solid ${GOLD};">₦${parseFloat(order.total).toLocaleString()}</td>
        </tr>
      </table>
    </div>

    <div style="background:#F9F4E8;border:1px solid #E8E0D0;padding:20px;margin-bottom:24px;">
      <h3 style="color:${DARK};font-size:12px;letter-spacing:3px;margin:0 0 12px;font-family:Arial,sans-serif;">DELIVERY ADDRESS</h3>
      <p style="color:#555;font-size:14px;line-height:1.7;margin:0;">
        ${order.shippingName}<br/>
        ${order.shippingStreet}<br/>
        ${order.shippingCity}, ${order.shippingState}<br/>
        ${order.shippingCountry}<br/>
        ${order.shippingPhone}
      </p>
    </div>

    <div style="text-align:center;margin:28px 0;">
      <a href="${SITE}/account/orders/${order.orderRef}" style="background:${DARK};color:${CREAM};padding:14px 36px;text-decoration:none;font-family:Arial,sans-serif;font-size:12px;letter-spacing:3px;font-weight:bold;display:inline-block;">
        TRACK MY ORDER
      </a>
    </div>

    <p style="color:#999;font-size:12px;line-height:1.7;border-top:1px solid #E8E0D0;padding-top:16px;margin-top:8px;text-align:center;">
      Questions? WhatsApp us or reply to this email.<br/>
      We typically respond within 2 business hours.
    </p>
  `);

  await transporter.sendMail({
    from:    process.env.EMAIL_FROM,
    to:      order.userEmail || order.shippingEmail,
    subject: `Order Confirmed: ${order.orderRef} — ${NAME}`,
    html,
  });
};

// ── ORDER STATUS UPDATE EMAIL ──────────────────────────────────
const sendOrderStatusEmail = async ({ order, status, trackingNumber }) => {
  const messages = {
    CONFIRMED:   'Your order has been confirmed and our weavers are preparing it.',
    PROCESSING:  'Your order is now being processed and packaged with care.',
    SHIPPED:     `Your order is on its way!${trackingNumber ? ` Tracking: <strong>${trackingNumber}</strong>` : ''}`,
    DELIVERED:   'Your order has been delivered. We hope you love it!',
    CANCELLED:   'Your order has been cancelled. If you have questions, please contact us.',
  };

  const html = baseLayout(`
    <h2 style="color:${DARK};font-size:26px;margin:0 0 8px;">Order Update</h2>
    <div style="width:48px;height:2px;background:${GOLD};margin-bottom:24px;"></div>
    <p style="color:#555;font-size:15px;">Reference: <strong>${order.orderRef}</strong></p>
    <div style="background:#F9F4E8;border-left:4px solid ${GOLD};padding:20px;margin:20px 0;">
      <p style="color:${DARK};font-size:16px;margin:0;font-weight:bold;">${status.replace('_', ' ')}</p>
      <p style="color:#555;font-size:14px;margin:8px 0 0;line-height:1.7;">${messages[status] || 'Your order status has been updated.'}</p>
    </div>
    <div style="text-align:center;margin:24px 0;">
      <a href="${SITE}/account/orders/${order.orderRef}" style="background:${GOLD};color:${DARK};padding:14px 36px;text-decoration:none;font-family:Arial,sans-serif;font-size:12px;letter-spacing:3px;font-weight:bold;display:inline-block;">
        VIEW ORDER
      </a>
    </div>
  `);

  await transporter.sendMail({
    from:    process.env.EMAIL_FROM,
    to:      order.shippingEmail,
    subject: `Order ${status}: ${order.orderRef} — ${NAME}`,
    html,
  });
};

module.exports = { sendWelcomeEmail, sendOrderConfirmationEmail, sendOrderStatusEmail };
