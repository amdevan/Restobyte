#!/bin/bash
# =============================================================================
# RestoByte Production Deployment Script
# =============================================================================
# Usage: ./deploy.sh [command]
# Commands: up, down, restart, logs, migrate, build, status
# =============================================================================

set -e

COMPOSE_CMD="docker compose"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() { echo -e "${GREEN}[deploy]${NC} $1"; }
print_warn()   { echo -e "${YELLOW}[deploy]${NC} $1"; }
print_error()  { echo -e "${RED}[deploy]${NC} $1"; }

# Check prerequisites
check_prereqs() {
  if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
  fi
  if ! docker compose version &> /dev/null 2>&1; then
    print_error "Docker Compose is not available."
    exit 1
  fi
  if [ ! -f .env ]; then
    print_warn ".env file not found. Creating from .env.example..."
    cp .env.example .env
    print_warn "Please edit .env with your production values before starting."
    exit 1
  fi
}

# Check required env vars
check_env() {
  local missing=0
  if grep -q "CHANGE_THIS" .env 2>/dev/null; then
    print_error "Please update .env file with your production values (contains placeholder values)."
    grep "CHANGE_THIS" .env
    missing=1
  fi
  if [ "$missing" -eq 1 ]; then
    exit 1
  fi
}

case "${1:-up}" in
  up)
    check_prereqs
    check_env
    print_status "Starting production deployment..."
    $COMPOSE_CMD up -d --build
    print_status "Waiting for services to be healthy..."
    sleep 5
    $COMPOSE_CMD ps
    print_status "Deployment complete!"
    print_status "Frontend: http://localhost:${FRONTEND_PORT:-80}"
    print_status "Backend:  http://localhost:${BACKEND_PORT:-3000}"
    ;;

  down)
    print_status "Stopping all services..."
    $COMPOSE_CMD down
    print_status "Services stopped."
    ;;

  restart)
    print_status "Restarting all services..."
    $COMPOSE_CMD restart
    print_status "Services restarted."
    ;;

  logs)
    $COMPOSE_CMD logs -f --tail=100 ${2:-}
    ;;

  migrate)
    print_status "Running database migrations..."
    $COMPOSE_CMD exec backend npx prisma migrate deploy
    print_status "Migrations complete."
    ;;

  build)
    print_status "Building all services..."
    $COMPOSE_CMD build --no-cache
    print_status "Build complete."
    ;;

  status)
    $COMPOSE_CMD ps
    ;;

  *)
    echo "Usage: $0 {up|down|restart|logs [service]|migrate|build|status}"
    exit 1
    ;;
esac
