# Gmail SMTP Setup for Petflix

## Step-by-Step Guide

### Step 1: Enable 2-Factor Authentication

1. Go to your Google Account: https://myaccount.google.com
2. Click **Security** in the left sidebar
3. Under "Signing in to Google", find **2-Step Verification**
4. Click **Get Started** and follow the prompts to enable 2FA
   - You'll need to verify your phone number
   - Google will send you a verification code

### Step 2: Generate an App Password

1. After enabling 2FA, go back to **Security** → **2-Step Verification**
2. Scroll down to find **App passwords** (you may need to search for it)
3. Click **App passwords**
4. You may need to sign in again
5. Select **Mail** as the app type
6. Select **Other (Custom name)** as the device type
7. Enter a name like "Petflix Backend" or "Petflix Email Service"
8. Click **Generate**
9. **Copy the 16-character password** that appears (it will look like: `abcd efgh ijkl mnop`)
   - ⚠️ **Important**: You can only see this password once! Copy it immediately.

### Step 3: Set Environment Variables in Vercel

1. Go to your **Vercel Dashboard**: https://vercel.com/dashboard
2. Select your **backend project** (the one that runs the API)
3. Go to **Settings** → **Environment Variables**
4. Add the following variables:

#### Required Variables:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=abcdefghijklmnop
FROM_EMAIL=your-email@gmail.com
FROM_NAME=Petflix
FRONTEND_URL=https://your-frontend-url.vercel.app
```

#### Detailed Instructions:

1. **SMTP_HOST**
   - Key: `SMTP_HOST`
   - Value: `smtp.gmail.com`
   - Environment: Select **Production**, **Preview**, and **Development** (or just Production if you only want it in production)

2. **SMTP_PORT**
   - Key: `SMTP_PORT`
   - Value: `587`
   - Environment: Select **Production**, **Preview**, and **Development**

3. **SMTP_USER**
   - Key: `SMTP_USER`
   - Value: Your Gmail address (e.g., `yourname@gmail.com`)
   - Environment: Select **Production**, **Preview**, and **Development**

4. **SMTP_PASS**
   - Key: `SMTP_PASS`
   - Value: The 16-character app password you generated (remove spaces: `abcdefghijklmnop`)
   - Environment: Select **Production**, **Preview**, and **Development**
   - ⚠️ **Important**: This is sensitive! Make sure it's set correctly.

5. **FROM_EMAIL**
   - Key: `FROM_EMAIL`
   - Value: Your Gmail address (e.g., `yourname@gmail.com`)
   - Environment: Select **Production**, **Preview**, and **Development**

6. **FROM_NAME**
   - Key: `FROM_NAME`
   - Value: `Petflix`
   - Environment: Select **Production**, **Preview**, and **Development**

7. **FRONTEND_URL**
   - Key: `FRONTEND_URL`
   - Value: Your frontend Vercel URL (e.g., `https://petflix.vercel.app`)
   - Environment: Select **Production**, **Preview**, and **Development**

### Step 4: Redeploy Your Backend

After adding all environment variables:

1. Go to your backend project in Vercel
2. Click **Deployments** tab
3. Click the **three dots** (⋯) on your latest deployment
4. Click **Redeploy**
5. Wait for the deployment to complete

### Step 5: Test the Setup

1. Try to sign up with an email that already exists in your database
2. Check the email inbox of that existing user
3. You should receive a security alert email from Petflix

## Troubleshooting

### "Authentication failed" Error

- **Check**: Make sure you're using the **App Password**, not your regular Gmail password
- **Check**: Ensure 2FA is enabled on your Google account
- **Check**: Make sure there are no spaces in the app password when you paste it

### "Connection timeout" Error

- **Check**: Verify `SMTP_HOST` is exactly `smtp.gmail.com`
- **Check**: Verify `SMTP_PORT` is exactly `587`
- **Check**: Make sure your Vercel deployment has internet access

### Emails Not Sending

- **Check**: Look at Vercel function logs for email-related errors
- **Check**: Verify all environment variables are set correctly
- **Check**: Make sure you redeployed after adding environment variables
- **Check**: Check your spam folder - Gmail might filter automated emails

### "Less secure app access" Error

- **Solution**: You don't need "less secure app access" if you use App Passwords
- Make sure you're using the App Password, not your regular password

## Security Notes

- ⚠️ **Never commit** your `SMTP_PASS` to Git
- ⚠️ **App Passwords** are safer than your main password
- ⚠️ You can revoke App Passwords anytime from your Google Account settings
- ⚠️ If you suspect your App Password is compromised, generate a new one immediately

## Alternative: Use a Dedicated Email Service

For production, consider using:
- **SendGrid** (free tier: 100 emails/day)
- **AWS SES** (very cheap, $0.10 per 1000 emails)
- **Mailgun** (free tier: 5000 emails/month)

These services are more reliable and have better deliverability than Gmail SMTP.

