{ pkgs ? import <nixpkgs> {} }:

let
  pythonEnv = pkgs.python312;
in
pkgs.mkShell {
  name = "finance-tracker-dev";

  buildInputs = with pkgs; [
    # Python
    pythonEnv

    # Node.js
    nodejs
    nodePackages.npm

    # Build tools
    gcc
    zlib

    # Utils
    lsof
  ];

  shellHook = ''
    export PROJECT_ROOT="$(pwd)"
    export FINANCE_API_KEY="finance-api-key"

    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║            [FINANCE_TRACKER] Dev Environment               ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""

    # === Backend setup ===
    if [ ! -d "$PROJECT_ROOT/backend/venv" ]; then
      echo "[*] Creating Python virtual environment..."
      ${pythonEnv}/bin/python -m venv "$PROJECT_ROOT/backend/venv"
    fi

    source "$PROJECT_ROOT/backend/venv/bin/activate"

    if [ -f "$PROJECT_ROOT/backend/requirements.txt" ]; then
      echo "[*] Installing Python dependencies..."
      pip install -q --upgrade pip
      pip install -q -r "$PROJECT_ROOT/backend/requirements.txt"
    fi

    # === Frontend setup ===
    if [ -d "$PROJECT_ROOT/frontend" ] && [ ! -d "$PROJECT_ROOT/frontend/node_modules" ]; then
      echo "[*] Installing Node.js dependencies..."
      cd "$PROJECT_ROOT/frontend" && npm install --silent
      cd "$PROJECT_ROOT"
    fi

    echo ""
    echo "Ready! Available commands:"
    echo ""
    echo "  start-backend   - Start FastAPI backend (port 8000)"
    echo "  start-frontend  - Start Vite dev server (port 5173)"
    echo "  start-all       - Start both in background"
    echo "  stop-all        - Stop all background services"
    echo "  build-frontend  - Build frontend for production"
    echo ""

    # === Helper functions ===
    start-backend() {
      echo "[*] Starting backend on http://localhost:8000 ..."
      cd "$PROJECT_ROOT/backend" && python run.py
    }

    start-frontend() {
      echo "[*] Starting frontend on http://localhost:5173 ..."
      cd "$PROJECT_ROOT/frontend" && npm run dev
    }

    start-all() {
      echo "[*] Starting all services in background..."

      cd "$PROJECT_ROOT/backend" && python run.py &
      BACKEND_PID=$!
      echo "    Backend PID: $BACKEND_PID"

      sleep 2

      cd "$PROJECT_ROOT/frontend" && npm run dev &
      FRONTEND_PID=$!
      echo "    Frontend PID: $FRONTEND_PID"

      echo "$BACKEND_PID" > "$PROJECT_ROOT/.backend.pid"
      echo "$FRONTEND_PID" > "$PROJECT_ROOT/.frontend.pid"

      echo ""
      echo "[*] Services started!"
      echo "    Backend:  http://localhost:8000"
      echo "    Frontend: http://localhost:5173"
      echo ""
      echo "    Run 'stop-all' to stop services"
    }

    stop-all() {
      echo "[*] Stopping services..."

      if [ -f "$PROJECT_ROOT/.backend.pid" ]; then
        kill $(cat "$PROJECT_ROOT/.backend.pid") 2>/dev/null && echo "    Backend stopped"
        rm -f "$PROJECT_ROOT/.backend.pid"
      fi

      if [ -f "$PROJECT_ROOT/.frontend.pid" ]; then
        kill $(cat "$PROJECT_ROOT/.frontend.pid") 2>/dev/null && echo "    Frontend stopped"
        rm -f "$PROJECT_ROOT/.frontend.pid"
      fi

      # Kill any remaining processes on ports
      ${pkgs.lsof}/bin/lsof -ti:8000 | xargs -r kill 2>/dev/null
      ${pkgs.lsof}/bin/lsof -ti:5173 | xargs -r kill 2>/dev/null

      echo "[*] Done"
    }

    build-frontend() {
      echo "[*] Building frontend..."
      cd "$PROJECT_ROOT/frontend" && npm run build
      echo "[*] Build complete: frontend/dist/"
    }

    export -f start-backend
    export -f start-frontend
    export -f start-all
    export -f stop-all
    export -f build-frontend
  '';
}
