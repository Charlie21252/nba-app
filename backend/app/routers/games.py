from fastapi import APIRouter, HTTPException
from typing import Optional
from app.services import nba_service

router = APIRouter()


@router.get("/scoreboard")
def scoreboard(game_date: Optional[str] = None):
    """Get scoreboard for a given date (MM/DD/YYYY) or today if omitted."""
    try:
        return nba_service.get_scoreboard(game_date)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
