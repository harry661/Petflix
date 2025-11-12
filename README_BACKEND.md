# Backend Server Setup

## Quick Start

The backend server must be running for the frontend to work. To start it:

```bash
cd backend
npm run dev
```

Or use the startup script:

```bash
./start-backend.sh
```

## Why the backend stops

The backend may stop if:
- The terminal window is closed
- The process is killed
- Your computer goes to sleep
- There's an error that crashes the server

## Keep it running

**Option 1: Keep terminal open**
- Open a terminal and run `npm run dev` in the `backend` folder
- Keep that terminal window open while developing

**Option 2: Run in background (macOS/Linux)**
```bash
cd backend
nohup npm run dev > backend.log 2>&1 &
```

**Option 3: Use a process manager (recommended for production)**
- Install PM2: `npm install -g pm2`
- Run: `pm2 start backend/src/index.ts --interpreter ts-node`
- Or use: `pm2 start npm --name "petflix-backend" -- run dev`

## Check if backend is running

```bash
curl http://localhost:3000/api/v1/users/me
```

If you get a response (even an error), the backend is running.

