# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal finance tracking web application with terminal/hacker aesthetic. Single-user auth via API key. Features: income/expense tracking, budgets, savings goals, analytics dashboard.

## Tech Stack

- **Backend:** Python 3.11+, FastAPI, async SQLAlchemy, SQLite (aiosqlite), Pydantic v2
- **Frontend:** React 18 (Vite), JSX (no TypeScript), React Router v6, Recharts, Axios
- **Styling:** Single global `App.css` with CSS variables, no UI libraries

## Commands

### Development (with Nix)
```bash
nix-shell              # Enter dev environment, auto-installs dependencies
start-backend          # Run FastAPI on :8000
start-frontend         # Run Vite on :5173
start-all              # Run both in background
stop-all               # Stop background services
build-frontend         # Build for production
```

### Development (manual)
```bash
# Backend
cd backend && pip install -r requirements.txt && python run.py

# Frontend
cd frontend && npm install && npm run dev
```

### NixOS Deployment
```bash
# Update service
sudo systemctl restart finance-tracker-update

# View logs
sudo journalctl -u finance-tracker-backend -f
```

## Environment Variables

- `FINANCE_API_KEY` - API key for authentication (default in nix-shell: `finance-api-key`)

## Architecture

### Backend (`/backend`)
```
app/
├── main.py          # FastAPI app, CORS, lifespan (DB init + seed)
├── database.py      # Async SQLAlchemy engine/session
├── models.py        # ORM: Category, Transaction, Goal, GoalContribution, Budget, RecurringTransaction, Settings
├── schemas.py       # Pydantic v2 request/response schemas
├── auth.py          # X-API-Key header auth (env: FINANCE_API_KEY)
├── seed.py          # Default categories seeding
└── routers/         # CRUD endpoints for each entity + analytics
```

### Frontend (`/frontend/src`)
Feature-based architecture:
```
app/           # App.jsx (routing + command bar), AppProviders.jsx
contexts/      # AuthContext (API key), SettingsContext (currency)
features/      # dashboard, transactions, budgets, goals, analytics, settings, recurring
shared/api/    # Axios client with X-API-Key interceptor, endpoint functions
shared/utils/  # formatCurrency, formatDate helpers
```

### API
- Auth: `X-API-Key` header (401 triggers auto-logout on frontend via axios interceptor)
- Base: `/api/` (proxied from frontend :5173 → backend :8000)
- Health: `GET /api/health` returns `{"status": "ok"}`
- Endpoints: `/transactions`, `/categories`, `/goals`, `/budgets`, `/recurring`, `/analytics/*`, `/settings`

## Design System

Terminal aesthetic with monospace fonts and green accent (`#00ff88`):
- `border-radius: 0 !important` on everything
- Dark theme only (`--bg-primary: #0a0a0a`)
- Headers in brackets: `[DASHBOARD]`, `[TRANSACTIONS]`
- All labels/buttons uppercase with letter-spacing

## Key Files

- `shell.nix` - Development environment with helper functions
- `FINANCE_APP_SPEC.md` - Full technical specification with design details (in Russian)
