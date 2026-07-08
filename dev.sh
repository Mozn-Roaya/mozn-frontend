#!/usr/bin/env bash
#
# Mozn — run the whole stack for local development.
#
#   ./dev.sh
#
# Starts three processes and stops them all together on Ctrl-C:
#   • Go API          :8080   (mozn-dashboard/server)         dashboard data
#   • Dashboard (Next):3001   (mozn-dashboard/web, /dashboard) child zone
#   • Public   (Next) :3000   (mozn-public/frontend, /)       default zone
#
# The public app proxies /dashboard/* to the dashboard zone (Next.js Multi-Zones),
# so you only ever open http://localhost:3000 — the "Dashboard" button in the
# public top-bar takes you to /dashboard.
#
# IMPORTANT: this repo intentionally has NO root package.json / package-lock.json.
# A root lockfile makes Next infer the monorepo as the workspace root and compile
# over a huge scope (~100s per route in dev). Keep orchestration in this script.

set -uo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

pids=()

# Run "$@" (after the first arg, which is the working dir) as a background job.
# `exec` makes the subshell BECOME the command, so $! is the real process and we
# can signal it (and its children) on shutdown.
start() {
  local dir="$1"; shift
  ( cd "$dir" && exec "$@" ) &
  pids+=("$!")
}

cleanup() {
  trap - INT TERM EXIT
  echo ""
  echo "→ Stopping Mozn stack…"
  for pid in "${pids[@]}"; do
    pkill -TERM -P "$pid" 2>/dev/null   # children (e.g. next-server, go's binary)
    kill  -TERM "$pid"    2>/dev/null   # the process itself (npm / go run)
  done
  wait 2>/dev/null
}
trap cleanup INT TERM EXIT

start "$ROOT/mozn-dashboard/server" go run ./cmd/api
start "$ROOT/mozn-dashboard/web"    npm run dev -- -p 3001
start "$ROOT/mozn-public/frontend"  npm run dev

cat <<'BANNER'

  Mozn is starting up ────────────────────────────────────────────
    Public app    →  http://localhost:3000            (open this)
    Dashboard     →  http://localhost:3000/dashboard  (via the button)
    Go API        →  http://localhost:8080
  ────────────────────────────────────────────────────────────────
  First visit to each screen compiles on demand (a few seconds).
  Press Ctrl-C to stop everything.

BANNER

wait
