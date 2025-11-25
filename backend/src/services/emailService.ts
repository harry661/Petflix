import nodemailer from 'nodemailer';

// Email configuration from environment variables
// Support both SMTP and SendGrid API
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const FROM_EMAIL = process.env.FROM_EMAIL || SMTP_USER || 'noreply@petflix.com';
const FROM_NAME = process.env.FROM_NAME || 'Petflix';

// Determine which email method to use (SendGrid API preferred for production)
const useSendGrid = !!SENDGRID_API_KEY;
const useSMTP = !useSendGrid && SMTP_USER && SMTP_PASS;

// Create SMTP transporter (only if credentials are provided and SendGrid not available)
const transporter = useSMTP ? nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465, // true for 465, false for other ports
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
}) : null;

/**
 * Send email using SendGrid API (preferred for production)
 */
const sendViaSendGrid = async (to: string, subject: string, html: string) => {
  if (!SENDGRID_API_KEY) {
    throw new Error('SendGrid API key not configured');
  }

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{
        to: [{ email: to }],
      }],
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME,
      },
      subject: subject,
      content: [{
        type: 'text/html',
        value: html,
      }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SendGrid API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return { messageId: `sendgrid-${Date.now()}` };
};

/**
 * Send email using SMTP (fallback for development)
 */
const sendViaSMTP = async (to: string, subject: string, html: string) => {
  if (!transporter) {
    throw new Error('SMTP not configured. Transporter is null.');
  }

  const mailOptions = {
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to: to,
    subject: subject,
    html: html,
  };

  return await transporter.sendMail(mailOptions);
};

/**
 * Send email notification when someone tries to sign up with existing email
 */
