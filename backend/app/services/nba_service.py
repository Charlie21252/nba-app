"""
Wrapper around nba_api endpoints with simple in-memory caching.

stats.nba.com selectively blocks player-specific endpoints (commonplayerinfo,
playercareerstats, playergamelog) but allows leagueleaders and the CDN.
Player endpoints are rebuilt using:
  - cdn.nba.com/static/json/staticData/playerIndex.json  (bio / info)
  - stats.nba.com/stats/leagueleaders  PerMode=Totals    (season stats)
"""

import requests
from functools import lru_cache
from nba_api.stats.static import players as static_players, teams as static_teams
from nba_api.stats.endpoints import (
    leagueleaders,
    leaguegamefinder,
    teamyearbyyearstats,
    commonteamroster,
    scoreboard,
)

SEASON = "2024-25"

# Headers accepted by both stats.nba.com and cdn.nba.com
_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://www.nba.com/",
    "Origin": "https://www.nba.com",
    "x-nba-stats-origin": "stats",
    "x-nba-stats-token": "true",
}

TIMEOUT = 15


# ---------- CDN player index (cached for process lifetime) ----------

@lru_cache(maxsize=1)
def _get_player_index() -> dict:
    """Fetch cdn.nba.com player index and return a dict keyed by PERSON_ID."""
    url = "https://cdn.nba.com/static/json/staticData/playerIndex.json"
    r = requests.get(url, headers=_HEADERS, timeout=TIMEOUT)
    r.raise_for_status()
    r.encoding = "utf-8"  # force correct decoding of names like Jokić, Dončić
    rs = r.json()["resultSets"][0]
    headers = rs["headers"]
    result = {}
    for row in rs["rowSet"]:
        d = dict(zip(headers, row))
        result[d["PERSON_ID"]] = d
    return result


# ---------- leagueleaders season totals (cached per call) ----------

@lru_cache(maxsize=1)
def _get_season_totals() -> dict:
    """Return leagueleaders Totals for the current season, keyed by PLAYER_ID."""
    url = "https://stats.nba.com/stats/leagueleaders"
    params = {
        "LeagueID": "00",
        "PerMode": "Totals",
        "Scope": "S",
        "Season": SEASON,
        "SeasonType": "Regular Season",
        "StatCategory": "PTS",
    }
    r = requests.get(url, headers=_HEADERS, params=params, timeout=TIMEOUT)
    r.raise_for_status()
    r.encoding = "utf-8"
    rs = r.json()["resultSet"]
    cols = rs["headers"]
    result = {}
    for row in rs["rowSet"]:
        d = dict(zip(cols, row))
        result[d["PLAYER_ID"]] = d
    return result


# ---------- Static data ----------

@lru_cache(maxsize=1)
def get_all_players():
    return static_players.get_players()


def search_players(name: str):
    name_lower = name.lower()
    return [p for p in get_all_players() if name_lower in p["full_name"].lower()]


# ---------- Player endpoints (CDN + leagueleaders) ----------

def get_player_info(player_id: int):
    index = _get_player_index()
    p = index.get(player_id)
    if not p:
        raise ValueError(f"Player {player_id} not found in index")

    first = p.get("PLAYER_FIRST_NAME", "")
    last = p.get("PLAYER_LAST_NAME", "")
    draft_year = p.get("DRAFT_YEAR")
    draft_round = p.get("DRAFT_ROUND")
    draft_number = p.get("DRAFT_NUMBER")

    info = {
        "PERSON_ID": player_id,
        "DISPLAY_FIRST_LAST": f"{first} {last}".strip(),
        "DISPLAY_LAST_COMMA_FIRST": f"{last}, {first}".strip(),
        "TEAM_ID": p.get("TEAM_ID", ""),
        "TEAM_NAME": p.get("TEAM_NAME", ""),
        "TEAM_CITY": p.get("TEAM_CITY", ""),
        "TEAM_ABBREVIATION": p.get("TEAM_ABBREVIATION", ""),
        "JERSEY": p.get("JERSEY_NUMBER", ""),
        "POSITION": p.get("POSITION", ""),
        "HEIGHT": p.get("HEIGHT", ""),
        "WEIGHT": p.get("WEIGHT", ""),
        "SCHOOL": p.get("COLLEGE", ""),
        "COUNTRY": p.get("COUNTRY", ""),
        "DRAFT_YEAR": str(draft_year) if draft_year else "Undrafted",
        "DRAFT_ROUND": str(draft_round) if draft_round else "Undrafted",
        "DRAFT_NUMBER": str(draft_number) if draft_number else "Undrafted",
        "FROM_YEAR": p.get("FROM_YEAR", ""),
        "TO_YEAR": p.get("TO_YEAR", ""),
        "ROSTER_STATUS": p.get("ROSTER_STATUS", 0),
    }
    return {"CommonPlayerInfo": [info]}


