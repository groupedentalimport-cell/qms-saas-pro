#!/bin/bash
# QMS SaaS Pro Server Starter
# This script starts and maintains the SPA server

PIDFILE=/tmp/qms-server.pid
LOGFILE=/tmp/qms-server.log
SERVER=/home/z/my-project/qms-saas-pro/deploy-server.py

case "$1" in
  start)
    if [ -f "$PIDFILE" ] && kill -0 $(cat "$PIDFILE") 2>/dev/null; then
      echo "Server already running (PID $(cat $PIDFILE))"
      exit 0
    fi
    
    # Start the server with nohup and disown
    nohup python3 "$SERVER" >> "$LOGFILE" 2>&1 &
    SERVER_PID=$!
    echo $SERVER_PID > "$PIDFILE"
    disown $SERVER_PID
    
    # Wait and verify
    sleep 3
    if kill -0 $SERVER_PID 2>/dev/null; then
      echo "Server started (PID $SERVER_PID)"
    else
      echo "Server failed to start. Check $LOGFILE"
      rm -f "$PIDFILE"
      exit 1
    fi
    ;;
  status)
    if [ -f "$PIDFILE" ] && kill -0 $(cat "$PIDFILE") 2>/dev/null; then
      echo "Server running (PID $(cat $PIDFILE))"
    else
      echo "Server not running"
    fi
    ;;
  stop)
    if [ -f "$PIDFILE" ]; then
      kill $(cat "$PIDFILE") 2>/dev/null
      rm -f "$PIDFILE"
      echo "Server stopped"
    else
      echo "Server not running"
    fi
    ;;
  restart)
    $0 stop
    sleep 1
    $0 start
    ;;
esac
