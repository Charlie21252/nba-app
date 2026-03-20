import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import players, games, betting

app = FastAPI(title="NBA Analytics API", version="1.0.0")


async def _warmup_background():
    """Warm the in-process LRU caches in the background so the server starts
    accepting requests immediately — never blocks Render cold-start timing."""
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


@app.on_event("startup")
async def warmup_cache():
    # Schedule warmup as a fire-and-forget background task so uvicorn binds
    # the port and starts serving requests without waiting for NBA API calls.
    asyncio.create_task(_warmup_background())


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(players.router, prefix="/api/players", tags=["players"])
app.include_router(games.router, prefix="/api/games", tags=["games"])
app.include_router(betting.router, prefix="/api/betting", tags=["betting"])


@app.get("/api/health")
def health():
    return {"status": "ok"}
