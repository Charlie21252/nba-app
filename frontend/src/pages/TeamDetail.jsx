import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getTeamRoster, getTeamHistory, getTeamGames } from '../api/nba'
import LoadingSpinner from '../components/LoadingSpinner'
import StatsTable from '../components/StatsTable'

const ROSTER_COLS = [
  {
    key: 'PLAYER',
    label: 'Player',
    render: (r) => (
      <Link to={`/players/${r.PLAYER_ID}`} className="text-orange-400 hover:underline">
        {r.PLAYER}
      </Link>
    ),
  },
  { key: 'NUM', label: '#' },
  { key: 'POSITION', label: 'Pos' },
  { key: 'HEIGHT', label: 'Height' },
  { key: 'WEIGHT', label: 'Weight' },
  { key: 'SCHOOL', label: 'School' },
]

const HISTORY_COLS = [
  { key: 'YEAR', label: 'Season' },
  { key: 'GP', label: 'GP' },
  { key: 'WINS', label: 'W' },
  { key: 'LOSSES', label: 'L' },
  { key: 'WIN_PCT', label: 'WIN%', render: (r) => r.WIN_PCT ? (r.WIN_PCT * 100).toFixed(1) + '%' : '—' },
  { key: 'PTS', label: 'PTS' },
]

const GAMES_COLS = [
  { key: 'GAME_DATE', label: 'Date' },
  { key: 'MATCHUP', label: 'Matchup' },
  { key: 'WL', label: 'W/L' },
  { key: 'PTS', label: 'PTS' },
  { key: 'REB', label: 'REB' },
  { key: 'AST', label: 'AST' },
]

export default function TeamDetail() {
  const { id } = useParams()

  const { data: rosterData, isLoading: rosterLoading } = useQuery({
    queryKey: ['team', id, 'roster'],
    queryFn: () => getTeamRoster(Number(id)).then((r) => r.data),
  })

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['team', id, 'history'],
    queryFn: () => getTeamHistory(Number(id)).then((r) => r.data),
  })

  const { data: gamesData, isLoading: gamesLoading } = useQuery({
    queryKey: ['team', id, 'games'],
    queryFn: () => getTeamGames(Number(id)).then((r) => r.data),
  })

  const teamInfo = rosterData?.TeamInfoCommon?.[0]
  const roster = rosterData?.CommonTeamRoster ?? []
  const history = historyData?.TeamYearByYearStats ?? []
  const games = gamesData ?? []

  return (
    <div className="space-y-8">
      {rosterLoading ? (
        <LoadingSpinner text="Loading team..." />
      ) : (
        <div className="bg-slate-800 rounded-xl p-6">
          <h1 className="text-3xl font-bold text-white">
            {teamInfo?.TEAM_CITY} {teamInfo?.TEAM_NAME}
          </h1>
          <p className="text-slate-400 mt-1">
            {teamInfo?.TEAM_CONFERENCE} &bull; {teamInfo?.TEAM_DIVISION}
          </p>
        </div>
      )}

      <div className="bg-slate-800 rounded-xl p-6 space-y-3">
        <h2 className="text-lg font-semibold text-white">2024-25 Roster</h2>
        {rosterLoading ? <LoadingSpinner /> : (
          <StatsTable columns={ROSTER_COLS} rows={roster} keyField="PLAYER_ID" />
        )}
      </div>

      <div className="bg-slate-800 rounded-xl p-6 space-y-3">
        <h2 className="text-lg font-semibold text-white">Recent Games</h2>
        {gamesLoading ? <LoadingSpinner /> : (
          <StatsTable columns={GAMES_COLS} rows={games} keyField="GAME_ID" />
        )}
      </div>

      <div className="bg-slate-800 rounded-xl p-6 space-y-3">
        <h2 className="text-lg font-semibold text-white">Year-by-Year History</h2>
        {historyLoading ? <LoadingSpinner /> : (
          <StatsTable columns={HISTORY_COLS} rows={[...history].reverse().slice(0, 15)} keyField="YEAR" />
        )}
      </div>
    </div>
  )
}
