from fastapi import APIRouter, HTTPException, Query
from app.services import nba_service

router = APIRouter()


@router.get("/search")
def search_players(q: str = Query(..., min_length=2)):
    return nba_service.search_players(q)


@router.get("/{player_id}/info")
def player_info(player_id: int):
    try:
        return nba_service.get_player_info(player_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{player_id}/career")
def player_career(player_id: int):
    try:
        return nba_service.get_player_career_stats(player_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{player_id}/gamelog")
def player_gamelog(player_id: int, season: str = "2024-25"):
    try:
        return nba_service.get_player_game_log(player_id, season)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))
