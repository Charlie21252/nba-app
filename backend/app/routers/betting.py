from fastapi import APIRouter, HTTPException, Query
from app.services.odds_service import get_odds, get_event_odds, normalize_game, get_recommendations
from app.services import nba_service

router = APIRouter()


@router.get("/odds")
def odds(markets: str = Query("h2h,spreads,totals"), sport: str = Query("basketball_nba")):
    try:
        raw = get_odds(markets, sport)
        return [normalize_game(g) for g in raw]
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Odds API error: {e}")


@router.get("/odds/{event_id}")
def event_odds(event_id: str, markets: str = Query("h2h,spreads,totals")):
    try:
        return get_event_odds(event_id, markets)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Odds API error: {e}")


@router.get("/recommendations")
def recommendations():
    try:
        # Get today's games from cached odds — only fetch stats for teams actually playing
        raw_games = get_odds("h2h,spreads,totals")
        todays_team_names = set()
        for g in raw_games:
            todays_team_names.add(g["home_team"])
            todays_team_names.add(g["away_team"])

        if not todays_team_names:
            return []

        # Build a name->id lookup from the static team list (no HTTP call)
        all_teams = nba_service.get_all_teams()
        name_to_id = {t["full_name"]: t["id"] for t in all_teams}

        team_stats: dict = {}
        for team_name in todays_team_names:
            team_id = name_to_id.get(team_name)
            if not team_id:
                team_stats[team_name] = {"win_pct": 0.5, "l10": 5}
                continue
            try:
                history = nba_service.get_team_year_by_year(team_id)
                rows = history.get("TeamStats", [])
                current = next(
                    (r for r in reversed(rows) if str(r.get("YEAR", "")).startswith("2024")),
                    rows[-1] if rows else None,
                )
                if current:
                    wins = current.get("WINS", 0) or 0
                    losses = current.get("LOSSES", 0) or 0
                    total = wins + losses
                    win_pct = wins / total if total else 0.5
                else:
                    win_pct = 0.5

                recent = nba_service.get_recent_games(team_id, last_n=10)
                l10 = sum(1 for g in recent if "W" in (g.get("WL") or ""))

                team_stats[team_name] = {"win_pct": win_pct, "l10": l10}
            except Exception:
                team_stats[team_name] = {"win_pct": 0.5, "l10": 5}

        return get_recommendations(team_stats)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Recommendations error: {e}")
