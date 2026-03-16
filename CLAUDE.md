# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the App

**Backend (FastAPI):**
```bash
bash start_backend.sh
# First run creates a venv, installs deps, then starts uvicorn on http://localhost:8000
```

**Frontend (React + Vite):**
```bash
bash start_frontend.sh
# Starts dev server on http://localhost:5173
```

**Manual backend start (if venv already exists):**
```bash
cd backend
source .venv/Scripts/activate   # Windows
# source .venv/bin/activate     # Linux/Mac
uvicorn app.main:app --reload --port 8000
```

## Architecture

**Data flow:** React pages → `src/api/nba.js` (Axios, proxied via Vite to `/api`) → FastAPI routers → `app/services/nba_service.py` (wraps `nba_api` with `lru_cache`)

**Backend layout:**
- `app/main.py` — FastAPI app, CORS config, router registration
- `app/routers/` — one file per domain: `players`, `teams`, `games`, `leaders`
- `app/services/nba_service.py` — all `nba_api` calls live here; use `lru_cache` for static data (player/team lists), plain functions for dynamic data

**Frontend layout:**
- `src/api/nba.js` — all Axios calls; Vite proxies `/api/*` to `localhost:8000`
- `src/pages/` — one file per route; data fetching via React Query (`useQuery`)
- `src/components/` — shared UI: `StatsTable`, `StatCard`, `LoadingSpinner`, `Navbar`
- React Query is configured with `staleTime: 5min` globally in `App.jsx`

## Adding a New Feature

1. Add the `nba_api` call to `app/services/nba_service.py`
2. Add a route in the appropriate `app/routers/*.py` (or create a new router and register it in `main.py`)
3. Add the Axios call to `src/api/nba.js`
4. Use `useQuery` in a page component to fetch and render the data

## Key Notes

- `nba_api` calls are slow (hitting stats.nba.com); use `lru_cache` for anything that doesn't change per-request. For per-request dynamic data, responses take 1–3 seconds — this is expected.
- Tailwind CSS v4 is used — no `tailwind.config.js`. The Vite plugin (`@tailwindcss/vite`) handles it. Import is `@import "tailwindcss"` in `index.css`.
- The Vite dev server proxy (`/api` → `http://localhost:8000`) is configured in `vite.config.js` — the frontend never hardcodes the backend URL.
