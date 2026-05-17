#!/bin/bash
# =============================================================================
# QMS SaaS Pro — Production Startup Script
# =============================================================================
# This script starts the application in production mode.
# It uses the Next.js production server (standalone output).
#
# Usage:
#   ./start.sh              # Start in production mode
#   ./start.sh dev          # Start in development mode
#   ./start.sh status       # Check if server is running
#   ./start.sh stop         # Stop the server
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR"
PIDFILE="/tmp/qms-server.pid"
LOGFILE="/tmp/qms-server.log"
PORT="${PORT:-3000}"

# --- Helper Functions ---

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

is_running() {
  [ -f "$PIDFILE" ] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null
}

wait_for_health() {
  local max_attempts=30
  local attempt=1
  while [ $attempt -le $max_attempts ]; do
    if curl -sf "http://localhost:${PORT}/" > /dev/null 2>&1; then
      return 0
    fi
    sleep 1
    attempt=$((attempt + 1))
  done
  return 1
}

# --- Commands ---

cmd_start() {
  if is_running; then
    log "Server already running (PID $(cat "$PIDFILE"))"
    return 0
  fi

  log "Starting QMS SaaS Pro on port ${PORT}..."

  # Check for required environment variables
  if [ -z "${DATABASE_URL:-}" ]; then
    export DATABASE_URL="file:./dev.db"
    log "Warning: DATABASE_URL not set, using default SQLite"
  fi

  cd "$PROJECT_DIR"

  # Start the Next.js server in production mode
  nohup node .next/standalone/server.js \
    --port "$PORT" \
    >> "$LOGFILE" 2>&1 &

  local pid=$!
  echo "$pid" > "$PIDFILE"
  disown "$pid"

  log "Server started (PID $pid)"

  if wait_for_health; then
    log "Health check passed — server is ready"
  else
    log "Warning: Health check did not pass within 30s. Check $LOGFILE"
  fi
}

cmd_dev() {
  log "Starting QMS SaaS Pro in DEVELOPMENT mode on port ${PORT}..."
  cd "$PROJECT_DIR"
  exec npx next dev -p "$PORT"
}

cmd_stop() {
  if ! is_running; then
    log "Server is not running"
    return 0
  fi

  local pid
  pid=$(cat "$PIDFILE")
  log "Stopping server (PID $pid)..."
  kill "$pid" 2>/dev/null || true
  rm -f "$PIDFILE"
  log "Server stopped"
}

cmd_status() {
  if is_running; then
    local pid
    pid=$(cat "$PIDFILE")
    log "Server running (PID $pid)"
    if curl -sf "http://localhost:${PORT}/" > /dev/null 2>&1; then
      log "Health check: OK"
    else
      log "Health check: FAILING"
    fi
  else
    log "Server is not running"
  fi
}

# --- Main ---

case "${1:-start}" in
  start)   cmd_start   ;;
  dev)     cmd_dev     ;;
  stop)    cmd_stop    ;;
  status)  cmd_status  ;;
  restart) cmd_stop; sleep 2; cmd_start ;;
  *)
    echo "Usage: $0 {start|dev|stop|status|restart}"
    exit 1
    ;;
esac
