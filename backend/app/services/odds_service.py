"""
Odds service — proxies The Odds API with a 60-second in-memory cache
to protect the free-tier monthly request quota.
"""

import os
import time
import httpx
from dotenv import load_dotenv

load_dotenv()

ODDS_API_KEY = os.getenv("ODDS_API_KEY", "")
ODDS_BASE = "https://api.the-odds-api.com/v4"
CACHE_TTL = 60  # seconds

_cache: dict = {}


def _cached(key: str, fetch_fn):
    now = time.time()
    if key in _cache and (now - _cache[key]["ts"]) < CACHE_TTL:
        return _cache[key]["data"]
    data = fetch_fn()
    _cache[key] = {"data": data, "ts": now}
    return data


def _odds_params(markets: str) -> dict:
    return {
        "apiKey": ODDS_API_KEY,
        "regions": "us",
        "markets": markets,
        "oddsFormat": "american",
        "dateFormat": "iso",
    }


def get_odds(markets: str = "h2h,spreads,totals", sport: str = "basketball_nba") -> list:
    def fetch():
        with httpx.Client(timeout=10) as client:
            r = client.get(
                f"{ODDS_BASE}/sports/{sport}/odds/",
                params=_odds_params(markets),
            )
            r.raise_for_status()
            return r.json()

    return _cached(f"odds:{sport}:{markets}", fetch)


def get_event_odds(event_id: str, markets: str = "h2h,spreads,totals") -> dict:
    def fetch():
        with httpx.Client(timeout=10) as client:
            r = client.get(
                f"{ODDS_BASE}/sports/basketball_nba/events/{event_id}/odds",
                params=_odds_params(markets),
            )
            r.raise_for_status()
            return r.json()

    return _cached(f"event:{event_id}:{markets}", fetch)


# ── helpers ──────────────────────────────────────────────────────────────────

def _implied_prob(american_odds: int) -> float:
    if american_odds >= 0:
        return 100 / (american_odds + 100)
    return abs(american_odds) / (abs(american_odds) + 100)


def _best_outcome(bookmakers: list, market_key: str, outcome_name: str) -> dict | None:
    """Return the best (highest) price for a given outcome across all bookmakers."""
    best = None
    best_price = None
    for book in bookmakers:
        for market in book.get("markets", []):
            if market["key"] != market_key:
                continue
            for o in market["outcomes"]:
                if o["name"] == outcome_name:
                    price = o["price"]
                    point = o.get("point")
                    if best_price is None or price > best_price:
                        best_price = price
                        best = {"bookmaker": book["title"], "price": price, "point": point}
    return best


def _vig(home_price: int, away_price: int) -> float:
    """Calculate bookmaker margin (vig) as a percentage."""
    total_implied = _implied_prob(home_price) + _implied_prob(away_price)
    return round((total_implied - 1) * 100, 1)


def _value_score(ml_home: dict | None, ml_away: dict | None,
                 spread_home: dict | None, total_over: dict | None) -> int:
    """
    Score 0-100 representing how good this game's odds are for the bettor.
    Higher = better value (lower house edge, more competitive lines).
    """
    score = 50  # baseline

    if ml_home and ml_away:
        vig = _vig(ml_home["price"], ml_away["price"])
        # Vig penalty: typical is ~4-5%. Below 4% is good, above 6% is bad.
        if vig <= 3.0:
            score += 25
        elif vig <= 4.0:
            score += 15
        elif vig <= 5.0:
            score += 5
        elif vig >= 7.0:
            score -= 15

        # Bonus if either side has positive (+) odds — means an underdog with real value
        if ml_home["price"] > 0 or ml_away["price"] > 0:
            score += 10

        # Bonus for close/competitive matchup (odds near even)
        home_prob = _implied_prob(ml_home["price"])
        if 0.42 <= home_prob <= 0.58:
            score += 10  # tight game = less predictable = more interesting

    # Bonus if spread juice is favorable (close to -110)
    if spread_home and abs(spread_home["price"]) <= 112:
        score += 5

    # Bonus if total juice is favorable
    if total_over and abs(total_over["price"]) <= 112:
        score += 5

    return max(0, min(100, score))


def _value_label(score: int) -> str:
    if score >= 85:
        return "Best Value"
    if score >= 70:
        return "Good Value"
    if score >= 55:
        return "Fair"
    return None