export const sendSignupAttemptEmail = async (email: string, username: string, attemptEmail: string, attemptUsername: string) => {
  console.log('[Email] Attempting to send signup attempt notification...');
  console.log('[Email] Using SendGrid:', useSendGrid);
  console.log('[Email] Using SMTP:', useSMTP);
  console.log('[Email] Sending to:', email);
  
  if (!useSendGrid && !useSMTP) {
    const error = new Error('Email service not configured. Set SENDGRID_API_KEY or SMTP credentials.');
    console.error('[Email] Email service not configured.');
    console.error('[Email] SENDGRID_API_KEY:', SENDGRID_API_KEY ? 'SET' : 'NOT SET');
    console.error('[Email] SMTP_USER:', SMTP_USER || 'MISSING');
    console.error('[Email] SMTP_PASS:', SMTP_PASS ? 'SET' : 'MISSING');
    throw error;
  }

  try {
    // Petflix Paw logo - use hosted PNG for maximum email client compatibility
    // Reference the PNG file from the frontend public folder
    const frontendUrl = process.env.FRONTEND_URL || 'https://petflix-quzbv11xx-harrys-projects-7677f8a2.vercel.app';
    const petflixPawLogo = `<img src="${frontendUrl}/paw-logo-black.png" alt="Petflix" width="120" height="120" style="display: block; margin: 0 auto;" />`;
    
    // Petflix text logo - use inline SVG for better email client compatibility
    const petflixLogoInline = `<svg width="200" height="36" viewBox="0 0 580 106" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M75.1899 23.2102C77.5989 28.1209 78.8034 33.5876 78.8034 39.6102C78.8034 45.6328 77.5989 51.0995 75.1899 56.0102C72.7808 60.8283 69.6769 64.6735 65.878 67.5458C58.1876 73.4757 50.2192 76.4407 41.9729 76.4407H24.6V92.1458C24.6 94.2769 24.5074 95.8983 24.322 97.0102C24.2294 98.0294 23.8124 99.2339 23.0712 100.624C21.774 103.125 18.1605 104.376 12.2305 104.376C5.74463 104.376 1.94576 102.662 0.833897 99.2339C0.277964 97.6588 -2.04791e-06 95.2497 -2.04791e-06 92.0068V14.8712C-2.04791e-06 12.7401 0.0463256 11.165 0.138981 10.1458C0.324292 9.0339 0.787569 7.78305 1.52881 6.39322C2.82599 3.89152 6.43955 2.64068 12.3695 2.64068H42.1119C50.2656 2.64068 58.1876 5.60565 65.878 11.5356C69.6769 14.4079 72.7808 18.2994 75.1899 23.2102ZM42.1119 51.8407C44.8915 51.8407 47.6249 50.8215 50.3119 48.7831C52.9989 46.7446 54.3424 43.687 54.3424 39.6102C54.3424 35.5333 52.9989 32.4757 50.3119 30.4373C47.6249 28.3062 44.8452 27.2407 41.9729 27.2407H24.6V51.8407H42.1119ZM112.415 79.9153H155.221C157.352 79.9153 158.928 80.0079 159.947 80.1932C161.059 80.2859 162.309 80.7029 163.699 81.4441C166.201 82.7413 167.452 86.3548 167.452 92.2848C167.452 98.7707 165.738 102.57 162.309 103.681C160.734 104.237 158.325 104.515 155.082 104.515H100.045C93.5591 104.515 89.7603 102.755 88.6484 99.2339C88.0925 97.7514 87.8145 95.3887 87.8145 92.1458V14.8712C87.8145 10.1458 88.6947 6.94915 90.4552 5.28135C92.2156 3.5209 95.5512 2.64068 100.462 2.64068H155.221C157.352 2.64068 158.928 2.73333 159.947 2.91865C161.059 3.0113 162.309 3.42825 163.699 4.16949C166.201 5.46667 167.452 9.08023 167.452 15.0102C167.452 21.4961 165.738 25.2949 162.309 26.4068C160.734 26.9627 158.325 27.2407 155.082 27.2407H112.415V41.278H139.933C142.064 41.278 143.639 41.3706 144.659 41.5559C145.77 41.6486 147.021 42.0655 148.411 42.8068C150.913 44.104 152.164 47.7175 152.164 53.6475C152.164 60.1334 150.403 63.9322 146.882 65.0441C145.307 65.6 142.898 65.878 139.655 65.878H112.415V79.9153ZM183.115 2.5017H260.389C263.354 2.5017 265.532 2.87232 266.921 3.61356C268.311 4.26215 269.238 5.32768 269.701 6.81017C270.164 8.29266 270.396 10.2384 270.396 12.6475C270.396 15.0565 270.164 17.0023 269.701 18.4848C269.238 19.8746 268.45 20.8475 267.338 21.4034C265.671 22.2373 263.308 22.6542 260.25 22.6542H233.704V92.5627C233.704 94.6938 233.612 96.269 233.426 97.2882C233.334 98.3074 232.917 99.5119 232.176 100.902C231.527 102.199 230.323 103.125 228.562 103.681C226.802 104.237 224.485 104.515 221.613 104.515C218.741 104.515 216.424 104.237 214.664 103.681C212.996 103.125 211.791 102.199 211.05 100.902C210.402 99.5119 209.985 98.3074 209.799 97.2882C209.707 96.1763 209.66 94.5548 209.66 92.4238V22.6542H182.976C180.011 22.6542 177.833 22.3299 176.443 21.6814C175.054 20.9401 174.127 19.8283 173.664 18.3458C173.2 16.8633 172.969 14.9175 172.969 12.5085C172.969 10.0994 173.2 8.2 173.664 6.81017C174.127 5.32768 174.915 4.30847 176.026 3.75254C177.694 2.91864 180.057 2.5017 183.115 2.5017ZM345.509 2.64068C347.64 2.64068 349.215 2.73333 350.234 2.91865C351.346 3.0113 352.551 3.42825 353.848 4.16949C355.238 4.91073 356.21 6.16158 356.766 7.92203C357.322 9.68248 357.6 12.0452 357.6 15.0102C357.6 17.9751 357.322 20.3379 356.766 22.0983C356.21 23.8588 355.238 25.1096 353.848 25.8509C352.458 26.4994 351.207 26.9164 350.095 27.1017C349.076 27.1944 347.454 27.2407 345.231 27.2407H302.702V41.278H330.082C332.305 41.278 333.927 41.3706 334.946 41.5559C336.058 41.6486 337.309 42.0655 338.699 42.8068C341.108 44.1966 342.312 47.8565 342.312 53.7865C342.312 60.2723 340.552 64.1175 337.031 65.3221C335.548 65.7853 333.186 66.017 329.943 66.017H302.702V92.2848C302.702 94.5085 302.609 96.13 302.424 97.1492C302.331 98.1684 301.914 99.3729 301.173 100.763C299.876 103.264 296.262 104.515 290.332 104.515C283.847 104.515 280.048 102.755 278.936 99.2339C278.38 97.7514 278.102 95.3887 278.102 92.1458V14.8712C278.102 10.1458 278.982 6.94915 280.743 5.28135C282.503 3.5209 285.839 2.64068 290.749 2.64068H345.509ZM391.195 83.9458H428.998C432.056 83.9458 434.28 84.3164 435.67 85.0577C437.059 85.7062 437.986 86.7718 438.449 88.2543C438.913 89.7368 439.144 91.7288 439.144 94.2305C439.144 96.6396 438.913 98.5853 438.449 100.068C437.986 101.55 437.198 102.57 436.087 103.125C434.326 104.052 431.917 104.515 428.859 104.515H378.826C372.34 104.515 368.541 102.755 367.429 99.2339C366.873 97.7514 366.595 95.3887 366.595 92.1458V14.8712C366.595 12.7401 366.641 11.165 366.734 10.1458C366.919 9.0339 367.383 7.78305 368.124 6.39322C369.421 3.89152 373.035 2.64068 378.965 2.64068C385.45 2.64068 389.296 4.3548 390.5 7.78305C390.963 9.35819 391.195 11.7672 391.195 15.0102V83.9458ZM448.166 14.8712C448.166 12.7401 448.213 11.165 448.305 10.1458C448.49 9.0339 448.954 7.78305 449.695 6.39322C450.992 3.89152 454.606 2.64068 460.536 2.64068C467.022 2.64068 470.867 4.3548 472.071 7.78305C472.535 9.35819 472.766 11.7672 472.766 15.0102V92.2848C472.766 94.5085 472.674 96.13 472.488 97.1492C472.396 98.1684 471.979 99.3729 471.237 100.763C469.94 103.264 466.327 104.515 460.397 104.515C453.911 104.515 450.112 102.755 449 99.2339C448.444 97.7514 448.166 95.3887 448.166 92.1458V14.8712ZM546.543 52.9526L574.479 83.6678C577.629 87.1887 579.204 90.1537 579.204 92.5627C579.204 94.9718 577.398 97.7978 573.784 101.041C570.263 104.284 567.252 105.905 564.75 105.905C562.341 105.905 559.515 104.052 556.272 100.346L529.865 70.0475L503.459 100.346C500.123 104.052 497.251 105.905 494.842 105.905C492.525 105.905 489.514 104.284 485.808 101.041C482.194 97.7051 480.387 94.8791 480.387 92.5627C480.387 90.2464 482.009 87.2814 485.252 83.6678L513.187 52.9526L485.252 22.2373C482.009 18.809 480.387 15.8904 480.387 13.4814C480.387 11.0723 482.194 8.24633 485.808 5.00339C489.421 1.6678 492.433 -1.53151e-06 494.842 -1.53151e-06C497.343 -1.53151e-06 500.216 1.85311 503.459 5.55933L529.865 35.8576L556.272 5.55933C559.608 1.85311 562.434 -1.53151e-06 564.75 -1.53151e-06C567.159 -1.53151e-06 570.171 1.62147 573.784 4.86441C577.398 8.10735 579.204 10.9797 579.204 13.4814C579.204 15.9831 577.629 18.9017 574.479 22.2373L546.543 52.9526Z" fill="#ADD8E6"/></svg>`;

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <title>Security Alert - Petflix</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Quicksand', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; background-color: #0F0F0F;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #0F0F0F;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; background-color: #1a1a1a; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);">
          <!-- Header with Petflix blue background -->
          <tr>
            <td style="background-color: #ADD8E6; padding: 50px 20px; text-align: center;">
              ${petflixPawLogo}
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px; background-color: #1a1a1a;">
              <h1 style="margin: 0 0 20px; font-size: 24px; font-weight: 700; font-family: 'Quicksand', sans-serif; color: #ADD8E6;">Security Alert</h1>
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; font-weight: 400; font-family: 'Quicksand', sans-serif; color: rgba(255, 255, 255, 0.9);">
                Hello ${username},
              </p>
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; font-weight: 400; font-family: 'Quicksand', sans-serif; color: rgba(255, 255, 255, 0.9);">
                We noticed that someone recently attempted to create a new account using your email address (<a href="mailto:${attemptEmail}" style="color: #ADD8E6; text-decoration: underline;">${attemptEmail}</a>).
              </p>
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; font-weight: 400; font-family: 'Quicksand', sans-serif; color: rgba(255, 255, 255, 0.9);">
                If this was you, you can safely ignore this email. If you did not attempt to create an account, we recommend:
              </p>
              <ul style="margin: 0 0 24px; padding-left: 20px; font-size: 16px; line-height: 1.8; font-weight: 400; font-family: 'Quicksand', sans-serif; color: rgba(255, 255, 255, 0.9);">
                <li>Ensuring your Petflix account password is strong and unique</li>
                <li>Enabling two-factor authentication if available</li>
                <li>Reviewing your account activity for any suspicious behavior</li>
              </ul>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${process.env.FRONTEND_URL || 'https://petflix.com'}/?mode=login&redirect=/settings" style="display: inline-block; padding: 14px 28px; background-color: #ADD8E6; color: #0F0F0F; text-decoration: none; border-radius: 4px; font-weight: 600; font-family: 'Quicksand', sans-serif; font-size: 16px;">Sign In to Review Account Settings</a>
              </div>
              <p style="margin: 24px 0 0; font-size: 14px; line-height: 1.6; font-weight: 400; font-family: 'Quicksand', sans-serif; color: rgba(255, 255, 255, 0.7);">
                If you have any concerns about your account security, please <a href="mailto:support@petflix.com" style="color: #ADD8E6; text-decoration: underline;">contact our support team</a> immediately.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #1a1a1a; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.1);">
              <div style="margin: 0 auto 16px; text-align: center;">
                ${petflixLogoInline}
              </div>
              <p style="margin: 0; font-size: 12px; font-weight: 400; font-family: 'Quicksand', sans-serif; color: rgba(255, 255, 255, 0.6);">
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

    const subject = 'Security Alert: Signup Attempt on Your Petflix Account';
    
    console.log('[Email] Sending mail:', {
      from: FROM_EMAIL,
      to: email,
      subject: subject,
      method: useSendGrid ? 'SendGrid API' : 'SMTP',
    });

    const info = useSendGrid 
      ? await sendViaSendGrid(email, subject, htmlContent)
      : await sendViaSMTP(email, subject, htmlContent);
    
    console.log(`[Email] ✅ Signup attempt notification sent successfully to ${email}`);
    console.log('[Email] Message ID:', info.messageId);
  } catch (error: any) {
    console.error('[Email] ❌ Error sending signup attempt notification:', error);
    console.error('[Email] Error code:', error.code);
    console.error('[Email] Error message:', error.message);
    console.error('[Email] Error response:', error.response);
    throw error; // Re-throw so caller knows it failed
  }
};

