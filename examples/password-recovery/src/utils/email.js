const nodemailer = require('nodemailer');

function buildTransport() {
  const service = (process.env.EMAIL_SERVICE || 'smtp').toLowerCase();

  if (service !== 'smtp') {
    // For this example, keep it simple: SMTP only.
    // Users can swap in SendGrid/Mailgun as needed.
    throw new Error(`Unsupported EMAIL_SERVICE for this example: ${service} (use smtp)`);
  }

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || 'false') === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  // If SMTP isn't configured, fall back to console logging.
  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass }
  });
}

async function sendResetEmail(toEmail, resetLink, expiresAt) {
  const from = process.env.EMAIL_FROM || 'noreply@example.com';
  const transport = buildTransport();

  if (!transport) {
    console.log('[password-recovery] Email disabled (missing SMTP config). Reset link:');
    console.log(resetLink);
    console.log(`Expires at: ${expiresAt.toISOString()}`);
    return true;
  }

  await transport.sendMail({
    from,
    to: toEmail,
    subject: 'Password Reset Request',
    text: `You requested a password reset.\n\nReset link: ${resetLink}\n\nThis link expires at ${expiresAt.toISOString()}\n\nIf you didn't request this, ignore this email.`
  });

  return true;
}

async function sendPasswordChangedEmail(toEmail) {
  const from = process.env.EMAIL_FROM || 'noreply@example.com';
  const transport = buildTransport();

  if (!transport) {
    console.log('[password-recovery] Email disabled (missing SMTP config). Password changed for:', toEmail);
    return true;
  }

  await transport.sendMail({
    from,
    to: toEmail,
    subject: 'Your password was changed',
    text: `Your password was changed successfully.\n\nIf you didn't do this, contact support immediately.`
  });

  return true;
}

module.exports = { sendResetEmail, sendPasswordChangedEmail };

