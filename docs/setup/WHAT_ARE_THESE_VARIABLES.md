# What Are These Environment Variables?

## JWT_SECRET

**What it is:**
- JWT = JSON Web Token
- A secret key used to **sign and verify** authentication tokens
- When users log in, the backend creates a JWT token that proves they're authenticated
- The backend uses this secret to create tokens and verify they're legitimate

**Why you need it:**
- Security: Without it, anyone could forge authentication tokens
- Your backend uses it to sign tokens when users log in
- It's used to verify tokens on protected API routes

**How to generate:**
Run this command in your terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

This creates a random 64-character string like:
```
238dfc93224b72b3c236017414b780978d48630769a07342e82ba04911fc7e6f
```

**Important:**
- Keep it secret (don't share it publicly)
- Use a different one for production vs development
- If someone gets this key, they could create fake login tokens

---

## YOUTUBE_API_KEY

**What it is:**
- An API key from Google that allows your app to access YouTube's Data API
- Used to fetch video information like view counts, titles, descriptions

**Why you DON'T need it:**
- Your app uses **YouTube embeds** which work without an API key
- Users share YouTube videos by URL, and the embed player works directly
- The API key is only used for fetching view counts, which are optional

**What happens without it:**
- Videos still work perfectly (embeds don't need it)
- View counts will default to 0 (or whatever was stored when the video was shared)
- Everything else functions normally

**If you want to add it later:**
1. Go to https://console.cloud.google.com
2. Create a project or select existing
3. Enable "YouTube Data API v3"
4. Go to Credentials → Create Credentials → API Key
5. Copy the key

**Bottom line:** You can skip this - your app works fine without it!

---

## Summary

| Variable | Required? | What It Does | Can You Skip It? |
|----------|-----------|--------------|------------------|
| **JWT_SECRET** | ✅ **YES** | Signs/verifies login tokens | ❌ No - required for authentication |
| **YOUTUBE_API_KEY** | ❌ **NO** | Fetches YouTube video stats | ✅ Yes - embeds work without it |

