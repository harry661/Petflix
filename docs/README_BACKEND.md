# Backend Server Setup

## ⚠️ IMPORTANT: Keep Backend Running

The backend **MUST** be running for the frontend to work. If you see "Cannot connect to server" errors, the backend has stopped.

## Quick Start (Recommended - Persistent)

**Use PM2 for persistent backend (survives terminal closes):**

```bash
./start-backend-persistent.sh
```

This will:
- Install PM2 if needed
- Start the backend in the background
- Keep it running even if you close the terminal
- Auto-restart if it crashes

**View logs:**
```bash
pm2 logs petflix-backend
```

**Stop backend:**
```bash
pm2 stop petflix-backend
```

**Restart backend:**
```bash
pm2 restart petflix-backend
```

## Alternative: Manual Start

If PM2 doesn't work, keep a terminal open:

```bash
cd backend
npm run dev
```

**Keep this terminal window open** - closing it stops the backend.

## Check if Backend is Running

```bash
curl http://localhost:3000/api/v1/users/me
```

If you get a response (even an error), the backend is running.

## Troubleshooting

**Backend keeps stopping?**
- Use PM2 (see above) - it auto-restarts
- Check for errors: `pm2 logs petflix-backend`
- Make sure port 3000 isn't blocked

**Port 3000 already in use?**
```bash
lsof -ti:3000 | xargs kill -9
```

**YouTube videos not loading?**
- Check backend logs for YouTube API errors
- May be quota exceeded - check Google Cloud Console
- Backend will continue with database videos only
