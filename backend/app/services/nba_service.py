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


def get_player_percentiles(player_id: int) -> dict:
    """
    Compute percentile ranks for a player across 18 stats vs all qualified players
    (GP >= 10). Also returns 12-bucket histogram data for each stat so the frontend
    can render a distribution chart without a second request.
    """
    from app.services.advanced_stats import compute_advanced

    GP_MIN = 10

    def _s(r, k):
        v = r.get(k)
        return float(v) if v else 0.0

    totals = _get_season_totals()
    row = totals.get(player_id)
    if not row:
        raise ValueError(f"No season stats for player {player_id}")

    gp = _s(row, "GP")
    if gp < 1:
        raise ValueError("Player has 0 GP")

    # Qualified pool (single pass)
    pool = {pid: r for pid, r in totals.items() if _s(r, "GP") >= GP_MIN}

    # Pre-compute BPM / versatility for all pool players once (pure math, <10 ms)
    adv = {pid: compute_advanced(r) for pid, r in pool.items()}

    def _percentile(pval, vals):
        if not vals:
            return 0
        return round(sum(1 for v in vals if v < pval) / len(vals) * 100)

    def _buckets(vals, pval, n=12):
        lo, hi = min(vals), max(vals)
        if lo == hi:
            return [{"range": f"{lo:.1f}", "count": len(vals), "contains_player": True}]
        step = (hi - lo) / n
        result = []
        for i in range(n):
            b_lo = lo + i * step
            b_hi = lo + (i + 1) * step
            last = i == n - 1
            count = sum(1 for v in vals if b_lo <= v < b_hi or (last and v == b_hi))
            result.append({
                "range": f"{b_lo:.1f}–{b_hi:.1f}",
                "count": count,
                "contains_player": b_lo <= pval < b_hi or (last and pval <= b_hi),
            })
        return result

    # Per-game helpers
    def pg(r, k):
        g = _s(r, "GP")
        return _s(r, k) / g if g > 0 else None

    def p36(r, k):
        g = _s(r, "GP"); m = _s(r, "MIN")
        mpg = m / g if g > 0 else 0
        return ((_s(r, k) / g) * (36 / mpg)) if mpg > 0 else None

    # Build per-stat result
    pool_items = list(pool.items())  # [(pid, row), ...]

    def _stat_result(pval, all_vals):
        if pval is None or not all_vals:
            return {"percentile": None, "player_value": None, "buckets": []}
        pval_r = round(pval, 2)
        return {
            "percentile": _percentile(pval, all_vals),
            "player_value": pval_r,
            "buckets": _buckets(all_vals, pval),
        }

    def _simple(key_fn):
        pval = key_fn(row)
        vals = [v for _, r in pool_items if (v := key_fn(r)) is not None]
        return _stat_result(pval, vals)

    def _adv_stat(adv_key):
        pval = adv.get(player_id, {}).get(adv_key)
        vals = [v for pid in pool if (v := adv.get(pid, {}).get(adv_key)) is not None]
        return _stat_result(pval, vals)

    result_stats = {
        # Normal – Individual
        "ppg":         _simple(lambda r: pg(r, "PTS")),
        "rpg":         _simple(lambda r: pg(r, "REB")),
        "fg_pct":      _simple(lambda r: _s(r, "FG_PCT") * 100 if _s(r, "FGA") > 0 else None),
        "fg3_pct":     _simple(lambda r: _s(r, "FG3_PCT") * 100 if _s(r, "FG3A") > 0 else None),
        "ft_pct":      _simple(lambda r: _s(r, "FT_PCT") * 100 if _s(r, "FTA") > 0 else None),
        "mpg":         _simple(lambda r: pg(r, "MIN")),
        # Normal – Team Impact
        "apg":         _simple(lambda r: pg(r, "AST")),
        "spg":         _simple(lambda r: pg(r, "STL")),
        "bpg":         _simple(lambda r: pg(r, "BLK")),
        "stocks":      _simple(lambda r: ((_s(r,"STL")+_s(r,"BLK"))/_s(r,"GP")) if _s(r,"GP")>0 else None),
        # Advanced – Individual
        "ts_pct":      _simple(lambda r: (
            _s(r,"PTS")/(2*(_s(r,"FGA")+0.44*_s(r,"FTA")))*100
            if (_s(r,"FGA")+0.44*_s(r,"FTA"))>0 else None)),
        "efg_pct":     _simple(lambda r: (
            (_s(r,"FGM")+0.5*_s(r,"FG3M"))/_s(r,"FGA")*100
            if _s(r,"FGA")>0 else None)),
        "per36_pts":   _simple(lambda r: p36(r, "PTS")),
        "per36_reb":   _simple(lambda r: p36(r, "REB")),
        # Advanced – Team Impact
        "bpm":         _adv_stat("bpm"),
        "ast_to":      _simple(lambda r: _s(r,"AST")/_s(r,"TOV") if _s(r,"TOV")>0 else None),
        "versatility": _adv_stat("versatility"),
        "per36_ast":   _simple(lambda r: p36(r, "AST")),
    }

    # Player display values (per-game rates for the UI header row)
    player_vals = {k: v["player_value"] for k, v in result_stats.items()}

    idx = _get_player_index()
    p = idx.get(player_id, {})
    name = f"{p.get('PLAYER_FIRST_NAME','')} {p.get('PLAYER_LAST_NAME','')}".strip()

    return {
        "player_id": player_id,
        "player_name": name,
        "games_played": int(gp),
        "qualified_pool": len(pool),
        "player": player_vals,
        "stats": result_stats,
    }


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


