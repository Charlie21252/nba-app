import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getLeaders } from '../api/nba'
import LoadingSpinner from '../components/LoadingSpinner'
import StatsTable from '../components/StatsTable'

const STAT_OPTIONS = ['PTS', 'REB', 'AST', 'STL', 'BLK']

export default function Dashboard() {
  const [stat, setStat] = useState('PTS')

  const { data, isLoading, error } = useQuery({
    queryKey: ['leaders', stat],
    queryFn: () => getLeaders(stat, '2024-25', 15).then((r) => r.data),
  })

  const columns = [
    { key: 'RANK', label: '#' },
    {
      key: 'PLAYER',
      label: 'Player',
      render: (row) => (
        <Link to={`/players/${row.PLAYER_ID}`} className="text-orange-400 hover:underline font-medium">
          {row.PLAYER}
        </Link>
      ),
    },
    { key: 'TEAM', label: 'Team' },
    { key: 'GP', label: 'GP' },
    { key: stat, label: stat },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">NBA Analytics</h1>
        <p className="text-slate-400 mt-1">2024-25 Season</p>
      </div>

      <div className="bg-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-lg font-semibold text-white">League Leaders</h2>
          <div className="flex gap-2">
            {STAT_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setStat(s)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  stat === s
                    ? 'bg-orange-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {isLoading && <LoadingSpinner text="Fetching leaders..." />}
        {error && <p className="text-red-400 text-sm">Failed to load leaders.</p>}
        {data && <StatsTable columns={columns} rows={data} keyField="PLAYER_ID" />}
      </div>
    </div>
  )
}
