import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import players, teams, games, leaders, betting

app = FastAPI(title="NBA Analytics API", version="1.0.0")


@app.on_event("startup")
async def warmup_cache():
    """Pre-fetch season totals and player index on startup so the first user
    request is fast and stats.nba.com headers are validated at boot time."""
    from app.services import nba_service
    loop = asyncio.get_event_loop()
    try:
        await loop.run_in_executor(None, nba_service._get_season_totals)
        print("✓ Season totals cache warmed")
    except Exception as e:
        print(f"⚠ Season totals warmup failed: {e}")
    try:
        await loop.run_in_executor(None, nba_service._get_player_index)
        print("✓ Player index cache warmed")
    except Exception as e:
        print(f"⚠ Player index warmup failed: {e}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(players.router, prefix="/api/players", tags=["players"])
app.include_router(teams.router, prefix="/api/teams", tags=["teams"])
app.include_router(games.router, prefix="/api/games", tags=["games"])
app.include_router(leaders.router, prefix="/api/leaders", tags=["leaders"])
app.include_router(betting.router, prefix="/api/betting", tags=["betting"])


@app.get("/api/health")
def health():
    return {"status": "ok"}
