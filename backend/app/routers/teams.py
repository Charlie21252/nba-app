from fastapi import APIRouter, HTTPException
from app.services import nba_service

router = APIRouter()


@router.get("/")
def list_teams():
    return nba_service.get_all_teams()


@router.get("/{team_id}/roster")
def team_roster(team_id: int, season: str = "2024-25"):
    try:
        return nba_service.get_team_roster(team_id, season)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{team_id}/history")
def team_history(team_id: int):
    try:
        return nba_service.get_team_year_by_year(team_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{team_id}/games")
def team_recent_games(team_id: int, season: str = "2024-25", last_n: int = 10):
    try:
        return nba_service.get_recent_games(team_id, season, last_n)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))
