import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { searchPlayers, getPlayerCareer, getPlayerGameLog, getPlayerInfo } from '../api/nba'
import LoadingSpinner from '../components/LoadingSpinner'
import StatCard from '../components/StatCard'
import StatsTable from '../components/StatsTable'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell, ReferenceLine,
} from 'recharts'

const CURRENT_SEASON = '2024-25'

const GAMELOG_COLS = [
  { key: 'GAME_DATE', label: 'Date' },
  { key: 'MATCHUP', label: 'Matchup' },
  {
    key: 'WL', label: 'W/L',
    render: (r) => (
      <span className={r.WL === 'W' ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>
        {r.WL}
      </span>
    ),
  },
  { key: 'MIN', label: 'MIN' },
  { key: 'PTS', label: 'PTS' },
  { key: 'REB', label: 'REB' },
  { key: 'AST', label: 'AST' },
  { key: 'STL', label: 'STL' },
  { key: 'BLK', label: 'BLK' },
  { key: 'TOV', label: 'TOV' },
  {
    key: 'FG_PCT', label: 'FG%',
    render: (r) => r.FG_PCT != null ? (r.FG_PCT * 100).toFixed(1) + '%' : '—',
  },
  {
    key: 'FG3_PCT', label: '3P%',
    render: (r) => r.FG3_PCT != null ? (r.FG3_PCT * 100).toFixed(1) + '%' : '—',
  },
  { key: 'PLUS_MINUS', label: '+/-' },
]

function avg(val, gp) {
  if (!val || !gp) return null
  return (val / gp).toFixed(1)
}

function pct(val) {
  if (val == null) return null
  return (val * 100).toFixed(1) + '%'
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 text-xs space-y-1 shadow-lg">
      <p className="text-slate-400 mb-1">Game {label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.dataKey}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  )
}

