# 🚀 START HERE - Petflix Setup

## Quick Start Commands

### Terminal 1 - Backend (if not already running):
```bash
cd backend
npm run dev
```

You should see:
```
🚀 Server is running on http://localhost:3000
```

### Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

OR use the helper script:
```bash
./start-frontend.sh
```

You should see:
```
➜  Local:   http://localhost:5173/
```

## 🌐 Access the App

**Open your browser and go to:**
```
http://localhost:5173
```

You'll see the **API Tester** page where you can test:
- ✅ Health check
- ✅ User registration
- ✅ User login
- ✅ Get current user (authenticated)

## 🔧 Troubleshooting

### "Cannot connect to server"
1. **Check backend is running**: Open http://localhost:3000/health
   - Should show: `{"status":"ok","message":"Petflix API is running"}`
   
2. **Check frontend is running**: Look for `http://localhost:5173` in terminal

3. **Check ports aren't in use**:
   ```bash
   lsof -ti:3000  # Backend port
   lsof -ti:5173  # Frontend port
   ```

### Frontend won't start
```bash
cd frontend
rm -rf node_modules
npm install
npm run dev
```

### Backend errors
- Check `backend/.env` file exists
- Verify Supabase credentials are set
- Check backend terminal for error messages

## 📝 Test Registration

1. Go to http://localhost:5173
2. Fill in the registration form:
   - Username: `testuser`
   - Email: `test@example.com`
   - Password: `Test1234`
3. Click "Register"
4. You should see a success message with a token!

## ✅ Success Indicators

- Backend: http://localhost:3000/health returns JSON
- Frontend: http://localhost:5173 shows the test page
- Registration: Creates user and returns token
- Login: Returns token for existing user

