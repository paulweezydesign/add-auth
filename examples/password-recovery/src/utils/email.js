import nodemailer from 'nodemailer';

// Create transporter based on configuration
const createTransporter = () => {
  const host = process.env.SMTP_HOST ?? 'smtp.ethereal.email';
  const port = parseInt(process.env.SMTP_PORT ?? '587', 10);
  const secure = process.env.SMTP_SECURE === 'true';

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (email, resetToken) => {
  const transporter = createTransporter();
  const baseUrl = process.env.BASE_URL ?? 'http://localhost:3004';
  const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;
  const fromEmail = process.env.EMAIL_FROM ?? 'noreply@example.com';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .button {
          background-color: #007bff;
          color: white !important;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 4px;
          display: inline-block;
          margin: 20px 0;
        }
        .footer { margin-top: 30px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Password Reset Request</h2>
        <p>Hello,</p>
        <p>You requested a password reset for your account.</p>
        <p>Click the button below to reset your password:</p>
        <p>
          <a href="${resetLink}" class="button">Reset Password</a>
        </p>
        <p>Or copy and paste this link into your browser:</p>
        <p><code>${resetLink}</code></p>
        <p><strong>This link expires in 1 hour.</strong></p>
        <p>If you didn't request this, please ignore this email. Your password will remain unchanged.</p>
        <div class="footer">
          <p>Best regards,<br>Your App Team</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Password Reset Request

Hello,

You requested a password reset for your account.

Click the link below to reset your password:
${resetLink}

This link expires in 1 hour.

If you didn't request this, please ignore this email. Your password will remain unchanged.

Best regards,
Your App Team
  `;

  try {
    const info = await transporter.sendMail({
      from: fromEmail,
      to: email,
      subject: 'Password Reset Request',
      text: textContent,
      html: htmlContent,
    });

    console.log('Password reset email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return false;
  }
};

/**
 * Send password changed confirmation email
 */
export const sendPasswordChangedEmail = async (email, ipAddress = 'Unknown') => {
  const transporter = createTransporter();
  const fromEmail = process.env.EMAIL_FROM ?? 'noreply@example.com';
  const timestamp = new Date().toISOString();

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .alert { background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 4px; }
        .footer { margin-top: 30px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Password Changed</h2>
        <p>Hello,</p>
        <p>Your password was successfully changed.</p>
        <p><strong>Time:</strong> ${timestamp}</p>
        <p><strong>IP Address:</strong> ${ipAddress}</p>
        <div class="alert">
          <p><strong>If you didn't make this change,</strong> please contact support immediately and reset your password.</p>
        </div>
        <div class="footer">
          <p>Best regards,<br>Your App Team</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Password Changed

Hello,

Your password was successfully changed.

Time: ${timestamp}
IP Address: ${ipAddress}

If you didn't make this change, please contact support immediately and reset your password.

Best regards,
Your App Team
  `;

  try {
    const info = await transporter.sendMail({
      from: fromEmail,
      to: email,
      subject: 'Password Changed',
      text: textContent,
      html: htmlContent,
    });

    console.log('Password changed email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Failed to send password changed email:', error);
    return false;
  }
};
