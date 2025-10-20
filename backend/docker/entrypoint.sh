#!/usr/bin/env bash
set -euo pipefail

# Required: DATABASE_URL (async) for app
: "${DATABASE_URL:?DATABASE_URL is required}"

# Railway sets PORT dynamically
PORT_VAL="${PORT:-8000}"

echo "[entrypoint] Starting with PORT=${PORT_VAL}"

run_alembic_cmd() {
  local cmd="$1" # e.g. "current" or "upgrade head"
  if [ -n "${DATABASE_URL_SYNC:-}" ]; then
    DATABASE_URL="${DATABASE_URL_SYNC}" alembic ${cmd}
  else
    alembic ${cmd}
  fi
}

# Wait for DB readiness using 'alembic current'
echo "[entrypoint] Checking database readiness via 'alembic current'..."
attempt=1
until run_alembic_cmd "current" >/dev/null 2>&1; do
  if [ ${attempt} -ge 15 ]; then
    echo "[entrypoint] Database not ready after ${attempt} attempts. Exiting." >&2
    exit 1
  fi
  echo "[entrypoint] DB not ready (attempt ${attempt}/15). Retrying in 2s..."
  attempt=$((attempt + 1))
  sleep 2
done
echo "[entrypoint] Database is ready. Running migrations..."

# Run Alembic migrations to head
if [ -n "${DATABASE_URL_SYNC:-}" ]; then
  echo "[entrypoint] Running alembic upgrade head (sync)"
else
  echo "[entrypoint] Running alembic upgrade head (derived sync via env.py)"
fi
run_alembic_cmd "upgrade head"

# Optional seed (idempotent)
if [ "${SEED_ON_START:-false}" = "true" ]; then
  echo "[entrypoint] Running seed (idempotent)"
  python -m app.scripts.seed || true
fi

# Start app
echo "[entrypoint] Launching Uvicorn..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT_VAL}"