def normalize_game(game: dict) -> dict:
    """Flatten a raw Odds API game into a clean dict the frontend can consume."""
    books = game.get("bookmakers", [])
    home = game["home_team"]
    away = game["away_team"]

    ml_home = _best_outcome(books, "h2h", home)
    ml_away = _best_outcome(books, "h2h", away)
    spread_home = _best_outcome(books, "spreads", home)
    spread_away = _best_outcome(books, "spreads", away)
    total_over = _best_outcome(books, "totals", "Over")
    total_under = _best_outcome(books, "totals", "Under")

    vig = None
    if ml_home and ml_away:
        vig = _vig(ml_home["price"], ml_away["price"])

    score = _value_score(ml_home, ml_away, spread_home, total_over)

    return {
        "id": game["id"],
        "commence_time": game["commence_time"],
        "home_team": home,
        "away_team": away,
        "bookmakers_count": len(books),
        "value_score": score,
        "value_label": _value_label(score),
        "moneyline": {
            "home": ml_home,
            "away": ml_away,
            "vig": vig,
        },
        "spread": {
            "home": spread_home,
            "away": spread_away,
        },
        "total": {
            "over": total_over,
            "under": total_under,
        },
        "raw_bookmakers": books,
    }


# ── recommendation engine ────────────────────────────────────────────────────

def _log5(home_wp: float, away_wp: float, home_bonus: float = 0.05) -> float:
    """Bill James Log5 — estimate true win probability."""
    a = min(max(home_wp + home_bonus, 0.01), 0.99)
    b = min(max(away_wp, 0.01), 0.99)
    denom = a + b - 2 * a * b
    return (a - a * b) / denom if denom else 0.5


def _confidence_label(score: int) -> str:
    if score >= 75:
        return "Strong"
    if score >= 60:
        return "High"
    if score >= 45:
        return "Medium"
    return "Low"


def score_game(game: dict, home_wp: float, away_wp: float,
               home_l10: int, away_l10: int) -> list[dict]:
    """
    Score moneyline bets for both sides of a game.
    Returns a list of recommendation dicts (may be empty if no value found).
    """
    recs = []
    home = game["home_team"]
    away = game["away_team"]
    ml_home = game["moneyline"]["home"]
    ml_away = game["moneyline"]["away"]

    if not ml_home or not ml_away:
        return []

    our_home_prob = _log5(home_wp, away_wp)
    our_away_prob = 1 - our_home_prob

    for side, team, ml, our_prob, l10 in [
        ("home", home, ml_home, our_home_prob, home_l10),
        ("away", away, ml_away, our_away_prob, away_l10),
    ]:
        implied = _implied_prob(ml["price"])
        edge = our_prob - implied
        score = 50
        reasons = []

        # Signal 1: value vs implied prob
        if edge > 0.04:
            score += min(int(edge * 250), 30)
            reasons.append(
                f"We estimate {our_prob*100:.0f}% win prob vs book's {implied*100:.0f}%"
            )
        elif edge < -0.04:
            score -= 15

        # Signal 2: recent form
        if l10 >= 7:
            score += 12
            reasons.append(f"{team} is {l10}-{10-l10} in last 10 games")
        elif l10 <= 3:
            score -= 10

        # Signal 3: home court
        if side == "home":
            score += 7
            reasons.append("Home court advantage")

        # Signal 4: favorable juice
        if ml["price"] >= -115:
            score += 5
            reasons.append("Favorable juice")
        elif ml["price"] <= -140:
            score -= 8

        score = max(0, min(100, score))

        if score >= 45:
            recs.append({
                "game_id": game["id"],
                "game": f"{away} @ {home}",
                "commence_time": game["commence_time"],
                "bet_type": "moneyline",
                "pick": team,
                "odds": ml["price"],
                "bookmaker": ml["bookmaker"],
                "confidence": score,
                "confidence_label": _confidence_label(score),
                "reasons": reasons,
                "edge_pct": round(edge * 100, 1),
            })

    return recs


def get_recommendations(team_stats: dict) -> list[dict]:
    """
    Build recommendations for today's slate.
    `team_stats` maps team_name -> {"win_pct": float, "l10": int}
    """
    games_raw = get_odds("h2h,spreads,totals")
    results = []

    for raw in games_raw:
        game = normalize_game(raw)
        home = game["home_team"]
        away = game["away_team"]

        home_stats = team_stats.get(home, {"win_pct": 0.5, "l10": 5})
        away_stats = team_stats.get(away, {"win_pct": 0.5, "l10": 5})

        recs = score_game(
            game,
            home_wp=home_stats["win_pct"],
            away_wp=away_stats["win_pct"],
            home_l10=home_stats["l10"],
            away_l10=away_stats["l10"],
        )
        results.extend(recs)

    results.sort(key=lambda r: r["confidence"], reverse=True)
    return results[:5]
