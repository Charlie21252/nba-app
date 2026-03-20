import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getLeaders, getHealth } from '../api/nba'
import LoadingSpinner from '../components/LoadingSpinner'

const STAT_OPTIONS = [
  { key: 'PTS', label: 'Points',   color: '#f97316' },
  { key: 'REB', label: 'Rebounds', color: '#38bdf8' },
  { key: 'AST', label: 'Assists',  color: '#4ade80' },
  { key: 'STL', label: 'Steals',   color: '#a78bfa' },
  { key: 'BLK', label: 'Blocks',   color: '#fb7185' },
]

const MEDALS = ['🥇', '🥈', '🥉']

export default function Dashboard() {
  const [stat, setStat] = useState('PTS')
  const navigate = useNavigate()
  const activeStat = STAT_OPTIONS.find((s) => s.key === stat)

  // Step 1 — ping /api/health until Render wakes up from cold start.
  // Each attempt has a 9s axios timeout; retry every 5s up to 12 times (~60s window).
  // This runs as a background wake-up: once it succeeds the leaders query fires.
  const { isSuccess: serverUp } = useQuery({
    queryKey: ['health'],
    queryFn: () => getHealth().then((r) => r.data),
    retry: 12,
    retryDelay: 5000,
    staleTime: 60 * 1000,
  })

  // Step 2 — only fetch leaders once the server has responded to health check.
  const { data, isLoading: leadersLoading, error } = useQuery({
    queryKey: ['leaders', stat],
    queryFn: () => getLeaders(stat, '2024-25', 5).then((r) => r.data),
    enabled: serverUp,
    retry: 2,
    retryDelay: 3000,
  })

  const warming = !serverUp

  return (
    <div className="space-y-6 max-w-xl">

      {/* Header */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: activeStat.color }}>
          2024–25 NBA Season
        </p>
        <h1 className="text-4xl font-black text-white">
          League <span style={{ color: activeStat.color }}>Leaders</span>
        </h1>
      </div>

      {/* Stat tabs */}
      <div className="flex flex-wrap gap-2">
        {STAT_OPTIONS.map((s) => (
          <button
            key={s.key}
            onClick={() => setStat(s.key)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              stat === s.key
                ? 'text-slate-900 scale-105'
                : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700'
            }`}
            style={stat === s.key ? { backgroundColor: s.color } : {}}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* States */}
      {warming && <LoadingSpinner text="Warming up server…" />}
      {serverUp && leadersLoading && <LoadingSpinner text={`Loading ${activeStat.label} leaders…`} />}
      {error && <p className="text-red-400 text-sm">Failed to load leaders.</p>}

      {data && (
        <div className="rounded-2xl border border-slate-700/50 overflow-hidden bg-slate-900/60">
          {data.map((player, i) => (
            <div
              key={player.PLAYER_ID}
              onClick={() => navigate(`/players/${player.PLAYER_ID}`)}
              className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-slate-800/60 transition-colors border-b border-slate-800 last:border-b-0"
            >
              <img
                src={`https://cdn.nba.com/headshots/nba/latest/260x190/${player.PLAYER_ID}.png`}
                alt={player.PLAYER}
                className="w-12 h-12 rounded-full object-cover object-top bg-slate-800 shrink-0 ring-1 ring-slate-700"
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-white truncate">{player.PLAYER}</span>
                  {MEDALS[i] && <span className="text-lg leading-none">{MEDALS[i]}</span>}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{player.TEAM} · {player.GP} GP</p>
              </div>
              <span className="text-2xl font-black tabular-nums shrink-0" style={{ color: activeStat.color }}>
                {player[stat]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