/**
 * Send email notification when someone tries to sign in with wrong credentials
 */
export const sendLoginAttemptEmail = async (email: string, username: string, attemptEmail: string) => {
  console.log('[Email] Attempting to send login attempt notification...');
  console.log('[Email] Using SendGrid:', useSendGrid);
  console.log('[Email] Using SMTP:', useSMTP);
  console.log('[Email] Sending to:', email);
  
  if (!useSendGrid && !useSMTP) {
    const error = new Error('Email service not configured. Set SENDGRID_API_KEY or SMTP credentials.');
    console.error('[Email] Email service not configured.');
    console.error('[Email] SENDGRID_API_KEY:', SENDGRID_API_KEY ? 'SET' : 'NOT SET');
    console.error('[Email] SMTP_USER:', SMTP_USER || 'MISSING');
    console.error('[Email] SMTP_PASS:', SMTP_PASS ? 'SET' : 'MISSING');
    throw error;
  }

  try {
    // Petflix Paw logo - use hosted PNG for maximum email client compatibility
    // Reference the PNG file from the frontend public folder
    const frontendUrl = process.env.FRONTEND_URL || 'https://petflix-quzbv11xx-harrys-projects-7677f8a2.vercel.app';
    const petflixPawLogo = `<img src="${frontendUrl}/paw-logo-black.png" alt="Petflix" width="120" height="120" style="display: block; margin: 0 auto;" />`;
    
    // Petflix text logo - use inline SVG for better email client compatibility
    const petflixLogoInline = `<svg width="200" height="36" viewBox="0 0 580 106" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M75.1899 23.2102C77.5989 28.1209 78.8034 33.5876 78.8034 39.6102C78.8034 45.6328 77.5989 51.0995 75.1899 56.0102C72.7808 60.8283 69.6769 64.6735 65.878 67.5458C58.1876 73.4757 50.2192 76.4407 41.9729 76.4407H24.6V92.1458C24.6 94.2769 24.5074 95.8983 24.322 97.0102C24.2294 98.0294 23.8124 99.2339 23.0712 100.624C21.774 103.125 18.1605 104.376 12.2305 104.376C5.74463 104.376 1.94576 102.662 0.833897 99.2339C0.277964 97.6588 -2.04791e-06 95.2497 -2.04791e-06 92.0068V14.8712C-2.04791e-06 12.7401 0.0463256 11.165 0.138981 10.1458C0.324292 9.0339 0.787569 7.78305 1.52881 6.39322C2.82599 3.89152 6.43955 2.64068 12.3695 2.64068H42.1119C50.2656 2.64068 58.1876 5.60565 65.878 11.5356C69.6769 14.4079 72.7808 18.2994 75.1899 23.2102ZM42.1119 51.8407C44.8915 51.8407 47.6249 50.8215 50.3119 48.7831C52.9989 46.7446 54.3424 43.687 54.3424 39.6102C54.3424 35.5333 52.9989 32.4757 50.3119 30.4373C47.6249 28.3062 44.8452 27.2407 41.9729 27.2407H24.6V51.8407H42.1119ZM112.415 79.9153H155.221C157.352 79.9153 158.928 80.0079 159.947 80.1932C161.059 80.2859 162.309 80.7029 163.699 81.4441C166.201 82.7413 167.452 86.3548 167.452 92.2848C167.452 98.7707 165.738 102.57 162.309 103.681C160.734 104.237 158.325 104.515 155.082 104.515H100.045C93.5591 104.515 89.7603 102.755 88.6484 99.2339C88.0925 97.7514 87.8145 95.3887 87.8145 92.1458V14.8712C87.8145 10.1458 88.6947 6.94915 90.4552 5.28135C92.2156 3.5209 95.5512 2.64068 100.462 2.64068H155.221C157.352 2.64068 158.928 2.73333 159.947 2.91865C161.059 3.0113 162.309 3.42825 163.699 4.16949C166.201 5.46667 167.452 9.08023 167.452 15.0102C167.452 21.4961 165.738 25.2949 162.309 26.4068C160.734 26.9627 158.325 27.2407 155.082 27.2407H112.415V41.278H139.933C142.064 41.278 143.639 41.3706 144.659 41.5559C145.77 41.6486 147.021 42.0655 148.411 42.8068C150.913 44.104 152.164 47.7175 152.164 53.6475C152.164 60.1334 150.403 63.9322 146.882 65.0441C145.307 65.6 142.898 65.878 139.655 65.878H112.415V79.9153ZM183.115 2.5017H260.389C263.354 2.5017 265.532 2.87232 266.921 3.61356C268.311 4.26215 269.238 5.32768 269.701 6.81017C270.164 8.29266 270.396 10.2384 270.396 12.6475C270.396 15.0565 270.164 17.0023 269.701 18.4848C269.238 19.8746 268.45 20.8475 267.338 21.4034C265.671 22.2373 263.308 22.6542 260.25 22.6542H233.704V92.5627C233.704 94.6938 233.612 96.269 233.426 97.2882C233.334 98.3074 232.917 99.5119 232.176 100.902C231.527 102.199 230.323 103.125 228.562 103.681C226.802 104.237 224.485 104.515 221.613 104.515C218.741 104.515 216.424 104.237 214.664 103.681C212.996 103.125 211.791 102.199 211.05 100.902C210.402 99.5119 209.985 98.3074 209.799 97.2882C209.707 96.1763 209.66 94.5548 209.66 92.4238V22.6542H182.976C180.011 22.6542 177.833 22.3299 176.443 21.6814C175.054 20.9401 174.127 19.8283 173.664 18.3458C173.2 16.8633 172.969 14.9175 172.969 12.5085C172.969 10.0994 173.2 8.2 173.664 6.81017C174.127 5.32768 174.915 4.30847 176.026 3.75254C177.694 2.91864 180.057 2.5017 183.115 2.5017ZM345.509 2.64068C347.64 2.64068 349.215 2.73333 350.234 2.91865C351.346 3.0113 352.551 3.42825 353.848 4.16949C355.238 4.91073 356.21 6.16158 356.766 7.92203C357.322 9.68248 357.6 12.0452 357.6 15.0102C357.6 17.9751 357.322 20.3379 356.766 22.0983C356.21 23.8588 355.238 25.1096 353.848 25.8509C352.458 26.4994 351.207 26.9164 350.095 27.1017C349.076 27.1944 347.454 27.2407 345.231 27.2407H302.702V41.278H330.082C332.305 41.278 333.927 41.3706 334.946 41.5559C336.058 41.6486 337.309 42.0655 338.699 42.8068C341.108 44.1966 342.312 47.8565 342.312 53.7865C342.312 60.2723 340.552 64.1175 337.031 65.3221C335.548 65.7853 333.186 66.017 329.943 66.017H302.702V92.2848C302.702 94.5085 302.609 96.13 302.424 97.1492C302.331 98.1684 301.914 99.3729 301.173 100.763C299.876 103.264 296.262 104.515 290.332 104.515C283.847 104.515 280.048 102.755 278.936 99.2339C278.38 97.7514 278.102 95.3887 278.102 92.1458V14.8712C278.102 10.1458 278.982 6.94915 280.743 5.28135C282.503 3.5209 285.839 2.64068 290.749 2.64068H345.509ZM391.195 83.9458H428.998C432.056 83.9458 434.28 84.3164 435.67 85.0577C437.059 85.7062 437.986 86.7718 438.449 88.2543C438.913 89.7368 439.144 91.7288 439.144 94.2305C439.144 96.6396 438.913 98.5853 438.449 100.068C437.986 101.55 437.198 102.57 436.087 103.125C434.326 104.052 431.917 104.515 428.859 104.515H378.826C372.34 104.515 368.541 102.755 367.429 99.2339C366.873 97.7514 366.595 95.3887 366.595 92.1458V14.8712C366.595 12.7401 366.641 11.165 366.734 10.1458C366.919 9.0339 367.383 7.78305 368.124 6.39322C369.421 3.89152 373.035 2.64068 378.965 2.64068C385.45 2.64068 389.296 4.3548 390.5 7.78305C390.963 9.35819 391.195 11.7672 391.195 15.0102V83.9458ZM448.166 14.8712C448.166 12.7401 448.213 11.165 448.305 10.1458C448.49 9.0339 448.954 7.78305 449.695 6.39322C450.992 3.89152 454.606 2.64068 460.536 2.64068C467.022 2.64068 470.867 4.3548 472.071 7.78305C472.535 9.35819 472.766 11.7672 472.766 15.0102V92.2848C472.766 94.5085 472.674 96.13 472.488 97.1492C472.396 98.1684 471.979 99.3729 471.237 100.763C469.94 103.264 466.327 104.515 460.397 104.515C453.911 104.515 450.112 102.755 449 99.2339C448.444 97.7514 448.166 95.3887 448.166 92.1458V14.8712ZM546.543 52.9526L574.479 83.6678C577.629 87.1887 579.204 90.1537 579.204 92.5627C579.204 94.9718 577.398 97.7978 573.784 101.041C570.263 104.284 567.252 105.905 564.75 105.905C562.341 105.905 559.515 104.052 556.272 100.346L529.865 70.0475L503.459 100.346C500.123 104.052 497.251 105.905 494.842 105.905C492.525 105.905 489.514 104.284 485.808 101.041C482.194 97.7051 480.387 94.8791 480.387 92.5627C480.387 90.2464 482.009 87.2814 485.252 83.6678L513.187 52.9526L485.252 22.2373C482.009 18.809 480.387 15.8904 480.387 13.4814C480.387 11.0723 482.194 8.24633 485.808 5.00339C489.421 1.6678 492.433 -1.53151e-06 494.842 -1.53151e-06C497.343 -1.53151e-06 500.216 1.85311 503.459 5.55933L529.865 35.8576L556.272 5.55933C559.608 1.85311 562.434 -1.53151e-06 564.75 -1.53151e-06C567.159 -1.53151e-06 570.171 1.62147 573.784 4.86441C577.398 8.10735 579.204 10.9797 579.204 13.4814C579.204 15.9831 577.629 18.9017 574.479 22.2373L546.543 52.9526Z" fill="#ADD8E6"/></svg>`;

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <title>Security Alert - Petflix</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Quicksand', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; background-color: #0F0F0F;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #0F0F0F;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; background-color: #1a1a1a; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);">
          <!-- Header with Petflix blue background -->
          <tr>
            <td style="background-color: #ADD8E6; padding: 50px 20px; text-align: center;">
              ${petflixPawLogo}
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px; background-color: #1a1a1a;">
              <h1 style="margin: 0 0 20px; font-size: 24px; font-weight: 700; font-family: 'Quicksand', sans-serif; color: #ADD8E6;">Security Alert</h1>
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; font-weight: 400; font-family: 'Quicksand', sans-serif; color: rgba(255, 255, 255, 0.9);">
                Hello ${username},
              </p>
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; font-weight: 400; font-family: 'Quicksand', sans-serif; color: rgba(255, 255, 255, 0.9);">
                We detected a failed login attempt to your Petflix account using your email address (<a href="mailto:${attemptEmail}" style="color: #ADD8E6; text-decoration: underline;">${attemptEmail}</a>).
              </p>
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; font-weight: 400; font-family: 'Quicksand', sans-serif; color: rgba(255, 255, 255, 0.9);">
                If this was you, you may have entered an incorrect password. If you did not attempt to sign in, we recommend:
              </p>
              <ul style="margin: 0 0 24px; padding-left: 20px; font-size: 16px; line-height: 1.8; font-weight: 400; font-family: 'Quicksand', sans-serif; color: rgba(255, 255, 255, 0.9);">
                <li>Changing your account password immediately</li>
                <li>Enabling two-factor authentication if available</li>
                <li>Reviewing your account activity for any unauthorized access</li>
              </ul>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${process.env.FRONTEND_URL || 'https://petflix.com'}/?mode=login&redirect=/settings" style="display: inline-block; padding: 14px 28px; background-color: #ADD8E6; color: #0F0F0F; text-decoration: none; border-radius: 4px; font-weight: 600; font-family: 'Quicksand', sans-serif; font-size: 16px;">Sign In to Review Account Settings</a>
              </div>
              <p style="margin: 24px 0 0; font-size: 14px; line-height: 1.6; font-weight: 400; font-family: 'Quicksand', sans-serif; color: rgba(255, 255, 255, 0.7);">
                If you have any concerns about your account security, please <a href="mailto:support@petflix.com" style="color: #ADD8E6; text-decoration: underline;">contact our support team</a> immediately.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #1a1a1a; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.1);">
              <div style="margin: 0 auto 16px; text-align: center;">
                ${petflixLogoInline}
              </div>
              <p style="margin: 0; font-size: 12px; font-weight: 400; font-family: 'Quicksand', sans-serif; color: rgba(255, 255, 255, 0.6);">
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

    const subject = 'Security Alert: Failed Login Attempt on Your Petflix Account';
    
    console.log('[Email] Sending mail:', {
      from: FROM_EMAIL,
      to: email,
      subject: subject,
      method: useSendGrid ? 'SendGrid API' : 'SMTP',
    });

    const info = useSendGrid 
      ? await sendViaSendGrid(email, subject, htmlContent)
      : await sendViaSMTP(email, subject, htmlContent);
    
    console.log(`[Email] ✅ Login attempt notification sent successfully to ${email}`);
    console.log('[Email] Message ID:', info.messageId);
  } catch (error: any) {
    console.error('[Email] ❌ Error sending login attempt notification:', error);
    console.error('[Email] Error code:', error.code);
    console.error('[Email] Error message:', error.message);
    console.error('[Email] Error response:', error.response);
    throw error; // Re-throw so caller knows it failed
  }
};


