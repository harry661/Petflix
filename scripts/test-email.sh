#!/bin/bash

# Test email script - sends a test security alert email
# Usage: ./test-email.sh your-email@example.com [signup|login]

EMAIL=${1:-"your-email@example.com"}
TYPE=${2:-"signup"}

echo "Sending test email to: $EMAIL (type: $TYPE)"
echo ""

curl -X POST http://localhost:3000/api/test/test-email \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"type\": \"$TYPE\"}"

echo ""
echo ""
echo "Check your email inbox!"

