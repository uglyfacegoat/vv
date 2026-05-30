#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"

cleanup() {
  if [[ -n "${BACKEND_PID:-}" ]]; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

echo "Starting BudgetIQ without Docker/PostgreSQL"
echo "Backend:  http://127.0.0.1:8080"
echo "Frontend: http://127.0.0.1:5173"

(
  cd "$BACKEND_DIR"
  BUDGETIQ_LOCAL_ONLY=1 \
  GOCACHE="$BACKEND_DIR/.gocache" \
  go run ./cmd/api
) &
BACKEND_PID=$!

cd "$ROOT_DIR"
npm run dev -- --host 127.0.0.1