@lru_cache(maxsize=30)
def get_team_year_by_year(team_id: int):
    stats = teamyearbyyearstats.TeamYearByYearStats(
        team_id=team_id, headers=_HEADERS, timeout=TIMEOUT
    )
    return stats.get_normalized_dict()


# ---------- Games ----------

@lru_cache(maxsize=30)
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
    """Derive per-game leaders from the cached season totals — no extra HTTP call."""
    totals = _get_season_totals()

    # Rate stats that are already per-game / percentages
    RATE_STATS = {"FG_PCT", "FG3_PCT", "FT_PCT"}

    rows = []
    for pid, r in totals.items():
        gp = float(r.get("GP") or 0)
        if gp < 1:
            continue

        if stat_category in RATE_STATS:
            val = float(r.get(stat_category) or 0)
            # Require minimum attempts for shooting % stats
            if stat_category == "FG_PCT" and float(r.get("FGA") or 0) / gp < 3:
                continue
            if stat_category == "FG3_PCT" and float(r.get("FG3A") or 0) / gp < 1:
                continue
            if stat_category == "FT_PCT" and float(r.get("FTA") or 0) / gp < 1:
                continue
        elif stat_category == "EFF":
            pts  = float(r.get("PTS")  or 0)
            reb  = float(r.get("REB")  or 0)
            ast  = float(r.get("AST")  or 0)
            stl  = float(r.get("STL")  or 0)
            blk  = float(r.get("BLK")  or 0)
            fga  = float(r.get("FGA")  or 0)
            fgm  = float(r.get("FGM")  or 0)
            fta  = float(r.get("FTA")  or 0)
            ftm  = float(r.get("FTM")  or 0) if r.get("FTM") else 0
            tov  = float(r.get("TOV")  or 0)
            val  = (pts + reb + ast + stl + blk - (fga - fgm) - (fta - ftm) - tov) / gp
        elif stat_category == "MIN":
            val = float(r.get("MIN") or 0) / gp
        else:
            val = float(r.get(stat_category) or 0) / gp

        rows.append({
            "PLAYER_ID": pid,
            "PLAYER":    r.get("PLAYER", ""),
            "TEAM":      r.get("TEAM", ""),
            "GP":        int(gp),
            stat_category: round(val, 1),
            "_sort": val,
        })

    rows.sort(key=lambda x: x["_sort"], reverse=True)
    for i, row in enumerate(rows):
        row["RANK"] = i + 1
        del row["_sort"]

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
