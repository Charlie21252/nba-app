"""
Wrapper around nba_api endpoints with simple in-memory caching.
All heavy data calls go through this module so it's easy to swap
in a database cache or Redis later.
"""
from functools import lru_cache
from nba_api.stats.static import players as static_players, teams as static_teams
from nba_api.stats.endpoints import (
    playercareerstats,
    playergamelog,
    commonplayerinfo,
    leagueleaders,
    leaguegamefinder,
    teamyearbyyearstats,
    commonteamroster,
    scoreboard,
)
from nba_api.stats.library.parameters import SeasonAll


# ---------- Players ----------

@lru_cache(maxsize=1)
def get_all_players():
    return static_players.get_players()


def search_players(name: str):
    name_lower = name.lower()
    return [p for p in get_all_players() if name_lower in p["full_name"].lower()]


def get_player_info(player_id: int):
    info = commonplayerinfo.CommonPlayerInfo(player_id=player_id)
    return info.get_normalized_dict()


def get_player_career_stats(player_id: int):
    stats = playercareerstats.PlayerCareerStats(player_id=player_id)
    return stats.get_normalized_dict()


def get_player_game_log(player_id: int, season: str = "2024-25"):
    log = playergamelog.PlayerGameLog(player_id=player_id, season=season)
    return log.get_normalized_dict()


# ---------- Teams ----------

@lru_cache(maxsize=1)
def get_all_teams():
    return static_teams.get_teams()


def get_team_roster(team_id: int, season: str = "2024-25"):
    roster = commonteamroster.CommonTeamRoster(team_id=team_id, season=season)
    return roster.get_normalized_dict()


def get_team_year_by_year(team_id: int):
    stats = teamyearbyyearstats.TeamYearByYearStats(team_id=team_id)
    return stats.get_normalized_dict()


# ---------- Games ----------

def get_scoreboard(game_date: str | None = None):
    kwargs = {}
    if game_date:
        kwargs["game_date"] = game_date
    board = scoreboard.Scoreboard(**kwargs)
    return board.get_normalized_dict()


def get_recent_games(team_id: int, season: str = "2024-25", last_n: int = 10):
    finder = leaguegamefinder.LeagueGameFinder(
        team_id_nullable=team_id,
        season_nullable=season,
    )
    data = finder.get_normalized_dict()
    games = data.get("LeagueGameFinderResults", [])
    return games[:last_n]


# ---------- Leaders ----------

def get_league_leaders(stat_category: str = "PTS", season: str = "2024-25", top: int = 10):
    leaders = leagueleaders.LeagueLeaders(
        stat_category_abbreviation=stat_category,
        season=season,
    )
    data = leaders.get_normalized_dict()
    rows = data.get("LeagueLeaders", [])
    return rows[:top]
