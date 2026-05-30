#!/usr/bin/env bash
set -euo pipefail

if ! command -v docker >/dev/null 2>&1; then
  echo "docker not found. Install Docker Desktop and retry." >&2
  exit 2
fi

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "Building and starting containers (docker compose up -d --build)..."
docker compose up -d --build

echo "Containers status:"
docker compose ps

echo "Waiting a few seconds for services to initialize..."
sleep 5

echo "Backend logs (last 200 lines):"
docker compose logs --no-color --tail=200 backend || true

echo "If backend is not healthy, run: docker compose logs --tail=200 backend"
