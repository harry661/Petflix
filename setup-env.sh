#!/bin/bash

# Setup script for Petflix environment variables
# Run this script to create .env files

echo "Setting up Petflix environment variables..."

# Backend .env
cat > backend/.env << 'EOF'
# Server
PORT=3000
NODE_ENV=development

# Supabase
SUPABASE_URL=https://osanbrgfovbvzoasjyun.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zYW5icmdmb3ZidnpvYXNqeXVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3ODU3NDcsImV4cCI6MjA3ODM2MTc0N30.sSlp9GPirVQ1Z_hbRw37KH54eHz9v6eQGaX3apUuIxM
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE

# YouTube API
YOUTUBE_API_KEY=YOUR_YOUTUBE_API_KEY_HERE

# JWT Secret (for authentication)
JWT_SECRET=petflix_jwt_secret_change_in_production

# CORS
CORS_ORIGIN=http://localhost:5173
EOF

# Frontend .env
cat > frontend/.env << 'EOF'
# API
VITE_API_URL=http://localhost:3000

# Supabase
VITE_SUPABASE_URL=https://osanbrgfovbvzoasjyun.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zYW5icmdmb3ZidnpvYXNqeXVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3ODU3NDcsImV4cCI6MjA3ODM2MTc0N30.sSlp9GPirVQ1Z_hbRw37KH54eHz9v6eQGaX3apUuIxM

# YouTube API (if needed on frontend)
VITE_YOUTUBE_API_KEY=YOUR_YOUTUBE_API_KEY_HERE
EOF

echo "✅ Environment files created!"
echo ""
echo "⚠️  IMPORTANT: You still need to:"
echo "1. Add your SUPABASE_SERVICE_ROLE_KEY to backend/.env"
echo "2. Add your YOUTUBE_API_KEY to both .env files"
echo ""
echo "To get your service role key:"
echo "  - Go to Supabase Dashboard → Project Settings → API"
echo "  - Copy the 'service_role' key (keep it secret!)"
echo ""
echo "To get YouTube API key:"
echo "  - Go to Google Cloud Console → APIs & Services → Credentials"
echo "  - Create an API key and enable YouTube Data API v3"

