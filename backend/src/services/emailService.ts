import nodemailer from 'nodemailer';

// Email configuration from environment variables
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const FROM_EMAIL = process.env.FROM_EMAIL || SMTP_USER || 'noreply@petflix.com';
const FROM_NAME = process.env.FROM_NAME || 'Petflix';

// Create transporter
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465, // true for 465, false for other ports
  auth: SMTP_USER && SMTP_PASS ? {
    user: SMTP_USER,
    pass: SMTP_PASS,
  } : undefined,
});

/**
 * Send email notification when someone tries to sign up with existing email
 */
export const sendSignupAttemptEmail = async (email: string, username: string, attemptEmail: string, attemptUsername: string) => {
  if (!transporter) {
    console.warn('[Email] SMTP not configured. Skipping email notification.');
    return;
  }

  try {
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Security Alert - Petflix</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #0F0F0F;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #0F0F0F;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header with red background -->
          <tr>
            <td style="background-color: #DC2626; padding: 40px 20px; text-align: center;">
              <div style="width: 60px; height: 60px; margin: 0 auto 20px; background-color: rgba(255, 255, 255, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white"/>
                  <path d="M2 17L12 22L22 17" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin: 0 auto; display: block;">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="white"/>
              </svg>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px; background-color: #ffffff;">
              <h1 style="margin: 0 0 20px; font-size: 24px; font-weight: bold; color: #1F2937;">Security Alert</h1>
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #4B5563;">
                Hello ${username},
              </p>
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #4B5563;">
                We noticed that someone recently attempted to create a new account using your email address (${attemptEmail}).
              </p>
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #4B5563;">
                If this was you, you can safely ignore this email. If you did not attempt to create an account, we recommend:
              </p>
              <ul style="margin: 0 0 24px; padding-left: 20px; font-size: 16px; line-height: 1.8; color: #4B5563;">
                <li>Ensuring your Petflix account password is strong and unique</li>
                <li>Enabling two-factor authentication if available</li>
                <li>Reviewing your account activity for any suspicious behavior</li>
              </ul>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${process.env.FRONTEND_URL || 'https://petflix.com'}/settings" style="display: inline-block; padding: 14px 28px; background-color: #DC2626; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px;">Review Account Settings</a>
              </div>
              <p style="margin: 24px 0 0; font-size: 14px; line-height: 1.6; color: #6B7280;">
                If you have any concerns about your account security, please contact our support team immediately.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #F9FAFB; text-align: center; border-top: 1px solid #E5E7EB;">
              <p style="margin: 0 0 8px; font-size: 14px; color: #6B7280;">
                <a href="${process.env.FRONTEND_URL || 'https://petflix.com'}" style="color: #DC2626; text-decoration: none;">Petflix</a> - Your pet video platform
              </p>
              <p style="margin: 0; font-size: 12px; color: #9CA3AF;">
                Petflix Inc. All rights reserved
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to: email,
      subject: 'Security Alert: Signup Attempt on Your Petflix Account',
      html: htmlContent,
    });

    console.log(`[Email] Signup attempt notification sent to ${email}`);
  } catch (error) {
    console.error('[Email] Error sending signup attempt notification:', error);
  }
};

/**
 * Send email notification when someone tries to sign in with wrong credentials
 */
export const sendLoginAttemptEmail = async (email: string, username: string, attemptEmail: string) => {
  if (!transporter) {
    console.warn('[Email] SMTP not configured. Skipping email notification.');
    return;
  }

  try {
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Security Alert - Petflix</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #0F0F0F;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #0F0F0F;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header with red background -->
          <tr>
            <td style="background-color: #DC2626; padding: 40px 20px; text-align: center;">
              <div style="width: 60px; height: 60px; margin: 0 auto 20px; background-color: rgba(255, 255, 255, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white"/>
                  <path d="M2 17L12 22L22 17" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin: 0 auto; display: block;">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="white"/>
              </svg>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px; background-color: #ffffff;">
              <h1 style="margin: 0 0 20px; font-size: 24px; font-weight: bold; color: #1F2937;">Security Alert</h1>
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #4B5563;">
                Hello ${username},
              </p>
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #4B5563;">
                We detected a failed login attempt to your Petflix account using your email address (${attemptEmail}).
              </p>
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #4B5563;">
                If this was you, you may have entered an incorrect password. If you did not attempt to sign in, we recommend:
              </p>
              <ul style="margin: 0 0 24px; padding-left: 20px; font-size: 16px; line-height: 1.8; color: #4B5563;">
                <li>Changing your account password immediately</li>
                <li>Enabling two-factor authentication if available</li>
                <li>Reviewing your account activity for any unauthorized access</li>
              </ul>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${process.env.FRONTEND_URL || 'https://petflix.com'}/forgot-password" style="display: inline-block; padding: 14px 28px; background-color: #DC2626; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px;">Reset Password</a>
              </div>
              <p style="margin: 24px 0 0; font-size: 14px; line-height: 1.6; color: #6B7280;">
                If you have any concerns about your account security, please contact our support team immediately.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #F9FAFB; text-align: center; border-top: 1px solid #E5E7EB;">
              <p style="margin: 0 0 8px; font-size: 14px; color: #6B7280;">
                <a href="${process.env.FRONTEND_URL || 'https://petflix.com'}" style="color: #DC2626; text-decoration: none;">Petflix</a> - Your pet video platform
              </p>
              <p style="margin: 0; font-size: 12px; color: #9CA3AF;">
                Petflix Inc. All rights reserved
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to: email,
      subject: 'Security Alert: Failed Login Attempt on Your Petflix Account',
      html: htmlContent,
    });

    console.log(`[Email] Login attempt notification sent to ${email}`);
  } catch (error) {
    console.error('[Email] Error sending login attempt notification:', error);
  }
};

