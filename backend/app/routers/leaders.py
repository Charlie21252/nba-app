from fastapi import APIRouter, HTTPException, Query
from app.services import nba_service

router = APIRouter()

VALID_CATEGORIES = ["PTS", "REB", "AST", "STL", "BLK", "FG_PCT", "FG3_PCT", "FT_PCT", "MIN", "EFF"]


@router.get("/")
def league_leaders(
    stat: str = Query("PTS", description=f"Stat category: {', '.join(VALID_CATEGORIES)}"),
    season: str = "2024-25",
    top: int = Query(10, ge=1, le=50),
):
    if stat not in VALID_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"Invalid stat. Choose from: {VALID_CATEGORIES}")
    try:
        return nba_service.get_league_leaders(stat, season, top)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
