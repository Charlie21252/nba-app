import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getPlayerInfo, getPlayerCareer, getPlayerGameLog, getPlayersByCollege, getPlayersByDraftYear } from '../api/nba'
import LoadingSpinner from '../components/LoadingSpinner'
import StatsTable from '../components/StatsTable'
import MagicBento from '../components/MagicBento'
import AnimatedList from '../components/AnimatedList'

const SEASON_COLS = [
  { key: 'SEASON_ID', label: 'Season' },
  { key: 'TEAM_ABBREVIATION', label: 'Team' },
  { key: 'GP', label: 'GP' },
  { key: 'PTS', label: 'PTS' },
  { key: 'REB', label: 'REB' },
  { key: 'AST', label: 'AST' },
  { key: 'STL', label: 'STL' },
  { key: 'BLK', label: 'BLK' },
  { key: 'FG_PCT', label: 'FG%', render: (r) => r.FG_PCT ? (r.FG_PCT * 100).toFixed(1) + '%' : '—' },
  { key: 'FG3_PCT', label: '3P%', render: (r) => r.FG3_PCT ? (r.FG3_PCT * 100).toFixed(1) + '%' : '—' },
  { key: 'FT_PCT', label: 'FT%', render: (r) => r.FT_PCT ? (r.FT_PCT * 100).toFixed(1) + '%' : '—' },
]

const GAMELOG_COLS = [
  { key: 'GAME_DATE', label: 'Date' },
  { key: 'MATCHUP', label: 'Matchup' },
  { key: 'WL', label: 'W/L', render: (r) => <span className={r.WL === 'W' ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>{r.WL}</span> },
  { key: 'MIN', label: 'MIN' },
  { key: 'PTS', label: 'PTS' },
  { key: 'REB', label: 'REB' },
  { key: 'AST', label: 'AST' },
  { key: 'STL', label: 'STL' },
  { key: 'BLK', label: 'BLK' },
  { key: 'TOV', label: 'TOV' },
  { key: 'PLUS_MINUS', label: '+/-' },
]


// ESPN NCAA team IDs — used for logo CDN: a.espncdn.com/i/teamlogos/ncaa/500/{id}.png
const COLLEGE_ESPN_IDS = {
  'duke': 150, 'kentucky': 96, 'north carolina': 153, 'ucla': 26,
  'kansas': 2305, 'michigan state': 127, 'georgetown': 46, 'arizona': 12,
  'connecticut': 41, 'uconn': 41, 'louisville': 97, 'syracuse': 183,
  'texas': 251, 'ohio state': 194, 'florida': 57, 'villanova': 222,
  'michigan': 130, 'florida state': 52, 'oregon': 2483, 'memphis': 235,
  'lsu': 99, 'stanford': 24, 'maryland': 120, 'indiana': 84,
  'notre dame': 87, 'wake forest': 154, 'georgia tech': 59,
  'tennessee': 2633, 'arkansas': 8, 'alabama': 333, 'iowa': 2294,
  'purdue': 2509, 'illinois': 356, 'wisconsin': 275, 'minnesota': 135,
  'penn state': 213, 'northwestern': 77, 'nebraska': 158, 'rutgers': 164,
  'oklahoma': 201, 'oklahoma state': 197, 'west virginia': 277,
  'baylor': 239, 'texas tech': 2641, 'iowa state': 66, 'kansas state': 2306,
  'texas a&m': 245, 'tcu': 2628, 'cincinnati': 2132, 'houston': 248,
  'south carolina': 2579, 'georgia': 61, 'auburn': 2, 'vanderbilt': 238,
  'virginia': 258, 'virginia tech': 259, 'pittsburgh': 221, 'boston college': 103,
  'miami': 2390, 'nc state': 152, 'north carolina state': 152, 'clemson': 228,
  'california': 25, 'cal': 25, 'washington': 264, 'washington state': 265,
  'arizona state': 9, 'utah': 254, 'colorado': 38, 'oregon state': 204,
  'usc': 30, 'southern california': 30, 'gonzaga': 2250, 'creighton': 156,
  'xavier': 2752, 'butler': 2110, 'marquette': 269, 'seton hall': 2550,
  "st. john's": 2599, 'st johns': 2599, 'providence': 2507, 'depaul': 305,
  'mississippi': 145, 'ole miss': 145, 'mississippi state': 344,
  'san diego state': 21, 'unlv': 2439, 'nevada las vegas': 2439,
  'byu': 252, 'brigham young': 252, 'fresno state': 278, 'utah state': 328,
  'new mexico': 167, 'wyoming': 2751, 'colorado state': 36, 'nevada': 2440,
  "saint mary's": 2608, "st. mary's": 2608, 'dayton': 304,
  'wichita state': 2724, 'temple': 218, 'richmond': 257, 'vcu': 2670,
  'george mason': 2244, 'ohio': 195, 'akron': 2006, 'kent state': 2309,
  'ball state': 2050, 'western kentucky': 98, 'middle tennessee': 2393,
  'marshall': 276, 'southern miss': 2572, 'florida atlantic': 2226,
  'north texas': 249, 'rice': 242, 'utep': 2638, 'south florida': 58,
  'tulane': 2655, 'tulsa': 202, 'smu': 2567, 'east carolina': 151,
  'army': 349, 'navy': 2426, 'air force': 2005, 'iona': 314,
  'loyola chicago': 2350, 'siena': 73, 'manhattan': 2363,
}

function normalizeCollege(name) {
  return (name || '')
    .toLowerCase()
    .replace(/^university of\s+/i, '')
    .replace(/\s+university$/i, '')
    .replace(/\s+college$/i, '')
    .replace(/\s+state university$/i, ' state')
    .trim()
}

function CollegeLogo({ college }) {
  const [failed, setFailed] = useState(false)
  const initials = (college || '').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 3)
  const espnId = COLLEGE_ESPN_IDS[normalizeCollege(college)]

  if (failed || !college || !espnId) {
    return (
      <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
        {initials}
      </div>
    )
  }
  return (
    <img
      src={`https://a.espncdn.com/i/teamlogos/ncaa/500/${espnId}.png`}
      alt={college}
      className="w-8 h-8 rounded-full object-contain bg-white/5 p-0.5"
      onError={() => setFailed(true)}
    />
  )
}