def get_player_career_stats(player_id: int):
    totals = _get_season_totals()
    row = totals.get(player_id)
    if not row:
        return {"SeasonTotalsRegularSeason": []}

    season_row = {
        "PLAYER_ID": player_id,
        "SEASON_ID": SEASON,
        "LEAGUE_ID": "00",
        "TEAM_ID": row.get("TEAM_ID", ""),
        "TEAM_ABBREVIATION": row.get("TEAM", ""),
        "PLAYER_AGE": None,
        "GP": row.get("GP", 0),
        "GS": None,
        "MIN": row.get("MIN", 0),
        "FGM": row.get("FGM", 0),
        "FGA": row.get("FGA", 0),
        "FG_PCT": row.get("FG_PCT", 0),
        "FG3M": row.get("FG3M", 0),
        "FG3A": row.get("FG3A", 0),
        "FG3_PCT": row.get("FG3_PCT", 0),
        "FTM": row.get("FTM", 0),
        "FTA": row.get("FTA", 0),
        "FT_PCT": row.get("FT_PCT", 0),
        "OREB": row.get("OREB", 0),
        "DREB": row.get("DREB", 0),
        "REB": row.get("REB", 0),
        "AST": row.get("AST", 0),
        "STL": row.get("STL", 0),
        "BLK": row.get("BLK", 0),
        "TOV": row.get("TOV", 0),
        "PF": row.get("PF", 0),
        "PTS": row.get("PTS", 0),
    }
    return {"SeasonTotalsRegularSeason": [season_row]}


def get_player_game_log(player_id: int, season: str = SEASON):
    # stats.nba.com/stats/playergamelog is blocked; return empty so UI degrades gracefully
    return {"PlayerGameLog": []}


# ---------- Teams ----------

@lru_cache(maxsize=1)
def get_all_teams():
    return static_teams.get_teams()


def get_team_roster(team_id: int, season: str = SEASON):
    roster = commonteamroster.CommonTeamRoster(
        team_id=team_id, season=season, headers=_HEADERS, timeout=TIMEOUT
    )
    return roster.get_normalized_dict()


def get_team_year_by_year(team_id: int):
    stats = teamyearbyyearstats.TeamYearByYearStats(
        team_id=team_id, headers=_HEADERS, timeout=TIMEOUT
    )
    return stats.get_normalized_dict()


# ---------- Games ----------

def get_recent_games(team_id: int, season: str = SEASON, last_n: int = 10):
    finder = leaguegamefinder.LeagueGameFinder(
        team_id_nullable=team_id,
        season_nullable=season,
        headers=_HEADERS,
        timeout=TIMEOUT,
    )
    data = finder.get_normalized_dict()
    games = data.get("LeagueGameFinderResults", [])
    return games[:last_n]


# ---------- Leaders ----------

def get_league_leaders(stat_category: str = "PTS", season: str = SEASON, top: int = 10):
    leaders = leagueleaders.LeagueLeaders(
        stat_category_abbreviation=stat_category,
        season=season,
        headers=_HEADERS,
        timeout=TIMEOUT,
    )
    data = leaders.get_normalized_dict()
    rows = data.get("LeagueLeaders", [])
    return rows[:top]


def get_players_by_college(college: str):
    index = _get_player_index()
    college_lower = college.lower()
    return sorted(
        [p for p in index.values() if (p.get("COLLEGE") or "").lower() == college_lower],
        key=lambda p: p.get("PLAYER_LAST_NAME", "")
    )


def get_players_by_draft_year(year: int):
    index = _get_player_index()
    return sorted(
        [p for p in index.values() if str(p.get("DRAFT_YEAR", "")) == str(year)],
        key=lambda p: (p.get("DRAFT_ROUND") or 99, p.get("DRAFT_NUMBER") or 999)
    )
