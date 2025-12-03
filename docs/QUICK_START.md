# Quick Start Guide

## ✅ Backend Status
The backend IS running on `http://localhost:3000`

You can test it by opening: http://localhost:3000/health in your browser
You should see: `{"status":"ok","message":"Petflix API is running"}`

## 🚀 Start the Frontend

**Open a NEW terminal window** and run:

```bash
cd /Users/harry/Documents/Petflix/frontend
npm run dev
```

Wait for it to say:
```
➜  Local:   http://localhost:5173/
```

## 🌐 Access the App

**Open your browser** and go to:
```
http://localhost:5173
```

**NOT** `http://localhost:3000` - that's the backend API!

## 🔍 Troubleshooting

### "Safari can't connect to server"
- Make sure you're going to `http://localhost:5173` (not 3000)
- Make sure the frontend is running (check terminal)
- Try a different browser (Chrome, Firefox)

### Frontend won't start
- Make sure you're in the `frontend` directory
- Check for error messages in terminal
- Try: `npm install` first

### Backend errors
- Check the backend terminal for error messages
- Verify `.env` file exists in `backend/` directory

## 📝 Quick Test

1. Backend: http://localhost:3000/health ✅ (should work)
2. Frontend: http://localhost:5173 ✅ (needs to be started)
3. Register: http://localhost:5173/register
4. Login: http://localhost:5173/login

