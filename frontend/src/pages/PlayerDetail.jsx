import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getPlayerInfo, getPlayerCareer, getPlayerGameLog } from '../api/nba'
import LoadingSpinner from '../components/LoadingSpinner'
import StatCard from '../components/StatCard'
import StatsTable from '../components/StatsTable'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

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
]

const GAMELOG_COLS = [
  { key: 'GAME_DATE', label: 'Date' },
  { key: 'MATCHUP', label: 'Matchup' },
  { key: 'WL', label: 'W/L' },
  { key: 'PTS', label: 'PTS' },
  { key: 'REB', label: 'REB' },
  { key: 'AST', label: 'AST' },
  { key: 'STL', label: 'STL' },
  { key: 'BLK', label: 'BLK' },
  { key: 'MIN', label: 'MIN' },
]

export default function PlayerDetail() {
  const { id } = useParams()

  const { data: infoData, isLoading: infoLoading } = useQuery({
    queryKey: ['player', id, 'info'],
    queryFn: () => getPlayerInfo(Number(id)).then((r) => r.data),
  })

  const { data: careerData, isLoading: careerLoading } = useQuery({
    queryKey: ['player', id, 'career'],
    queryFn: () => getPlayerCareer(Number(id)).then((r) => r.data),
  })

  const { data: gamelogData, isLoading: gamelogLoading } = useQuery({
    queryKey: ['player', id, 'gamelog'],
    queryFn: () => getPlayerGameLog(Number(id)).then((r) => r.data),
  })

  if (infoLoading) return <LoadingSpinner text="Loading player..." />

  const info = infoData?.CommonPlayerInfo?.[0]
  const seasons = careerData?.SeasonTotalsRegularSeason ?? []
  const games = gamelogData?.PlayerGameLog ?? []

  // Last 20 games for chart (reversed to chronological order)
  const chartData = [...games].slice(0, 20).reverse().map((g, i) => ({
    game: i + 1,
    PTS: g.PTS,
    REB: g.REB,
    AST: g.AST,
  }))

  return (
    <div className="space-y-8">
      {info && (
        <div className="bg-slate-800 rounded-xl p-6">
          <h1 className="text-3xl font-bold text-white">{info.DISPLAY_FIRST_LAST}</h1>
          <p className="text-slate-400 mt-1">
            {info.TEAM_NAME} &bull; #{info.JERSEY} &bull; {info.POSITION}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <StatCard label="Height" value={info.HEIGHT} />
            <StatCard label="Weight" value={info.WEIGHT ? `${info.WEIGHT} lbs` : null} />
            <StatCard label="From" value={info.SCHOOL || info.COUNTRY} />
            <StatCard label="Draft" value={
              info.DRAFT_YEAR !== 'Undrafted'
                ? `${info.DRAFT_YEAR} R${info.DRAFT_ROUND} #${info.DRAFT_NUMBER}`
                : 'Undrafted'
            } />
          </div>
        </div>
      )}

      {chartData.length > 0 && (
        <div className="bg-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Last 20 Games</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="game" stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #475569', color: '#f1f5f9' }}
              />
              <Line type="monotone" dataKey="PTS" stroke="#f97316" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="REB" stroke="#38bdf8" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="AST" stroke="#4ade80" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-3 text-xs text-slate-400">
            <span><span className="text-orange-400">—</span> PTS</span>
            <span><span className="text-sky-400">—</span> REB</span>
            <span><span className="text-green-400">—</span> AST</span>
          </div>
        </div>
      )}

      <div className="bg-slate-800 rounded-xl p-6 space-y-3">
        <h2 className="text-lg font-semibold text-white">Career Stats</h2>
        {careerLoading ? <LoadingSpinner /> : <StatsTable columns={SEASON_COLS} rows={seasons} keyField="SEASON_ID" />}
      </div>

      <div className="bg-slate-800 rounded-xl p-6 space-y-3">
        <h2 className="text-lg font-semibold text-white">2024-25 Game Log</h2>
        {gamelogLoading ? <LoadingSpinner /> : (
          <StatsTable columns={GAMELOG_COLS} rows={games.slice(0, 30)} keyField="Game_ID" />
        )}
      </div>
    </div>
  )
}
