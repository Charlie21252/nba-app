import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { searchPlayers } from '../api/nba'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Players() {
  const [query, setQuery] = useState('')
  const [submitted, setSubmitted] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['players', 'search', submitted],
    queryFn: () => searchPlayers(submitted).then((r) => r.data),
    enabled: submitted.length >= 2,
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitted(query.trim())
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Player Search</h1>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by player name..."
          className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-orange-400"
        />
        <button
          type="submit"
          className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg font-medium transition-colors"
        >
          Search
        </button>
      </form>

      {isLoading && <LoadingSpinner text="Searching players..." />}
      {error && <p className="text-red-400 text-sm">Search failed.</p>}

      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {data.length === 0 && (
            <p className="text-slate-400 col-span-full">No players found for "{submitted}".</p>
          )}
          {data.map((player) => (
            <Link
              key={player.id}
              to={`/players/${player.id}`}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl p-4 transition-colors"
            >
              <p className="font-semibold text-white">{player.full_name}</p>
              <p className="text-xs text-slate-400 mt-1">
                {player.is_active ? (
                  <span className="text-green-400">Active</span>
                ) : (
                  <span className="text-slate-500">Inactive</span>
                )}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
