#!/bin/bash
# Persistent backend startup script
cd "$(dirname "$0")/backend"

# Create logs directory
mkdir -p logs

# Check if PM2 is installed
if command -v pm2 &> /dev/null; then
    echo "Starting backend with PM2 (persistent)..."
    pm2 start ecosystem.config.js
    pm2 save
    echo "Backend started! Use 'pm2 logs petflix-backend' to view logs"
    echo "Use 'pm2 stop petflix-backend' to stop"
    echo "Use 'pm2 restart petflix-backend' to restart"
else
    echo "PM2 not found. Installing PM2 globally..."
    npm install -g pm2
    echo "Starting backend with PM2 (persistent)..."
    pm2 start ecosystem.config.js
    pm2 save
    pm2 startup
    echo "Backend started! Use 'pm2 logs petflix-backend' to view logs"
fi

