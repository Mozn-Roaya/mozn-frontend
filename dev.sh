#!/usr/bin/env bash
#
# Mozn — run the frontend stack for local development.
#
#   ./dev.sh
#
# Starts two Next.js processes and stops them all together on Ctrl-C:
#   • Public    (Next) :3000   (mozn-public/frontend)   citizen map app
#   • Dashboard (Next) :3001   (mozn-dashboard/web)      admin dashboard
#
# DATA: both apps fetch server-side from the REAL Mozn backend at
# http://localhost:8080 (dashboard: API_BASE_URL; public: NEXT_PUBLIC_API_BASE).
# That backend is a SEPARATE repository — start it there. This script does not run
# a local mock API (the old mozn-dashboard/server mock has been removed).
#
# The two apps are INDEPENDENT — there is no Multi-Zones proxy between them. In
# production they deploy as separate origins (mozn.org.ly and
# dashboard.mozn.org.ly). Locally, open each on its own port below.
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
    pkill -TERM -P "$pid" 2>/dev/null   # children (e.g. next-server)
    kill  -TERM "$pid"    2>/dev/null   # the process itself (npm)
  done
  wait 2>/dev/null
}
trap cleanup INT TERM EXIT

start "$ROOT/mozn-dashboard/web"    npm run dev -- -p 3001
start "$ROOT/mozn-public/frontend"  npm run dev

cat <<'BANNER'

  Mozn frontend is starting up ──────────────────────────────────
    Public app    →  http://localhost:3000
    Dashboard     →  http://localhost:3001

    Backend API   →  expected at http://localhost:8080
                     (run the Mozn backend repo separately)
  ────────────────────────────────────────────────────────────────
  First visit to each screen compiles on demand (a few seconds).
  Press Ctrl-C to stop everything.

BANNER

wait