function ShootingBar({ label, made, attempted, color }) {
  const pctVal = attempted > 0 ? ((made / attempted) * 100).toFixed(1) : 0
  const width = Math.min(Number(pctVal), 100)
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-slate-300">
        <span>{label}</span>
        <span className="font-semibold">{pctVal}% ({made}/{attempted})</span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${width}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

export default function PlayerStats() {
  const [query, setQuery] = useState('')
  const [submitted, setSubmitted] = useState('')
  const [selectedPlayer, setSelectedPlayer] = useState(null)

  const { data: searchResults, isLoading: searching } = useQuery({
    queryKey: ['stats-search', submitted],
    queryFn: () => searchPlayers(submitted).then((r) => r.data),
    enabled: submitted.length >= 2,
  })

  const { data: infoData, isLoading: infoLoading } = useQuery({
    queryKey: ['player', selectedPlayer?.id, 'info'],
    queryFn: () => getPlayerInfo(selectedPlayer.id).then((r) => r.data),
    enabled: !!selectedPlayer,
  })

  const { data: careerData, isLoading: careerLoading } = useQuery({
    queryKey: ['player', selectedPlayer?.id, 'career'],
    queryFn: () => getPlayerCareer(selectedPlayer.id).then((r) => r.data),
    enabled: !!selectedPlayer,
  })

  const { data: gamelogData, isLoading: gamelogLoading } = useQuery({
    queryKey: ['player', selectedPlayer?.id, 'gamelog', CURRENT_SEASON],
    queryFn: () => getPlayerGameLog(selectedPlayer.id, CURRENT_SEASON).then((r) => r.data),
    enabled: !!selectedPlayer,
  })

  const handleSearch = (e) => {
    e.preventDefault()
    setSubmitted(query.trim())
  }

  const handleSelect = (player) => {
    setSelectedPlayer(player)
    setQuery(player.full_name)
    setSubmitted('')
  }

  // Derive current season stats
  const seasons = careerData?.SeasonTotalsRegularSeason ?? []
  const currentSeason = [...seasons].reverse().find((s) => s.SEASON_ID === CURRENT_SEASON)
  const gp = currentSeason?.GP || 0

  // Per-game averages
  const ppg = avg(currentSeason?.PTS, gp)
  const rpg = avg(currentSeason?.REB, gp)
  const apg = avg(currentSeason?.AST, gp)
  const spg = avg(currentSeason?.STL, gp)
  const bpg = avg(currentSeason?.BLK, gp)
  const topg = avg(currentSeason?.TOV, gp)
  const fgPct = pct(currentSeason?.FG_PCT)
  const fg3Pct = pct(currentSeason?.FG3_PCT)
  const ftPct = pct(currentSeason?.FT_PCT)
  const minPg = avg(currentSeason?.MIN, gp)

  // Game log & chart data
  const games = gamelogData?.PlayerGameLog ?? []
  const chartGames = [...games].slice(0, 20).reverse()

  const ptsTrend = chartGames.map((g, i) => ({ game: i + 1, PTS: g.PTS, REB: g.REB, AST: g.AST }))

  // Avg lines for chart
  const avgPts = ptsTrend.length ? (ptsTrend.reduce((s, g) => s + g.PTS, 0) / ptsTrend.length).toFixed(1) : null

  // Season shooting totals (from career row)
  const totalFGM = currentSeason?.FGM ?? 0
  const totalFGA = currentSeason?.FGA ?? 0
  const totalFG3M = currentSeason?.FG3M ?? 0
  const totalFG3A = currentSeason?.FG3A ?? 0
  const totalFTM = currentSeason?.FTM ?? 0
  const totalFTA = currentSeason?.FTA ?? 0

  const info = infoData?.CommonPlayerInfo?.[0]
  const isLoadingStats = infoLoading || careerLoading || gamelogLoading
  const showResults = submitted.length >= 2 && !selectedPlayer

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Player Stats Dashboard</h1>
      </div>

      {/* Search */}
      <div className="relative">
        <form onSubmit={handleSearch} className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); if (selectedPlayer) setSelectedPlayer(null) }}
            placeholder="Search player name..."
            className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:border-orange-400"
          />
          <button
            type="submit"
            className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
          >
            Search
          </button>
        </form>

        {/* Dropdown results */}
        {showResults && (
          <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-600 rounded-xl shadow-xl overflow-hidden max-h-64 overflow-y-auto">
            {searching && <div className="px-4 py-3 text-slate-400 text-sm">Searching...</div>}
            {searchResults?.length === 0 && (
              <div className="px-4 py-3 text-slate-400 text-sm">No players found.</div>
            )}
            {searchResults?.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSelect(p)}
                className="w-full text-left px-4 py-3 hover:bg-slate-700 transition-colors border-b border-slate-700 last:border-0"
              >
                <span className="text-white font-medium">{p.full_name}</span>
                {p.is_active && <span className="ml-2 text-xs text-green-400">Active</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Loading state */}
      {selectedPlayer && isLoadingStats && (
        <LoadingSpinner text={`Loading stats for ${selectedPlayer.full_name}...`} />
      )}

      {/* Stats content */}
      {selectedPlayer && !isLoadingStats && (
        <div className="space-y-6">

          {/* Player header */}
          {info && (
            <div className="bg-slate-800 rounded-xl p-6 flex items-start justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-white">{info.DISPLAY_FIRST_LAST}</h2>
                  <Link
                    to={`/players/${selectedPlayer.id}`}
                    className="text-xs text-orange-400 border border-orange-400 px-2 py-0.5 rounded hover:bg-orange-400 hover:text-white transition-colors"
                  >
                    Full Profile →
                  </Link>
                </div>
                <p className="text-slate-400 mt-1">
                  {info.TEAM_NAME} &bull; #{info.JERSEY} &bull; {info.POSITION}
                  &bull; {info.HEIGHT} &bull; {info.WEIGHT ? `${info.WEIGHT} lbs` : ''}
                </p>
              </div>
              {gp > 0 && (
                <div className="text-right">
                  <p className="text-slate-400 text-xs uppercase tracking-wider">Games Played</p>
                  <p className="text-3xl font-bold text-orange-400">{gp}</p>
                  <p className="text-slate-500 text-xs">{CURRENT_SEASON}</p>
                </div>
              )}
            </div>
          )}

          {/* No current season data */}
          {!currentSeason && (
            <div className="bg-slate-800 rounded-xl p-6 text-center text-slate-400">
              No {CURRENT_SEASON} season data available for this player.
            </div>
          )}

          {currentSeason && (
            <>
              {/* Per-game averages */}
              <div>
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Per Game Averages
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  <StatCard label="PPG" value={ppg} sub="Points" />
                  <StatCard label="RPG" value={rpg} sub="Rebounds" />
                  <StatCard label="APG" value={apg} sub="Assists" />
                  <StatCard label="SPG" value={spg} sub="Steals" />
                  <StatCard label="BPG" value={bpg} sub="Blocks" />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Efficiency
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  <StatCard label="FG%" value={fgPct} />
                  <StatCard label="3P%" value={fg3Pct} />
                  <StatCard label="FT%" value={ftPct} />
                  <StatCard label="TOV/G" value={topg} sub="Turnovers" />
                  <StatCard label="MIN/G" value={minPg} sub="Minutes" />
                </div>
              </div>

              {/* Shooting splits bar */}
              <div className="bg-slate-800 rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-semibold text-white">Shooting Splits</h3>
                <div className="space-y-4 max-w-lg">
                  <ShootingBar label="Field Goals" made={totalFGM} attempted={totalFGA} color="#f97316" />
                  <ShootingBar label="3-Pointers" made={totalFG3M} attempted={totalFG3A} color="#38bdf8" />
                  <ShootingBar label="Free Throws" made={totalFTM} attempted={totalFTA} color="#4ade80" />
                </div>
                <p className="text-xs text-slate-500">Season totals: {gp} games played</p>
              </div>
            </>
          )}

          {/* Performance chart */}
          {ptsTrend.length > 0 && (
            <div className="bg-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Last {ptsTrend.length} Games</h3>
                {avgPts && (
                  <span className="text-xs text-slate-400">Avg PTS: <span className="text-orange-400 font-semibold">{avgPts}</span></span>
                )}
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={ptsTrend} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="game" stroke="#94a3b8" tick={{ fontSize: 11 }} label={{ value: 'Game', position: 'insideBottom', offset: -2, fill: '#64748b', fontSize: 11 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  {avgPts && (
                    <ReferenceLine y={Number(avgPts)} stroke="#f97316" strokeDasharray="4 4" strokeOpacity={0.6} />
                  )}
                  <Line type="monotone" dataKey="PTS" stroke="#f97316" dot={{ r: 3, fill: '#f97316' }} strokeWidth={2} />
                  <Line type="monotone" dataKey="REB" stroke="#38bdf8" dot={{ r: 3, fill: '#38bdf8' }} strokeWidth={2} />
                  <Line type="monotone" dataKey="AST" stroke="#4ade80" dot={{ r: 3, fill: '#4ade80' }} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex gap-5 mt-3 text-xs text-slate-400">
                <span><span className="text-orange-400 font-bold">—</span> PTS</span>
                <span><span className="text-sky-400 font-bold">—</span> REB</span>
                <span><span className="text-green-400 font-bold">—</span> AST</span>
                <span className="ml-auto text-slate-500 italic">Dashed line = season avg PTS</span>
              </div>
            </div>
          )}

          {/* Recent game log */}
          {games.length > 0 && (
            <div className="bg-slate-800 rounded-xl p-6 space-y-3">
              <h3 className="text-lg font-semibold text-white">Game Log <span className="text-sm font-normal text-slate-400">(last {Math.min(games.length, 15)} games)</span></h3>
              <StatsTable columns={GAMELOG_COLS} rows={games.slice(0, 15)} keyField="Game_ID" />
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!selectedPlayer && !submitted && (
        <div className="bg-slate-800 rounded-xl p-12 text-center text-slate-500">
          <p className="text-lg">Search for a player to view their stats dashboard.</p>
          <p className="text-sm mt-2">Type at least 2 characters to search.</p>
        </div>
      )}
    </div>
  )
}
