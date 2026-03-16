from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import players, teams, games, leaders

app = FastAPI(title="NBA Analytics API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(players.router, prefix="/api/players", tags=["players"])
app.include_router(teams.router, prefix="/api/teams", tags=["teams"])
app.include_router(games.router, prefix="/api/games", tags=["games"])
app.include_router(leaders.router, prefix="/api/leaders", tags=["leaders"])


@app.get("/api/health")
def health():
    return {"status": "ok"}
