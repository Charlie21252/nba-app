# NBA App — Dev Log

## Session: 17 March 2026

---

### 1. College logos were broken

**Problem:** `CollegeLogo` was generating a slug like `university-of-kentucky` and hitting `a.espncdn.com/i/teamlogos/ncaa/500/university-of-kentucky.png`. ESPN's CDN does not accept name slugs — it requires numeric team IDs. Every logo returned a 404.

**Fix:** Built a `COLLEGE_ESPN_IDS` map (~80 schools) of normalised college name → ESPN numeric ID, e.g. `'kentucky': 96`, `'duke': 150`, `'north carolina': 153`. Added a `normalizeCollege()` helper that strips common suffixes ("University of", "University", "College") before lookup. Logo URL is now `a.espncdn.com/i/teamlogos/ncaa/500/{id}.png`. Schools not in the map fall back to an initials badge.

**File:** `frontend/src/pages/PlayerDetail.jsx`

---

### 2. Foreign player names were garbled (e.g. "Nikola JokiÄ")

**Problem:** The `requests` library was not explicitly setting UTF-8 encoding when decoding the NBA CDN response. The CDN returns `Content-Type: application/json` with no charset declaration. Without an explicit encoding, `requests` uses a fallback that mangles multi-byte characters — ć becomes Ä, č becomes Ä, etc.

**Fix:** Added `r.encoding = "utf-8"` immediately after `r.raise_for_status()` in both fetch functions:
- `_get_player_index()` — CDN playerIndex.json
- `_get_season_totals()` — stats.nba.com leagueleaders

**Important caveat:** Both functions use `@lru_cache`. The fix only takes effect after a full backend restart — the old garbled strings stay cached in memory until the process exits.

**File:** `backend/app/services/nba_service.py`

---

### 3. Draft class drawer was returning empty

**Problem:** `get_players_by_draft_year` filtered with two conditions:
1. `p.get("DRAFT_YEAR") == year` — the CDN JSON may store DRAFT_YEAR as a string, so comparing to a Python `int` silently returns nothing.
2. `p.get("IS_DEFUNCT") == 0` — this excludes any player whose franchise no longer exists, which cuts out the vast majority of historical draft classes.

**Fix:**
- Changed year comparison to `str(p.get("DRAFT_YEAR", "")) == str(year)` so type doesn't matter.
- Removed the `IS_DEFUNCT` filter entirely — a draft class should include all players regardless of whether their team still exists.

**File:** `backend/app/services/nba_service.py`

---

### 4. College/draft drawer was a bottom sheet, not scrollable

**Problem:** `PlayerDrawer` used `items-end` and `rounded-t-2xl`, opening as a bottom sheet. It wasn't centred and didn't scroll well on smaller content.

**Fix:** Changed to `items-center justify-center p-4` with `rounded-2xl` and `overflow-hidden` so it opens as a centred modal on all screen sizes.

**File:** `frontend/src/pages/PlayerDetail.jsx`

---

### 5. Hero headshot showing player's body instead of face

**Problem:** The ghost headshot in the Dashboard hero was positioned with `bottom-0 h-[190%]`. This anchors the image's bottom edge to the container's bottom and extends it 190% upward — meaning 90% of the image height is clipped above the visible area. The face (top of image) was invisible; only the torso showed.

**Fix:** Changed to `top-0 h-full`. Anchoring at the top means the face — which sits at the top of the NBA 1040×760 headshot — is now the first thing visible inside the hero.

**File:** `frontend/src/pages/Dashboard.jsx`

---

### 6. Dashboard full redesign

**What changed:**

**Hero**
- Ghost headshot of current leader with left-fade mask, anchored top (`top-0 h-full`)
- Radial colour glow on the right matching active stat colour
- Leader name + current stat value displayed on the right side

**Stat tabs**
- Removed emojis
- Active tab gets a coloured `boxShadow` drop shadow

**Podium (Top 3)**
- Layout order is `[2nd, 1st, 3rd]` so #1 sits in the centre column
- #1 card renders taller (300 px vs 240 px) with a stronger glow ring
- Headshots use the `1040x760` CDN URL, filling the card with a gradient fade at the bottom
- Rank shown as styled `#1 / #2 / #3` text in the ring colour — no emojis

**Ranks 4–15**
- Wrapped in a bordered container with a header row
- Progress bars thickened from `h-px` to `h-1`
- Headshot scales up on row selection

**File:** `frontend/src/pages/Dashboard.jsx`

---

### 7. MagicRings removed from player profiles

Removed the import and the overlay `<div style={{ mixBlendMode: 'screen' }}>` wrapper. No other changes needed.

**File:** `frontend/src/pages/PlayerDetail.jsx`

---

### 8. Nickname system removed

`NICKNAMES` constant, the `nickname` lookup, and the italic render were all deleted. The feature was unreliable due to uncertain player IDs and foreign name encoding issues.

**File:** `frontend/src/pages/PlayerDetail.jsx`

---

### Files changed this session

| File | Changes |
|---|---|
| `frontend/src/pages/Dashboard.jsx` | Full redesign — hero, podium, tabs, list |
| `frontend/src/pages/PlayerDetail.jsx` | College logos, centred drawer, MagicRings out, nicknames out |
| `backend/app/services/nba_service.py` | UTF-8 encoding, draft year type fix, IS_DEFUNCT removed |
