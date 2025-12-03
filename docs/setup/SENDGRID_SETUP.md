# SendGrid Setup for Petflix

## Quick Setup Guide

### Step 1: Create SendGrid Account
1. Go to https://sendgrid.com
2. Sign up for a free account (100 emails/day free tier)
3. Verify your email address

### Step 2: Create API Key
1. Log into SendGrid dashboard
2. Go to **Settings** → **API Keys**
3. Click **Create API Key**
4. Name it: `Petflix Production` (or similar)
5. Select **Full Access** (or at minimum: **Mail Send** permission)
6. Click **Create & View**
7. **IMPORTANT**: Copy the API key immediately - you can only see it once!
   - It will look like: `SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Step 3: Verify Sender Identity
1. Go to **Settings** → **Sender Authentication**
2. Choose one:
   - **Single Sender Verification** (easiest for testing):
     - Click "Verify a Single Sender"
     - Enter your email address
     - Fill out the form
     - Verify via email
   - **Domain Authentication** (recommended for production):
     - Click "Authenticate Your Domain"
     - Follow DNS setup instructions

### Step 4: Set Environment Variables

#### For Local Development (.env file):
```bash
SENDGRID_API_KEY=SG.your-api-key-here
FROM_EMAIL=noreply@petflix.com  # Must match verified sender
FROM_NAME=Petflix
FRONTEND_URL=http://localhost:5173
```

#### For Vercel Production:
1. Go to your Vercel project dashboard
2. Go to **Settings** → **Environment Variables**
3. Add these variables:

| Key | Value | Environment |
|-----|-------|------------|
| `SENDGRID_API_KEY` | `SG.your-api-key-here` | Production, Preview, Development |
| `FROM_EMAIL` | `noreply@petflix.com` | Production, Preview, Development |
| `FROM_NAME` | `Petflix` | Production, Preview, Development |
| `FRONTEND_URL` | `https://your-frontend.vercel.app` | Production, Preview, Development |

### Step 5: Test the Configuration

After setting environment variables, test with:

```bash
# Check configuration
curl http://localhost:3000/test/test-smtp

# Send test email
curl -X POST http://localhost:3000/test/test-email \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com", "type": "signup"}'
```

## Important Notes

1. **FROM_EMAIL must be verified** in SendGrid
   - For testing: Use Single Sender Verification
   - For production: Use Domain Authentication

2. **Free Tier Limits:**
   - 100 emails/day
   - Perfect for development and small production use

3. **API Key Security:**
   - Never commit API keys to git
   - Store only in environment variables
   - Rotate keys if compromised

4. **Email Deliverability:**
   - SendGrid handles all SMTP details
   - Better deliverability than personal SMTP
   - Built-in analytics and tracking

## Troubleshooting

### "Email service not configured"
- Check `SENDGRID_API_KEY` is set in environment variables
- Restart your backend server after setting variables

### "Authentication failed"
- Verify your API key is correct
- Check API key has "Mail Send" permission

### "Sender not verified"
- Verify your `FROM_EMAIL` in SendGrid dashboard
- For Single Sender: Check email verification status
- For Domain: Check DNS records are correct

### Emails going to spam
- Set up SPF/DKIM records (Domain Authentication)
- Use a professional FROM_EMAIL address
- Avoid spam trigger words in subject/content

## Next Steps

Once SendGrid is configured:
1. ✅ Password reset emails will work
2. ✅ Security alert emails will work
3. ✅ All emails sent via SendGrid API (no SMTP needed)

