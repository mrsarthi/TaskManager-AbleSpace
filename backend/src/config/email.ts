import nodemailer from 'nodemailer';

/**
 * Email Configuration
 * Configures nodemailer for sending verification emails
 */
const createTransporter = () => {
  // For development, use Gmail or another SMTP service
  // For production, use a service like SendGrid, AWS SES, etc.
  
  const emailConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  };

  // If no SMTP credentials, use Ethereal (testing) or log to console
  if (!emailConfig.auth.user || !emailConfig.auth.pass) {
    console.warn('⚠️  SMTP credentials not configured. Email verification will not work.');
    console.warn('   Set SMTP_USER and SMTP_PASSWORD in .env file');
    return null;
  }

  return nodemailer.createTransport(emailConfig);
};

export const emailTransporter = createTransporter();

/**
 * Send verification email
 * @param to - Recipient email address
 * @param verificationToken - Email verification token
 * @param userName - User's name
 */
export async function sendVerificationEmail(
  to: string,
  verificationToken: string,
  userName: string
): Promise<void> {
  if (!emailTransporter) {
    throw new Error('Email service not configured');
  }

  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;

  const mailOptions = {
    from: `"Task Manager" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Verify Your Email Address - Task Manager',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #0ea5e9; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
            .button { display: inline-block; padding: 12px 30px; background-color: #0ea5e9; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Task Manager!</h1>
            </div>
            <div class="content">
              <p>Hi ${userName},</p>
              <p>Thank you for registering with Task Manager. Please verify your email address to complete your registration.</p>
              <p style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </p>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #0ea5e9;">${verificationUrl}</p>
              <p>This link will expire in 24 hours.</p>
              <p>If you didn't create an account, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Task Manager. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Welcome to Task Manager!
      
      Hi ${userName},
      
      Thank you for registering with Task Manager. Please verify your email address by clicking the link below:
      
      ${verificationUrl}
      
      This link will expire in 24 hours.
      
      If you didn't create an account, please ignore this email.
    `,
  };

  await emailTransporter.sendMail(mailOptions);
}

