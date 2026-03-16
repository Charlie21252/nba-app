import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getTeams } from '../api/nba'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Teams() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['teams'],
    queryFn: () => getTeams().then((r) => r.data),
  })

  if (isLoading) return <LoadingSpinner text="Loading teams..." />
  if (error) return <p className="text-red-400">Failed to load teams.</p>

  const conferences = {}
  data?.forEach((team) => {
    const conf = team.conference || 'Other'
    if (!conferences[conf]) conferences[conf] = []
    conferences[conf].push(team)
  })

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-white">Teams</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {data?.map((team) => (
          <Link
            key={team.id}
            to={`/teams/${team.id}`}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl p-4 transition-colors"
          >
            <p className="font-bold text-white">{team.full_name}</p>
            <p className="text-xs text-slate-400 mt-1">{team.abbreviation} &bull; {team.city}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
