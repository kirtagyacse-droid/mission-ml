#!/bin/bash
DIR="/home/kirtagya/Desktop/mission-ml"

# Helper to check if a process is running in a specific directory
is_project_running_on_port() {
  local port=$1
  local target_dir=$2
  local pid=$(lsof -ti tcp:$port 2>/dev/null)
  if [ -n "$pid" ]; then
    local cwd=$(readlink -f "/proc/$pid/cwd" 2>/dev/null)
    if [ "$cwd" = "$target_dir" ]; then
      return 0
    fi
  fi
  return 1
}

# Find which port the project is running on
find_project_port() {
  local target_dir=$1
  # Next.js defaults to 3000 and increments if busy
  for port in {3000..3010}; do
    if is_project_running_on_port $port "$target_dir"; then
      echo $port
      return 0
    fi
  done
  echo ""
  return 1
}

ACTIVE_PORT=$(find_project_port "$DIR")

if [ -n "$ACTIVE_PORT" ]; then
    echo "Server is already running on port $ACTIVE_PORT."
else
    echo "Starting Next.js development server..."
    cd "$DIR" || exit 1
    # Run Next.js in the background detached, logging output to dev-server.log
    nohup npm run dev > "$DIR/dev-server.log" 2>&1 &
    disown
    
    # Wait for the port to open and be occupied by our project (up to 15 seconds)
    for i in {1..15}; do
        sleep 1
        ACTIVE_PORT=$(find_project_port "$DIR")
        if [ -n "$ACTIVE_PORT" ]; then
            break
        fi
    done
fi

if [ -n "$ACTIVE_PORT" ]; then
    echo "Opening Mission ML on port $ACTIVE_PORT..."
    xdg-open "http://localhost:$ACTIVE_PORT"
else
    echo "Failed to start or locate Mission ML server. Check dev-server.log for details."
    exit 1
fi
