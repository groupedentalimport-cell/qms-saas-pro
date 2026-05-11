#!/bin/bash
# QMS SaaS Pro - Persistent Server Runner
# Automatically restarts the Next.js production server if it crashes

cd /home/z/my-project

while true; do
  echo "[$(date)] Starting QMS SaaS Pro server..."
  node .next/standalone/server.js
  EXIT_CODE=$?
  echo "[$(date)] Server exited with code $EXIT_CODE. Restarting in 2s..."
  sleep 2
done
