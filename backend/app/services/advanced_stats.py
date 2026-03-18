"""
Advanced player metrics computed from raw box score totals.
No additional API calls — everything derives from leagueleaders Totals cache.

Metrics:
  TS%    — True Shooting Percentage (best single shooting efficiency measure)
  eFG%   — Effective Field Goal % (accounts for 3PT value, ignores FT)
  AST/TO — Assist-to-Turnover ratio (playmaking efficiency)
  BPM    — Box Plus/Minus approximation (Myers simplified model, per-36)
  VSC    — Versatility Score (custom 0-10 composite across all dimensions)
  Per-36 — Per-36-minute normalized stats (minutes-neutral comparison)
"""

# League average benchmarks (2024-25 NBA season)
LEAGUE_AVG_TS  = 0.578
LEAGUE_AVG_EFG = 0.535

# BPM positional baselines (approximate, applied as offset)
# Full BPM requires known position; we use a flat league average offset
BPM_LEAGUE_OFFSET = 2.9


def _safe(val) -> float:
    return float(val) if val else 0.0


def compute_advanced(row: dict) -> dict:
    gp   = _safe(row.get("GP"))
    pts  = _safe(row.get("PTS"))
    reb  = _safe(row.get("REB"))
    ast  = _safe(row.get("AST"))
    stl  = _safe(row.get("STL"))
    blk  = _safe(row.get("BLK"))
    tov  = _safe(row.get("TOV"))
    pf   = _safe(row.get("PF"))
    fga  = _safe(row.get("FGA"))
    fgm  = _safe(row.get("FGM"))
    fg3a = _safe(row.get("FG3A"))
    fg3m = _safe(row.get("FG3M"))
    fta  = _safe(row.get("FTA"))
    oreb = _safe(row.get("OREB"))
    dreb = _safe(row.get("DREB"))
    mins = _safe(row.get("MIN"))

    if gp == 0:
        return _empty()

    mpg = mins / gp  # minutes per game

    # ── True Shooting % ─────────────────────────────────────────────────────
    ts_denom = 2 * (fga + 0.44 * fta)
    ts_pct = (pts / ts_denom) if ts_denom > 0 else None

    # ── Effective FG% ───────────────────────────────────────────────────────
    efg_pct = ((fgm + 0.5 * fg3m) / fga) if fga > 0 else None

    # ── Assist / Turnover Ratio ─────────────────────────────────────────────
    ast_to = (ast / tov) if tov > 0 else None

    # ── Per-36 factor ────────────────────────────────────────────────────────
    per36 = (36 / mpg) if mpg > 0 else None

    # ── Simplified BPM (Myers model, per-36 adaptation) ─────────────────────
    # Published coefficients from basketball-reference.com/about/bpm2.html
    # adapted for per-36 stats. Centered so league avg ≈ 0.
    bpm = None
    per36_stats = None
    if per36:
        def p36(x): return (x / gp) * per36

        pts36  = p36(pts);  ast36  = p36(ast);  tov36 = p36(tov)
        stl36  = p36(stl);  blk36  = p36(blk);  pf36  = p36(pf)
        oreb36 = p36(oreb); dreb36 = p36(dreb)
        fga36  = p36(fga);  fg3a36 = p36(fg3a); fta36 = p36(fta)
        reb36  = p36(reb)

        # Shooting pts above league average
        ts_used = ts_pct if ts_pct else LEAGUE_AVG_TS
        shoot_above = pts36 * (ts_used - LEAGUE_AVG_TS) / ts_used

        bpm = (
            0.123  * ast36
            - 0.292 * tov36
            + 0.732 * stl36
            + 0.476 * blk36
            + 0.107 * oreb36
            + 0.116 * dreb36
            - 0.178 * fga36
            + 0.177 * fg3a36
            + 0.085 * fta36
            - 0.260 * pf36
            + shoot_above
            - BPM_LEAGUE_OFFSET
        )
        bpm = round(bpm, 1)

        per36_stats = {
            "PTS": round(pts36, 1),
            "REB": round(reb36, 1),
            "AST": round(ast36, 1),
            "STL": round(stl36, 1),
            "BLK": round(blk36, 1),
            "TOV": round(tov36, 1),
        }

    # ── Versatility Score (custom 0–10 composite) ───────────────────────────
    # Weighted across scoring, playmaking, rebounding, defence.
    # Thresholds calibrated to 2024-25 NBA elite benchmarks.
    ppg = pts / gp; apg = ast / gp; rpg = reb / gp
    spg = stl / gp; bpg = blk / gp

    vsc = round(
        min(ppg / 30, 1.0)          * 3.0 +   # scoring     30 %
        min(apg / 10, 1.0)          * 2.0 +   # playmaking  20 %
        min(rpg / 12, 1.0)          * 2.0 +   # rebounding  20 %
        min((spg + bpg) / 4, 1.0)  * 3.0,    # defence     30 %
    1)

    return {
        "ts_pct":        round(ts_pct  * 100, 1) if ts_pct  else None,
        "efg_pct":       round(efg_pct * 100, 1) if efg_pct else None,
        "ast_to_ratio":  round(ast_to, 2)         if ast_to  else None,
        "bpm":           bpm,
        "versatility":   vsc,
        "per36":         per36_stats,
        "league_avg": {
            "ts_pct":  round(LEAGUE_AVG_TS  * 100, 1),
            "efg_pct": round(LEAGUE_AVG_EFG * 100, 1),
        },
    }


def _empty() -> dict:
    return {
        "ts_pct": None, "efg_pct": None, "ast_to_ratio": None,
        "bpm": None, "versatility": None, "per36": None,
        "league_avg": {"ts_pct": 57.8, "efg_pct": 53.5},
    }
