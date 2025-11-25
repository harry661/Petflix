# Email Configuration for Petflix

## Overview

Petflix uses email notifications to alert users about security events:
- **Signup Attempts**: When someone tries to sign up with an existing email address
- **Failed Login Attempts**: When someone tries to sign in with incorrect credentials

## Environment Variables

Add these to your **Backend Vercel Project** → Settings → Environment Variables:

### Required for Email Functionality

```bash
# SMTP Configuration
SMTP_HOST=smtp.gmail.com          # Your SMTP server hostname
SMTP_PORT=587                      # SMTP port (587 for TLS, 465 for SSL)
SMTP_USER=your-email@gmail.com     # Your SMTP username/email
SMTP_PASS=your-app-password        # Your SMTP password or app password
FROM_EMAIL=noreply@petflix.com     # Email address to send from
FROM_NAME=Petflix                  # Display name for emails
FRONTEND_URL=https://petflix.com  # Your frontend URL (for email links)
```

## Email Service Providers

### Option 1: Gmail (Recommended for Development)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account → Security → 2-Step Verification
   - Scroll down to "App passwords"
   - Generate a new app password for "Mail"
   - Copy the 16-character password
3. **Set Environment Variables**:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-char-app-password
   ```

### Option 2: SendGrid (Recommended for Production)

1. **Sign up** at https://sendgrid.com
2. **Create an API Key**:
   - Go to Settings → API Keys
   - Create a new API key with "Mail Send" permissions
3. **Set Environment Variables**:
   ```
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASS=your-sendgrid-api-key
   ```

### Option 3: AWS SES (For High Volume)

1. **Set up AWS SES** in your AWS account
2. **Verify your email address** or domain
3. **Get SMTP credentials** from AWS SES console
4. **Set Environment Variables**:
   ```
   SMTP_HOST=email-smtp.us-east-1.amazonaws.com  # Your SES endpoint
   SMTP_PORT=587
   SMTP_USER=your-ses-smtp-username
   SMTP_PASS=your-ses-smtp-password
   ```

### Option 4: Mailgun

1. **Sign up** at https://www.mailgun.com
2. **Get SMTP credentials** from your Mailgun dashboard
3. **Set Environment Variables**:
   ```
   SMTP_HOST=smtp.mailgun.org
   SMTP_PORT=587
   SMTP_USER=your-mailgun-smtp-username
   SMTP_PASS=your-mailgun-smtp-password
   ```

## Testing Email Configuration

If SMTP is not configured, the application will:
- Continue to function normally
- Log warnings instead of sending emails
- Not crash or throw errors

To test email functionality:
1. Set up SMTP credentials in environment variables
2. Attempt to sign up with an existing email
3. Check the email inbox for the security alert

## Email Templates

The email templates are designed to match Petflix branding:
- **Red header** (#DC2626) with warning icon
- **White content area** with clear messaging
- **Petflix branding** in footer
- **Responsive design** for mobile and desktop

## Security Features

1. **No Email Enumeration**: Error messages don't reveal if an email exists
2. **User Notifications**: Users are notified of suspicious activity
3. **Actionable Links**: Emails include links to reset passwords or review settings

## Troubleshooting

### Emails Not Sending

1. **Check Environment Variables**: Ensure all SMTP variables are set correctly
2. **Check Logs**: Look for email-related errors in Vercel function logs
3. **Test SMTP Connection**: Verify credentials work with a test email client
4. **Check Spam Folder**: Emails might be filtered as spam

### Common Issues

- **"Authentication failed"**: Check SMTP_USER and SMTP_PASS are correct
- **"Connection timeout"**: Verify SMTP_HOST and SMTP_PORT are correct
- **"Relay access denied"**: Your SMTP provider may require IP whitelisting (for Vercel, use SendGrid or SES)