function TeamLogo({ teamId }) {
  const [failed, setFailed] = useState(false)
  if (failed || !teamId) return null
  return (
    <img
      src={`https://cdn.nba.com/logos/nba/${teamId}/primary/L/logo.svg`}
      alt="Team logo"
      className="w-10 h-10 object-contain"
      onError={() => setFailed(true)}
    />
  )
}

function DraftBadge({ year, round, number, onClick }) {
  if (!year || year === 'Undrafted') {
    return (
      <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 text-sm cursor-default">
        <span className="text-lg">🎲</span>
        <span>Undrafted</span>
      </button>
    )
  }
  return (
    <button
      onClick={onClick}
      className="group relative flex items-stretch rounded-xl overflow-hidden border border-purple-500/30 hover:border-purple-400/60 transition-all hover:scale-[1.02] bg-gradient-to-r from-slate-900 to-slate-800"
    >
      {/* Year block */}
      <div className="px-4 py-3 bg-purple-600/20 flex flex-col items-center justify-center border-r border-purple-500/20 min-w-[64px]">
        <span className="text-xs font-semibold text-purple-400 uppercase tracking-widest">Draft</span>
        <span className="text-2xl font-black text-white leading-tight">{year}</span>
      </div>
      {/* Details block */}
      <div className="px-4 py-3 flex flex-col justify-center gap-0.5">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 uppercase tracking-wider">Round</span>
          <span className="text-sm font-bold text-white">{round}</span>
          <span className="text-slate-600">·</span>
          <span className="text-xs text-slate-500 uppercase tracking-wider">Pick</span>
          <span className="text-xl font-black text-purple-300">#{number}</span>
        </div>
        <span className="text-xs text-slate-500 group-hover:text-purple-400 transition-colors">View draft class →</span>
      </div>
    </button>
  )
}

