import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getScoreboard } from '../api/nba'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Scoreboard() {
  const [date, setDate] = useState('')

  const formattedDate = date
    ? new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
        month: '2-digit', day: '2-digit', year: 'numeric',
      })
    : null

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['scoreboard', formattedDate],
    queryFn: () => getScoreboard(formattedDate).then((r) => r.data),
  })

  const games = data?.GameHeader ?? []
  const lineScores = data?.LineScore ?? []

  const getLineScore = (gameId, teamId) =>
    lineScores.find((l) => l.GAME_ID === gameId && l.TEAM_ID === teamId)

  return (
    <div className="space-y-6">
      <div className="flex items-end gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-white">Scoreboard</h1>
          <p className="text-slate-400 text-sm mt-1">Leave date blank for today's games</p>
        </div>
        <div className="flex gap-3 items-center">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-400"
          />
          <button
            onClick={() => refetch()}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Load
          </button>
        </div>
      </div>

      {isLoading && <LoadingSpinner text="Loading games..." />}
      {error && <p className="text-red-400 text-sm">Failed to load scoreboard.</p>}

      {games.length === 0 && !isLoading && (
        <p className="text-slate-400">No games found for this date.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {games.map((game) => {
          const visitor = getLineScore(game.GAME_ID, game.VISITOR_TEAM_ID)
          const home = getLineScore(game.GAME_ID, game.HOME_TEAM_ID)
          return (
            <div key={game.GAME_ID} className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <p className="text-xs text-slate-400 mb-3">{game.GAME_STATUS_TEXT}</p>
              <div className="space-y-2">
                {[visitor, home].map((ls) => ls && (
                  <div key={ls.TEAM_ID} className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white">{ls.TEAM_ABBREVIATION}</span>
                      <span className="text-slate-400 text-sm ml-2">{ls.TEAM_CITY_NAME}</span>
                    </div>
                    <span className="text-2xl font-bold text-white">{ls.PTS ?? '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
