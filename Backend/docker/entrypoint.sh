#!/usr/bin/env bash
set -euo pipefail

export PORT="${OTP_PORT:-3001}"

node /app/otp-service/index.js &
OTP_PID=$!

cleanup() {
  if kill -0 "$OTP_PID" 2>/dev/null; then
    kill "$OTP_PID" || true
  fi
}
trap cleanup EXIT INT TERM

exec uvicorn app.main:app --host 0.0.0.0 --port "${BACKEND_PORT:-8000}"
