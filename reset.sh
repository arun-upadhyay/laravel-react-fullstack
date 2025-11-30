#!/usr/bin/env bash
# reset.sh — Clean reset and bootstrap Laravel + React (Vite) inside Docker
# - Removes leftover named containers (react-spa, laravel-api, mysql, nginx) to avoid conflicts
# - Optional custom compose project name to avoid cross‑project clashes
# - Bootstraps Laravel (composer install, APP_KEY, safe cache/session/queue, migrations with retry, optional cache driver restore)
# - Bootstraps React (Vite + TS) inside container (npm create + npm install)
#
# Usage:
#   chmod +x reset.sh
#   ./reset.sh                 # safe reset (keeps DB volume/data)
#   ./reset.sh --full          # full reset (removes volumes; DESTROYS DB data)
#   ./reset.sh --no-build      # restart without rebuilding images
#   ./reset.sh --project myproj# run compose under a custom project name
#   ./reset.sh --help          # show help

set -euo pipefail

PROJECT_DIR="$(pwd)"
COMPOSE_FILE="${PROJECT_DIR}/docker-compose.yml"

# Runtime options
FULL_RESET=false
NO_BUILD=false
CUSTOM_PROJECT=""

# Pretty printers (avoid echo -e quirks)
print_step() { printf "\n\033[1;36m==> %s\033[0m\n" "$1"; }
print_warn() { printf "\033[1;33m[WARN]\033[0m %s\n" "$1"; }
print_err()  { printf "\033[1;31m[ERROR]\033[0m %s\n" "$1"; }

usage() {
  cat <<'EOF'
reset.sh — reset and bootstrap the Docker stack

Options:
  --full           Remove named volumes (DB data will be destroyed)
  --no-build       Do not rebuild images; only restart services
  --project NAME   Use a custom compose project name to avoid cross-project conflicts
  --help           Show this help
EOF
}

# --- Argument parsing ---
while (($#)); do
  case "$1" in
    --full) FULL_RESET=true; shift ;;
    --no-build) NO_BUILD=true; shift ;;
    --project)
      if [[ $# -lt 2 ]]; then print_err "Missing value for --project"; exit 1; fi
      CUSTOM_PROJECT="$2"; shift 2 ;;
    --help) usage; exit 0 ;;
    *) print_warn "Unknown option: $1"; usage; exit 1 ;;
  esac
done

# --- Sanity checks ---
if [[ ! -f "$COMPOSE_FILE" ]]; then
  print_err "docker-compose.yml not found in $PROJECT_DIR"
  exit 1
fi
if [[ ! -d backend || ! -d frontend ]]; then
  print_err "Expected 'backend/' and 'frontend/' directories in project root."
  exit 1
fi

# --- Compose wrapper (no array expansion; compatible with bash 3.2) ---
docker_compose() {
  # Usage: docker_compose <compose subcommand> [args...]
  if [[ -n "$CUSTOM_PROJECT" ]]; then
    docker compose -p "$CUSTOM_PROJECT" "$@"
  else
    docker compose "$@"
  fi
}

# --- Helpers ---
wait_for_container() {
  local name="$1"
  local timeout="${2:-60}"
  local i=0
  print_step "Waiting for container '$name' to be running (timeout: ${timeout}s)"
  while true; do
    if docker inspect -f '{{.State.Running}}' "$name" 2>/dev/null | grep -q true; then
      echo "'$name' is running."
      break
    fi
    i=$(( i + 1 ))
    if (( i >= timeout )); then
      print_warn "Timed out waiting for '$name'. Continuing..."
      break
    fi
    sleep 1
  done
}

run_be() { docker exec -i laravel-api bash -lc "$*"; }

# --- Pre-clean named containers to avoid conflicts ---
print_step "Removing any existing named containers to avoid conflicts"
for name in react-spa laravel-api mysql nginx; do
  docker rm -f "$name" 2>/dev/null || true
done

# --- Compose down (with or without volumes) ---
if $FULL_RESET; then
  print_step "Stopping and removing compose services, networks and volumes"
  docker_compose down -v || true