function PlayerDrawer({ title, players, onClose, activeStat }) {
  if (!players) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6 max-h-[75vh] flex flex-col z-10 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-700 transition-colors text-xl">×</button>
        </div>
        {players.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">No players found.</p>
        ) : (
          <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
            <AnimatedList
              items={players}
              showGradients
              enableArrowNavigation
              displayScrollbar
              onItemSelect={(player) => { window.location.href = `/players/${player.PERSON_ID}`; }}
              renderItem={(player, idx, isSelected) => (
                <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors ${isSelected ? 'bg-slate-800' : ''}`}>
                  <img
                    src={`https://cdn.nba.com/headshots/nba/latest/260x190/${player.PERSON_ID}.png`}
                    className="w-9 h-9 rounded-full object-cover object-top bg-slate-800 shrink-0"
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                    alt=""
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{player.PLAYER_FIRST_NAME} {player.PLAYER_LAST_NAME}</p>
                    <p className="text-slate-500 text-xs">{player.TEAM_ABBREVIATION || 'Free Agent'} · {player.POSITION || '—'}</p>
                  </div>
                  {player.DRAFT_NUMBER && <span className="text-xs text-purple-400 font-bold shrink-0">#{player.DRAFT_NUMBER}</span>}
                </div>
              )}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default function PlayerDetail() {
  const { id } = useParams()
  const [drawerType, setDrawerType] = useState(null) // 'college' | 'draft'

  const { data: infoData, isLoading: infoLoading } = useQuery({
    queryKey: ['player', id, 'info'],
    queryFn: () => getPlayerInfo(Number(id)).then((r) => r.data),
  })
  const { data: careerData, isLoading: careerLoading } = useQuery({
    queryKey: ['player', id, 'career'],
    queryFn: () => getPlayerCareer(Number(id)).then((r) => r.data),
  })
  const { data: gamelogData } = useQuery({
    queryKey: ['player', id, 'gamelog'],
    queryFn: () => getPlayerGameLog(Number(id)).then((r) => r.data),
  })

  const info = infoData?.CommonPlayerInfo?.[0]
  const college = info?.SCHOOL
  const draftYear = info?.DRAFT_YEAR && info.DRAFT_YEAR !== 'Undrafted' ? Number(info.DRAFT_YEAR) : null

  const { data: collegePlayers } = useQuery({
    queryKey: ['college', college],
    queryFn: () => getPlayersByCollege(college).then((r) => r.data),
    enabled: drawerType === 'college' && !!college,
  })
  const { data: draftPlayers } = useQuery({
    queryKey: ['draft', draftYear],
    queryFn: () => getPlayersByDraftYear(draftYear).then((r) => r.data),
    enabled: drawerType === 'draft' && !!draftYear,
  })

  if (infoLoading) return <LoadingSpinner text="Loading player..." />

  const seasons = careerData?.SeasonTotalsRegularSeason ?? []
  const games = gamelogData?.PlayerGameLog ?? []
  const cur = seasons[0]
  const gp = cur?.GP || 0
  const ppg = gp ? (cur.PTS / gp).toFixed(1) : null
  const rpg = gp ? (cur.REB / gp).toFixed(1) : null
  const apg = gp ? (cur.AST / gp).toFixed(1) : null
  const spg = gp ? (cur.STL / gp).toFixed(1) : null
  const bpg = gp ? (cur.BLK / gp).toFixed(1) : null
  const fgPct = cur?.FG_PCT ? (cur.FG_PCT * 100).toFixed(1) + '%' : null
  const fg3Pct = cur?.FG3_PCT ? (cur.FG3_PCT * 100).toFixed(1) + '%' : null
  const ftPct = cur?.FT_PCT ? (cur.FT_PCT * 100).toFixed(1) + '%' : null

  const photoUrl = `https://cdn.nba.com/headshots/nba/latest/1040x760/${id}.png`

  const drawerPlayers = drawerType === 'college' ? collegePlayers : draftPlayers
  const drawerTitle = drawerType === 'college'
    ? `${college} Alumni`
    : `${info?.DRAFT_YEAR} Draft Class`

  return (
    <div className="space-y-6">
      {/* Hero */}
      {info && (
        <div className="relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-700/60 min-h-[440px]">
          {/* Full-body photo */}
          <img
            src={photoUrl}
            alt={info.DISPLAY_FIRST_LAST}
            className="absolute right-0 top-0 h-full w-[55%] object-cover object-top select-none"
            style={{ maskImage: 'linear-gradient(to left, black 30%, transparent 100%)' }}
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
          {/* Gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/95 to-transparent pointer-events-none" />

          {/* Content */}
          <div className="relative z-10 p-8 max-w-[54%] flex flex-col gap-5">
            {/* Team logo + abbreviation */}
            <div className="flex items-center gap-2">
              <TeamLogo teamId={info.TEAM_ID} />
              <span className="text-slate-400 text-sm font-semibold">{info.TEAM_CITY} {info.TEAM_NAME}</span>
              <span className="text-slate-600 text-xs">#{info.JERSEY}</span>
            </div>

            {/* Name + nickname */}
            <div>
              <h1 className="text-4xl font-extrabold text-white tracking-tight leading-none">{info.DISPLAY_FIRST_LAST}</h1>
              {/* Discrete bio line */}
              <p className="text-slate-500 text-xs mt-2 flex items-center gap-2">
                <span>{info.POSITION}</span>
                {info.HEIGHT && <><span className="text-slate-700">·</span><span>{info.HEIGHT}</span></>}
                {info.WEIGHT && <><span className="text-slate-700">·</span><span>{info.WEIGHT} lbs</span></>}
              </p>
            </div>

            {/* College button */}
            {college && (
              <button
                onClick={() => setDrawerType('college')}
                className="group flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 hover:border-green-500/40 hover:bg-slate-800 transition-all w-fit"
              >
                <CollegeLogo college={college} />
                <p className="text-sm font-semibold text-white group-hover:text-green-400 transition-colors">{college}</p>
                <span className="text-slate-600 text-xs ml-1 group-hover:text-green-400 transition-colors">→</span>
              </button>
            )}

            {/* Draft badge */}
            <DraftBadge
              year={info.DRAFT_YEAR}
              round={info.DRAFT_ROUND}
              number={info.DRAFT_NUMBER}
              onClick={() => setDrawerType('draft')}
            />
          </div>
        </div>
      )}

      {/* Stat cards via MagicBento */}
      {cur && (
        <MagicBento
          textAutoHide={false}
          enableStars={false}
          enableSpotlight
          enableBorderGlow
          clickEffect
          spotlightRadius={400}
          glowColor="132, 0, 255"
          gridClassName="grid grid-cols-3 sm:grid-cols-6 gap-3"
          disableAnimations={false}
        >
          {[
            { label: 'PPG', value: ppg, sub: 'Points' },
            { label: 'RPG', value: rpg, sub: 'Rebounds' },
            { label: 'APG', value: apg, sub: 'Assists' },
            { label: 'SPG', value: spg, sub: 'Steals' },
            { label: 'BPG', value: bpg, sub: 'Blocks' },
            { label: 'GP', value: gp, sub: 'Games' },
          ].map(({ label, value, sub }) => (
            <div key={label} className="bg-slate-800 rounded-xl p-4 flex flex-col gap-1">
              <span className="text-xs text-slate-400 uppercase tracking-wider">{label}</span>
              <span className="text-2xl font-bold text-white">{value ?? '—'}</span>
              <span className="text-xs text-slate-500">{sub}</span>
            </div>
          ))}
        </MagicBento>
      )}

      {/* Shooting */}
      {cur && (
        <MagicBento
          textAutoHide={false}
          enableStars={false}
          enableSpotlight
          enableBorderGlow
          clickEffect
          spotlightRadius={400}
          glowColor="132, 0, 255"
          gridClassName="grid grid-cols-3 gap-3"
          disableAnimations={false}
        >
          {[
            { label: 'FG%', value: fgPct },
            { label: '3P%', value: fg3Pct },
            { label: 'FT%', value: ftPct },
          ].map(({ label, value }) => (
            <div key={label} className="bg-slate-800 rounded-xl p-4 flex flex-col gap-1">
              <span className="text-xs text-slate-400 uppercase tracking-wider">{label}</span>
              <span className="text-2xl font-bold text-white">{value ?? '—'}</span>
            </div>
          ))}
        </MagicBento>
      )}

      {/* Season totals */}
      <div className="bg-slate-800 rounded-xl p-6 space-y-3">
        <h2 className="text-lg font-semibold text-white">2024-25 Season Totals</h2>
        {careerLoading ? <LoadingSpinner /> : <StatsTable columns={SEASON_COLS} rows={seasons} keyField="SEASON_ID" />}
      </div>

      {/* Game log */}
      {games.length > 0 && (
        <div className="bg-slate-800 rounded-xl p-6 space-y-3">
          <h2 className="text-lg font-semibold text-white">2024-25 Game Log</h2>
          <StatsTable columns={GAMELOG_COLS} rows={games.slice(0, 30)} keyField="Game_ID" />
        </div>
      )}

      {/* Drawer */}
      {drawerType && (
        <PlayerDrawer
          title={drawerTitle}
          players={drawerPlayers}
          onClose={() => setDrawerType(null)}
        />
      )}
    </div>
  )
}
