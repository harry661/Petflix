# Testing Authentication

## Step 1: Start the Servers

### Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

You should see:
```
🚀 Server is running on http://localhost:3000
📡 CORS enabled for: http://localhost:5173
```

### Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

You should see:
```
VITE v7.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

## Step 2: Test Registration

1. Open browser to `http://localhost:5173`
2. Click "Create Account / Sign In"
3. Click "Create account" link
4. Fill in the form:
   - **Username**: testuser (3-20 chars, letters/numbers/underscores)
   - **Email**: test@example.com
   - **Password**: Test1234 (min 8 chars, uppercase, lowercase, number)
   - **Confirm Password**: Test1234
5. Click "Create Account"

**Expected Result**: 
- You should be redirected to `/feed`
- Check browser console for any errors
- Check backend terminal for request logs

## Step 3: Test Login

1. If you're logged in, log out (or open incognito)
2. Go to `/login`
3. Enter:
   - **Email**: test@example.com
   - **Password**: Test1234
4. Click "Sign In"

**Expected Result**:
- You should be redirected to `/feed`
- Token should be stored in localStorage

## Step 4: Verify in Database

1. Go to Supabase Dashboard → Table Editor
2. Open `users` table
3. You should see your test user with:
   - username
   - email
   - password_hash (hashed)
   - created_at timestamp

## Troubleshooting

### Backend won't start
- Check if port 3000 is already in use
- Verify `.env` file exists in `backend/` directory
- Check backend terminal for error messages

### Frontend won't start
- Check if port 5173 is already in use
- Verify `.env` file exists in `frontend/` directory
- Check frontend terminal for error messages

### Registration fails
- Check backend terminal for error logs
- Verify database tables exist
- Check browser console for API errors
- Ensure password meets requirements

### Login fails
- Verify user exists in database
- Check password is correct
- Look for error messages in backend terminal

### CORS errors
- Verify `CORS_ORIGIN` in `backend/.env` matches frontend URL
- Check backend is running on correct port

## API Endpoints to Test

You can also test directly with curl:

### Register:
```bash
curl -X POST http://localhost:3000/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test1234"
  }'
```

### Login:
```bash
curl -X POST http://localhost:3000/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234"
  }'
```

### Get Current User (requires token):
```bash
curl -X GET http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

