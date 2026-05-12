#!/bin/bash
# QMS SaaS Pro - Persistent Vite Dev Server Runner
# Automatically restarts the Vite dev server if it crashes

cd /home/z/my-project/qms-saas-pro

while true; do
  echo "[$(date)] Starting QMS SaaS Pro Vite dev server..."
  npx vite --port 3000 --host 0.0.0.0
  EXIT_CODE=$?
  echo "[$(date)] Server exited with code $EXIT_CODE. Restarting in 2s..."
  sleep 2
done
