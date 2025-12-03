# JWT_SECRET Explained

## What is JWT_SECRET?

**JWT** = JSON Web Token

**JWT_SECRET** is a secret key used to **sign and verify** authentication tokens in your app.

## How It Works

1. **User logs in** → Backend creates a JWT token using `JWT_SECRET`
2. **Token is sent to frontend** → Stored in browser (localStorage)
3. **User makes API requests** → Frontend sends token in `Authorization` header
4. **Backend verifies token** → Uses `JWT_SECRET` to check if token is valid
5. **If valid** → Request is allowed
6. **If invalid** → Request is rejected (401 Unauthorized)

## Why You Need It

- **Security**: Without it, anyone could create fake login tokens
- **Authentication**: Required for users to stay logged in
- **Protection**: Prevents unauthorized access to protected routes

## How to Generate One

Run this command in your terminal:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

This will output a random 64-character string like:
```
a3f8d92b4c7e1f6a9b2d5c8e1f4a7b0c3d6e9f2a5b8c1d4e7f0a3b6c9d2e5f8a1
```

**Copy this string** - this is your `JWT_SECRET`.

## Where to Use It

### In Vercel (Production):
1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Add:
   - **Key**: `JWT_SECRET`
   - **Value**: (paste the generated string)
   - **Environment**: Production (and Preview if you want)

### For Local Development:
Create a `.env` file in the `backend/` directory:
```
JWT_SECRET=your_generated_secret_here
```

## Important Security Notes

⚠️ **Keep it secret!**
- Don't commit it to GitHub
- Don't share it publicly
- Use different secrets for development and production

⚠️ **If someone gets your JWT_SECRET:**
- They could create fake login tokens
- They could impersonate any user
- **Change it immediately** if compromised

## What Happens Without It?

If `JWT_SECRET` is missing:
- ❌ Users **cannot log in** (tokens can't be created)
- ❌ Protected routes **won't work**
- ❌ Authentication **completely broken**

## Example

```javascript
// When user logs in:
const token = jwt.sign(
  { userId: '123', email: 'user@example.com' },
  JWT_SECRET,  // ← Uses this to sign
  { expiresIn: '7d' }
);

// When user makes request:
const payload = jwt.verify(token, JWT_SECRET);  // ← Uses this to verify
// If JWT_SECRET doesn't match, verification fails
```

## Quick Setup

1. **Generate secret**:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Copy the output**

3. **Add to Vercel**:
   - Settings → Environment Variables
   - Key: `JWT_SECRET`
   - Value: (paste generated string)

4. **Done!** ✅

## Summary

- **What**: Secret key for signing/verifying login tokens
- **Required**: ✅ YES - Authentication won't work without it
- **Generate**: Use the Node.js command above
- **Keep secret**: Don't share or commit to Git