/**
 * Send password reset email (PRD Requirement)
 * This is the main email functionality required by the PRD
 */
export const sendPasswordResetEmail = async (email: string, username: string, resetUrl: string) => {
  console.log('[Email] Attempting to send password reset email...');
  console.log('[Email] Using SendGrid:', useSendGrid);
  console.log('[Email] Using SMTP:', useSMTP);
  console.log('[Email] Sending to:', email);
  
  if (!useSendGrid && !useSMTP) {
    const error = new Error('Email service not configured. Set SENDGRID_API_KEY or SMTP credentials.');
    console.error('[Email] Email service not configured.');
    console.error('[Email] SENDGRID_API_KEY:', SENDGRID_API_KEY ? 'SET' : 'NOT SET');
    console.error('[Email] SMTP_USER:', SMTP_USER || 'MISSING');
    console.error('[Email] SMTP_PASS:', SMTP_PASS ? 'SET' : 'MISSING');
    throw error;
  }

  try {
    // Petflix Paw logo - use hosted PNG for maximum email client compatibility
    // Reference the PNG file from the frontend public folder
    const frontendUrl = process.env.FRONTEND_URL || 'https://petflix-quzbv11xx-harrys-projects-7677f8a2.vercel.app';
    const petflixPawLogo = `<img src="${frontendUrl}/paw-logo-black.png" alt="Petflix" width="120" height="120" style="display: block; margin: 0 auto;" />`;
    
    // Petflix text logo - use inline SVG for better email client compatibility
    const petflixLogoInline = `<svg width="200" height="36" viewBox="0 0 580 106" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M75.1899 23.2102C77.5989 28.1209 78.8034 33.5876 78.8034 39.6102C78.8034 45.6328 77.5989 51.0995 75.1899 56.0102C72.7808 60.8283 69.6769 64.6735 65.878 67.5458C58.1876 73.4757 50.2192 76.4407 41.9729 76.4407H24.6V92.1458C24.6 94.2769 24.5074 95.8983 24.322 97.0102C24.2294 98.0294 23.8124 99.2339 23.0712 100.624C21.774 103.125 18.1605 104.376 12.2305 104.376C5.74463 104.376 1.94576 102.662 0.833897 99.2339C0.277964 97.6588 -2.04791e-06 95.2497 -2.04791e-06 92.0068V14.8712C-2.04791e-06 12.7401 0.0463256 11.165 0.138981 10.1458C0.324292 9.0339 0.787569 7.78305 1.52881 6.39322C2.82599 3.89152 6.43955 2.64068 12.3695 2.64068H42.1119C50.2656 2.64068 58.1876 5.60565 65.878 11.5356C69.6769 14.4079 72.7808 18.2994 75.1899 23.2102ZM42.1119 51.8407C44.8915 51.8407 47.6249 50.8215 50.3119 48.7831C52.9989 46.7446 54.3424 43.687 54.3424 39.6102C54.3424 35.5333 52.9989 32.4757 50.3119 30.4373C47.6249 28.3062 44.8452 27.2407 41.9729 27.2407H24.6V51.8407H42.1119ZM112.415 79.9153H155.221C157.352 79.9153 158.928 80.0079 159.947 80.1932C161.059 80.2859 162.309 80.7029 163.699 81.4441C166.201 82.7413 167.452 86.3548 167.452 92.2848C167.452 98.7707 165.738 102.57 162.309 103.681C160.734 104.237 158.325 104.515 155.082 104.515H100.045C93.5591 104.515 89.7603 102.755 88.6484 99.2339C88.0925 97.7514 87.8145 95.3887 87.8145 92.1458V14.8712C87.8145 10.1458 88.6947 6.94915 90.4552 5.28135C92.2156 3.5209 95.5512 2.64068 100.462 2.64068H155.221C157.352 2.64068 158.928 2.73333 159.947 2.91865C161.059 3.0113 162.309 3.42825 163.699 4.16949C166.201 5.46667 167.452 9.08023 167.452 15.0102C167.452 21.4961 165.738 25.2949 162.309 26.4068C160.734 26.9627 158.325 27.2407 155.082 27.2407H112.415V41.278H139.933C142.064 41.278 143.639 41.3706 144.659 41.5559C145.77 41.6486 147.021 42.0655 148.411 42.8068C150.913 44.104 152.164 47.7175 152.164 53.6475C152.164 60.1334 150.403 63.9322 146.882 65.0441C145.307 65.6 142.898 65.878 139.655 65.878H112.415V79.9153ZM183.115 2.5017H260.389C263.354 2.5017 265.532 2.87232 266.921 3.61356C268.311 4.26215 269.238 5.32768 269.701 6.81017C270.164 8.29266 270.396 10.2384 270.396 12.6475C270.396 15.0565 270.164 17.0023 269.701 18.4848C269.238 19.8746 268.45 20.8475 267.338 21.4034C265.671 22.2373 263.308 22.6542 260.25 22.6542H233.704V92.5627C233.704 94.6938 233.612 96.269 233.426 97.2882C233.334 98.3074 232.917 99.5119 232.176 100.902C231.527 102.199 230.323 103.125 228.562 103.681C226.802 104.237 224.485 104.515 221.613 104.515C218.741 104.515 216.424 104.237 214.664 103.681C212.996 103.125 211.791 102.199 211.05 100.902C210.402 99.5119 209.985 98.3074 209.799 97.2882C209.707 96.1763 209.66 94.5548 209.66 92.4238V22.6542H182.976C180.011 22.6542 177.833 22.3299 176.443 21.6814C175.054 20.9401 174.127 19.8283 173.664 18.3458C173.2 16.8633 172.969 14.9175 172.969 12.5085C172.969 10.0994 173.2 8.2 173.664 6.81017C174.127 5.32768 174.915 4.30847 176.026 3.75254C177.694 2.91864 180.057 2.5017 183.115 2.5017ZM345.509 2.64068C347.64 2.64068 349.215 2.73333 350.234 2.91865C351.346 3.0113 352.551 3.42825 353.848 4.16949C355.238 4.91073 356.21 6.16158 356.766 7.92203C357.322 9.68248 357.6 12.0452 357.6 15.0102C357.6 17.9751 357.322 20.3379 356.766 22.0983C356.21 23.8588 355.238 25.1096 353.848 25.8509C352.458 26.4994 351.207 26.9164 350.095 27.1017C349.076 27.1944 347.454 27.2407 345.231 27.2407H302.702V41.278H330.082C332.305 41.278 333.927 41.3706 334.946 41.5559C336.058 41.6486 337.309 42.0655 338.699 42.8068C341.108 44.1966 342.312 47.8565 342.312 53.7865C342.312 60.2723 340.552 64.1175 337.031 65.3221C335.548 65.7853 333.186 66.017 329.943 66.017H302.702V92.2848C302.702 94.5085 302.609 96.13 302.424 97.1492C302.331 98.1684 301.914 99.3729 301.173 100.763C299.876 103.264 296.262 104.515 290.332 104.515C283.847 104.515 280.048 102.755 278.936 99.2339C278.38 97.7514 278.102 95.3887 278.102 92.1458V14.8712C278.102 10.1458 278.982 6.94915 280.743 5.28135C282.503 3.5209 285.839 2.64068 290.749 2.64068H345.509ZM391.195 83.9458H428.998C432.056 83.9458 434.28 84.3164 435.67 85.0577C437.059 85.7062 437.986 86.7718 438.449 88.2543C438.913 89.7368 439.144 91.7288 439.144 94.2305C439.144 96.6396 438.913 98.5853 438.449 100.068C437.986 101.55 437.198 102.57 436.087 103.125C434.326 104.052 431.917 104.515 428.859 104.515H378.826C372.34 104.515 368.541 102.755 367.429 99.2339C366.873 97.7514 366.595 95.3887 366.595 92.1458V14.8712C366.595 12.7401 366.641 11.165 366.734 10.1458C366.919 9.0339 367.383 7.78305 368.124 6.39322C369.421 3.89152 373.035 2.64068 378.965 2.64068C385.45 2.64068 389.296 4.3548 390.5 7.78305C390.963 9.35819 391.195 11.7672 391.195 15.0102V83.9458ZM448.166 14.8712C448.166 12.7401 448.213 11.165 448.305 10.1458C448.49 9.0339 448.954 7.78305 449.695 6.39322C450.992 3.89152 454.606 2.64068 460.536 2.64068C467.022 2.64068 470.867 4.3548 472.071 7.78305C472.535 9.35819 472.766 11.7672 472.766 15.0102V92.2848C472.766 94.5085 472.674 96.13 472.488 97.1492C472.396 98.1684 471.979 99.3729 471.237 100.763C469.94 103.264 466.327 104.515 460.397 104.515C453.911 104.515 450.112 102.755 449 99.2339C448.444 97.7514 448.166 95.3887 448.166 92.1458V14.8712ZM546.543 52.9526L574.479 83.6678C577.629 87.1887 579.204 90.1537 579.204 92.5627C579.204 94.9718 577.398 97.7978 573.784 101.041C570.263 104.284 567.252 105.905 564.75 105.905C562.341 105.905 559.515 104.052 556.272 100.346L529.865 70.0475L503.459 100.346C500.123 104.052 497.251 105.905 494.842 105.905C492.525 105.905 489.514 104.284 485.808 101.041C482.194 97.7051 480.387 94.8791 480.387 92.5627C480.387 90.2464 482.009 87.2814 485.252 83.6678L513.187 52.9526L485.252 22.2373C482.009 18.809 480.387 15.8904 480.387 13.4814C480.387 11.0723 482.194 8.24633 485.808 5.00339C489.421 1.6678 492.433 -1.53151e-06 494.842 -1.53151e-06C497.343 -1.53151e-06 500.216 1.85311 503.459 5.55933L529.865 35.8576L556.272 5.55933C559.608 1.85311 562.434 -1.53151e-06 564.75 -1.53151e-06C567.159 -1.53151e-06 570.171 1.62147 573.784 4.86441C577.398 8.10735 579.204 10.9797 579.204 13.4814C579.204 15.9831 577.629 18.9017 574.479 22.2373L546.543 52.9526Z" fill="#ADD8E6"/></svg>`;

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <title>Reset Your Password - Petflix</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Quicksand', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; background-color: #0F0F0F;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #0F0F0F;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; background-color: #1a1a1a; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);">
          <tr>
            <td style="background-color: #ADD8E6; padding: 50px 20px; text-align: center;">
              <div style="margin: 0 auto; display: inline-block;">
                ${petflixPawLogo}
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px; background-color: #1a1a1a;">
              <h1 style="margin: 0 0 20px; font-size: 24px; font-weight: 700; font-family: 'Quicksand', sans-serif; color: #ADD8E6;">Reset Your Password</h1>
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; font-weight: 400; font-family: 'Quicksand', sans-serif; color: rgba(255, 255, 255, 0.9);">
                Hello ${username},
              </p>
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; font-weight: 400; font-family: 'Quicksand', sans-serif; color: rgba(255, 255, 255, 0.9);">
                We received a request to reset your password for your Petflix account (<a href="mailto:${email}" style="color: #ADD8E6; text-decoration: underline;">${email}</a>).
              </p>
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; font-weight: 400; font-family: 'Quicksand', sans-serif; color: rgba(255, 255, 255, 0.9);">
                Click the button below to reset your password. This link will expire in 1 hour.
              </p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${resetUrl}" style="display: inline-block; padding: 14px 28px; background-color: #ADD8E6; color: #0F0F0F; text-decoration: none; border-radius: 4px; font-weight: 600; font-family: 'Quicksand', sans-serif; font-size: 16px;">Reset Password</a>
              </div>
              <p style="margin: 24px 0 0; font-size: 14px; line-height: 1.6; font-weight: 400; font-family: 'Quicksand', sans-serif; color: rgba(255, 255, 255, 0.7);">
                If you did not request a password reset, you can safely ignore this email. Your password will not be changed.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px; background-color: #1a1a1a; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.1);">
              <div style="margin: 0 auto 16px; text-align: center;">
                ${petflixLogoInline}
              </div>
              <p style="margin: 0; font-size: 12px; font-weight: 400; font-family: 'Quicksand', sans-serif; color: rgba(255, 255, 255, 0.6);">
                Petflix Inc. All rights reserved
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const subject = 'Reset Your Petflix Password';
    
    console.log('[Email] Sending password reset email:', {
      from: FROM_EMAIL,
      to: email,
      subject: subject,
      method: useSendGrid ? 'SendGrid API' : 'SMTP',
    });

    const info = useSendGrid 
      ? await sendViaSendGrid(email, subject, htmlContent)
      : await sendViaSMTP(email, subject, htmlContent);
    
    console.log(`[Email] ✅ Password reset email sent successfully to ${email}`);
    console.log('[Email] Message ID:', info.messageId);
  } catch (error: any) {
    console.error('[Email] ❌ Error sending password reset email:', error);
    console.error('[Email] Error code:', error.code);
    console.error('[Email] Error message:', error.message);
    console.error('[Email] Error response:', error.response);
    throw error;
  }
};