else
  print_step "Stopping and removing compose services"
  docker_compose down || true
fi

# Remove compose orphans (if any)
print_step "Removing compose orphans (if any)"
docker_compose rm -f || true

# Prune builder cache (safe)
print_step "Pruning builder cache"
docker builder prune -f || true

# --- Rebuild and start ---
if $NO_BUILD; then
  print_step "Starting services without rebuild"
  docker_compose up -d
else
  print_step "Rebuilding images and starting services"
  docker_compose up -d --build
fi

# Wait for core containers to be running
wait_for_container "mysql" 60
wait_for_container "laravel-api" 60

# --- Bootstrap Laravel (backend) ---
print_step "Bootstrapping Laravel (backend)"
if run_be "test -f /var/www/html/artisan"; then
  echo "Laravel present. Running maintenance commands..."
  run_be "cd /var/www/html && composer install"
else
  echo "Creating Laravel app in backend/src ..."
  run_be "cd /var/www/html && composer create-project laravel/laravel ."
fi

print_step "Ensuring .env, APP_KEY, and safe drivers for bootstrap"
# Ensure .env exists
run_be "cd /var/www/html && [[ -f .env ]] || cp -n .env.example .env"

# Capture original CACHE_DRIVER to optionally restore later
ORIG_CACHE_DRIVER=$(docker exec -i laravel-api bash -lc 'cd /var/www/html && grep -E "^CACHE_DRIVER=" .env | cut -d"=" -f2 || true')

# Force safe drivers (no DB dependency during bootstrap)
run_be "cd /var/www/html && \
  sed -i 's/^CACHE_DRIVER=.*/CACHE_DRIVER=file/' .env && \
  sed -i 's/^SESSION_DRIVER=.*/SESSION_DRIVER=file/' .env"

# Generate APP_KEY (idempotent)
run_be "cd /var/www/html && php artisan key:generate || true"

# --- Run migrations with retry BEFORE clearing cache ---
print_step "Running database migrations (with retry)"
ATTEMPTS=0
until run_be "cd /var/www/html && php artisan migrate --force"; do
  ATTEMPTS=$((ATTEMPTS+1))
  if (( ATTEMPTS >= 5 )); then
    print_warn "Migrations failed after $ATTEMPTS attempts. Check DB connectivity and .env."
    break
  fi
  echo "Migration attempt $ATTEMPTS failed. Waiting for DB..."
  sleep 5
done

# If original cache driver was 'database', restore and ensure cache table exists (bash 3.2-compatible)
shopt -s nocasematch || true
if [[ "$ORIG_CACHE_DRIVER" == "database" ]]; then
  print_step "Restoring CACHE_DRIVER=database and ensuring cache table"
  run_be "cd /var/www/html && sed -i 's/^CACHE_DRIVER=.*/CACHE_DRIVER=database/' .env"
  run_be "cd /var/www/html && php artisan cache:table || true"
  run_be "cd /var/www/html && php artisan migrate --force || true"
fi
shopt -u nocasematch || true

# Finally clear caches/optimize
print_step "Clearing config/cache/optimize"
run_be "cd /var/www/html && php artisan config:clear && php artisan cache:clear && php artisan optimize:clear"

# --- Bootstrap React (frontend) ---
print_step "Bootstrapping React (Vite + TS) in frontend"
if docker_compose run --rm frontend bash -lc "test -f /app/package.json"; then
  echo "React app present. Installing dependencies..."
  docker_compose run --rm frontend bash -lc "cd /app && npm install"
else
  echo "Scaffolding React app with Vite in /app ..."
  docker_compose run --rm frontend bash -lc "cd /app && npm create vite@latest . -- --template react-ts && npm install"
fi

print_step "Restarting frontend service"
docker_compose up -d frontend

# --- Status ---
print_step "Stack status"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

print_step "Verification URLs"
echo "- Laravel:  http://localhost:8000"
echo "- Frontend: http://localhost:5173"
echo "- Mailpit:  http://localhost:8025"
echo "- Rabbitmq: http://localhost:15672"


echo "- API health (optional): http://localhost:8000/api/health"

print_step "Done"
