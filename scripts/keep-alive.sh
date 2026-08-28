#!/bin/bash

# Guwahati Biotech Park - GBP-FTMS
# Keep-Alive Bash Script for Supabase

SUPABASE_URL="${VITE_SUPABASE_URL:-https://zbjzddcwltdfvgkjvnwr.supabase.co}"
ANON_KEY="${VITE_SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpianpkZGN3bHRkZnZna2p2bndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4OTg2NDksImV4cCI6MjEwMzQ3NDY0OX0.ZCQHNcYXMjHuDcE19uH3vSrf2-Tz1x0EBfkP0V2U9O4}"

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
echo "[$TIMESTAMP] Sending Supabase keep-alive query..."

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X GET \
  "${SUPABASE_URL}/rest/v1/profiles?select=count&limit=1" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Prefer: count=exact")

if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 206 ]; then
  echo "[$TIMESTAMP] ✓ Supabase ping successful (HTTP $HTTP_CODE). Database is active."
  exit 0
else
  echo "[$TIMESTAMP] ⚠ Received HTTP $HTTP_CODE from Supabase."
  exit 1
fi
